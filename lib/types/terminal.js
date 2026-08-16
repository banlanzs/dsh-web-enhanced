/**
 * Terminal host helper: the web terminal's server half. Wraps the host's
 * native PTY registry (`ctx.terminals`, `@deepseek-ai/dsh-terminal`) without
 * a package dependency — the service face is declared structurally, read
 * uninjected, so a deployment without the terminal capability degrades to an
 * inline error rather than a gateway that never mounts.
 *
 * Ownership follows the host's model exactly: every session is owned by the
 * live agent of the conversation the web terminal was opened from, so PTY
 * cleanup rides the agent's own disposal and one user's sessions are never
 * reachable from another's view.
 * @module dsh-web-enhanced/src/terminal
 */
/** Signals the PTY surface permits. */
const SIGNALS = ['SIGINT', 'SIGTERM', 'SIGKILL', 'SIGTSTP', 'SIGHUP'];
/** Project one host session status onto the wire view. */
function statusView(status) {
    return status.kind === 'running' ? { kind: 'running' } : { kind: 'exited', exitCode: status.exitCode ?? null, signal: status.signal ?? null };
}
/** The web terminal's server half; one instance per gateway. */
export class TerminalHost {
    ctx;
    /** @param ctx - gateway context (services are read uninjected per call). */
    constructor(ctx) {
        this.ctx = ctx;
    }
    /** The PTY registry, or undefined when the deployment composes no terminal capability. */
    service() {
        return this.ctx.get('terminals', false);
    }
    /** The live agent owning this conversation's terminal sessions, or undefined. */
    ownerOf(ownerSessionId) {
        const agents = this.ctx.get('agents', false);
        return agents?.get(ownerSessionId);
    }
    /**
     * Open one PTY on the conversation's agent, in the workspace root, on the
     * preferred registered backend.
     * @param request - owning conversation plus optional display name.
     * @param cwd - resolved workspace root.
     */
    async open(request, cwd) {
        const terminals = this.service();
        if (terminals === undefined) {
            return { error: { code: 'terminal-unavailable', message: 'the host composes no terminal service (@deepseek-ai/dsh-terminal)' } };
        }
        const owner = this.ownerOf(request.ownerSessionId);
        if (owner === undefined) {
            return { error: { code: 'owner-not-live', message: `no live agent for session '${request.ownerSessionId}'` } };
        }
        const backends = terminals.listBackends();
        if (backends.length === 0) {
            return { error: { code: 'terminal-no-backend', message: 'no PTY backend is registered (load a terminal provider such as dsh-terminal-bash)' } };
        }
        const type = backends.includes('shell') ? 'shell' : backends[0];
        try {
            const spawned = await terminals.spawn(owner, { type, ...request.name !== undefined ? { name: request.name } : {}, cwd });
            const { motd, sessionId } = spawned;
            return { session: { sessionId, type: spawned.type, ...spawned.name !== undefined ? { name: spawned.name } : {}, ...spawned.pid !== undefined ? { pid: spawned.pid } : {}, status: statusView(spawned.status) }, motd };
        }
        catch (error) {
            return { error: { code: 'terminal-open', message: String(error instanceof Error ? error.message : error) } };
        }
    }
    /**
     * Send one line of input and await the backend's wait boundary.
     * @param request - owning conversation, PTY session, and the input.
     */
    async send(request) {
        const boundaries = this.owned(request.ownerSessionId, request.sessionId);
        if ('error' in boundaries)
            return boundaries;
        const { terminals, owner, id } = boundaries;
        try {
            const result = await terminals.startSend(owner, id, { text: request.text, submit: request.submit }).done;
            return {
                viewport: result.viewport,
                waitReason: result.waitReason,
                sessionStatus: statusView(result.sessionStatus),
                truncated: result.truncated,
            };
        }
        catch (error) {
            return { error: { code: 'terminal-send', message: String(error instanceof Error ? error.message : error) } };
        }
    }
    /**
     * Read one bounded page of retained scrollback.
     * @param request - owning conversation, PTY session, and page request.
     */
    read(request) {
        const boundaries = this.owned(request.ownerSessionId, request.sessionId);
        if ('error' in boundaries)
            return boundaries;
        const { terminals, owner, id } = boundaries;
        try {
            const page = terminals.read(owner, id, { ...request.offset !== undefined ? { offset: request.offset } : {}, ...request.count !== undefined ? { count: request.count } : {} });
            return {
                text: page.text,
                totalLines: page.totalLines,
                lineBegin: page.lineBegin,
                lineEnd: page.lineEnd,
                truncated: page.truncated,
            };
        }
        catch (error) {
            return { error: { code: 'terminal-read', message: String(error instanceof Error ? error.message : error) } };
        }
    }
    /**
     * Deliver one permitted signal to the session's foreground process group.
     * @param request - owning conversation, PTY session, and the signal.
     */
    async signal(request) {
        if (!SIGNALS.includes(request.signal)) {
            return { error: { code: 'terminal-signal', message: `unsupported signal '${request.signal}'` } };
        }
        const boundaries = this.owned(request.ownerSessionId, request.sessionId);
        if ('error' in boundaries)
            return boundaries;
        try {
            const delivered = await boundaries.terminals.signal(boundaries.owner, boundaries.id, request.signal);
            return { delivered: delivered.delivered, targetPgid: delivered.targetPgid };
        }
        catch (error) {
            return { error: { code: 'terminal-signal', message: String(error instanceof Error ? error.message : error) } };
        }
    }
    /**
     * Close one session and drop it from the owner's registry.
     * @param request - owning conversation and PTY session.
     */
    async close(request) {
        const boundaries = this.owned(request.ownerSessionId, request.sessionId);
        if ('error' in boundaries)
            return boundaries;
        try {
            await boundaries.terminals.kill(boundaries.owner, boundaries.id, 'web terminal closed');
            return { closed: true };
        }
        catch (error) {
            return { error: { code: 'terminal-close', message: String(error instanceof Error ? error.message : error) } };
        }
    }
    /**
     * List the conversation agent's live sessions.
     * @param ownerSessionId - the owning conversation.
     */
    async list(ownerSessionId) {
        const terminals = this.service();
        if (terminals === undefined) {
            return { error: { code: 'terminal-unavailable', message: 'the host composes no terminal service (@deepseek-ai/dsh-terminal)' } };
        }
        const owner = this.ownerOf(ownerSessionId);
        if (owner === undefined) {
            return { error: { code: 'owner-not-live', message: `no live agent for session '${ownerSessionId}'` } };
        }
        return {
            sessions: terminals.list(owner).map(session => ({
                sessionId: session.sessionId,
                type: session.type,
                ...session.name !== undefined ? { name: session.name } : {},
                ...session.pid !== undefined ? { pid: session.pid } : {},
                status: statusView(session.status),
            })),
        };
    }
    /** Resolved service+owner+id triple, or the typed error branch; every step is synchronous. */
    owned(ownerSessionId, sessionId) {
        const terminals = this.service();
        if (terminals === undefined) {
            return { error: { code: 'terminal-unavailable', message: 'the host composes no terminal service (@deepseek-ai/dsh-terminal)' } };
        }
        const owner = this.ownerOf(ownerSessionId);
        if (owner === undefined) {
            return { error: { code: 'owner-not-live', message: `no live agent for session '${ownerSessionId}'` } };
        }
        return { terminals, owner, id: sessionId };
    }
}
