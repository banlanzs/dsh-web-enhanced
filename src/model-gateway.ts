/**
 * Model domain service: the facts the composer's cost line and the model
 * settings need — account balance, models.dev pricing, route display names,
 * the DeepSeek peak/off-peak clock, OpenCode Go quota, and the per-route
 * request retry policy.
 *
 * The gateway delegates those methods here; this module owns the clients it
 * builds and the model slice of the plugin config.
 * @module dsh-web-enhanced/src/model-gateway
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { BalanceClient } from './balance.ts'
import { balanceApplies } from './channel.ts'
import { deepseekRateFor } from './deepseek-rate.ts'
import { errorOf } from './error.ts'
import { settingsFace } from './faces.ts'
import type { LlmDirectoryFace, SettingsReadFace } from './faces.ts'
import { ModelRouteNames } from './model-names.ts'
import type { LlmNamesFace } from './model-names.ts'
import { OpencodeGoUsageClient } from './opencode-go.ts'
import { ModelsDevPricing } from './pricing.ts'
import type {
  BalanceGetRequest, BalanceView, DeepSeekRateGetRequest, DeepSeekRateGetResult,
  ModelRetryConfigView, ModelRetryGetResult, ModelRetrySetRequest, ModelRetrySetResult,
  ModelRouteDescribeRequest, ModelRouteDescribeResult, OpencodeGoUsageView,
  PricingGetRequest, PricingGetResult,
} from './types.ts'

/** Settings namespaces whose route-level retry policy the model-retry remotes edit. */
const MODEL_RETRY_NAMESPACES: ReadonlySet<string> = new Set(['llm-deepseek', 'llm-pi-ai'])

/**
 * The retry-capable routes the panel may show: hand-declared routes, plus
 * built-in catalog routes that are currently active (an adapter is
 * registered for them — the user set a key). Dormant built-in routes the
 * user never configured stay hidden.
 */
function retryConfigurableEntries(llm: LlmDirectoryFace): ReadonlyArray<{
  readonly provider: string
  readonly settingsNs: string
  readonly settingsPath: readonly string[]
}> {
  const active = new Set(llm.listProviders().map(entry => entry.id))
  return llm.listConfigurableProviders().filter(entry =>
    MODEL_RETRY_NAMESPACES.has(entry.settingsNs)
    && (entry.declared === true || active.has(entry.provider)))
}

/** Read a value at one settings path; absent parents answer undefined. */
function readPath(value: unknown, path: readonly string[]): unknown {
  let current = value
  for (const step of path) {
    if (typeof current !== 'object' || current === null || Array.isArray(current)) return undefined
    current = (current as Record<string, unknown>)[step]
  }
  return current
}

/** Nest one value under a settings path for a merge-style update patch. */
function nestAt(path: readonly string[], value: unknown): Record<string, unknown> {
  let result = value as Record<string, unknown>
  for (let index = path.length - 1; index >= 0; index--) result = { [path[index]!]: result }
  return result
}

/** Read a value as a plain record, defaulting everything else to {}. */
function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

/** The model slice of the plugin config (user input; defaults bind later). */
export interface ModelConfigInput {
  balanceApiKeyEnv?: string
  balanceCacheTtlMs?: number
  balanceBaseUrl?: string
  balanceProviders?: string[]
  modelsDevUrl?: string
  modelsDevCacheTtlMs?: number
  modelsDevTimeoutMs?: number
  pricingProviderMap?: Record<string, string>
  /** OpenCode Go usage endpoint (quota windows for the subscription line). */
  opencodeGoUsageUrl?: string
  /** How long one OpenCode Go quota snapshot stays fresh. */
  opencodeGoCacheTtlMs?: number
  /** Override of the opencode CLI auth.json path (empty = platform default). */
  opencodeGoAuthFile?: string
}

/** The model config fragment, as the plugin schema assembles it. */
export const modelConfigFragment: z<Required<ModelConfigInput>> = z.object({
  balanceApiKeyEnv: z.string().default('DEEPSEEK_API_KEY'),
  balanceCacheTtlMs: z.number().default(60_000),
  balanceBaseUrl: z.string().default('https://api.deepseek.com'),
  balanceProviders: z.array(z.string()).default(['deepseek-official']),
  modelsDevUrl: z.string().default('https://models.dev/api.json'),
  modelsDevCacheTtlMs: z.number().default(21_600_000),
  modelsDevTimeoutMs: z.number().default(10_000),
  // models.dev names the official vendor `deepseek`; the route id is `deepseek-official`.
  pricingProviderMap: z.dict(z.string()).default({ 'deepseek-official': 'deepseek' }),
  opencodeGoUsageUrl: z.string().default('https://opencode.ai/zen/go/v1/usage'),
  opencodeGoCacheTtlMs: z.number().default(60_000),
  opencodeGoAuthFile: z.string().default(''),
})

/** Field defaults applied when the model domain is assembled directly. */
export function resolveModelConfig(config: Partial<ModelConfigInput>): Required<ModelConfigInput> {
  return {
    balanceApiKeyEnv: config.balanceApiKeyEnv ?? 'DEEPSEEK_API_KEY',
    balanceCacheTtlMs: config.balanceCacheTtlMs ?? 60_000,
    balanceBaseUrl: config.balanceBaseUrl ?? 'https://api.deepseek.com',
    balanceProviders: config.balanceProviders ?? ['deepseek-official'],
    modelsDevUrl: config.modelsDevUrl ?? 'https://models.dev/api.json',
    modelsDevCacheTtlMs: config.modelsDevCacheTtlMs ?? 21_600_000,
    modelsDevTimeoutMs: config.modelsDevTimeoutMs ?? 10_000,
    pricingProviderMap: config.pricingProviderMap ?? { 'deepseek-official': 'deepseek' },
    opencodeGoUsageUrl: config.opencodeGoUsageUrl ?? 'https://opencode.ai/zen/go/v1/usage',
    opencodeGoCacheTtlMs: config.opencodeGoCacheTtlMs ?? 60_000,
    opencodeGoAuthFile: config.opencodeGoAuthFile ?? '',
  }
}

/** The model capabilities, as the gateway consumes them. */
export interface ModelDomainFace {
  balance(request: BalanceGetRequest): Promise<BalanceView>
  pricing(request: PricingGetRequest): Promise<PricingGetResult>
  describeRoute(request: ModelRouteDescribeRequest): Promise<ModelRouteDescribeResult>
  deepseekRate(request: DeepSeekRateGetRequest): DeepSeekRateGetResult
  opencodeGoUsage(): Promise<OpencodeGoUsageView>
  retryGet(): Promise<ModelRetryGetResult>
  retrySet(request: ModelRetrySetRequest): Promise<ModelRetrySetResult>
  /** Drop the cached route display names after a directory change. */
  clearRouteNames(): void
}

/** What the model domain needs from the rest of the plugin. */
export interface ModelDomainDeps {
  readonly ctx: Context
  readonly config: Required<ModelConfigInput>
}

/**
 * Assemble the model domain.
 * @param deps - context and the resolved model config.
 * @returns the model capabilities.
 */
export function createModelDomain(deps: ModelDomainDeps): ModelDomainFace {
  const { ctx } = deps

  // Resolved per query, never captured: the seam's own contract is that a
  // rotated credential reaches the next operation without a restart. Read
  // uninjected so a deployment without the seam still mounts the gateway.
  const resolveCredential = async (ref: string): Promise<string | undefined> => {
    const credentials = ctx.get('credentials')
    if (credentials === undefined) return undefined
    // The seam brands its references; this one comes from validated config.
    const hit = await credentials.resolve(ref as never)
    return hit?.value
  }

  const balanceClient = new BalanceClient(
    {
      apiKeyEnv: deps.config.balanceApiKeyEnv,
      cacheTtlMs: deps.config.balanceCacheTtlMs,
      baseUrl: deps.config.balanceBaseUrl,
    },
    resolveCredential,
  )

  const pricingClient = new ModelsDevPricing({
    url: deps.config.modelsDevUrl,
    ttlMs: deps.config.modelsDevCacheTtlMs,
    timeoutMs: deps.config.modelsDevTimeoutMs,
    providerMap: deps.config.pricingProviderMap,
  })

  const routeNames = new ModelRouteNames(
    ctx.get('llm' as never, false) as unknown as LlmNamesFace | undefined,
  )

  const opencodeGo = new OpencodeGoUsageClient(
    {
      apiKeyEnv: 'OPENCODE_GO_API_KEY',
      usageUrl: deps.config.opencodeGoUsageUrl,
      cacheTtlMs: deps.config.opencodeGoCacheTtlMs,
      timeoutMs: 15_000,
      ...deps.config.opencodeGoAuthFile === '' ? {} : { authFile: deps.config.opencodeGoAuthFile },
    },
    resolveCredential,
  )

  /** Configured endpoint of one provider route, when its settings declare one. */
  const providerBaseUrl = (provider: string): string | undefined => {
    const llm = ctx.get('llm' as never) as unknown as LlmDirectoryFace | undefined
    const settings = ctx.get('settings' as never) as unknown as SettingsReadFace | undefined
    if (llm === undefined || settings === undefined) return undefined
    const entry = llm.listConfigurableProviders().find(candidate => candidate.provider === provider)
    if (entry === undefined || entry.settingsNs === '') return undefined
    let value = settings.get(entry.settingsNs as never)
    for (const step of entry.settingsPath) {
      if (typeof value !== 'object' || value === null) return undefined
      value = (value as Record<string, unknown>)[step]
    }
    if (typeof value !== 'object' || value === null) return undefined
    const baseUrl = (value as Record<string, unknown>)['baseURL']
    return typeof baseUrl === 'string' && baseUrl.trim() !== '' ? baseUrl : undefined
  }

  /**
   * Whether the balance describes the account one model route bills.
   *
   * The provider's endpoint is read from the settings section its own adapter
   * declares, through `ctx.llm`'s configurable-provider directory — both read
   * uninjected, because a deployment that composes neither still has a working
   * gateway and simply falls back to the allow list.
   */
  const applies = (provider: string | undefined): boolean => balanceApplies({
    provider,
    allowed: deps.config.balanceProviders,
    balanceBaseUrl: deps.config.balanceBaseUrl,
    providerBaseUrl: provider === undefined ? undefined : providerBaseUrl(provider),
  })

  return {
    clearRouteNames: () => { routeNames.clear() },

    async balance(request) {
      if (!applies(request.provider)) {
        return { applicable: false, isAvailable: false, infos: [], cachedAt: Date.now() }
      }
      return { ...await balanceClient.get(), applicable: true }
    },

    async pricing(request) {
      try {
        const pricing = await pricingClient.pricingFor(request.provider, request.model)
        if (pricing === undefined) {
          return {
            error: {
              code: 'pricing-not-found',
              message: `models.dev has no pricing for '${request.provider}/${request.model}'`,
            },
          }
        }
        return { provider: request.provider, model: request.model, pricing }
      } catch (error) {
        return { error: errorOf(error, 'pricing-error') }
      }
    },

    async describeRoute(request) {
      try {
        return await routeNames.describe(request.provider, request.model)
      } catch (error) {
        return { error: errorOf(error, 'model-route-describe') }
      }
    },

    deepseekRate(request) {
      try {
        return deepseekRateFor(request.model)
      } catch (error) {
        return { error: errorOf(error, 'deepseek-rate') }
      }
    },

    opencodeGoUsage: () => opencodeGo.get(),

    async retryGet() {
      try {
        const settings = settingsFace(ctx)
        if (settings === undefined) {
          return { error: { code: 'model-retry-settings-unavailable', message: 'the settings service is not mounted in this deployment' } }
        }
        const llm = ctx.get('llm' as never) as unknown as LlmDirectoryFace | undefined
        if (llm === undefined) return { configs: [] }
        const revisions = new Map(settings.describe().map(entry => [entry.ns, entry.revision]))
        const configs: ModelRetryConfigView[] = []
        for (const entry of retryConfigurableEntries(llm)) {
          // The resolved settings value omits `retryPolicy` until the user writes
          // one (the schema field has no default); the adapter resolves the same
          // omission to the normal defaults, so mirror that here.
          let section: unknown
          try {
            section = readPath(settings.get(entry.settingsNs as never), entry.settingsPath)
          } catch {
            section = undefined
          }
          const route = recordValue(section)
          const policy = recordValue(route['retryPolicy'])
          const backoff = recordValue(policy['backoff'])
          const mode = policy['mode'] === 'always' ? 'always' : 'normal'
          const displayName = typeof route['displayName'] === 'string' && route['displayName'].length > 0
            ? route['displayName']
            : null
          configs.push({
            provider: entry.provider,
            displayName,
            managed: revisions.has(entry.settingsNs),
            writable: settings.writable,
            revision: revisions.get(entry.settingsNs) ?? null,
            mode,
            maxRetries: mode === 'always' ? null : typeof policy['maxRetries'] === 'number' ? policy['maxRetries'] : 2,
            initialDelayMs: typeof backoff['initialDelayMs'] === 'number' ? backoff['initialDelayMs'] : 500,
            maxDelayMs: typeof backoff['maxDelayMs'] === 'number' ? backoff['maxDelayMs'] : 10_000,
            jitterRatio: typeof backoff['jitterRatio'] === 'number' ? backoff['jitterRatio'] : 0.1,
          })
        }
        return { configs }
      } catch (error) {
        return { error: errorOf(error, 'model-retry-config') }
      }
    },

    async retrySet(request) {
      try {
        if (!Number.isSafeInteger(request.maxRetries) || request.maxRetries < 0) {
          return { error: { code: 'model-retry-invalid', message: 'maxRetries must be a non-negative safe integer' } }
        }
        const settings = settingsFace(ctx)
        if (settings === undefined) {
          return { error: { code: 'model-retry-settings-unavailable', message: 'the settings service is not mounted in this deployment' } }
        }
        if (!settings.writable) {
          return { error: { code: 'model-retry-settings-readonly', message: 'the settings provider is read-only' } }
        }
        const llm = ctx.get('llm' as never) as unknown as LlmDirectoryFace | undefined
        const entry = llm === undefined
          ? undefined
          : retryConfigurableEntries(llm).find(candidate => candidate.provider === request.provider)
        if (entry === undefined) {
          return { error: { code: 'model-retry-unmanaged', message: `provider "${request.provider}" has no configurable retry settings` } }
        }
        await settings.update(entry.settingsNs as never, nestAt(entry.settingsPath, {
          retryPolicy: { mode: 'normal', maxRetries: request.maxRetries },
        }), request.expectedRevision)
        const revision = settings.describe().find(desc => desc.ns === entry.settingsNs)?.revision ?? 0
        return { ok: true, revision }
      } catch (error) {
        const conflict = (error as { code?: unknown }).code === 'SETTINGS_CONFLICT'
        return { error: errorOf(error, conflict ? 'model-retry-conflict' : 'model-retry-save') }
      }
    },
  }
}
