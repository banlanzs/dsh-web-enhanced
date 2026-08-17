/**
 * Global Prompt tab of the plugin's Settings page.
 *
 * The namespace is owned and schema-registered by the host half
 * (`src/global-prompt.ts`); this tab only reads the redacted user layer and
 * writes the two top-level keys through the standard `settings.mutate` CAS
 * RPC. The host section's text provider re-reads the resolved value on every
 * prompt assembly, so a successful save reaches the next model request
 * without a restart.
 * @module dsh-web-enhanced/src/client/global-prompt/GlobalPromptPanel
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import { GLOBAL_PROMPT_MAX_CHARS, GLOBAL_PROMPT_SETTINGS_NS } from '../../types.ts'
import type { Translate } from '../locale-keys.ts'
import {
  applyDraft, messageOf, recordOf,
} from '../model-capabilities/settings-draft.ts'
import {
  globalPromptDraftOf, globalPromptRecordOf, validateGlobalPromptDraft,
} from './draft.ts'
import type { GlobalPromptDraft } from './draft.ts'
import css from './GlobalPromptPanel.module.css'

/** Props of the tab (a plain child of the plugin's Settings section). */
export interface GlobalPromptPanelProps {
  readonly api: Pick<IApiClient, 'settings'>
  readonly t: Translate
}

/** Load phase of the tab. */
type Phase = 'loading' | 'ready' | 'error'

/** The Global Prompt tab: one switch, one text block, CAS save. */
export function GlobalPromptPanel({ api, t }: GlobalPromptPanelProps) {
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

  /** Read the namespace view and anchor the draft on its current user layer. */
  const load = useCallback(async () => {
    const current = ++generation.current
    setPhase('loading')
    setLoadError('')
    setSaved(false)
    try {
      const response = await api.settings.describe({})
      if (!response.result.ok) throw new Error(response.result.error.message)
      const view = response.result.value.namespaces.find(entry => entry.ns === GLOBAL_PROMPT_SETTINGS_NS)
      if (view === undefined) throw new Error(t('globalPrompt.namespaceMissing'))
      const next = globalPromptDraftOf(recordOf(view.user))
      if (current !== generation.current) return
      setWritable(response.result.value.writable)
      setRevision(view.revision)
      setBase(next)
      setDraft(next)
      setPhase('ready')
    } catch (error) {
      if (current !== generation.current) return
      setLoadError(messageOf(error))
      setPhase('error')
    }
  }, [api, t])

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
    const result = await applyDraft({
      api,
      ns: GLOBAL_PROMPT_SETTINGS_NS,
      path: [],
      before: globalPromptRecordOf(base),
      after: globalPromptRecordOf(draft),
      expectedRevision: revision,
      conflictText: t('globalPrompt.conflict'),
    })
    if (result.ok) {
      const committed = globalPromptDraftOf(recordOf(result.committed))
      setBase(committed)
      setDraft(committed)
      setRevision(result.revision)
      setSaved(true)
    } else {
      setSaveError(result.failure)
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
