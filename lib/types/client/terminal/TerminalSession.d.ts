/**
 * One xterm.js viewport bound to one host PTY over the plugin's WebSocket.
 *
 * Geometry is decided once. A new session measures the viewport and spawns the
 * PTY at exactly that size; an existing session renders at the size the PTY was
 * created with, because the subprocess seam cannot resize an allocated
 * terminal and a viewport sized to the current window would wrap every line at
 * the wrong column.
 * @module dsh-web-enhanced/src/client/terminal/TerminalSession
 */
import '@xterm/xterm/css/xterm.css';
import type { TerminalView, WebEnhancedRemote } from '../contract.ts';
/** Props of one terminal viewport. */
export interface TerminalSessionProps {
    readonly workspaceId: string;
    /** Session to attach to, or null to create one sized to this viewport. */
    readonly terminal: TerminalView | null;
    readonly remote: WebEnhancedRemote;
    /** Called once with the created session when `terminal` was null. */
    readonly onSpawned: (terminal: TerminalView) => void;
    /** Called when the shell exits, so the drawer can drop it from the strip. */
    readonly onExit: (terminalId: string) => void;
    /** Localized status strings, already interpolated by the drawer. */
    readonly labels: {
        readonly connecting: string;
        readonly reconnecting: string;
        readonly gone: string;
        readonly exited: (code: string) => string;
        readonly error: (message: string) => string;
    };
}
/** One terminal viewport. */
export declare function TerminalSession({ workspaceId, terminal, remote, onSpawned, onExit, labels, }: TerminalSessionProps): import("react").JSX.Element;
