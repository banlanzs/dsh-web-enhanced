/**
 * Task board domain: durable records (storage-domain table), cron scheduling
 * with restart recovery, and real agent-session execution. The gateway
 * delegates every task* method here; business failures are result fields.
 * @module dsh-web-enhanced/src/board
 */
import { randomUUID } from 'node:crypto';
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain';
import { nextAfter, parseCron } from "./cron.js";
import { createTaskAgent, executeTaskAgent } from "./run-task.js";
import { memoryRecordSchema, taskRecordSchema } from "./schemas.js";
/** Brand a raw id as a task id at the owning boundary. */
function taskId(value) {
    return value;
}
/** The web-enhanced task domain: one validated tasks table. */
const taskDomainSpec = defineDomain({
    // The unit-name grammar allows letters, digits, and underscores only.
    name: 'web_enhanced',
    version: 2,
    tables: {
        // The record schema validates at the durable boundary; TaskId is a
        // compile-time brand over the same string field.
        tasks: domainTable(taskRecordSchema),
        memories: domainTable(memoryRecordSchema),
    },
});
/** Shared open of the web-enhanced domain, keyed by the domain facility. */
const sharedDomains = new WeakMap();
/**
 * Open the web-enhanced domain exactly once per domain facility and cache
 * the promise. TaskBoard and the memory feature share this handle; the
 * storage facility rejects a second open of the same name. Keying the cache
 * by facility keeps every test harness (one facility per context) isolated.
 * @param ctx - owning context with the injected storageDomain service.
 * @returns the shared domain promise.
 */
export function openSharedDomain(ctx) {
    const facility = ctx.get('storageDomain');
    let promise = sharedDomains.get(facility);
    if (promise === undefined) {
        promise = facility.open(taskDomainSpec);
        sharedDomains.set(facility, promise);
    }
    return promise;
}
/**
 * The task board: durable CRUD, the cron scheduler, and run settlement.
 * One instance per gateway; the storage domain opens once (recovering
 * interrupted runs) and the scheduler arms a one-shot timer at the earliest
 * pending next run, re-armed after every pass and task mutation.
 */
export class TaskBoard {
    deps;
    ready;
    /** In-flight run guard (the durable status is authoritative; this is the admission lock). */
    runs = new Set();
    /** Pending one-shot scheduler timer; undefined while nothing is scheduled. */
    schedulerTimer;
    cronIntervalMs;
    /**
     * @param ctx - owning context with the injected storageDomain service.
     * @param deps - world access (run services + workspace resolution).
     * @param config - board configuration.
     */
    constructor(ctx, deps, config) {
        this.deps = deps;
        this.cronIntervalMs = config.cronIntervalMs;
        this.ready = this.openDomain(ctx);
        ctx.effect(() => {
            // The boot pass starts everything already due; its re-arm covers the rest.
            void this.schedulerTick();
            return () => this.disarmScheduler();
        });
    }
    /** The opened domain promise; shared with the memory store. */
    get domain() {
        return this.ready;
    }
    /** List every task, oldest first. */
    async list() {
        const domain = await this.ready;
        const tasks = [...domain.table('tasks').entries()]
            .map(([, task]) => task)
            .sort((left, right) => left.createdAt - right.createdAt);
        return { tasks };
    }
    /** Create a task; a cron expression is validated and its next run computed. */
    async create(request) {
        try {
            const title = request.title.trim();
            const prompt = request.prompt.trim();
            if (title === '')
                return { error: { code: 'invalid-title', message: 'title must not be empty' } };
            if (prompt === '')
                return { error: { code: 'invalid-prompt', message: 'prompt must not be empty' } };
            const cron = request.cron === undefined || request.cron.trim() === '' ? null : request.cron.trim();
            let nextRunAt = null;
            if (cron !== null) {
                const spec = parseCron(cron);
                nextRunAt = nextAfter(spec, Date.now());
                if (nextRunAt === null) {
                    return { error: { code: 'cron-never', message: `cron '${cron}' never fires within the planning horizon` } };
                }
            }
            const workspaceId = request.workspaceId === undefined || request.workspaceId === null
                ? null
                : this.deps.resolveWorkspaceId(request.workspaceId);
            if (request.workspaceId !== undefined && request.workspaceId !== null && workspaceId === null) {
                return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } };
            }
            const domain = await this.ready;
            const now = Date.now();
            const task = {
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
            };
            await domain.table('tasks').put(task.id, task);
            this.armScheduler(domain);
            return { task };
        }
        catch (error) {
            return { error: this.errorOf(error, 'task-create') };
        }
    }
    /** Update title, prompt, cron, or board column (planned/todo only). */
    async update(request) {
        try {
            const id = request.id;
            if (id === '')
                return { error: { code: 'invalid-id', message: 'task id must not be empty' } };
            const domain = await this.ready;
            const table = domain.table('tasks');
            const now = Date.now();
            // Workspace rebinding resolves before the update callback: the callback
            // is synchronous and must not carry a lookup that can fail per attempt.
            let workspaceId;
            if (request.workspaceId !== undefined) {
                if (request.workspaceId === null) {
                    workspaceId = null;
                }
                else {
                    workspaceId = this.deps.resolveWorkspaceId(request.workspaceId);
                    if (workspaceId === null) {
                        return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } };
                    }
                }
            }
            const task = await table.update(id, current => {
                if (current.status === 'running') {
                    throw new Error(`task '${current.title}' is running and cannot be edited`);
                }
                const title = request.title === undefined ? current.title : request.title.trim();
                if (title === '')
                    throw new Error('title must not be empty');
                const prompt = request.prompt === undefined ? current.prompt : request.prompt.trim();
                if (prompt === '')
                    throw new Error('prompt must not be empty');
                const status = request.status === undefined ? current.status : request.status;
                if (status !== 'planned' && status !== 'todo') {
                    throw new Error(`status '${status}' cannot be set through update`);
                }
                let cron;
                let nextRunAt;
                if (request.cron === undefined) {
                    cron = current.cron;
                    nextRunAt = current.nextRunAt;
                }
                else {
                    const raw = request.cron === null ? '' : request.cron.trim();
                    cron = raw === '' ? null : raw;
                    nextRunAt = null;
                    if (cron !== null) {
                        const spec = parseCron(cron);
                        nextRunAt = nextAfter(spec, now);
                        if (nextRunAt === null)
                            throw new Error(`cron '${cron}' never fires within the planning horizon`);
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
                };
            });
            this.armScheduler(domain);
            return { task };
        }
        catch (error) {
            return { error: this.errorOf(error, 'task-update') };
        }
    }
    /** Remove one task record. */
    async remove(request) {
        try {
            const id = request.id;
            if (id === '')
                return { error: { code: 'invalid-id', message: 'task id must not be empty' } };
            const domain = await this.ready;
            const removed = await domain.table('tasks').delete(id);
            this.armScheduler(domain);
            return { removed };
        }
        catch (error) {
            /* v8 ignore next -- the in-memory domain delete never rejects */
            return { error: this.errorOf(error, 'task-remove') };
        }
    }
    /** Start one task immediately in a fresh agent session. */
    async run(request) {
        const id = request.id;
        if (id === '')
            return { error: { code: 'invalid-id', message: 'task id must not be empty' } };
        const domain = await this.ready;
        const table = domain.table('tasks');
        const current = table.get(id);
        if (current === undefined) {
            return { error: { code: 'task-not-found', message: `task '${id}' does not exist` } };
        }
        if (current.status === 'running' || this.runs.has(current.id)) {
            return { error: { code: 'task-already-running', message: `task '${current.title}' is already running` } };
        }
        const workspaceId = request.workspaceId === undefined || request.workspaceId === null
            ? current.workspaceId
            : this.deps.resolveWorkspaceId(request.workspaceId);
        if (request.workspaceId !== undefined && request.workspaceId !== null && workspaceId === null) {
            return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } };
        }
        this.runs.add(current.id);
        try {
            const { agent, sessionId } = await createTaskAgent(this.deps, {
                cwd: this.deps.workspaceRoot(workspaceId),
                workspaceId,
            });
            /* v8 ignore next -- admission lock above makes the already-running race unreachable */
            await table.update(current.id, record => record.status === 'running'
                ? record
                : { ...record, status: 'running', sessionId, lastRunAt: Date.now(), result: null, workspaceId, updatedAt: Date.now() });
            void this.completeRun(current.id, agent, current.prompt);
            return { started: true, sessionId };
        }
        catch (error) {
            this.runs.delete(current.id);
            return { error: this.errorOf(error, 'task-run') };
        }
    }
    /** Recover interrupted runs and open the domain for the gateway. */
    async openDomain(ctx) {
        const domain = await openSharedDomain(ctx);
        // Restart recovery: an interrupted run can never finish, so it settles as
        // failed with the reason the UI renders.
        const now = Date.now();
        for (const [id, task] of [...domain.table('tasks').entries()]) {
            if (task.status !== 'running')
                continue;
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
                : current);
        }
        return domain;
    }
    /** One scheduler pass: start every due task, then re-arm at the earliest pending run. */
    async schedulerTick() {
        try {
            const domain = await this.ready;
            const now = Date.now();
            for (const [id, task] of [...domain.table('tasks').entries()]) {
                if (task.status === 'running' || this.runs.has(id))
                    continue;
                if (task.cron === null || task.nextRunAt === null || task.nextRunAt > now)
                    continue;
                await this.runScheduled(id);
            }
            this.armScheduler(domain);
        }
        catch (error) {
            /* v8 ignore next -- the missing-domain TypeError is the only reachable tick failure */
            this.deps.logger.warn(`web-enhanced scheduler tick failed: ${error instanceof Error ? error.message : String(error)}`);
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
    armScheduler(domain) {
        this.disarmScheduler();
        let earliest;
        for (const [, task] of domain.table('tasks').entries()) {
            if (task.status === 'running' || this.runs.has(task.id))
                continue;
            if (task.nextRunAt === null)
                continue;
            if (earliest === undefined || task.nextRunAt < earliest)
                earliest = task.nextRunAt;
        }
        if (earliest === undefined)
            return;
        this.schedulerTimer = setTimeout(() => {
            this.schedulerTimer = undefined;
            void this.schedulerTick();
        }, Math.max(earliest - Date.now(), this.cronIntervalMs));
    }
    /** Drop the pending scheduler timer, if any. */
    disarmScheduler() {
        if (this.schedulerTimer === undefined)
            return;
        clearTimeout(this.schedulerTimer);
        this.schedulerTimer = undefined;
    }
    async runScheduled(id) {
        const domain = await this.ready;
        const table = domain.table('tasks');
        const current = table.get(id);
        if (current === undefined || current.status === 'running' || this.runs.has(id))
            return;
        this.runs.add(id);
        try {
            const { agent, sessionId } = await createTaskAgent(this.deps, {
                cwd: this.deps.workspaceRoot(current.workspaceId),
                workspaceId: current.workspaceId,
            });
            /* v8 ignore next -- admission lock above makes the already-running race unreachable */
            await table.update(id, record => record.status === 'running'
                ? record
                : { ...record, status: 'running', sessionId, lastRunAt: Date.now(), result: null, updatedAt: Date.now() });
            void this.completeRun(id, agent, current.prompt);
        }
        catch (error) {
            this.runs.delete(id);
            this.deps.logger.warn(`web-enhanced scheduled run for '${current.title}' failed to start: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /** Drive the run to quiescence and settle the record (status + result + next run). */
    async completeRun(id, agent, prompt) {
        try {
            const outcome = await executeTaskAgent(this.deps, agent, prompt);
            const domain = await this.ready;
            const now = Date.now();
            await domain.table('tasks').update(id, current => {
                const result = outcome.result;
                const status = result.reasonKind === 'completed' ? 'done' : 'failed';
                // Cron edits are validated at update time; a stale expression here
                // stops scheduling instead of failing the run retroactively.
                let nextRunAt = current.nextRunAt;
                if (current.cron !== null) {
                    try {
                        nextRunAt = nextAfter(parseCron(current.cron), now);
                    }
                    catch {
                        nextRunAt = null;
                    }
                }
                return { ...current, status, result, nextRunAt, updatedAt: now };
            });
            this.armScheduler(domain);
        }
        catch (error) {
            try {
                const domain = await this.ready;
                const now = Date.now();
                await domain.table('tasks').update(id, current => ({
                    ...current,
                    status: 'failed',
                    result: {
                        reasonKind: 'interrupted',
                        errorCode: 'run-failed',
                        errorMessage: error instanceof Error ? error.message : String(error),
                    },
                    updatedAt: now,
                }));
                this.armScheduler(domain);
            }
            catch (settleError) {
                /* v8 ignore next -- domain and backend failures are always Error instances */
                this.deps.logger.warn(`web-enhanced run settlement failed for '${id}': ${settleError instanceof Error ? settleError.message : String(settleError)}`);
            }
        }
        finally {
            this.runs.delete(id);
        }
    }
    errorOf(error, fallback) {
        const message = error instanceof Error ? error.message : String(error);
        const code = error instanceof Error && error.code === 'ENOENT'
            ? 'not-found'
            : fallback;
        return { code, message };
    }
}
