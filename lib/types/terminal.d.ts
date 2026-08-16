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
import type { Context } from '@deepseek-ai/cordis';
import type { TerminalCloseRequest, TerminalCloseResult, TerminalListResult, TerminalOpenRequest, TerminalOpenResult, TerminalReadRequest, TerminalReadResult, TerminalSendRequest, TerminalSendResult, TerminalSignalRequest, TerminalSignalResult } from './types.ts';
/** The web terminal's server half; one instance per gateway. */
export declare class TerminalHost {
    private readonly ctx;
    /** @param ctx - gateway context (services are read uninjected per call). */
    constructor(ctx: Context);
    /** The PTY registry, or undefined when the deployment composes no terminal capability. */
    private service;
    /** The live agent owning this conversation's terminal sessions, or undefined. */
    private ownerOf;
    /**
     * Open one PTY on the conversation's agent, in the workspace root, on the
     * preferred registered backend.
     * @param request - owning conversation plus optional display name.
     * @param cwd - resolved workspace root.
     */
    open(request: TerminalOpenRequest, cwd: string): Promise<TerminalOpenResult>;
    /**
     * Send one line of input and await the backend's wait boundary.
     * @param request - owning conversation, PTY session, and the input.
     */
    send(request: TerminalSendRequest): Promise<TerminalSendResult>;
    /**
     * Read one bounded page of retained scrollback.
     * @param request - owning conversation, PTY session, and page request.
     */
    read(request: TerminalReadRequest): TerminalReadResult;
    /**
     * Deliver one permitted signal to the session's foreground process group.
     * @param request - owning conversation, PTY session, and the signal.
     */
    signal(request: TerminalSignalRequest): Promise<TerminalSignalResult>;
    /**
     * Close one session and drop it from the owner's registry.
     * @param request - owning conversation and PTY session.
     */
    close(request: TerminalCloseRequest): Promise<TerminalCloseResult>;
    /**
     * List the conversation agent's live sessions.
     * @param ownerSessionId - the owning conversation.
     */
    list(ownerSessionId: string): Promise<TerminalListResult>;
    /** Resolved service+owner+id triple, or the typed error branch; every step is synchronous. */
    private owned;
}
