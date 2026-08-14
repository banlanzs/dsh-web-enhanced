/**
 * Sidebar footer entries: the ENTRY BUTTONS of the task board and the git
 * graph. The overlays themselves live in `shell.overlay` — a button in the
 * sidebar's footer row must not also host a frame-wide surface, or the
 * overlay inherits the navigation column's stacking context and overflow.
 * These two only flip shared state.
 * @module dsh-web-enhanced/src/client/board/SidebarEntry
 */
import type { WebEnhancedProps } from '../contract.ts';
/** Full composed props of a sidebar footer entry. */
export type SidebarEntryProps = WebEnhancedProps<'sidebar.footer.action'>;
/** Task-board entry: toggles the board overlay. */
export declare function BoardSidebarEntry({ useOverlay, openOverlay, closeOverlay, t }: SidebarEntryProps): import("react").JSX.Element;
/** Git-graph entry: toggles the graph overlay. */
export declare function GraphSidebarEntry({ useOverlay, openOverlay, closeOverlay, t }: SidebarEntryProps): import("react").JSX.Element;
