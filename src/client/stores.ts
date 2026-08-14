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

/**
 * Create one shared state cell, optionally mirrored to localStorage.
 *
 * Persistence is a durable boundary: stored text is parsed defensively and a
 * value that does not survive `revive` is discarded in favour of the initial
 * state, so a format change or hand-edited storage cannot wedge the panel.
 * @param initial - starting value when nothing valid was restored.
 * @param persist - localStorage key and reviver; omitted keeps the cell in memory.
 * @returns the cell.
 */
export function createCell<T>(
  initial: T,
  persist?: { readonly key: string; readonly revive: (raw: unknown) => T | undefined },
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
      if (persist !== undefined && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(persist.key, JSON.stringify(value))
        } catch {
          // A full or blocked quota costs persistence, not the interaction.
        }
      }
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

// ── right panel ────────────────────────────────────────────────────────────

/** Default rendered width of the right panel, in CSS pixels. */
export const PANEL_DEFAULT_WIDTH = 380

/** Narrowest the drag handle may make the panel. */
export const PANEL_MIN_WIDTH = 260

/** Widest the drag handle may make the panel. */
export const PANEL_MAX_WIDTH = 900

/** localStorage key of the persisted panel geometry. */
const PANEL_PERSIST_KEY = 'dsh.webEnhanced.panel.v1'

/** Per-workspace panel geometry and browsing state. */
export interface PanelState {
  /** Active tab; shared across workspaces (a view preference, not geometry). */
  readonly tab: PanelTab
  /** Collapsed flag per workspace id. */
  readonly collapsed: Readonly<Record<string, boolean>>
  /** Rendered width per workspace id, in CSS pixels. */
  readonly width: Readonly<Record<string, number>>
  /** Expanded directory paths per workspace id. */
  readonly expanded: Readonly<Record<string, readonly string[]>>
  /** Live file-name filter of the tree (transient, never persisted). */
  readonly query: string
}

/** Panel actions handed to components through their inject face. */
export interface PanelActions {
  /**
   * Select the active tab.
   * @param tab - files, preview, or scm.
   */
  readonly selectTab: (tab: PanelTab) => void
  /**
   * Collapse or expand the panel for one workspace.
   * @param workspaceId - the owning workspace.
   * @param collapsed - target state.
   */
  readonly setCollapsed: (workspaceId: string, collapsed: boolean) => void
  /**
   * Set the panel width for one workspace; the value is clamped to the
   * supported range so a stale persisted number cannot render it unusable.
   * @param workspaceId - the owning workspace.
   * @param width - requested width in CSS pixels.
   */
  readonly setWidth: (workspaceId: string, width: number) => void
  /**
   * Restore the default width for one workspace (the handle's double-click).
   * @param workspaceId - the owning workspace.
   */
  readonly resetWidth: (workspaceId: string) => void
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
}

/** Clamp a requested width into the supported range. */
export function clampPanelWidth(width: number): number {
  if (!Number.isFinite(width)) return PANEL_DEFAULT_WIDTH
  return Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, Math.round(width)))
}

/** Restore persisted panel geometry, dropping anything that is not the stored shape. */
function revivePanel(raw: unknown): PanelState | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined
  const record = raw as Record<string, unknown>
  const tab = record['tab']
  const collapsed: Record<string, boolean> = {}
  const width: Record<string, number> = {}
  const expanded: Record<string, readonly string[]> = {}
  if (typeof record['collapsed'] === 'object' && record['collapsed'] !== null) {
    for (const [key, value] of Object.entries(record['collapsed'])) {
      if (typeof value === 'boolean') collapsed[key] = value
    }
  }
  if (typeof record['width'] === 'object' && record['width'] !== null) {
    for (const [key, value] of Object.entries(record['width'])) {
      if (typeof value === 'number') width[key] = clampPanelWidth(value)
    }
  }
  if (typeof record['expanded'] === 'object' && record['expanded'] !== null) {
    for (const [key, value] of Object.entries(record['expanded'])) {
      if (Array.isArray(value)) expanded[key] = value.filter(item => typeof item === 'string')
    }
  }
  return {
    tab: tab === 'files' || tab === 'preview' || tab === 'scm' ? tab : 'files',
    collapsed,
    width,
    expanded,
    // The filter is a live gesture, not geometry: a reload starts unfiltered.
    query: '',
  }
}

/** Create the panel cell and its bound actions. */
export function createPanel(): { cell: Cell<PanelState>; actions: PanelActions } {
  const cell = createCell<PanelState>(
    { tab: 'files', collapsed: {}, width: {}, expanded: {}, query: '' },
    { key: PANEL_PERSIST_KEY, revive: revivePanel },
  )
  return {
    cell,
    actions: {
      selectTab: (tab) => { cell.update(current => current.tab === tab ? current : { ...current, tab }) },
      setCollapsed: (workspaceId, collapsed) => {
        cell.update(current => current.collapsed[workspaceId] === collapsed
          ? current
          : { ...current, collapsed: { ...current.collapsed, [workspaceId]: collapsed } })
      },
      setWidth: (workspaceId, width) => {
        const clamped = clampPanelWidth(width)
        cell.update(current => current.width[workspaceId] === clamped
          ? current
          : { ...current, width: { ...current.width, [workspaceId]: clamped } })
      },
      resetWidth: (workspaceId) => {
        cell.update(current => current.width[workspaceId] === PANEL_DEFAULT_WIDTH
          ? current
          : { ...current, width: { ...current.width, [workspaceId]: PANEL_DEFAULT_WIDTH } })
      },
      toggleExpanded: (workspaceId, path) => {
        cell.update((current) => {
          const open = current.expanded[workspaceId] ?? []
          const next = open.includes(path) ? open.filter(item => item !== path) : [...open, path]
          return { ...current, expanded: { ...current.expanded, [workspaceId]: next } }
        })
      },
      setQuery: (query) => { cell.update(current => current.query === query ? current : { ...current, query }) },
    },
  }
}

/**
 * Resolve the rendered width of one workspace's panel.
 * @param state - panel state.
 * @param workspaceId - the owning workspace, or undefined before one resolves.
 * @returns the persisted width, or the default.
 */
export function panelWidthOf(state: PanelState, workspaceId: string | undefined): number {
  if (workspaceId === undefined) return PANEL_DEFAULT_WIDTH
  return state.width[workspaceId] ?? PANEL_DEFAULT_WIDTH
}

/**
 * Whether one workspace's panel is collapsed.
 * @param state - panel state.
 * @param workspaceId - the owning workspace, or undefined before one resolves.
 * @returns the persisted flag; panels start expanded.
 */
export function panelCollapsedOf(state: PanelState, workspaceId: string | undefined): boolean {
  if (workspaceId === undefined) return false
  return state.collapsed[workspaceId] ?? false
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
