/**
 * Task board domain: durable records (storage-domain table), cron scheduling
 * with restart recovery, and real agent-session execution. The gateway
 * delegates every task* method here; business failures are result fields.
 * @module dsh-web-enhanced/src/board
 */
import type { Context } from '@deepseek-ai/cordis';
import type { Domain } from '@deepseek-ai/dsh-storage-domain';
import z from '@deepseek-ai/schemastery';
import type { WorkspaceId } from '@deepseek-ai/dsh-workspace';
import type { RunDeps } from './run-task.ts';
import type { TaskCreateRequest, TaskCreateResult, TaskId, TaskListResult, TaskRecord, TaskRemoveRequest, TaskRemoveResult, TaskRunRequest, TaskRunResult, TaskUpdateRequest, TaskUpdateResult, MemoryId, MemoryRecord } from './types.ts';
/** The web-enhanced task domain: one validated tasks table. */
declare const taskDomainSpec: {
    name: string;
    version: number;
    tables: {
        tasks: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<TaskId, TaskRecord>;
        memories: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<MemoryId, MemoryRecord>;
    };
};
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
export declare function migrateJsonDomainV1ToV2(ctx: Context): Promise<void>;
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
export declare function openSharedDomain(ctx: Context): Promise<Domain<typeof taskDomainSpec>>;
/** Board configuration (deployment config, not tunables). */
export interface BoardConfig {
    /**
     * Floor on the scheduler's armed delay. The scheduler arms one one-shot
     * timer at the earliest pending next run; this knob keeps that delay at
     * least one interval, so a due task starts within one interval of its time
     * (the fixed interval's own worst case) and a board with nothing scheduled
     * arms no timer at all.
     */
    readonly cronIntervalMs: number;
}
/** The board's slice of the plugin config (user input; defaults bind later). */
export interface BoardConfigInput {
    cronIntervalMs?: number;
}
/** The board's config fragment, as the plugin schema assembles it. */
export declare const boardConfigFragment: z<Schemastery.ObjectS<{
    cronIntervalMs: z<number, number>;
}>, Schemastery.ObjectT<{
    cronIntervalMs: z<number, number>;
}>>;
/** Field defaults applied when the board is assembled directly. */
export declare function resolveBoardConfig(config: Partial<BoardConfigInput>): Required<BoardConfigInput>;
/** How the board reaches the world outside the task table. */
export interface BoardDeps extends RunDeps {
    /** Resolve a workspace id to its canonical root; fallback for null ids. */
    readonly workspaceRoot: (workspaceId: WorkspaceId | null) => string;
    /** Resolve a requested workspace id; null when unknown. */
    readonly resolveWorkspaceId: (workspaceId: string) => WorkspaceId | null;
    /** Scheduler/settlement diagnostics sink. */
    readonly logger: {
        warn(message: string): void;
    };
}
/**
 * The task board: durable CRUD, the cron scheduler, and run settlement.
 * One instance per gateway; the storage domain opens once (recovering
 * interrupted runs) and the scheduler arms a one-shot timer at the earliest
 * pending next run, re-armed after every pass and task mutation.
 */
export declare class TaskBoard {
    private readonly deps;
    private readonly ready;
    /** In-flight run guard (the durable status is authoritative; this is the admission lock). */
    private readonly runs;
    /** Pending one-shot scheduler timer; undefined while nothing is scheduled. */
    private schedulerTimer;
    private readonly cronIntervalMs;
    /**
     * @param ctx - owning context with the injected storageDomain service.
     * @param deps - world access (run services + workspace resolution).
     * @param config - board configuration.
     */
    constructor(ctx: Context, deps: BoardDeps, config: BoardConfig);
    /** The opened domain promise; shared with the memory store. */
    get domain(): Promise<Domain<typeof taskDomainSpec>>;
    /** List every task, oldest first. */
    list(): Promise<TaskListResult>;
    /** Create a task; a cron expression is validated and its next run computed. */
    create(request: TaskCreateRequest): Promise<TaskCreateResult>;
    /** Update title, prompt, cron, or board column (planned/todo only). */
    update(request: TaskUpdateRequest): Promise<TaskUpdateResult>;
    /** Remove one task record. */
    remove(request: TaskRemoveRequest): Promise<TaskRemoveResult>;
    /** Start one task immediately in a fresh agent session. */
    run(request: TaskRunRequest): Promise<TaskRunResult>;
    /** Recover interrupted runs and open the domain for the gateway. */
    private openDomain;
    /** One scheduler pass: start every due task, then re-arm at the earliest pending run. */
    private schedulerTick;
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
    private armScheduler;
    /** Drop the pending scheduler timer, if any. */
    private disarmScheduler;
    private runScheduled;
    /** Drive the run to quiescence and settle the record (status + result + next run). */
    private completeRun;
    private errorOf;
}
export {};
