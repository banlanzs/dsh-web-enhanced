/**
 * Pasted-text store for the composer's long-paste attachment.
 *
 * A long plain-text paste is intercepted and replaced with one reference chip
 * (`已粘贴文本`). The chip's ref is an id into this store; the reference codec
 * reads the stored text back when the message is submitted, so the model gets
 * the full content while the draft stays short. Persistence lives in
 * localStorage so a reload keeps the chip meaningful; entries are capped and
 * pruned oldest-first.
 * @module dsh-web-enhanced/src/client/pasted-text/store
 */
/** Persisted shape of one pasted-text entry. */
export interface PastedTextEntry {
    readonly id: string;
    readonly text: string;
    readonly createdAt: number;
}
/** Max characters kept per paste (a single message should stay bounded). */
export declare const PASTED_TEXT_MAX_CHARS = 200000;
/** The input-trigger source name owning the chips. */
export declare const PASTED_TEXT_SOURCE = "pasted-text";
/**
 * One chip's clipboard projection, used by copy/cut and draft persistence.
 * @param ref - the stored entry id.
 * @returns the human-facing token.
 */
export declare function pastedTextClipboard(ref: string): string;
/** Parse persisted entries, dropping every row that is not the stored shape. */
export declare function revivePastedText(raw: unknown): PastedTextEntry[];
/** Preview text for one chip row (first line, short). */
export declare function pastedTextPreview(text: string): string;
/**
 * The pasted-text store. Reads are synchronous (the codec must serialize
 * without a round trip); writes persist debounced through the cell below.
 */
export declare class PastedTextStore {
    private entries;
    /** Load the persisted entries, defensively. */
    constructor();
    /** All entries, newest first. */
    list(): readonly PastedTextEntry[];
    /** Read one entry, or undefined when the id is unknown/evicted. */
    get(id: string): PastedTextEntry | undefined;
    /** Store or replace one entry; evicts the oldest when the cap is reached. */
    set(id: string, text: string): void;
    /** Drop one entry (chip removal keeps the storage bounded). */
    remove(id: string): void;
    private persist;
}
