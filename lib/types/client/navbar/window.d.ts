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
/** The visible index range of one navbar render. */
export interface NavWindow {
    /** First visible node index (inclusive). */
    readonly lo: number;
    /** Last visible node index (inclusive). */
    readonly hi: number;
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
export declare function navWindow(count: number, active: number, pinnedIndexes: readonly number[], windowSize?: number, halfWindow?: number): NavWindow;
