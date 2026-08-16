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
export const BACKGROUND_MAX_CHARS = 4_500_000;
/** Coarsest allowed edge during compression, px. */
const MIN_EDGE = 800;
/** Preferred encode steps: edge shrinks before quality does, coarsest last. */
const STEPS = [
    { maxEdge: 2560, quality: 0.85 },
    { maxEdge: 2560, quality: 0.72 },
    { maxEdge: 1920, quality: 0.85 },
    { maxEdge: 1920, quality: 0.72 },
    { maxEdge: 1536, quality: 0.8 },
    { maxEdge: 1280, quality: 0.75 },
    { maxEdge: 1024, quality: 0.72 },
    { maxEdge: MIN_EDGE, quality: 0.7 },
];
/**
 * The compression plan in application order. Every step stays at or above
 * {@link MIN_EDGE}; callers stop at the first step whose encoding fits.
 * @returns fresh step list (callers may mutate their copy).
 */
export function compressionPlan() {
    return STEPS.map(step => ({ ...step }));
}
/**
 * Approximate decoded byte size of a base64 data URL.
 * @param dataUrl - the encoded image.
 * @returns payload bytes estimate.
 */
export function approxBytesOf(dataUrl) {
    const comma = dataUrl.indexOf(',');
    const encoded = comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
    const padding = /={1,2}$/u.exec(encoded)?.[0].length ?? 0;
    return Math.floor(encoded.length * 3 / 4) - padding;
}
/**
 * Budget test for a stored value.
 * @param dataUrl - the encoded image.
 * @returns whether it fits within {@link BACKGROUND_MAX_CHARS}.
 */
export function fitsBudget(dataUrl) {
    return dataUrl.length <= BACKGROUND_MAX_CHARS;
}
/** Decode through createImageBitmap, falling back to an <img> for SVG. */
async function decode(file) {
    try {
        const bitmap = await createImageBitmap(file);
        return {
            width: bitmap.width,
            height: bitmap.height,
            draw: (context, width, height) => { context.drawImage(bitmap, 0, 0, width, height); },
            release: () => { bitmap.close(); },
        };
    }
    catch {
        // createImageBitmap refuses SVG in some engines; an <img> rasterizes it.
        const url = URL.createObjectURL(file);
        try {
            const image = new Image();
            image.src = url;
            await image.decode();
            return {
                width: image.naturalWidth || 1024,
                height: image.naturalHeight || 1024,
                draw: (context, width, height) => { context.drawImage(image, 0, 0, width, height); },
                release: () => { URL.revokeObjectURL(url); },
            };
        }
        catch (error) {
            URL.revokeObjectURL(url);
            throw error;
        }
    }
}
/**
 * Re-encode one decoded image at a step's scale and quality.
 * @returns the encoded data URL, or undefined when the canvas is unavailable.
 */
function encode(image, step) {
    if (typeof document === 'undefined')
        return undefined;
    const scale = Math.min(1, step.maxEdge / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (context === null)
        return undefined;
    image.draw(context, canvas.width, canvas.height);
    // WebP first; engines without WebP encoding answer PNG, which the plan's
    // later (smaller) steps still bring under budget.
    return canvas.toDataURL('image/webp', step.quality);
}
/**
 * Compress a picked image until its encoded form fits the storage budget.
 * The original bytes win outright when they already fit.
 * @param file - the picked image file.
 * @returns the best-fitting data URL.
 * @throws when no step fits (or decoding/encoding is impossible).
 */
export async function encodeBackground(file) {
    const decoded = await decode(file);
    try {
        for (const step of compressionPlan()) {
            const encoded = encode(decoded, step);
            if (encoded !== undefined && fitsBudget(encoded))
                return encoded;
        }
    }
    finally {
        decoded.release();
    }
    throw new Error('background image stays over the storage budget after compression');
}
