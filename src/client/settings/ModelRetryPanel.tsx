/**
 * Model-request retry settings: edits the DeepSeek provider's bounded retry
 * count through the host settings service. The value lives in the
 * `llm-deepseek` namespace (owned by the provider plugin), so saving here is
 * a settings write, not a web-enhanced config — and the provider re-registers
 * its route immediately, applying the new policy to the next request.
 * @module dsh-web-enhanced/src/client/settings/ModelRetryPanel
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { ModelRetryConfigView, WebEnhancedProps } from '../contract.ts'
import css from './ModelRetryPanel.module.css'

/** The settings section props this panel actually uses. */
export type ModelRetryPanelProps = Pick<WebEnhancedProps<'settings.section'>, 'remote' | 't'>

/** Load state of the retry policy. */
type State =
  | { readonly phase: 'loading' }
  | { readonly phase: 'ready'; readonly config: ModelRetryConfigView; readonly draft: string }
  | { readonly phase: 'error'; readonly message: string }

/** The DeepSeek retry settings panel. */
export function ModelRetryPanel({ remote, t }: ModelRetryPanelProps) {
  const [state, setState] = useState<State>({ phase: 'loading' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const live = useRef(true)
  useEffect(() => () => { live.current = false }, [])

  useEffect(() => {
    setState({ phase: 'loading' })
    void (async () => {
      const result = await remote.modelRetryGet()
      if (!live.current) return
      setState('error' in result
        ? { phase: 'error', message: result.error.message }
        : {
          phase: 'ready',
          config: result.config,
          draft: result.config.maxRetries === null ? '' : String(result.config.maxRetries),
        })
    })()
  }, [remote])

  const save = useCallback(async (): Promise<void> => {
    if (state.phase !== 'ready') return
    const maxRetries = Number(state.draft)
    if (!Number.isSafeInteger(maxRetries) || maxRetries < 0) return
    setSaving(true)
    setSaved(false)
    setSaveError(null)
    const result = await remote.modelRetrySet({
      maxRetries,
      ...(state.config.revision === null ? {} : { expectedRevision: state.config.revision }),
    })
    if (!live.current) return
    setSaving(false)
    if ('error' in result) {
      setSaveError(result.error.message)
      return
    }
    setState({
      phase: 'ready',
      config: { ...state.config, mode: 'normal', maxRetries, revision: result.revision },
      draft: String(maxRetries),
    })
    setSaved(true)
  }, [remote, state])

  if (state.phase === 'loading') return <p className={css.note}>{t('modelRetry.loading')}</p>
  if (state.phase === 'error') return <p className={css.error}>{t('modelRetry.error', { message: state.message })}</p>

  const valid = state.draft !== '' && Number.isSafeInteger(Number(state.draft)) && Number(state.draft) >= 0
  const unchanged = state.config.maxRetries !== null && state.draft === String(state.config.maxRetries)

  return (
    <section className={css.panel} data-testid="model-retry-panel">
      <h3 className={css.title}>{t('modelRetry.title')}</h3>
      <dl className={css.facts}>
        <dt>{t('modelRetry.provider')}</dt>
        <dd>{t('modelRetry.providerName')}</dd>
        <dt>{t('modelRetry.current')}</dt>
        <dd>{state.config.maxRetries === null ? t('modelRetry.unlimited') : String(state.config.maxRetries)}</dd>
      </dl>
      <p className={css.hint}>{t('modelRetry.hint')}</p>
      <label className={css.field}>
        <span className={css.label}>{t('modelRetry.maxLabel')}</span>
        <input
          className={css.input}
          type="number"
          min={0}
          step={1}
          value={state.draft}
          placeholder={t('modelRetry.placeholder')}
          data-testid="model-retry-input"
          onChange={event => {
            setSaved(false)
            setSaveError(null)
            setState({ ...state, draft: event.target.value })
          }}
        />
      </label>
      {!valid && state.draft !== '' && <p className={css.error}>{t('modelRetry.invalid')}</p>}
      <button
        type="button"
        className={css.save}
        disabled={saving || !valid || unchanged}
        data-testid="model-retry-save"
        onClick={() => { void save() }}
      >
        {t('modelRetry.save')}
      </button>
      {saved && <p className={css.saved}>{t('modelRetry.saved')}</p>}
      {saveError !== null && <p className={css.error}>{t('modelRetry.saveError', { message: saveError })}</p>}
      <h4 className={css.subtitle}>{t('modelRetry.backoffTitle')}</h4>
      <dl className={css.facts}>
        <dt>{t('modelRetry.initialDelay')}</dt>
        <dd>{state.config.initialDelayMs}ms</dd>
        <dt>{t('modelRetry.maxDelay')}</dt>
        <dd>{state.config.maxDelayMs}ms</dd>
        <dt>{t('modelRetry.jitter')}</dt>
        <dd>{state.config.jitterRatio}</dd>
      </dl>
    </section>
  )
}
