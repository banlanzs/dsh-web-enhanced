/**
 * The right dock: file tree, preview, and SCM for the current session's
 * workspace.
 *
 * It lives in `shell.overlay`, not in the layout's `details` slot. `details`
 * is a `single` slot already occupied by ui-conversation's DetailsPanel, so
 * registering there would replace the tool-details column and remove the
 * `conversation.details.tool` seat it declares. `shell.overlay` is additive
 * and sits outside every column's scroll container, which is also what lets
 * this panel own its own geometry — `ctx.layout` exposes open/close for the
 * details column but no width API, and the feature request asks for a
 * draggable width that persists per project.
 * @module dsh-web-enhanced/src/client/panel/RightPanel
 */

import { useCallback, useEffect, useRef } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { PanelTab, WebEnhancedProps } from '../contract.ts'
import { PANEL_DEFAULT_WIDTH, clampPanelWidth } from '../stores.ts'
import { workspaceOfSession } from '../workspace.ts'
import { FileTree } from './FileTree.tsx'
import { PreviewPane } from './PreviewPane.tsx'
import { ScmPane } from './ScmPane.tsx'
import css from './RightPanel.module.css'

/** Full composed props of the right panel. */
export type RightPanelProps = WebEnhancedProps<'shell.overlay'>

/** Tabs in display order with their dictionary keys. */
const TABS: ReadonlyArray<{ tab: PanelTab; key: 'panel.tab.files' | 'panel.tab.preview' | 'panel.tab.scm' }> = [
  { tab: 'files', key: 'panel.tab.files' },
  { tab: 'preview', key: 'panel.tab.preview' },
  { tab: 'scm', key: 'panel.tab.scm' },
]

/** The right dock. */
export function RightPanel(props: RightPanelProps) {
  const {
    usePanel, useSessions, useWorkspaces, setCollapsed, setWidth, resetWidth, selectTab,
    clearTabs, t,
  } = props
  const sessions = useSessions(state => state)
  const workspaces = useWorkspaces(state => state)
  const workspace = workspaceOfSession(sessions, workspaces)
  const workspaceId = workspace?.workspaceId

  const tab = usePanel(state => state.tab)
  const collapsed = usePanel(state => workspaceId === undefined ? false : (state.collapsed[workspaceId] ?? false))
  const width = usePanel(state => workspaceId === undefined
    ? PANEL_DEFAULT_WIDTH
    : (state.width[workspaceId] ?? PANEL_DEFAULT_WIDTH))

  // Preview tabs address paths inside one workspace root; carrying them into
  // another project would show stale files under valid-looking names.
  const lastWorkspace = useRef<string | undefined>(workspaceId)
  useEffect(() => {
    if (lastWorkspace.current === workspaceId) return
    lastWorkspace.current = workspaceId
    clearTabs()
  }, [clearTabs, workspaceId])

  const dragging = useRef(false)
  const onHandleDown = useCallback((event: React.MouseEvent) => {
    if (workspaceId === undefined) return
    event.preventDefault()
    dragging.current = true
    const onMove = (move: MouseEvent): void => {
      if (!dragging.current) return
      // The dock is right-anchored, so its width grows as the pointer moves left.
      setWidth(workspaceId, clampPanelWidth(window.innerWidth - move.clientX))
    }
    const onUp = (): void => {
      dragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [setWidth, workspaceId])

  // The panel belongs to a project; an ungrouped session has no root to browse.
  if (workspaceId === undefined) return null

  if (collapsed) {
    return (
      <button
        type="button"
        className={css.collapsed}
        data-testid="right-panel-expand"
        aria-label={t('panel.expand')}
        title={t('panel.expand')}
        onClick={() => { setCollapsed(workspaceId, false) }}
      >
        ‹
      </button>
    )
  }

  return (
    <aside className={css.dock} style={{ width: `${String(width)}px` }} data-testid="right-panel">
      <div
        className={css.handle}
        role="separator"
        aria-orientation="vertical"
        aria-label={t('panel.resize')}
        title={t('panel.resize')}
        data-testid="right-panel-handle"
        onMouseDown={onHandleDown}
        onDoubleClick={() => { resetWidth(workspaceId) }}
      />
      <header className={css.header}>
        <nav className={css.tabs} role="tablist">
          {TABS.map(entry => (
            <button
              key={entry.tab}
              type="button"
              role="tab"
              className={css.tab}
              data-active={tab === entry.tab || undefined}
              aria-selected={tab === entry.tab}
              data-testid={`right-panel-tab-${entry.tab}`}
              onClick={() => { selectTab(entry.tab) }}
            >
              {t(entry.key)}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className={css.collapse}
          aria-label={t('panel.collapse')}
          title={t('panel.collapse')}
          data-testid="right-panel-collapse"
          onClick={() => { setCollapsed(workspaceId, true) }}
        >
          ›
        </button>
      </header>
      <div className={css.body} role="tabpanel">
        {tab === 'files' && <FileTree {...props} workspaceId={workspaceId} />}
        {tab === 'preview' && <PreviewPane {...props} workspaceId={workspaceId} />}
        {tab === 'scm' && <ScmPane {...props} workspaceId={workspaceId} />}
      </div>
    </aside>
  )
}
