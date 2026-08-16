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
/**
 * The stable URL of one binary payload.
 * @param key - registry identity (one URL per key, whatever it names).
 * @param base64 - the payload.
 * @param mime - the payload's MIME type.
 * @returns the object URL, or the equivalent data URL when object URLs are
 * unavailable (the fallback never registers and must not be revoked).
 */
export declare function binaryObjectUrl(key: string, base64: string, mime: string): string;
/**
 * Registry key for one binary payload: content-derived, so replacing a tab
 * with same-path different bytes cannot serve the previous image.
 * @param prefix - usage namespace.
 * @param binary - the base64 payload.
 */
export declare function contentKey(prefix: string, binary: string): string;
/** Release the object URL registered under one key (workspace/file switches). */
export declare function releaseObjectUrl(key: string): void;
/** Release every registered object URL. */
export declare function releaseAllObjectUrls(): void;
/** The face `workspaceImageUrl` needs from a component's remote. */
export interface ImageReadFace {
    /** One workspace-scoped binary/text read. */
    fsRead(request: {
        readonly workspaceId: string;
        readonly path: string;
    }): Promise<{
        readonly kind: 'binary';
        readonly content: string;
    } | {
        readonly kind: 'text';
        readonly content: string;
    } | {
        readonly error: {
            readonly message: string;
        };
    }>;
}
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
export declare function workspaceImageUrl(remote: ImageReadFace, workspaceId: string, path: string, mimeOfPath: (path: string) => string): Promise<string>;
