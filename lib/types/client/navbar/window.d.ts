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
export declare const NAV_WINDOW = 11;
/** Nodes on either side of the active one inside a window. */
export declare const NAV_HALF_WINDOW = 5;
/**
 * Upper bound on per-turn virtual dots for unrendered older turns.
 *
 * The materialized window already contributes up to {@link NAV_WINDOW} dots;
 * the older-turn budget stays small so the whole strip stays within one
 * screen (marker + virtual dots + separators + window ≈ 20 nodes). Older
 * turns beyond the budget fold into the single "load older" marker instead.
 */
export declare const MAX_OLDER_DOTS = 6;
/** The visible index range of one navbar render. */
export interface NavWindow {
    /** First visible node index (inclusive). */
    readonly lo: number;
    /** Last visible node index (inclusive). */
    readonly hi: number;
}
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
export declare function olderNodeCount(firstTurn: number | null, totalTurns: number, renderedCount: number): number;
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
export declare function olderWindow(count: number, max?: number): {
    readonly hidden: number;
    readonly visible: number;
};
/**
 * Compute the visible window.
 * @param count - total user-message nodes (>= 0).
 * @param active - the active node index (-1 when none).
 * @param pinnedIndexes - node indexes that must stay visible (ascending).
 * @param windowSize - node count past which windowing starts.
 * @param halfWindow - nodes on either side of the active one.
 * @returns the clamped visible range (lo <= hi when any node exists).
 */
export declare function navWindow(count: number, active: number, pinnedIndexes: readonly number[], windowSize?: number, halfWindow?: number): NavWindow;
