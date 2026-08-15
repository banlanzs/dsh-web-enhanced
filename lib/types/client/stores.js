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
export function createCell(initial, persist) {
    let value = initial;
    if (persist !== undefined && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(persist.key);
        if (stored !== null) {
            try {
                const revived = persist.revive(JSON.parse(stored));
                if (revived !== undefined)
                    value = revived;
            }
            catch {
                // Unparseable or rejected storage: the initial state stands. Nothing
                // else can recover it, and a thrown boot is worse than a reset panel.
            }
        }
    }
    const listeners = new Set();
    return {
        getSnapshot: () => value,
        subscribe: (fn) => {
            listeners.add(fn);
            return () => { listeners.delete(fn); };
        },
        update: (next) => {
            const candidate = next(value);
            if (candidate === value)
                return;
            value = candidate;
            if (persist !== undefined && typeof localStorage !== 'undefined') {
                try {
                    localStorage.setItem(persist.key, JSON.stringify(value));
                }
                catch {
                    // A full or blocked quota costs persistence, not the interaction.
                }
            }
            for (const fn of [...listeners])
                fn();
        },
    };
}
/** Create the overlay cell and its bound actions. */
export function createOverlay() {
    const cell = createCell({ open: null });
    return {
        cell,
        actions: {
            openOverlay: (kind) => { cell.update(current => current.open === kind ? current : { open: kind }); },
            closeOverlay: () => { cell.update(current => current.open === null ? current : { open: null }); },
        },
    };
}
/** Create the browser cell and its bound actions. */
export function createBrowse() {
    const cell = createCell({ open: false, kind: 'file', sessionId: '' });
    return {
        cell,
        actions: {
            openBrowse: (kind, sessionId, startPath) => {
                cell.update(() => ({ open: true, kind, sessionId, ...(startPath === undefined ? {} : { startPath }) }));
            },
            closeBrowse: () => { cell.update(current => current.open ? { ...current, open: false } : current); },
        },
    };
}
// ── workspace view ─────────────────────────────────────────────────────────
/** localStorage key of the persisted view state. */
const PANEL_PERSIST_KEY = 'dsh.webEnhanced.panel.v2';
/** Restore persisted view state, dropping anything that is not the stored shape. */
function revivePanel(raw) {
    if (typeof raw !== 'object' || raw === null)
        return undefined;
    const record = raw;
    const tab = record['tab'];
    const expanded = {};
    if (typeof record['expanded'] === 'object' && record['expanded'] !== null) {
        for (const [key, value] of Object.entries(record['expanded'])) {
            if (Array.isArray(value))
                expanded[key] = value.filter(item => typeof item === 'string');
        }
    }
    return {
        tab: tab === 'files' || tab === 'preview' || tab === 'scm' ? tab : 'files',
        expanded,
        // The filter is a live gesture, not a place: a reload starts unfiltered.
        query: '',
    };
}
/** Create the view cell and its bound actions. */
export function createPanel() {
    const cell = createCell({ tab: 'files', expanded: {}, query: '' }, { key: PANEL_PERSIST_KEY, revive: revivePanel });
    return {
        cell,
        actions: {
            selectTab: (tab) => { cell.update(current => current.tab === tab ? current : { ...current, tab }); },
            toggleExpanded: (workspaceId, path) => {
                cell.update((current) => {
                    const open = current.expanded[workspaceId] ?? [];
                    const next = open.includes(path) ? open.filter(item => item !== path) : [...open, path];
                    return { ...current, expanded: { ...current.expanded, [workspaceId]: next } };
                });
            },
            setQuery: (query) => { cell.update(current => current.query === query ? current : { ...current, query }); },
        },
    };
}
/** Create the preview cell and its bound actions. */
export function createPreview() {
    const cell = createCell({ tabs: [], active: null });
    const replace = (path, edit) => {
        cell.update((current) => {
            const index = current.tabs.findIndex(tab => tab.path === path);
            if (index === -1)
                return current;
            const edited = edit(current.tabs[index]);
            if (edited === current.tabs[index])
                return current;
            const tabs = [...current.tabs];
            tabs[index] = edited;
            return { ...current, tabs };
        });
    };
    return {
        cell,
        actions: {
            openTab: (tab) => {
                cell.update((current) => {
                    const index = current.tabs.findIndex(open => open.path === tab.path);
                    if (index === -1)
                        return { tabs: [...current.tabs, tab], active: tab.path };
                    const tabs = [...current.tabs];
                    tabs[index] = tab;
                    return { tabs, active: tab.path };
                });
            },
            focusTab: (path) => {
                cell.update(current => current.active === path || !current.tabs.some(tab => tab.path === path)
                    ? current
                    : { ...current, active: path });
            },
            closeTab: (path) => {
                cell.update((current) => {
                    const index = current.tabs.findIndex(tab => tab.path === path);
                    if (index === -1)
                        return current;
                    const tabs = current.tabs.filter(tab => tab.path !== path);
                    if (current.active !== path)
                        return { ...current, tabs };
                    // The left neighbour keeps the eye near where it already was; the
                    // first remaining tab covers closing the leftmost one.
                    const neighbour = tabs[Math.max(0, index - 1)];
                    return { tabs, active: neighbour?.path ?? null };
                });
            },
            setMode: (path, mode) => { replace(path, tab => tab.mode === mode ? tab : { ...tab, mode }); },
            setDraft: (path, draft) => { replace(path, tab => tab.draft === draft ? tab : { ...tab, draft }); },
            commitDraft: (path) => {
                replace(path, (tab) => {
                    if (tab.draft === undefined)
                        return tab;
                    const { draft, ...rest } = tab;
                    return { ...rest, content: draft };
                });
            },
            clearTabs: () => { cell.update(current => current.tabs.length === 0 ? current : { tabs: [], active: null }); },
        },
    };
}
/**
 * The active tab of a preview state.
 * @param state - preview state.
 * @returns the active tab, or undefined when none is open.
 */
export function activeTabOf(state) {
    return state.active === null ? undefined : state.tabs.find(tab => tab.path === state.active);
}
