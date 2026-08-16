/**
 * Composer model picker: a plugin-owned shadow of the host
 * `conversation.input.model` seat.
 *
 * The host ui-model-selection component is a small in-place menu with every
 * provider expanded at once. This registration wins the single slot at a lower
 * priority and renders a wider portaled menu instead: one row per provider
 * (collapsed by default) whose submenu lists that provider's models, plus the
 * current model's reasoning-effort choices. Data and writes still ride the
 * host's shared per-session ModelDirectory, so the /model command and this
 * seat stay one fact source.
 * @module dsh-web-enhanced/src/client/model-picker/ModelPicker
 */

import {
  useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore,
} from 'react'
import {
  IconChevronDownOutline14, IconWarningOutline16, Menu, Toast,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { MenuEntry } from '@deepseek-ai/dsh-client-ui-primitives'
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

/** One selectable model id over the wire (provider/model may contain slashes). */
const modelId = (provider: string, model: string): string =>
  `model:${JSON.stringify({ provider, model })}`

/** Decode a model menu id. */
function selectionOfId(id: string): PickerSelection | null {
  if (!id.startsWith('model:')) return null
  try {
    const parsed: unknown = JSON.parse(id.slice('model:'.length))
    if (typeof parsed !== 'object' || parsed === null) return null
    const { provider, model } = parsed as { provider?: unknown; model?: unknown }
    return typeof provider === 'string' && typeof model === 'string' ? { provider, model } : null
  } catch {
    return null
  }
}

/**
 * The composer model seat replacement.
 * @param props - locked, shared directory store, load/select verbs, locale.
 */
export function ModelPicker({ locked, available, directory, load, select, t }: ModelPickerProps) {
  const state = useSyncExternalStore(
    callback => directory?.subscribe(callback) ?? (() => {}),
    () => directory?.getSnapshot() ?? EMPTY_STATE,
  )
  const [open, setOpen] = useState(false)
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

  const show = (): void => {
    setOpen(true)
    load()
  }

  // Keep the directory fresh on mount, mirroring the host seat.
  useEffect(() => {
    if (available) load()
  }, [available, load])

  const announceFailure = (): void => {
    const message = directory?.getSnapshot().error
    if (message !== null && message !== '') {
      toastSeq.current += 1
      setToast({ seq: toastSeq.current, text: t('modelPicker.error', { message }) })
    }
  }

  const choose = useCallback(async (selection: PickerSelection): Promise<void> => {
    if (state.current?.provider === selection.provider
      && state.current.model === selection.model
      && state.current.reasoningEffort === selection.reasoningEffort) {
      setOpen(false)
      return
    }
    const accepted = await select(selection)
    if (accepted) {
      setOpen(false)
      return
    }
    announceFailure()
  }, [select, state.current])

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
  }, [effectiveEffort, select, state.current])

  if (!available || directory === null) return null
  const busy = state.status === 'selecting'

  const entries = useMemo<readonly MenuEntry[]>(() => {
    const rows: MenuEntry[] = []
    if (state.status === 'loading' && state.groups.length === 0) {
      rows.push({ type: 'label', id: 'loading', text: t('modelPicker.loading') })
      return rows
    }
    if (state.error !== null && state.groups.length === 0) {
      rows.push({ type: 'label', id: 'error', text: t('modelPicker.error', { message: state.error }) })
      rows.push({ id: 'retry', label: t('modelPicker.retry'), disabled: busy })
      return rows
    }
    for (const group of state.groups) {
      rows.push({
        id: `provider:${group.id}`,
        label: <span className={css.providerRow}>{group.name}<span className={css.count}>{group.models.length}</span></span>,
        submenu: group.models.map(model => {
          const selected = state.current?.provider === group.id && state.current.model === model.id
          return {
            id: modelId(group.id, model.id),
            label: (
              <span className={css.modelRow}>
                <span className={css.modelCopy}>
                  <span className={css.modelName}>{model.name}</span>
                  {model.description !== undefined && <span className={css.description}>{model.description}</span>}
                </span>
                {selected && <span className={css.selectedMark}>✓</span>}
              </span>
            ),
          }
        }),
      })
    }
    for (const failure of state.failures) {
      rows.push({ type: 'label', id: `failure:${failure.id}`, text: `${failure.name}: ${failure.message}` })
    }
    if (reasoning !== undefined && state.current !== null) {
      rows.push({ type: 'separator', id: 'effort-separator' })
      rows.push({
        id: 'effort',
        label: (
          <span className={css.providerRow}>
            {t('modelPicker.effort')}<span className={css.count}>{effortLabel}</span>
          </span>
        ),
        submenu: [
          ...reasoning.defaultEffort === undefined
            ? [{
              id: 'effort:default',
              label: (
                <span className={css.modelRow}>
                  <span className={css.modelName}>{t('modelPicker.providerDefault')}</span>
                  {effectiveEffort === undefined && <span className={css.selectedMark}>✓</span>}
                </span>
              ),
            }]
            : [],
          ...reasoning.efforts.map(level => ({
            id: `effort:${level.id}`,
            label: (
              <span className={css.modelRow}>
                <span className={css.modelCopy}>
                  <span className={css.modelName}>{level.name}</span>
                  {level.description !== undefined && <span className={css.description}>{level.description}</span>}
                </span>
                {effectiveEffort === level.id && <span className={css.selectedMark}>✓</span>}
              </span>
            ),
          })),
        ],
      })
    }
    return rows
  }, [state, t, busy, reasoning, effortLabel, effectiveEffort])

  const onSelect = useCallback((id: string): void => {
    if (id === 'retry') {
      load()
      return
    }
    if (id.startsWith('effort:')) {
      const effort = id === 'effort:default' ? undefined : id.slice('effort:'.length)
      void chooseEffort(effort)
      return
    }
    const selection = selectionOfId(id)
    if (selection === null) return
    const model = state.groups
      .find(group => group.id === selection.provider)
      ?.models.find(entry => entry.id === selection.model)
    void choose({
      ...selection,
      ...model?.reasoning?.defaultEffort === undefined ? {} : { reasoningEffort: model.reasoning.defaultEffort },
    })
  }, [choose, chooseEffort, load, state.groups])

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      className={css.trigger}
      aria-haspopup="menu"
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
      <Menu
        className={css.menu}
        open={open}
        anchor={trigger}
        items={entries}
        onSelect={onSelect}
        onClose={() => { setOpen(false) }}
        portal
        side="bottom"
        align="end"
        getAnchorRect={() => triggerRef.current?.getBoundingClientRect() ?? null}
        footer={state.status === 'loading' && state.groups.length > 0
          ? [{ type: 'label', id: 'refreshing', text: t('modelPicker.loading') }]
          : []}
      />
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
