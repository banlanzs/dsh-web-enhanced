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

/** Task-board entry: toggles the board overlay. */
export function BoardSidebarEntry({ useOverlay, openOverlay, closeOverlay, t }: SidebarEntryProps) {
  const open = useOverlay(state => state.open === 'board')
  return (
    <button
      type="button"
      className={css.entry}
      data-active={open || undefined}
      aria-pressed={open}
      data-testid="web-enhanced-board-entry"
      onClick={() => { open ? closeOverlay() : openOverlay('board') }}
    >
      <span className={css.glyph} aria-hidden>▤</span>
      <span className={css.label}>{t('board.entry')}</span>
    </button>
  )
}

/** Git-graph entry: toggles the graph overlay. */
export function GraphSidebarEntry({ useOverlay, openOverlay, closeOverlay, t }: SidebarEntryProps) {
  const open = useOverlay(state => state.open === 'graph')
  return (
    <button
      type="button"
      className={css.entry}
      data-active={open || undefined}
      aria-pressed={open}
      data-testid="web-enhanced-graph-entry"
      onClick={() => { open ? closeOverlay() : openOverlay('graph') }}
    >
      <span className={css.glyph} aria-hidden>⎇</span>
      <span className={css.label}>{t('graph.entry')}</span>
    </button>
  )
}
