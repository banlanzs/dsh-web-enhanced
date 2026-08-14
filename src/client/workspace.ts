/**
 * Session-to-workspace resolution shared by every surface that needs "the
 * current project". The right panel, the branch strip, and the git graph all
 * operate on a workspace root, while the framework hands components the
 * current SESSION — this is the one place that bridges the two.
 * @module dsh-web-enhanced/src/client/workspace
 */

import type { WorkspaceView } from '@deepseek-ai/dsh-client-runtime/client'

/** The slice of the session list this resolution reads. */
export interface SessionSlice {
  readonly current: string | undefined
}

/** The slice of the workspace list this resolution reads. */
export interface WorkspaceSlice {
  readonly items: readonly WorkspaceView[]
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
export function workspaceOfSession(
  sessions: SessionSlice,
  workspaces: WorkspaceSlice,
): WorkspaceView | undefined {
  const current = sessions.current
  if (current === undefined) return undefined
  return workspaceOfSessionId(current, workspaces)
}

/**
 * The workspace accounting for one exact session.
 *
 * Session-scoped surfaces use this rather than {@link workspaceOfSession}:
 * the framework hands them the session they render for, which stays correct
 * even when it is not the currently selected one.
 * @param sessionId - the session to account for.
 * @param workspaces - workspace list slice.
 * @returns the owning workspace, or undefined for an ungrouped session.
 */
export function workspaceOfSessionId(
  sessionId: string,
  workspaces: WorkspaceSlice,
): WorkspaceView | undefined {
  return workspaces.items.find(workspace => workspace.sessionIds.includes(sessionId as never))
}
