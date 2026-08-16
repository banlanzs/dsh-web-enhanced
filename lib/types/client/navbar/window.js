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
/** Upper bound on per-turn virtual dots for unrendered older turns. */
export const MAX_OLDER_DOTS = 200;
/**
 * Number of unrendered older turns the navbar should still represent.
 *
 * The host virtualizes the transcript, so the DOM only carries the loaded
 * tail window. The first rendered user row's turn number is the exact count
 * of earlier turns when available; otherwise the whole-log `sessionStats`
 * projection supplies a lower bound.
 * @param firstTurn - turn number of the first rendered user row, when known.
 * @param totalTurns - whole-log counted turns from the sessionStats projection.
 * @param renderedCount - user rows currently materialized in the DOM.
 * @returns virtual leading dots to render above the materialized range.
 */
export function olderNodeCount(firstTurn, totalTurns, renderedCount) {
    if (renderedCount <= 0)
        return 0;
    if (firstTurn !== null && Number.isSafeInteger(firstTurn) && firstTurn > 0) {
        return Math.max(0, firstTurn - 1);
    }
    return Math.max(0, totalTurns - renderedCount);
}
/**
 * Cap the number of per-turn virtual dots for unrendered older turns.
 *
 * The strip still navigates into the page beyond `加载更早`, but a session
 * with thousands of earlier turns must not materialize one button per turn.
 * The closest {@link MAX_OLDER_DOTS} turns stay individually addressable;
 * anything older folds into one "load older" marker.
 * @param count - unrendered older turns.
 * @param max - per-turn dot budget.
 * @returns how many turns fold away and how many get dots.
 */
export function olderWindow(count, max = MAX_OLDER_DOTS) {
    const visible = Math.min(Math.max(0, count), max);
    return { hidden: Math.max(0, count - visible), visible };
}
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
