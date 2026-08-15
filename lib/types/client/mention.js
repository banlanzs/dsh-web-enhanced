/**
 * File and folder mention pickers in the composer's `+` menu.
 *
 * Registered as CLIENT command contributions (`ctx.commandUi.register`), which
 * is what puts a row in that menu without a host command behind it. Picking a
 * row appends `@<path>` to the draft: a plain-text reference the model reads
 * as a path it can hand to `read_file`, and one this plugin can produce
 * without owning an `@` trigger source or a reference codec.
 *
 * The popup shell is a flat list with a local filter — it fetches its options
 * once and cannot navigate. That fits the in-project case exactly (one bounded
 * recursive listing, then filter), but a path OUTSIDE the project needs
 * walking, so the first row opens {@link BROWSE_OPTION_ID}: the host-wide
 * browser overlay, which does the navigating.
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
/**
 * Build the option rows for one picker.
 *
 * The host search is bounded (`searchMaxEntries`), so this is a bounded
 * listing the shell then filters locally rather than a live query per
 * keystroke. A workspace larger than that cap is visible only up to it — and
 * the browse row is the way past both that cap and the project boundary.
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
 * @param kind - entries to keep.
 * @param sessionId - the session whose project is listed.
 * @returns the browse row followed by the project's entries.
 * @throws when the host refuses the listing.
 */
export async function mentionOptions(deps, kind, sessionId) {
    const browseRow = { id: BROWSE_OPTION_ID, label: deps.browseLabel() };
    const workspaceId = deps.workspaceOf(sessionId);
    if (workspaceId === undefined)
        return [browseRow];
    const result = await deps.remote.fsSearch({ workspaceId });
    if ('error' in result)
        throw new Error(result.error.message);
    return [
        browseRow,
        ...result.entries
            .filter((entry) => entry.kind === kind)
            .map((entry) => ({ id: entry.path, label: entry.path })),
    ];
}
/**
 * Apply one picked row: append its mention to the session's draft, or open the
 * host-wide browser when the browse row was picked.
 * @param deps - draft access, the browser opener, and the deferral seam.
 * @param kind - the picker's entry kind (the browser inherits it).
 * @param sessionId - the session that opened the picker.
 * @param id - the picked row's id: a path, or {@link BROWSE_OPTION_ID}.
 */
export function applyMention(deps, kind, sessionId, id) {
    const defer = deps.defer ?? ((run) => { setTimeout(run, 0); });
    // Deferred for the same reason the draft write is: opening an overlay while
    // the shell is still settling would race its own close.
    defer(() => {
        if (id === BROWSE_OPTION_ID) {
            deps.openBrowse(kind, sessionId);
            return;
        }
        deps.appendDraft(sessionId, mentionOf(id));
    });
}
