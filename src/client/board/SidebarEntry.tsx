/**
 * Sidebar footer entries: the ENTRY BUTTONS of the task board and the git
 * graph. The overlays themselves live in `shell.overlay` — a button in the
 * sidebar's footer row must not also host a frame-wide surface, or the
 * overlay inherits the navigation column's stacking context and overflow.
 * These two only flip shared state.
 * @module dsh-web-enhanced/src/client/board/SidebarEntry
 */

import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { WebEnhancedProps } from '../contract.ts'
import css from './SidebarEntry.module.css'

/** Full composed props of a sidebar footer entry. */
export type SidebarEntryProps = WebEnhancedProps<'sidebar.footer.action'>

/**
 * The owner `wide` flag the shell hands every footer action: true while the
 * sidebar renders full content, false once the 56px rail has settled. The
 * label unmounts in the rail — display-only hiding would still leave text in
 * the accessibility tree and risk overflowing mid-animation.
 */
interface SidebarEntryButtonProps {
  readonly wide: boolean
  readonly label: string
  readonly glyph: string
  readonly active: boolean
  readonly testId: string
  readonly onToggle: () => void
}

function SidebarEntryButton({ wide, label, glyph, active, testId, onToggle }: SidebarEntryButtonProps) {
  // `wide === false` is the only rail signal: a shell from before the owner
  // prop existed never hands it, and an unknown state must render expanded
  // rather than drop both labels.
  const rail = wide === false
  return (
    <button
      type="button"
      className={css.entry}
      data-wide={rail || undefined}
      data-active={active || undefined}
      aria-pressed={active}
      aria-label={rail ? label : undefined}
      title={rail ? label : undefined}
      data-testid={testId}
      onClick={onToggle}
    >
      <span className={css.glyph} aria-hidden>{glyph}</span>
      {!rail && <span className={css.label}>{label}</span>}
    </button>
  )
}

/** Task-board entry: toggles the board overlay. */
export function BoardSidebarEntry({ wide, useOverlay, openOverlay, closeOverlay, t }: SidebarEntryProps) {
  const open = useOverlay(state => state.open === 'board')
  return (
    <SidebarEntryButton
      wide={wide}
      label={t('board.entry')}
      glyph="▤"
      active={open}
      testId="web-enhanced-board-entry"
      onToggle={() => { open ? closeOverlay() : openOverlay('board') }}
    />
  )
}

/** Git-graph entry: toggles the graph overlay. */
export function GraphSidebarEntry({ wide, useOverlay, openOverlay, closeOverlay, t }: SidebarEntryProps) {
  const open = useOverlay(state => state.open === 'graph')
  return (
    <SidebarEntryButton
      wide={wide}
      label={t('graph.entry')}
      glyph="⎇"
      active={open}
      testId="web-enhanced-graph-entry"
      onToggle={() => { open ? closeOverlay() : openOverlay('graph') }}
    />
  )
}
