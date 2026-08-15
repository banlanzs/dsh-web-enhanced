/**
 * Read-only status page of the image-understanding integration.
 *
 * The configuration itself is static plugin config (`cordis.patch.yml`, keys
 * prefixed `vision*`) because this plugin's other host settings are static
 * too; what this tab adds is evidence — whether the admission patch is live,
 * which transcription sources are usable right now, and the last failure.
 * @module dsh-web-enhanced/src/client/settings/VisionStatusPanel
 */

import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { VisionStatusView, WebEnhancedRemote } from '../contract.ts'
import type { Translate } from '../locale-keys.ts'
import css from './VisionStatusPanel.module.css'

/** Load state of the status view. */
type State =
  | { readonly phase: 'loading' }
  | { readonly phase: 'ready'; readonly value: VisionStatusView }
  | { readonly phase: 'error'; readonly message: string }

/** Props of the status pane (a plain child, not a slot registration). */
export interface VisionStatusPanelProps {
  readonly remote: WebEnhancedRemote
  readonly t: Translate
}

/** One key/value row. */
function Row({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className={css.row}>
      <div className={css.label}>{label}</div>
      <div className={css.value}>{children}</div>
    </div>
  )
}

/** Locale key of one apiKeySource value. */
function keySourceKey(source: VisionStatusView['apiKeySource']): 'vision.key.config' | 'vision.key.env' | 'vision.key.none-needed' | 'vision.key.unset' {
  switch (source) {
    case 'config': return 'vision.key.config'
    case 'env': return 'vision.key.env'
    case 'none-needed': return 'vision.key.none-needed'
    default: return 'vision.key.unset'
  }
}

/** The image-understanding status pane. */
export function VisionStatusPanel({ remote, t }: VisionStatusPanelProps) {
  const [state, setState] = useState<State>({ phase: 'loading' })

  const load = useCallback(async () => {
    setState({ phase: 'loading' })
    const result = await remote.visionStatus()
    if ('error' in result) setState({ phase: 'error', message: result.error.message })
    else setState({ phase: 'ready', value: result })
  }, [remote])

  useEffect(() => {
    void load()
  }, [load])

  const value = state.phase === 'ready' ? state.value : null

  return (
    <div className={css.root}>
      <div className={css.toolbar}>
        <button type="button" className={css.refresh} onClick={() => { void load() }}>{t('vision.refresh')}</button>
      </div>

      {state.phase === 'loading' && <p className={css.note}>{t('vision.loading')}</p>}
      {state.phase === 'error' && <p className={css.error}>{t('vision.error', { message: state.message })}</p>}

      {value !== null && (
        <div className={css.card}>
          {!value.mounted && <p className={css.warn}>{t('vision.notMounted')}</p>}
          <Row label={t('vision.enabled')}>
            <span className={value.enabled ? css.badgeOk : css.badgeMuted}>
              {value.enabled ? t('vision.on') : t('vision.off')}
            </span>
          </Row>
          <Row label={t('vision.admission')}>
            <span className={value.admissionActive ? css.badgeOk : css.badgeMuted}>
              {value.admissionActive ? t('vision.patched') : t('vision.notPatched')}
            </span>
          </Row>
          <Row label={t('vision.harnessTitle')}>
            {value.harnessModels.length === 0
              ? <span className={css.muted}>{t('vision.harnessNone')}</span>
              : <span className={css.list}>
                  {value.harnessModels.map(model => (
                    <code key={`${model.provider}/${model.model}`} className={css.code}>
                      {model.provider}/{model.model}
                    </code>
                  ))}
                </span>}
          </Row>
          <Row label={t('vision.endpointTitle')}>
            {value.endpointConfigured
              ? <code className={css.code}>{value.endpointModel}</code>
              : <span className={css.muted}>{t('vision.endpointNone')}</span>}
          </Row>
          <Row label={t('vision.keySource')}>
            <span className={css.muted}>{t(keySourceKey(value.apiKeySource))}</span>
          </Row>
          <Row label={t('vision.ollama')}>
            {value.ollamaDetected
              ? <span className={css.badgeOk}>{t('vision.ollamaModel', { model: value.ollamaModel ?? '' })}</span>
              : <span className={css.muted}>{t('vision.ollamaNone')}</span>}
          </Row>
          <Row label={t('vision.cache')}>
            <span className={css.muted}>{t('vision.cacheEntries', { count: String(value.cacheSize) })}</span>
          </Row>
          <Row label={t('vision.lastError')}>
            {value.lastError === null
              ? <span className={css.muted}>{t('vision.lastErrorNone')}</span>
              : <span className={css.failure}>{value.lastError}</span>}
          </Row>
        </div>
      )}

      <p className={css.hint}>{t('vision.hint')}</p>
    </div>
  )
}
