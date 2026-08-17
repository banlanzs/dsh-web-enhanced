/**
 * Memory tab of the plugin's Settings page.
 *
 * Lists the durable memories the model saved through `save_memory`, lets the
 * user narrow them by classification, scope, and text, and delete any entry.
 * The feature switch lives here too. Reads and writes go through this
 * plugin's own Typert gateway (`memoryList` / `memoryDelete` /
 * `memoryConfigGet` / `memoryConfigSet`), not the host settings RPCs: the
 * memories live in the `web_enhanced` storage domain and the switch lives in
 * a plugin-owned settings namespace, which the generic browser settings RPCs
 * would never list.
 *
 * The list is NOT workspace-scoped: a workspace-scoped read would hide the
 * memories whose cwd no longer resolves to a registered workspace — the very
 * ones a user would want to clean up. The scope filter separates the global
 * (cross-project) pool from project-owned records client-side.
 * @module dsh-web-enhanced/src/client/settings/MemoryPanel
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MemoryKind, MemoryRecord, WebEnhancedRemote } from '../contract.ts'
import type { Translate } from '../locale-keys.ts'
import css from './MemoryPanel.module.css'

/** Load state of the memory list. */
type List
  = { readonly phase: 'loading' }
  | { readonly phase: 'ready'; readonly records: readonly MemoryRecord[] }
  | { readonly phase: 'error'; readonly message: string }

/** Load state of the feature switch. */
type Config
  = { readonly phase: 'loading' }
  | {
    readonly phase: 'ready'
    readonly enabled: boolean
    readonly revision: number | null
    readonly writable: boolean
  }
  | { readonly phase: 'error'; readonly message: string }

/** Outcome of the last switch write. */
type Save
  = { readonly phase: 'idle' }
  | { readonly phase: 'saving' }
  | { readonly phase: 'saved' }
  | { readonly phase: 'error'; readonly message: string }

/** The kind filter; `undefined` means all kinds. */
export type KindFilter = MemoryKind | undefined

/** Which pool a row belongs to; `all` disables the filter. */
export type Scope = 'all' | 'workspace' | 'global'

/** Body characters shown before the row offers to expand. */
const BODY_CLAMP_CHARS = 160

/** Props of the tab (a plain child, not a slot registration). */
export interface MemoryPanelProps {
  readonly remote: WebEnhancedRemote
  readonly t: Translate
}

/** The pending deletion awaiting the user's confirmation. */
interface Pending {
  readonly record: MemoryRecord
}

/** Outcome of the last completed deletion. */
interface Outcome {
  readonly ok: boolean
  readonly text: string
}

/**
 * Format one record's kind as a locale key.
 * @param kind - the memory classification.
 * @param t - translate.
 * @returns the localized kind label.
 */
function kindLabel(kind: MemoryKind, t: Translate): string {
  switch (kind) {
    case 'user': return t('memory.kind.user')
    case 'feedback': return t('memory.kind.feedback')
    case 'project': return t('memory.kind.project')
    case 'reference': return t('memory.kind.reference')
  }
}

/** Format a timestamp as a locale-neutral date string. */
function formatTime(ms: number): string {
  if (!Number.isFinite(ms)) return ''
  try {
    return new Date(ms).toLocaleString()
  } catch {
    return String(ms)
  }
}

/**
 * Whether one record survives the three active filters.
 *
 * Exported for the unit tests: this package's tests run in the node
 * environment, so the panel's judgements are pinned as pure functions rather
 * than through a render.
 * @param record - the candidate row.
 * @param kind - the classification filter; `undefined` keeps every kind.
 * @param scope - which pool to keep.
 * @param needle - the lowercased search text; `''` keeps every row.
 * @returns whether the row is shown.
 */
export function matches(
  record: MemoryRecord,
  kind: KindFilter,
  scope: Scope,
  needle: string,
): boolean {
  if (kind !== undefined && record.kind !== kind) return false
  if (scope === 'global' && record.workspaceId !== null) return false
  if (scope === 'workspace' && record.workspaceId === null) return false
  if (needle === '') return true
  return `${record.summary}\n${record.body}`.toLowerCase().includes(needle)
}

/** Memory management tab: switch, list, filters, delete with confirmation. */
export function MemoryPanel({ remote, t }: MemoryPanelProps) {
  const [list, setList] = useState<List>({ phase: 'loading' })
  const [config, setConfig] = useState<Config>({ phase: 'loading' })
  const [save, setSave] = useState<Save>({ phase: 'idle' })
  const [kindFilter, setKindFilter] = useState<KindFilter>(undefined)
  const [scope, setScope] = useState<Scope>('all')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())
  const [pending, setPending] = useState<Pending | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | undefined>(undefined)
  const live = useRef(true)
  useEffect(() => () => { live.current = false }, [])

  const load = useCallback(async (): Promise<void> => {
    setList({ phase: 'loading' })
    const result = await remote.memoryList({})
    if (!live.current) return
    if ('error' in result) {
      setList({ phase: 'error', message: result.error.message })
      return
    }
    setList({ phase: 'ready', records: result.memories })
  }, [remote])

  const loadConfig = useCallback(async (): Promise<void> => {
    setConfig({ phase: 'loading' })
    setSave({ phase: 'idle' })
    const result = await remote.memoryConfigGet()
    if (!live.current) return
    if ('error' in result) {
      setConfig({
        phase: 'error',
        message: result.error.code === 'memory-settings-unmanaged'
          ? t('memory.configMissing')
          : result.error.message,
      })
      return
    }
    setConfig({
      phase: 'ready',
      enabled: result.enabled,
      revision: result.revision,
      writable: result.writable,
    })
  }, [remote, t])

  useEffect(() => { void load() }, [load])
  useEffect(() => { void loadConfig() }, [loadConfig])

  const toggle = useCallback(async (enabled: boolean): Promise<void> => {
    if (config.phase !== 'ready') return
    setSave({ phase: 'saving' })
    // exactOptionalPropertyTypes: a null revision means the namespace reports
    // none, and the field must then be ABSENT rather than explicitly undefined.
    const request = config.revision === null
      ? { enabled }
      : { enabled, expectedRevision: config.revision }
    const result = await remote.memoryConfigSet(request)
    if (!live.current) return
    if ('error' in result) {
      setSave({
        phase: 'error',
        message: result.error.code === 'memory-config-conflict'
          ? t('memory.conflict')
          : result.error.message,
      })
      return
    }
    setConfig({ ...config, enabled, revision: result.revision })
    setSave({ phase: 'saved' })
  }, [config, remote, t])

  const confirm = useCallback(async (): Promise<void> => {
    if (pending === undefined) return
    const { record } = pending
    setPending(undefined)
    setBusy(true)
    setOutcome(undefined)
    const result = await remote.memoryDelete({ id: record.id })
    if (!live.current) return
    setBusy(false)
    if ('error' in result) {
      setOutcome({ ok: false, text: t('memory.deleteError', { message: result.error.message }) })
      return
    }
    setOutcome(result.removed
      ? { ok: true, text: t('memory.deleted') }
      : { ok: false, text: t('memory.deleteMissing') })
    // The list is stale in the row the user just removed; re-read it rather
    // than patching locally so the standing-prompt section stays in sync.
    await load()
  }, [pending, remote, t, load])

  const records = list.phase === 'ready' ? list.records : []
  const needle = query.trim().toLowerCase()
  const visible = useMemo(
    () => records.filter(record => matches(record, kindFilter, scope, needle)),
    [records, kindFilter, scope, needle],
  )

  const kinds: readonly MemoryKind[] = ['user', 'feedback', 'project', 'reference']
  const scopes: readonly { readonly id: Scope; readonly label: string }[] = [
    { id: 'all', label: t('memory.scope.all') },
    { id: 'workspace', label: t('memory.scope.workspace') },
    { id: 'global', label: t('memory.scope.global') },
  ]

  return (
    <div className={css.root}>
      <div className={css.head}>
        <div className={css.headText}>
          <div className={css.title}>{t('memory.title')}</div>
          <div className={css.subtitle}>{t('memory.hint')}</div>
        </div>
        <button type="button" className={css.ghost} disabled={busy} onClick={() => { void load() }}>
          {t('memory.reload')}
        </button>
      </div>

      <div className={css.switchRow}>
        <label className={css.switchLabel}>
          <input
            type="checkbox"
            checked={config.phase === 'ready' && config.enabled}
            disabled={config.phase !== 'ready' || !config.writable || save.phase === 'saving'}
            onChange={(event) => { void toggle(event.target.checked) }}
          />
          <span>{t('memory.enabled')}</span>
        </label>
        {save.phase === 'saving' && <span className={css.saveState}>{t('memory.saving')}</span>}
        {save.phase === 'saved' && <span className={css.saveState}>{t('memory.saved')}</span>}
        <div className={css.switchHint}>{t('memory.enabledHint')}</div>
        {config.phase === 'ready' && !config.writable && (
          <p className={css.failure}>{t('memory.readonly')}</p>
        )}
        {config.phase === 'error' && <p className={css.failure}>{config.message}</p>}
        {save.phase === 'error' && (
          <p className={css.failure}>{t('memory.saveError', { message: save.message })}</p>
        )}
      </div>

      {outcome !== undefined && (
        <div className={outcome.ok ? css.noteOk : css.noteBad}>
          <div>{outcome.text}</div>
        </div>
      )}

      {list.phase === 'error' && (
        <>
          <p className={css.failure}>{t('memory.loadError', { message: list.message })}</p>
          <button type="button" className={css.ghost} onClick={() => { void load() }}>
            {t('memory.reload')}
          </button>
        </>
      )}

      {(list.phase === 'loading' || busy) && <p className={css.muted}>{t('memory.loading')}</p>}

      {list.phase === 'ready' && (
        <>
          <div className={css.filters}>
            <button
              type="button"
              className={kindFilter === undefined ? css.filterActive : css.filter}
              onClick={() => { setKindFilter(undefined) }}
            >
              {t('memory.kind.all')}
            </button>
            {kinds.map(kind => (
              <button
                key={kind}
                type="button"
                className={kindFilter === kind ? css.filterActive : css.filter}
                onClick={() => { setKindFilter(kind) }}
              >
                {kindLabel(kind, t)}
              </button>
            ))}
            <span className={css.count}>{t('memory.count', { count: String(visible.length) })}</span>
          </div>

          <div className={css.filters}>
            {scopes.map(entry => (
              <button
                key={entry.id}
                type="button"
                className={scope === entry.id ? css.filterActive : css.filter}
                onClick={() => { setScope(entry.id) }}
              >
                {entry.label}
              </button>
            ))}
            <input
              type="search"
              className={css.search}
              value={query}
              placeholder={t('memory.searchPlaceholder')}
              aria-label={t('memory.searchPlaceholder')}
              onChange={(event) => { setQuery(event.target.value) }}
            />
          </div>

          {visible.length === 0
            ? (
              <p className={css.muted}>
                {needle === '' ? t('memory.empty') : t('memory.searchEmpty', { query: query.trim() })}
              </p>
            )
            : (
              <ul className={css.rows}>
                {visible.map((record) => {
                  const open = expanded.has(record.id)
                  const clamped = record.body.length > BODY_CLAMP_CHARS
                  return (
                    <li key={record.id} className={css.row}>
                      <div className={css.rowMain}>
                        <div className={css.rowTitle}>
                          <span className={css.kindTag}>{kindLabel(record.kind, t)}</span>
                          <span className={css.summary}>{record.summary}</span>
                        </div>
                        {record.body !== '' && (
                          <div className={css.body}>
                            {clamped && !open ? `${record.body.slice(0, BODY_CLAMP_CHARS)}…` : record.body}
                          </div>
                        )}
                        {clamped && (
                          <button
                            type="button"
                            className={css.more}
                            onClick={() => {
                              setExpanded((current) => {
                                const next = new Set(current)
                                if (!next.delete(record.id)) next.add(record.id)
                                return next
                              })
                            }}
                          >
                            {open ? t('memory.collapse') : t('memory.expand')}
                          </button>
                        )}
                        <div className={css.meta}>
                          <span className={css.scope}>
                            {record.workspaceId === null ? t('memory.scope.global') : t('memory.scope.workspace')}
                          </span>
                          <span className={css.time}>{formatTime(record.updatedAt)}</span>
                        </div>
                      </div>
                      <div className={css.rowActions}>
                        <button
                          type="button"
                          className={css.danger}
                          disabled={busy}
                          onClick={() => { setPending({ record }) }}
                        >
                          {t('memory.delete')}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
        </>
      )}

      {pending !== undefined && (
        <div className={css.confirm} role="alertdialog" aria-modal="true">
          <p className={css.confirmText}>{t('memory.deleteConfirm')}</p>
          <div className={css.rowMain}>
            <div className={css.rowTitle}>
              <span className={css.kindTag}>{kindLabel(pending.record.kind, t)}</span>
              <span className={css.summary}>{pending.record.summary}</span>
            </div>
            {pending.record.body !== '' && <div className={css.body}>{pending.record.body}</div>}
          </div>
          <div className={css.confirmActions}>
            <button type="button" className={css.ghost} onClick={() => { setPending(undefined) }}>
              {t('memory.cancel')}
            </button>
            <button
              type="button"
              className={css.danger}
              onClick={() => { void confirm() }}
            >
              {t('memory.delete')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
