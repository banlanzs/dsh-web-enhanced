/**
 * Global Prompt tab of the plugin's Settings page.
 *
 * The namespace is owned and schema-registered by the host half
 * (`src/global-prompt.ts`). Reads and writes go through this plugin's own
 * Typert gateway (`globalPromptGet` / `globalPromptSet`), not the host
 * `settings.describe` RPCs: a plugin-owned namespace is not on the
 * api-proxy settings allowlist, so the generic browser settings RPCs would
 * never list it. The host section's text provider re-reads the resolved
 * value on every prompt assembly, so a successful save reaches the next
 * model request without a restart.
 * @module dsh-web-enhanced/src/client/global-prompt/GlobalPromptPanel
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { GLOBAL_PROMPT_MAX_CHARS } from '../../types.ts'
import type { WebEnhancedRemote } from '../contract.ts'
import type { Translate } from '../locale-keys.ts'
import { validateGlobalPromptDraft } from './draft.ts'
import type { GlobalPromptDraft } from './draft.ts'
import css from './GlobalPromptPanel.module.css'

/** Props of the tab (a plain child of the plugin's Settings section). */
export interface GlobalPromptPanelProps {
  readonly remote: WebEnhancedRemote
  readonly t: Translate
}

/** Load phase of the tab. */
type Phase = 'loading' | 'ready' | 'error'

/** The Global Prompt tab: one switch, one text block, CAS save. */
export function GlobalPromptPanel({ remote, t }: GlobalPromptPanelProps) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [loadError, setLoadError] = useState('')
  const [writable, setWritable] = useState(false)
  const [revision, setRevision] = useState<number | null>(null)
  const [base, setBase] = useState<GlobalPromptDraft>({ enabled: false, text: '' })
  const [draft, setDraft] = useState<GlobalPromptDraft>({ enabled: false, text: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const generation = useRef(0)

  /** Read the gateway's view of the namespace and anchor the draft on it. */
  const load = useCallback(async () => {
    const current = ++generation.current
    setPhase('loading')
    setLoadError('')
    setSaved(false)
    try {
      const result = await remote.globalPromptGet()
      if ('error' in result) throw new Error(result.error.message)
      const next: GlobalPromptDraft = { enabled: result.enabled, text: result.text }
      if (current !== generation.current) return
      setWritable(result.writable)
      setRevision(result.revision)
      setBase(next)
      setDraft(next)
      setPhase('ready')
    } catch (error) {
      if (current !== generation.current) return
      setLoadError(error instanceof Error ? error.message : String(error))
      setPhase('error')
    }
  }, [remote])

  useEffect(() => {
    void load()
  }, [load])

  const dirty = JSON.stringify(base) !== JSON.stringify(draft)
  const tooLong = draft.text.length > GLOBAL_PROMPT_MAX_CHARS
  const saveDisabled = saving || !dirty || tooLong || revision === null || !writable

  const save = async (): Promise<void> => {
    if (revision === null) return
    setSaving(true)
    setSaved(false)
    setSaveError('')
    const failure = validateGlobalPromptDraft(draft, GLOBAL_PROMPT_MAX_CHARS)
    if (failure !== undefined) {
      setSaveError(t('globalPrompt.tooLong', { max: String(GLOBAL_PROMPT_MAX_CHARS) }))
      setSaving(false)
      return
    }
    const result = await remote.globalPromptSet({
      enabled: draft.enabled,
      text: draft.text,
      expectedRevision: revision,
    })
    if ('error' in result) {
      setSaveError(result.error.code === 'global-prompt-config-conflict'
        ? t('globalPrompt.conflict')
        : result.error.message)
    } else {
      setBase(draft)
      setDraft(draft)
      setRevision(result.revision)
      setSaved(true)
    }
    setSaving(false)
  }

  if (phase === 'error') {
    return (
      <div className={css.root}>
        <p className={css.failure}>{t('globalPrompt.loadFailed', { message: loadError })}</p>
        <button type="button" className={css.minorButton} onClick={() => { void load() }}>
          {t('globalPrompt.reload')}
        </button>
      </div>
    )
  }

  return (
    <div className={css.root}>
      <section className={css.section}>
        <h3 className={css.sectionTitle}>{t('globalPrompt.title')}</h3>
        <p className={css.hint}>{t('globalPrompt.hint')}</p>
        <label className={css.switchRow}>
          <input
            type="checkbox"
            checked={draft.enabled}
            disabled={phase !== 'ready' || !writable}
            onChange={(event) => {
              setDraft(previous => ({ ...previous, enabled: event.target.checked }))
              setSaved(false)
            }}
          />
          <span>{t('globalPrompt.enabled')}</span>
        </label>
        <div className={css.field}>
          <span className={css.fieldLabel}>{t('globalPrompt.text')}</span>
          <textarea
            className={css.textarea}
            value={draft.text}
            disabled={phase !== 'ready' || !writable}
            placeholder={t('globalPrompt.placeholder')}
            onChange={(event) => {
              setDraft(previous => ({ ...previous, text: event.target.value }))
              setSaved(false)
            }}
          />
          <span className={css.fieldHint}>
            {t('globalPrompt.count', {
              used: String(draft.text.length),
              max: String(GLOBAL_PROMPT_MAX_CHARS),
            })}
          </span>
        </div>
        <div className={css.actions}>
          <button
            type="button"
            className={css.save}
            disabled={saveDisabled || phase !== 'ready'}
            onClick={() => { void save() }}
          >
            {saving ? t('globalPrompt.saving') : t('globalPrompt.save')}
          </button>
          <button
            type="button"
            className={css.minorButton}
            disabled={saving || phase !== 'ready'}
            onClick={() => { void load() }}
          >
            {t('globalPrompt.reload')}
          </button>
          {saved && <span className={css.saved}>{t('globalPrompt.saved')}</span>}
        </div>
        {tooLong && <p className={css.failure}>{t('globalPrompt.tooLong', { max: String(GLOBAL_PROMPT_MAX_CHARS) })}</p>}
        {saveError !== '' && <p className={css.failure}>{t('globalPrompt.saveError', { message: saveError })}</p>}
      </section>
    </div>
  )
}
