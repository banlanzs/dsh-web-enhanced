/**
 * Navbar sliding-window math: which user-message nodes stay visible when the
 * strip outgrows its budget.
 *
 * Windowed strips show the active node ± half a window, clamped to the ends;
 * pinned (curated) nodes are always visible, so the window stretches to
 * include them. Pure and DOM-free so the geometry is testable.
 * @module dsh-web-enhanced/src/client/navbar/window
 */
/** Node counts past which the strip windows (mirrors the reference navbar). */
export const NAV_WINDOW = 11;
/** Nodes on either side of the active one inside a window. */
export const NAV_HALF_WINDOW = 5;
/**
 * Compute the visible window.
 * @param count - total user-message nodes (>= 0).
 * @param active - the active node index (-1 when none).
 * @param pinnedIndexes - node indexes that must stay visible (ascending).
 * @param windowSize - node count past which windowing starts.
 * @param halfWindow - nodes on either side of the active one.
 * @returns the clamped visible range (lo <= hi when any node exists).
 */
export function navWindow(count, active, pinnedIndexes, windowSize = NAV_WINDOW, halfWindow = NAV_HALF_WINDOW) {
    if (count <= 0)
        return { lo: 0, hi: -1 };
    if (count <= windowSize)
        return { lo: 0, hi: count - 1 };
    const anchor = Math.min(Math.max(active, 0), count - 1);
    let lo = Math.max(0, anchor - halfWindow);
    let hi = Math.min(count - 1, anchor + halfWindow);
    for (const index of pinnedIndexes) {
        if (index >= 0 && index < count) {
            lo = Math.min(lo, index);
            hi = Math.max(hi, index);
        }
    }
    return { lo, hi };
}
