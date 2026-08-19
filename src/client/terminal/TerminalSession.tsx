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

import { useCallback, useEffect, useRef, useState } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import type { TerminalView, WebEnhancedRemote } from '../contract.ts'
import { TERMINAL_EXIT_CLOSE_CODE, TERMINAL_GONE_CLOSE_CODE, TERMINAL_SOCKET_PATH } from '../../types.ts'
import css from './TerminalSession.module.css'

/** Backoff bounds of the socket's reconnect loop. */
const RECONNECT_BASE_MS = 400
const RECONNECT_MAX_MS = 8_000

/** Props of one terminal viewport. */
export interface TerminalSessionProps {
  readonly workspaceId: string
  /** Session to attach to, or null to create one sized to this viewport. */
  readonly terminal: TerminalView | null
  readonly remote: WebEnhancedRemote
  /** Called once with the created session when `terminal` was null. */
  readonly onSpawned: (terminal: TerminalView) => void
  /** Called when the shell exits, so the drawer can drop it from the strip. */
  readonly onExit: (terminalId: string) => void
  /** Localized status strings, already interpolated by the drawer. */
  readonly labels: {
    readonly connecting: string
    readonly reconnecting: string
    readonly gone: string
    readonly exited: (code: string) => string
    readonly error: (message: string) => string
  }
}

/** What the viewport reports above the terminal surface. */
type Phase =
  | { readonly kind: 'connecting' }
  | { readonly kind: 'open' }
  | { readonly kind: 'reconnecting' }
  | { readonly kind: 'exited'; readonly code: string }
  | { readonly kind: 'gone' }
  | { readonly kind: 'error'; readonly message: string }

/**
 * Read the terminal palette off the host's theme tokens.
 *
 * The background stays transparent so the drawer's own surface shows through
 * and follows the theme for free; only the glyph colors have to be resolved,
 * because xterm writes them as inline styles.
 * @param root - element carrying the theme custom properties.
 * @returns an xterm theme.
 */
function themeOf(root: HTMLElement): { background: string; foreground: string; cursor: string } {
  const styles = getComputedStyle(root)
  const read = (token: string, fallback: string): string => {
    const value = styles.getPropertyValue(token).trim()
    return value === '' ? fallback : value
  }
  return {
    background: 'rgba(0, 0, 0, 0)',
    foreground: read('--dsw-alias-label-primary', 'rgb(15 17 21)'),
    cursor: read('--dsw-alias-label-primary', 'rgb(15 17 21)'),
  }
}

/** Build the socket URL for one session. */
function socketUrl(terminalId: string): string {
  const url = new URL(TERMINAL_SOCKET_PATH, window.location.href)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('id', terminalId)
  return url.toString()
}

/** One terminal viewport. */
export function TerminalSession({
  workspaceId, terminal, remote, onSpawned, onExit, labels,
}: TerminalSessionProps) {
  const host = useRef<HTMLDivElement | null>(null)
  const [phase, setPhase] = useState<Phase>({ kind: 'connecting' })
  // Callbacks are read through refs so a parent re-render never tears down a
  // live PTY connection: the effect below must depend on the session id alone.
  const spawned = useRef(onSpawned)
  const exited = useRef(onExit)
  spawned.current = onSpawned
  exited.current = onExit

  const terminalId = terminal?.id ?? null
  const cols = terminal?.cols ?? null
  const rows = terminal?.rows ?? null

  useEffect(() => {
    const element = host.current
    if (element === null) return
    let disposed = false
    let socket: WebSocket | undefined
    let retry: ReturnType<typeof setTimeout> | undefined
    let attempt = 0

    const term = new Terminal({
      allowTransparency: true,
      theme: themeOf(document.documentElement),
      fontSize: 12,
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
      scrollback: 5_000,
      cursorBlink: true,
    })
    term.open(element)

    // The palette lives in custom properties on the root element, so a theme
    // switch is an attribute mutation there rather than a React update.
    const themeWatch = new MutationObserver(() => {
      term.options.theme = themeOf(document.documentElement)
    })
    themeWatch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme', 'data-dsw-theme'],
    })

    const connect = (id: string): void => {
      if (disposed) return
      const connection = new WebSocket(socketUrl(id))
      socket = connection
      connection.onopen = () => {
        attempt = 0
        if (!disposed) setPhase({ kind: 'open' })
      }
      connection.onmessage = (event: MessageEvent<string>) => { term.write(event.data) }
      connection.onclose = (event: CloseEvent) => {
        if (disposed) return
        if (event.code === TERMINAL_EXIT_CLOSE_CODE) {
          let code = ''
          try {
            const settled = JSON.parse(event.reason) as { exitCode: number | null; signal: string | null }
            code = settled.signal ?? String(settled.exitCode ?? '')
          } catch {
            // A close reason that is not our JSON still means "it exited".
          }
          setPhase({ kind: 'exited', code })
          exited.current(id)
          return
        }
        if (event.code === TERMINAL_GONE_CLOSE_CODE) {
          setPhase({ kind: 'gone' })
          exited.current(id)
          return
        }
        // Anything else is transport loss: the PTY is still alive host-side,
        // so reconnecting re-attaches and replays the scrollback.
        setPhase({ kind: 'reconnecting' })
        retry = setTimeout(
          () => { connect(id) },
          Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** attempt++),
        )
      }
    }

    const start = async (): Promise<void> => {
      if (terminalId !== null) {
        // Match the PTY's own geometry rather than this viewport's.
        if (cols !== null && rows !== null) term.resize(cols, rows)
        connect(terminalId)
        return
      }
      const fit = new FitAddon()
      term.loadAddon(fit)
      fit.fit()
      const created = await remote.terminalSpawn({ workspaceId, cols: term.cols, rows: term.rows })
      if (disposed) return
      if ('error' in created) {
        setPhase({ kind: 'error', message: created.error.message })
        return
      }
      spawned.current(created.terminal)
      connect(created.terminal.id)
    }
    void start()

    const input = term.onData((data) => {
      if (socket !== undefined && socket.readyState === WebSocket.OPEN) socket.send(data)
    })

    return () => {
      disposed = true
      if (retry !== undefined) clearTimeout(retry)
      themeWatch.disconnect()
      input.dispose()
      // Closing before dispose: the socket's onclose must not schedule a
      // reconnect against a disposed terminal.
      socket?.close()
      term.dispose()
    }
  }, [cols, remote, rows, terminalId, workspaceId])

  const retryNow = useCallback(() => { setPhase({ kind: 'connecting' }) }, [])

  return (
    <div className={css.session} data-testid="terminal-session">
      <div className={css.surface} ref={host} data-testid="terminal-surface" />
      {phase.kind !== 'open' && (
        <p className={css.status} data-testid="terminal-status" onClick={retryNow}>
          {phase.kind === 'connecting' && labels.connecting}
          {phase.kind === 'reconnecting' && labels.reconnecting}
          {phase.kind === 'gone' && labels.gone}
          {phase.kind === 'exited' && labels.exited(phase.code)}
          {phase.kind === 'error' && labels.error(phase.message)}
        </p>
      )}
    </div>
  )
}
