/**
 * The workspace's terminal drawer: a collapsible, drag-resized strip along the
 * bottom of the workspace view holding one tab per live PTY.
 *
 * It sits below the tab body rather than inside one tab so a terminal stays
 * visible while the file tree, changes, board, or graph is in front — the
 * point of a bottom drawer is to type commands without leaving what you were
 * looking at.
 * @module dsh-web-enhanced/src/client/terminal/TerminalDrawer
 */
import type { WebEnhancedProps } from '../contract.ts';
/** Props of the drawer. */
export type TerminalDrawerProps = WebEnhancedProps<'conversation.view'> & {
    readonly workspaceId: string;
};
/** The terminal drawer. */
export declare function TerminalDrawer(props: TerminalDrawerProps): import("react").JSX.Element;
