/**
 * The right dock: file tree, preview, and SCM for the current session's
 * workspace.
 *
 * It lives in `shell.overlay`, not in the layout's `details` slot. `details`
 * is a `single` slot already occupied by ui-conversation's DetailsPanel, so
 * registering there would replace the tool-details column and remove the
 * `conversation.details.tool` seat it declares. `shell.overlay` is additive
 * and sits outside every column's scroll container, which is also what lets
 * this panel own its own geometry — `ctx.layout` exposes open/close for the
 * details column but no width API, and the feature request asks for a
 * draggable width that persists per project.
 * @module dsh-web-enhanced/src/client/panel/RightPanel
 */
import type { WebEnhancedProps } from '../contract.ts';
/** Full composed props of the right panel. */
export type RightPanelProps = WebEnhancedProps<'shell.overlay'>;
/** The right dock. */
export declare function RightPanel(props: RightPanelProps): import("react").JSX.Element | null;
