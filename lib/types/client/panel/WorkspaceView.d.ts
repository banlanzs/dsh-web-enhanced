/**
 * Workspace view: the explorer (VSCode-style file tree sidebar plus preview
 * of the open file), SCM, the task board, and the git graph for the session's
 * project, registered as one tab in the conversation's view ring beside Chat
 * and Trajectory, over a terminal drawer shared by all four.
 *
 * It lives in `conversation.view` rather than floating over the frame. The
 * view ring renders one entry at a time at full column width, so this surface
 * does not dock or collapse within the frame. The geometry it does own is
 * internal: the explorer's sidebar width split, and the terminal drawer's
 * height. The drawer is the view's last row rather than a fifth tab, so a
 * command stays visible next to whichever tab is in front; because it now sits
 * on the view's bottom edge, it also carries the clearance for the composer
 * the host floats there.
 * @module dsh-web-enhanced/src/client/panel/WorkspaceView
 */
import type { WebEnhancedProps } from '../contract.ts';
/** Full composed props of the workspace view. */
export type WorkspaceViewProps = WebEnhancedProps<'conversation.view'>;
/** The workspace view. */
export declare function WorkspaceView(props: WorkspaceViewProps): import("react").JSX.Element;
