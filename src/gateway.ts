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
import { balanceApplies } from './channel.ts'
import { TaskBoard } from './board.ts'
import type { BoardDeps } from './board.ts'
import { deleteFileView, listDirectory, readFileView, searchFiles, writeFileView } from './files.ts'
import type { FsLimits } from './files.ts'
import { GitClient } from './git.ts'
import type { GitLimits } from './git.ts'
import { officePreviewView } from './office.ts'
import type { OfficeLimits } from './office.ts'
import type { PresetRoster, RunDeps } from './run-task.ts'
import type {
  ApiError, BalanceGetRequest, BalanceView, FsDeleteRequest, FsListRequest, FsListResult,
  FsOfficePreviewRequest,
  FsOfficePreviewResult, FsReadRequest, FsReadResult, FsSearchRequest, FsSearchResult,
  FsWriteRequest, FsWriteResult, GitBranchesRequest, GitBranchesResult, GitCheckoutRequest,
  GitCheckoutResult, GitCommitRequest, GitCommitResult, GitDiffRequest, GitDiffResult,
  GitLogRequest, GitLogResult, GitMutateRequest,
  GitMutateResult, GitStatusRequest, GitStatusResult, TaskCreateRequest, TaskCreateResult,
  TaskListResult, TaskRemoveRequest, TaskRemoveResult, TaskRunRequest, TaskRunResult,
  TaskUpdateRequest, TaskUpdateResult, WorkspaceId,
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

/** Plugin config; every bound defaults when unset. */
export interface Config {
  cronIntervalMs?: number
  balanceApiKeyEnv?: string
  balanceCacheTtlMs?: number
  balanceBaseUrl?: string
  balanceProviders?: string[]
  skipDirs?: string[]
  readMaxBytes?: number
  writeMaxBytes?: number
  binaryMaxBytes?: number
  gitOutputMaxBytes?: number
  gitMaxCount?: number
  searchMaxDepth?: number
  searchMaxEntries?: number
  officeMaxBytes?: number
}

export const Config: z<Config> = z.object({
  cronIntervalMs: z.number().default(30_000),
  balanceApiKeyEnv: z.string().default('DEEPSEEK_API_KEY'),
  balanceCacheTtlMs: z.number().default(60_000),
  balanceBaseUrl: z.string().default('https://api.deepseek.com'),
  balanceProviders: z.array(z.string()).default(['deepseek-official']),
  skipDirs: z.array(z.string()).default(['node_modules']),
  readMaxBytes: z.number().default(1_048_576),
  writeMaxBytes: z.number().default(2_097_152),
  binaryMaxBytes: z.number().default(5_242_880),
  gitOutputMaxBytes: z.number().default(262_144),
  gitMaxCount: z.number().default(100),
  searchMaxDepth: z.number().default(8),
  searchMaxEntries: z.number().default(200),
  officeMaxBytes: z.number().default(5_242_880),
})

/** Field defaults applied when the gateway is constructed directly. */
export function resolveConfig(config: Config): Required<Config> {
  return {
    cronIntervalMs: config.cronIntervalMs ?? 30_000,
    balanceApiKeyEnv: config.balanceApiKeyEnv ?? 'DEEPSEEK_API_KEY',
    balanceCacheTtlMs: config.balanceCacheTtlMs ?? 60_000,
    balanceBaseUrl: config.balanceBaseUrl ?? 'https://api.deepseek.com',
    balanceProviders: config.balanceProviders ?? ['deepseek-official'],
    skipDirs: config.skipDirs ?? ['node_modules'],
    readMaxBytes: config.readMaxBytes ?? 1_048_576,
    writeMaxBytes: config.writeMaxBytes ?? 2_097_152,
    binaryMaxBytes: config.binaryMaxBytes ?? 5_242_880,
    gitOutputMaxBytes: config.gitOutputMaxBytes ?? 262_144,
    gitMaxCount: config.gitMaxCount ?? 100,
    searchMaxDepth: config.searchMaxDepth ?? 8,
    searchMaxEntries: config.searchMaxEntries ?? 200,
    officeMaxBytes: config.officeMaxBytes ?? 5_242_880,
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

  /** Recursive basename search (bounded). */
  @Remote('fsSearch')
  async fsSearch(request: FsSearchRequest): Promise<FsSearchResult> {
    const root = this.workspaceRootFor(request.workspaceId)
    if (root === null) return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } }
    try {
      return { entries: await searchFiles(root, request.path ?? '', request.query ?? '', this.fsLimits) }
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

  // ── internals ────────────────────────────────────────────────────────────

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

  private async withGit<T>(workspaceId: string, fn: (client: GitClient) => Promise<T>): Promise<T | { error: ApiError }> {
    const root = this.workspaceRootFor(workspaceId)
    if (root === null) return { error: { code: 'workspace-not-found', message: `workspace '${workspaceId}' does not exist` } }
    try {
      return await fn(new GitClient(this.ctx.subprocess, root, this.gitLimits))
    } catch (error) {
      return { error: this.errorOf(error, 'git-error') }
    }
  }

  private errorOf(error: unknown, fallback: string): ApiError {
    const message = error instanceof Error ? error.message : String(error)
    const code = error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT'
      ? 'not-found'
      : fallback
    return { code, message }
  }
}
