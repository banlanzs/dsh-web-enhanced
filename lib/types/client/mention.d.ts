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
import type { WebEnhancedRemote } from './contract.ts';
/** One option row of the picker, in the shape the popup shell renders. */
export interface MentionOption {
    readonly id: string;
    readonly label: string;
    readonly detail?: string;
}
/** What a mention picker needs from the surrounding client plugin. */
export interface MentionDeps {
    /** Host capabilities (the workspace listing). */
    readonly remote: WebEnhancedRemote;
    /** The project one session belongs to; undefined for an ungrouped session. */
    readonly workspaceOf: (sessionId: string) => string | undefined;
    /**
     * Append text to one session's composer draft.
     *
     * Called on a later task, never inside `onSelect`: the popup shell consumes
     * its own `/mention-file` token AFTER `onSelect` settles, under a
     * draft-revision CAS. Writing the draft first invalidates that CAS and
     * leaves the command token sitting in the composer.
     */
    readonly appendDraft: (sessionId: string, text: string) => void;
    /** Deferral seam; the default is the macrotask that outlives the shell's settle. */
    readonly defer?: (run: () => void) => void;
}
/** Which entries a picker offers. */
export type MentionKind = 'file' | 'dir';
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
export declare function mentionOptions(deps: MentionDeps, kind: MentionKind, sessionId: string): Promise<MentionOption[]>;
/**
 * Apply one picked row: append its mention to the session's draft.
 * @param deps - draft access and the deferral seam.
 * @param sessionId - the session that opened the picker.
 * @param path - the picked entry's workspace-relative path.
 */
export declare function applyMention(deps: MentionDeps, sessionId: string, path: string): void;
