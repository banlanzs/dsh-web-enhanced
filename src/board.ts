/**
 * Task board domain: durable records (storage-domain table), cron scheduling
 * with restart recovery, and real agent-session execution. The gateway
 * delegates every task* method here; business failures are result fields.
 * @module dsh-web-enhanced/src/board
 */

import { randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import type { Domain } from '@deepseek-ai/dsh-storage-domain'
import type { ZodType } from 'zod'
import z from '@deepseek-ai/schemastery'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { WorkspaceId } from '@deepseek-ai/dsh-workspace'
import { nextAfter, parseCron } from './cron.ts'
import { createTaskAgent, executeTaskAgent } from './run-task.ts'
import type { RunDeps } from './run-task.ts'
import { memoryRecordSchema, taskRecordSchema } from './schemas.ts'
import type {
  ApiError, TaskCreateRequest, TaskCreateResult, TaskId, TaskListResult, TaskRecord,
  TaskRemoveRequest, TaskRemoveResult, TaskRunRequest, TaskRunResult, TaskStatus,
  TaskUpdateRequest, TaskUpdateResult,
  MemoryId, MemoryRecord,
} from './types.ts'

/** Brand a raw id as a task id at the owning boundary. */
function taskId(value: string): TaskId {
  return value as TaskId
}

/** The web-enhanced task domain: one validated tasks table. */
const taskDomainSpec = defineDomain({
  // The unit-name grammar allows letters, digits, and underscores only.
  name: 'web_enhanced',
  version: 2,
  tables: {
    // The record schema validates at the durable boundary; TaskId is a
    // compile-time brand over the same string field.
    tasks: domainTable<TaskId, TaskRecord>(taskRecordSchema as unknown as ZodType<TaskRecord>),
    memories: domainTable<MemoryId, MemoryRecord>(memoryRecordSchema as unknown as ZodType<MemoryRecord>),
  },
})

/** The storage hub face the v1→v2 migration needs, structurally. */
interface StorageBackendFace {
  /** JSON backend root; absent on other backends (no file to migrate). */
  readonly root?: unknown
}

interface StorageHubFace {
  readonly backend: {
    get(name: string): StorageBackendFace | undefined
  }
}

/** The domain facility face the migration needs, structurally. */
interface DomainFacilityFace {
  readonly config: {
    readonly backend: string
    readonly routes?: Record<string, string>
  }
}

/** Migrations already started per domain facility (same key as sharedDomains). */
const sharedMigrations = new WeakMap<object, Promise<void>>()

/**
 * Upgrade an existing v1 `web_enhanced.json` to the v2 layout before the
 * domain opens. The memory feature added the `memories` table to a domain
 * whose tasks already live on users' disks; the JSON backend rejects a
 * version mismatch at open, so the file must be stamped to v2 (and gain an
 * empty `memories` table) first. The rewrite only touches a document whose
 * header is exactly `{ name: 'web_enhanced', version: 1 }`; malformed or
 * already-current files are left for the backend's own diagnostics.
 * @param ctx - owning context with storage + storageDomain services.
 */
export async function migrateJsonDomainV1ToV2(ctx: Context): Promise<void> {
  const facility = ctx.get('storageDomain' as never, false) as unknown as DomainFacilityFace | undefined
  const hub = ctx.get('storage' as never, false) as unknown as StorageHubFace | undefined
  if (facility === undefined || hub === undefined) return
  const backendName = facility.config.routes?.['web_enhanced'] ?? facility.config.backend
  const root = hub.backend.get(backendName)?.root
  if (typeof root !== 'string') return
  const path = join(root, 'web_enhanced.json')
  let document: unknown
  try {
    document = JSON.parse(await readFile(path, 'utf8'))
  } catch {
    // No file, unreadable, or not JSON: the normal open reports its own error.
    return
  }
  if (typeof document !== 'object' || document === null) return
  const record = document as Record<string, unknown>
  const unit = record['unit']
  if (typeof unit !== 'object' || unit === null) return
  const header = unit as Record<string, unknown>
  if (header['name'] !== 'web_enhanced' || header['version'] !== 1) return
  const tables = record['tables']
  if (typeof tables !== 'object' || tables === null || Array.isArray(tables)) return
  header['version'] = 2
  const tableRecord = tables as Record<string, unknown>
  if (tableRecord['memories'] === undefined) tableRecord['memories'] = {}
  try {
    await writeFile(path, `${JSON.stringify(document, null, 2)}
`, 'utf8')
  } catch {
    // The open below reports the version mismatch; keep the original error path.
  }
}

/** Shared open of the web-enhanced domain, keyed by the domain facility. */
const sharedDomains = new WeakMap<object, Promise<Domain<typeof taskDomainSpec>>>()

/**
 * Open the web-enhanced domain exactly once per domain facility and cache
 * the promise. TaskBoard and the memory feature share this handle; the
 * storage facility rejects a second open of the same name. Keying the cache
 * by facility keeps every test harness (one facility per context) isolated.
 * A one-time JSON-medium migration runs before the first open so existing
 * v1 task stores upgrade to the v2 layout with the memories table.
 * @param ctx - owning context with the injected storageDomain service.
 * @returns the shared domain promise.
 */
export async function openSharedDomain(ctx: Context): Promise<Domain<typeof taskDomainSpec>> {
  const facility = ctx.get('storageDomain')!
  let migration = sharedMigrations.get(facility)
  if (migration === undefined) {
    migration = migrateJsonDomainV1ToV2(ctx)
    sharedMigrations.set(facility, migration)
  }
  await migration
  let promise = sharedDomains.get(facility)
  if (promise === undefined) {
    promise = facility.open(taskDomainSpec)
    sharedDomains.set(facility, promise)
  }
  return promise
}

/** Board configuration (deployment config, not tunables). */
export interface BoardConfig {
  /**
   * Floor on the scheduler's armed delay. The scheduler arms one one-shot
   * timer at the earliest pending next run; this knob keeps that delay at
   * least one interval, so a due task starts within one interval of its time
   * (the fixed interval's own worst case) and a board with nothing scheduled
   * arms no timer at all.
   */
  readonly cronIntervalMs: number
}

/** The board's slice of the plugin config (user input; defaults bind later). */
export interface BoardConfigInput {
  cronIntervalMs?: number
}

/** The board's config fragment, as the plugin schema assembles it. */
export const boardConfigFragment = z.object({
  cronIntervalMs: z.number().default(30_000),
})

/** Field defaults applied when the board is assembled directly. */
export function resolveBoardConfig(config: Partial<BoardConfigInput>): Required<BoardConfigInput> {
  return { cronIntervalMs: config.cronIntervalMs ?? 30_000 }
}

/** How the board reaches the world outside the task table. */
export interface BoardDeps extends RunDeps {
  /** Resolve a workspace id to its canonical root; fallback for null ids. */
  readonly workspaceRoot: (workspaceId: WorkspaceId | null) => string
  /** Resolve a requested workspace id; null when unknown. */
  readonly resolveWorkspaceId: (workspaceId: string) => WorkspaceId | null
  /** Scheduler/settlement diagnostics sink. */
  readonly logger: { warn(message: string): void }
}

/**
 * The task board: durable CRUD, the cron scheduler, and run settlement.
 * One instance per gateway; the storage domain opens once (recovering
 * interrupted runs) and the scheduler arms a one-shot timer at the earliest
 * pending next run, re-armed after every pass and task mutation.
 */
export class TaskBoard {
  private readonly ready: Promise<Domain<typeof taskDomainSpec>>
  /** In-flight run guard (the durable status is authoritative; this is the admission lock). */
  private readonly runs = new Set<string>()
  /** Pending one-shot scheduler timer; undefined while nothing is scheduled. */
  private schedulerTimer: ReturnType<typeof setTimeout> | undefined
  private readonly cronIntervalMs: number

  /**
   * @param ctx - owning context with the injected storageDomain service.
   * @param deps - world access (run services + workspace resolution).
   * @param config - board configuration.
   */
  constructor(ctx: Context, private readonly deps: BoardDeps, config: BoardConfig) {
    this.cronIntervalMs = config.cronIntervalMs
    this.ready = this.openDomain(ctx)
    ctx.effect(() => {
      // The boot pass starts everything already due; its re-arm covers the rest.
      void this.schedulerTick()
      return () => this.disarmScheduler()
    })
  }

  /** The opened domain promise; shared with the memory store. */
  get domain(): Promise<Domain<typeof taskDomainSpec>> {
    return this.ready
  }

  /** List every task, oldest first. */
  async list(): Promise<TaskListResult> {
    const domain = await this.ready
    const tasks = [...domain.table('tasks').entries()]
      .map(([, task]) => task)
      .sort((left, right) => left.createdAt - right.createdAt)
    return { tasks }
  }

  /** Create a task; a cron expression is validated and its next run computed. */
  async create(request: TaskCreateRequest): Promise<TaskCreateResult> {
    try {
      const title = request.title.trim()
      const prompt = request.prompt.trim()
      if (title === '') return { error: { code: 'invalid-title', message: 'title must not be empty' } }
      if (prompt === '') return { error: { code: 'invalid-prompt', message: 'prompt must not be empty' } }
      const cron = request.cron === undefined || request.cron.trim() === '' ? null : request.cron.trim()
      let nextRunAt: number | null = null
      if (cron !== null) {
        const spec = parseCron(cron)
        nextRunAt = nextAfter(spec, Date.now())
        if (nextRunAt === null) {
          return { error: { code: 'cron-never', message: `cron '${cron}' never fires within the planning horizon` } }
        }
      }
      const workspaceId = request.workspaceId === undefined || request.workspaceId === null
        ? null
        : this.deps.resolveWorkspaceId(request.workspaceId)
      if (request.workspaceId !== undefined && request.workspaceId !== null && workspaceId === null) {
        return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } }
      }
      const domain = await this.ready
      const now = Date.now()
      const task: TaskRecord = {
        id: taskId(`task-${randomUUID()}`),
        title,
        prompt,
        status: 'planned',
        cron,
        nextRunAt,
        workspaceId,
        sessionId: null,
        result: null,
        createdAt: now,
        updatedAt: now,
        lastRunAt: null,
      }
      await domain.table('tasks').put(task.id, task)
      this.armScheduler(domain)
      return { task }
    } catch (error) {
      return { error: this.errorOf(error, 'task-create') }
    }
  }

  /** Update title, prompt, cron, or board column (planned/todo only). */
  async update(request: TaskUpdateRequest): Promise<TaskUpdateResult> {
    try {
      const id = request.id
      if (id === '') return { error: { code: 'invalid-id', message: 'task id must not be empty' } }
      const domain = await this.ready
      const table = domain.table('tasks')
      const now = Date.now()
      // Workspace rebinding resolves before the update callback: the callback
      // is synchronous and must not carry a lookup that can fail per attempt.
      let workspaceId: WorkspaceId | null | undefined
      if (request.workspaceId !== undefined) {
        if (request.workspaceId === null) {
          workspaceId = null
        } else {
          workspaceId = this.deps.resolveWorkspaceId(request.workspaceId)
          if (workspaceId === null) {
            return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } }
          }
        }
      }
      const task = await table.update(id as TaskId, current => {
        if (current.status === 'running') {
          throw new Error(`task '${current.title}' is running and cannot be edited`)
        }
        const title = request.title === undefined ? current.title : request.title.trim()
        if (title === '') throw new Error('title must not be empty')
        const prompt = request.prompt === undefined ? current.prompt : request.prompt.trim()
        if (prompt === '') throw new Error('prompt must not be empty')
        const status: TaskStatus = request.status === undefined ? current.status : request.status
        if (status !== 'planned' && status !== 'todo') {
          throw new Error(`status '${status}' cannot be set through update`)
        }
        let cron: string | null
        let nextRunAt: number | null
        if (request.cron === undefined) {
          cron = current.cron
          nextRunAt = current.nextRunAt
        } else {
          const raw = request.cron === null ? '' : request.cron.trim()
          cron = raw === '' ? null : raw
          nextRunAt = null
          if (cron !== null) {
            const spec = parseCron(cron)
            nextRunAt = nextAfter(spec, now)
            if (nextRunAt === null) throw new Error(`cron '${cron}' never fires within the planning horizon`)
          }
        }
        return {
          ...current,
          title,
          prompt,
          status,
          cron,
          nextRunAt,
          ...(workspaceId === undefined ? {} : { workspaceId }),
          updatedAt: now,
        }
      })
      this.armScheduler(domain)
      return { task }
    } catch (error) {
      return { error: this.errorOf(error, 'task-update') }
    }
  }

  /** Remove one task record. */
  async remove(request: TaskRemoveRequest): Promise<TaskRemoveResult> {
    try {
      const id = request.id
      if (id === '') return { error: { code: 'invalid-id', message: 'task id must not be empty' } }
      const domain = await this.ready
      const removed = await domain.table('tasks').delete(id as TaskId)
      this.armScheduler(domain)
      return { removed }
    } catch (error) {
      /* v8 ignore next -- the in-memory domain delete never rejects */
      return { error: this.errorOf(error, 'task-remove') }
    }
  }

  /** Start one task immediately in a fresh agent session. */
  async run(request: TaskRunRequest): Promise<TaskRunResult> {
    const id = request.id
    if (id === '') return { error: { code: 'invalid-id', message: 'task id must not be empty' } }
    const domain = await this.ready
    const table = domain.table('tasks')
    const current = table.get(id as TaskId)
    if (current === undefined) {
      return { error: { code: 'task-not-found', message: `task '${id}' does not exist` } }
    }
    if (current.status === 'running' || this.runs.has(current.id)) {
      return { error: { code: 'task-already-running', message: `task '${current.title}' is already running` } }
    }
    const workspaceId = request.workspaceId === undefined || request.workspaceId === null
      ? current.workspaceId
      : this.deps.resolveWorkspaceId(request.workspaceId)
    if (request.workspaceId !== undefined && request.workspaceId !== null && workspaceId === null) {
      return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } }
    }
    this.runs.add(current.id)
    try {
      const { agent, sessionId } = await createTaskAgent(this.deps, {
        cwd: this.deps.workspaceRoot(workspaceId),
        workspaceId,
      })
      /* v8 ignore next -- admission lock above makes the already-running race unreachable */
      await table.update(current.id, record => record.status === 'running'
        ? record
        : { ...record, status: 'running', sessionId, lastRunAt: Date.now(), result: null, workspaceId, updatedAt: Date.now() })
      void this.completeRun(current.id, agent, current.prompt)
      return { started: true, sessionId }
    } catch (error) {
      this.runs.delete(current.id)
      return { error: this.errorOf(error, 'task-run') }
    }
  }

  /** Recover interrupted runs and open the domain for the gateway. */
  private async openDomain(ctx: Context): Promise<Domain<typeof taskDomainSpec>> {
    const domain = await openSharedDomain(ctx)
    // Restart recovery: an interrupted run can never finish, so it settles as
    // failed with the reason the UI renders.
    const now = Date.now()
    for (const [id, task] of [...domain.table('tasks').entries()]) {
      if (task.status !== 'running') continue
      /* v8 ignore next -- the running check above makes the already-failed race unreachable */
      await domain.table('tasks').update(id, current => current.status === 'running'
        ? {
            ...current,
            status: 'failed',
            result: {
              reasonKind: 'interrupted',
              errorCode: 'host-restart',
              errorMessage: 'the host restarted while the task was running',
            },
            updatedAt: now,
          }
        : current)
    }
    return domain
  }

  /** One scheduler pass: start every due task, then re-arm at the earliest pending run. */
  private async schedulerTick(): Promise<void> {
    try {
      const domain = await this.ready
      const now = Date.now()
      for (const [id, task] of [...domain.table('tasks').entries()]) {
        if (task.status === 'running' || this.runs.has(id)) continue
        if (task.cron === null || task.nextRunAt === null || task.nextRunAt > now) continue
        await this.runScheduled(id)
      }
      this.armScheduler(domain)
    } catch (error) {
      /* v8 ignore next -- the missing-domain TypeError is the only reachable tick failure */
      this.deps.logger.warn(`web-enhanced scheduler tick failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * (Re)arm the one-shot scheduler timer at the earliest pending next run.
   *
   * Clearing any pending timer first makes re-arming idempotent. Running
   * tasks are skipped: their next run is recomputed when the run settles, and
   * their stale past nextRunAt would otherwise re-arm a no-op pass every
   * interval. No pending next run disarms instead of scheduling a pass that
   * cannot start anything.
   * @param domain - the opened task domain.
   */
  private armScheduler(domain: Domain<typeof taskDomainSpec>): void {
    this.disarmScheduler()
    let earliest: number | undefined
    for (const [, task] of domain.table('tasks').entries()) {
      if (task.status === 'running' || this.runs.has(task.id)) continue
      if (task.nextRunAt === null) continue
      if (earliest === undefined || task.nextRunAt < earliest) earliest = task.nextRunAt
    }
    if (earliest === undefined) return
    this.schedulerTimer = setTimeout(() => {
      this.schedulerTimer = undefined
      void this.schedulerTick()
    }, Math.max(earliest - Date.now(), this.cronIntervalMs))
  }

  /** Drop the pending scheduler timer, if any. */
  private disarmScheduler(): void {
    if (this.schedulerTimer === undefined) return
    clearTimeout(this.schedulerTimer)
    this.schedulerTimer = undefined
  }

  private async runScheduled(id: TaskId): Promise<void> {
    const domain = await this.ready
    const table = domain.table('tasks')
    const current = table.get(id)
    if (current === undefined || current.status === 'running' || this.runs.has(id)) return
    this.runs.add(id)
    try {
      const { agent, sessionId } = await createTaskAgent(this.deps, {
        cwd: this.deps.workspaceRoot(current.workspaceId),
        workspaceId: current.workspaceId,
      })
      /* v8 ignore next -- admission lock above makes the already-running race unreachable */
      await table.update(id, record => record.status === 'running'
        ? record
        : { ...record, status: 'running', sessionId, lastRunAt: Date.now(), result: null, updatedAt: Date.now() })
      void this.completeRun(id, agent, current.prompt)
    } catch (error) {
      this.runs.delete(id)
      this.deps.logger.warn(`web-enhanced scheduled run for '${current.title}' failed to start: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /** Drive the run to quiescence and settle the record (status + result + next run). */
  private async completeRun(id: TaskId, agent: Agent, prompt: string): Promise<void> {
    try {
      const outcome = await executeTaskAgent(this.deps, agent, prompt)
      const domain = await this.ready
      const now = Date.now()
      await domain.table('tasks').update(id, current => {
        const result = outcome.result
        const status: TaskStatus = result.reasonKind === 'completed' ? 'done' : 'failed'
        // Cron edits are validated at update time; a stale expression here
        // stops scheduling instead of failing the run retroactively.
        let nextRunAt = current.nextRunAt
        if (current.cron !== null) {
          try {
            nextRunAt = nextAfter(parseCron(current.cron), now)
          } catch {
            nextRunAt = null
          }
        }
        return { ...current, status, result, nextRunAt, updatedAt: now }
      })
      this.armScheduler(domain)
    } catch (error) {
      try {
        const domain = await this.ready
        const now = Date.now()
        await domain.table('tasks').update(id, current => ({
          ...current,
          status: 'failed',
          result: {
            reasonKind: 'interrupted',
            errorCode: 'run-failed',
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          updatedAt: now,
        }))
        this.armScheduler(domain)
      } catch (settleError) {
        /* v8 ignore next -- domain and backend failures are always Error instances */
        this.deps.logger.warn(`web-enhanced run settlement failed for '${id}': ${settleError instanceof Error ? settleError.message : String(settleError)}`)
      }
    } finally {
      this.runs.delete(id)
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
