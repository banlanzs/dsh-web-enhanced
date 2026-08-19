/**
 * Git domain service: every git remote of the web-enhanced gateway.
 *
 * The gateway delegates its git* methods here; this module owns the
 * per-request GitClient construction, the workspace resolution, and the
 * git slice of the plugin config. Business failures are result fields, so
 * every method answers a payload or an `{ error }` branch, never throws.
 * @module dsh-web-enhanced/src/git-gateway
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import type { WorkspaceFace } from './workspace-service.ts';
import type { GitBranchesRequest, GitBranchesResult, GitCheckoutRequest, GitCheckoutResult, GitCommitDiffRequest, GitCommitDiffResult, GitCommitRequest, GitCommitResult, GitDiffRequest, GitDiffResult, GitLogRequest, GitLogResult, GitMutateRequest, GitMutateResult, GitStatusRequest, GitStatusResult, GitWorkingRequest, GitWorkingResult } from './types.ts';
/** The git slice of the plugin config (user input; defaults bind later). */
export interface GitConfigInput {
    gitOutputMaxBytes?: number;
    gitMaxCount?: number;
    gitWorkingMaxFiles?: number;
}
/** The git config fragment, as the plugin schema assembles it. */
export declare const gitConfigFragment: z<Required<GitConfigInput>>;
/** Field defaults applied when the git domain is assembled directly. */
export declare function resolveGitConfig(config: Partial<GitConfigInput>): Required<GitConfigInput>;
/** The git capabilities, as the gateway consumes them. */
export interface GitDomainFace {
    branches(request: GitBranchesRequest): Promise<GitBranchesResult>;
    log(request: GitLogRequest): Promise<GitLogResult>;
    commit(request: GitCommitRequest): Promise<GitCommitResult>;
    commitDiff(request: GitCommitDiffRequest): Promise<GitCommitDiffResult>;
    working(request: GitWorkingRequest): Promise<GitWorkingResult>;
    checkout(request: GitCheckoutRequest): Promise<GitCheckoutResult>;
    status(request: GitStatusRequest): Promise<GitStatusResult>;
    diff(request: GitDiffRequest): Promise<GitDiffResult>;
    stage(request: GitMutateRequest): Promise<GitMutateResult>;
    unstage(request: GitMutateRequest): Promise<GitMutateResult>;
    discard(request: GitMutateRequest): Promise<GitMutateResult>;
}
/** What the git domain needs from the rest of the plugin. */
export interface GitDomainDeps {
    readonly ctx: Context;
    readonly workspace: WorkspaceFace;
    readonly config: Required<GitConfigInput>;
    /** Line counter for untracked files, owned by the files domain. */
    readonly countLines: (root: string, path: string) => Promise<number | null>;
}
/**
 * Assemble the git domain.
 *
 * One GitClient per request rather than one per workspace: a client is a
 * thin argv builder over the subprocess service, and binding it per call is
 * what keeps a moved or removed workspace from being served by a stale root.
 * @param deps - context, workspace resolution, limits, and the line counter.
 * @returns the git capabilities.
 */
export declare function createGitDomain(deps: GitDomainDeps): GitDomainFace;
