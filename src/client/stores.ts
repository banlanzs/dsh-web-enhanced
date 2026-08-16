/**
 * Shared client state of dsh-web-enhanced.
 *
 * These are plain observables (`getSnapshot`/`subscribe`), not slot stores.
 * A slot store handle is pinned to the scope of the slot it first mounts
 * under, and this plugin's surfaces span scopes: the sidebar entries and the
 * overlays are `root`, the branch strip and the balance line are `session`.
 * One shared handle across both would throw at registration ("one handle, one
 * scope"), so the state lives in `apply` and reaches components through each
 * registration's inject face, whose `hooks` compartment turns an observable
 * into a `use<Name>` selector hook.
 *
 * Geometry that must outlive a reload persists to localStorage, keyed per
 * workspace so "collapsed and 420px wide" is remembered per project.
 * @module dsh-web-enhanced/src/client/stores
 */

import type { PanelTab, PreviewMode, PreviewTab } from './contract.ts'

/** Read side of one shared state cell (the HostObservable currency). */
export interface Observable<T> {
  /** Current value; the reference is stable until a write replaces it. */
  getSnapshot(): T
  /**
   * Subscribe to writes.
   * @param fn - change callback.
   * @returns unsubscribe.
   */
  subscribe(fn: () => void): () => void
}

/** Read/write face of one shared state cell. */
export interface Cell<T> extends Observable<T> {
  /**
   * Replace the value and notify subscribers. A writer returning the current
   * reference unchanged notifies nobody, so no-op gestures never re-render.
   * @param next - producer receiving the current value.
   */
  update(next: (current: T) => T): void
}

/** Debounce of persisted-cell writes, milliseconds. */
export const PERSIST_DEBOUNCE_MS = 300

/**
 * Pending flushers of debounced cells: a pagehide pass drains them so the
 * last state before a close still lands (the pending timer alone would be
 * cancelled by teardown). Cells never unsubscribe — they live for the page.
 */
const flushers = new Set<() => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    for (const flush of flushers) flush()
  })
}

/**
 * Create one shared state cell, optionally mirrored to localStorage.
 *
 * Persistence is a durable boundary: stored text is parsed defensively and a
 * value that does not survive `revive` is discarded in favour of the initial
 * state, so a format change or hand-edited storage cannot wedge the panel.
 * The mirror is DEBOUNCED and write-skipping: localStorage writes are
 * synchronous main-thread work, and a keystroke-rate writer (the tree filter)
 * would otherwise pay a JSON.stringify of the whole state per key. `project`
 * lets a cell exclude live-only fields (the filter) whose serialization
 * `revive` would drop anyway.
 * @param initial - starting value when nothing valid was restored.
 * @param persist - localStorage key, reviver, and optional persistence
 * projection; omitted keeps the cell in memory.
 * @returns the cell.
 */
export function createCell<T>(
  initial: T,
  persist?: {
    readonly key: string
    readonly revive: (raw: unknown) => T | undefined
    /** Project the persisted form; defaults to the whole value. */
    readonly project?: (value: T) => unknown
  },
): Cell<T> {
  let value = initial
  if (persist !== undefined && typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(persist.key)
    if (stored !== null) {
      try {
        const revived = persist.revive(JSON.parse(stored))
        if (revived !== undefined) value = revived
      } catch {
        // Unparseable or rejected storage: the initial state stands. Nothing
        // else can recover it, and a thrown boot is worse than a reset panel.
      }
    }
  }
  const listeners = new Set<() => void>()
  let timer: ReturnType<typeof setTimeout> | undefined
  let lastWritten: string | undefined
  const persistNow = (): void => {
    if (persist === undefined || typeof localStorage === 'undefined') return
    try {
      const serialized = JSON.stringify(persist.project === undefined ? value : persist.project(value))
      if (serialized === lastWritten) return
      lastWritten = serialized
      localStorage.setItem(persist.key, serialized)
    } catch {
      // A full or blocked quota costs persistence, not the interaction.
    }
  }
  const schedulePersist = (): void => {
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      persistNow()
    }, PERSIST_DEBOUNCE_MS)
    flushers.add(persistNow)
  }
  return {
    getSnapshot: () => value,
    subscribe: (fn) => {
      listeners.add(fn)
      return () => { listeners.delete(fn) }
    },
    update: (next) => {
      const candidate = next(value)
      if (candidate === value) return
      value = candidate
      if (persist !== undefined && typeof localStorage !== 'undefined') schedulePersist()
      for (const fn of [...listeners]) fn()
    },
  }
}

// ── overlay ────────────────────────────────────────────────────────────────

/** Which full-frame overlay is open, if any. */
export interface OverlayState {
  readonly open: 'board' | 'graph' | null
}

/** Overlay actions handed to components through their inject face. */
export interface OverlayActions {
  /**
   * Open one overlay (replacing whichever was open).
   * @param kind - the overlay to show.
   */
  readonly openOverlay: (kind: 'board' | 'graph') => void
  /** Close the open overlay; a no-op when none is. */
  readonly closeOverlay: () => void
}

/** Create the overlay cell and its bound actions. */
export function createOverlay(): { cell: Cell<OverlayState>; actions: OverlayActions } {
  const cell = createCell<OverlayState>({ open: null })
  return {
    cell,
    actions: {
      openOverlay: (kind) => { cell.update(current => current.open === kind ? current : { open: kind }) },
      closeOverlay: () => { cell.update(current => current.open === null ? current : { open: null }) },
    },
  }
}

// ── mention browser ────────────────────────────────────────────────────────

/**
 * The host-wide file browser the mention pickers open.
 *
 * It is `root`-scoped like every other overlay, but the mention it produces
 * belongs to ONE session's composer, so the opening session rides the state.
 * Kept separate from {@link OverlayState} because it carries that payload —
 * folding it in would give the board and the graph fields that mean nothing
 * to them.
 */
export interface BrowseState {
  /** Whether the browser is open. */
  readonly open: boolean
  /** Which entries may be chosen. */
  readonly kind: 'file' | 'dir'
  /** Session whose composer receives the mention. */
  readonly sessionId: string
  /**
   * Directory the browser opens at; undefined starts at the host home.
   * The mention pickers set this to the workspace root (or a folder the user
   * entered from the picker) so the explorer opens in-project.
   */
  readonly startPath?: string
}

/** Browser actions handed to components through their inject face. */
export interface BrowseActions {
  /**
   * Open the browser for one session's composer.
   * @param kind - whether files or folders may be chosen.
   * @param sessionId - the session whose draft receives the mention.
   * @param startPath - directory to start at; omitted starts at the host home.
   */
  readonly openBrowse: (kind: 'file' | 'dir', sessionId: string, startPath?: string) => void
  /** Close the browser; a no-op when it is already closed. */
  readonly closeBrowse: () => void
}

/** Create the browser cell and its bound actions. */
export function createBrowse(): { cell: Cell<BrowseState>; actions: BrowseActions } {
  const cell = createCell<BrowseState>({ open: false, kind: 'file', sessionId: '' })
  return {
    cell,
    actions: {
      openBrowse: (kind, sessionId, startPath) => {
        cell.update(() => ({ open: true, kind, sessionId, ...(startPath === undefined ? {} : { startPath }) }))
      },
      closeBrowse: () => { cell.update(current => current.open ? { ...current, open: false } : current) },
    },
  }
}

// ── workspace view ─────────────────────────────────────────────────────────

/** localStorage key of the persisted view state. */
const PANEL_PERSIST_KEY = 'dsh.webEnhanced.panel.v2'

/**
 * Browsing state of the workspace view.
 *
 * The view is a tab in the conversation's view ring, so it owns no geometry —
 * width, collapse, and docking belong to the frame. What persists is where the
 * user was: the active tab and which directories they had open, the latter per
 * workspace since paths are only meaningful inside one project root.
 */
export interface PanelState {
  /** Active tab; shared across workspaces (a view preference, not per-project). */
  readonly tab: PanelTab
  /** Whether the explorer's file-tree sidebar is collapsed (a view preference). */
  readonly sidebarCollapsed: boolean
  /** Expanded directory paths per workspace id. */
  readonly expanded: Readonly<Record<string, readonly string[]>>
  /** Live file-name filter of the tree (transient, never persisted). */
  readonly query: string
}

/** View actions handed to components through their inject face. */
export interface PanelActions {
  /**
   * Select the active tab.
   * @param tab - explorer, scm, board, or graph.
   */
  readonly selectTab: (tab: PanelTab) => void
  /**
   * Toggle one directory's expansion in the tree.
   * @param workspaceId - the owning workspace.
   * @param path - workspace-relative directory path.
   */
  readonly toggleExpanded: (workspaceId: string, path: string) => void
  /**
   * Replace the tree's file-name filter.
   * @param query - the raw query text.
   */
  readonly setQuery: (query: string) => void
  /**
   * Collapse or expand the explorer's file-tree sidebar.
   * @param collapsed - the target state.
   */
  readonly setSidebarCollapsed: (collapsed: boolean) => void
}

/** Restore persisted view state, dropping anything that is not the stored shape. */
function revivePanel(raw: unknown): PanelState | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined
  const record = raw as Record<string, unknown>
  const tab = record['tab']
  const expanded: Record<string, readonly string[]> = {}
  if (typeof record['expanded'] === 'object' && record['expanded'] !== null) {
    for (const [key, value] of Object.entries(record['expanded'])) {
      if (Array.isArray(value)) expanded[key] = value.filter(item => typeof item === 'string')
    }
  }
  return {
    // The pre-0.14 layout kept files and preview as separate tabs; both
    // restore onto the combined explorer surface.
    tab: tab === 'files' || tab === 'preview' ? 'explorer'
      : tab === 'scm' || tab === 'board' || tab === 'graph' ? tab
        : 'explorer',
    sidebarCollapsed: record['sidebarCollapsed'] === true,
    expanded,
    // The filter is a live gesture, not a place: a reload starts unfiltered.
    query: '',
  }
}

/** Create the view cell and its bound actions. */
export function createPanel(): { cell: Cell<PanelState>; actions: PanelActions } {
  const cell = createCell<PanelState>(
    { tab: 'explorer', sidebarCollapsed: false, expanded: {}, query: '' },
    {
      key: PANEL_PERSIST_KEY,
      revive: revivePanel,
      // The filter is live-only (revive drops it), so it never serializes.
      project: ({ query: _query, ...durable }) => durable,
    },
  )
  return {
    cell,
    actions: {
      selectTab: (tab) => { cell.update(current => current.tab === tab ? current : { ...current, tab }) },
      toggleExpanded: (workspaceId, path) => {
        cell.update((current) => {
          const open = current.expanded[workspaceId] ?? []
          const next = open.includes(path) ? open.filter(item => item !== path) : [...open, path]
          return { ...current, expanded: { ...current.expanded, [workspaceId]: next } }
        })
      },
      setQuery: (query) => { cell.update(current => current.query === query ? current : { ...current, query }) },
      setSidebarCollapsed: (collapsed) => {
        cell.update(current => current.sidebarCollapsed === collapsed ? current : { ...current, sidebarCollapsed: collapsed })
      },
    },
  }
}

// ── preview tabs ───────────────────────────────────────────────────────────

/** Open preview tabs and the active selection. */
export interface PreviewState {
  readonly tabs: readonly PreviewTab[]
  /** Path of the active tab, or null when none is open. */
  readonly active: string | null
}

/** Preview actions handed to components through their inject face. */
export interface PreviewActions {
  /**
   * Open (or focus) one tab, replacing an existing tab for the same path.
   * @param tab - the fully loaded tab.
   */
  readonly openTab: (tab: PreviewTab) => void
  /**
   * Focus an already-open tab.
   * @param path - workspace-relative path.
   */
  readonly focusTab: (path: string) => void
  /**
   * Close one tab; the neighbour to its left becomes active.
   * @param path - workspace-relative path.
   */
  readonly closeTab: (path: string) => void
  /**
   * Switch one tab's render mode.
   * @param path - workspace-relative path.
   * @param mode - source, split, or view.
   */
  readonly setMode: (path: string, mode: PreviewMode) => void
  /**
   * Record unsaved editor text for one tab.
   * @param path - workspace-relative path.
   * @param draft - the editor buffer.
   */
  readonly setDraft: (path: string, draft: string) => void
  /**
   * Commit a saved buffer: the draft becomes the content and clears.
   * @param path - workspace-relative path.
   */
  readonly commitDraft: (path: string) => void
  /** Drop every open tab (the workspace changed under the panel). */
  readonly clearTabs: () => void
}

/** Create the preview cell and its bound actions. */
export function createPreview(): { cell: Cell<PreviewState>; actions: PreviewActions } {
  const cell = createCell<PreviewState>({ tabs: [], active: null })
  const replace = (path: string, edit: (tab: PreviewTab) => PreviewTab): void => {
    cell.update((current) => {
      const index = current.tabs.findIndex(tab => tab.path === path)
      if (index === -1) return current
      const edited = edit(current.tabs[index]!)
      if (edited === current.tabs[index]) return current
      const tabs = [...current.tabs]
      tabs[index] = edited
      return { ...current, tabs }
    })
  }
  return {
    cell,
    actions: {
      openTab: (tab) => {
        cell.update((current) => {
          const index = current.tabs.findIndex(open => open.path === tab.path)
          if (index === -1) return { tabs: [...current.tabs, tab], active: tab.path }
          const tabs = [...current.tabs]
          tabs[index] = tab
          return { tabs, active: tab.path }
        })
      },
      focusTab: (path) => {
        cell.update(current => current.active === path || !current.tabs.some(tab => tab.path === path)
          ? current
          : { ...current, active: path })
      },
      closeTab: (path) => {
        cell.update((current) => {
          const index = current.tabs.findIndex(tab => tab.path === path)
          if (index === -1) return current
          const tabs = current.tabs.filter(tab => tab.path !== path)
          if (current.active !== path) return { ...current, tabs }
          // The left neighbour keeps the eye near where it already was; the
          // first remaining tab covers closing the leftmost one.
          const neighbour = tabs[Math.max(0, index - 1)]
          return { tabs, active: neighbour?.path ?? null }
        })
      },
      setMode: (path, mode) => { replace(path, tab => tab.mode === mode ? tab : { ...tab, mode }) },
      setDraft: (path, draft) => { replace(path, tab => tab.draft === draft ? tab : { ...tab, draft }) },
      commitDraft: (path) => {
        replace(path, (tab) => {
          if (tab.draft === undefined) return tab
          const { draft, ...rest } = tab
          return { ...rest, content: draft }
        })
      },
      clearTabs: () => { cell.update(current => current.tabs.length === 0 ? current : { tabs: [], active: null }) },
    },
  }
}

/**
 * The active tab of a preview state.
 * @param state - preview state.
 * @returns the active tab, or undefined when none is open.
 */
export function activeTabOf(state: PreviewState): PreviewTab | undefined {
  return state.active === null ? undefined : state.tabs.find(tab => tab.path === state.active)
}
