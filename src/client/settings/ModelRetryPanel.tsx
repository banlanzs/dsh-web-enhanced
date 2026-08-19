/**
 * Model-request retry settings: edits every enabled provider route's
 * bounded retry count through the host settings service. The value lives in
 * the owning adapter's settings namespace — `llm-deepseek` at its section
 * root, each pi-ai route at `providers.<route>.retryPolicy` — so saving here
 * is a settings write, not a web-enhanced config, and the provider
 * re-registers its route immediately, applying the new policy to the next
 * request.
 * @module dsh-web-enhanced/src/client/settings/ModelRetryPanel
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { ModelRetryConfigView, WebEnhancedProps } from '../contract.ts'
import css from './ModelRetryPanel.module.css'

/** The settings section props this panel actually uses. */
export type ModelRetryPanelProps = Pick<WebEnhancedProps<'settings.plugins.tab'>, 'remote' | 't'>

/** Load state of the retry policies. */
type State =
  | { readonly phase: 'loading' }
  | { readonly phase: 'ready'; readonly configs: readonly ModelRetryConfigView[]; readonly drafts: Readonly<Record<string, string>> }
  | { readonly phase: 'error'; readonly message: string }

/** Per-provider retry settings, one editable row per enabled route. */
export function ModelRetryPanel({ remote, t }: ModelRetryPanelProps) {
  const [state, setState] = useState<State>({ phase: 'loading' })
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const live = useRef(true)
  useEffect(() => () => { live.current = false }, [])

  const load = useCallback(async (): Promise<void> => {
    setState({ phase: 'loading' })
    const result = await remote.modelRetryGet()
    if (!live.current) return
    if ('error' in result) {
      setState({ phase: 'error', message: result.error.message })
      return
    }
    const drafts: Record<string, string> = {}
    for (const config of result.configs) {
      drafts[config.provider] = config.maxRetries === null ? '' : String(config.maxRetries)
    }
    setState({ phase: 'ready', configs: result.configs, drafts })
  }, [remote])

  useEffect(() => { void load() }, [load])

  const setDraft = (provider: string, text: string): void => {
    if (state.phase !== 'ready') return
    setSaved(null)
    setSaveError(null)
    setState({ ...state, drafts: { ...state.drafts, [provider]: text } })
  }

  const save = useCallback(async (config: ModelRetryConfigView): Promise<void> => {
    if (state.phase !== 'ready') return
    const draft = state.drafts[config.provider] ?? ''
    const maxRetries = Number(draft)
    if (!Number.isSafeInteger(maxRetries) || maxRetries < 0) return
    setSaving(config.provider)
    setSaved(null)
    setSaveError(null)
    const result = await remote.modelRetrySet({
      provider: config.provider,
      maxRetries,
      ...(config.revision === null ? {} : { expectedRevision: config.revision }),
    })
    if (!live.current) return
    setSaving(null)
    if ('error' in result) {
      setSaveError(result.error.message)
      return
    }
    setSaved(config.provider)
    // Reload: the namespace revision advanced and every sibling route shares it.
    void load()
  }, [load, remote, state])

  if (state.phase === 'loading') return <p className={css.note}>{t('modelRetry.loading')}</p>
  if (state.phase === 'error') return <p className={css.error}>{t('modelRetry.error', { message: state.message })}</p>
  if (state.configs.length === 0) return <p className={css.note}>{t('modelRetry.empty')}</p>

  return (
    <section className={css.panel} data-testid="model-retry-panel">
      <h3 className={css.title}>{t('modelRetry.title')}</h3>
      <p className={css.hint}>{t('modelRetry.hint')}</p>
      <div className={css.providers}>
        {state.configs.map(config => {
          const draft = state.drafts[config.provider] ?? ''
          const valid = draft !== '' && Number.isSafeInteger(Number(draft)) && Number(draft) >= 0
          const unchanged = config.maxRetries !== null && draft === String(config.maxRetries)
          const busy = saving === config.provider
          const label = config.displayName ?? (config.provider === 'deepseek-official' ? t('modelRetry.providerName') : config.provider)
          return (
            <div className={css.providerCard} key={config.provider}>
              <div className={css.providerHead}>
                <span className={css.providerName} title={config.provider}>{label}</span>
                {!config.managed && <span className={css.unmanaged}>{t('modelRetry.unmanaged')}</span>}
                <span className={css.providerCurrent}>
                  {config.mode === 'always' ? t('modelRetry.unlimited') : String(config.maxRetries)}
                </span>
              </div>
              <div className={css.providerRow}>
                <label className={css.field}>
                  <span className={css.label}>{t('modelRetry.maxLabel')}</span>
                  <input
                    className={css.input}
                    type="number"
                    min={0}
                    step={1}
                    value={draft}
                    placeholder={t('modelRetry.placeholder')}
                    data-testid={`model-retry-input-${config.provider}`}
                    onChange={event => { setDraft(config.provider, event.target.value) }}
                  />
                </label>
                <button
                  type="button"
                  className={css.save}
                  disabled={busy || !config.writable || !valid || unchanged}
                  data-testid={`model-retry-save-${config.provider}`}
                  onClick={() => { void save(config) }}
                >
                  {t('modelRetry.save')}
                </button>
              </div>
              {!valid && draft !== '' && <p className={css.error}>{t('modelRetry.invalid')}</p>}
              {saved === config.provider && <p className={css.saved}>{t('modelRetry.saved')}</p>}
              <details className={css.backoff}>
                <summary className={css.backoffSummary}>{t('modelRetry.backoffTitle')}</summary>
                <dl className={css.facts}>
                  <dt>{t('modelRetry.initialDelay')}</dt>
                  <dd>{config.initialDelayMs}ms</dd>
                  <dt>{t('modelRetry.maxDelay')}</dt>
                  <dd>{config.maxDelayMs}ms</dd>
                  <dt>{t('modelRetry.jitter')}</dt>
                  <dd>{config.jitterRatio}</dd>
                </dl>
              </details>
            </div>
          )
        })}
      </div>
      {saveError !== null && <p className={css.error}>{t('modelRetry.saveError', { message: saveError })}</p>}
    </section>
  )
}