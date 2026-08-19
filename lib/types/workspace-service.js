/**
 * Workspace resolution shared by every domain that reads files.
 *
 * The registry is the host's; this is the one place that turns a wire
 * workspace id into a canonical root, so git, files, and the task board
 * agree on what a workspace id means and answer the same
 * `workspace-not-found` when it names nothing.
 * @module dsh-web-enhanced/src/workspace-service
 */
/**
 * Bind workspace resolution to one context's registry.
 *
 * Read per call rather than captured: workspaces are registered and removed
 * under a running host, so a captured list would answer for a world that no
 * longer exists.
 * @param ctx - the owning context with the injected workspaceRegistry.
 * @returns the resolution face.
 */
export function createWorkspaceFace(ctx) {
    const find = (workspaceId) => ctx.workspaceRegistry.list().find(workspace => workspace.id === workspaceId);
    return {
        rootFor: workspaceId => find(workspaceId)?.path ?? null,
        resolveId: (workspaceId) => {
            const found = find(workspaceId);
            return found === undefined ? null : found.id;
        },
        root: (workspaceId) => {
            if (workspaceId === null)
                return process.cwd();
            return find(workspaceId)?.path ?? process.cwd();
        },
    };
}
/** The error every domain answers when a wire id names no workspace. */
export function workspaceNotFound(workspaceId) {
    return { code: 'workspace-not-found', message: `workspace '${workspaceId}' does not exist` };
}
