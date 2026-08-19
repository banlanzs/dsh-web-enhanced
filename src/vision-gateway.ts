/**
 * Vision domain service: the image-understanding status and config remotes.
 *
 * The gateway delegates its vision* methods here; this module owns the
 * settings projection, the picker options, the endpoint model listing, and
 * the vision slice of the plugin config. The interception runtime itself
 * lives in `./vision.ts` — this is only its wire face.
 * @module dsh-web-enhanced/src/vision-gateway
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { errorOf } from './error.ts'
import { settingsFace } from './faces.ts'
import type { LlmVisionDirectoryFace, VisionIntegrationFace } from './faces.ts'
import {
  classifyVisionHttpError, DEFAULT_VISION_MARKER, DEFAULT_VISION_PROMPT, resolveVisionApiKey,
  VISION_SETTINGS_NS,
} from './vision.ts'
import type { VisionSettingsValue } from './vision.ts'
import type {
  VisionConfigGetResult, VisionConfigPatch, VisionConfigSaveRequest, VisionConfigSetResult,
  VisionEndpointModelView, VisionEndpointModelsRequest, VisionEndpointModelsResult,
  VisionFallbackConfig, VisionModelOptionView, VisionProviderOptionView, VisionStatusResult,
  VisionStatusView,
} from './types.ts'

/** Settings keys the Vision tab may edit (everything else is read-only). */
const VISION_CONFIG_EDITABLE_KEYS: ReadonlySet<string> = new Set([
  'enabled', 'patchAdmission', 'provider', 'model', 'harnessModels', 'prompt', 'marker',
  'baseUrl', 'apiKey', 'endpointModel', 'endpointModels', 'anonymous', 'timeoutMs',
  'maxTokens', 'autoLocalOllama', 'localOllamaModel', 'localOllamaUrl',
  'cacheLimit', 'cooldownMs',
])

/** Most models one endpoint listing returns before the rest is dropped. */
const VISION_ENDPOINT_MODEL_LIMIT = 200

/** The vision slice of the plugin config (user input; defaults bind later). */
export interface VisionConfigInput {
  visionEnabled?: boolean
  visionPatchAdmission?: boolean
  visionPrompt?: string
  visionMarker?: string
  visionProvider?: string
  visionModel?: string
  /** User-selected DSH model pool; non-empty replaces auto-detection. */
  visionHarnessModels?: Array<{ provider: string; model: string }>
  visionBaseUrl?: string
  visionApiKey?: string
  visionApiKeyEnv?: string
  visionEndpointModel?: string
  /** Candidate pool for the dedicated endpoint; the active model is one of them. */
  visionEndpointModels?: string[]
  visionAnonymous?: boolean
  visionTimeoutMs?: number
  visionMaxTokens?: number
  visionAutoLocalOllama?: boolean
  visionLocalOllamaModel?: string
  visionLocalOllamaUrl?: string
  visionFallbackModels?: VisionFallbackConfig[]
  visionCacheLimit?: number
  visionCooldownMs?: number
}

/**
 * The vision config fragment, as the plugin schema assembles it.
 *
 * The interception core is transparent (images stay in the UI, text-only
 * models see the description) and the transcription engine tries, in order:
 * DSH-configured vision models, local Ollama, then the configured
 * OpenAI-compatible endpoint with its fallback chain.
 */
export const visionConfigFragment: z<Required<VisionConfigInput>> = z.object({
  visionEnabled: z.boolean().default(true),
  visionPatchAdmission: z.boolean().default(true),
  visionPrompt: z.string().default(DEFAULT_VISION_PROMPT),
  visionMarker: z.string().default(DEFAULT_VISION_MARKER),
  visionProvider: z.string().default(''),
  visionModel: z.string().default(''),
  visionHarnessModels: z.array(z.object({
    provider: z.string(),
    model: z.string(),
  })).default([]),
  visionBaseUrl: z.string().default(''),
  visionApiKey: z.string().role('secret').default(''),
  visionApiKeyEnv: z.string().default('VISION_API_KEY'),
  visionEndpointModel: z.string().default(''),
  visionEndpointModels: z.array(z.string()).default([]),
  visionAnonymous: z.boolean().default(false),
  visionTimeoutMs: z.number().default(120_000),
  visionMaxTokens: z.number().default(4_096),
  visionAutoLocalOllama: z.boolean().default(true),
  visionLocalOllamaModel: z.string().default(''),
  visionLocalOllamaUrl: z.string().default('http://localhost:11434/v1'),
  visionFallbackModels: z.array(z.object({
    model: z.string(),
    baseURL: z.string().default(''),
    apiKey: z.string().role('secret').default(''),
    anonymous: z.boolean().default(false),
    timeoutMs: z.number().default(0),
  })).default([]),
  visionCacheLimit: z.number().default(200),
  visionCooldownMs: z.number().default(60_000),
})

/** Field defaults applied when the vision domain is assembled directly. */
export function resolveVisionConfig(config: Partial<VisionConfigInput>): Required<VisionConfigInput> {
  return {
    visionEnabled: config.visionEnabled ?? true,
    visionPatchAdmission: config.visionPatchAdmission ?? true,
    visionPrompt: config.visionPrompt ?? DEFAULT_VISION_PROMPT,
    visionMarker: config.visionMarker ?? DEFAULT_VISION_MARKER,
    visionProvider: config.visionProvider ?? '',
    visionModel: config.visionModel ?? '',
    visionHarnessModels: config.visionHarnessModels ?? [],
    visionBaseUrl: config.visionBaseUrl ?? '',
    visionApiKey: config.visionApiKey ?? '',
    visionApiKeyEnv: config.visionApiKeyEnv ?? 'VISION_API_KEY',
    visionEndpointModel: config.visionEndpointModel ?? '',
    visionEndpointModels: config.visionEndpointModels ?? [],
    visionAnonymous: config.visionAnonymous ?? false,
    visionTimeoutMs: config.visionTimeoutMs ?? 120_000,
    visionMaxTokens: config.visionMaxTokens ?? 4_096,
    visionAutoLocalOllama: config.visionAutoLocalOllama ?? true,
    visionLocalOllamaModel: config.visionLocalOllamaModel ?? '',
    visionLocalOllamaUrl: config.visionLocalOllamaUrl ?? 'http://localhost:11434/v1',
    visionFallbackModels: config.visionFallbackModels ?? [],
    visionCacheLimit: config.visionCacheLimit ?? 200,
    visionCooldownMs: config.visionCooldownMs ?? 60_000,
  }
}

/** The vision wire capabilities, as the gateway consumes them. */
export interface VisionDomainFace {
  status(): Promise<VisionStatusResult>
  configGet(): Promise<VisionConfigGetResult>
  configSet(request: VisionConfigSaveRequest): Promise<VisionConfigSetResult>
  endpointModels(request: VisionEndpointModelsRequest): Promise<VisionEndpointModelsResult>
}

/**
 * Assemble the vision wire domain.
 * @param ctx - the owning context; settings, llm, and the integration service
 *   are all read per call and all optional.
 * @returns the vision wire capabilities.
 */
export function createVisionDomain(ctx: Context): VisionDomainFace {
  /** The live integration status, or the explicit unmounted state. */
  const statusView = async (): Promise<VisionStatusView> => {
    const service = ctx.get('visionIntegration' as never, false) as unknown as VisionIntegrationFace | undefined
    if (service === undefined) {
      return {
        mounted: false,
        enabled: false,
        patchAdmission: false,
        admissionActive: false,
        harnessModels: [],
        endpointConfigured: false,
        endpointModel: null,
        apiKeySource: 'unset',
        ollamaDetected: false,
        ollamaModel: null,
        cacheSize: 0,
        lastError: 'the vision integration service is not mounted in this deployment',
        failures: [],
      }
    }
    return await service.status()
  }

  /** Providers and models for the Vision tab, from the model picker's source. */
  const providerOptions = async (): Promise<VisionProviderOptionView[]> => {
    const llm = ctx.get('llm' as never, false) as unknown as LlmVisionDirectoryFace | undefined
    if (llm === undefined || typeof llm.listProviders !== 'function') return []
    const options: VisionProviderOptionView[] = []
    for (const provider of llm.listProviders()) {
      try {
        const models = await llm.listModels(provider.id)
        options.push({
          provider: provider.id,
          name: provider.name ?? provider.id,
          models: models.map((model): VisionModelOptionView => ({
            id: model.id,
            name: model.name ?? model.id,
            supportsImage: (model.inputModalities ?? []).includes('image'),
          })),
        })
      } catch {
        // A provider that cannot answer its model list offers no options.
      }
    }
    return options
  }

  return {
    /**
     * Live state of the image-understanding integration: whether the admission
     * patch is active, which vision models/endpoints the transcription engine
     * can use, and its last failure. Read lazily so a deployment that mounts no
     * integration reports that state instead of throwing.
     */
    async status() {
      try {
        return await statusView()
      } catch (error) {
        return { error: errorOf(error, 'vision-status') }
      }
    },

    /**
     * The editable vision configuration plus the picker options and the live
     * status, all in one read. The API key is never returned.
     */
    async configGet() {
      try {
        const settings = settingsFace(ctx)
        if (settings === undefined) {
          return { error: { code: 'vision-settings-unavailable', message: 'the settings service is not mounted in this deployment' } }
        }
        const raw = settings.get(VISION_SETTINGS_NS as never) as VisionSettingsValue | undefined
        if (raw === undefined || typeof raw !== 'object') {
          return { error: { code: 'vision-settings-unmanaged', message: `settings namespace '${VISION_SETTINGS_NS}' is not registered` } }
        }
        const descriptor = settings.describe().find(entry => entry.ns === VISION_SETTINGS_NS)
        return {
          managed: true,
          writable: settings.writable,
          revision: descriptor?.revision ?? null,
          enabled: raw.enabled,
          patchAdmission: raw.patchAdmission,
          provider: raw.provider,
          model: raw.model,
          harnessModels: raw.harnessModels,
          prompt: raw.prompt,
          marker: raw.marker,
          baseUrl: raw.baseUrl,
          apiKeySet: raw.apiKey !== '',
          apiKeyEnv: raw.apiKeyEnv,
          endpointModel: raw.endpointModel,
          endpointModels: raw.endpointModels,
          anonymous: raw.anonymous,
          timeoutMs: raw.timeoutMs,
          maxTokens: raw.maxTokens,
          autoLocalOllama: raw.autoLocalOllama,
          localOllamaModel: raw.localOllamaModel,
          localOllamaUrl: raw.localOllamaUrl,
          fallbackCount: raw.fallbackModels.length,
          cacheLimit: raw.cacheLimit,
          cooldownMs: raw.cooldownMs,
          providers: await providerOptions(),
          status: await statusView(),
        }
      } catch (error) {
        return { error: errorOf(error, 'vision-config') }
      }
    },

    /**
     * Save one vision-config patch into the settings namespace. The namespace
     * owner (`VisionInterceptor`) watches the commit and reconfigures live, so
     * no restart is needed; `expectedRevision` gives the save CAS semantics.
     */
    async configSet(request) {
      try {
        const settings = settingsFace(ctx)
        if (settings === undefined) {
          return { error: { code: 'vision-settings-unavailable', message: 'the settings service is not mounted in this deployment' } }
        }
        if (!settings.writable) {
          return { error: { code: 'vision-settings-readonly', message: 'the settings provider is read-only' } }
        }
        const raw = settings.get(VISION_SETTINGS_NS as never)
        if (raw === undefined) {
          return { error: { code: 'vision-settings-unmanaged', message: `settings namespace '${VISION_SETTINGS_NS}' is not registered` } }
        }
        const patch: Record<string, unknown> = {}
        const source = request.patch as VisionConfigPatch | undefined
        if (source !== undefined) {
          for (const [key, value] of Object.entries(source)) {
            if (VISION_CONFIG_EDITABLE_KEYS.has(key)) patch[key] = value
          }
        }
        await settings.update(VISION_SETTINGS_NS as never, patch, request.expectedRevision)
        const revision = settings.describe().find(entry => entry.ns === VISION_SETTINGS_NS)?.revision ?? 0
        return { ok: true, revision }
      } catch (error) {
        const conflict = (error as { code?: unknown }).code === 'SETTINGS_CONFLICT'
        return { error: errorOf(error, conflict ? 'vision-config-conflict' : 'vision-config-save') }
      }
    },

    /**
     * Fetch the dedicated endpoint's `/models` listing. A typed key is one-shot
     * for this call; otherwise the SAVED key (or its env fallback) is used. The
     * key is never stored, logged, or returned.
     */
    async endpointModels(request) {
      try {
        const saved = settingsFace(ctx)?.get(VISION_SETTINGS_NS as never) as VisionSettingsValue | undefined
        const baseUrl = (request.baseUrl?.trim() ?? saved?.baseUrl ?? '').trim()
        if (baseUrl === '') {
          return {
            error: {
              code: 'vision-endpoint-missing',
              message: 'set the dedicated API base URL first (in the form or in the saved settings)',
            },
          }
        }
        const attempt = {
          apiKey: request.apiKey !== undefined && request.apiKey !== '' ? request.apiKey : saved?.apiKey ?? '',
          anonymous: request.anonymous ?? saved?.anonymous ?? false,
        }
        const apiKey = resolveVisionApiKey(attempt, baseUrl, saved?.apiKeyEnv ?? 'VISION_API_KEY')
        const timeoutMs = Math.min(saved?.timeoutMs ?? 120_000, 15_000)
        const response = await fetch(`${baseUrl.replace(/\/+$/u, '')}/models`, {
          headers: { ...(apiKey === '' ? {} : { authorization: `Bearer ${apiKey}` }) },
          signal: AbortSignal.timeout(timeoutMs),
        })
        if (!response.ok) {
          const body = await response.text()
          const { kind, hint } = classifyVisionHttpError(response.status, body)
          return {
            error: {
              code: `vision-endpoint-${kind}`,
              message: `model listing failed at ${baseUrl}: ${body.slice(0, 200)} — ${hint}`,
            },
          }
        }
        let payload: unknown
        try {
          payload = JSON.parse(await response.text())
        } catch {
          return { error: { code: 'vision-endpoint-parse', message: 'the endpoint returned a non-JSON model listing' } }
        }
        const listed = Array.isArray(payload)
          ? payload
          : Array.isArray((payload as { data?: unknown })?.data)
            ? (payload as { data: readonly unknown[] }).data
            : []
        const models: VisionEndpointModelView[] = []
        let truncated = false
        for (const entry of listed) {
          const id = (entry as { id?: unknown })?.id
          if (typeof id !== 'string' || id.trim() === '') continue
          const name = (entry as { name?: unknown })?.name
          models.push({ id: id.trim(), name: typeof name === 'string' && name.trim() !== '' ? name.trim() : id.trim() })
          if (models.length >= VISION_ENDPOINT_MODEL_LIMIT) {
            truncated = listed.length > VISION_ENDPOINT_MODEL_LIMIT
            break
          }
        }
        return { baseUrl, models, truncated }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const aborted = error instanceof Error && error.name === 'TimeoutError' || /aborted due to timeout|timed out/iu.test(message)
        return {
          error: errorOf(error, aborted ? 'vision-endpoint-timeout' : 'vision-endpoint-fetch'),
        }
      }
    },
  }
}
