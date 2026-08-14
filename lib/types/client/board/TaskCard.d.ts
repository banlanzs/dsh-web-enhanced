/**
 * One task card on the board. Owns its own edit form, so opening an editor on
 * one card cannot disturb the others, and reports every mutation upward — the
 * board owns the task list and the refresh cadence.
 * @module dsh-web-enhanced/src/client/board/TaskCard
 */
import type { WorkspaceView } from '@deepseek-ai/dsh-client-runtime/client';
import type { TaskRecord, TaskUpdateRequest } from '../contract.ts';
import type { Translate } from '../locale-keys.ts';
/** Props of one task card. */
export interface TaskCardProps {
    readonly task: TaskRecord;
    readonly workspaces: readonly WorkspaceView[];
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
/** One task card: summary, schedule, outcome, and the actions for its column. */
export declare function TaskCard({ task, workspaces, t, onRun, onOpen, onRemove, onUpdate }: TaskCardProps): import("react").JSX.Element;
