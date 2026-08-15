/**
 * One task card on the board. Owns its own edit form, so opening an editor on
 * one card cannot disturb the others, and reports every mutation upward — the
 * board owns the task list and the refresh cadence.
 * @module dsh-web-enhanced/src/client/board/TaskCard
 */
import type { TaskRecord, TaskUpdateRequest } from '../contract.ts';
import type { Translate } from '../locale-keys.ts';
/** The slice of a workspace row the card's project picker needs. */
export interface WorkspaceOption {
    readonly workspaceId: string;
    readonly title: string;
}
/** Props of one task card. */
export interface TaskCardProps {
    readonly task: TaskRecord;
    readonly workspaces: readonly WorkspaceOption[];
    readonly t: Translate;
    /** Start the task now. */
    readonly onRun: (task: TaskRecord) => void;
    /** Make the task's run session current. */
    readonly onOpen: (sessionId: string) => void;
    /** Delete the task. */
    readonly onRemove: (task: TaskRecord) => void;
    /** Apply an edit (title, prompt, cron, column, or workspace). */
    readonly onUpdate: (request: TaskUpdateRequest) => void;
}
/**
 * Whether a card starts collapsed.
 *
 * Only the done column. A finished task's prompt and result are what made the
 * column scroll for pages, and both are already history — but a FAILED task is
 * the opposite case: its message is the reason to look at the board at all, so
 * it stays open.
 * @param status - the task's column.
 * @returns true when the card collapses by default.
 */
export declare function collapsesByDefault(status: TaskRecord['status']): boolean;
/** One task card: summary, schedule, outcome, and the actions for its column. */
export declare function TaskCard({ task, workspaces, t, onRun, onOpen, onRemove, onUpdate }: TaskCardProps): import("react").JSX.Element;
