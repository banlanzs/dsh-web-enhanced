/**
 * Blob persistence for the skin background image.
 *
 * The persisted form is one Blob in IndexedDB; the layer serves it to the
 * page as an object URL, so the multi-megabyte base64 data URL never lives
 * as a long-lived string copy (storage, layer field, backdrop src). A legacy
 * localStorage data URL migrates into this store on first load. Without
 * IndexedDB (node tests) the store reads empty and writes are no-ops: the
 * background is a browser-only surface and its persistence is best-effort,
 * like a localStorage denial.
 * @module dsh-web-enhanced/src/client/skins/background-store
 */
/**
 * The background persistence seam the skin layer consumes; tests inject an
 * in-memory double.
 */
export interface BackgroundStore {
    /** The persisted background blob, or undefined when none is set. */
    get(): Promise<Blob | undefined>;
    /** Persist (replace) the background blob. */
    put(blob: Blob): Promise<void>;
    /** Delete the persisted background blob. */
    remove(): Promise<void>;
}
/**
 * Whether this environment has IndexedDB (node test runs do not).
 * @returns the availability flag the store wrappers guard on.
 */
export declare function indexedDbAvailable(): boolean;
/** The IndexedDB-backed background store: the skin layer's default {@link BackgroundStore}. */
export declare const backgroundStore: BackgroundStore;
/**
 * Decode a base64 data URL into a Blob.
 * @param dataUrl - the `data:<mime>;base64,<payload>` form.
 * @returns the decoded bytes typed with the header's mime type.
 */
export declare function dataUrlToBlob(dataUrl: string): Blob;
/**
 * Re-encode a Blob as a base64 data URL.
 * @param blob - the stored bytes.
 * @returns the `data:<mime>;base64,<payload>` form.
 * @throws when FileReader is unavailable or the read fails.
 */
export declare function blobToDataUrl(blob: Blob): Promise<string>;
