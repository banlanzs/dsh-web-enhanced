/**
 * The web-enhanced gateway: one Typert namespace (`webEnhanced`) exposing
 * the task board, git, files, Office preview, balance, and image
 * understanding to the client.
 *
 * This class is the wire face and nothing else: every method declares its
 * `@Remote` binding and delegates to the domain that owns the behaviour (see
 * {@link ./services.ts} for the assembly, and each `*-gateway.ts` for one
 * domain). The methods stay here because `@Remote` records its markers on
 * this service's prototype. Business failures are result fields, never thrown
 * exceptions, so the client renders them inline.
 * @module dsh-web-enhanced/src/gateway
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/cordis-plugin-loader'
import { TypertRemoteService, Remote } from '@deepseek-ai/dsh-typert-protocol'
import { Config, resolveConfig } from './config.ts'
import { createServices } from './services.ts'
import type { Services } from './services.ts'
import type {
  BalanceGetRequest, BalanceView, DeepSeekRateGetRequest, DeepSeekRateGetResult,
  FsBrowseRequest, FsBrowseResult, FsDeleteRequest, FsListRequest, FsListResult,
  FsOfficePreviewRequest, FsOfficePreviewResult, FsReadRequest, FsReadResult, FsSearchRequest,
  FsSearchResult, FsWriteRequest, FsWriteResult, GitBranchesRequest, GitBranchesResult,
  GitCheckoutRequest, GitCheckoutResult, GitCommitRequest, GitCommitResult,
  GitCommitDiffRequest, GitCommitDiffResult, GitDiffRequest, GitDiffResult, GitLogRequest,
  GitLogResult, GitMutateRequest, GitMutateResult, GitStatusRequest, GitStatusResult,
  GitWorkingRequest, GitWorkingResult, GlobalPromptGetResult, GlobalPromptSaveRequest,
  GlobalPromptSetResult, MemoryConfigGetResult, MemoryConfigSaveRequest, MemoryConfigSetResult,
  MemoryDeleteRequest, MemoryDeleteResult, MemoryListRequest, MemoryListResult,
  ModelRetryGetResult, ModelRetrySetRequest, ModelRetrySetResult, ModelRouteDescribeRequest,
  ModelRouteDescribeResult, OpencodeGoUsageView, PluginListRequest, PluginListResult,
  PluginMutateRequest, PluginMutateResult, PricingGetRequest, PricingGetResult,
  TaskCreateRequest, TaskCreateResult, TaskListResult, TaskRemoveRequest, TaskRemoveResult,
  TaskRunRequest, TaskRunResult, TaskUpdateRequest, TaskUpdateResult, VisionConfigGetResult,
  VisionConfigSaveRequest, VisionConfigSetResult, VisionEndpointModelsRequest,
  VisionEndpointModelsResult, VisionStatusResult,
} from './types.ts'


/**
 * Config re-exports.
 *
 * Each domain module owns its own slice of the schema (see
 * {@link ./config.ts}); these keep the plugin entry and any external
 * consumer importing the gateway's config surface unchanged.
 */
export { Config, resolveConfig } from './config.ts'
export type { VisionFallbackConfig } from './types.ts'


/**
 * The web-enhanced gateway. One Typert namespace so a single `remote`
 * contribution reaches the client; methods are grouped by prefix.
 */
export class WebEnhancedGateway extends TypertRemoteService {
  private readonly services: Services

  /**
   * Register the gateway, assemble every domain (mounting the task board,
   * which recovers interrupted runs and starts the scheduler), and keep the
   * route-name cache in step with the provider directory.
   * @param ctx - owning context with the injected core services.
   * @param config - plugin config; defaults apply field-wise.
   */
  constructor(ctx: Context, config: Config = {}) {
    super(ctx, 'webEnhanced')
    this.services = createServices(ctx, resolveConfig(config))
    // Directory renames reach the balance line without a restart: drop the
    // name caches and let the next describe re-prime them from the directory.
    ctx.on('llm/adapters-updated', () => { this.services.model.clearRouteNames() })
  }

  // ── tasks ────────────────────────────────────────────────────────────────

  /** List every task, oldest first. */
  @Remote('taskList')
  taskList(): Promise<TaskListResult> {
    return this.services.board.list()
  }

  /** Create a task; a cron expression is validated and its next run computed. */
  @Remote('taskCreate')
  taskCreate(request: TaskCreateRequest): Promise<TaskCreateResult> {
    return this.services.board.create(request)
  }

  /** Update title, prompt, cron, or board column (planned/todo only). */
  @Remote('taskUpdate')
  taskUpdate(request: TaskUpdateRequest): Promise<TaskUpdateResult> {
    return this.services.board.update(request)
  }

  /** Remove one task record. */
  @Remote('taskRemove')
  taskRemove(request: TaskRemoveRequest): Promise<TaskRemoveResult> {
    return this.services.board.remove(request)
  }

  /** Start one task immediately in a fresh agent session. */
  @Remote('taskRun')
  taskRun(request: TaskRunRequest): Promise<TaskRunResult> {
    return this.services.board.run(request)
  }

  /** One balance view (cached), hidden when the route bills another account. */
  @Remote('balanceGet')
  balanceGet(request: BalanceGetRequest): Promise<BalanceView> {
    return this.services.model.balance(request)
  }

  /** models.dev pricing for one model route (cached, USD per 1M tokens). */
  @Remote('pricingGet')
  pricingGet(request: PricingGetRequest): Promise<PricingGetResult> {
    return this.services.model.pricing(request)
  }

  /** Directory display names for one model route (the model picker's names). */
  @Remote('modelRouteDescribe')
  modelRouteDescribe(request: ModelRouteDescribeRequest): Promise<ModelRouteDescribeResult> {
    return this.services.model.describeRoute(request)
  }

  /** DeepSeek peak/off-peak clock and prices for one model id. */
  @Remote('deepseekRateGet')
  deepseekRateGet(request: DeepSeekRateGetRequest): DeepSeekRateGetResult {
    return this.services.model.deepseekRate(request)
  }

  /** OpenCode Go quota windows (cached; last-good snapshot on failure). */
  @Remote('opencodeGoUsageGet')
  opencodeGoUsageGet(): Promise<OpencodeGoUsageView> {
    return this.services.model.opencodeGoUsage()
  }

  /**
   * Live state of the image-understanding integration: whether the admission
   * patch is active, which vision models/endpoints the transcription engine
   * can use, and its last failure. Read lazily so a deployment that mounts no
   * integration reports that state instead of throwing.
   */
  @Remote('visionStatus')
  visionStatus(): Promise<VisionStatusResult> {
    return this.services.vision.status()
  }

  /**
   * The editable vision configuration plus the picker options and the live
   * status, all in one read. The API key is never returned.
   */
  @Remote('visionConfigGet')
  visionConfigGet(): Promise<VisionConfigGetResult> {
    return this.services.vision.configGet()
  }

  /**
   * Save one vision-config patch into the settings namespace. The namespace
   * owner (`VisionInterceptor`) watches the commit and reconfigures live, so
   * no restart is needed; `expectedRevision` gives the save CAS semantics.
   */
  @Remote('visionConfigSet')
  visionConfigSet(request: VisionConfigSaveRequest): Promise<VisionConfigSetResult> {
    return this.services.vision.configSet(request)
  }

  /**
   * Read every enabled provider route's current model-request retry policy
   * from the host's settings service — llm-deepseek at its section root and
   * each pi-ai route inside `providers.<route>.retryPolicy`. Saving a number
   * switches the route back to bounded normal mode and takes effect on the
   * next request without a restart (the adapter re-registers its route when
   * the policy changes).
   */
  @Remote('modelRetryGet')
  modelRetryGet(): Promise<ModelRetryGetResult> {
    return this.services.model.retryGet()
  }

  /** Save a bounded retry count into one provider route's settings. */
  @Remote('modelRetrySet')
  modelRetrySet(request: ModelRetrySetRequest): Promise<ModelRetrySetResult> {
    return this.services.model.retrySet(request)
  }

  /**
   * Read the global-prompt settings namespace. Served through this plugin's
   * own Typert gateway rather than the host settings RPCs: a plugin-owned
   * namespace is not on the api-proxy settings allowlist, so the browser
   * `settings.describe` would never list it.
   */
  @Remote('globalPromptGet')
  globalPromptGet(): Promise<GlobalPromptGetResult> {
    return this.services.globalPrompt.get()
  }

  /**
   * Save the two global-prompt fields into the settings namespace. The
   * registered section text is read per assembly, so the next model request
   * uses the saved value without a restart; `expectedRevision` gives the save
   * CAS semantics.
   */
  @Remote('globalPromptSet')
  globalPromptSet(request: GlobalPromptSaveRequest): Promise<GlobalPromptSetResult> {
    return this.services.globalPrompt.set(request)
  }

  // ── memory ──────────────────────────────────────────────────────────────

  /** List memory records, optionally narrowed to one workspace. */
  @Remote('memoryList')
  memoryList(request: MemoryListRequest): Promise<MemoryListResult> {
    return this.services.memory.list(request)
  }

  /** Delete one memory record by id. */
  @Remote('memoryDelete')
  memoryDelete(request: MemoryDeleteRequest): Promise<MemoryDeleteResult> {
    return this.services.memory.remove(request)
  }

  /**
   * Read the memory settings namespace. Served through this plugin's own
   * gateway for the same reason as the global prompt: a plugin-owned
   * namespace is not on the api-proxy settings allowlist.
   */
  @Remote('memoryConfigGet')
  memoryConfigGet(): Promise<MemoryConfigGetResult> {
    return this.services.memory.configGet()
  }

  /**
   * Save the memory feature switch. The standing section and the recall hook
   * both read the resolved value per step, so a successful save reaches the
   * next model request without a restart.
   */
  @Remote('memoryConfigSet')
  memoryConfigSet(request: MemoryConfigSaveRequest): Promise<MemoryConfigSetResult> {
    return this.services.memory.configSet(request)
  }

  /**
   * Fetch the dedicated endpoint's `/models` listing. A typed key is one-shot
   * for this call; otherwise the SAVED key (or its env fallback) is used. The
   * key is never stored, logged, or returned.
   */
  @Remote('visionEndpointModels')
  visionEndpointModels(request: VisionEndpointModelsRequest): Promise<VisionEndpointModelsResult> {
    return this.services.vision.endpointModels(request)
  }

  // ── git ──────────────────────────────────────────────────────────────────

  /** Local branches; the current branch carries the flag. */
  @Remote('gitBranches')
  gitBranches(request: GitBranchesRequest): Promise<GitBranchesResult> {
    return this.services.git.branches(request)
  }

  /** Recent commits with branch markers; one branch when the graph filters. */
  @Remote('gitLog')
  gitLog(request: GitLogRequest): Promise<GitLogResult> {
    return this.services.git.log(request)
  }

  /** One commit's identity, message, and per-file line counts. */
  @Remote('gitCommit')
  gitCommit(request: GitCommitRequest): Promise<GitCommitResult> {
    return this.services.git.commit(request)
  }

  /** Unified diff of one file as one commit changed it. */
  @Remote('gitCommitDiff')
  gitCommitDiff(request: GitCommitDiffRequest): Promise<GitCommitDiffResult> {
    return this.services.git.commitDiff(request)
  }

  /**
   * The uncommitted state of the work tree: staged, unstaged, and untracked
   * files with their line counts, plus the HEAD the graph attaches them to.
   */
  @Remote('gitWorking')
  gitWorking(request: GitWorkingRequest): Promise<GitWorkingResult> {
    return this.services.git.working(request)
  }

  /** Check out one branch; a rejected switch carries its stderr message. */
  @Remote('gitCheckout')
  gitCheckout(request: GitCheckoutRequest): Promise<GitCheckoutResult> {
    return this.services.git.checkout(request)
  }

  /** Worktree status (porcelain v1). */
  @Remote('gitStatus')
  gitStatus(request: GitStatusRequest): Promise<GitStatusResult> {
    return this.services.git.status(request)
  }

  /** Unified diff text, optionally staged, optionally one path. */
  @Remote('gitDiff')
  gitDiff(request: GitDiffRequest): Promise<GitDiffResult> {
    return this.services.git.diff(request)
  }

  /** Stage paths. */
  @Remote('gitStage')
  gitStage(request: GitMutateRequest): Promise<GitMutateResult> {
    return this.services.git.stage(request)
  }

  /** Unstage paths. */
  @Remote('gitUnstage')
  gitUnstage(request: GitMutateRequest): Promise<GitMutateResult> {
    return this.services.git.unstage(request)
  }

  /** Discard worktree changes of tracked paths. */
  @Remote('gitDiscard')
  gitDiscard(request: GitMutateRequest): Promise<GitMutateResult> {
    return this.services.git.discard(request)
  }

  // ── files ────────────────────────────────────────────────────────────────

  /** List one directory (skips .git and configured skip dirs). */
  @Remote('fsList')
  fsList(request: FsListRequest): Promise<FsListResult> {
    return this.services.files.list(request)
  }

  /**
   * Recursive basename search (bounded). An empty query — the mention picker's
   * open state — is served from a short-lived per-workspace-path cache; every
   * non-empty query bypasses it.
   */
  @Remote('fsSearch')
  fsSearch(request: FsSearchRequest): Promise<FsSearchResult> {
    return this.services.files.search(request)
  }

  /** Read one file (text capped / binary base64 preview). */
  @Remote('fsRead')
  fsRead(request: FsReadRequest): Promise<FsReadResult> {
    return this.services.files.read(request)
  }

  /** Write one UTF-8 file. */
  @Remote('fsWrite')
  fsWrite(request: FsWriteRequest): Promise<FsWriteResult> {
    return this.services.files.write(request)
  }

  /** Delete one file (never a directory). */
  @Remote('fsDelete')
  fsDelete(request: FsDeleteRequest): Promise<FsWriteResult> {
    return this.services.files.remove(request)
  }

  /** Convert an Office file (docx/xlsx) into preview blocks. */
  @Remote('fsOfficePreview')
  fsOfficePreview(request: FsOfficePreviewRequest): Promise<FsOfficePreviewResult> {
    return this.services.files.officePreview(request)
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
  fsBrowse(request: FsBrowseRequest): Promise<FsBrowseResult> {
    return this.services.files.browse(request)
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
  pluginList(request: PluginListRequest): Promise<PluginListResult> {
    return this.services.plugins.list(request)
  }

  /** Remove one plugin from the profile (takes effect on the next start). */
  @Remote('pluginRemove')
  pluginRemove(request: PluginMutateRequest): Promise<PluginMutateResult> {
    return this.services.plugins.remove(request)
  }

  /** Update one plugin to its spec's head (takes effect on the next start). */
  @Remote('pluginUpdate')
  pluginUpdate(request: PluginMutateRequest): Promise<PluginMutateResult> {
    return this.services.plugins.update(request)
  }
}
