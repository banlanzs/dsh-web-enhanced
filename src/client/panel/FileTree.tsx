/**
 * Workspace file tree sidebar: lazily expanded directories, whole-row click
 * to expand, and a file-name filter that switches the tree into a flat match
 * list. Clicking a file opens it in the explorer's preview side, which the
 * combined layout keeps visible beside the tree.
 *
 * Directory contents are fetched on first expansion and cached for the life
 * of the mount: a tree that re-listed on every render would hammer the host
 * on each keystroke of the filter.
 * @module dsh-web-enhanced/src/client/panel/FileTree
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type { FsEntryView, WebEnhancedProps } from '../contract.ts'
import { loadPreviewTab } from '../preview.ts'
import css from './FileTree.module.css'

/** Props of the file tree: the panel's composed props plus the resolved workspace. */
export type FileTreeProps = WebEnhancedProps<'conversation.view'> & {
  readonly workspaceId: string
  /** When present, the tree renders a collapse control beside its search box. */
  readonly onCollapse?: () => void
  readonly collapseLabel?: string
}

/** Debounce of the search query, in milliseconds. */
const SEARCH_DEBOUNCE_MS = 200

/** Cached listing of one directory. */
type Listing =
  | { readonly phase: 'loading' }
  | { readonly phase: 'ready'; readonly entries: readonly FsEntryView[] }
  | { readonly phase: 'error'; readonly message: string }

/** The file tree. */
export function FileTree({
  workspaceId, usePanel, remote, toggleExpanded, setQuery, openTab, t, onCollapse, collapseLabel,
}: FileTreeProps) {
  const expanded = usePanel(state => state.expanded[workspaceId] ?? [])
  const query = usePanel(state => state.query)

  const [listings, setListings] = useState<ReadonlyMap<string, Listing>>(new Map())
  const [matches, setMatches] = useState<readonly FsEntryView[] | null>(null)
  const live = useRef(true)
  useEffect(() => () => { live.current = false }, [])

  const list = useCallback(async (path: string): Promise<void> => {
    setListings(current => new Map(current).set(path, { phase: 'loading' }))
    const result = await remote.fsList({ workspaceId, path })
    if (!live.current) return
    setListings(current => new Map(current).set(
      path,
      'error' in result
        ? { phase: 'error', message: result.error.message }
        : { phase: 'ready', entries: result.entries },
    ))
  }, [remote, workspaceId])

  // The root listing is what the tree renders from; everything else is
  // fetched when its directory is first expanded.
  useEffect(() => {
    setListings(new Map())
    void list('')
  }, [list])

  // Search runs on the host (recursive, bounded); debounced so typing does not
  // queue one traversal per keystroke.
  useEffect(() => {
    const needle = query.trim()
    if (needle === '') {
      setMatches(null)
      return
    }
    const timer = setTimeout(() => {
      void (async () => {
        const result = await remote.fsSearch({ workspaceId, query: needle })
        if (!live.current) return
        setMatches('error' in result ? [] : result.entries)
      })()
    }, SEARCH_DEBOUNCE_MS)
    return () => { clearTimeout(timer) }
  }, [query, remote, workspaceId])

  const open = useCallback(async (path: string): Promise<void> => {
    const tab = await loadPreviewTab(remote, workspaceId, path)
    if (!live.current) return
    openTab(tab)
  }, [openTab, remote, workspaceId])

  const toggle = useCallback((path: string): void => {
    if (!expanded.includes(path) && listings.get(path) === undefined) void list(path)
    toggleExpanded(workspaceId, path)
  }, [expanded, list, listings, toggleExpanded, workspaceId])

  return (
    <div className={css.tree} data-testid="file-tree">
      <div className={css.searchRow}>
        <input
          className={css.search}
          value={query}
          placeholder={t('files.search')}
          aria-label={t('files.search')}
          data-testid="file-tree-search"
          onChange={event => { setQuery(event.target.value) }}
        />
        {onCollapse !== undefined && (
          <button
            type="button"
            className={css.collapse}
            aria-label={collapseLabel ?? ''}
            title={collapseLabel}
            data-testid="workspace-sidebar-collapse"
            onClick={onCollapse}
          >
            <span aria-hidden="true">‹</span>
          </button>
        )}
      </div>
      {matches !== null
        ? (
            <ul className={css.list} data-testid="file-tree-matches">
              {matches.length === 0
                ? <li className={css.empty}>{t('files.searchEmpty')}</li>
                : matches.map(entry => (
                    <li key={entry.path}>
                      <button
                        type="button"
                        className={css.row}
                        data-kind={entry.kind}
                        onClick={() => { if (entry.kind === 'file') void open(entry.path) }}
                      >
                        <span className={css.glyph} aria-hidden>{entry.kind === 'dir' ? '▸' : '·'}</span>
                        <span className={css.name}>{entry.name}</span>
                        <span className={css.path}>{entry.path}</span>
                      </button>
                    </li>
                  ))}
            </ul>
          )
        : (
            <Directory
              path=""
              depth={0}
              listings={listings}
              expanded={expanded}
              onToggle={toggle}
              onOpen={(path) => { void open(path) }}
              t={t}
            />
          )}
    </div>
  )
}

/** Props of one directory level. */
interface DirectoryProps {
  readonly path: string
  readonly depth: number
  readonly listings: ReadonlyMap<string, Listing>
  readonly expanded: readonly string[]
  readonly onToggle: (path: string) => void
  readonly onOpen: (path: string) => void
  readonly t: FileTreeProps['t']
}

/** One directory level, recursing into its expanded children. */
function Directory({ path, depth, listings, expanded, onToggle, onOpen, t }: DirectoryProps) {
  const listing = listings.get(path)
  if (listing === undefined || listing.phase === 'loading') {
    return <p className={css.empty}>{t('board.loading')}</p>
  }
  if (listing.phase === 'error') {
    return <p className={css.error}>{t('files.error', { message: listing.message })}</p>
  }
  if (listing.entries.length === 0) {
    return <p className={css.empty}>{t('files.empty')}</p>
  }
  return (
    <ul className={css.list}>
      {listing.entries.map((entry) => {
        const isOpen = entry.kind === 'dir' && expanded.includes(entry.path)
        return (
          <li key={entry.path}>
            {/* Whole-row click: the row IS the control, so a directory expands
                from anywhere on it rather than from a chevron hit area. */}
            <button
              type="button"
              className={css.row}
              style={{ paddingInlineStart: `${String(depth * 12 + 8)}px` }}
              data-kind={entry.kind}
              data-open={isOpen || undefined}
              data-testid={`file-tree-row-${entry.path}`}
              onClick={() => { entry.kind === 'dir' ? onToggle(entry.path) : onOpen(entry.path) }}
            >
              <span className={css.glyph} aria-hidden>{entry.kind === 'dir' ? (isOpen ? '▾' : '▸') : '·'}</span>
              <span className={css.name}>{entry.name}</span>
            </button>
            {isOpen && (
              <Directory
                path={entry.path}
                depth={depth + 1}
                listings={listings}
                expanded={expanded}
                onToggle={onToggle}
                onOpen={onOpen}
                t={t}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
