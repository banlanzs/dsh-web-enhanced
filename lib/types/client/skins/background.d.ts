/**
 * Background image budgeting and compression.
 *
 * localStorage holds ~5M UTF-16 units and the stored value is a base64 data
 * URL (4 bytes of text per 3 image bytes), so the invariant that matters is
 * the ENCODED data URL length, not the source file size. A picture within
 * budget keeps its original bytes (GIF animation and SVG vectors survive);
 * an oversized one is re-encoded through a canvas on a descending
 * scale/quality plan until the encoded form fits.
 * @module dsh-web-enhanced/src/client/skins/background
 */
/** Budget for the stored data URL, UTF-16 units (localStorage keeps ~5M). */
export declare const BACKGROUND_MAX_CHARS = 4500000;
/** One candidate encode setting; earlier entries lose less quality. */
export interface EncodeStep {
    /** Longest image edge after scaling, px. */
    readonly maxEdge: number;
    /** Encoder quality for lossy targets. */
    readonly quality: number;
}
/**
 * The compression plan in application order. Every step stays at or above
 * {@link MIN_EDGE}; callers stop at the first step whose encoding fits.
 * @returns fresh step list (callers may mutate their copy).
 */
export declare function compressionPlan(): readonly EncodeStep[];
/**
 * Approximate decoded byte size of a base64 data URL.
 * @param dataUrl - the encoded image.
 * @returns payload bytes estimate.
 */
export declare function approxBytesOf(dataUrl: string): number;
/**
 * Budget test for a stored value.
 * @param dataUrl - the encoded image.
 * @returns whether it fits within {@link BACKGROUND_MAX_CHARS}.
 */
export declare function fitsBudget(dataUrl: string): boolean;
/**
 * Compress a picked image until its encoded form fits the storage budget.
 * The original bytes win outright when they already fit.
 * @param file - the picked image file.
 * @returns the best-fitting data URL.
 * @throws when no step fits (or decoding/encoding is impossible).
 */
export declare function encodeBackground(file: Blob): Promise<string>;
