/**
 * The Model Capabilities settings page inside Web Enhanced. It edits exactly
 * what the host Models editor deliberately leaves out:
 *
 * - llm-deepseek (whole section): `thinking` and `reasoningEffort`.
 * - llm-pi-ai provider profiles: `defaultInput` / `reasoning`, plus every
 *   model's `input` and `reasoningEfforts` — through `models` rows when the
 *   profile already owns the list, through minimal `modelOverrides` entries
 *   for catalog routes otherwise.
 *
 * Every card applies path-addressed settings ops against the user layer it
 * cloned, so fields edited by the host Models page survive untouched.
 * @module dsh-web-enhanced/src/client/model-capabilities/ModelCapabilities
 */

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  ConfigurableProviderView, IApiClient, SettingsNamespaceView,
} from '@deepseek-ai/dsh-api-remotes/client'
import { deletePath, getPath, hasPath, setPath } from './path.ts'
import type { InjectFace, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import {
  applyDraft, applyReasoningToAll, cloneRecord, DEEPSEEK_NS, draftAt, isRecord, MODALITIES,
  normalizePiAiDraft, PI_AI_NS, recordOf, THINKING_LEVELS, usableReasoningPreset,
  validateDeepSeekDraft, validatePiAiDraft,
} from './settings-draft.ts'
import type { JsonRecord } from './settings-draft.ts'
import { modelOptionsOf } from './store.ts'
import type { CapabilitiesState, CapabilitiesStore, CatalogModel } from './store.ts'
import css from './ModelCapabilities.module.css'

/** Injected dependencies of {@link ModelCapabilitiesSection}. */
export interface ModelCapabilitiesInjected {
  /** The page store (loaded on mount, refreshed on pushed invalidations). */
  controller: CapabilitiesStore
  /** uSES subscription hook bound to the store. */
  useSnapshot: <S>(sel: (s: CapabilitiesState) => S, eq?: (a: S, b: S) => boolean) => S
  /** Wire faces the cards write through. */
  api: Pick<IApiClient, 'settings' | 'llm'>
}

/** Full composed props of the settings section. */
export type ModelCapabilitiesProps = InjectFace<ModelCapabilitiesInjected> & PropsLocale<'webEnhanced'>

/** Localized copy face the cards share. */
type T = ModelCapabilitiesProps['t']

/** One pi-ai thinking level, from the config's canonical order. */
type ThinkingLevel = (typeof THINKING_LEVELS)[number]

/** Localized key of one thinking level row. */
type LevelKey =
  | 'modelCapabilities.reasoningLevelOff'
  | 'modelCapabilities.reasoningLevelMinimal'
  | 'modelCapabilities.reasoningLevelLow'
  | 'modelCapabilities.reasoningLevelMedium'
  | 'modelCapabilities.reasoningLevelHigh'
  | 'modelCapabilities.reasoningLevelXHigh'
  | 'modelCapabilities.reasoningLevelMax'

const LEVEL_KEYS: Readonly<Record<ThinkingLevel, LevelKey>> = {
  off: 'modelCapabilities.reasoningLevelOff',
  minimal: 'modelCapabilities.reasoningLevelMinimal',
  low: 'modelCapabilities.reasoningLevelLow',
  medium: 'modelCapabilities.reasoningLevelMedium',
  high: 'modelCapabilities.reasoningLevelHigh',
  xhigh: 'modelCapabilities.reasoningLevelXHigh',
  max: 'modelCapabilities.reasoningLevelMax',
}

/** Render the settings section content column. */
export function ModelCapabilitiesSection(props: ModelCapabilitiesProps): ReactNode {
  return <Loaded {...props} />
}

function Loaded({ controller, useSnapshot, api, t }: ModelCapabilitiesProps): ReactNode {
  const state = useSnapshot(snapshot => snapshot)
  // Revisions successfully written by one card are shared with every other
  // mounted card of the same namespace: they all edit one settings section,
  // so the first save invalidates the revision every sibling captured.
  // External changes are deliberately NOT shared — those must keep surfacing
  // the settings-conflict error instead of silently rebasing a stale draft.
  const [coordinatedRevisions, setCoordinatedRevisions] = useState<ReadonlyMap<string, number>>(() => new Map())
  const noteApplied = (ns: string, revision: number): void => {
    setCoordinatedRevisions((previous) => {
      const next = new Map(previous)
      next.set(ns, revision)
      return next
    })
  }
  const reload = async (ns: string): Promise<void> => {
    await controller.load()
    // A reload after a conflict is the user re-anchoring on the CURRENT
    // revision; any older revision this page itself wrote must stop being
    // pushed into the remounted card.
    setCoordinatedRevisions((previous) => {
      if (!previous.has(ns)) return previous
      const next = new Map(previous)
      next.delete(ns)
      return next
    })
  }
  if (state.status === 'idle') void controller.load()
  if (state.status === 'error') {
    const errorText = state.error ?? ''
    return (
      <div className={css.root}>
        <p className={css.error}>{`${t('modelCapabilities.loadFailed')}: ${errorText}`}</p>
        <button type="button" className={css.button} onClick={() => { void controller.load() }}>
          {t('modelCapabilities.retry')}
        </button>
      </div>
    )
  }
  const deepseek = state.providers.find(entry => entry.settingsNs === DEEPSEEK_NS)
  const piAi = state.providers.filter(entry => entry.settingsNs === PI_AI_NS)
  const deepseekNamespace = deepseek === undefined
    ? undefined
    : state.namespaces.get(DEEPSEEK_NS)
  return (
    <div className={css.root}>
      <h2 className={css.title}>{t('modelCapabilities.title')}</h2>
      <p className={css.intro}>{t('modelCapabilities.intro')}</p>
      {!state.writable && state.status === 'ready'
        ? <p className={css.notice}>{t('modelCapabilities.readOnly')}</p>
        : null}
      {state.modelFailures.map(failure => (
        <p className={css.notice} key={failure.id}>
          {t('modelCapabilities.catalogError').replace('{message}', failure.message)}
        </p>
      ))}
      {state.status === 'loading' && deepseek === undefined && piAi.length === 0
        ? <p className={css.notice}>{t('modelCapabilities.loading')}</p>
        : null}
      {deepseek !== undefined && deepseekNamespace !== undefined
        ? (
          <DeepSeekCapabilitiesCard
            entry={deepseek}
            namespace={deepseekNamespace}
            api={api}
            t={t}
            readOnly={!state.writable}
            coordinatedRevision={coordinatedRevisions.get(DEEPSEEK_NS)}
            onApplied={noteApplied}
            reload={reload}
          />
        )
        : null}
      {piAi.map((entry) => {
        const namespace = state.namespaces.get(PI_AI_NS)
        /* v8 ignore next -- the join only shows rows whose namespace resolved */
        if (namespace === undefined) return null
        return (
          <PiAiCapabilitiesCard
            key={entry.provider}
            entry={entry}
            namespace={namespace}
            catalog={state.modelsByProvider.get(entry.provider) ?? []}
            api={api}
            t={t}
            readOnly={!state.writable}
            coordinatedRevision={coordinatedRevisions.get(PI_AI_NS)}
            onApplied={noteApplied}
            reload={reload}
          />
        )
      })}
      {deepseek === undefined && piAi.length === 0 && state.status === 'ready'
        ? <p className={css.notice}>{t('modelCapabilities.noProviders')}</p>
        : null}
    </div>
  )
}

/** Shared footer actions of one editor card. */
interface CardActionsProps {
  busy: boolean
  disabled: boolean
  saved: boolean
  failure: string | undefined
  conflicted: boolean
  t: T
  onReload: () => void
  onReset: () => void
  onApply: () => void
}

function CardActions({ busy, disabled, saved, failure, conflicted, t, onReload, onReset, onApply }: CardActionsProps): ReactNode {
  return (
    <>
      {saved && failure === undefined
        ? <p className={css.saved} role="status">{t('modelCapabilities.saved')}</p>
        : null}
      {failure !== undefined ? <p className={css.error}>{failure}</p> : null}
      <div className={css.actions}>
        {conflicted
          ? (
            <button type="button" className={css.button} disabled={busy} onClick={onReload}>
              {t('modelCapabilities.reload')}
            </button>
          )
          : null}
        <button type="button" className={css.button} disabled={disabled} onClick={onReset}>
          {t('modelCapabilities.reset')}
        </button>
        <button type="button" className={css.buttonPrimary} disabled={disabled} onClick={onApply}>
          {busy ? t('modelCapabilities.applying') : t('modelCapabilities.apply')}
        </button>
      </div>
    </>
  )
}

/** The two-model modality checkboxes, reading `input` lists or inheritance. */
interface InputEditorProps {
  value: unknown
  onChange: (value: unknown) => void
  disabled: boolean
  t: T
  /** Route-level defaults may not be empty; model fields fall back to inherit. */
  required?: boolean
}

function InputEditor({ value, onChange, disabled, required = false, t }: InputEditorProps): ReactNode {
  const list = Array.isArray(value) ? value : []
  const has = (modality: string): boolean => list.includes(modality)
  const toggle = (modality: string): void => {
    const next = has(modality)
      ? list.filter(existing => existing !== modality)
      : [...list, modality]
    onChange(next.length === 0 && !required ? undefined : next)
  }
  return (
    <div className={css.checkRow}>
      {value === undefined ? <span className={css.inheritBadge}>{t('modelCapabilities.inputInherit')}</span> : null}
      {MODALITIES.map(modality => (
        <label className={css.check} key={modality}>
          <input
            type="checkbox"
            checked={has(modality)}
            disabled={disabled}
            onChange={() => { toggle(modality) }}
          />
          <span>
            {modality === 'text' ? t('modelCapabilities.inputText') : t('modelCapabilities.inputImage')}
          </span>
        </label>
      ))}
    </div>
  )
}

type ReasoningMode = 'none' | 'custom'

/** Read the reasoning-efforts field as one of the editor's two states. */
function reasoningModeOf(value: unknown): ReasoningMode {
  if (value === false) return 'none'
  return 'custom'
}

/** One-line summary of a model's reasoning-efforts value for a folded row. */
function reasoningSummary(value: unknown, t: T): string {
  if (value === false) return t('modelCapabilities.reasoningNone')
  if (isRecord(value)) {
    const levels = Object.keys(value)
    return levels.length === 0
      ? t('modelCapabilities.reasoningNoneSelected')
      : levels.join(' / ')
  }
  return t('modelCapabilities.reasoningUnset')
}

/** The fixed custom-effort rows, initialized with the common levels. */
const CUSTOM_REASONING_DEFAULT: JsonRecord = { off: null, high: 'high' }

/** Editing surface for pi-ai `reasoningEfforts`: false / custom dict. */
interface ReasoningEditorProps {
  value: unknown
  onChange: (value: unknown) => void
  disabled: boolean
  t: T
}

function ReasoningEditor({ value, onChange, disabled, t }: ReasoningEditorProps): ReactNode {
  const mode = reasoningModeOf(value)
  const dict = mode === 'custom' && isRecord(value) ? value : {}
  const setMode = (next: ReasoningMode): void => {
    if (next === 'none') onChange(false)
    else onChange(cloneRecord(isRecord(value) ? value : CUSTOM_REASONING_DEFAULT))
  }
  const toggleLevel = (level: ThinkingLevel): void => {
    const next = { ...dict }
    if (level in next) delete next[level]
    else next[level] = level === 'off' ? null : level
    onChange(next)
  }
  const setWire = (level: ThinkingLevel, text: string): void => {
    const next = { ...dict }
    if (level === 'off') next[level] = text.trim().length === 0 ? null : text
    else next[level] = text
    onChange(next)
  }
  const wireText = (level: ThinkingLevel): string => {
    const wire = dict[level]
    return wire === null ? '' : typeof wire === 'string' ? wire : ''
  }
  return (
    <div className={css.reasoningEditor}>
      <select
        className={css.select}
        value={mode}
        disabled={disabled}
        aria-label={t('modelCapabilities.reasoning')}
        onChange={(event) => { setMode(event.target.value as ReasoningMode) }}
      >
        <option value="none">{t('modelCapabilities.reasoningNone')}</option>
        <option value="custom">{t('modelCapabilities.reasoningCustom')}</option>
      </select>
      {mode === 'custom'
        ? (
          <div className={css.reasoningCustom}>
            <p className={css.fieldHint}>{t('modelCapabilities.reasoningCustomHint')}</p>
            {THINKING_LEVELS.map(level => (
              <div className={css.reasoningLevelRow} key={level}>
                <label className={css.check}>
                  <input
                    type="checkbox"
                    checked={level in dict}
                    disabled={disabled}
                    onChange={() => { toggleLevel(level) }}
                  />
                  <span>{t(LEVEL_KEYS[level])}</span>
                </label>
                {level in dict
                  ? (
                    <input
                      className={css.input}
                      type="text"
                      value={wireText(level)}
                      placeholder={level === 'off'
                        ? t('modelCapabilities.reasoningWireOffPlaceholder')
                        : t('modelCapabilities.reasoningWirePlaceholder')}
                      aria-label={`${t('modelCapabilities.reasoningWire')} ${t(LEVEL_KEYS[level])}`}
                      disabled={disabled}
                      onChange={(event) => { setWire(level, event.target.value) }}
                    />
                  )
                  : null}
              </div>
            ))}
          </div>
        )
        : null}
    </div>
  )
}

/** The DeepSeek route-level card (whole `llm-deepseek` user section). */
interface DeepSeekCardProps {
  entry: ConfigurableProviderView
  namespace: SettingsNamespaceView
  api: Pick<IApiClient, 'settings' | 'llm'>
  t: T
  readOnly: boolean
  /** Revision written by a sibling card, when one has applied in this namespace. */
  coordinatedRevision: number | undefined
  /** Report one successful apply so sibling cards move to the new revision. */
  onApplied: (ns: string, revision: number) => void
  /** Refetch the page snapshot before remounting the card's draft. */
  reload: (ns: string) => Promise<void>
}

function DeepSeekCapabilitiesCard(props: DeepSeekCardProps): ReactNode {
  const [epoch, setEpoch] = useState(0)
  const requestReload = (): void => {
    void props.reload(props.namespace.ns).then(() => { setEpoch(current => current + 1) })
  }
  return <DeepSeekCapabilitiesCardBody key={epoch} {...props} onReloadRequested={requestReload} />
}

interface DeepSeekCardBodyProps extends DeepSeekCardProps {
  onReloadRequested: () => void
}

function DeepSeekCapabilitiesCardBody({
  namespace, api, t, readOnly, coordinatedRevision, onApplied, onReloadRequested,
}: DeepSeekCardBodyProps): ReactNode {
  const [draft, setDraft] = useState<JsonRecord>(() => draftAt(namespace, []))
  const [committedOriginal, setCommittedOriginal] = useState<unknown>(() => getPath(namespace.user, []))
  const [expectedRevision, setExpectedRevision] = useState(() => namespace.revision)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | undefined>(undefined)
  const [conflicted, setConflicted] = useState(false)
  const [saved, setSaved] = useState(false)
  const disabled = readOnly || busy

  // Only this page's own successful writes advance a sibling card's revision;
  // external settings changes deliberately keep the conflict path.
  useEffect(() => {
    if (coordinatedRevision !== undefined) setExpectedRevision(coordinatedRevision)
  }, [coordinatedRevision])

  const stringAt = (key: string): string | undefined => {
    const value = draft[key]
    return typeof value === 'string' && value.length > 0 ? value : undefined
  }
  const setField = (key: string, next: string | undefined): void => {
    setSaved(false)
    setFailure(undefined)
    setConflicted(false)
    setDraft(current => next === undefined
      ? deletePath(current, [key])
      : setPath(current, [key], next))
  }
  const reset = (): void => {
    setFailure(undefined)
    setConflicted(false)
    setSaved(false)
    setDraft(cloneRecord(committedOriginal))
  }
  const apply = async (): Promise<void> => {
    setBusy(true)
    setFailure(undefined)
    setConflicted(false)
    setSaved(false)
    const validation = validateDeepSeekDraft(draft)
    if (validation !== undefined) {
      setFailure(t(`modelCapabilities.${validation}`))
      setBusy(false)
      return
    }
    const result = await applyDraft({
      api,
      ns: namespace.ns,
      path: [],
      before: committedOriginal,
      after: draft,
      expectedRevision,
      conflictText: t('modelCapabilities.conflict'),
    })
    if (!result.ok) {
      setFailure(t('modelCapabilities.saveError').replace('{message}', result.failure))
      setConflicted(result.conflicted)
      setBusy(false)
      return
    }
    setCommittedOriginal(result.committed)
    setExpectedRevision(result.revision)
    setDraft(cloneRecord(result.committed))
    setSaved(true)
    setBusy(false)
    onApplied(namespace.ns, result.revision)
  }

  return (
    <details className={css.card} open>
      <summary className={css.summary}>
        <span className={css.cardTitle}>DeepSeek</span>
        <span className={css.cardRoute}>deepseek-official</span>
      </summary>
      <div className={css.cardBody}>
        <p className={css.fieldHint}>{t('modelCapabilities.deepseekHint')}</p>
        <label className={css.field}>
          <span className={css.fieldLabel}>{t('modelCapabilities.thinking')}</span>
          <select
            className={css.select}
            value={stringAt('thinking') ?? ''}
            disabled={disabled}
            onChange={(event) => { setField('thinking', event.target.value === '' ? undefined : event.target.value) }}
          >
            <option value="">{t('modelCapabilities.thinkingInherit')}</option>
            <option value="enabled">{t('modelCapabilities.thinkingEnabled')}</option>
            <option value="disabled">{t('modelCapabilities.thinkingDisabled')}</option>
          </select>
        </label>
        <label className={css.field}>
          <span className={css.fieldLabel}>{t('modelCapabilities.reasoningEffort')}</span>
          <select
            className={css.select}
            value={stringAt('reasoningEffort') ?? ''}
            disabled={disabled}
            onChange={(event) => { setField('reasoningEffort', event.target.value === '' ? undefined : event.target.value) }}
          >
            <option value="">{t('modelCapabilities.reasoningEffortInherit')}</option>
            <option value="off">off</option>
            <option value="high">high</option>
            <option value="max">max</option>
          </select>
        </label>
        <CardActions
          busy={busy}
          disabled={disabled}
          saved={saved}
          failure={failure}
          conflicted={conflicted}
          t={t}
          onReload={onReloadRequested}
          onReset={reset}
          onApply={() => { void apply() }}
        />
      </div>
    </details>
  )
}

/** One pi-ai provider card: route defaults plus per-model capabilities. */
interface PiAiCardProps {
  entry: ConfigurableProviderView
  namespace: SettingsNamespaceView
  catalog: readonly CatalogModel[]
  api: Pick<IApiClient, 'settings' | 'llm'>
  t: T
  readOnly: boolean
  /** Revision written by a sibling card, when one has applied in this namespace. */
  coordinatedRevision: number | undefined
  /** Report one successful apply so sibling cards move to the new revision. */
  onApplied: (ns: string, revision: number) => void
  /** Refetch the page snapshot before remounting the card's draft. */
  reload: (ns: string) => Promise<void>
}

function PiAiCapabilitiesCard(props: PiAiCardProps): ReactNode {
  const [epoch, setEpoch] = useState(0)
  const requestReload = (): void => {
    void props.reload(props.namespace.ns).then(() => { setEpoch(current => current + 1) })
  }
  return <PiAiCapabilitiesCardBody key={epoch} {...props} onReloadRequested={requestReload} />
}

interface PiAiCardBodyProps extends PiAiCardProps {
  onReloadRequested: () => void
}

function PiAiCapabilitiesCardBody({
  entry, namespace, catalog, api, t, readOnly, coordinatedRevision, onApplied, onReloadRequested,
}: PiAiCardBodyProps): ReactNode {
  const path = entry.settingsPath
  const [draft, setDraft] = useState<JsonRecord>(() => draftAt(namespace, path))
  const [committedOriginal, setCommittedOriginal] = useState<unknown>(() => getPath(namespace.user, path))
  const [expectedRevision, setExpectedRevision] = useState(() => namespace.revision)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | undefined>(undefined)
  const [conflicted, setConflicted] = useState(false)
  const [saved, setSaved] = useState(false)
  const [addingId, setAddingId] = useState('')
  const [presetReasoning, setPresetReasoning] = useState<unknown>(undefined)
  const disabled = readOnly || busy
  const configured = getPath(namespace.user, path) !== undefined
  const listMode = hasPath(draft, ['models'])

  // Only this page's own successful writes advance a sibling card's revision;
  // external settings changes deliberately keep the conflict path.
  useEffect(() => {
    if (coordinatedRevision !== undefined) setExpectedRevision(coordinatedRevision)
  }, [coordinatedRevision])

  const stringAt = (key: string): string | undefined => {
    const value = draft[key]
    return typeof value === 'string' && value.length > 0 ? value : undefined
  }
  const setField = (key: string, next: unknown): void => {
    setSaved(false)
    setFailure(undefined)
    setConflicted(false)
    setDraft(current => next === undefined
      ? deletePath(current, [key])
      : setPath(current, [key], next))
  }
  const patchListEntry = (index: number, key: string, value: unknown): void => {
    setSaved(false)
    setFailure(undefined)
    setConflicted(false)
    setDraft((current) => {
      const models = Array.isArray(current['models']) ? [...current['models']] : []
      const previous = recordOf(models[index])
      const next = { ...previous }
      if (value === undefined) delete next[key]
      else next[key] = value
      models[index] = next
      return setPath(current, ['models'], models)
    })
  }
  const patchOverride = (id: string, key: string, value: unknown): void => {
    setSaved(false)
    setFailure(undefined)
    setConflicted(false)
    setDraft((current) => {
      const overrides = recordOf(current['modelOverrides'])
      const previous = recordOf(overrides[id])
      const next = { ...previous }
      if (value === undefined) delete next[key]
      else next[key] = value
      return setPath(current, ['modelOverrides', id], next)
    })
  }
  const removeOverride = (id: string): void => {
    setSaved(false)
    setFailure(undefined)
    setConflicted(false)
    setDraft((current) => {
      const overrides = recordOf(current['modelOverrides'])
      const next = { ...overrides }
      delete next[id]
      return Object.keys(next).length === 0
        ? deletePath(current, ['modelOverrides'])
        : setPath(current, ['modelOverrides'], next)
    })
  }
  const addOverride = (): void => {
    const id = addingId
    if (id.length === 0) return
    setAddingId('')
    setSaved(false)
    setFailure(undefined)
    setConflicted(false)
    setDraft(current => setPath(current, ['modelOverrides', id], { input: ['text'] }))
  }
  const applyPresetToAll = (): void => {
    setSaved(false)
    setFailure(undefined)
    setConflicted(false)
    setDraft(current => applyReasoningToAll(current, presetReasoning, listMode))
  }
  const reset = (): void => {
    setFailure(undefined)
    setConflicted(false)
    setSaved(false)
    setDraft(cloneRecord(committedOriginal))
  }
  const apply = async (): Promise<void> => {
    setBusy(true)
    setFailure(undefined)
    setConflicted(false)
    setSaved(false)
    const normalized = normalizePiAiDraft(draft)
    const validation = validatePiAiDraft(normalized)
    if (validation !== undefined) {
      setFailure(t(`modelCapabilities.${validation}`))
      setBusy(false)
      return
    }
    const result = await applyDraft({
      api,
      ns: namespace.ns,
      path,
      before: committedOriginal,
      after: normalized,
      expectedRevision,
      conflictText: t('modelCapabilities.conflict'),
    })
    if (!result.ok) {
      setFailure(t('modelCapabilities.saveError').replace('{message}', result.failure))
      setConflicted(result.conflicted)
      setBusy(false)
      return
    }
    setCommittedOriginal(result.committed)
    setExpectedRevision(result.revision)
    setDraft(cloneRecord(result.committed))
    setSaved(true)
    setBusy(false)
    onApplied(namespace.ns, result.revision)
  }

  const models = Array.isArray(draft['models']) ? draft['models'] : []
  const overrides = recordOf(draft['modelOverrides'])
  const overrideIds = new Set(Object.keys(overrides))
  const options = modelOptionsOf(namespace, path, catalog)
  const candidates = options.filter(option => !overrideIds.has(option.id))

  return (
    <details className={css.card} open={configured || entry.active}>
      <summary className={css.summary}>
        <span className={css.cardTitle}>{entry.displayName}</span>
        <span className={css.cardRoute}>{entry.provider}</span>
      </summary>
      <div className={css.cardBody}>
        <section className={css.section} aria-label={t('modelCapabilities.routeSection')}>
          <h3 className={css.sectionTitle}>{t('modelCapabilities.routeSection')}</h3>
          <div className={css.field}>
            <div className={css.fieldHead}>
              <span className={css.fieldLabel}>{t('modelCapabilities.defaultInput')}</span>
              <span className={css.fieldHint}>{t('modelCapabilities.defaultInputHint')}</span>
            </div>
            <InputEditor
              value={draft['defaultInput']}
              onChange={(value) => { setField('defaultInput', value) }}
              disabled={disabled}
              required
              t={t}
            />
          </div>
          <label className={css.field}>
            <span className={css.fieldLabel}>{t('modelCapabilities.routeReasoning')}</span>
            <select
              className={css.select}
              value={stringAt('reasoning') ?? ''}
              disabled={disabled}
              onChange={(event) => { setField('reasoning', event.target.value === '' ? undefined : event.target.value) }}
            >
              <option value="">{t('modelCapabilities.routeReasoningInherit')}</option>
              {THINKING_LEVELS.map(level => (
                <option key={level} value={level}>{t(LEVEL_KEYS[level])}</option>
              ))}
            </select>
            <p className={css.fieldHint}>{t('modelCapabilities.routeReasoningHint')}</p>
          </label>
          <div className={css.field}>
            <div className={css.fieldHead}>
              <span className={css.fieldLabel}>{t('modelCapabilities.reasoningPreset')}</span>
              <span className={css.fieldHint}>{t('modelCapabilities.reasoningPresetHint')}</span>
            </div>
            <ReasoningEditor
              value={presetReasoning}
              onChange={setPresetReasoning}
              disabled={disabled}
              t={t}
            />
            <button
              type="button"
              className={css.button}
              disabled={disabled || !usableReasoningPreset(presetReasoning)}
              onClick={applyPresetToAll}
            >
              {t('modelCapabilities.reasoningApplyAll')}
            </button>
          </div>
        </section>

        <section className={css.section} aria-label={t('modelCapabilities.modelSection')}>
          <div className={css.modelHead}>
            <h3 className={css.sectionTitle}>{t('modelCapabilities.modelSection')}</h3>
            <span className={css.fieldHint}>
              {listMode
                ? t('modelCapabilities.modelsListModeHint')
                : t('modelCapabilities.overridesModeHint')}
            </span>
          </div>
          {listMode
            ? (
              <div className={css.modelList}>
                {models.map((model, index) => {
                  const entry = recordOf(model)
                  const id = typeof entry['id'] === 'string' ? entry['id'] : ''
                  return (
                    <div className={css.modelRow} key={index}>
                      <div className={css.modelHead}>
                        <span className={css.modelId}>{id}</span>
                        {typeof entry['name'] === 'string' && entry['name'].length > 0
                          ? <span className={css.modelName}>{entry['name']}</span>
                          : null}
                      </div>
                      <label className={css.field}>
                        <span className={css.fieldLabel}>{t('modelCapabilities.modelInput')}</span>
                        <InputEditor
                          value={entry['input']}
                          onChange={(value) => { patchListEntry(index, 'input', value) }}
                          disabled={disabled}
                          t={t}
                        />
                      </label>
                      <details className={css.reasoningDisclosure}>
                        <summary className={css.reasoningSummary}>
                          <span>{t('modelCapabilities.reasoning')}</span>
                          <span className={css.reasoningSummaryValue}>
                            {reasoningSummary(entry['reasoningEfforts'], t)}
                          </span>
                        </summary>
                        <div className={css.reasoningBody}>
                          <ReasoningEditor
                            value={entry['reasoningEfforts']}
                            onChange={(value) => { patchListEntry(index, 'reasoningEfforts', value) }}
                            disabled={disabled}
                            t={t}
                          />
                        </div>
                      </details>
                    </div>
                  )
                })}
              </div>
            )
            : (
              <>
                <div className={css.addOverrideRow}>
                  <select
                    className={css.select}
                    value={addingId}
                    disabled={disabled || candidates.length === 0}
                    onChange={(event) => { setAddingId(event.target.value) }}
                  >
                    <option value="">{t('modelCapabilities.addOverridePlaceholder')}</option>
                    {candidates.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.name === undefined ? option.id : `${option.name} (${option.id})`}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={css.button}
                    disabled={disabled || addingId.length === 0}
                    onClick={addOverride}
                  >
                    {t('modelCapabilities.addOverride')}
                  </button>
                </div>
                {Object.keys(overrides).length === 0
                  ? <p className={css.notice}>{t('modelCapabilities.emptyOverrides')}</p>
                  : (
                    <div className={css.modelList}>
                      {Object.entries(overrides).map(([id, override]) => {
                        const entry = recordOf(override)
                        return (
                          <div className={css.modelRow} key={id}>
                            <div className={css.modelHead}>
                              <span className={css.modelId}>{id}</span>
                              <button
                                type="button"
                                className={css.linkButton}
                                disabled={disabled}
                                aria-label={t('modelCapabilities.removeOverride')}
                                onClick={() => { removeOverride(id) }}
                              >
                                {t('modelCapabilities.removeOverride')}
                              </button>
                            </div>
                            <label className={css.field}>
                              <span className={css.fieldLabel}>{t('modelCapabilities.modelInput')}</span>
                              <InputEditor
                                value={entry['input']}
                                onChange={(value) => { patchOverride(id, 'input', value) }}
                                disabled={disabled}
                                t={t}
                              />
                            </label>
                            <details className={css.reasoningDisclosure}>
                              <summary className={css.reasoningSummary}>
                                <span>{t('modelCapabilities.reasoning')}</span>
                                <span className={css.reasoningSummaryValue}>
                                  {reasoningSummary(entry['reasoningEfforts'], t)}
                                </span>
                              </summary>
                              <div className={css.reasoningBody}>
                                <ReasoningEditor
                                  value={entry['reasoningEfforts']}
                                  onChange={(value) => { patchOverride(id, 'reasoningEfforts', value) }}
                                  disabled={disabled}
                                  t={t}
                                />
                              </div>
                            </details>
                          </div>
                        )
                      })}
                    </div>
                  )}
              </>
            )}
        </section>

        <CardActions
          busy={busy}
          disabled={disabled}
          saved={saved}
          failure={failure}
          conflicted={conflicted}
          t={t}
          onReload={onReloadRequested}
          onReset={reset}
          onApply={() => { void apply() }}
        />
      </div>
    </details>
  )
}
