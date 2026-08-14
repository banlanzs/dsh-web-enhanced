import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Workspace file tree: lazily expanded directories, whole-row click to
 * expand, and a file-name filter that switches the tree into a flat match
 * list. Clicking a file opens it in the preview tab.
 *
 * Directory contents are fetched on first expansion and cached for the life
 * of the mount: a tree that re-listed on every render would hammer the host
 * on each keystroke of the filter.
 * @module dsh-web-enhanced/src/client/panel/FileTree
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { loadPreviewTab } from "../preview.js";
import css from './FileTree.module.css';
/** Debounce of the search query, in milliseconds. */
const SEARCH_DEBOUNCE_MS = 200;
/** The file tree. */
export function FileTree({ workspaceId, usePanel, remote, toggleExpanded, setQuery, selectTab, openTab, t, }) {
    const expanded = usePanel(state => state.expanded[workspaceId] ?? []);
    const query = usePanel(state => state.query);
    const [listings, setListings] = useState(new Map());
    const [matches, setMatches] = useState(null);
    const live = useRef(true);
    useEffect(() => () => { live.current = false; }, []);
    const list = useCallback(async (path) => {
        setListings(current => new Map(current).set(path, { phase: 'loading' }));
        const result = await remote.fsList({ workspaceId, path });
        if (!live.current)
            return;
        setListings(current => new Map(current).set(path, 'error' in result
            ? { phase: 'error', message: result.error.message }
            : { phase: 'ready', entries: result.entries }));
    }, [remote, workspaceId]);
    // The root listing is what the tree renders from; everything else is
    // fetched when its directory is first expanded.
    useEffect(() => {
        setListings(new Map());
        void list('');
    }, [list]);
    // Search runs on the host (recursive, bounded); debounced so typing does not
    // queue one traversal per keystroke.
    useEffect(() => {
        const needle = query.trim();
        if (needle === '') {
            setMatches(null);
            return;
        }
        const timer = setTimeout(() => {
            void (async () => {
                const result = await remote.fsSearch({ workspaceId, query: needle });
                if (!live.current)
                    return;
                setMatches('error' in result ? [] : result.entries);
            })();
        }, SEARCH_DEBOUNCE_MS);
        return () => { clearTimeout(timer); };
    }, [query, remote, workspaceId]);
    const open = useCallback(async (path) => {
        const tab = await loadPreviewTab(remote, workspaceId, path);
        if (!live.current)
            return;
        openTab(tab);
        selectTab('preview');
    }, [openTab, remote, selectTab, workspaceId]);
    const toggle = useCallback((path) => {
        if (!expanded.includes(path) && listings.get(path) === undefined)
            void list(path);
        toggleExpanded(workspaceId, path);
    }, [expanded, list, listings, toggleExpanded, workspaceId]);
    return (_jsxs("div", { className: css.tree, "data-testid": "file-tree", children: [_jsx("input", { className: css.search, value: query, placeholder: t('files.search'), "aria-label": t('files.search'), "data-testid": "file-tree-search", onChange: event => { setQuery(event.target.value); } }), matches !== null
                ? (_jsx("ul", { className: css.list, "data-testid": "file-tree-matches", children: matches.length === 0
                        ? _jsx("li", { className: css.empty, children: t('files.searchEmpty') })
                        : matches.map(entry => (_jsx("li", { children: _jsxs("button", { type: "button", className: css.row, "data-kind": entry.kind, onClick: () => { if (entry.kind === 'file')
                                    void open(entry.path); }, children: [_jsx("span", { className: css.glyph, "aria-hidden": true, children: entry.kind === 'dir' ? '▸' : '·' }), _jsx("span", { className: css.name, children: entry.name }), _jsx("span", { className: css.path, children: entry.path })] }) }, entry.path))) }))
                : (_jsx(Directory, { path: "", depth: 0, listings: listings, expanded: expanded, onToggle: toggle, onOpen: (path) => { void open(path); }, t: t }))] }));
}
/** One directory level, recursing into its expanded children. */
function Directory({ path, depth, listings, expanded, onToggle, onOpen, t }) {
    const listing = listings.get(path);
    if (listing === undefined || listing.phase === 'loading') {
        return _jsx("p", { className: css.empty, children: t('board.loading') });
    }
    if (listing.phase === 'error') {
        return _jsx("p", { className: css.error, children: t('files.error', { message: listing.message }) });
    }
    if (listing.entries.length === 0) {
        return _jsx("p", { className: css.empty, children: t('files.empty') });
    }
    return (_jsx("ul", { className: css.list, children: listing.entries.map((entry) => {
            const isOpen = entry.kind === 'dir' && expanded.includes(entry.path);
            return (_jsxs("li", { children: [_jsxs("button", { type: "button", className: css.row, style: { paddingInlineStart: `${String(depth * 12 + 8)}px` }, "data-kind": entry.kind, "data-open": isOpen || undefined, "data-testid": `file-tree-row-${entry.path}`, onClick: () => { entry.kind === 'dir' ? onToggle(entry.path) : onOpen(entry.path); }, children: [_jsx("span", { className: css.glyph, "aria-hidden": true, children: entry.kind === 'dir' ? (isOpen ? '▾' : '▸') : '·' }), _jsx("span", { className: css.name, children: entry.name })] }), isOpen && (_jsx(Directory, { path: entry.path, depth: depth + 1, listings: listings, expanded: expanded, onToggle: onToggle, onOpen: onOpen, t: t }))] }, entry.path));
        }) }));
}
