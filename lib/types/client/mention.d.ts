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
import type { FsEntryView, WebEnhancedRemote } from './contract.ts';
/**
 * Id of the row that opens the host-wide browser instead of choosing a path.
 *
 * A control character so no real path can collide with it: every other row's
 * id IS a path.
 */
export declare const BROWSE_OPTION_ID = "\0browse";
/** The slice of a workspace row the mention pickers need. */
export interface MentionWorkspace {
    readonly workspaceId: string;
    /** Canonical absolute directory (the browser's in-project start). */
    readonly path: string;
}
/** One option row of the picker, in the shape the popup shell renders. */
export interface MentionOption {
    readonly id: string;
    readonly label: string;
    readonly detail?: string;
    /**
     * When present the row is a FOLDER: selecting it does not insert a mention
     * but opens the file browser at this directory — the folder-click-enters
     * gesture the flat popup shell itself cannot render.
     */
    readonly navigate?: string;
}
/** What a mention picker needs from the surrounding client plugin. */
export interface MentionDeps {
    /** Host capabilities (the workspace listing). */
    readonly remote: WebEnhancedRemote;
    /** The project one session belongs to; undefined for an ungrouped session. */
    readonly workspaceOf: (sessionId: string) => MentionWorkspace | undefined;
    /**
     * Append text to one session's composer draft.
     *
     * Called on a later task, never inside `onSelect`: the popup shell consumes
     * its own `/mention-file` token AFTER `onSelect` settles, under a
     * draft-revision CAS. Writing the draft first invalidates that CAS and
     * leaves the command token sitting in the composer.
     */
    readonly appendDraft: (sessionId: string, text: string) => void;
    /**
     * Open the file-browser overlay.
     * @param kind - which entries may be chosen.
     * @param sessionId - session whose draft receives the mention.
     * @param startPath - directory to open at; omitted starts at the host home.
     */
    readonly openBrowse: (kind: MentionKind, sessionId: string, startPath?: string) => void;
    /** Localized label of the browse row. */
    readonly browseLabel: () => string;
    /** Deferral seam; the default is the macrotask that outlives the shell's settle. */
    readonly defer?: (run: () => void) => void;
}
/** Which entries a picker offers. */
export type MentionKind = 'file' | 'dir';
/**
 * Render one path as a composer mention.
 *
 * Quoted only when it needs it, so the common case stays readable — but an
 * absolute Windows path with spaces is exactly the case that needs it, and
 * that is what the host-wide browser produces.
 * @param path - workspace-relative or absolute path.
 * @returns the mention text, with the trailing space that separates it.
 */
export declare function mentionOf(path: string): string;
/**
 * Join a workspace-relative search path onto the workspace's absolute root.
 * The mention itself stays relative, but the browser walks ABSOLUTE paths, so
 * a folder row's navigate target must be absolute before it is handed over.
 */
export declare function workspaceAbsolute(root: string, rel: string): string;
/** Build the row for one recursive-listing entry, in explorer order. */
export declare function rowOfEntry(entry: FsEntryView, kind: MentionKind, workspaceRoot: string): MentionOption;
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
export declare function mentionOptions(deps: MentionDeps, kind: MentionKind, sessionId: string): Promise<MentionOption[]>;
/**
 * Apply one picked row: append its mention to the session's draft, or open the
 * file browser — at the workspace root for the browse row, at the row's own
 * directory for a folder row.
 * @param deps - draft access, the browser opener, and the deferral seam.
 * @param kind - the picker's entry kind (the browser inherits it).
 * @param sessionId - the session that opened the picker.
 * @param option - the picked row: a path, a navigable folder, or {@link BROWSE_OPTION_ID}.
 */
export declare function applyMention(deps: MentionDeps, kind: MentionKind, sessionId: string, option: {
    readonly id: string;
    readonly navigate?: string;
}): void;
