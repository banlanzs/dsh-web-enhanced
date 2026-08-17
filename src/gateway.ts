/**
 * The web-enhanced gateway: one Typert namespace (`webEnhanced`) exposing
 * the task board, git, files, Office preview, and balance capabilities to
 * the client. Business failures are result fields, never thrown exceptions,
 * so the client renders them inline. The task domain lives in {@link
 * TaskBoard}; this class is the wire-facing assembly.
 * @module dsh-web-enhanced/src/gateway
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/cordis-plugin-loader'
import z from '@deepseek-ai/schemastery'
import { TypertRemoteService, Remote } from '@deepseek-ai/dsh-typert-protocol'
import { BalanceClient } from './balance.ts'
import { browseDirectory } from './browse.ts'
import { balanceApplies } from './channel.ts'
import { deepseekRateFor } from './deepseek-rate.ts'
import { TaskBoard } from './board.ts'
import type { BoardDeps } from './board.ts'
import { MemoryStore } from './memory-store.ts'
import { deleteFileView, countTextLines, listDirectory, readFileView, searchFiles, writeFileView } from './files.ts'
import type { FsLimits } from './files.ts'
import { GitClient } from './git.ts'
import type { GitLimits } from './git.ts'
import { officePreviewView } from './office.ts'
import type { OfficeLimits } from './office.ts'
import { PnpmRunner, pnpmFailureCode } from './pnpm.ts'
import { ModelsDevPricing } from './pricing.ts'
import { findProfileDir, readInventory } from './profile.ts'
import type { PresetRoster, RunDeps } from './run-task.ts'
import { ModelRouteNames } from './model-names.ts'
import type { LlmNamesFace } from './model-names.ts'
import { OpencodeGoUsageClient } from './opencode-go.ts'
import { classifyVisionHttpError, DEFAULT_VISION_MARKER, DEFAULT_VISION_PROMPT, resolveVisionApiKey, VISION_SETTINGS_NS } from './vision.ts'
import type { VisionSettingsValue } from './vision.ts'
import type { GlobalPromptSettingsValue } from './global-prompt.ts'
import { GLOBAL_PROMPT_MAX_CHARS, GLOBAL_PROMPT_SETTINGS_NS } from './types.ts'
import type {
  ApiError, BalanceGetRequest, BalanceView, DeepSeekRateGetRequest, DeepSeekRateGetResult,
  FsBrowseRequest, FsBrowseResult, FsDeleteRequest,
  FsListRequest, FsListResult,
  FsOfficePreviewRequest,
  FsOfficePreviewResult, FsReadRequest, FsReadResult, FsSearchRequest, FsSearchResult,
  FsWriteRequest, FsWriteResult, GitBranchesRequest, GitBranchesResult, GitCheckoutRequest,
  GitCheckoutResult, GitCommitRequest, GitCommitResult, GitCommitDiffRequest, GitCommitDiffResult,
  GitDiffRequest, GitDiffResult,
  GitLogRequest, GitLogResult, GitMutateRequest,
  GitMutateResult, GitStatusRequest, GitStatusResult, GitWorkingRequest, GitWorkingResult,
  GlobalPromptConfigView, GlobalPromptGetResult, GlobalPromptSaveRequest, GlobalPromptSetResult,
  MemoryDeleteRequest, MemoryDeleteResult, MemoryId, MemoryListRequest, MemoryListResult,
  ModelRetryConfigView, ModelRetryGetResult, ModelRetrySetRequest, ModelRetrySetResult,
  ModelRouteDescribeRequest, ModelRouteDescribeResult, OpencodeGoUsageView,
  PluginListRequest, PluginListResult,
  PluginMutateRequest, PluginMutateResult, PricingGetRequest, PricingGetResult,
  TaskCreateRequest, TaskCreateResult,
  TaskListResult, TaskRemoveRequest, TaskRemoveResult, TaskRunRequest, TaskRunResult,
  TaskUpdateRequest, TaskUpdateResult, VisionConfigGetResult, VisionConfigPatch,
  VisionConfigSaveRequest, VisionConfigSetResult, VisionEndpointModelView,
  VisionEndpointModelsRequest, VisionEndpointModelsResult, VisionModelOptionView,
  VisionProviderOptionView, VisionStatusResult, VisionStatusView, WorkspaceId,
} from './types.ts'

/**
 * The provider directory face, structurally.
 *
 * Declared locally rather than imported: `dsh-llm` is the host's dependency,
 * and this gateway only needs to know where a route keeps its settings.
 */
interface LlmDirectoryFace {
  listConfigurableProviders(): ReadonlyArray<{
    readonly provider: string
    readonly settingsNs: string
    readonly settingsPath: readonly string[]
  }>
}

/** The settings read face, structurally (see {@link LlmDirectoryFace}). */
interface SettingsReadFace {
  get(ns: never): unknown
}

/** The settings write face the vision config remotes use, structurally. */
interface SettingsVisionFace {
  get(ns: unknown): unknown
  describe(options?: { readonly redactSecrets?: boolean }): ReadonlyArray<{ readonly ns: string; readonly revision: number }>
  update(ns: unknown, patch: object, expectedRevision?: number): Promise<void>
  readonly writable: boolean
}

/** Settings namespace whose retry policy the model-retry remotes edit. */
const MODEL_RETRY_SETTINGS_NS = 'llm-deepseek'

/** How long one cached empty-query search result serves the mention picker (ms). */
const FS_SEARCH_CACHE_TTL_MS = 30_000

/** Distinct empty-query search results kept at once (insertion-order eviction). */
const FS_SEARCH_CACHE_LIMIT = 4

/** The resolved shape of the DeepSeek adapter's retry policy settings. */
interface DeepSeekRetrySettingsValue {
  readonly retryPolicy?: {
    readonly mode?: 'normal' | 'always'
    readonly maxRetries?: number
    readonly backoff?: {
      readonly initialDelayMs?: number
      readonly maxDelayMs?: number
      readonly jitterRatio?: number
    }
  }
}

/** The provider/model directory face the vision config picker reads. */
interface LlmVisionDirectoryFace {
  listProviders(): ReadonlyArray<{ readonly id: string; readonly name?: string }>
  listModels(provider: string): Promise<ReadonlyArray<{
    readonly id: string
    readonly name?: string
    readonly inputModalities?: readonly string[]
  }>>
}

/** The vision integration service face the status remote reads, structurally. */
interface VisionIntegrationFace {
  status(): Promise<VisionStatusView>
}

/** Settings keys the Vision tab may edit (everything else is read-only). */
const VISION_CONFIG_EDITABLE_KEYS: ReadonlySet<string> = new Set([
  'enabled', 'patchAdmission', 'provider', 'model', 'harnessModels', 'prompt', 'marker',
  'baseUrl', 'apiKey', 'endpointModel', 'endpointModels', 'anonymous', 'timeoutMs',
  'maxTokens', 'autoLocalOllama', 'localOllamaModel', 'localOllamaUrl',
  'cacheLimit', 'cooldownMs',
])

/** One fallback vision endpoint entry, as declared in plugin config. */
export interface VisionFallbackConfig {
  model: string
  baseURL?: string
  apiKey?: string
  anonymous?: boolean
  timeoutMs?: number
}

/** Plugin config; every bound defaults when unset. */
export interface Config {
  cronIntervalMs?: number
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
  skipDirs?: string[]
  readMaxBytes?: number
  writeMaxBytes?: number
  binaryMaxBytes?: number
  gitOutputMaxBytes?: number
  gitMaxCount?: number
  gitWorkingMaxFiles?: number
  searchMaxDepth?: number
  searchMaxEntries?: number
  officeMaxBytes?: number
  browseMaxEntries?: number
  pluginOpTimeoutMs?: number
  profileDir?: string
  // Image understanding (see `src/vision.ts` for the runtime half).
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

export const Config: z<Config> = z.object({
  cronIntervalMs: z.number().default(30_000),
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
  skipDirs: z.array(z.string()).default(['node_modules']),
  readMaxBytes: z.number().default(1_048_576),
  writeMaxBytes: z.number().default(2_097_152),
  binaryMaxBytes: z.number().default(5_242_880),
  gitOutputMaxBytes: z.number().default(262_144),
  gitMaxCount: z.number().default(100),
  // Caps the uncommitted file list, and with it how many untracked files are
  // read to count their lines. A repository with thousands of untracked files
  // would otherwise turn one graph open into thousands of reads.
  gitWorkingMaxFiles: z.number().default(300),
  searchMaxDepth: z.number().default(8),
  searchMaxEntries: z.number().default(200),
  officeMaxBytes: z.number().default(5_242_880),
  browseMaxEntries: z.number().default(500),
  pluginOpTimeoutMs: z.number().default(300_000),
  // Located by walking up from this module by default; naming it explicitly is
  // for a deployment whose profile is not an ancestor of the loaded plugin.
  profileDir: z.string().default(''),
  // Image understanding. The interception core is transparent (images stay in
  // the UI, text-only models see the description) and the transcription engine
  // tries, in order: DSH-configured vision models, local Ollama, then the
  // configured OpenAI-compatible endpoint with its fallback chain.
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

/** Field defaults applied when the gateway is constructed directly. */
export function resolveConfig(config: Config): Required<Config> {
  return {
    cronIntervalMs: config.cronIntervalMs ?? 30_000,
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
    skipDirs: config.skipDirs ?? ['node_modules'],
    readMaxBytes: config.readMaxBytes ?? 1_048_576,
    writeMaxBytes: config.writeMaxBytes ?? 2_097_152,
    binaryMaxBytes: config.binaryMaxBytes ?? 5_242_880,
    gitOutputMaxBytes: config.gitOutputMaxBytes ?? 262_144,
    gitMaxCount: config.gitMaxCount ?? 100,
    gitWorkingMaxFiles: config.gitWorkingMaxFiles ?? 300,
    searchMaxDepth: config.searchMaxDepth ?? 8,
    searchMaxEntries: config.searchMaxEntries ?? 200,
    officeMaxBytes: config.officeMaxBytes ?? 5_242_880,
    browseMaxEntries: config.browseMaxEntries ?? 500,
    pluginOpTimeoutMs: config.pluginOpTimeoutMs ?? 300_000,
    profileDir: config.profileDir ?? '',
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

/**
 * The web-enhanced gateway. One Typert namespace so a single `remote`
 * contribution reaches the client; methods are grouped by prefix.
 */
export class WebEnhancedGateway extends TypertRemoteService {
  private readonly resolved: Required<Config>
  private readonly balance: BalanceClient
  private readonly board: TaskBoard
  private readonly memoryStore: MemoryStore
  private readonly pricing: ModelsDevPricing
  private readonly routeNames: ModelRouteNames
  private readonly opencodeGo: OpencodeGoUsageClient
  /** Resolved lazily: the walk is filesystem work no other capability needs. */
  private profileDirCache: Promise<string | undefined> | undefined
  /** Built on first mutation, so a deployment outside a profile never makes one. */
  private pnpm: PnpmRunner | undefined
  /**
   * Empty-query fsSearch results by `${workspaceId}:${path}`. The `+` mention
   * picker opens with no query and would otherwise rewalk the workspace on
   * every open; non-empty queries bypass this cache entirely.
   */
  private readonly emptySearchCache = new Map<string, { at: number; result: FsSearchResult }>()

  /**
   * Register the gateway, mount the task board (recovering interrupted
   * runs), and start the scheduler.
   * @param ctx - owning context with the injected core services.
   * @param config - plugin config; defaults apply field-wise.
   */
  constructor(ctx: Context, config: Config = {}) {
    super(ctx, 'webEnhanced')
    this.resolved = resolveConfig(config)
    this.balance = new BalanceClient(
      {
        apiKeyEnv: this.resolved.balanceApiKeyEnv,
        cacheTtlMs: this.resolved.balanceCacheTtlMs,
        baseUrl: this.resolved.balanceBaseUrl,
      },
      // Resolved per query, never captured: the seam's own contract is that a
      // rotated credential reaches the next operation without a restart. Read
      // uninjected so a deployment without the seam still mounts the gateway.
      async (ref) => {
        const credentials = ctx.get('credentials')
        if (credentials === undefined) return undefined
        // The seam brands its references; this one comes from validated config.
        const hit = await credentials.resolve(ref as never)
        return hit?.value
      },
    )
    this.board = new TaskBoard(ctx, this.boardDeps(ctx), {
      cronIntervalMs: this.resolved.cronIntervalMs,
    })
    this.memoryStore = new MemoryStore(ctx, this.board.domain)
    this.pricing = new ModelsDevPricing({
      url: this.resolved.modelsDevUrl,
      ttlMs: this.resolved.modelsDevCacheTtlMs,
      timeoutMs: this.resolved.modelsDevTimeoutMs,
      providerMap: this.resolved.pricingProviderMap,
    })
    this.routeNames = new ModelRouteNames(
      ctx.get('llm' as never, false) as unknown as LlmNamesFace | undefined,
    )
    this.opencodeGo = new OpencodeGoUsageClient(
      {
        apiKeyEnv: 'OPENCODE_GO_API_KEY',
        usageUrl: this.resolved.opencodeGoUsageUrl,
        cacheTtlMs: this.resolved.opencodeGoCacheTtlMs,
        timeoutMs: 15_000,
        ...this.resolved.opencodeGoAuthFile === '' ? {} : { authFile: this.resolved.opencodeGoAuthFile },
      },
      async (ref) => {
        const credentials = ctx.get('credentials')
        if (credentials === undefined) return undefined
        const hit = await credentials.resolve(ref as never)
        return hit?.value
      },
    )
    // Directory renames reach the balance line without a restart: drop the
    // name caches and let the next describe re-prime them from the directory.
    ctx.on('llm/adapters-updated', () => { this.routeNames.clear() })
  }

  // ── tasks ────────────────────────────────────────────────────────────────

  /** List every task, oldest first. */
  @Remote('taskList')
  taskList(): Promise<TaskListResult> {
    return this.board.list()
  }

  /** Create a task; a cron expression is validated and its next run computed. */
  @Remote('taskCreate')
  taskCreate(request: TaskCreateRequest): Promise<TaskCreateResult> {
    return this.board.create(request)
  }

  /** Update title, prompt, cron, or board column (planned/todo only). */
  @Remote('taskUpdate')
  taskUpdate(request: TaskUpdateRequest): Promise<TaskUpdateResult> {
    return this.board.update(request)
  }

  /** Remove one task record. */
  @Remote('taskRemove')
  taskRemove(request: TaskRemoveRequest): Promise<TaskRemoveResult> {
    return this.board.remove(request)
  }

  /** Start one task immediately in a fresh agent session. */
  @Remote('taskRun')
  taskRun(request: TaskRunRequest): Promise<TaskRunResult> {
    return this.board.run(request)
  }

  /** One balance view (cached), hidden when the route bills another account. */
  @Remote('balanceGet')
  async balanceGet(request: BalanceGetRequest): Promise<BalanceView> {
    if (!this.balanceApplies(request.provider)) {
      return { applicable: false, isAvailable: false, infos: [], cachedAt: Date.now() }
    }
    return { ...await this.balance.get(), applicable: true }
  }

  /** models.dev pricing for one model route (cached, USD per 1M tokens). */
  @Remote('pricingGet')
  async pricingGet(request: PricingGetRequest): Promise<PricingGetResult> {
    try {
      const pricing = await this.pricing.pricingFor(request.provider, request.model)
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
      return { error: this.errorOf(error, 'pricing-error') }
    }
  }

  /** Directory display names for one model route (the model picker's names). */
  @Remote('modelRouteDescribe')
  async modelRouteDescribe(request: ModelRouteDescribeRequest): Promise<ModelRouteDescribeResult> {
    try {
      return await this.routeNames.describe(request.provider, request.model)
    } catch (error) {
      return { error: this.errorOf(error, 'model-route-describe') }
    }
  }

  /** DeepSeek peak/off-peak clock and prices for one model id. */
  @Remote('deepseekRateGet')
  deepseekRateGet(request: DeepSeekRateGetRequest): DeepSeekRateGetResult {
    try {
      return deepseekRateFor(request.model)
    } catch (error) {
      return { error: this.errorOf(error, 'deepseek-rate') }
    }
  }

  /** OpenCode Go quota windows (cached; last-good snapshot on failure). */
  @Remote('opencodeGoUsageGet')
  opencodeGoUsageGet(): Promise<OpencodeGoUsageView> {
    return this.opencodeGo.get()
  }

  /**
   * Live state of the image-understanding integration: whether the admission
   * patch is active, which vision models/endpoints the transcription engine
   * can use, and its last failure. Read lazily so a deployment that mounts no
   * integration reports that state instead of throwing.
   */
  @Remote('visionStatus')
  async visionStatus(): Promise<VisionStatusResult> {
    try {
      return await this.visionStatusView()
    } catch (error) {
      return { error: this.errorOf(error, 'vision-status') }
    }
  }

  /**
   * The editable vision configuration plus the picker options and the live
   * status, all in one read. The API key is never returned.
   */
  @Remote('visionConfigGet')
  async visionConfigGet(): Promise<VisionConfigGetResult> {
    try {
      const settings = this.visionSettings()
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
        providers: await this.visionProviderOptions(),
        status: await this.visionStatusView(),
      }
    } catch (error) {
      return { error: this.errorOf(error, 'vision-config') }
    }
  }

  /**
   * Save one vision-config patch into the settings namespace. The namespace
   * owner (`VisionInterceptor`) watches the commit and reconfigures live, so
   * no restart is needed; `expectedRevision` gives the save CAS semantics.
   */
  @Remote('visionConfigSet')
  async visionConfigSet(request: VisionConfigSaveRequest): Promise<VisionConfigSetResult> {
    try {
      const settings = this.visionSettings()
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
      return { error: this.errorOf(error, conflict ? 'vision-config-conflict' : 'vision-config-save') }
    }
  }

  /**
   * Read the DeepSeek provider's current model-request retry policy from the
   * host's settings service. Saving a number switches the provider back to
   * bounded normal mode and takes effect on the next request without a
   * restart (`llm-deepseek` re-registers its route when the policy changes).
   */
  @Remote('modelRetryGet')
  async modelRetryGet(): Promise<ModelRetryGetResult> {
    try {
      const settings = this.modelRetrySettings()
      if (settings === undefined) {
        return { error: { code: 'model-retry-settings-unavailable', message: 'the settings service is not mounted in this deployment' } }
      }
      const raw = settings.get(MODEL_RETRY_SETTINGS_NS as never) as DeepSeekRetrySettingsValue | undefined
      if (raw === undefined || typeof raw !== 'object') {
        return { error: { code: 'model-retry-settings-unmanaged', message: `settings namespace '${MODEL_RETRY_SETTINGS_NS}' is not registered` } }
      }
      // The resolved settings value omits `retryPolicy` until the user writes
      // one (the schema field has no default); the adapter resolves the same
      // omission to the normal defaults, so mirror that here.
      const policy = raw.retryPolicy
      const descriptor = settings.describe().find(entry => entry.ns === MODEL_RETRY_SETTINGS_NS)
      const config: ModelRetryConfigView = {
        provider: 'deepseek-official',
        managed: true,
        writable: settings.writable,
        revision: descriptor?.revision ?? null,
        mode: policy?.mode === 'always' ? 'always' : 'normal',
        maxRetries: policy?.mode === 'always' ? null : policy?.maxRetries ?? 2,
        initialDelayMs: policy?.backoff?.initialDelayMs ?? 500,
        maxDelayMs: policy?.backoff?.maxDelayMs ?? 10_000,
        jitterRatio: policy?.backoff?.jitterRatio ?? 0.1,
      }
      return { config }
    } catch (error) {
      return { error: this.errorOf(error, 'model-retry-config') }
    }
  }

  /** Save a bounded retry count into the DeepSeek provider settings. */
  @Remote('modelRetrySet')
  async modelRetrySet(request: ModelRetrySetRequest): Promise<ModelRetrySetResult> {
    try {
      if (!Number.isSafeInteger(request.maxRetries) || request.maxRetries < 0) {
        return { error: { code: 'model-retry-invalid', message: 'maxRetries must be a non-negative safe integer' } }
      }
      const settings = this.modelRetrySettings()
      if (settings === undefined) {
        return { error: { code: 'model-retry-settings-unavailable', message: 'the settings service is not mounted in this deployment' } }
      }
      if (!settings.writable) {
        return { error: { code: 'model-retry-settings-readonly', message: 'the settings provider is read-only' } }
      }
      const raw = settings.get(MODEL_RETRY_SETTINGS_NS as never)
      if (raw === undefined) {
        return { error: { code: 'model-retry-settings-unmanaged', message: `settings namespace '${MODEL_RETRY_SETTINGS_NS}' is not registered` } }
      }
      await settings.update(MODEL_RETRY_SETTINGS_NS as never, {
        retryPolicy: { mode: 'normal', maxRetries: request.maxRetries },
      }, request.expectedRevision)
      const revision = settings.describe().find(entry => entry.ns === MODEL_RETRY_SETTINGS_NS)?.revision ?? 0
      return { ok: true, revision }
    } catch (error) {
      const conflict = (error as { code?: unknown }).code === 'SETTINGS_CONFLICT'
      return { error: this.errorOf(error, conflict ? 'model-retry-conflict' : 'model-retry-save') }
    }
  }

  /**
   * Read the global-prompt settings namespace. Served through this plugin's
   * own Typert gateway rather than the host settings RPCs: a plugin-owned
   * namespace is not on the api-proxy settings allowlist, so the browser
   * `settings.describe` would never list it.
   */
  @Remote('globalPromptGet')
  async globalPromptGet(): Promise<GlobalPromptGetResult> {
    try {
      const settings = this.globalPromptSettings()
      if (settings === undefined) {
        return { error: { code: 'global-prompt-settings-unavailable', message: 'the settings service is not mounted in this deployment' } }
      }
      const raw = settings.get(GLOBAL_PROMPT_SETTINGS_NS as never) as GlobalPromptSettingsValue | undefined
      if (raw === undefined || typeof raw !== 'object') {
        return { error: { code: 'global-prompt-settings-unmanaged', message: `settings namespace '${GLOBAL_PROMPT_SETTINGS_NS}' is not registered` } }
      }
      const descriptor = settings.describe().find(entry => entry.ns === GLOBAL_PROMPT_SETTINGS_NS)
      const view: GlobalPromptConfigView = {
        enabled: raw.enabled === true,
        text: typeof raw.text === 'string' ? raw.text : '',
        revision: descriptor?.revision ?? null,
        writable: settings.writable,
      }
      return view
    } catch (error) {
      return { error: this.errorOf(error, 'global-prompt-config') }
    }
  }

  /**
   * Save the two global-prompt fields into the settings namespace. The
   * registered section text is read per assembly, so the next model request
   * uses the saved value without a restart; `expectedRevision` gives the save
   * CAS semantics.
   */
  @Remote('globalPromptSet')
  async globalPromptSet(request: GlobalPromptSaveRequest): Promise<GlobalPromptSetResult> {
    try {
      if (typeof request.enabled !== 'boolean' || typeof request.text !== 'string') {
        return { error: { code: 'global-prompt-invalid', message: 'enabled must be a boolean and text must be a string' } }
      }
      if (request.text.length > GLOBAL_PROMPT_MAX_CHARS) {
        return { error: { code: 'global-prompt-too-long', message: `text exceeds the ${String(GLOBAL_PROMPT_MAX_CHARS)}-character limit` } }
      }
      const settings = this.globalPromptSettings()
      if (settings === undefined) {
        return { error: { code: 'global-prompt-settings-unavailable', message: 'the settings service is not mounted in this deployment' } }
      }
      if (!settings.writable) {
        return { error: { code: 'global-prompt-settings-readonly', message: 'the settings provider is read-only' } }
      }
      const raw = settings.get(GLOBAL_PROMPT_SETTINGS_NS as never)
      if (raw === undefined) {
        return { error: { code: 'global-prompt-settings-unmanaged', message: `settings namespace '${GLOBAL_PROMPT_SETTINGS_NS}' is not registered` } }
      }
      await settings.update(GLOBAL_PROMPT_SETTINGS_NS as never, {
        enabled: request.enabled,
        text: request.text,
      }, request.expectedRevision)
      const revision = settings.describe().find(entry => entry.ns === GLOBAL_PROMPT_SETTINGS_NS)?.revision ?? 0
      return { ok: true, revision }
    } catch (error) {
      const conflict = (error as { code?: unknown }).code === 'SETTINGS_CONFLICT'
      return { error: this.errorOf(error, conflict ? 'global-prompt-config-conflict' : 'global-prompt-config-save') }
    }
  }

  // ── memory ──────────────────────────────────────────────────────────────

  /** List memory records, optionally narrowed to one workspace. */
  @Remote('memoryList')
  async memoryList(request: MemoryListRequest): Promise<MemoryListResult> {
    try {
      const workspaceId = request.workspaceId === undefined || request.workspaceId === null
        ? undefined
        : this.resolveWorkspaceId(request.workspaceId)
      if (request.workspaceId !== undefined && request.workspaceId !== null && workspaceId === null) {
        return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } }
      }
      const memories = await this.memoryStore.list(workspaceId)
      return { memories }
    } catch (error) {
      return { error: this.errorOf(error, 'memory-list') }
    }
  }

  /** Delete one memory record by id. */
  @Remote('memoryDelete')
  async memoryDelete(request: MemoryDeleteRequest): Promise<MemoryDeleteResult> {
    try {
      const id = request.id
      if (id === '') return { error: { code: 'invalid-id', message: 'memory id must not be empty' } }
      const removed = await this.memoryStore.delete(id as MemoryId)
      return { removed }
    } catch (error) {
      return { error: this.errorOf(error, 'memory-delete') }
    }
  }

  /**
   * Fetch the dedicated endpoint's `/models` listing. A typed key is one-shot
   * for this call; otherwise the SAVED key (or its env fallback) is used. The
   * key is never stored, logged, or returned.
   */
  @Remote('visionEndpointModels')
  async visionEndpointModels(request: VisionEndpointModelsRequest): Promise<VisionEndpointModelsResult> {
    try {
      const saved = this.visionSettings()?.get(VISION_SETTINGS_NS as never) as VisionSettingsValue | undefined
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
        if (models.length >= 200) {
          truncated = listed.length > 200
          break
        }
      }
      return { baseUrl, models, truncated }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const aborted = error instanceof Error && error.name === 'TimeoutError' || /aborted due to timeout|timed out/iu.test(message)
      return {
        error: this.errorOf(
          error,
          aborted ? 'vision-endpoint-timeout' : 'vision-endpoint-fetch',
        ),
      }
    }
  }

  // ── git ──────────────────────────────────────────────────────────────────

  /** Local branches; the current branch carries the flag. */
  @Remote('gitBranches')
  async gitBranches(request: GitBranchesRequest): Promise<GitBranchesResult> {
    return this.withGit(request.workspaceId, async client => ({ branches: await client.branches() }))
  }

  /** Recent commits with branch markers; one branch when the graph filters. */
  @Remote('gitLog')
  async gitLog(request: GitLogRequest): Promise<GitLogResult> {
    return this.withGit(request.workspaceId, async client => {
      const maxCount = request.maxCount === undefined ? this.resolved.gitMaxCount : request.maxCount
      return { commits: await client.log(maxCount, request.branch) }
    })
  }

  /** One commit's identity, message, and per-file line counts. */
  @Remote('gitCommit')
  async gitCommit(request: GitCommitRequest): Promise<GitCommitResult> {
    return this.withGit(request.workspaceId, async client => ({ commit: await client.commit(request.hash) }))
  }

  /** Unified diff of one file as one commit changed it. */
  @Remote('gitCommitDiff')
  async gitCommitDiff(request: GitCommitDiffRequest): Promise<GitCommitDiffResult> {
    return this.withGit(request.workspaceId, async client => ({
      text: await client.commitDiff(request.hash, request.path),
    }))
  }

  /**
   * The uncommitted state of the work tree: staged, unstaged, and untracked
   * files with their line counts, plus the HEAD the graph attaches them to.
   */
  @Remote('gitWorking')
  async gitWorking(request: GitWorkingRequest): Promise<GitWorkingResult> {
    return this.withGit(request.workspaceId, async (client, root) => ({
      working: await client.working(
        this.resolved.gitWorkingMaxFiles,
        path => countTextLines(root, path, this.fsLimits),
      ),
    }))
  }

  /** Check out one branch; a rejected switch carries its stderr message. */
  @Remote('gitCheckout')
  async gitCheckout(request: GitCheckoutRequest): Promise<GitCheckoutResult> {
    return this.withGit(request.workspaceId, async client => client.checkout(request.branch))
  }

  /** Worktree status (porcelain v1). */
  @Remote('gitStatus')
  async gitStatus(request: GitStatusRequest): Promise<GitStatusResult> {
    return this.withGit(request.workspaceId, async client => ({ entries: await client.status() }))
  }

  /** Unified diff text, optionally staged, optionally one path. */
  @Remote('gitDiff')
  async gitDiff(request: GitDiffRequest): Promise<GitDiffResult> {
    return this.withGit(request.workspaceId, async client => ({
      text: await client.diff(request.path, request.staged === true),
    }))
  }

  /** Stage paths. */
  @Remote('gitStage')
  async gitStage(request: GitMutateRequest): Promise<GitMutateResult> {
    return this.withGit(request.workspaceId, async client => {
      await client.stage(request.paths)
      return { ok: true }
    })
  }

  /** Unstage paths. */
  @Remote('gitUnstage')
  async gitUnstage(request: GitMutateRequest): Promise<GitMutateResult> {
    return this.withGit(request.workspaceId, async client => {
      await client.unstage(request.paths)
      return { ok: true }
    })
  }

  /** Discard worktree changes of tracked paths. */
  @Remote('gitDiscard')
  async gitDiscard(request: GitMutateRequest): Promise<GitMutateResult> {
    return this.withGit(request.workspaceId, async client => {
      await client.discard(request.paths)
      return { ok: true }
    })
  }

  // ── files ────────────────────────────────────────────────────────────────

  /** List one directory (skips .git and configured skip dirs). */
  @Remote('fsList')
  async fsList(request: FsListRequest): Promise<FsListResult> {
    const root = this.workspaceRootFor(request.workspaceId)
    if (root === null) return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } }
    try {
      return { entries: await listDirectory(root, request.path ?? '', this.fsLimits) }
    } catch (error) {
      return { error: this.errorOf(error, 'fs-list') }
    }
  }

  /**
   * Recursive basename search (bounded). An empty query — the mention picker's
   * open state — is served from a short-lived per-workspace-path cache; every
   * non-empty query bypasses it.
   */
  @Remote('fsSearch')
  async fsSearch(request: FsSearchRequest): Promise<FsSearchResult> {
    const root = this.workspaceRootFor(request.workspaceId)
    if (root === null) return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } }
    const rel = request.path ?? ''
    const cacheable = (request.query ?? '').trim() === ''
    const key = `${request.workspaceId}:${rel}`
    if (cacheable) {
      const hit = this.emptySearchCache.get(key)
      if (hit !== undefined && Date.now() - hit.at < FS_SEARCH_CACHE_TTL_MS) return hit.result
    }
    try {
      const result: FsSearchResult = { entries: await searchFiles(root, rel, request.query ?? '', this.fsLimits) }
      if (cacheable) this.storeEmptySearch(key, result)
      return result
    } catch (error) {
      return { error: this.errorOf(error, 'fs-search') }
    }
  }

  /** Read one file (text capped / binary base64 preview). */
  @Remote('fsRead')
  async fsRead(request: FsReadRequest): Promise<FsReadResult> {
    const root = this.workspaceRootFor(request.workspaceId)
    if (root === null) return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } }
    try {
      return await readFileView(root, request.path, this.fsLimits)
    } catch (error) {
      return { error: this.errorOf(error, 'fs-read') }
    }
  }

  /** Write one UTF-8 file. */
  @Remote('fsWrite')
  async fsWrite(request: FsWriteRequest): Promise<FsWriteResult> {
    const root = this.workspaceRootFor(request.workspaceId)
    if (root === null) return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } }
    try {
      await writeFileView(root, request.path, request.content, this.fsLimits)
      this.invalidateSearchCache(request.workspaceId)
      return { ok: true }
    } catch (error) {
      return { error: this.errorOf(error, 'fs-write') }
    }
  }

  /** Delete one file (never a directory). */
  @Remote('fsDelete')
  async fsDelete(request: FsDeleteRequest): Promise<FsWriteResult> {
    const root = this.workspaceRootFor(request.workspaceId)
    if (root === null) return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } }
    try {
      await deleteFileView(root, request.path)
      this.invalidateSearchCache(request.workspaceId)
      return { ok: true }
    } catch (error) {
      return { error: this.errorOf(error, 'fs-delete') }
    }
  }

  /** Convert an Office file (docx/xlsx) into preview blocks. */
  @Remote('fsOfficePreview')
  async fsOfficePreview(request: FsOfficePreviewRequest): Promise<FsOfficePreviewResult> {
    const root = this.workspaceRootFor(request.workspaceId)
    if (root === null) return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } }
    try {
      return await officePreviewView(root, request.path, this.officeLimits)
    } catch (error) {
      return { error: this.errorOf(error, 'office-preview') }
    }
  }

  /**
   * List one absolute directory anywhere on the host (the mention browser).
   *
   * Deliberately NOT workspace-scoped: a mention is a path string, and the
   * path the user wants may sit outside the project. Reads, writes, and
   * previews stay behind the workspace root — this returns names, kinds, and
   * sizes only.
   */
  @Remote('fsBrowse')
  async fsBrowse(request: FsBrowseRequest): Promise<FsBrowseResult> {
    try {
      return await browseDirectory(request.path, { maxEntries: this.resolved.browseMaxEntries })
    } catch (error) {
      return { error: this.errorOf(error, 'fs-browse') }
    }
  }

  // ── plugins ──────────────────────────────────────────────────────────────

  /**
   * The profile's installed plugins.
   *
   * Answers `no-profile` rather than an empty list when this deployment loads
   * the plugin from outside any profile (a source checkout, a test): those are
   * different facts, and an empty list would invite a removal that cannot work.
   */
  @Remote('pluginList')
  async pluginList(_request: PluginListRequest): Promise<PluginListResult> {
    try {
      const dir = await this.profileDir()
      if (dir === undefined) return { error: this.noProfile() }
      const inventory = await readInventory(dir)
      return {
        profileDir: inventory.dir,
        profileName: inventory.name,
        plugins: inventory.plugins,
        templateBundles: inventory.templateBundles,
        busy: this.pnpm?.running ?? false,
      }
    } catch (error) {
      return { error: this.errorOf(error, 'plugin-list') }
    }
  }

  /** Remove one plugin from the profile (takes effect on the next start). */
  @Remote('pluginRemove')
  async pluginRemove(request: PluginMutateRequest): Promise<PluginMutateResult> {
    return this.pluginOperation(request.name, runner => runner.remove(request.name))
  }

  /** Update one plugin to its spec's head (takes effect on the next start). */
  @Remote('pluginUpdate')
  async pluginUpdate(request: PluginMutateRequest): Promise<PluginMutateResult> {
    return this.pluginOperation(request.name, runner => runner.update(request.name))
  }

  // ── internals ────────────────────────────────────────────────────────────
  /** The settings provider the vision config remotes read and write. */
  private visionSettings(): SettingsVisionFace | undefined {
    return this.ctx.get('settings' as never, false) as unknown as SettingsVisionFace | undefined
  }

  /** The settings provider the model-retry remotes read and write. */
  private modelRetrySettings(): SettingsVisionFace | undefined {
    return this.ctx.get('settings' as never, false) as unknown as SettingsVisionFace | undefined
  }

  /** The settings provider the global-prompt remotes read and write. */
  private globalPromptSettings(): SettingsVisionFace | undefined {
    return this.ctx.get('settings' as never, false) as unknown as SettingsVisionFace | undefined
  }

  /** The live integration status, or the explicit unmounted state. */
  private async visionStatusView(): Promise<VisionStatusView> {
    const service = this.ctx.get('visionIntegration' as never, false) as unknown as VisionIntegrationFace | undefined
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
  private async visionProviderOptions(): Promise<VisionProviderOptionView[]> {
    const llm = this.ctx.get('llm' as never, false) as unknown as LlmVisionDirectoryFace | undefined
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

  /**
   * Whether the balance describes the account one model route bills.
   *
   * The provider's endpoint is read from the settings section its own adapter
   * declares, through `ctx.llm`'s configurable-provider directory — both read
   * uninjected, because a deployment that composes neither still has a working
   * gateway and simply falls back to the allow list.
   */
  private balanceApplies(provider: string | undefined): boolean {
    return balanceApplies({
      provider,
      allowed: this.resolved.balanceProviders,
      balanceBaseUrl: this.resolved.balanceBaseUrl,
      providerBaseUrl: provider === undefined ? undefined : this.providerBaseUrl(provider),
    })
  }

  /** Configured endpoint of one provider route, when its settings declare one. */
  private providerBaseUrl(provider: string): string | undefined {
    const llm = this.ctx.get('llm' as never) as unknown as LlmDirectoryFace | undefined
    const settings = this.ctx.get('settings' as never) as unknown as SettingsReadFace | undefined
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
   * Store one empty-query result, keeping at most {@link FS_SEARCH_CACHE_LIMIT}
   * keys: a re-set refreshes recency, and the oldest key is evicted past the
   * limit (Map insertion order).
   */
  private storeEmptySearch(key: string, result: FsSearchResult): void {
    this.emptySearchCache.delete(key)
    this.emptySearchCache.set(key, { at: Date.now(), result })
    while (this.emptySearchCache.size > FS_SEARCH_CACHE_LIMIT) {
      this.emptySearchCache.delete(this.emptySearchCache.keys().next().value!)
    }
  }

  /**
   * Drop every cached empty-query result of one workspace. A write or delete
   * changes what an unfiltered listing returns; dropping the whole workspace's
   * entries is cheap correctness over per-path tracking.
   */
  private invalidateSearchCache(workspaceId: string): void {
    const prefix = `${workspaceId}:`
    for (const key of [...this.emptySearchCache.keys()]) {
      if (key.startsWith(prefix)) this.emptySearchCache.delete(key)
    }
  }

  private get fsLimits(): FsLimits {
    return {
      skipDirs: this.resolved.skipDirs,
      readMaxBytes: this.resolved.readMaxBytes,
      writeMaxBytes: this.resolved.writeMaxBytes,
      binaryMaxBytes: this.resolved.binaryMaxBytes,
      searchMaxDepth: this.resolved.searchMaxDepth,
      searchMaxEntries: this.resolved.searchMaxEntries,
    }
  }

  private get gitLimits(): GitLimits {
    return { outputMaxBytes: this.resolved.gitOutputMaxBytes, maxCount: this.resolved.gitMaxCount }
  }

  private get officeLimits(): OfficeLimits {
    return { maxBytes: this.resolved.officeMaxBytes }
  }

  private runDeps(ctx: Context): RunDeps {
    const loader = ctx.get('loader')
    return {
      agents: ctx.agents,
      sessions: ctx.sessions,
      agentDefaultModel: ctx.agentDefaultModel,
      awaitLoader: loader === undefined ? undefined : () => loader.await(),
      // Read uninjected and per call: the roster is what carries a session's
      // tools, but a deployment composed without one must still run tasks, and
      // the service may mount after this gateway does.
      presets: () => ctx.get('agentPresets' as never) as unknown as PresetRoster | undefined,
      attachWorkspaceSession: async (workspaceId, sessionId) => {
        // Never fatal to the run: the session already exists and already works
        // in the right directory, so a refused membership is a reportable miss
        // rather than a reason to lose a started run. The registry validates
        // the session header's canonical cwd against the workspace path, which
        // is the realistic refusal (a path that moved under the record).
        try {
          const workspace = this.ctx.workspaceRegistry.get(workspaceId)
          if (workspace === undefined) {
            throw new Error(`workspace '${workspaceId}' is no longer registered`)
          }
          await workspace.attachSession(sessionId)
        } catch (error) {
          ctx.logger.warn(
            `web-enhanced could not record run session '${sessionId}' on workspace '${workspaceId}': `
            + (error instanceof Error ? error.message : String(error)),
          )
        }
      },
    }
  }

  private boardDeps(ctx: Context): BoardDeps {
    return {
      ...this.runDeps(ctx),
      workspaceRoot: workspaceId => this.workspaceRoot(workspaceId),
      resolveWorkspaceId: workspaceId => this.resolveWorkspaceId(workspaceId),
      logger: ctx.logger,
    }
  }

  /** Resolve a workspace id to its canonical root; null when unknown. */
  private workspaceRootFor(workspaceId: string): string | null {
    return this.ctx.workspaceRegistry.list().find(workspace => workspace.id === workspaceId)?.path ?? null
  }

  private resolveWorkspaceId(workspaceId: string): WorkspaceId | null {
    const found = this.ctx.workspaceRegistry.list().find(workspace => workspace.id === workspaceId)
    return found === undefined ? null : found.id
  }

  private workspaceRoot(workspaceId: WorkspaceId | null): string {
    if (workspaceId === null) return process.cwd()
    const found = this.ctx.workspaceRegistry.list().find(workspace => workspace.id === workspaceId)
    return found?.path ?? process.cwd()
  }

  private async withGit<T>(
    workspaceId: string,
    fn: (client: GitClient, root: string) => Promise<T>,
  ): Promise<T | { error: ApiError }> {
    const root = this.workspaceRootFor(workspaceId)
    if (root === null) return { error: { code: 'workspace-not-found', message: `workspace '${workspaceId}' does not exist` } }
    try {
      return await fn(new GitClient(this.ctx.subprocess, root, this.gitLimits), root)
    } catch (error) {
      return { error: this.errorOf(error, 'git-error') }
    }
  }

  /** The error returned when this deployment sits outside any profile. */
  private noProfile(): ApiError {
    return {
      code: 'no-profile',
      message: 'this deployment does not load the plugin from a dsh profile, so there is nothing to manage',
    }
  }

  /**
   * The profile directory, resolved once and cached.
   *
   * A profile cannot move under a running host, so a repeated walk would only
   * repeat the same filesystem reads. The promise itself is cached so
   * concurrent first callers share one walk. A configured path wins outright:
   * the walk is a heuristic over where the module happens to sit.
   */
  private profileDir(): Promise<string | undefined> {
    if (this.resolved.profileDir !== '') return Promise.resolve(this.resolved.profileDir)
    this.profileDirCache ??= findProfileDir()
    return this.profileDirCache
  }

  /**
   * Run one plugin mutation, guarding what pnpm itself would not.
   *
   * The refusal here is for a name pnpm cannot act on: a template bundle is in
   * the layer list precisely because nothing depends on it, so `pnpm remove`
   * would report success having done nothing. Removing the row that IS this
   * plugin is NOT refused — that is a legitimate thing to want, and the
   * `self` flag exists so the surface can confirm it rather than have the
   * gateway decide on the user's behalf.
   * @param name - package name from the request.
   * @param operation - the runner call to perform.
   * @returns the mutation result.
   */
  private async pluginOperation(
    name: string,
    operation: (runner: PnpmRunner) => Promise<{
      readonly run: { readonly exitCode: number | null; readonly stdout: string; readonly stderr: string; readonly timedOut: boolean }
      readonly added: readonly string[]
      readonly removed: readonly string[]
    }>,
  ): Promise<PluginMutateResult> {
    try {
      const dir = await this.profileDir()
      if (dir === undefined) return { error: this.noProfile() }
      const inventory = await readInventory(dir)
      const row = inventory.plugins.find(plugin => plugin.name === name)
      if (row === undefined) {
        const template = inventory.templateBundles.includes(name)
        return {
          error: {
            code: template ? 'plugin-not-removable' : 'plugin-not-found',
            message: template
              ? `'${name}' is a profile template layer, not a dependency — it cannot be removed or updated by pnpm`
              : `'${name}' is not a dependency of profile '${inventory.name}'`,
          },
        }
      }
      this.pnpm ??= new PnpmRunner(this.ctx.subprocess, dir, {
        timeoutMs: this.resolved.pluginOpTimeoutMs,
        outputMaxBytes: this.resolved.gitOutputMaxBytes,
      })
      const { run, added, removed } = await operation(this.pnpm)
      const output = `${run.stdout}\n${run.stderr}`.trim()
      const failure = pnpmFailureCode(run)
      if (failure !== undefined) {
        return { ok: false, added, removed, restartRequired: false, output: output || failure }
      }
      // Always true on success: Cordis composed the layer stack at boot, so
      // what changed on disk describes the next start, not this process.
      return { ok: true, added, removed, restartRequired: true, output }
    } catch (error) {
      return { error: this.errorOf(error, 'plugin-operation') }
    }
  }

  private errorOf(error: unknown, fallback: string): ApiError {    const message = error instanceof Error ? error.message : String(error)
    const code = error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT'
      ? 'not-found'
      : fallback
    return { code, message }
  }
}
