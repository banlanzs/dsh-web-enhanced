/**
 * Session-to-workspace resolution shared by every surface that needs "the
 * current project". The right panel, the branch strip, and the git graph all
 * operate on a workspace root, while the framework hands components the
 * current SESSION — this is the one place that bridges the two.
 * @module dsh-web-enhanced/src/client/workspace
 */
import type { WorkspaceView } from '@deepseek-ai/dsh-client-runtime/client';
/** The slice of the session list this resolution reads. */
export interface SessionSlice {
    readonly current: string | undefined;
}
/** The slice of the workspace list this resolution reads. */
export interface WorkspaceSlice {
    readonly items: readonly WorkspaceView[];
}
/**
 * The workspace accounting for the current session.
 *
 * Absent when no session is current or when the current session belongs to no
 * workspace — an ungrouped session has no project root, so the surfaces that
 * need one render their empty state instead of guessing at a directory.
 * @param sessions - current-session slice.
 * @param workspaces - workspace list slice.
 * @returns the owning workspace, or undefined.
 */
export declare function workspaceOfSession(sessions: SessionSlice, workspaces: WorkspaceSlice): WorkspaceView | undefined;
