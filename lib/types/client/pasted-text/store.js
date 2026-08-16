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
/** Max characters kept per paste (a single message should stay bounded). */
export const PASTED_TEXT_MAX_CHARS = 200_000;
/** Max entries kept at once; older entries are evicted first. */
const PASTED_TEXT_MAX_ENTRIES = 12;
/** localStorage key shared by the store and the codec. */
const STORAGE_KEY = 'dsh.web-enhanced.pasted-text.v1';
/** The input-trigger source name owning the chips. */
export const PASTED_TEXT_SOURCE = 'pasted-text';
/**
 * One chip's clipboard projection, used by copy/cut and draft persistence.
 * @param ref - the stored entry id.
 * @returns the human-facing token.
 */
export function pastedTextClipboard(ref) {
    return `[已粘贴文本:${ref.slice(0, 8)}]`;
}
/** Parse persisted entries, dropping every row that is not the stored shape. */
export function revivePastedText(raw) {
    if (!Array.isArray(raw))
        return [];
    const seen = new Set();
    const entries = [];
    for (const item of raw) {
        if (typeof item !== 'object' || item === null)
            continue;
        const record = item;
        const id = record['id'];
        const text = record['text'];
        const createdAt = record['createdAt'];
        if (typeof id !== 'string' || id === '' || seen.has(id))
            continue;
        if (typeof text !== 'string' || text.trim().length === 0)
            continue;
        if (typeof createdAt !== 'number' || !Number.isFinite(createdAt))
            continue;
        seen.add(id);
        entries.push({ id, text: text.slice(0, PASTED_TEXT_MAX_CHARS), createdAt });
    }
    return entries.slice(0, PASTED_TEXT_MAX_ENTRIES);
}
/** Preview text for one chip row (first line, short). */
export function pastedTextPreview(text) {
    const first = text.replace(/\s+/gu, ' ').trim();
    return first.length > 60 ? `${first.slice(0, 60)}…` : first;
}
/**
 * The pasted-text store. Reads are synchronous (the codec must serialize
 * without a round trip); writes persist debounced through the cell below.
 */
export class PastedTextStore {
    entries = new Map();
    /** Load the persisted entries, defensively. */
    constructor() {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw !== null) {
                try {
                    for (const entry of revivePastedText(JSON.parse(raw)))
                        this.entries.set(entry.id, entry);
                }
                catch {
                    // Unparseable storage resets; chips then serialize as a notice.
                }
            }
        }
    }
    /** All entries, newest first. */
    list() {
        return [...this.entries.values()].sort((left, right) => right.createdAt - left.createdAt);
    }
    /** Read one entry, or undefined when the id is unknown/evicted. */
    get(id) {
        return this.entries.get(id);
    }
    /** Store or replace one entry; evicts the oldest when the cap is reached. */
    set(id, text) {
        const bounded = text.slice(0, PASTED_TEXT_MAX_CHARS);
        this.entries.set(id, { id, text: bounded, createdAt: Date.now() });
        while (this.entries.size > PASTED_TEXT_MAX_ENTRIES) {
            const oldest = [...this.entries.values()].sort((left, right) => left.createdAt - right.createdAt)[0];
            if (oldest === undefined)
                break;
            this.entries.delete(oldest.id);
        }
        this.persist();
    }
    /** Drop one entry (chip removal keeps the storage bounded). */
    remove(id) {
        if (!this.entries.delete(id))
            return;
        this.persist();
    }
    persist() {
        if (typeof localStorage === 'undefined')
            return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.list()));
        }
        catch {
            // A full or blocked quota costs persistence, not the interaction.
        }
    }
}
