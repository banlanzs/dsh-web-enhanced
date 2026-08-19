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
import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { Config } from './config.ts';
import type { BalanceGetRequest, BalanceView, DeepSeekRateGetRequest, DeepSeekRateGetResult, FsBrowseRequest, FsBrowseResult, FsDeleteRequest, FsListRequest, FsListResult, FsOfficePreviewRequest, FsOfficePreviewResult, FsReadRequest, FsReadResult, FsSearchRequest, FsSearchResult, FsWriteRequest, FsWriteResult, GitBranchesRequest, GitBranchesResult, GitCheckoutRequest, GitCheckoutResult, GitCommitRequest, GitCommitResult, GitCommitDiffRequest, GitCommitDiffResult, GitDiffRequest, GitDiffResult, GitLogRequest, GitLogResult, GitMutateRequest, GitMutateResult, GitStatusRequest, GitStatusResult, GitWorkingRequest, GitWorkingResult, GlobalPromptGetResult, GlobalPromptSaveRequest, GlobalPromptSetResult, MemoryConfigGetResult, MemoryConfigSaveRequest, MemoryConfigSetResult, MemoryDeleteRequest, MemoryDeleteResult, MemoryListRequest, MemoryListResult, ModelRetryGetResult, ModelRetrySetRequest, ModelRetrySetResult, ModelRouteDescribeRequest, ModelRouteDescribeResult, OpencodeGoUsageView, PluginListRequest, PluginListResult, PluginMutateRequest, PluginMutateResult, PricingGetRequest, PricingGetResult, TaskCreateRequest, TaskCreateResult, TaskListResult, TaskRemoveRequest, TaskRemoveResult, TaskRunRequest, TaskRunResult, TaskUpdateRequest, TaskUpdateResult, VisionConfigGetResult, VisionConfigSaveRequest, VisionConfigSetResult, VisionEndpointModelsRequest, VisionEndpointModelsResult, VisionStatusResult } from './types.ts';
/**
 * Config re-exports.
 *
 * Each domain module owns its own slice of the schema (see
 * {@link ./config.ts}); these keep the plugin entry and any external
 * consumer importing the gateway's config surface unchanged.
 */
export { Config, resolveConfig } from './config.ts';
export type { VisionFallbackConfig } from './types.ts';
/**
 * The web-enhanced gateway. One Typert namespace so a single `remote`
 * contribution reaches the client; methods are grouped by prefix.
 */
export declare class WebEnhancedGateway extends TypertRemoteService {
    private readonly services;
    /**
     * Register the gateway, assemble every domain (mounting the task board,
     * which recovers interrupted runs and starts the scheduler), and keep the
     * route-name cache in step with the provider directory.
     * @param ctx - owning context with the injected core services.
     * @param config - plugin config; defaults apply field-wise.
     */
    constructor(ctx: Context, config?: Config);
    /** List every task, oldest first. */
    taskList(): Promise<TaskListResult>;
    /** Create a task; a cron expression is validated and its next run computed. */
    taskCreate(request: TaskCreateRequest): Promise<TaskCreateResult>;
    /** Update title, prompt, cron, or board column (planned/todo only). */
    taskUpdate(request: TaskUpdateRequest): Promise<TaskUpdateResult>;
    /** Remove one task record. */
    taskRemove(request: TaskRemoveRequest): Promise<TaskRemoveResult>;
    /** Start one task immediately in a fresh agent session. */
    taskRun(request: TaskRunRequest): Promise<TaskRunResult>;
    /** One balance view (cached), hidden when the route bills another account. */
    balanceGet(request: BalanceGetRequest): Promise<BalanceView>;
    /** models.dev pricing for one model route (cached, USD per 1M tokens). */
    pricingGet(request: PricingGetRequest): Promise<PricingGetResult>;
    /** Directory display names for one model route (the model picker's names). */
    modelRouteDescribe(request: ModelRouteDescribeRequest): Promise<ModelRouteDescribeResult>;
    /** DeepSeek peak/off-peak clock and prices for one model id. */
    deepseekRateGet(request: DeepSeekRateGetRequest): DeepSeekRateGetResult;
    /** OpenCode Go quota windows (cached; last-good snapshot on failure). */
    opencodeGoUsageGet(): Promise<OpencodeGoUsageView>;
    /**
     * Live state of the image-understanding integration: whether the admission
     * patch is active, which vision models/endpoints the transcription engine
     * can use, and its last failure. Read lazily so a deployment that mounts no
     * integration reports that state instead of throwing.
     */
    visionStatus(): Promise<VisionStatusResult>;
    /**
     * The editable vision configuration plus the picker options and the live
     * status, all in one read. The API key is never returned.
     */
    visionConfigGet(): Promise<VisionConfigGetResult>;
    /**
     * Save one vision-config patch into the settings namespace. The namespace
     * owner (`VisionInterceptor`) watches the commit and reconfigures live, so
     * no restart is needed; `expectedRevision` gives the save CAS semantics.
     */
    visionConfigSet(request: VisionConfigSaveRequest): Promise<VisionConfigSetResult>;
    /**
     * Read every enabled provider route's current model-request retry policy
     * from the host's settings service — llm-deepseek at its section root and
     * each pi-ai route inside `providers.<route>.retryPolicy`. Saving a number
     * switches the route back to bounded normal mode and takes effect on the
     * next request without a restart (the adapter re-registers its route when
     * the policy changes).
     */
    modelRetryGet(): Promise<ModelRetryGetResult>;
    /** Save a bounded retry count into one provider route's settings. */
    modelRetrySet(request: ModelRetrySetRequest): Promise<ModelRetrySetResult>;
    /**
     * Read the global-prompt settings namespace. Served through this plugin's
     * own Typert gateway rather than the host settings RPCs: a plugin-owned
     * namespace is not on the api-proxy settings allowlist, so the browser
     * `settings.describe` would never list it.
     */
    globalPromptGet(): Promise<GlobalPromptGetResult>;
    /**
     * Save the two global-prompt fields into the settings namespace. The
     * registered section text is read per assembly, so the next model request
     * uses the saved value without a restart; `expectedRevision` gives the save
     * CAS semantics.
     */
    globalPromptSet(request: GlobalPromptSaveRequest): Promise<GlobalPromptSetResult>;
    /** List memory records, optionally narrowed to one workspace. */
    memoryList(request: MemoryListRequest): Promise<MemoryListResult>;
    /** Delete one memory record by id. */
    memoryDelete(request: MemoryDeleteRequest): Promise<MemoryDeleteResult>;
    /**
     * Read the memory settings namespace. Served through this plugin's own
     * gateway for the same reason as the global prompt: a plugin-owned
     * namespace is not on the api-proxy settings allowlist.
     */
    memoryConfigGet(): Promise<MemoryConfigGetResult>;
    /**
     * Save the memory feature switch. The standing section and the recall hook
     * both read the resolved value per step, so a successful save reaches the
     * next model request without a restart.
     */
    memoryConfigSet(request: MemoryConfigSaveRequest): Promise<MemoryConfigSetResult>;
    /**
     * Fetch the dedicated endpoint's `/models` listing. A typed key is one-shot
     * for this call; otherwise the SAVED key (or its env fallback) is used. The
     * key is never stored, logged, or returned.
     */
    visionEndpointModels(request: VisionEndpointModelsRequest): Promise<VisionEndpointModelsResult>;
    /** Local branches; the current branch carries the flag. */
    gitBranches(request: GitBranchesRequest): Promise<GitBranchesResult>;
    /** Recent commits with branch markers; one branch when the graph filters. */
    gitLog(request: GitLogRequest): Promise<GitLogResult>;
    /** One commit's identity, message, and per-file line counts. */
    gitCommit(request: GitCommitRequest): Promise<GitCommitResult>;
    /** Unified diff of one file as one commit changed it. */
    gitCommitDiff(request: GitCommitDiffRequest): Promise<GitCommitDiffResult>;
    /**
     * The uncommitted state of the work tree: staged, unstaged, and untracked
     * files with their line counts, plus the HEAD the graph attaches them to.
     */
    gitWorking(request: GitWorkingRequest): Promise<GitWorkingResult>;
    /** Check out one branch; a rejected switch carries its stderr message. */
    gitCheckout(request: GitCheckoutRequest): Promise<GitCheckoutResult>;
    /** Worktree status (porcelain v1). */
    gitStatus(request: GitStatusRequest): Promise<GitStatusResult>;
    /** Unified diff text, optionally staged, optionally one path. */
    gitDiff(request: GitDiffRequest): Promise<GitDiffResult>;
    /** Stage paths. */
    gitStage(request: GitMutateRequest): Promise<GitMutateResult>;
    /** Unstage paths. */
    gitUnstage(request: GitMutateRequest): Promise<GitMutateResult>;
    /** Discard worktree changes of tracked paths. */
    gitDiscard(request: GitMutateRequest): Promise<GitMutateResult>;
    /** List one directory (skips .git and configured skip dirs). */
    fsList(request: FsListRequest): Promise<FsListResult>;
    /**
     * Recursive basename search (bounded). An empty query — the mention picker's
     * open state — is served from a short-lived per-workspace-path cache; every
     * non-empty query bypasses it.
     */
    fsSearch(request: FsSearchRequest): Promise<FsSearchResult>;
    /** Read one file (text capped / binary base64 preview). */
    fsRead(request: FsReadRequest): Promise<FsReadResult>;
    /** Write one UTF-8 file. */
    fsWrite(request: FsWriteRequest): Promise<FsWriteResult>;
    /** Delete one file (never a directory). */
    fsDelete(request: FsDeleteRequest): Promise<FsWriteResult>;
    /** Convert an Office file (docx/xlsx) into preview blocks. */
    fsOfficePreview(request: FsOfficePreviewRequest): Promise<FsOfficePreviewResult>;
    /**
     * List one absolute directory anywhere on the host (the mention browser).
     *
     * Deliberately NOT workspace-scoped: a mention is a path string, and the
     * path the user wants may sit outside the project. Reads, writes, and
     * previews stay behind the workspace root — this returns names, kinds, and
     * sizes only.
     */
    fsBrowse(request: FsBrowseRequest): Promise<FsBrowseResult>;
    /**
     * The profile's installed plugins.
     *
     * Answers `no-profile` rather than an empty list when this deployment loads
     * the plugin from outside any profile (a source checkout, a test): those are
     * different facts, and an empty list would invite a removal that cannot work.
     */
    pluginList(request: PluginListRequest): Promise<PluginListResult>;
    /** Remove one plugin from the profile (takes effect on the next start). */
    pluginRemove(request: PluginMutateRequest): Promise<PluginMutateResult>;
    /** Update one plugin to its spec's head (takes effect on the next start). */
    pluginUpdate(request: PluginMutateRequest): Promise<PluginMutateResult>;
}
