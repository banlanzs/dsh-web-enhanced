/**
 * Workspace view: the explorer (VSCode-style file tree sidebar plus preview
 * of the open file), SCM, the task board, and the git graph for the session's
 * project, registered as one tab in the conversation's view ring beside Chat
 * and Trajectory.
 *
 * It lives in `conversation.view` rather than floating over the frame. The
 * view ring renders one entry at a time at full column width, so this surface
 * owns no geometry of its own — no docking, no collapse. The one geometry it
 * does own is the explorer's sidebar width split, which lives entirely inside
 * the tab.
 * @module dsh-web-enhanced/src/client/panel/WorkspaceView
 */
import type { WebEnhancedProps } from '../contract.ts';
/** Full composed props of the workspace view. */
export type WorkspaceViewProps = WebEnhancedProps<'conversation.view'>;
/** The workspace view. */
export declare function WorkspaceView(props: WorkspaceViewProps): import("react").JSX.Element;
