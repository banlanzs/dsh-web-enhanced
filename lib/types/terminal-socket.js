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
import { WebSocketServer } from 'ws';
import { TERMINAL_EXIT_CLOSE_CODE, TERMINAL_GONE_CLOSE_CODE, TERMINAL_SOCKET_PATH } from "./types.js";
/**
 * Whether one authority is loopback.
 *
 * Parsed through `URL` so `[::1]:3190`, `127.0.0.1:3190` and bare `localhost`
 * are all handled by one implementation rather than string surgery.
 * @param authority - a Host header value.
 * @returns true when the authority names this machine.
 */
function isLoopbackAuthority(authority) {
    let hostname;
    try {
        hostname = new URL(`http://${authority}`).hostname;
    }
    catch {
        // A Host header that is not a parseable authority is not one we serve.
        return false;
    }
    if (hostname === 'localhost' || hostname === '[::1]')
        return true;
    return /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/u.test(hostname);
}
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
export function isTrustedTerminalUpgrade(req, trustedHosts) {
    const host = req.headers.host;
    if (host === undefined)
        return false;
    if (!isLoopbackAuthority(host) && !trustedHosts.includes(host))
        return false;
    const origin = req.headers.origin;
    if (origin === undefined)
        return false;
    try {
        return new URL(origin).host === host;
    }
    catch {
        // An unparseable Origin cannot be proven same-origin.
        return false;
    }
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
export function applyTerminalSocket(ctx, registry, options) {
    ctx.inject(['webServer'], (webCtx) => {
        const server = webCtx.get('webServer');
        if (server === undefined)
            return;
        const sockets = new WebSocketServer({ noServer: true });
        webCtx.effect(() => () => { sockets.close(); }, 'web-enhanced: terminal socket server');
        webCtx.effect(() => server.registerUpgrade({
            path: TERMINAL_SOCKET_PATH,
            handler: (req, socket, head) => {
                if (!isTrustedTerminalUpgrade(req, options.trustedHosts)) {
                    socket.destroy();
                    return;
                }
                const terminalId = new URL(req.url ?? '', 'http://localhost').searchParams.get('id');
                if (terminalId === null) {
                    socket.destroy();
                    return;
                }
                sockets.handleUpgrade(req, socket, head, connection => {
                    attach(connection, registry, terminalId);
                });
            },
        }), 'web-enhanced: terminal WebSocket route');
    });
}
/** Bind one negotiated socket to one session for the socket's lifetime. */
function attach(connection, registry, terminalId) {
    const sink = {
        send(data) {
            if (connection.readyState === connection.OPEN)
                connection.send(data);
        },
        exit(exitCode, signal) {
            if (connection.readyState !== connection.OPEN)
                return;
            connection.close(TERMINAL_EXIT_CLOSE_CODE, JSON.stringify({ exitCode, signal }));
        },
    };
    const detach = registry.attach(terminalId, sink);
    if (detach === undefined) {
        connection.close(TERMINAL_GONE_CLOSE_CODE, 'unknown terminal');
        return;
    }
    connection.on('message', (data) => {
        // Input is written as it arrives; a failed write means the PTY died
        // between frames, and the exit path already tells the browser.
        void registry.write(terminalId, Buffer.isBuffer(data) ? data.toString('utf8') : String(data));
    });
    connection.on('close', detach);
    connection.on('error', detach);
}
