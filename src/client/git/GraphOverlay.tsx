/**
 * Git graph overlay: branch lanes and commit history for the current
 * session's workspace. Registered into `shell.overlay` and rendered only
 * while the overlay state selects it, so an unopened graph costs one
 * subscription and nothing else.
 * @module dsh-web-enhanced/src/client/git/GraphOverlay
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { GitCommitView, WebEnhancedProps } from '../contract.ts'
import { OverlayShell } from '../shell/OverlayShell.tsx'
import { workspaceOfSession } from '../workspace.ts'
import { laneColor, layoutLanes, shortHash } from './lanes.ts'
import css from './GraphOverlay.module.css'

/** Full composed props of the graph overlay. */
export type GraphOverlayProps = WebEnhancedProps<'shell.overlay'>

/** Horizontal distance between lanes, in CSS pixels. */
const LANE_STEP = 16

/** Row height, in CSS pixels; must match `.row` in the stylesheet. */
const ROW_HEIGHT = 34

/** Number of lane colours the stylesheet defines. */
const PALETTE_SIZE = 6

/** Load state of the commit list. */
type Commits =
  | { readonly phase: 'loading' }
  | { readonly phase: 'ready'; readonly items: readonly GitCommitView[] }
  | { readonly phase: 'error'; readonly message: string }

/** The git graph overlay. */
export function GraphOverlay({
  useOverlay, useSessions, useWorkspaces, remote, closeOverlay, t,
}: GraphOverlayProps) {
  const open = useOverlay(state => state.open === 'graph')
  const sessions = useSessions(state => state)
  const workspaces = useWorkspaces(state => state)
  const workspaceId = workspaceOfSession(sessions, workspaces)?.workspaceId

  const [commits, setCommits] = useState<Commits>({ phase: 'loading' })
  const live = useRef(true)
  useEffect(() => () => { live.current = false }, [])

  const load = useCallback(async (): Promise<void> => {
    if (workspaceId === undefined) return
    setCommits({ phase: 'loading' })
    const result = await remote.gitLog({ workspaceId })
    if (!live.current) return
    setCommits('error' in result
      ? { phase: 'error', message: result.error.message }
      : { phase: 'ready', items: result.commits })
  }, [remote, workspaceId])

  useEffect(() => {
    if (open) void load()
  }, [load, open])

  if (!open) return null

  return (
    <OverlayShell
      title={t('graph.title')}
      closeLabel={t('graph.close')}
      onClose={closeOverlay}
      testId="graph-overlay"
      actions={workspaceId === undefined
        ? null
        : (
            <button type="button" className={css.action} onClick={() => { void load() }}>
              {t('graph.refresh')}
            </button>
          )}
    >
      {workspaceId === undefined
        ? <p className={css.empty}>{t('graph.noWorkspace')}</p>
        : commits.phase === 'loading'
          ? <p className={css.empty}>{t('graph.loading')}</p>
          : commits.phase === 'error'
            ? <p className={css.error}>{t('graph.error', { message: commits.message })}</p>
            : <GraphBody commits={commits.items} empty={t('graph.empty')} />}
    </OverlayShell>
  )
}

/** The laid-out commit list; the lane math itself lives in `./lanes.ts`. */
function GraphBody({ commits, empty }: { commits: readonly GitCommitView[]; empty: string }) {
  if (commits.length === 0) return <p className={css.empty}>{empty}</p>
  const layout = layoutLanes(commits)
  const railWidth = (layout.width + 1) * LANE_STEP
  return (
    <ol className={css.rows} data-testid="graph-rows">
      {layout.rows.map(row => (
        <li className={css.row} key={row.commit.hash}>
          <svg className={css.rail} width={railWidth} height={ROW_HEIGHT} aria-hidden>
            {/* Rails passing this row untouched. */}
            {row.through.map(lane => (
              <line
                key={`through-${String(lane)}`}
                className={css.edge}
                data-lane={laneColor(lane, PALETTE_SIZE)}
                x1={(lane + 1) * LANE_STEP}
                y1={0}
                x2={(lane + 1) * LANE_STEP}
                y2={ROW_HEIGHT}
              />
            ))}
            {/* Edges from this commit down to each parent's lane. */}
            {row.parentLanes.map(lane => (
              <line
                key={`parent-${String(lane)}`}
                className={css.edge}
                data-lane={laneColor(lane, PALETTE_SIZE)}
                x1={(row.lane + 1) * LANE_STEP}
                y1={ROW_HEIGHT / 2}
                x2={(lane + 1) * LANE_STEP}
                y2={ROW_HEIGHT}
              />
            ))}
            <circle
              className={css.dot}
              data-lane={laneColor(row.lane, PALETTE_SIZE)}
              cx={(row.lane + 1) * LANE_STEP}
              cy={ROW_HEIGHT / 2}
              r={4}
            />
          </svg>
          <span className={css.hash}>{shortHash(row.commit.hash)}</span>
          <span className={css.subject} title={row.commit.subject}>{row.commit.subject}</span>
          {row.commit.refs.map(ref => (
            <span className={css.ref} key={ref}>{ref}</span>
          ))}
          <span className={css.author}>{row.commit.author}</span>
          <time className={css.date} dateTime={new Date(row.commit.date * 1000).toISOString()}>
            {new Date(row.commit.date * 1000).toLocaleDateString()}
          </time>
        </li>
      ))}
    </ol>
  )
}
