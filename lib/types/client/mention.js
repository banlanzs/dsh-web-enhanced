/**
 * File and folder mention pickers in the composer's `+` menu.
 *
 * Registered as CLIENT command contributions (`ctx.commandUi.register`), which
 * is what puts a row in that menu without a host command behind it. Picking a
 * row appends `@<path>` to the draft: a plain-text reference the model reads
 * as a path it can hand to `read_file`, and one this plugin can produce
 * without owning an `@` trigger source or a reference codec.
 * @module dsh-web-enhanced/src/client/mention
 */
/** Quote a path only when it needs it, so the common case stays readable. */
function mentionOf(path) {
    return /\s/u.test(path) ? `@"${path}" ` : `@${path} `;
}
/**
 * Build the option rows for one picker.
 *
 * The host search is bounded (`searchMaxEntries`), so this is a bounded
 * listing the shell then filters locally rather than a live query per
 * keystroke. A workspace larger than that cap is visible only up to it —
 * which the empty-search row set makes obvious rather than silently wrong.
 * @param deps - remote and workspace resolution.
 * @param kind - entries to keep.
 * @param sessionId - the session whose project is listed.
 * @returns the rows, deepest-path-last in host walk order.
 * @throws when the session has no project or the host refuses the listing.
 */
export async function mentionOptions(deps, kind, sessionId) {
    const workspaceId = deps.workspaceOf(sessionId);
    if (workspaceId === undefined)
        throw new Error('this session belongs to no project');
    const result = await deps.remote.fsSearch({ workspaceId });
    if ('error' in result)
        throw new Error(result.error.message);
    return result.entries
        .filter((entry) => entry.kind === kind)
        .map((entry) => ({ id: entry.path, label: entry.path }));
}
/**
 * Apply one picked row: append its mention to the session's draft.
 * @param deps - draft access and the deferral seam.
 * @param sessionId - the session that opened the picker.
 * @param path - the picked entry's workspace-relative path.
 */
export function applyMention(deps, sessionId, path) {
    const defer = deps.defer ?? ((run) => { setTimeout(run, 0); });
    defer(() => { deps.appendDraft(sessionId, mentionOf(path)); });
}
