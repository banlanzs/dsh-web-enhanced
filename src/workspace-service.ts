/**
 * Workspace resolution shared by every domain that reads files.
 *
 * The registry is the host's; this is the one place that turns a wire
 * workspace id into a canonical root, so git, files, and the task board
 * agree on what a workspace id means and answer the same
 * `workspace-not-found` when it names nothing.
 * @module dsh-web-enhanced/src/workspace-service
 */

import type { Context } from '@deepseek-ai/cordis'
import type { WorkspaceId } from './types.ts'

/** Workspace resolution as the domain services consume it. */
export interface WorkspaceFace {
  /** Resolve a workspace id to its canonical root; null when unknown. */
  rootFor(workspaceId: string): string | null
  /** Resolve a requested workspace id; null when unknown. */
  resolveId(workspaceId: string): WorkspaceId | null
  /** Canonical root of a resolved id; the process cwd for a null id. */
  root(workspaceId: WorkspaceId | null): string
}

/**
 * Bind workspace resolution to one context's registry.
 *
 * Read per call rather than captured: workspaces are registered and removed
 * under a running host, so a captured list would answer for a world that no
 * longer exists.
 * @param ctx - the owning context with the injected workspaceRegistry.
 * @returns the resolution face.
 */
export function createWorkspaceFace(ctx: Context): WorkspaceFace {
  const find = (workspaceId: string): { id: WorkspaceId; path: string } | undefined =>
    ctx.workspaceRegistry.list().find(workspace => workspace.id === workspaceId)
  return {
    rootFor: workspaceId => find(workspaceId)?.path ?? null,
    resolveId: (workspaceId) => {
      const found = find(workspaceId)
      return found === undefined ? null : found.id
    },
    root: (workspaceId) => {
      if (workspaceId === null) return process.cwd()
      return find(workspaceId)?.path ?? process.cwd()
    },
  }
}

/** The error every domain answers when a wire id names no workspace. */
export function workspaceNotFound(workspaceId: string): { readonly code: string; readonly message: string } {
  return { code: 'workspace-not-found', message: `workspace '${workspaceId}' does not exist` }
}
