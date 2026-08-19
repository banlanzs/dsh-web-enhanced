/**
 * Board domain assembly: the task board's world access, in one place.
 *
 * `TaskBoard` itself owns the durable records and the scheduler; this is the
 * seam that binds it to the host's agent, session, and workspace services so
 * the gateway assembles a board without knowing what a run needs.
 * @module dsh-web-enhanced/src/board-gateway
 */
import type { Context } from '@deepseek-ai/cordis';
import { TaskBoard } from './board.ts';
import type { BoardConfigInput, BoardDeps } from './board.ts';
import type { WorkspaceFace } from './workspace-service.ts';
/** What the board assembly needs from the rest of the plugin. */
export interface BoardDomainDeps {
    readonly ctx: Context;
    readonly workspace: WorkspaceFace;
    readonly config: Required<BoardConfigInput>;
}
/** The board's world access: run services plus workspace resolution. */
export declare function boardDeps(deps: BoardDomainDeps): BoardDeps;
/**
 * Assemble the task board: mount it (recovering interrupted runs) and start
 * its scheduler.
 * @param deps - context, workspace resolution, and the board config.
 * @returns the mounted board.
 */
export declare function createBoardDomain(deps: BoardDomainDeps): TaskBoard;
