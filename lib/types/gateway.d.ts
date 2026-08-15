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
import type { BalanceGetRequest, BalanceView, FsDeleteRequest, FsListRequest, FsListResult, FsOfficePreviewRequest, FsOfficePreviewResult, FsReadRequest, FsReadResult, FsSearchRequest, FsSearchResult, FsWriteRequest, FsWriteResult, GitBranchesRequest, GitBranchesResult, GitCheckoutRequest, GitCheckoutResult, GitCommitRequest, GitCommitResult, GitDiffRequest, GitDiffResult, GitLogRequest, GitLogResult, GitMutateRequest, GitMutateResult, GitStatusRequest, GitStatusResult, TaskCreateRequest, TaskCreateResult, TaskListResult, TaskRemoveRequest, TaskRemoveResult, TaskRunRequest, TaskRunResult, TaskUpdateRequest, TaskUpdateResult } from './types.ts';
/** Plugin config; every bound defaults when unset. */
export interface Config {
    cronIntervalMs?: number;
    balanceApiKeyEnv?: string;
    balanceCacheTtlMs?: number;
    balanceBaseUrl?: string;
    balanceProviders?: string[];
    skipDirs?: string[];
    readMaxBytes?: number;
    writeMaxBytes?: number;
    binaryMaxBytes?: number;
    gitOutputMaxBytes?: number;
    gitMaxCount?: number;
    searchMaxDepth?: number;
    searchMaxEntries?: number;
    officeMaxBytes?: number;
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
    /** Local branches; the current branch carries the flag. */
    gitBranches(request: GitBranchesRequest): Promise<GitBranchesResult>;
    /** Recent commits with branch markers; one branch when the graph filters. */
    gitLog(request: GitLogRequest): Promise<GitLogResult>;
    /** One commit's identity, message, and per-file line counts. */
    gitCommit(request: GitCommitRequest): Promise<GitCommitResult>;
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
    private errorOf;
}
