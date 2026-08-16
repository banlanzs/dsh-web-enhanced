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
import type { PanelTab, PreviewMode, PreviewTab } from './contract.ts';
/** Read side of one shared state cell (the HostObservable currency). */
export interface Observable<T> {
    /** Current value; the reference is stable until a write replaces it. */
    getSnapshot(): T;
    /**
     * Subscribe to writes.
     * @param fn - change callback.
     * @returns unsubscribe.
     */
    subscribe(fn: () => void): () => void;
}
/** Read/write face of one shared state cell. */
export interface Cell<T> extends Observable<T> {
    /**
     * Replace the value and notify subscribers. A writer returning the current
     * reference unchanged notifies nobody, so no-op gestures never re-render.
     * @param next - producer receiving the current value.
     */
    update(next: (current: T) => T): void;
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
export declare function createCell<T>(initial: T, persist?: {
    readonly key: string;
    readonly revive: (raw: unknown) => T | undefined;
}): Cell<T>;
/** Which full-frame overlay is open, if any. */
export interface OverlayState {
    readonly open: 'board' | 'graph' | null;
}
/** Overlay actions handed to components through their inject face. */
export interface OverlayActions {
    /**
     * Open one overlay (replacing whichever was open).
     * @param kind - the overlay to show.
     */
    readonly openOverlay: (kind: 'board' | 'graph') => void;
    /** Close the open overlay; a no-op when none is. */
    readonly closeOverlay: () => void;
}
/** Create the overlay cell and its bound actions. */
export declare function createOverlay(): {
    cell: Cell<OverlayState>;
    actions: OverlayActions;
};
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
    readonly open: boolean;
    /** Which entries may be chosen. */
    readonly kind: 'file' | 'dir';
    /** Session whose composer receives the mention. */
    readonly sessionId: string;
    /**
     * Directory the browser opens at; undefined starts at the host home.
     * The mention pickers set this to the workspace root (or a folder the user
     * entered from the picker) so the explorer opens in-project.
     */
    readonly startPath?: string;
}
/** Browser actions handed to components through their inject face. */
export interface BrowseActions {
    /**
     * Open the browser for one session's composer.
     * @param kind - whether files or folders may be chosen.
     * @param sessionId - the session whose draft receives the mention.
     * @param startPath - directory to start at; omitted starts at the host home.
     */
    readonly openBrowse: (kind: 'file' | 'dir', sessionId: string, startPath?: string) => void;
    /** Close the browser; a no-op when it is already closed. */
    readonly closeBrowse: () => void;
}
/** Create the browser cell and its bound actions. */
export declare function createBrowse(): {
    cell: Cell<BrowseState>;
    actions: BrowseActions;
};
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
    readonly tab: PanelTab;
    /** Whether the explorer's file-tree sidebar is collapsed (a view preference). */
    readonly sidebarCollapsed: boolean;
    /** Expanded directory paths per workspace id. */
    readonly expanded: Readonly<Record<string, readonly string[]>>;
    /** Live file-name filter of the tree (transient, never persisted). */
    readonly query: string;
}
/** View actions handed to components through their inject face. */
export interface PanelActions {
    /**
     * Select the active tab.
     * @param tab - explorer, scm, board, graph, or terminal.
     */
    readonly selectTab: (tab: PanelTab) => void;
    /**
     * Toggle one directory's expansion in the tree.
     * @param workspaceId - the owning workspace.
     * @param path - workspace-relative directory path.
     */
    readonly toggleExpanded: (workspaceId: string, path: string) => void;
    /**
     * Replace the tree's file-name filter.
     * @param query - the raw query text.
     */
    readonly setQuery: (query: string) => void;
    /**
     * Collapse or expand the explorer's file-tree sidebar.
     * @param collapsed - the target state.
     */
    readonly setSidebarCollapsed: (collapsed: boolean) => void;
}
/** Create the view cell and its bound actions. */
export declare function createPanel(): {
    cell: Cell<PanelState>;
    actions: PanelActions;
};
/** Open preview tabs and the active selection. */
export interface PreviewState {
    readonly tabs: readonly PreviewTab[];
    /** Path of the active tab, or null when none is open. */
    readonly active: string | null;
}
/** Preview actions handed to components through their inject face. */
export interface PreviewActions {
    /**
     * Open (or focus) one tab, replacing an existing tab for the same path.
     * @param tab - the fully loaded tab.
     */
    readonly openTab: (tab: PreviewTab) => void;
    /**
     * Focus an already-open tab.
     * @param path - workspace-relative path.
     */
    readonly focusTab: (path: string) => void;
    /**
     * Close one tab; the neighbour to its left becomes active.
     * @param path - workspace-relative path.
     */
    readonly closeTab: (path: string) => void;
    /**
     * Switch one tab's render mode.
     * @param path - workspace-relative path.
     * @param mode - source, split, or view.
     */
    readonly setMode: (path: string, mode: PreviewMode) => void;
    /**
     * Record unsaved editor text for one tab.
     * @param path - workspace-relative path.
     * @param draft - the editor buffer.
     */
    readonly setDraft: (path: string, draft: string) => void;
    /**
     * Commit a saved buffer: the draft becomes the content and clears.
     * @param path - workspace-relative path.
     */
    readonly commitDraft: (path: string) => void;
    /** Drop every open tab (the workspace changed under the panel). */
    readonly clearTabs: () => void;
}
/** Create the preview cell and its bound actions. */
export declare function createPreview(): {
    cell: Cell<PreviewState>;
    actions: PreviewActions;
};
/**
 * The active tab of a preview state.
 * @param state - preview state.
 * @returns the active tab, or undefined when none is open.
 */
export declare function activeTabOf(state: PreviewState): PreviewTab | undefined;
