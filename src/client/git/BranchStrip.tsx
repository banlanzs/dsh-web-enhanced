/**
 * Branch switcher in the session header's action row (titleCluster): the
 * current branch, a switcher over the local branches, and the dirty-tree
 * confirmation. Rendered only for a session whose workspace is a git
 * repository — an unrelated project should not grow a dead control.
 * @module dsh-web-enhanced/src/client/git/BranchStrip
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { GitBranchView, GitBranchesResult, GitStatusEntry, WebEnhancedProps } from '../contract.ts'
import { workspaceOfSessionId } from '../workspace.ts'
import css from './BranchStrip.module.css'

/** Full composed props of the branch strip. */
export type BranchStripProps = WebEnhancedProps<'conversation.session.header.actions'>

/** Load state of the branch list. */
type Branches =
  | { readonly phase: 'loading' }
  | { readonly phase: 'ready'; readonly items: readonly GitBranchView[] }
  | { readonly phase: 'error' }

/** How much uncommitted work a checkout would carry along. */
export interface DirtySummary {
  readonly total: number
  /** Entries git tracks — these are the ones a conflicting checkout refuses over. */
  readonly tracked: number
  /** Untracked entries; they only block when the target branch has that path. */
  readonly untracked: number
}

/**
 * Summarize a porcelain status for the switch warning.
 *
 * Tracked and untracked are counted apart because they fail differently: git
 * refuses a checkout whose target changes a file the work tree modified, while
 * an untracked file only collides when the target branch happens to carry the
 * same path.
 * @param entries - porcelain v1 entries.
 * @returns the counts.
 */
export function dirtySummary(entries: readonly GitStatusEntry[]): DirtySummary {
  let untracked = 0
  for (const entry of entries) {
    if (entry.staged === '?' && entry.unstaged === '?') untracked += 1
  }
  return { total: entries.length, tracked: entries.length - untracked, untracked }
}

/** How long one workspace's branch listing serves later mounts (ms). */
const BRANCHES_TTL_MS = 5_000

/** Branch listings by workspace id: the settled-or-in-flight promise and its age. */
const branchesCache = new Map<string, { at: number; promise: Promise<GitBranchesResult> }>()

/**
 * Fetch one workspace's branches through the shared cache.
 *
 * Every session-header mount asks for the same listing, so a hit (settled or
 * in flight) saves a `git branch --list` subprocess. Error listings and
 * rejections are not cached: they are usually transient (or "not a
 * repository", which the strip renders as nothing) and the next mount
 * retries instead of inheriting them.
 * @param workspaceId - the workspace whose branches to list.
 * @param fetch - the remote call, invoked only on a miss.
 * @returns the branch listing result.
 */
export function cachedGitBranches(
  workspaceId: string,
  fetch: () => Promise<GitBranchesResult>,
): Promise<GitBranchesResult> {
  const hit = branchesCache.get(workspaceId)
  if (hit !== undefined && Date.now() - hit.at < BRANCHES_TTL_MS) return hit.promise
  const promise = fetch()
  branchesCache.set(workspaceId, { at: Date.now(), promise })
  void promise.then(
    result => {
      if ('error' in result) branchesCache.delete(workspaceId)
    },
    () => branchesCache.delete(workspaceId),
  )
  return promise
}

/**
 * Drop one workspace's cached branch listing.
 *
 * Called after a checkout this plugin performed: a cached listing still names
 * the branch that WAS current.
 * @param workspaceId - the workspace whose listing to drop.
 */
export function invalidateBranchesCache(workspaceId: string): void {
  branchesCache.delete(workspaceId)
}

/** The branch strip: current branch and the switcher. */
export function BranchStrip({
  sessionId, useWorkspaces, remote, t,
}: BranchStripProps) {
  const workspaces = useWorkspaces(state => state)
  const workspaceId = workspaceOfSessionId(sessionId, workspaces)?.workspaceId

  const [branches, setBranches] = useState<Branches>({ phase: 'loading' })
  const [switching, setSwitching] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState<{ branch: string; dirty: DirtySummary } | null>(null)
  const live = useRef(true)
  useEffect(() => () => { live.current = false }, [])

  const load = useCallback(async (): Promise<void> => {
    if (workspaceId === undefined) return
    const result = await cachedGitBranches(workspaceId, () => remote.gitBranches({ workspaceId }))
    if (!live.current) return
    setBranches('error' in result ? { phase: 'error' } : { phase: 'ready', items: result.branches })
  }, [remote, workspaceId])

  useEffect(() => {
    setBranches({ phase: 'loading' })
    void load()
  }, [load])

  const runSwitch = useCallback(async (branch: string): Promise<void> => {
    if (workspaceId === undefined) return
    setSwitching(true)
    setMessage(null)
    try {
      const result = await remote.gitCheckout({ workspaceId, branch })
      if (!live.current) return
      if ('error' in result) {
        setMessage(result.error.message)
        return
      }
      if (!result.ok) {
        setMessage(result.message ?? null)
        return
      }
      invalidateBranchesCache(workspaceId)
      await load()
    } finally {
      if (live.current) setSwitching(false)
    }
  }, [load, remote, workspaceId])

  /**
   * Ask before switching out of a dirty tree.
   *
   * Not a refusal: git carries non-conflicting changes across a checkout and
   * refuses the conflicting case on its own, so blocking here would forbid
   * something that ordinarily works. What is missing without this step is that
   * the user is never told the tree is dirty at all — a silent success that
   * moved edited files to another branch reads as data loss even though it is
   * not.
   */
  const requestSwitch = useCallback(async (branch: string): Promise<void> => {
    if (workspaceId === undefined) return
    setMessage(null)
    const status = await remote.gitStatus({ workspaceId })
    if (!live.current) return
    // An unreadable status is not a reason to block the switch: git would still
    // do the right thing, and the checkout itself reports its own failure.
    const dirty = 'error' in status ? { total: 0, tracked: 0, untracked: 0 } : dirtySummary(status.entries)
    if (dirty.total === 0) {
      await runSwitch(branch)
      return
    }
    setPending({ branch, dirty })
  }, [remote, runSwitch, workspaceId])

  // No workspace, no git root: the strip has nothing to address.
  if (workspaceId === undefined) return null
  // A non-repository answers an error result; the strip stays out of the way
  // rather than shouting about a project that simply is not versioned.
  if (branches.phase === 'error') return null
  if (branches.phase === 'loading') {
    return <div className={css.strip} data-testid="branch-strip-loading">{t('branch.loading')}</div>
  }
  if (branches.items.length === 0) return null

  const current = branches.items.find(branch => branch.current)?.name ?? ''
  return (
    <div className={css.strip} data-testid="branch-strip">
      <div className={css.line}>
        <span className={css.label}>{t('branch.label')}</span>
        <select
          className={css.select}
          value={current}
          disabled={switching || pending !== null}
          data-testid="branch-select"
          aria-label={t('branch.label')}
          onChange={(event) => { void requestSwitch(event.target.value) }}
        >
          {branches.items.map(branch => (
            <option key={branch.name} value={branch.name}>{branch.name}</option>
          ))}
        </select>
        {/* No graph entry here: the workspace tab owns that surface. */}
      </div>
      {pending !== null && (
        <div className={css.confirm} data-testid="branch-dirty-confirm">
          <span className={css.confirmText}>
            {t('branch.dirty', {
              count: String(pending.dirty.total),
              tracked: String(pending.dirty.tracked),
              untracked: String(pending.dirty.untracked),
              branch: pending.branch,
            })}
          </span>
          <button
            type="button"
            className={css.confirmAction}
            data-testid="branch-dirty-continue"
            onClick={() => {
              const target = pending.branch
              setPending(null)
              void runSwitch(target)
            }}
          >
            {t('branch.dirtyConfirm')}
          </button>
          <button type="button" className={css.confirmAction} onClick={() => { setPending(null) }}>
            {t('branch.dirtyCancel')}
          </button>
        </div>
      )}
      {message !== null && (
        <div className={css.message} data-testid="branch-message">
          <span className={css.messageTitle}>{t('branch.failed')}</span>
          {/* git's rejection is multi-line and says exactly which files are in
              the way, so it is shown whole rather than squeezed into one line. */}
          <pre className={css.messageBody}>{message}</pre>
        </div>
      )}
    </div>
  )
}
