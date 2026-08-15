/**
 * Host-wide file browser behind the composer's mention pickers.
 *
 * The in-project picker is a flat search over the workspace; this is the other
 * half of the same gesture — walking anywhere on the host to name a path that
 * lives outside the project. It lists directories through the plugin's own
 * `fsBrowse` remote (names, kinds, sizes; never content), so the browser works
 * on a Web deployment with no operating-system dialog available. Where the
 * host DOES serve its native directory chooser, folder mode offers it too.
 * @module dsh-web-enhanced/src/client/browse/BrowseOverlay
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { FsBrowseView, WebEnhancedProps } from '../contract.ts'
import { OverlayShell } from '../shell/OverlayShell.tsx'
import { mentionOf } from '../mention.ts'
import css from './BrowseOverlay.module.css'

/** Full composed props of the browse overlay. */
export type BrowseOverlayProps = WebEnhancedProps<'shell.overlay'>

/** Load state of one directory level. */
type Level =
  | { readonly phase: 'loading' }
  | { readonly phase: 'ready'; readonly value: FsBrowseView }
  | { readonly phase: 'error'; readonly message: string }

/** Split an absolute path into its navigable ancestors, deepest last. */
export function crumbsOf(path: string): { readonly name: string; readonly path: string }[] {
  const separator = path.includes('\\') && !path.startsWith('/') ? '\\' : '/'
  const parts = path.split(/[\\/]/u)
  const crumbs: { name: string; path: string }[] = []
  let prefix = ''
  for (const [index, part] of parts.entries()) {
    if (part === '' && index > 0) continue
    if (index === 0) {
      // A POSIX root shows as `/`. A bare drive letter must keep its trailing
      // separator: `C:` alone names the CURRENT directory on that drive, not
      // its root, so navigating to the crumb would land somewhere else.
      prefix = part === '' ? separator : /^[A-Za-z]:$/u.test(part) ? `${part}${separator}` : part
      crumbs.push({ name: part === '' ? separator : part, path: prefix })
      continue
    }
    prefix = `${prefix}${prefix.endsWith(separator) ? '' : separator}${part}`
    crumbs.push({ name: part, path: prefix })
  }
  return crumbs
}

/** The host-wide file browser. */
export function BrowseOverlay({ useBrowse, remote, closeBrowse, appendMention, t }: BrowseOverlayProps) {
  const open = useBrowse(state => state.open)
  const kind = useBrowse(state => state.kind)
  const sessionId = useBrowse(state => state.sessionId)

  const [path, setPath] = useState<string | undefined>(undefined)
  const [level, setLevel] = useState<Level>({ phase: 'loading' })
  const [query, setQuery] = useState('')
  const live = useRef(true)
  useEffect(() => () => { live.current = false }, [])

  const load = useCallback(async (target: string | undefined): Promise<void> => {
    setLevel({ phase: 'loading' })
    const result = await remote.fsBrowse(target === undefined ? {} : { path: target })
    if (!live.current) return
    if ('error' in result) {
      setLevel({ phase: 'error', message: result.error.message })
      return
    }
    setLevel({ phase: 'ready', value: result })
  }, [remote])

  // Each opening starts at the host home again: the browser is a one-shot
  // gesture, and resuming somewhere the user has forgotten is worse than a
  // known starting point.
  useEffect(() => {
    if (!open) return
    setPath(undefined)
    setQuery('')
  }, [open])

  useEffect(() => {
    if (open) void load(path)
  }, [load, open, path])

  const choose = useCallback((chosen: string) => {
    appendMention(sessionId, mentionOf(chosen))
    closeBrowse()
  }, [appendMention, closeBrowse, sessionId])

  if (!open) return null

  const current = level.phase === 'ready' ? level.value : undefined
  const needle = query.trim().toLowerCase()
  const entries = (current?.entries ?? []).filter(entry =>
    needle === '' || entry.name.toLowerCase().includes(needle))

  return (
    <OverlayShell
      title={t(kind === 'file' ? 'browse.titleFile' : 'browse.titleFolder')}
      closeLabel={t('browse.close')}
      onClose={closeBrowse}
      testId="browse-overlay"
      actions={
        <>
          <input
            className={css.filter}
            type="search"
            value={query}
            placeholder={t('browse.filter')}
            data-testid="browse-filter"
            onChange={event => { setQuery(event.target.value) }}
          />
          {current !== undefined && (
            <button type="button" className={css.action} onClick={() => { setPath(current.home) }}>
              {t('browse.home')}
            </button>
          )}
          {kind === 'dir' && current !== undefined && (
            <button
              type="button"
              className={css.primary}
              data-testid="browse-choose-current"
              onClick={() => { choose(current.path) }}
            >
              {t('browse.useCurrent')}
            </button>
          )}
        </>
      }
    >
      {current !== undefined && (
        <nav className={css.crumbs} aria-label={t('browse.crumbs')}>
          {crumbsOf(current.path).map(crumb => (
            <button
              type="button"
              className={css.crumb}
              key={crumb.path}
              onClick={() => { setPath(crumb.path) }}
            >
              {crumb.name}
            </button>
          ))}
        </nav>
      )}

      {level.phase === 'loading' && <p className={css.empty}>{t('browse.loading')}</p>}
      {level.phase === 'error' && <p className={css.error}>{t('browse.error', { message: level.message })}</p>}
      {current !== undefined && (
        <ul className={css.rows} data-testid="browse-rows">
          {current.parent !== null && (
            <li>
              <button
                type="button"
                className={css.row}
                data-testid="browse-up"
                onClick={() => { setPath(current.parent as string) }}
              >
                <span className={css.icon} aria-hidden>↰</span>
                <span className={css.name}>{t('browse.parent')}</span>
              </button>
            </li>
          )}
          {entries.map(entry => (
            <li key={entry.path}>
              <button
                type="button"
                className={css.row}
                data-kind={entry.kind}
                // A directory always navigates on click; folder mode picks it
                // through the explicit "use this folder" button instead, so
                // the same gesture never means two things.
                onClick={() => {
                  if (entry.kind === 'dir') setPath(entry.path)
                  else if (kind === 'file') choose(entry.path)
                }}
                disabled={entry.kind === 'file' && kind === 'dir'}
              >
                <span className={css.icon} aria-hidden>{entry.kind === 'dir' ? '▸' : '·'}</span>
                <span className={css.name}>{entry.name}</span>
              </button>
            </li>
          ))}
          {entries.length === 0 && <li className={css.empty}>{t('browse.empty')}</li>}
        </ul>
      )}
      {current?.truncated === true && <p className={css.notice}>{t('browse.truncated')}</p>}
    </OverlayShell>
  )
}
