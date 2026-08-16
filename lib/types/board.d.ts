/**
 * Task board domain: durable records (storage-domain table), cron scheduling
 * with restart recovery, and real agent-session execution. The gateway
 * delegates every task* method here; business failures are result fields.
 * @module dsh-web-enhanced/src/board
 */
import type { Context } from '@deepseek-ai/cordis';
import type { WorkspaceId } from '@deepseek-ai/dsh-workspace';
import type { RunDeps } from './run-task.ts';
import type { TaskCreateRequest, TaskCreateResult, TaskListResult, TaskRemoveRequest, TaskRemoveResult, TaskRunRequest, TaskRunResult, TaskUpdateRequest, TaskUpdateResult } from './types.ts';
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
