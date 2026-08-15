/**
 * The Vision tab: live configuration form + status.
 *
 * Configuration is a settings namespace (`dsh-web-enhanced-vision`) owned by
 * this plugin; saves go through the plugin gateway (`visionConfigGet` /
 * `visionConfigSet`) and the host-side interceptor watches the commit, so
 * changes apply immediately without a restart. The DSH provider/model selects
 * read the same directory the model picker renders, filtered to models that
 * declare image input. The dedicated API section is only used for image
 * transcription — it never registers into DSH's model channels.
 * @module dsh-web-enhanced/src/client/settings/VisionStatusPanel
 */

import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  VisionConfigPatch, VisionConfigView, VisionEndpointModelView, VisionStatusView,
  WebEnhancedRemote,
} from '../contract.ts'
import type { Translate } from '../locale-keys.ts'
import css from './VisionStatusPanel.module.css'

/** Editable form values (numbers stay strings while the user types). */
interface Draft {
  enabled: boolean
  patchAdmission: boolean
  provider: string
  model: string
  prompt: string
  marker: string
  baseUrl: string
  apiKeyInput: string
  endpointModel: string
  /** Candidate pool checked in the fetched model list. */
  endpointModels: string[]
  anonymous: boolean
  timeoutMs: string
  maxTokens: string
  autoLocalOllama: boolean
  localOllamaModel: string
  localOllamaUrl: string
  revision: number | null
}

function draftOf(value: VisionConfigView): Draft {
  return {
    enabled: value.enabled,
    patchAdmission: value.patchAdmission,
    provider: value.provider,
    model: value.model,
    prompt: value.prompt,
    marker: value.marker,
    baseUrl: value.baseUrl,
    apiKeyInput: '',
    endpointModel: value.endpointModel,
    endpointModels: [...value.endpointModels],
    anonymous: value.anonymous,
    timeoutMs: String(value.timeoutMs),
    maxTokens: String(value.maxTokens),
    autoLocalOllama: value.autoLocalOllama,
    localOllamaModel: value.localOllamaModel,
    localOllamaUrl: value.localOllamaUrl,
    revision: value.revision,
  }
}

/** One key/value row in the status card. */
function Row({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className={css.row}>
      <div className={css.label}>{label}</div>
      <div className={css.value}>{children}</div>
    </div>
  )
}

/** One labelled form field. */
function Field({ label, hint, children }: { readonly label: string; readonly hint?: string; readonly children: ReactNode }) {
  return (
    <div className={css.field}>
      <span className={css.fieldLabel}>{label}</span>
      {children}
      {hint !== undefined && <span className={css.fieldHint}>{hint}</span>}
    </div>
  )
}

/** Props of the pane (a plain child, not a slot registration). */
export interface VisionStatusPanelProps {
  readonly remote: WebEnhancedRemote
  readonly t: Translate
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

/** The Vision tab: configuration form above, live status below. */
export function VisionStatusPanel({ remote, t }: VisionStatusPanelProps) {
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState<string | null>(null)
  const [view, setView] = useState<VisionConfigView | null>(null)
  const [status, setStatus] = useState<VisionStatusView | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [discovered, setDiscovered] = useState<readonly VisionEndpointModelView[] | null>(null)
  const [discoveredTruncated, setDiscoveredTruncated] = useState(false)
  const [discovering, setDiscovering] = useState(false)
  const [discoverError, setDiscoverError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setConfigError(null)
    const [configResult, statusResult] = await Promise.all([
      remote.visionConfigGet(),
      remote.visionStatus(),
    ])
    if ('error' in statusResult) setStatus(null)
    else setStatus(statusResult)
    if ('error' in configResult) {
      setConfigError(configResult.error.message)
      setView(null)
      setDraft(null)
    } else {
      setView(configResult)
      setDraft(draftOf(configResult))
    }
    setLoading(false)
  }, [remote])

  useEffect(() => {
    void load()
  }, [load])

  /** Pull the dedicated endpoint's model list (one-shot key if typed). */
  const fetchModels = useCallback(async () => {
    if (draft === null) return
    setDiscovering(true)
    setDiscoverError(null)
    const result = await remote.visionEndpointModels({
      baseUrl: draft.baseUrl.trim(),
      ...(draft.apiKeyInput.trim() === '' ? {} : { apiKey: draft.apiKeyInput.trim() }),
      anonymous: draft.anonymous,
    })
    if ('error' in result) {
      setDiscoverError(result.error.message)
    } else {
      setDiscovered(result.models)
      setDiscoveredTruncated(result.truncated)
      // Keep the already-saved pool selection for this fetched list; the
      // first model the user checks becomes the active model when none is set.
      setDraft(current => current === null ? current : {
        ...current,
        endpointModels: result.models
          .filter(model => current.endpointModels.includes(model.id))
          .map(model => model.id),
      })
    }
    setDiscovering(false)
  }, [draft, remote])

  /** Check/uncheck one fetched model in the candidate pool. */
  const toggleEndpointModel = (id: string): void => {
    setDraft(current => {
      if (current === null) return current
      const checked = current.endpointModels.includes(id)
      const pool = checked
        ? current.endpointModels.filter(existing => existing !== id)
        : [...current.endpointModels, id]
      return {
        ...current,
        endpointModels: pool,
        endpointModel: current.endpointModel === '' && !checked ? id : current.endpointModel,
      }
    })
  }

  /** Providers that offer at least one image-capable model (picker source). */
  const visionProviders = (view?.providers ?? [])
    .filter(provider => provider.models.some(model => model.supportsImage))

  const save = useCallback(async (patch: VisionConfigPatch) => {
    if (draft === null) return
    setSaving(true)
    setSaved(false)
    setSaveError(null)
    const request = {
      patch,
      ...(draft.revision === null ? {} : { expectedRevision: draft.revision }),
    }
    const result = await remote.visionConfigSet(request)
    if ('error' in result) {
      if (result.error.code === 'vision-config-conflict') {
        await load()
        setSaveError(t('vision.form.conflict'))
      } else {
        setSaveError(result.error.message)
      }
    } else {
      setDraft(current => current === null ? current : { ...current, revision: result.revision, apiKeyInput: '' })
      await load()
      setSaved(true)
    }
    setSaving(false)
  }, [draft, load, remote, t])

  const submit = (): void => {
    if (draft === null) return
    const timeoutMs = Number(draft.timeoutMs)
    const maxTokens = Number(draft.maxTokens)
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || !Number.isFinite(maxTokens) || maxTokens <= 0) {
      setSaveError(t('vision.form.invalidNumber'))
      return
    }
    const patch: VisionConfigPatch = {
      enabled: draft.enabled,
      patchAdmission: draft.patchAdmission,
      provider: draft.provider,
      model: draft.provider === '' ? '' : draft.model,
      prompt: draft.prompt,
      marker: draft.marker,
      baseUrl: draft.baseUrl.trim(),
      endpointModel: draft.endpointModel.trim(),
      endpointModels: [...draft.endpointModels],
      anonymous: draft.anonymous,
      timeoutMs,
      maxTokens,
      autoLocalOllama: draft.autoLocalOllama,
      localOllamaModel: draft.localOllamaModel.trim(),
      localOllamaUrl: draft.localOllamaUrl.trim(),
    }
    if (draft.apiKeyInput.trim() !== '') patch.apiKey = draft.apiKeyInput.trim()
    void save(patch)
  }

  if (loading && status === null && draft === null) return <p className={css.note}>{t('vision.loading')}</p>

  return (
    <div className={css.root}>
      {configError !== null && <p className={css.warn}>{t('vision.form.unavailable', { message: configError })}</p>}

      {draft !== null && (
        <div className={css.form}>
          <section className={css.section}>
            <h3 className={css.sectionTitle}>{t('vision.form.switchesTitle')}</h3>
            <div className={css.checks}>
              <Field label={t('vision.form.enabled')} hint={t('vision.form.enabledHint')}>
                <input type="checkbox" checked={draft.enabled} onChange={event => { setDraft({ ...draft, enabled: event.target.checked }) }} />
              </Field>
              <Field label={t('vision.form.patchAdmission')} hint={t('vision.form.patchAdmissionHint')}>
                <input type="checkbox" checked={draft.patchAdmission} onChange={event => { setDraft({ ...draft, patchAdmission: event.target.checked }) }} />
              </Field>
            </div>
          </section>

          <section className={css.section}>
            <h3 className={css.sectionTitle}>{t('vision.form.harnessTitle')}</h3>
            <p className={css.sectionHint}>{t('vision.form.harnessHint')}</p>
            <Field label={t('vision.form.provider')}>
              <select
                className={css.input}
                value={draft.provider}
                onChange={event => {
                  const provider = event.target.value
                  setDraft(current => current === null ? current : { ...current, provider, model: '' })
                }}
              >
                <option value="">{t('vision.form.providerAuto')}</option>
                {visionProviders.map(provider => (
                  <option key={provider.provider} value={provider.provider}>{provider.name}</option>
                ))}
                {draft.provider !== '' && !visionProviders.some(provider => provider.provider === draft.provider) && (
                  <option value={draft.provider}>{view?.providers.find(provider => provider.provider === draft.provider)?.name ?? draft.provider}</option>
                )}
              </select>
            </Field>
            {visionProviders.length === 0 && <p className={css.sectionHint}>{t('vision.form.noImageModels')}</p>}
            {draft.provider !== '' && (
              <Field label={t('vision.form.model')} hint={t('vision.form.modelHint')}>
                <select
                  className={css.input}
                  value={draft.model}
                  onChange={event => { setDraft({ ...draft, model: event.target.value }) }}
                >
                  {visionProviders
                    .find(provider => provider.provider === draft.provider)
                    ?.models.filter(model => model.supportsImage)
                    .map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                  {draft.model !== '' && !visionProviders.some(provider => provider.provider === draft.provider
                    && provider.models.some(model => model.id === draft.model && model.supportsImage)) && (
                    <option value={draft.model}>{draft.model}</option>
                  )}
                </select>
              </Field>
            )}
          </section>

          <section className={css.section}>
            <h3 className={css.sectionTitle}>{t('vision.form.endpointTitle')}</h3>
            <p className={css.sectionHint}>{t('vision.form.endpointHint')}</p>
            <div className={css.grid}>
              <Field label={t('vision.form.baseUrl')}>
                <input className={css.input} value={draft.baseUrl} placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
                  onChange={event => { setDraft({ ...draft, baseUrl: event.target.value }) }} />
              </Field>
              <Field label={t('vision.form.endpointModel')} hint={t('vision.form.endpointModelHint')}>
                {draft.endpointModels.length > 0
                  ? (
                      <select className={css.input} value={draft.endpointModel}
                        onChange={event => { setDraft({ ...draft, endpointModel: event.target.value }) }}>
                        {draft.endpointModels.map(id => <option key={id} value={id}>{id}</option>)}
                        {draft.endpointModel !== '' && !draft.endpointModels.includes(draft.endpointModel) && (
                          <option value={draft.endpointModel}>{draft.endpointModel}</option>
                        )}
                      </select>
                    )
                  : (
                      <input className={css.input} value={draft.endpointModel} placeholder="qwen3.7-flash"
                        onChange={event => { setDraft({ ...draft, endpointModel: event.target.value }) }} />
                    )}
              </Field>
              <Field label={t('vision.form.apiKey')} hint={t('vision.form.apiKeyHint')}>
                <div className={css.keyRow}>
                  <input className={css.input} type="password" value={draft.apiKeyInput} placeholder={t('vision.form.apiKeyPlaceholder')}
                    onChange={event => { setDraft({ ...draft, apiKeyInput: event.target.value }) }} />
                  <button type="button" className={css.minorButton} onClick={() => {
                    setSaveError(null)
                    setDraft(current => current === null ? current : { ...current, apiKeyInput: '' })
                    void save({ apiKey: '' })
                  }}>
                    {t('vision.form.apiKeyClear')}
                  </button>
                </div>
              </Field>
              <Field label={t('vision.form.anonymous')}>
                <input type="checkbox" checked={draft.anonymous} onChange={event => { setDraft({ ...draft, anonymous: event.target.checked }) }} />
              </Field>
              <Field label={t('vision.form.timeout')}>
                <input className={css.input} inputMode="numeric" value={draft.timeoutMs}
                  onChange={event => { setDraft({ ...draft, timeoutMs: event.target.value }) }} />
              </Field>
              <Field label={t('vision.form.maxTokens')}>
                <input className={css.input} inputMode="numeric" value={draft.maxTokens}
                  onChange={event => { setDraft({ ...draft, maxTokens: event.target.value }) }} />
              </Field>
            </div>

            <div className={css.poolBlock}>
              <div className={css.poolToolbar}>
                <button type="button" className={css.minorButton}
                  disabled={discovering || draft.baseUrl.trim() === ''}
                  onClick={() => { void fetchModels() }}>
                  {discovering ? t('vision.form.fetchingModels') : t('vision.form.fetchModels')}
                </button>
                {discovered !== null && (
                  <span className={css.fieldHint}>
                    {t('vision.form.fetchedCount', { count: String(discovered.length) })}
                    {discoveredTruncated ? ` · ${t('vision.form.fetchedTruncated')}` : ''}
                  </span>
                )}
              </div>
              {discoverError !== null && <p className={css.failure}>{t('vision.form.fetchError', { message: discoverError })}</p>}
              {discovered !== null && discovered.length > 0 && (
                <div className={css.poolList}>
                  {discovered.map(model => (
                    <label key={model.id} className={css.poolRow}>
                      <input type="checkbox" checked={draft.endpointModels.includes(model.id)}
                        onChange={() => { toggleEndpointModel(model.id) }} />
                      <span className={css.poolName}>{model.name === model.id ? model.id : `${model.name}（${model.id}）`}</span>
                    </label>
                  ))}
                </div>
              )}
              {discovered !== null && discovered.length === 0 && (
                <p className={css.sectionHint}>{t('vision.form.noFetchedModels')}</p>
              )}
              {discovered === null && <p className={css.sectionHint}>{t('vision.form.poolHint')}</p>}
            </div>
          </section>

          <section className={css.section}>
            <h3 className={css.sectionTitle}>{t('vision.form.ollamaTitle')}</h3>
            <div className={css.grid}>
              <Field label={t('vision.form.autoLocalOllama')}>
                <input type="checkbox" checked={draft.autoLocalOllama} onChange={event => { setDraft({ ...draft, autoLocalOllama: event.target.checked }) }} />
              </Field>
              <Field label={t('vision.form.localOllamaUrl')}>
                <input className={css.input} value={draft.localOllamaUrl}
                  onChange={event => { setDraft({ ...draft, localOllamaUrl: event.target.value }) }} />
              </Field>
              <Field label={t('vision.form.localOllamaModel')} hint={t('vision.form.localOllamaModelHint')}>
                <input className={css.input} value={draft.localOllamaModel}
                  onChange={event => { setDraft({ ...draft, localOllamaModel: event.target.value }) }} />
              </Field>
            </div>
          </section>

          <section className={css.section}>
            <h3 className={css.sectionTitle}>{t('vision.form.promptTitle')}</h3>
            <Field label={t('vision.form.prompt')}>
              <textarea className={css.textarea} value={draft.prompt}
                onChange={event => { setDraft({ ...draft, prompt: event.target.value }) }} />
            </Field>
            <Field label={t('vision.form.marker')}>
              <input className={css.input} value={draft.marker}
                onChange={event => { setDraft({ ...draft, marker: event.target.value }) }} />
            </Field>
          </section>

          <div className={css.actions}>
            <button type="button" className={css.save} disabled={saving} onClick={submit}>
              {saving ? t('vision.form.saving') : t('vision.form.save')}
            </button>
            {saved && <span className={css.saved}>{t('vision.form.saved')}</span>}
            {saveError !== null && <span className={css.failure}>{t('vision.form.saveError', { message: saveError })}</span>}
          </div>
        </div>
      )}

      <h3 className={css.sectionTitle}>{t('vision.statusTitle')}</h3>
      {status === null
        ? <p className={css.note}>{t('vision.loading')}</p>
        : <div className={css.card}>
            {!status.mounted && <p className={css.warn}>{t('vision.notMounted')}</p>}
            <Row label={t('vision.enabled')}>
              <span className={status.enabled ? css.badgeOk : css.badgeMuted}>
                {status.enabled ? t('vision.on') : t('vision.off')}
              </span>
            </Row>
            <Row label={t('vision.admission')}>
              <span className={status.admissionActive ? css.badgeOk : css.badgeMuted}>
                {status.admissionActive ? t('vision.patched') : t('vision.notPatched')}
              </span>
            </Row>
            <Row label={t('vision.harnessTitle')}>
              {status.harnessModels.length === 0
                ? <span className={css.muted}>{t('vision.harnessNone')}</span>
                : <span className={css.list}>
                    {status.harnessModels.map(model => (
                      <code key={`${model.provider}/${model.model}`} className={css.code}>
                        {model.provider}/{model.model}
                      </code>
                    ))}
                  </span>}
            </Row>
            <Row label={t('vision.endpointTitle')}>
              {status.endpointConfigured
                ? <code className={css.code}>{status.endpointModel}</code>
                : <span className={css.muted}>{t('vision.endpointNone')}</span>}
            </Row>
            <Row label={t('vision.keySource')}>
              <span className={css.muted}>{t(keySourceKey(status.apiKeySource))}</span>
            </Row>
            <Row label={t('vision.ollama')}>
              {status.ollamaDetected
                ? <span className={css.badgeOk}>{t('vision.ollamaModel', { model: status.ollamaModel ?? '' })}</span>
                : <span className={css.muted}>{t('vision.ollamaNone')}</span>}
            </Row>
            <Row label={t('vision.cache')}>
              <span className={css.muted}>{t('vision.cacheEntries', { count: String(status.cacheSize) })}</span>
            </Row>
            <Row label={t('vision.lastError')}>
              {status.lastError === null
                ? <span className={css.muted}>{t('vision.lastErrorNone')}</span>
                : <span className={css.failure}>{status.lastError}</span>}
            </Row>
          </div>}

      <p className={css.hint}>{t('vision.hint')}</p>
    </div>
  )
}
