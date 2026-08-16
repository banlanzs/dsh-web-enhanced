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

import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type {
  ApiError, TerminalCloseRequest, TerminalCloseResult, TerminalListResult, TerminalOpenRequest,
  TerminalOpenResult, TerminalReadRequest, TerminalReadResult, TerminalSendRequest,
  TerminalSendResult, TerminalSessionStatusView, TerminalSignalRequest, TerminalSignalResult,
} from './types.ts'

/** Why one send returned control (member-identical to the host's wait reason). */
type WaitReason = 'stdin_read' | 'inferred_idle' | 'timeout' | 'session_exit'

/** Signals the PTY surface permits. */
const SIGNALS = ['SIGINT', 'SIGTERM', 'SIGKILL', 'SIGTSTP', 'SIGHUP'] as const

/** Structural face of the host's `ctx.terminals` service. */
interface TerminalsFace {
  listBackends(): string[]
  spawn(owner: Agent, request: { type: string; name?: string; cwd?: string }): Promise<{
    readonly sessionId: string & object
    readonly name?: string
    readonly type: string
    readonly pid?: number
    readonly status: { kind: 'running' } | { kind: 'exited'; exitCode: number | null; signal: string | null }
    readonly motd: string
  }>
  startSend(owner: Agent, id: string & object, request: { text: string; submit: boolean }): {
    done: Promise<{
      viewport: string
      waitReason: WaitReason
      sessionStatus: { kind: 'running' } | { kind: 'exited'; exitCode: number | null; signal: string | null }
      truncated: boolean
    }>
  }
  read(owner: Agent, id: string & object, request: { offset?: number; count?: number }): {
    text: string
    totalLines: number
    lineBegin: number
    lineEnd: number
    truncated: boolean
  }
  signal(owner: Agent, id: string & object, signal: string): Promise<{ delivered: true; targetPgid: number }>
  kill(owner: Agent, id: string & object, reason?: string): Promise<boolean>
  list(owner: Agent): ReadonlyArray<{
    readonly sessionId: string & object
    readonly name?: string
    readonly type: string
    readonly pid?: number
    readonly status: { kind: 'running' } | { kind: 'exited'; exitCode: number | null; signal: string | null }
  }>
}

/** Structural face of `ctx.agents` (the live-agent registry). */
interface AgentsFace {
  get(id: string & object): Agent | undefined
}

/** Project one host session status onto the wire view. */
function statusView(status: {
  kind: 'running' | 'exited'
  exitCode?: number | null
  signal?: string | null
}): TerminalSessionStatusView {
  return status.kind === 'running' ? { kind: 'running' } : { kind: 'exited', exitCode: status.exitCode ?? null, signal: status.signal ?? null }
}

/** The web terminal's server half; one instance per gateway. */
export class TerminalHost {
  private readonly ctx: Context

  /** @param ctx - gateway context (services are read uninjected per call). */
  constructor(ctx: Context) {
    this.ctx = ctx
  }

  /** The PTY registry, or undefined when the deployment composes no terminal capability. */
  private service(): TerminalsFace | undefined {
    return this.ctx.get('terminals' as never, false) as unknown as TerminalsFace | undefined
  }

  /** The live agent owning this conversation's terminal sessions, or undefined. */
  private ownerOf(ownerSessionId: string): Agent | undefined {
    const agents = this.ctx.get('agents' as never, false) as unknown as AgentsFace | undefined
    return agents?.get(ownerSessionId as never)
  }

  /**
   * Open one PTY on the conversation's agent, in the workspace root, on the
   * preferred registered backend.
   * @param request - owning conversation plus optional display name.
   * @param cwd - resolved workspace root.
   */
  async open(request: TerminalOpenRequest, cwd: string): Promise<TerminalOpenResult> {
    const terminals = this.service()
    if (terminals === undefined) {
      return { error: { code: 'terminal-unavailable', message: 'the host composes no terminal service (@deepseek-ai/dsh-terminal)' } }
    }
    const owner = this.ownerOf(request.ownerSessionId)
    if (owner === undefined) {
      return { error: { code: 'owner-not-live', message: `no live agent for session '${request.ownerSessionId}'` } }
    }
    const backends = terminals.listBackends()
    if (backends.length === 0) {
      return { error: { code: 'terminal-no-backend', message: 'no PTY backend is registered (load a terminal provider such as dsh-terminal-bash)' } }
    }
    const type = backends.includes('shell') ? 'shell' : backends[0]
    try {
      const spawned = await terminals.spawn(owner, { type, ...request.name !== undefined ? { name: request.name } : {}, cwd })
      const { motd, sessionId } = spawned
      return { session: { sessionId, type: spawned.type, ...spawned.name !== undefined ? { name: spawned.name } : {}, ...spawned.pid !== undefined ? { pid: spawned.pid } : {}, status: statusView(spawned.status) }, motd }
    } catch (error) {
      return { error: { code: 'terminal-open', message: String(error instanceof Error ? error.message : error) } }
    }
  }

  /**
   * Send one line of input and await the backend's wait boundary.
   * @param request - owning conversation, PTY session, and the input.
   */
  async send(request: TerminalSendRequest): Promise<TerminalSendResult> {
    const boundaries = this.owned(request.ownerSessionId, request.sessionId)
    if ('error' in boundaries) return boundaries
    const { terminals, owner, id } = boundaries
    try {
      const result = await terminals.startSend(owner, id, { text: request.text, submit: request.submit }).done
      return {
        viewport: result.viewport,
        waitReason: result.waitReason,
        sessionStatus: statusView(result.sessionStatus),
        truncated: result.truncated,
      }
    } catch (error) {
      return { error: { code: 'terminal-send', message: String(error instanceof Error ? error.message : error) } }
    }
  }

  /**
   * Read one bounded page of retained scrollback.
   * @param request - owning conversation, PTY session, and page request.
   */
  read(request: TerminalReadRequest): TerminalReadResult {
    const boundaries = this.owned(request.ownerSessionId, request.sessionId)
    if ('error' in boundaries) return boundaries
    const { terminals, owner, id } = boundaries
    try {
      const page = terminals.read(owner, id, { ...request.offset !== undefined ? { offset: request.offset } : {}, ...request.count !== undefined ? { count: request.count } : {} })
      return {
        text: page.text,
        totalLines: page.totalLines,
        lineBegin: page.lineBegin,
        lineEnd: page.lineEnd,
        truncated: page.truncated,
      }
    } catch (error) {
      return { error: { code: 'terminal-read', message: String(error instanceof Error ? error.message : error) } }
    }
  }

  /**
   * Deliver one permitted signal to the session's foreground process group.
   * @param request - owning conversation, PTY session, and the signal.
   */
  async signal(request: TerminalSignalRequest): Promise<TerminalSignalResult> {
    if (!SIGNALS.includes(request.signal as typeof SIGNALS[number])) {
      return { error: { code: 'terminal-signal', message: `unsupported signal '${request.signal}'` } }
    }
    const boundaries = this.owned(request.ownerSessionId, request.sessionId)
    if ('error' in boundaries) return boundaries
    try {
      const delivered = await boundaries.terminals.signal(boundaries.owner, boundaries.id, request.signal)
      return { delivered: delivered.delivered, targetPgid: delivered.targetPgid }
    } catch (error) {
      return { error: { code: 'terminal-signal', message: String(error instanceof Error ? error.message : error) } }
    }
  }

  /**
   * Close one session and drop it from the owner's registry.
   * @param request - owning conversation and PTY session.
   */
  async close(request: TerminalCloseRequest): Promise<TerminalCloseResult> {
    const boundaries = this.owned(request.ownerSessionId, request.sessionId)
    if ('error' in boundaries) return boundaries
    try {
      await boundaries.terminals.kill(boundaries.owner, boundaries.id, 'web terminal closed')
      return { closed: true }
    } catch (error) {
      return { error: { code: 'terminal-close', message: String(error instanceof Error ? error.message : error) } }
    }
  }

  /**
   * List the conversation agent's live sessions.
   * @param ownerSessionId - the owning conversation.
   */
  async list(ownerSessionId: string): Promise<TerminalListResult> {
    const terminals = this.service()
    if (terminals === undefined) {
      return { error: { code: 'terminal-unavailable', message: 'the host composes no terminal service (@deepseek-ai/dsh-terminal)' } }
    }
    const owner = this.ownerOf(ownerSessionId)
    if (owner === undefined) {
      return { error: { code: 'owner-not-live', message: `no live agent for session '${ownerSessionId}'` } }
    }
    return {
      sessions: terminals.list(owner).map(session => ({
        sessionId: session.sessionId,
        type: session.type,
        ...session.name !== undefined ? { name: session.name } : {},
        ...session.pid !== undefined ? { pid: session.pid } : {},
        status: statusView(session.status),
      })),
    }
  }

  /** Resolved service+owner+id triple, or the typed error branch; every step is synchronous. */
  private owned(ownerSessionId: string, sessionId: string):
    { terminals: TerminalsFace; owner: Agent; id: string & object } | { error: ApiError } {
    const terminals = this.service()
    if (terminals === undefined) {
      return { error: { code: 'terminal-unavailable', message: 'the host composes no terminal service (@deepseek-ai/dsh-terminal)' } }
    }
    const owner = this.ownerOf(ownerSessionId)
    if (owner === undefined) {
      return { error: { code: 'owner-not-live', message: `no live agent for session '${ownerSessionId}'` } }
    }
    return { terminals, owner, id: sessionId as never }
  }
}
