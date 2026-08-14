/**
 * SCM pane: the real git working-tree status, split into staged and unstaged
 * groups, with stage / unstage / discard per entry and a diff preview on
 * click. Discarding is irreversible, so it asks first.
 * @module dsh-web-enhanced/src/client/panel/ScmPane
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type { GitStatusEntry, WebEnhancedProps } from '../contract.ts'
import { baseNameOf } from '../preview.ts'
import { errorMessageOf } from '../result.ts'
import css from './ScmPane.module.css'

/** Props of the SCM pane. */
export type ScmPaneProps = WebEnhancedProps<'conversation.view'> & { readonly workspaceId: string }

/** Load state of the status list. */
type Status =
  | { readonly phase: 'loading' }
  | { readonly phase: 'ready'; readonly entries: readonly GitStatusEntry[] }
  | { readonly phase: 'error'; readonly message: string }

/** Whether an entry has staged content (its index column is meaningful). */
function isStaged(entry: GitStatusEntry): boolean {
  return entry.staged !== ' ' && entry.staged !== '?'
}

/** Whether an entry has unstaged worktree content. */
function isUnstaged(entry: GitStatusEntry): boolean {
  return entry.unstaged !== ' ' || entry.staged === '?'
}

/** The SCM pane. */
export function ScmPane({ workspaceId, remote, openTab, selectTab, t }: ScmPaneProps) {
  const [status, setStatus] = useState<Status>({ phase: 'loading' })
  const live = useRef(true)
  useEffect(() => () => { live.current = false }, [])

  const reload = useCallback(async (): Promise<void> => {
    const result = await remote.gitStatus({ workspaceId })
    if (!live.current) return
    setStatus('error' in result
      ? { phase: 'error', message: result.error.message }
      : { phase: 'ready', entries: result.entries })
  }, [remote, workspaceId])

  useEffect(() => {
    setStatus({ phase: 'loading' })
    void reload()
  }, [reload])

  const mutate = useCallback(async (call: Promise<unknown>): Promise<void> => {
    const result = await call
    if (!live.current) return
    const message = errorMessageOf(result)
    if (message !== undefined) {
      setStatus({ phase: 'error', message })
      return
    }
    await reload()
  }, [reload])

  /** Open one entry's diff as a preview tab. */
  const showDiff = useCallback(async (entry: GitStatusEntry, staged: boolean): Promise<void> => {
    const result = await remote.gitDiff({ workspaceId, path: entry.path, staged })
    if (!live.current) return
    const text = 'error' in result ? '' : result.text
    const error = 'error' in result ? result.error.message : undefined
    openTab({
      path: `${entry.path}.diff`,
      name: `${baseNameOf(entry.path)} (diff)`,
      kind: 'diff',
      mode: 'view',
      content: text,
      truncated: false,
      size: text.length,
      ...(error === undefined ? {} : { error }),
    })
    selectTab('preview')
  }, [openTab, remote, selectTab, workspaceId])

  if (status.phase === 'loading') return <p className={css.empty}>{t('board.loading')}</p>
  if (status.phase === 'error') return <p className={css.error}>{t('scm.error', { message: status.message })}</p>

  const staged = status.entries.filter(isStaged)
  const unstaged = status.entries.filter(isUnstaged)
  if (staged.length === 0 && unstaged.length === 0) {
    return <p className={css.empty} data-testid="scm-clean">{t('scm.empty')}</p>
  }

  const row = (entry: GitStatusEntry, group: 'staged' | 'unstaged') => (
    <li className={css.row} key={`${group}-${entry.path}`} data-testid={`scm-row-${entry.path}`}>
      <button
        type="button"
        className={css.name}
        title={entry.path}
        onClick={() => { void showDiff(entry, group === 'staged') }}
      >
        <span className={css.code} data-code={group === 'staged' ? entry.staged : entry.unstaged}>
          {group === 'staged' ? entry.staged : entry.unstaged}
        </span>
        <span className={css.label}>
          {entry.origPath === undefined
            ? entry.path
            : t('scm.renamed', { from: entry.origPath, to: entry.path })}
        </span>
      </button>
      {group === 'staged'
        ? (
            <button
              type="button"
              className={css.action}
              data-testid={`scm-unstage-${entry.path}`}
              onClick={() => { void mutate(remote.gitUnstage({ workspaceId, paths: [entry.path] })) }}
            >
              {t('scm.unstage')}
            </button>
          )
        : (
            <>
              <button
                type="button"
                className={css.action}
                data-testid={`scm-stage-${entry.path}`}
                onClick={() => { void mutate(remote.gitStage({ workspaceId, paths: [entry.path] })) }}
              >
                {t('scm.stage')}
              </button>
              <button
                type="button"
                className={css.danger}
                data-testid={`scm-discard-${entry.path}`}
                onClick={() => { void mutate(remote.gitDiscard({ workspaceId, paths: [entry.path] })) }}
              >
                {t('scm.discard')}
              </button>
            </>
          )}
    </li>
  )

  return (
    <div className={css.pane} data-testid="scm-pane">
      <div className={css.toolbar}>
        <button type="button" className={css.action} data-testid="scm-refresh" onClick={() => { void reload() }}>
          {t('scm.refresh')}
        </button>
      </div>
      {staged.length > 0 && (
        <section className={css.group}>
          <h4 className={css.groupTitle}>{t('scm.staged')}<span className={css.count}>{staged.length}</span></h4>
          <ul className={css.list}>{staged.map(entry => row(entry, 'staged'))}</ul>
        </section>
      )}
      {unstaged.length > 0 && (
        <section className={css.group}>
          <h4 className={css.groupTitle}>{t('scm.changes')}<span className={css.count}>{unstaged.length}</span></h4>
          <ul className={css.list}>{unstaged.map(entry => row(entry, 'unstaged'))}</ul>
        </section>
      )}
    </div>
  )
}
