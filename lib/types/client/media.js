/**
 * Media registry: object URLs for binary payloads, LRU-capped.
 *
 * A base64 preview payload re-concatenated into a `data:` URL on every render
 * (and duplicated per referencing component) costs multi-megabyte allocations
 * per keystroke-scale update. Here the base64 decodes ONCE into a Blob, the
 * browser owns the bytes, and consumers share one object URL per key.
 * Environments without `URL.createObjectURL` (node tests) fall back to the
 * data URL — nothing registers, nothing leaks.
 * @module dsh-web-enhanced/src/client/media
 */
/** How many object URLs may live at once; the least-recently used revokes. */
const URL_CAPACITY = 16;
/** Live registry: key → object URL, insertion order = recency order. */
const urls = new Map();
/** Whether object URLs are usable in this environment. */
function objectUrlsAvailable() {
    return typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
}
/** Decode a base64 string into bytes. */
function bytesOfBase64(base64) {
    const raw = atob(base64);
    const bytes = new Uint8Array(new ArrayBuffer(raw.length));
    for (let i = 0; i < raw.length; i++)
        bytes[i] = raw.charCodeAt(i);
    return bytes;
}
/**
 * The stable URL of one binary payload.
 * @param key - registry identity (one URL per key, whatever it names).
 * @param base64 - the payload.
 * @param mime - the payload's MIME type.
 * @returns the object URL, or the equivalent data URL when object URLs are
 * unavailable (the fallback never registers and must not be revoked).
 */
export function binaryObjectUrl(key, base64, mime) {
    if (!objectUrlsAvailable())
        return `data:${mime};base64,${base64}`;
    const existing = urls.get(key);
    if (existing !== undefined) {
        // Recency bump: Map re-insertion moves the key to the newest end.
        urls.delete(key);
        urls.set(key, existing);
        return existing;
    }
    const url = URL.createObjectURL(new Blob([bytesOfBase64(base64)], { type: mime }));
    urls.set(key, url);
    // Evict the oldest entry beyond capacity.
    while (urls.size > URL_CAPACITY) {
        const oldest = urls.keys().next();
        if (oldest.done === true)
            break;
        const url2 = urls.get(oldest.value);
        urls.delete(oldest.value);
        if (url2 !== undefined)
            URL.revokeObjectURL(url2);
    }
    return url;
}
/** 32-bit FNV-1a over a string (content identity; one pass per new payload). */
function fnv1a(text) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(36);
}
/**
 * Registry key for one binary payload: content-derived, so replacing a tab
 * with same-path different bytes cannot serve the previous image.
 * @param prefix - usage namespace.
 * @param binary - the base64 payload.
 */
export function contentKey(prefix, binary) {
    return `${prefix}:${binary.length}:${fnv1a(binary)}`;
}
/** Release the object URL registered under one key (workspace/file switches). */
export function releaseObjectUrl(key) {
    const url = urls.get(key);
    if (url === undefined)
        return;
    urls.delete(key);
    if (objectUrlsAvailable())
        URL.revokeObjectURL(url);
}
/** Release every registered object URL. */
export function releaseAllObjectUrls() {
    for (const url of urls.values()) {
        if (objectUrlsAvailable())
            URL.revokeObjectURL(url);
    }
    urls.clear();
}
/** Single-flight loads: key → the promise every concurrent mount shares. */
const inflight = new Map();
/**
 * The object URL of one workspace image, fetched at most once at a time.
 *
 * The same image referenced N times in one markdown document (or mounted in
 * N components) shares one read and one URL; a failed read drops the promise
 * so the next mount retries instead of caching the failure.
 * @param remote - the read face.
 * @param workspaceId - the owning workspace.
 * @param path - workspace-relative image path.
 * @param mimeOfPath - MIME resolver for the path (extension-driven).
 * @returns the URL on success.
 * @throws the read error branch for the caller to render inline.
 */
export function workspaceImageUrl(remote, workspaceId, path, mimeOfPath) {
    const key = `wsimg:${workspaceId}:${path}`;
    const shared = inflight.get(key);
    if (shared !== undefined)
        return shared;
    const load = (async () => {
        const mime = mimeOfPath(path);
        const result = await remote.fsRead({ workspaceId, path });
        if ('error' in result)
            throw result.error;
        if (result.kind === 'binary') {
            if (result.content === '')
                throw new Error('empty image payload');
            return binaryObjectUrl(key, result.content, mime);
        }
        // SVGs are text on disk even though they render as images.
        if (mime === 'image/svg+xml') {
            return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(result.content)}`;
        }
        throw new Error('not an image payload');
    })();
    // Drop the entry when it settles so later mounts re-fetch fresh bytes
    // (and failures never stick); success keeps the URL itself in the registry.
    const settled = load.finally(() => { inflight.delete(key); });
    inflight.set(key, settled);
    return settled;
}
