/**
 * Board domain assembly: the task board's world access, in one place.
 *
 * `TaskBoard` itself owns the durable records and the scheduler; this is the
 * seam that binds it to the host's agent, session, and workspace services so
 * the gateway assembles a board without knowing what a run needs.
 * @module dsh-web-enhanced/src/board-gateway
 */
import { TaskBoard } from "./board.js";
/**
 * The host services one task run reaches for.
 *
 * `presets` and `attachWorkspaceSession` are deliberately lenient: a
 * deployment composed without a roster must still run tasks, and a refused
 * workspace membership is a reportable miss rather than a lost run.
 * @param ctx - the owning context.
 * @returns the run dependencies.
 */
function runDeps(ctx) {
    const loader = ctx.get('loader');
    return {
        agents: ctx.agents,
        sessions: ctx.sessions,
        agentDefaultModel: ctx.agentDefaultModel,
        awaitLoader: loader === undefined ? undefined : () => loader.await(),
        // Read uninjected and per call: the roster is what carries a session's
        // tools, but a deployment composed without one must still run tasks, and
        // the service may mount after the gateway does.
        presets: () => ctx.get('agentPresets'),
        attachWorkspaceSession: async (workspaceId, sessionId) => {
            // Never fatal to the run: the session already exists and already works
            // in the right directory, so a refused membership is a reportable miss
            // rather than a reason to lose a started run. The registry validates
            // the session header's canonical cwd against the workspace path, which
            // is the realistic refusal (a path that moved under the record).
            try {
                const workspace = ctx.workspaceRegistry.get(workspaceId);
                if (workspace === undefined) {
                    throw new Error(`workspace '${workspaceId}' is no longer registered`);
                }
                await workspace.attachSession(sessionId);
            }
            catch (error) {
                ctx.logger.warn(`web-enhanced could not record run session '${sessionId}' on workspace '${workspaceId}': `
                    + (error instanceof Error ? error.message : String(error)));
            }
        },
    };
}
/** The board's world access: run services plus workspace resolution. */
export function boardDeps(deps) {
    return {
        ...runDeps(deps.ctx),
        workspaceRoot: workspaceId => deps.workspace.root(workspaceId),
        resolveWorkspaceId: workspaceId => deps.workspace.resolveId(workspaceId),
        logger: deps.ctx.logger,
    };
}
/**
 * Assemble the task board: mount it (recovering interrupted runs) and start
 * its scheduler.
 * @param deps - context, workspace resolution, and the board config.
 * @returns the mounted board.
 */
export function createBoardDomain(deps) {
    return new TaskBoard(deps.ctx, boardDeps(deps), { cronIntervalMs: deps.config.cronIntervalMs });
}
