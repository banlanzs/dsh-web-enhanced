/**
 * File and folder mention pickers in the composer's `+` menu.
 *
 * Registered as CLIENT command contributions (`ctx.commandUi.register`), which
 * is what puts a row in that menu without a host command behind it. Picking a
 * file row appends `@<path>` to the draft: a plain-text reference the model
 * reads as a path it can hand to `read_file`, and one this plugin can produce
 * without owning an `@` trigger source or a reference codec.
 *
 * The popup shell is a flat list with a local filter — it fetches its options
 * once and cannot host a nested tree. This module compensates by rendering the
 * recursive listing as an indented directory view: every folder row carries a
 * `navigate` target, and picking one opens the plugin's own file-browser
 * overlay AT that folder. The overlay is the real explorer — breadcrumbs,
 * parent, per-level listing, click a folder to enter, click a file to choose.
 * @module dsh-web-enhanced/src/client/mention
 */
/**
 * Id of the row that opens the host-wide browser instead of choosing a path.
 *
 * A control character so no real path can collide with it: every other row's
 * id IS a path.
 */
export const BROWSE_OPTION_ID = '\u0000browse';
/**
 * Render one path as a composer mention.
 *
 * Quoted only when it needs it, so the common case stays readable — but an
 * absolute Windows path with spaces is exactly the case that needs it, and
 * that is what the host-wide browser produces.
 * @param path - workspace-relative or absolute path.
 * @returns the mention text, with the trailing space that separates it.
 */
export function mentionOf(path) {
    return /\s/u.test(path) ? `@"${path}" ` : `@${path} `;
}
/** Visual indentation of one recursive-search row (root level stays flush). */
function indentOf(path) {
    const depth = path.split('/').length;
    // Non-breaking spaces: the popup shell renders labels with white-space:
    // nowrap, which collapses ordinary leading spaces away.
    return depth <= 1 ? '' : '\u00a0\u00a0'.repeat(depth - 1);
}
/**
 * Join a workspace-relative search path onto the workspace's absolute root.
 * The mention itself stays relative, but the browser walks ABSOLUTE paths, so
 * a folder row's navigate target must be absolute before it is handed over.
 */
export function workspaceAbsolute(root, rel) {
    const separator = root.includes('\\') ? '\\' : '/';
    return `${root.replace(/[\\/]+$/u, '')}${separator}${rel.split('/').join(separator)}`;
}
/** Build the row for one recursive-listing entry, in explorer order. */
export function rowOfEntry(entry, kind, workspaceRoot) {
    const folder = entry.kind === 'dir';
    const indent = indentOf(entry.path);
    return {
        id: entry.path,
        label: `${indent}${folder ? '▸ ' : '· '}${entry.name}${folder ? '/' : ''}`,
        detail: entry.path,
        // In the FILE picker a folder row enters that folder; in the folder picker
        // every folder row IS the choice and selecting it inserts the mention.
        ...(kind === 'file' && folder ? { navigate: workspaceAbsolute(workspaceRoot, entry.path) } : {}),
    };
}
/**
 * Build the option rows for one picker.
 *
 * The host search is bounded (`searchMaxEntries`), so this is a bounded
 * recursive listing the shell then filters locally rather than a live query
 * per keystroke. Rows are indented by depth, so the flat popup reads like a
 * directory tree; folder rows in the file picker carry `navigate` and open the
 * explorer at that folder when picked.
 *
 * The listing deliberately keeps the search's default `skipDirs` filter
 * (default `node_modules`): dependency trees are exactly the files nobody
 * references from the composer, and letting them flood the bounded list would
 * crowd out real project files. Files inside a skipped directory are still
 * reachable through the browse row, whose walker applies no such filter.
 *
 * The host walk also lists each directory's files before descending into its
 * subdirectories, so root-level documents like `TODO.md` stay in the batch
 * instead of being cut off by the entry cap behind a deep `lib` tree.
 *
 * A session with no project still gets the browse row: it has no listing to
 * offer, but nothing about it forbids naming a path.
 * @param deps - remote and workspace resolution.
 * @param kind - entries to keep (file picker keeps both, folders navigate).
 * @param sessionId - the session whose project is listed.
 * @returns the browse row followed by the project's entries.
 * @throws when the host refuses the listing.
 */
export async function mentionOptions(deps, kind, sessionId) {
    const workspace = deps.workspaceOf(sessionId);
    const browseRow = {
        id: BROWSE_OPTION_ID,
        label: deps.browseLabel(),
        ...(workspace === undefined ? {} : { detail: workspace.path }),
    };
    if (workspace === undefined)
        return [browseRow];
    const result = await deps.remote.fsSearch({ workspaceId: workspace.workspaceId });
    if ('error' in result)
        throw new Error(result.error.message);
    return [
        browseRow,
        ...result.entries
            .filter((entry) => kind === 'file' || entry.kind === 'dir')
            .map((entry) => rowOfEntry(entry, kind, workspace.path)),
    ];
}
/**
 * Apply one picked row: append its mention to the session's draft, or open the
 * file browser — at the workspace root for the browse row, at the row's own
 * directory for a folder row.
 * @param deps - draft access, the browser opener, and the deferral seam.
 * @param kind - the picker's entry kind (the browser inherits it).
 * @param sessionId - the session that opened the picker.
 * @param option - the picked row: a path, a navigable folder, or {@link BROWSE_OPTION_ID}.
 */
export function applyMention(deps, kind, sessionId, option) {
    const defer = deps.defer ?? ((run) => { setTimeout(run, 0); });
    // Deferred for the same reason the draft write is: opening an overlay while
    // the shell is still settling would race its own close.
    defer(() => {
        if (option.id === BROWSE_OPTION_ID) {
            deps.openBrowse(kind, sessionId, deps.workspaceOf(sessionId)?.path);
            return;
        }
        if (option.navigate !== undefined) {
            deps.openBrowse(kind, sessionId, option.navigate);
            return;
        }
        deps.appendDraft(sessionId, mentionOf(option.id));
    });
}
