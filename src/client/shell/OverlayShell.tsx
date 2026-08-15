/**
 * Shared chrome of the two full-frame overlays (task board, git graph).
 *
 * `shell.overlay` is a click-through layer: entries opt into pointer events.
 * This shell is where that opt-in happens, together with the dismissal
 * contract — Escape anywhere, or a click on the backdrop but not inside the
 * panel. Keeping both in one component is what stops the two overlays from
 * drifting apart on keyboard behaviour.
 * @module dsh-web-enhanced/src/client/shell/OverlayShell
 */

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import css from './OverlayShell.module.css'

/** Props of the overlay shell. */
export interface OverlayShellProps {
  /** Heading shown in the title bar. */
  readonly title: string
  /** Accessible label of the close button. */
  readonly closeLabel: string
  /** Dismiss request from Escape, the backdrop, or the close button. */
  readonly onClose: () => void
  /** Controls rendered next to the title (refresh, create, …). */
  readonly actions?: ReactNode
  /**
   * Let the body OWN the panel's height instead of scrolling as one document.
   *
   * The default suits content that reads top to bottom: it flows and the body
   * scrolls. A surface made of columns or a list wants the opposite — fill the
   * panel, scroll its own regions — and without this it lays out against its
   * content height instead, which is what leaves a tall panel half empty.
   */
  readonly fill?: boolean
  /** `data-testid` of the panel element. */
  readonly testId?: string
  /** Panel body. */
  readonly children: ReactNode
}

/** Full-frame overlay chrome: backdrop, panel, title bar, dismissal. */
export function OverlayShell({ title, closeLabel, onClose, actions, fill, testId, children }: OverlayShellProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onClose()
    }
    // Capture phase: the composer and other session surfaces also listen for
    // Escape, and the topmost surface is the one that should consume it.
    document.addEventListener('keydown', onKeyDown, true)
    return () => { document.removeEventListener('keydown', onKeyDown, true) }
  }, [onClose])

  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  return (
    <div
      className={css.backdrop}
      data-testid={testId}
      onMouseDown={(event) => {
        // Only a press that STARTS on the backdrop dismisses: a drag that
        // began inside the panel and released outside is not a dismissal.
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className={css.panel} ref={panelRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <header className={css.header}>
          <h2 className={css.title}>{title}</h2>
          <div className={css.actions}>{actions}</div>
          <button
            type="button"
            className={css.close}
            aria-label={closeLabel}
            data-testid="overlay-close"
            onClick={onClose}
          >
            ✕
          </button>
        </header>
        <div className={css.body} data-fill={fill === true || undefined}>{children}</div>
      </div>
    </div>
  )
}
