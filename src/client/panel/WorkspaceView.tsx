/**
 * Workspace view: the explorer (VSCode-style file tree sidebar plus preview
 * of the open file), SCM, the task board, and the git graph for the session's
 * project, registered as one tab in the conversation's view ring beside Chat
 * and Trajectory.
 *
 * It lives in `conversation.view` rather than floating over the frame. The
 * view ring renders one entry at a time at full column width, so this surface
 * owns no geometry of its own — no docking, no collapse. The one geometry it
 * does own is the explorer's sidebar width split, which lives entirely inside
 * the tab.
 * @module dsh-web-enhanced/src/client/panel/WorkspaceView
 */

import { useEffect, useRef } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { PanelTab, WebEnhancedProps } from '../contract.ts'
import { workspaceOfSessionId } from '../workspace.ts'
import { BoardPanel } from '../board/BoardOverlay.tsx'
import { GraphPanel } from '../git/GraphOverlay.tsx'
import { FileTree } from './FileTree.tsx'
import { PreviewPane } from './PreviewPane.tsx'
import { ScmPane } from './ScmPane.tsx'
import css from './WorkspaceView.module.css'

/** Full composed props of the workspace view. */
export type WorkspaceViewProps = WebEnhancedProps<'conversation.view'>

/** Tabs in display order with their dictionary keys. */
const TABS: ReadonlyArray<{
  tab: PanelTab
  key: 'panel.tab.explorer' | 'panel.tab.scm' | 'panel.tab.board' | 'panel.tab.graph'
}> = [
  { tab: 'explorer', key: 'panel.tab.explorer' },
  { tab: 'scm', key: 'panel.tab.scm' },
  { tab: 'board', key: 'panel.tab.board' },
  { tab: 'graph', key: 'panel.tab.graph' },
]

/** The workspace view. */
export function WorkspaceView(props: WorkspaceViewProps) {
  const { sessionId, usePanel, useWorkspaces, selectTab, clearTabs, setSidebarCollapsed, t } = props
  const workspaces = useWorkspaces(state => state)
  // Session scope: this view renders for one exact session, so the workspace
  // comes from that id rather than from whichever session is current.
  const workspaceId = workspaceOfSessionId(sessionId, workspaces)?.workspaceId

  const tab = usePanel(state => state.tab)
  const sidebarCollapsed = usePanel(state => state.sidebarCollapsed)

  // Preview tabs address paths inside one workspace root; carrying them into
  // another project would show stale files under valid-looking names.
  const lastWorkspace = useRef<string | undefined>(workspaceId)
  useEffect(() => {
    if (lastWorkspace.current === workspaceId) return
    lastWorkspace.current = workspaceId
    clearTabs()
  }, [clearTabs, workspaceId])

  if (workspaceId === undefined) {
    return <p className={css.empty} data-testid="workspace-view-no-project">{t('panel.noWorkspace')}</p>
  }

  return (
    // Opting into the host's composer-overlay layout: ConversationRoot then
    // gives this view a definite height and lets it own every scroller (the
    // same contract the Trajectory view uses), instead of the page-scrolled
    // default where the tree and the preview would ride one scroll together.
    <section className={css.view} data-testid="workspace-view" data-conversation-composer-overlay="">
      <nav className={css.tabs} role="tablist">
        {TABS.map(entry => (
          <button
            key={entry.tab}
            type="button"
            role="tab"
            className={css.tab}
            data-active={tab === entry.tab || undefined}
            aria-selected={tab === entry.tab}
            data-testid={`workspace-view-tab-${entry.tab}`}
            onClick={() => { selectTab(entry.tab) }}
          >
            {t(entry.key)}
          </button>
        ))}
      </nav>
      <div className={css.body} role="tabpanel">
        {tab === 'explorer' && (
          <div className={css.module}>
            <div
              className={sidebarCollapsed ? css.explorerCollapsed : css.explorer}
              data-testid="workspace-explorer"
              data-sidebar={sidebarCollapsed ? 'collapsed' : 'expanded'}
            >
              {sidebarCollapsed
                ? (
                  <button
                    type="button"
                    className={css.expand}
                    aria-label={t('files.expand')}
                    data-testid="workspace-sidebar-expand"
                    title={t('files.expand')}
                    onClick={() => { setSidebarCollapsed(false) }}
                  >
                    <span aria-hidden="true">›</span>
                  </button>
                )
                : (
                  <aside className={css.sidebar}>
                    <button
                      type="button"
                      className={css.collapse}
                      aria-label={t('files.collapse')}
                      data-testid="workspace-sidebar-collapse"
                      title={t('files.collapse')}
                      onClick={() => { setSidebarCollapsed(true) }}
                    >
                      <span aria-hidden="true">‹</span>
                    </button>
                    <FileTree {...props} workspaceId={String(workspaceId)} />
                  </aside>
                )}
              <PreviewPane {...props} workspaceId={String(workspaceId)} />
            </div>
          </div>
        )}
        {tab === 'scm' && (
          <div className={css.module}>
            <ScmPane {...props} workspaceId={String(workspaceId)} />
          </div>
        )}
        {tab === 'board' && (
          <div className={css.module}>
            <BoardPanel remote={props.remote} workspaces={workspaces.items} openSession={props.openSession} t={t} />
          </div>
        )}
        {tab === 'graph' && (
          <div className={css.module}>
            <GraphPanel workspaceId={String(workspaceId)} remote={props.remote} t={t} />
          </div>
        )}
      </div>
    </section>
  )
}
