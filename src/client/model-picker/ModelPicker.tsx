/**
 * Composer model picker: a plugin-owned shadow of the host
 * `conversation.input.model` seat.
 *
 * The host ui-model-selection component is a small in-place menu with every
 * provider expanded at once. This registration wins the single slot at a lower
 * priority and renders a centered floating dialog instead: one collapsible
 * section per provider (only the selected provider starts expanded), plus the
 * current model's reasoning-effort choices. Data and writes still ride the
 * host's shared per-session ModelDirectory, so the /model command and this
 * seat stay one fact source.
 * @module dsh-web-enhanced/src/client/model-picker/ModelPicker
 */

import {
  useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore,
} from 'react'
import {
  IconChevronDownOutline14, IconWarningOutline16, Modal, Toast,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { Translate } from '../locale-keys.ts'
import css from './ModelPicker.module.css'

/** Wire selection shape (structural; the host package owns the real type). */
interface PickerSelection {
  readonly provider: string
  readonly model: string
  readonly reasoningEffort?: string
}

/** One reasoning-effort level advertised for the current model. */
interface EffortInfo {
  readonly id: string
  readonly name: string
  readonly description?: string
}

/** One advisory model row inside a provider group. */
interface ModelInfo {
  readonly id: string
  readonly name: string
  readonly description?: string
  readonly reasoning?: {
    readonly defaultEffort?: string
    readonly efforts: readonly EffortInfo[]
  }
}

/** One provider group and its advisory models. */
interface ProviderGroup {
  readonly id: string
  readonly name: string
  readonly models: readonly ModelInfo[]
}

/** The shared per-session directory snapshot. */
interface DirectoryState {
  readonly current: PickerSelection | null
  readonly groups: readonly ProviderGroup[]
  readonly failures: readonly { readonly id: string; readonly name: string; readonly message: string }[]
  readonly status: 'idle' | 'loading' | 'ready' | 'selecting' | 'error'
  readonly error: string | null
}

/** The shared directory controller face the host service resolves. */
interface DirectoryFace {
  readonly store: {
    getSnapshot(): DirectoryState
    subscribe(listener: () => void): () => void
  }
  load(): Promise<unknown>
  select(selection: PickerSelection): Promise<unknown>
}

/** Injected face this slot registration builds per session. */
export interface ModelPickerInjected {
  readonly available: boolean
  readonly directory: DirectoryFace['store'] | null
  readonly load: () => void
  readonly select: (selection: PickerSelection) => Promise<boolean>
}

/** Component props: owner share (`locked`) + injected face + locale seat. */
export type ModelPickerProps = ModelPickerInjected & {
  readonly locked: boolean
  readonly t: Translate
}

/** Stable empty snapshot for deployments where the directory never mounts. */
const EMPTY_STATE: DirectoryState = {
  current: null, groups: [], failures: [], status: 'idle', error: null,
}

/**
 * The composer model seat replacement: compact trigger + centered dialog.
 * @param props - locked, shared directory store, load/select verbs, locale.
 */
export function ModelPicker({ locked, available, directory, load, select, t }: ModelPickerProps) {
  const state = useSyncExternalStore(
    callback => directory?.subscribe(callback) ?? (() => {}),
    () => directory?.getSnapshot() ?? EMPTY_STATE,
  )
  const [open, setOpen] = useState(false)
  const [openProviders, setOpenProviders] = useState<ReadonlySet<string>>(new Set())
  const [toast, setToast] = useState<{ seq: number; text: string } | null>(null)
  const toastSeq = useRef(0)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const currentGroup = state.current === null
    ? undefined
    : state.groups.find(group => group.id === state.current!.provider)
  const currentModel = currentGroup?.models.find(model => model.id === state.current?.model)
  const reasoning = currentModel?.reasoning
  const effectiveEffort = state.current?.reasoningEffort ?? reasoning?.defaultEffort
  const modelLabel = currentModel?.name ?? (state.current === null ? t('modelPicker.select') : state.current.model)
  const effortLabel = reasoning === undefined
    ? undefined
    : effectiveEffort === undefined
      ? t('modelPicker.providerDefault')
      : reasoning.efforts.find(level => level.id === effectiveEffort)?.name ?? effectiveEffort
  const busy = state.status === 'selecting'

  const show = (): void => {
    setOpenProviders(state.current === null ? new Set() : new Set([state.current.provider]))
    setOpen(true)
    load()
  }

  const toggleProvider = useCallback((provider: string): void => {
    setOpenProviders(current => {
      const next = new Set(current)
      if (next.has(provider)) next.delete(provider)
      else next.add(provider)
      return next
    })
  }, [])

  // Keep the directory fresh on mount, mirroring the host seat.
  useEffect(() => {
    if (available) load()
  }, [available, load])

  // A load finishing after show() expands the newly reported selected provider.
  useEffect(() => {
    if (open && state.current !== null) {
      setOpenProviders(current => current.size === 0 ? new Set([state.current!.provider]) : current)
    }
  }, [open, state.current])

  const announceFailure = useCallback((): void => {
    const message = directory?.getSnapshot().error
    if (message !== null && message !== '') {
      toastSeq.current += 1
      setToast({ seq: toastSeq.current, text: t('modelPicker.error', { message }) })
    }
  }, [directory, t])

  const choose = useCallback(async (selection: PickerSelection): Promise<void> => {
    if (state.current?.provider === selection.provider
      && state.current.model === selection.model
      && state.current.reasoningEffort === selection.reasoningEffort) {
      setOpen(false)
      return
    }
    const accepted = await select(selection)
    if (accepted) setOpen(false)
    else announceFailure()
  }, [announceFailure, select, state.current])

  const chooseEffort = useCallback(async (effort: string | undefined): Promise<void> => {
    if (state.current === null) return
    if (effectiveEffort === effort) {
      setOpen(false)
      return
    }
    const accepted = await select({
      provider: state.current.provider,
      model: state.current.model,
      ...effort === undefined ? {} : { reasoningEffort: effort },
    })
    if (accepted) setOpen(false)
    else announceFailure()
  }, [announceFailure, effectiveEffort, select, state.current])

  const effortRows = useMemo(() => (reasoning === undefined
    ? []
    : [
      ...reasoning.defaultEffort === undefined
        ? [{ id: 'effort:default', name: t('modelPicker.providerDefault'), description: undefined }]
        : [],
      ...reasoning.efforts.map(level => ({
        id: `effort:${level.id}`, name: level.name, description: level.description,
      })),
    ]), [reasoning, t])

  if (!available || directory === null) return null

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      className={css.trigger}
      aria-haspopup="dialog"
      aria-expanded={open}
      disabled={locked || busy}
      title={`${modelLabel}${effortLabel === undefined ? '' : ` · ${effortLabel}`}`}
      onClick={() => { open ? setOpen(false) : show() }}
    >
      <span className={css.triggerLabel}>{modelLabel}</span>
      {effortLabel !== undefined && <span className={css.triggerEffort}>{effortLabel}</span>}
      <IconChevronDownOutline14 className={css.chevron} />
    </button>
  )

  return (
    <>
      {trigger}
      <Modal
        open={open}
        onClose={() => { setOpen(false) }}
        title={t('modelPicker.title')}
        closeLabel={t('modelPicker.close')}
        description={t('modelPicker.hint')}
        className={css.modal}
        contentClassName={css.modalContent}
        footer={(
          <div className={css.footer}>
            <span className={css.footerCurrent}>
              {modelLabel}{effortLabel === undefined ? '' : ` · ${effortLabel}`}
            </span>
            {state.status === 'loading' && <span className={css.loading}>{t('modelPicker.loading')}</span>}
          </div>
        )}
      >
        {state.error !== null && state.groups.length === 0 && (
          <div className={css.error}>
            <span>{t('modelPicker.error', { message: state.error })}</span>
            <button type="button" className={css.retry} onClick={load}>{t('modelPicker.retry')}</button>
          </div>
        )}
        {state.failures.map(failure => (
          <div className={css.warning} key={failure.id}>{failure.name}: {failure.message}</div>
        ))}
        <div className={css.groups}>
          {state.groups.map(group => {
            const expanded = openProviders.has(group.id)
            return (
              <section className={css.group} key={group.id}>
                <button
                  type="button"
                  className={css.providerHeader}
                  aria-expanded={expanded}
                  onClick={() => { toggleProvider(group.id) }}
                >
                  <IconChevronDownOutline14 className={expanded ? css.chevronOpen : css.chevronClosed} />
                  <span className={css.providerName}>{group.name}</span>
                  <span className={css.count}>{group.models.length}</span>
                </button>
                {expanded && (
                  <div className={css.models} role="group">
                    {group.models.map(model => {
                      const selected = state.current?.provider === group.id && state.current.model === model.id
                      return (
                        <button
                          type="button"
                          key={model.id}
                          className={`${css.modelRow}${selected ? ` ${css.modelSelected}` : ''}`}
                          disabled={busy}
                          onClick={() => {
                            void choose({
                              provider: group.id,
                              model: model.id,
                              ...model.reasoning?.defaultEffort === undefined
                                ? {}
                                : { reasoningEffort: model.reasoning.defaultEffort },
                            })
                          }}
                        >
                          <span className={css.modelCopy}>
                            <span className={css.modelName}>{model.name}</span>
                            {model.description !== undefined && (
                              <span className={css.description}>{model.description}</span>
                            )}
                          </span>
                          {selected && <span className={css.selectedMark}>✓</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}
        </div>
        {effortRows.length > 0 && (
          <section className={css.effortSection}>
            <h3 className={css.effortTitle}>{t('modelPicker.effort')}</h3>
            <div className={css.models}>
              {effortRows.map(level => {
                const selected = level.id === 'effort:default'
                  ? effectiveEffort === undefined
                  : effectiveEffort === level.id.slice('effort:'.length)
                return (
                  <button
                    type="button"
                    key={level.id}
                    className={`${css.modelRow}${selected ? ` ${css.modelSelected}` : ''}`}
                    disabled={busy}
                    onClick={() => {
                      void chooseEffort(level.id === 'effort:default' ? undefined : level.id.slice('effort:'.length))
                    }}
                  >
                    <span className={css.modelCopy}>
                      <span className={css.modelName}>{level.name}</span>
                      {level.description !== undefined && <span className={css.description}>{level.description}</span>}
                    </span>
                    {selected && <span className={css.selectedMark}>✓</span>}
                  </button>
                )
              })}
            </div>
          </section>
        )}
      </Modal>
      {toast !== null && (
        <Toast
          key={toast.seq}
          text={toast.text}
          icon={<IconWarningOutline16 />}
          anchor={triggerRef.current?.closest<HTMLElement>('[data-composer-card]') ?? null}
          onDone={() => { setToast(null) }}
        />
      )}
    </>
  )
}
