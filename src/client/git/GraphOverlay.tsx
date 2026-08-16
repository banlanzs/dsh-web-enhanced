/**
 * Git graph: branch lanes and commit history for one workspace. Two surfaces
 * share the same panel — the full-frame overlay and the workspace view's「Git
 * 图谱」tab — so the data/logic lives in {@link GraphPanel} and the wrappers
 * own only their chrome.
 *
 * The branch selector here is the GRAPH's own filter: it decides which
 * history the lanes are drawn from and changes nothing in the repository.
 * The composer's branch strip is the other operation — it checks a branch
 * out. Two controls because they are two different questions.
 * @module dsh-web-enhanced/src/client/git/GraphOverlay
 */

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {
  GitBranchView, GitCommitDetailView, GitCommitView, GitWorkingFileView, GitWorkingView,
  PanelTab, PreviewTab, WebEnhancedProps, WebEnhancedRemote,
} from '../contract.ts'
import { baseNameOf } from '../preview.ts'
import { OverlayShell } from '../shell/OverlayShell.tsx'
import { workspaceOfSession } from '../workspace.ts'
import { laneColor, layoutLanes, placeWorking, shortHash } from './lanes.ts'
import css from './GraphOverlay.module.css'

/** Full composed props of the graph overlay. */
export type GraphOverlayProps = WebEnhancedProps<'shell.overlay'>

/** Horizontal distance between lanes, in CSS pixels. */
const LANE_STEP = 16

/** Row height, in CSS pixels; must match `.row` in the stylesheet. */
const ROW_HEIGHT = 34

/** Number of lane colours the stylesheet defines. */
const PALETTE_SIZE = 6

/** The filter value meaning "every ref", distinct from any branch name. */
const ALL_BRANCHES = ''

/** Load state of the commit list. */
type Commits =
  | { readonly phase: 'loading' }
  | { readonly phase: 'ready'; readonly items: readonly GitCommitView[] }
  | { readonly phase: 'error'; readonly message: string }

/** Load state of one expanded commit's detail. */
type Detail =
  | { readonly phase: 'loading' }
  | { readonly phase: 'ready'; readonly value: GitCommitDetailView }
  | { readonly phase: 'error'; readonly message: string }

/** What the chrome-free panel needs from its host surface. */
export interface GraphPanelProps {
  /** Workspace whose repository is drawn; undefined renders the empty state. */
  readonly workspaceId: string | undefined
  readonly remote: WebEnhancedRemote
  readonly t: WebEnhancedProps<'shell.overlay'>['t']
  /** Open one diff as an explorer preview tab. */
  readonly openTab: (tab: PreviewTab) => void
  /** Switch to the explorer so the opened diff is visible. */
  readonly selectTab: (tab: PanelTab) => void
}

/** The chrome-free graph: filter, refresh, and the laid-out commit list. */
export function GraphPanel({ workspaceId, remote, t, openTab, selectTab }: GraphPanelProps) {
  const [commits, setCommits] = useState<Commits>({ phase: 'loading' })
  const [working, setWorking] = useState<GitWorkingView | null>(null)
  const [workingOpen, setWorkingOpen] = useState(false)
  const [branches, setBranches] = useState<readonly GitBranchView[]>([])
  const [branch, setBranch] = useState<string>(ALL_BRANCHES)
  const [expanded, setExpanded] = useState<string | null>(null)
  const live = useRef(true)
  useEffect(() => () => { live.current = false }, [])

  const load = useCallback(async (): Promise<void> => {
    if (workspaceId === undefined) return
    setCommits({ phase: 'loading' })
    const [log, uncommitted] = await Promise.all([
      remote.gitLog({ workspaceId, ...branch === ALL_BRANCHES ? {} : { branch } }),
      // The work tree is the same whichever branch the graph filters to, but it
      // is re-read with the commits so one Refresh answers both questions.
      remote.gitWorking({ workspaceId }),
    ])
    if (!live.current) return
    setCommits('error' in log
      ? { phase: 'error', message: log.error.message }
      : { phase: 'ready', items: log.commits })
    setWorking('error' in uncommitted ? null : uncommitted.working)
  }, [branch, remote, workspaceId])

  // The panel is mounted only while visible, so mount = open.
  useEffect(() => {
    if (workspaceId === undefined) return
    // The filter list is repository state, not view state: it is loaded with
    // the panel and left alone while the user switches filters.
    void (async () => {
      const result = await remote.gitBranches({ workspaceId })
      if (live.current && !('error' in result)) setBranches(result.branches)
    })()
  }, [remote, workspaceId])

  useEffect(() => {
    if (workspaceId !== undefined) void load()
  }, [load, workspaceId])

  // A filter change re-cuts the list, so an open detail no longer has a row.
  useEffect(() => { setExpanded(null) }, [branch])

  return (
    <div className={css.panel} data-testid="graph-panel">
      {workspaceId === undefined
        ? <p className={css.empty}>{t('graph.noWorkspace')}</p>
        : (
            <>
              <div className={css.toolbar}>
                <label className={css.filter}>
                  <span className={css.filterLabel}>{t('graph.filter')}</span>
                  <select
                    className={css.select}
                    value={branch}
                    data-testid="graph-branch-filter"
                    onChange={event => { setBranch(event.target.value) }}
                  >
                    <option value={ALL_BRANCHES}>{t('graph.allBranches')}</option>
                    {branches.map(item => (
                      <option key={item.name} value={item.name}>{item.name}</option>
                    ))}
                  </select>
                </label>
                <button type="button" className={css.action} onClick={() => { void load() }}>
                  {t('graph.refresh')}
                </button>
              </div>
              {commits.phase === 'loading'
                ? <p className={css.empty}>{t('graph.loading')}</p>
                : commits.phase === 'error'
                  ? <p className={css.error}>{t('graph.error', { message: commits.message })}</p>
                  : (
                      <GraphBody
                        commits={commits.items}
                        working={working}
                        empty={t('graph.empty')}
                        expanded={expanded}
                        workingOpen={workingOpen}
                        workspaceId={workspaceId}
                        remote={remote}
                        openTab={openTab}
                        selectTab={selectTab}
                        onToggle={hash => { setExpanded(current => (current === hash ? null : hash)) }}
                        onToggleWorking={() => { setWorkingOpen(value => !value) }}
                        t={t}
                      />
                    )}
            </>
          )}
    </div>
  )
}

/** The git graph overlay: the same panel under the full-frame chrome. */
export function GraphOverlay({
  useOverlay, useSessions, useWorkspaces, remote, closeOverlay, t, openTab, selectTab,
}: GraphOverlayProps) {
  const open = useOverlay(state => state.open === 'graph')
  const sessions = useSessions(state => state)
  const workspaces = useWorkspaces(state => state)
  const workspaceId = workspaceOfSession(sessions, workspaces)?.workspaceId
  if (!open) return null
  return (
    <OverlayShell title={t('graph.title')} closeLabel={t('graph.close')} onClose={closeOverlay} testId="graph-overlay" fill>
      <GraphPanel workspaceId={workspaceId === undefined ? undefined : String(workspaceId)} remote={remote} t={t} openTab={openTab} selectTab={selectTab} />
    </OverlayShell>
  )
}

/** Props the laid-out list needs beyond the commits themselves. */
interface GraphBodyProps {
  readonly commits: readonly GitCommitView[]
  /** Uncommitted state, or null when it could not be read. */
  readonly working: GitWorkingView | null
  readonly empty: string
  readonly expanded: string | null
  readonly workingOpen: boolean
  readonly workspaceId: string
  readonly remote: WebEnhancedRemote
  readonly openTab: (tab: PreviewTab) => void
  readonly selectTab: (tab: PanelTab) => void
  readonly onToggle: (hash: string) => void
  readonly onToggleWorking: () => void
  readonly t: GraphPanelProps['t']
}

/** Whether a working view has anything to show. */
function hasChanges(working: GitWorkingView | null): working is GitWorkingView {
  return working !== null && working.staged + working.unstaged + working.untracked > 0
}

/** The laid-out commit list; the lane math itself lives in `./lanes.ts`. */
function GraphBody({
  commits, working, empty, expanded, workingOpen, workspaceId, remote, openTab, selectTab,
  onToggle, onToggleWorking, t,
}: GraphBodyProps) {
  // Lane layout is O(commits x lanes); memoized so expanding a commit or
  // toggling the working row re-renders rows without re-laying the graph.
  const layout = useMemo(() => layoutLanes(commits), [commits])
  const railWidth = (layout.width + 1) * LANE_STEP
  const dirty = hasChanges(working)
  const placement = useMemo(() => (dirty ? placeWorking(layout.rows, working.head) : null), [dirty, layout, working])
  const workingRow = dirty
    ? (
        <WorkingRow
          working={working}
          lane={placement?.lane ?? 0}
          through={placement?.through ?? []}
          railWidth={railWidth}
          open={workingOpen}
          onToggle={onToggleWorking}
          workspaceId={workspaceId}
          remote={remote}
          openTab={openTab}
          selectTab={selectTab}
          t={t}
        />
      )
    : null

  // A repository with no commits yet still has a work tree, and that is
  // precisely when the uncommitted row is the only thing there is to draw.
  if (commits.length === 0) {
    return workingRow === null
      ? <p className={css.empty}>{empty}</p>
      : <ol className={css.rows} data-testid="graph-rows">{workingRow}</ol>
  }

  return (
    <ol className={css.rows} data-testid="graph-rows">
      {layout.rows.map((row, index) => (
        <Fragment key={row.commit.hash}>
          {placement?.index === index && workingRow}
          <li className={css.entry}>
            <button
              type="button"
              className={css.row}
              aria-expanded={expanded === row.commit.hash}
              data-testid="graph-row"
              onClick={() => { onToggle(row.commit.hash) }}
            >
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
            </button>
            {expanded === row.commit.hash && (
              <CommitDetail
                hash={row.commit.hash}
                workspaceId={workspaceId}
                remote={remote}
                openTab={openTab}
                selectTab={selectTab}
                t={t}
              />
            )}
          </li>
        </Fragment>
      ))}
    </ol>
  )
}

/** Props of the uncommitted-changes row. */
interface WorkingRowProps {
  readonly working: GitWorkingView
  readonly lane: number
  readonly through: readonly number[]
  readonly railWidth: number
  readonly open: boolean
  readonly onToggle: () => void
  readonly workspaceId: string
  readonly remote: WebEnhancedRemote
  readonly openTab: (tab: PreviewTab) => void
  readonly selectTab: (tab: PanelTab) => void
  readonly t: GraphPanelProps['t']
}

/**
 * The uncommitted-changes row: a hollow dot on HEAD's lane, joined to HEAD by
 * a dashed stub. Dashed and hollow because it is not a commit — nothing in the
 * repository records it, and it disappears the moment it is committed.
 */
function WorkingRow({
  working, lane, through, railWidth, open, onToggle, workspaceId, remote, openTab, selectTab, t,
}: WorkingRowProps) {
  const dotX = (lane + 1) * LANE_STEP
  return (
    <li className={css.entry}>
      <button
        type="button"
        className={css.row}
        aria-expanded={open}
        data-testid="graph-working-row"
        onClick={onToggle}
      >
        <svg className={css.rail} width={railWidth} height={ROW_HEIGHT} aria-hidden>
          {through.map(other => (
            <line
              key={`through-${String(other)}`}
              className={css.edge}
              data-lane={laneColor(other, PALETTE_SIZE)}
              x1={(other + 1) * LANE_STEP}
              y1={0}
              x2={(other + 1) * LANE_STEP}
              y2={ROW_HEIGHT}
            />
          ))}
          <line
            className={css.pendingEdge}
            data-lane={laneColor(lane, PALETTE_SIZE)}
            x1={dotX}
            y1={ROW_HEIGHT / 2}
            x2={dotX}
            y2={ROW_HEIGHT}
          />
          <circle
            className={css.pendingDot}
            data-lane={laneColor(lane, PALETTE_SIZE)}
            cx={dotX}
            cy={ROW_HEIGHT / 2}
            r={4}
          />
        </svg>
        <span className={css.hash}>••••••</span>
        <span className={css.subject}>{t('graph.working.title')}</span>
        <span className={css.workingCounts}>
          {t('graph.working.counts', {
            staged: String(working.staged),
            unstaged: String(working.unstaged),
            untracked: String(working.untracked),
          })}
        </span>
      </button>
      {open && (
        <WorkingDetail
          working={working}
          workspaceId={workspaceId}
          remote={remote}
          openTab={openTab}
          selectTab={selectTab}
          t={t}
        />
      )}
    </li>
  )
}

/** Open a working-tree diff as an explorer preview tab. */
async function openWorkingDiff(
  workspaceId: string,
  file: GitWorkingFileView,
  remote: WebEnhancedRemote,
  openTab: (tab: PreviewTab) => void,
  selectTab: (tab: PanelTab) => void,
): Promise<void> {
  const result = await remote.gitDiff({ workspaceId, path: file.path, staged: file.state === 'staged' })
  const text = 'error' in result ? '' : result.text
  const error = 'error' in result ? result.error.message : undefined
  openTab({
    path: `${file.path}.diff`,
    name: `${baseNameOf(file.path)} (diff)`,
    kind: 'diff',
    mode: 'view',
    content: text,
    truncated: false,
    size: text.length,
    ...(error === undefined ? {} : { error }),
  })
  selectTab('explorer')
}

/** The expanded file list of the uncommitted row. */
function WorkingDetail({
  working, workspaceId, remote, openTab, selectTab, t,
}: {
  readonly working: GitWorkingView
  readonly workspaceId: string
  readonly remote: WebEnhancedRemote
  readonly openTab: (tab: PreviewTab) => void
  readonly selectTab: (tab: PanelTab) => void
  readonly t: GraphPanelProps['t']
}) {
  return (
    <div className={css.detail} data-testid="graph-working-detail">
      {working.truncated && (
        <p className={css.filesTitle}>
          {t('graph.working.truncated', { count: String(working.files.length) })}
        </p>
      )}
      <ul className={css.files}>
        {working.files.map(file => (
          <li className={css.file} key={`${file.state}:${file.path}`}>
            <button
              type="button"
              className={css.fileButton}
              title={`${file.path} — ${t('graph.diffHint')}`}
              onClick={() => { void openWorkingDiff(workspaceId, file, remote, openTab, selectTab) }}
            >
              <span className={css.stateTag} data-state={file.state}>{stateLabel(file, t)}</span>
              <span className={css.filePath}>{file.path}</span>
              <span className={css.added} title={file.added === null ? t('graph.working.unknown') : undefined}>
                {file.added === null ? '—' : `+${String(file.added)}`}
              </span>
              <span className={css.removed}>{file.removed === null ? '—' : `-${String(file.removed)}`}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Short tag naming which diff a working file came out of. */
function stateLabel(file: GitWorkingFileView, t: GraphPanelProps['t']): string {
  if (file.state === 'staged') return t('graph.working.staged')
  return file.state === 'unstaged' ? t('graph.working.unstaged') : t('graph.working.untracked')
}

/** One expanded commit: identity, message body, and the files it touched. */
function CommitDetail({ hash, workspaceId, remote, openTab, selectTab, t }: {
  readonly hash: string
  readonly workspaceId: string
  readonly remote: WebEnhancedRemote
  readonly openTab: (tab: PreviewTab) => void
  readonly selectTab: (tab: PanelTab) => void
  readonly t: GraphPanelProps['t']
}) {
  const [detail, setDetail] = useState<Detail>({ phase: 'loading' })
  const live = useRef(true)
  useEffect(() => () => { live.current = false }, [])

  useEffect(() => {
    setDetail({ phase: 'loading' })
    void (async () => {
      const result = await remote.gitCommit({ workspaceId, hash })
      if (!live.current) return
      setDetail('error' in result
        ? { phase: 'error', message: result.error.message }
        : { phase: 'ready', value: result.commit })
    })()
  }, [hash, remote, workspaceId])

  if (detail.phase === 'loading') return <p className={css.empty}>{t('graph.loading')}</p>
  if (detail.phase === 'error') return <p className={css.error}>{t('graph.error', { message: detail.message })}</p>
  const commit = detail.value
  return (
    <div className={css.detail} data-testid="graph-detail">
      <dl className={css.facts}>
        <dt>{t('graph.detail.hash')}</dt>
        <dd className={css.mono}>{commit.hash}</dd>
        <dt>{t('graph.detail.parents')}</dt>
        <dd className={css.mono}>
          {commit.parents.length === 0 ? '—' : commit.parents.map(shortHash).join(' ')}
        </dd>
        <dt>{t('graph.detail.author')}</dt>
        <dd>{commit.email === '' ? commit.author : `${commit.author} <${commit.email}>`}</dd>
        <dt>{t('graph.detail.date')}</dt>
        <dd>{new Date(commit.date * 1000).toLocaleString()}</dd>
      </dl>
      {commit.body !== '' && <pre className={css.body}>{commit.body}</pre>}
      <p className={css.filesTitle}>{t('graph.detail.files', { count: String(commit.files.length) })}</p>
      {commit.files.length > 0 && (
        <ul className={css.files}>
          {commit.files.map(file => (
            <li className={css.file} key={file.path}>
              <button
                type="button"
                className={css.fileButton}
                title={`${file.path} — ${t('graph.diffHint')}`}
                onClick={() => {
                  void (async () => {
                    const result = await remote.gitCommitDiff({ workspaceId, hash, path: file.path })
                    const text = 'error' in result ? '' : result.text
                    const error = 'error' in result ? result.error.message : undefined
                    openTab({
                      path: `${hash.slice(0, 8)}-${file.path}.diff`,
                      name: `${baseNameOf(file.path)} (diff)`,
                      kind: 'diff',
                      mode: 'view',
                      content: text,
                      truncated: false,
                      size: text.length,
                      ...(error === undefined ? {} : { error }),
                    })
                    selectTab('explorer')
                  })()
                }}
              >
                <span className={css.filePath}>{file.path}</span>
                {/* A binary file has no line counts; git says `-` and so does this. */}
                <span className={css.added}>{file.added === null ? '—' : `+${String(file.added)}`}</span>
                <span className={css.removed}>{file.removed === null ? '—' : `-${String(file.removed)}`}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
