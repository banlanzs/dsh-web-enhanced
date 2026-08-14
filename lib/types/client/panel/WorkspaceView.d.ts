/**
 * Workspace view: file tree, preview, and SCM for the session's project,
 * registered as one tab in the conversation's view ring beside Chat and
 * Trajectory.
 *
 * It lives in `conversation.view` rather than floating over the frame. The
 * view ring renders one entry at a time at full column width, so this surface
 * owns no geometry — no docking, no drag-to-resize, no collapse. Those belong
 * to the frame, and a tab that tried to own them would fight it.
 * @module dsh-web-enhanced/src/client/panel/WorkspaceView
 */
import type { WebEnhancedProps } from '../contract.ts';
/** Full composed props of the workspace view. */
export type WorkspaceViewProps = WebEnhancedProps<'conversation.view'>;
/** The workspace view. */
export declare function WorkspaceView(props: WorkspaceViewProps): import("react").JSX.Element;
