/**
 * Branch strip above the composer: the current branch, a switcher over the
 * local branches, and the entry to the commit graph. Rendered only for a
 * session whose workspace is a git repository — an unrelated project should
 * not grow a dead control.
 * @module dsh-web-enhanced/src/client/git/BranchStrip
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { GitBranchView, GitStatusEntry, WebEnhancedProps } from '../contract.ts'
import { workspaceOfSession } from '../workspace.ts'
import css from './BranchStrip.module.css'

/** Full composed props of the branch strip. */
export type BranchStripProps = WebEnhancedProps<'conversation.input.dock'>

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

/** The branch strip: current branch and the switcher. */
export function BranchStrip({
  useSessions, useWorkspaces, remote, t,
}: BranchStripProps) {
  const sessions = useSessions(state => state)
  const workspaces = useWorkspaces(state => state)
  const workspace = workspaceOfSession(sessions, workspaces)
  const workspaceId = workspace?.workspaceId

  const [branches, setBranches] = useState<Branches>({ phase: 'loading' })
  const [switching, setSwitching] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState<{ branch: string; dirty: DirtySummary } | null>(null)
  const live = useRef(true)
  useEffect(() => () => { live.current = false }, [])

  const load = useCallback(async (): Promise<void> => {
    if (workspaceId === undefined) return
    const result = await remote.gitBranches({ workspaceId })
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
        {/* No graph entry here: the sidebar already owns that action, and a
            second entry above the composer duplicated it. */}
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
