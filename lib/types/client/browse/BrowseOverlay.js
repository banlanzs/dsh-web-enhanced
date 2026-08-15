import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
import { useCallback, useEffect, useRef, useState } from 'react';
import { OverlayShell } from "../shell/OverlayShell.js";
import { mentionOf } from "../mention.js";
import css from './BrowseOverlay.module.css';
/** Split an absolute path into its navigable ancestors, deepest last. */
export function crumbsOf(path) {
    const separator = path.includes('\\') && !path.startsWith('/') ? '\\' : '/';
    const parts = path.split(/[\\/]/u);
    const crumbs = [];
    let prefix = '';
    for (const [index, part] of parts.entries()) {
        if (part === '' && index > 0)
            continue;
        if (index === 0) {
            // A POSIX root shows as `/`. A bare drive letter must keep its trailing
            // separator: `C:` alone names the CURRENT directory on that drive, not
            // its root, so navigating to the crumb would land somewhere else.
            prefix = part === '' ? separator : /^[A-Za-z]:$/u.test(part) ? `${part}${separator}` : part;
            crumbs.push({ name: part === '' ? separator : part, path: prefix });
            continue;
        }
        prefix = `${prefix}${prefix.endsWith(separator) ? '' : separator}${part}`;
        crumbs.push({ name: part, path: prefix });
    }
    return crumbs;
}
/** The host-wide file browser. */
export function BrowseOverlay({ useBrowse, remote, closeBrowse, appendMention, t }) {
    const open = useBrowse(state => state.open);
    const kind = useBrowse(state => state.kind);
    const sessionId = useBrowse(state => state.sessionId);
    const [path, setPath] = useState(undefined);
    const [level, setLevel] = useState({ phase: 'loading' });
    const [query, setQuery] = useState('');
    const live = useRef(true);
    useEffect(() => () => { live.current = false; }, []);
    const load = useCallback(async (target) => {
        setLevel({ phase: 'loading' });
        const result = await remote.fsBrowse(target === undefined ? {} : { path: target });
        if (!live.current)
            return;
        if ('error' in result) {
            setLevel({ phase: 'error', message: result.error.message });
            return;
        }
        setLevel({ phase: 'ready', value: result });
    }, [remote]);
    // Each opening starts at the host home again: the browser is a one-shot
    // gesture, and resuming somewhere the user has forgotten is worse than a
    // known starting point.
    useEffect(() => {
        if (!open)
            return;
        setPath(undefined);
        setQuery('');
    }, [open]);
    useEffect(() => {
        if (open)
            void load(path);
    }, [load, open, path]);
    const choose = useCallback((chosen) => {
        appendMention(sessionId, mentionOf(chosen));
        closeBrowse();
    }, [appendMention, closeBrowse, sessionId]);
    if (!open)
        return null;
    const current = level.phase === 'ready' ? level.value : undefined;
    const needle = query.trim().toLowerCase();
    const entries = (current?.entries ?? []).filter(entry => needle === '' || entry.name.toLowerCase().includes(needle));
    return (_jsxs(OverlayShell, { title: t(kind === 'file' ? 'browse.titleFile' : 'browse.titleFolder'), closeLabel: t('browse.close'), onClose: closeBrowse, testId: "browse-overlay", fill: true, actions: _jsxs(_Fragment, { children: [_jsx("input", { className: css.filter, type: "search", value: query, placeholder: t('browse.filter'), "data-testid": "browse-filter", onChange: event => { setQuery(event.target.value); } }), current !== undefined && (_jsx("button", { type: "button", className: css.action, onClick: () => { setPath(current.home); }, children: t('browse.home') })), kind === 'dir' && current !== undefined && (_jsx("button", { type: "button", className: css.primary, "data-testid": "browse-choose-current", onClick: () => { choose(current.path); }, children: t('browse.useCurrent') }))] }), children: [current !== undefined && (_jsx("nav", { className: css.crumbs, "aria-label": t('browse.crumbs'), children: crumbsOf(current.path).map(crumb => (_jsx("button", { type: "button", className: css.crumb, onClick: () => { setPath(crumb.path); }, children: crumb.name }, crumb.path))) })), level.phase === 'loading' && _jsx("p", { className: css.empty, children: t('browse.loading') }), level.phase === 'error' && _jsx("p", { className: css.error, children: t('browse.error', { message: level.message }) }), current !== undefined && (_jsxs("ul", { className: css.rows, "data-testid": "browse-rows", children: [current.parent !== null && (_jsx("li", { children: _jsxs("button", { type: "button", className: css.row, "data-testid": "browse-up", onClick: () => { setPath(current.parent); }, children: [_jsx("span", { className: css.icon, "aria-hidden": true, children: "\u21B0" }), _jsx("span", { className: css.name, children: t('browse.parent') })] }) })), entries.map(entry => (_jsx("li", { children: _jsxs("button", { type: "button", className: css.row, "data-kind": entry.kind, 
                            // A directory always navigates on click; folder mode picks it
                            // through the explicit "use this folder" button instead, so
                            // the same gesture never means two things.
                            onClick: () => {
                                if (entry.kind === 'dir')
                                    setPath(entry.path);
                                else if (kind === 'file')
                                    choose(entry.path);
                            }, disabled: entry.kind === 'file' && kind === 'dir', children: [_jsx("span", { className: css.icon, "aria-hidden": true, children: entry.kind === 'dir' ? '▸' : '·' }), _jsx("span", { className: css.name, children: entry.name })] }) }, entry.path))), entries.length === 0 && _jsx("li", { className: css.empty, children: t('browse.empty') })] })), current?.truncated === true && _jsx("p", { className: css.notice, children: t('browse.truncated') })] }));
}
