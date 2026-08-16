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
/** IndexedDB database holding singleton blobs. */
const DB_NAME = 'dsh-web-enhanced';
/** Object store: purpose-named keys to Blob values. */
const STORE = 'blobs';
/** Key of the skin background blob. */
const BACKGROUND_KEY = 'skin-background';
/** Store layout version; fresh databases create the object store. */
const DB_VERSION = 1;
/**
 * Whether this environment has IndexedDB (node test runs do not).
 * @returns the availability flag the store wrappers guard on.
 */
export function indexedDbAvailable() {
    return typeof indexedDB !== 'undefined';
}
/** Memoized open promise; reset on failure so a later call can retry. */
let dbPromise;
/** Open (once) the singleton database, creating the store on first open. */
function database() {
    dbPromise ??= new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => { request.result.createObjectStore(STORE); };
        request.onsuccess = () => { resolve(request.result); };
        request.onerror = () => { dbPromise = undefined; reject(request.error); };
        request.onblocked = () => { dbPromise = undefined; reject(new Error('indexedDB open blocked')); };
    });
    return dbPromise;
}
/**
 * Run one store request to completion.
 * @param mode - transaction mode for the operation.
 * @param run - builds the request from the `blobs` object store.
 * @returns the request's result.
 */
async function transact(mode, run) {
    const db = await database();
    return new Promise((resolve, reject) => {
        const request = run(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => { resolve(request.result); };
        request.onerror = () => { reject(request.error); };
    });
}
/** The IndexedDB-backed background store: the skin layer's default {@link BackgroundStore}. */
export const backgroundStore = {
    async get() {
        if (!indexedDbAvailable())
            return undefined;
        return transact('readonly', blobs => blobs.get(BACKGROUND_KEY));
    },
    async put(blob) {
        if (!indexedDbAvailable())
            return;
        await transact('readwrite', blobs => blobs.put(blob, BACKGROUND_KEY));
    },
    async remove() {
        if (!indexedDbAvailable())
            return;
        await transact('readwrite', blobs => blobs.delete(BACKGROUND_KEY));
    },
};
/**
 * Decode a base64 data URL into a Blob.
 * @param dataUrl - the `data:<mime>;base64,<payload>` form.
 * @returns the decoded bytes typed with the header's mime type.
 */
export function dataUrlToBlob(dataUrl) {
    const comma = dataUrl.indexOf(',');
    const header = comma === -1 ? '' : dataUrl.slice(0, comma);
    const encoded = comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
    const mime = /^data:([^;,]+)/u.exec(header)?.[1] ?? 'application/octet-stream';
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++)
        bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}
/**
 * Re-encode a Blob as a base64 data URL.
 * @param blob - the stored bytes.
 * @returns the `data:<mime>;base64,<payload>` form.
 * @throws when FileReader is unavailable or the read fails.
 */
export function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string')
                resolve(reader.result);
            else
                reject(new Error('data URL read produced a non-string result'));
        };
        reader.onerror = () => { reject(reader.error ?? new Error('data URL read failed')); };
        reader.readAsDataURL(blob);
    });
}
