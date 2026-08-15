/**
 * Workspace view: file tree, preview, SCM, the task board, and the git graph
 * for the session's project, registered as one tab in the conversation's view
 * ring beside Chat and Trajectory.
 *
 * It lives in `conversation.view` rather than floating over the frame. The
 * view ring renders one entry at a time at full column width, so this surface
 * owns no geometry — no docking, no drag-to-resize, no collapse. Those belong
 * to the frame, and a tab that tried to own them would fight it.
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
  key: 'panel.tab.files' | 'panel.tab.preview' | 'panel.tab.scm' | 'panel.tab.board' | 'panel.tab.graph'
}> = [
  { tab: 'files', key: 'panel.tab.files' },
  { tab: 'preview', key: 'panel.tab.preview' },
  { tab: 'scm', key: 'panel.tab.scm' },
  { tab: 'board', key: 'panel.tab.board' },
  { tab: 'graph', key: 'panel.tab.graph' },
]

/** The workspace view. */
export function WorkspaceView(props: WorkspaceViewProps) {
  const { sessionId, usePanel, useWorkspaces, selectTab, clearTabs, t } = props
  const workspaces = useWorkspaces(state => state)
  // Session scope: this view renders for one exact session, so the workspace
  // comes from that id rather than from whichever session is current.
  const workspaceId = workspaceOfSessionId(sessionId, workspaces)?.workspaceId

  const tab = usePanel(state => state.tab)

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
    <section className={css.view} data-testid="workspace-view">
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
        {tab === 'files' && <FileTree {...props} workspaceId={String(workspaceId)} />}
        {tab === 'preview' && <PreviewPane {...props} workspaceId={String(workspaceId)} />}
        {tab === 'scm' && <ScmPane {...props} workspaceId={String(workspaceId)} />}
        {tab === 'board' && (
          <BoardPanel remote={props.remote} workspaces={workspaces.items} openSession={props.openSession} t={t} />
        )}
        {tab === 'graph' && (
          <GraphPanel workspaceId={String(workspaceId)} remote={props.remote} t={t} />
        )}
      </div>
    </section>
  )
}
