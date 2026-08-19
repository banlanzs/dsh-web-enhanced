/**
 * Git domain service: every git remote of the web-enhanced gateway.
 *
 * The gateway delegates its git* methods here; this module owns the
 * per-request GitClient construction, the workspace resolution, and the
 * git slice of the plugin config. Business failures are result fields, so
 * every method answers a payload or an `{ error }` branch, never throws.
 * @module dsh-web-enhanced/src/git-gateway
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { errorOf } from './error.ts'
import { GitClient } from './git.ts'
import type { GitLimits } from './git.ts'
import { workspaceNotFound } from './workspace-service.ts'
import type { WorkspaceFace } from './workspace-service.ts'
import type {
  ApiError, GitBranchesRequest, GitBranchesResult, GitCheckoutRequest, GitCheckoutResult,
  GitCommitDiffRequest, GitCommitDiffResult, GitCommitRequest, GitCommitResult,
  GitDiffRequest, GitDiffResult, GitLogRequest, GitLogResult, GitMutateRequest,
  GitMutateResult, GitStatusRequest, GitStatusResult, GitWorkingRequest, GitWorkingResult,
} from './types.ts'

/** The git slice of the plugin config (user input; defaults bind later). */
export interface GitConfigInput {
  gitOutputMaxBytes?: number
  gitMaxCount?: number
  gitWorkingMaxFiles?: number
}

/** The git config fragment, as the plugin schema assembles it. */
export const gitConfigFragment: z<Required<GitConfigInput>> = z.object({
  gitOutputMaxBytes: z.number().default(262_144),
  gitMaxCount: z.number().default(100),
  // Caps the uncommitted file list, and with it how many untracked files are
  // read to count their lines. A repository with thousands of untracked files
  // would otherwise turn one graph open into thousands of reads.
  gitWorkingMaxFiles: z.number().default(300),
})

/** Field defaults applied when the git domain is assembled directly. */
export function resolveGitConfig(config: Partial<GitConfigInput>): Required<GitConfigInput> {
  return {
    gitOutputMaxBytes: config.gitOutputMaxBytes ?? 262_144,
    gitMaxCount: config.gitMaxCount ?? 100,
    gitWorkingMaxFiles: config.gitWorkingMaxFiles ?? 300,
  }
}

/** The git capabilities, as the gateway consumes them. */
export interface GitDomainFace {
  branches(request: GitBranchesRequest): Promise<GitBranchesResult>
  log(request: GitLogRequest): Promise<GitLogResult>
  commit(request: GitCommitRequest): Promise<GitCommitResult>
  commitDiff(request: GitCommitDiffRequest): Promise<GitCommitDiffResult>
  working(request: GitWorkingRequest): Promise<GitWorkingResult>
  checkout(request: GitCheckoutRequest): Promise<GitCheckoutResult>
  status(request: GitStatusRequest): Promise<GitStatusResult>
  diff(request: GitDiffRequest): Promise<GitDiffResult>
  stage(request: GitMutateRequest): Promise<GitMutateResult>
  unstage(request: GitMutateRequest): Promise<GitMutateResult>
  discard(request: GitMutateRequest): Promise<GitMutateResult>
}

/** What the git domain needs from the rest of the plugin. */
export interface GitDomainDeps {
  readonly ctx: Context
  readonly workspace: WorkspaceFace
  readonly config: Required<GitConfigInput>
  /** Line counter for untracked files, owned by the files domain. */
  readonly countLines: (root: string, path: string) => Promise<number | null>
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
export function createGitDomain(deps: GitDomainDeps): GitDomainFace {
  const limits = (): GitLimits => ({
    outputMaxBytes: deps.config.gitOutputMaxBytes,
    maxCount: deps.config.gitMaxCount,
  })

  const withGit = async <T>(
    workspaceId: string,
    fn: (client: GitClient, root: string) => Promise<T>,
  ): Promise<T | { error: ApiError }> => {
    const root = deps.workspace.rootFor(workspaceId)
    if (root === null) return { error: workspaceNotFound(workspaceId) }
    try {
      return await fn(new GitClient(deps.ctx.subprocess, root, limits()), root)
    } catch (error) {
      return { error: errorOf(error, 'git-error') }
    }
  }

  return {
    branches: request => withGit(request.workspaceId, async client => ({ branches: await client.branches() })),

    log: request => withGit(request.workspaceId, async (client) => {
      const maxCount = request.maxCount === undefined ? deps.config.gitMaxCount : request.maxCount
      return { commits: await client.log(maxCount, request.branch) }
    }),

    commit: request => withGit(request.workspaceId, async client => ({ commit: await client.commit(request.hash) })),

    commitDiff: request => withGit(request.workspaceId, async client => ({
      text: await client.commitDiff(request.hash, request.path),
    })),

    working: request => withGit(request.workspaceId, async (client, root) => ({
      working: await client.working(
        deps.config.gitWorkingMaxFiles,
        path => deps.countLines(root, path),
      ),
    })),

    checkout: request => withGit(request.workspaceId, async client => client.checkout(request.branch)),

    status: request => withGit(request.workspaceId, async client => ({ entries: await client.status() })),

    diff: request => withGit(request.workspaceId, async client => ({
      text: await client.diff(request.path, request.staged === true),
    })),

    stage: request => withGit(request.workspaceId, async (client) => {
      await client.stage(request.paths)
      return { ok: true }
    }),

    unstage: request => withGit(request.workspaceId, async (client) => {
      await client.unstage(request.paths)
      return { ok: true }
    }),

    discard: request => withGit(request.workspaceId, async (client) => {
      await client.discard(request.paths)
      return { ok: true }
    }),
  }
}
