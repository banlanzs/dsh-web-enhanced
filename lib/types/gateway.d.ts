/**
 * The web-enhanced gateway: one Typert namespace (`webEnhanced`) exposing
 * the task board, git, files, Office preview, and balance capabilities to
 * the client. Business failures are result fields, never thrown exceptions,
 * so the client renders them inline. The task domain lives in {@link
 * TaskBoard}; this class is the wire-facing assembly.
 * @module dsh-web-enhanced/src/gateway
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { BalanceGetRequest, BalanceView, FsBrowseRequest, FsBrowseResult, FsDeleteRequest, FsListRequest, FsListResult, FsOfficePreviewRequest, FsOfficePreviewResult, FsReadRequest, FsReadResult, FsSearchRequest, FsSearchResult, FsWriteRequest, FsWriteResult, GitBranchesRequest, GitBranchesResult, GitCheckoutRequest, GitCheckoutResult, GitCommitRequest, GitCommitResult, GitDiffRequest, GitDiffResult, GitLogRequest, GitLogResult, GitMutateRequest, GitMutateResult, GitStatusRequest, GitStatusResult, GitWorkingRequest, GitWorkingResult, PluginListRequest, PluginListResult, PluginMutateRequest, PluginMutateResult, PricingGetRequest, PricingGetResult, TaskCreateRequest, TaskCreateResult, TaskListResult, TaskRemoveRequest, TaskRemoveResult, TaskRunRequest, TaskRunResult, TaskUpdateRequest, TaskUpdateResult, VisionConfigGetResult, VisionConfigSaveRequest, VisionConfigSetResult, VisionEndpointModelsRequest, VisionEndpointModelsResult, VisionStatusResult } from './types.ts';
/** One fallback vision endpoint entry, as declared in plugin config. */
export interface VisionFallbackConfig {
    model: string;
    baseURL?: string;
    apiKey?: string;
    anonymous?: boolean;
    timeoutMs?: number;
}
/** Plugin config; every bound defaults when unset. */
export interface Config {
    cronIntervalMs?: number;
    balanceApiKeyEnv?: string;
    balanceCacheTtlMs?: number;
    balanceBaseUrl?: string;
    balanceProviders?: string[];
    modelsDevUrl?: string;
    modelsDevCacheTtlMs?: number;
    modelsDevTimeoutMs?: number;
    pricingProviderMap?: Record<string, string>;
    skipDirs?: string[];
    readMaxBytes?: number;
    writeMaxBytes?: number;
    binaryMaxBytes?: number;
    gitOutputMaxBytes?: number;
    gitMaxCount?: number;
    gitWorkingMaxFiles?: number;
    searchMaxDepth?: number;
    searchMaxEntries?: number;
    officeMaxBytes?: number;
    browseMaxEntries?: number;
    pluginOpTimeoutMs?: number;
    profileDir?: string;
    visionEnabled?: boolean;
    visionPatchAdmission?: boolean;
    visionPrompt?: string;
    visionMarker?: string;
    visionProvider?: string;
    visionModel?: string;
    /** User-selected DSH model pool; non-empty replaces auto-detection. */
    visionHarnessModels?: Array<{
        provider: string;
        model: string;
    }>;
    visionBaseUrl?: string;
    visionApiKey?: string;
    visionApiKeyEnv?: string;
    visionEndpointModel?: string;
    /** Candidate pool for the dedicated endpoint; the active model is one of them. */
    visionEndpointModels?: string[];
    visionAnonymous?: boolean;
    visionTimeoutMs?: number;
    visionMaxTokens?: number;
    visionAutoLocalOllama?: boolean;
    visionLocalOllamaModel?: string;
    visionLocalOllamaUrl?: string;
    visionFallbackModels?: VisionFallbackConfig[];
    visionCacheLimit?: number;
    visionCooldownMs?: number;
}
export declare const Config: z<Config>;
/** Field defaults applied when the gateway is constructed directly. */
export declare function resolveConfig(config: Config): Required<Config>;
/**
 * The web-enhanced gateway. One Typert namespace so a single `remote`
 * contribution reaches the client; methods are grouped by prefix.
 */
export declare class WebEnhancedGateway extends TypertRemoteService {
    private readonly resolved;
    private readonly balance;
    private readonly board;
    private readonly pricing;
    /** Resolved lazily: the walk is filesystem work no other capability needs. */
    private profileDirCache;
    /** Built on first mutation, so a deployment outside a profile never makes one. */
    private pnpm;
    /**
     * Register the gateway, mount the task board (recovering interrupted
     * runs), and start the scheduler.
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
    /** Recursive basename search (bounded). */
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
    pluginList(_request: PluginListRequest): Promise<PluginListResult>;
    /** Remove one plugin from the profile (takes effect on the next start). */
    pluginRemove(request: PluginMutateRequest): Promise<PluginMutateResult>;
    /** Update one plugin to its spec's head (takes effect on the next start). */
    pluginUpdate(request: PluginMutateRequest): Promise<PluginMutateResult>;
    /** The settings provider the vision config remotes read and write. */
    private visionSettings;
    /** The live integration status, or the explicit unmounted state. */
    private visionStatusView;
    /** Providers and models for the Vision tab, from the model picker's source. */
    private visionProviderOptions;
    /**
     * Whether the balance describes the account one model route bills.
     *
     * The provider's endpoint is read from the settings section its own adapter
     * declares, through `ctx.llm`'s configurable-provider directory — both read
     * uninjected, because a deployment that composes neither still has a working
     * gateway and simply falls back to the allow list.
     */
    private balanceApplies;
    /** Configured endpoint of one provider route, when its settings declare one. */
    private providerBaseUrl;
    private get fsLimits();
    private get gitLimits();
    private get officeLimits();
    private runDeps;
    private boardDeps;
    /** Resolve a workspace id to its canonical root; null when unknown. */
    private workspaceRootFor;
    private resolveWorkspaceId;
    private workspaceRoot;
    private withGit;
    /** The error returned when this deployment sits outside any profile. */
    private noProfile;
    /**
     * The profile directory, resolved once and cached.
     *
     * A profile cannot move under a running host, so a repeated walk would only
     * repeat the same filesystem reads. The promise itself is cached so
     * concurrent first callers share one walk. A configured path wins outright:
     * the walk is a heuristic over where the module happens to sit.
     */
    private profileDir;
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
    private pluginOperation;
    private errorOf;
}
