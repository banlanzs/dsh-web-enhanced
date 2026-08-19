/**
 * The bidirectional channel of the workspace terminal.
 *
 * Typert invocations are unary, and the host's own `/api/events.*` sockets are
 * downlink-only (they close any client frame with 1008), so keystrokes need a
 * channel this plugin owns. `webServer.registerUpgrade` is the public seam for
 * that; this module completes the WebSocket handshake and wires the socket to
 * one registry session.
 *
 * Frames are deliberately unstructured: every client frame is keyboard input
 * written verbatim to the PTY, every server frame is raw terminal output.
 * Control operations (create, close, signal) stay on the Typert methods, so
 * this socket needs no envelope, no framing, and no versioning.
 * @module dsh-web-enhanced/src/terminal-socket
 */
import type { IncomingMessage } from 'node:http';
import type { Context } from '@deepseek-ai/cordis';
import type { TerminalRegistry } from './terminal.ts';
/**
 * Decide whether one upgrade request may open a terminal.
 *
 * Two independent fences, both required:
 *
 * - **Host** — a DNS-rebinding defense. A rebound page carries the attacker's
 *   domain here even though the socket landed on this server.
 * - **Origin** — a cross-site-WebSocket-hijacking defense. Browsers apply no
 *   CORS preflight to WebSocket, so without this any page on the internet
 *   could open `ws://localhost:<port>` and own the user's shell. Browsers
 *   always send Origin for WebSocket, so a missing one is refused too.
 * @param req - the upgrade request.
 * @param trustedHosts - non-loopback authorities this deployment serves.
 * @returns true when both fences pass.
 */
export declare function isTrustedTerminalUpgrade(req: IncomingMessage, trustedHosts: readonly string[]): boolean;
/** What the socket layer needs from its deployment. */
export interface TerminalSocketOptions {
    /** Non-loopback authorities allowed to open terminals. */
    readonly trustedHosts: readonly string[];
}
/**
 * Serve the terminal WebSocket while a web server is mounted.
 *
 * Registered through `ctx.inject` rather than the plugin's `inject` list: a
 * headless deployment has no web server and must still load this plugin, it
 * just gets no terminal.
 * @param ctx - the plugin context.
 * @param registry - live terminal sessions to attach sockets to.
 * @param options - trust configuration.
 */
export declare function applyTerminalSocket(ctx: Context, registry: TerminalRegistry, options: TerminalSocketOptions): void;
