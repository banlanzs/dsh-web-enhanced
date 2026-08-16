/**
 * The workspace's Terminal tab: a web front for the host's native PTY
 * registry. Sessions are owned by this conversation's live agent (cleanup
 * rides the agent), the initial working directory is the workspace root, and
 * every send returns the backend's settled viewport plus why control came
 * back (`stdin_read`, `inferred_idle`, `timeout`, `session_exit`) — the same
 * contract the model-facing terminal tools consume.
 *
 * The buffer is append-only: motd on open, each send's viewport, and the
 * newest scrollback page on reattach. Output rendering is plain text in a
 * `<pre>`; the backend has already rendered control sequences away.
 * @module dsh-web-enhanced/src/client/panel/TerminalPane
 */
import type { WebEnhancedProps } from '../contract.ts';
/** Props of the terminal pane: the panel's composed props plus the workspace. */
export type TerminalPaneProps = WebEnhancedProps<'conversation.view'> & {
    readonly workspaceId: string;
};
/** The terminal pane. */
export declare function TerminalPane({ sessionId, workspaceId, remote, t }: TerminalPaneProps): import("react").JSX.Element;
