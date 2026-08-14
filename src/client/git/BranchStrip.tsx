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
import type { GitBranchView, WebEnhancedProps } from '../contract.ts'
import { workspaceOfSession } from '../workspace.ts'
import css from './BranchStrip.module.css'

/** Full composed props of the branch strip. */
export type BranchStripProps = WebEnhancedProps<'conversation.input.dock'>

/** Load state of the branch list. */
type Branches =
  | { readonly phase: 'loading' }
  | { readonly phase: 'ready'; readonly items: readonly GitBranchView[] }
  | { readonly phase: 'error' }

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

  const switchTo = useCallback(async (branch: string): Promise<void> => {
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
      <span className={css.label}>{t('branch.label')}</span>
      <select
        className={css.select}
        value={current}
        disabled={switching}
        data-testid="branch-select"
        aria-label={t('branch.label')}
        onChange={(event) => { void switchTo(event.target.value) }}
      >
        {branches.items.map(branch => (
          <option key={branch.name} value={branch.name}>{branch.name}</option>
        ))}
      </select>
      {/* No graph entry here: the sidebar already owns that action, and a
          second entry above the composer duplicated it. */}
      {message !== null && <span className={css.message} data-testid="branch-message">{message}</span>}
    </div>
  )
}
