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

import { useCallback, useEffect, useRef, useState } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type { TerminalView, WebEnhancedProps } from '../contract.ts'
import { clampDrawerHeight } from '../stores.ts'
import { TerminalSession } from './TerminalSession.tsx'
import css from './TerminalDrawer.module.css'

/** Props of the drawer. */
export type TerminalDrawerProps = WebEnhancedProps<'conversation.view'> & {
  readonly workspaceId: string
}

/** The terminal drawer. */
export function TerminalDrawer(props: TerminalDrawerProps) {
  const {
    workspaceId, remote, usePanel, setDrawerCollapsed, setDrawerHeight, setActiveTerminal, t,
  } = props
  const collapsed = usePanel(state => state.drawerCollapsed)
  const height = usePanel(state => state.drawerHeight)
  const activeId = usePanel(state => state.activeTerminalId)

  const [sessions, setSessions] = useState<readonly TerminalView[]>([])
  /** True while a viewport is measuring itself and creating its PTY. */
  const [creating, setCreating] = useState(false)
  const live = useRef(true)
  useEffect(() => () => { live.current = false }, [])

  // The registry lives in the host process, so what exists is authoritative
  // there: a reload, a restart, or a second browser tab all reconcile here.
  useEffect(() => {
    if (collapsed) return
    let cancelled = false
    void (async () => {
      const result = await remote.terminalList({ workspaceId })
      if (cancelled || !live.current || 'error' in result) return
      setSessions(result.terminals)
      if (result.terminals.length === 0) setCreating(true)
    })()
    return () => { cancelled = true }
  }, [collapsed, remote, workspaceId])

  const active = sessions.find(session => session.id === activeId)
    ?? (sessions.length > 0 ? sessions[0] : undefined)

  const spawned = useCallback((terminal: TerminalView) => {
    setCreating(false)
    setSessions(current => current.some(session => session.id === terminal.id)
      ? current
      : [...current, terminal])
    setActiveTerminal(terminal.id)
  }, [setActiveTerminal])

  const dropped = useCallback((terminalId: string) => {
    setSessions(current => current.filter(session => session.id !== terminalId))
  }, [])

  const close = useCallback(async (terminalId: string): Promise<void> => {
    await remote.terminalClose({ terminalId })
    if (!live.current) return
    dropped(terminalId)
    if (activeId === terminalId) setActiveTerminal(null)
  }, [activeId, dropped, remote, setActiveTerminal])

  // Pointer capture rather than window listeners: the drag must survive the
  // pointer crossing the terminal surface, which swallows its own events.
  const dragFrom = useRef<{ y: number; height: number } | null>(null)
  const startDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragFrom.current = { y: event.clientY, height }
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [height])
  const drag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const from = dragFrom.current
    if (from === null) return
    // Upward drag grows the drawer, so the delta is inverted.
    setDrawerHeight(clampDrawerHeight(from.height + (from.y - event.clientY)))
  }, [setDrawerHeight])
  const endDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragFrom.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }, [])

  const labels = {
    connecting: t('terminal.connecting'),
    reconnecting: t('terminal.reconnecting'),
    gone: t('terminal.gone'),
    exited: (code: string) => t('terminal.exited', { code }),
    error: (message: string) => t('terminal.error', { message }),
  }

  return (
    <section
      className={css.drawer}
      data-testid="terminal-drawer"
      data-collapsed={collapsed || undefined}
      style={collapsed ? undefined : { height: `${height}px` }}
    >
      {!collapsed && (
        <div
          className={css.handle}
          role="separator"
          aria-orientation="horizontal"
          aria-label={t('terminal.resize')}
          data-testid="terminal-resize"
          onPointerDown={startDrag}
          onPointerMove={drag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
      )}
      <nav className={css.strip}>
        <button
          type="button"
          className={css.toggle}
          data-testid="terminal-toggle"
          aria-expanded={!collapsed}
          title={collapsed ? t('terminal.expand') : t('terminal.collapse')}
          onClick={() => { setDrawerCollapsed(!collapsed) }}
        >
          <span aria-hidden="true">{collapsed ? '▲' : '▼'}</span>
          {t('terminal.title')}
        </button>
        {!collapsed && sessions.map(session => (
          <span key={session.id} className={css.tab} data-active={session.id === active?.id || undefined}>
            <button
              type="button"
              className={css.tabName}
              data-testid={`terminal-tab-${session.id}`}
              onClick={() => { setActiveTerminal(session.id) }}
            >
              {session.title}
            </button>
            <button
              type="button"
              className={css.tabClose}
              aria-label={t('terminal.close')}
              title={t('terminal.close')}
              data-testid={`terminal-close-${session.id}`}
              onClick={() => { void close(session.id) }}
            >
              <span aria-hidden="true">×</span>
            </button>
          </span>
        ))}
        {!collapsed && (
          <button
            type="button"
            className={css.new}
            aria-label={t('terminal.new')}
            title={t('terminal.new')}
            data-testid="terminal-new"
            onClick={() => { setCreating(true) }}
          >
            <span aria-hidden="true">+</span>
          </button>
        )}
      </nav>
      {!collapsed && (
        <div className={css.body} data-testid="terminal-body">
          {/* Every live session stays mounted and merely hidden: unmounting
              would drop its socket and lose the viewport's own scroll state,
              even though the PTY itself survives. */}
          {sessions.map(session => (
            <div
              key={session.id}
              className={session.id === active?.id ? css.pane : css.paneHidden}
            >
              <TerminalSession
                workspaceId={workspaceId}
                terminal={session}
                remote={remote}
                onSpawned={spawned}
                onExit={dropped}
                labels={labels}
              />
            </div>
          ))}
          {creating && (
            <div className={css.pane}>
              <TerminalSession
                workspaceId={workspaceId}
                terminal={null}
                remote={remote}
                onSpawned={spawned}
                onExit={dropped}
                labels={labels}
              />
            </div>
          )}
          {!creating && sessions.length === 0 && (
            <p className={css.empty} data-testid="terminal-empty">{t('terminal.empty')}</p>
          )}
        </div>
      )}
    </section>
  )
}
