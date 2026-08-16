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

import { useCallback, useEffect, useRef, useState } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {
  TerminalSessionView, TerminalSessionStatusView, WebEnhancedProps,
} from '../contract.ts'
import css from './TerminalPane.module.css'

/** Props of the terminal pane: the panel's composed props plus the workspace. */
export type TerminalPaneProps = WebEnhancedProps<'conversation.view'> & { readonly workspaceId: string }

/** Local view of one open terminal. */
interface TerminalState {
  /** PTY session id (opaque wire string). */
  readonly id: string
  /** Owner-local display name, when given. */
  readonly name?: string
  /** Append-only output buffer. */
  buffer: string
  /** Latest wait boundary the backend reported. */
  waitReason?: 'stdin_read' | 'inferred_idle' | 'timeout' | 'session_exit'
  /** Latest known top-level process status. */
  status: TerminalSessionStatusView
}

/** The terminal pane. */
export function TerminalPane({ sessionId, workspaceId, remote, t }: TerminalPaneProps) {
  const [terminals, setTerminals] = useState<readonly TerminalState[]>([])
  const [activeId, setActiveId] = useState<string | undefined>(undefined)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const live = useRef(true)
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => () => { live.current = false }, [])

  // Reattach: list this conversation's live sessions and pull the newest
  // scrollback page for each, so a reopened tab shows real history.
  useEffect(() => {
    void (async () => {
      const result = await remote.terminalList({ ownerSessionId: sessionId })
      if (!live.current) return
      if ('error' in result) {
        setError(result.error.message)
        return
      }
      const states: TerminalState[] = []
      for (const session of result.sessions) {
        const page = await remote.terminalRead({ ownerSessionId: sessionId, sessionId: session.sessionId })
        if (!live.current) return
        states.push({
          id: session.sessionId,
          ...session.name !== undefined ? { name: session.name } : {},
          buffer: 'error' in page ? '' : page.text,
          status: session.status,
        })
      }
      setTerminals(states)
      setActiveId(states[0]?.id)
    })()
  }, [remote, sessionId])

  const active = terminals.find(entry => entry.id === activeId)

  // Keep the newest output in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [active?.buffer])

  const patch = useCallback((id: string, update: (entry: TerminalState) => TerminalState): void => {
    setTerminals(current => current.map(entry => entry.id === id ? update(entry) : entry))
  }, [])

  const open = useCallback(async (): Promise<void> => {
    setBusy(true)
    setError(null)
    const result = await remote.terminalOpen({ ownerSessionId: sessionId, workspaceId: workspaceId as never })
    if (!live.current) return
    setBusy(false)
    if ('error' in result) {
      setError(result.error.message)
      return
    }
    const { session, motd } = result
    setTerminals(current => [...current, {
      id: session.sessionId,
      ...session.name !== undefined ? { name: session.name } : {},
      buffer: motd,
      status: session.status,
    }])
    setActiveId(session.sessionId)
  }, [remote, sessionId, workspaceId])

  const send = useCallback(async (text: string, submit: boolean): Promise<void> => {
    if (active === undefined || text === '') return
    setBusy(true)
    const result = await remote.terminalSend({ ownerSessionId: sessionId, sessionId: active.id, text, submit })
    if (!live.current) return
    setBusy(false)
    if ('error' in result) {
      setError(result.error.message)
      return
    }
    setError(null)
    patch(active.id, entry => ({
      ...entry,
      buffer: entry.buffer + (submit ? `\n${text}\n` : text) + result.viewport,
      waitReason: result.waitReason,
      status: result.sessionStatus,
    }))
  }, [active, patch, remote, sessionId])

  const interrupt = useCallback(async (): Promise<void> => {
    if (active === undefined) return
    const result = await remote.terminalSignal({ ownerSessionId: sessionId, sessionId: active.id, signal: 'SIGINT' })
    if (!live.current) return
    if ('error' in result) setError(result.error.message)
  }, [active, remote, sessionId])

  const close = useCallback(async (id: string): Promise<void> => {
    const result = await remote.terminalClose({ ownerSessionId: sessionId, sessionId: id })
    if (!live.current) return
    if ('error' in result) {
      setError(result.error.message)
      return
    }
    setTerminals(current => {
      const next = current.filter(entry => entry.id !== id)
      setActiveId(currentId => currentId === id ? next[0]?.id : currentId)
      return next
    })
  }, [remote, sessionId])

  return (
    <div className={css.pane} data-testid="terminal-pane">
      <div className={css.toolbar}>
        <button type="button" className={css.action} onClick={() => { void open() }} disabled={busy}>
          {t('terminal.open')}
        </button>
        {terminals.length > 1 && (
          <select
            className={css.select}
            value={activeId}
            aria-label={t('terminal.select')}
            data-testid="terminal-select"
            onChange={event => { setActiveId(event.target.value) }}
          >
            {terminals.map(entry => (
              <option key={entry.id} value={entry.id}>{entry.name ?? entry.id}</option>
            ))}
          </select>
        )}
        {active !== undefined && (
          <>
            <span
              className={css.status}
              data-testid="terminal-status"
              data-status={active.status.kind}
            >
              {active.status.kind === 'exited'
                ? t('terminal.exited', { code: String(active.status.exitCode ?? '?') })
                : t('terminal.running')}
            </span>
            <button type="button" className={css.action} onClick={() => { void interrupt() }}>
              {t('terminal.interrupt')}
            </button>
            <button type="button" className={css.action} onClick={() => { void close(active.id) }}>
              {t('terminal.close')}
            </button>
          </>
        )}
      </div>
      {error !== null && <p className={css.error} data-testid="terminal-error">{error}</p>}
      <div className={css.body}>
        {active === undefined
          ? <p className={css.empty}>{t('terminal.empty')}</p>
          : (
            <pre className={css.output} data-testid="terminal-output">{active.buffer}
              {active.waitReason !== undefined && active.waitReason !== 'session_exit' && (
                <span className={css.wait} title={t(`terminal.wait.${active.waitReason}`)}> ⏎</span>
              )}
            </pre>
          )}
        <div ref={endRef} />
      </div>
      {active !== undefined && (
        <form
          className={css.inputRow}
          onSubmit={(event) => {
            event.preventDefault()
            const text = input
            setInput('')
            void send(text, true)
          }}
        >
          <span className={css.prompt} aria-hidden="true">$</span>
          <input
            className={css.input}
            value={input}
            placeholder={t('terminal.input')}
            data-testid="terminal-input"
            disabled={active.status.kind === 'exited' || busy}
            onChange={event => { setInput(event.target.value) }}
          />
        </form>
      )}
    </div>
  )
}
