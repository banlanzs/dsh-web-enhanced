import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * SCM pane: the real git working-tree status, split into staged and unstaged
 * groups, with stage / unstage / discard per entry and a diff preview on
 * click. Discarding is irreversible, so it asks first.
 * @module dsh-web-enhanced/src/client/panel/ScmPane
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { baseNameOf } from "../preview.js";
import { errorMessageOf } from "../result.js";
import css from './ScmPane.module.css';
/** Whether an entry has staged content (its index column is meaningful). */
function isStaged(entry) {
    return entry.staged !== ' ' && entry.staged !== '?';
}
/** Whether an entry has unstaged worktree content. */
function isUnstaged(entry) {
    return entry.unstaged !== ' ' || entry.staged === '?';
}
/** The SCM pane. */
export function ScmPane({ workspaceId, remote, openTab, selectTab, t }) {
    const [status, setStatus] = useState({ phase: 'loading' });
    const live = useRef(true);
    useEffect(() => () => { live.current = false; }, []);
    const reload = useCallback(async () => {
        const result = await remote.gitStatus({ workspaceId });
        if (!live.current)
            return;
        setStatus('error' in result
            ? { phase: 'error', message: result.error.message }
            : { phase: 'ready', entries: result.entries });
    }, [remote, workspaceId]);
    useEffect(() => {
        setStatus({ phase: 'loading' });
        void reload();
    }, [reload]);
    const mutate = useCallback(async (call) => {
        const result = await call;
        if (!live.current)
            return;
        const message = errorMessageOf(result);
        if (message !== undefined) {
            setStatus({ phase: 'error', message });
            return;
        }
        await reload();
    }, [reload]);
    /** Open one entry's diff as a preview tab. */
    const showDiff = useCallback(async (entry, staged) => {
        const result = await remote.gitDiff({ workspaceId, path: entry.path, staged });
        if (!live.current)
            return;
        const text = 'error' in result ? '' : result.text;
        const error = 'error' in result ? result.error.message : undefined;
        openTab({
            path: `${entry.path}.diff`,
            name: `${baseNameOf(entry.path)} (diff)`,
            kind: 'diff',
            mode: 'view',
            content: text,
            truncated: false,
            size: text.length,
            ...(error === undefined ? {} : { error }),
        });
        selectTab('explorer');
    }, [openTab, remote, selectTab, workspaceId]);
    if (status.phase === 'loading')
        return _jsx("p", { className: css.empty, children: t('board.loading') });
    if (status.phase === 'error')
        return _jsx("p", { className: css.error, children: t('scm.error', { message: status.message }) });
    const staged = status.entries.filter(isStaged);
    const unstaged = status.entries.filter(isUnstaged);
    if (staged.length === 0 && unstaged.length === 0) {
        return _jsx("p", { className: css.empty, "data-testid": "scm-clean", children: t('scm.empty') });
    }
    const row = (entry, group) => (_jsxs("li", { className: css.row, "data-testid": `scm-row-${entry.path}`, children: [_jsxs("button", { type: "button", className: css.name, title: entry.path, onClick: () => { void showDiff(entry, group === 'staged'); }, children: [_jsx("span", { className: css.code, "data-code": group === 'staged' ? entry.staged : entry.unstaged, children: group === 'staged' ? entry.staged : entry.unstaged }), _jsx("span", { className: css.label, children: entry.origPath === undefined
                            ? entry.path
                            : t('scm.renamed', { from: entry.origPath, to: entry.path }) })] }), group === 'staged'
                ? (_jsx("button", { type: "button", className: css.action, "data-testid": `scm-unstage-${entry.path}`, onClick: () => { void mutate(remote.gitUnstage({ workspaceId, paths: [entry.path] })); }, children: t('scm.unstage') }))
                : (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: css.action, "data-testid": `scm-stage-${entry.path}`, onClick: () => { void mutate(remote.gitStage({ workspaceId, paths: [entry.path] })); }, children: t('scm.stage') }), _jsx("button", { type: "button", className: css.danger, "data-testid": `scm-discard-${entry.path}`, onClick: () => { void mutate(remote.gitDiscard({ workspaceId, paths: [entry.path] })); }, children: t('scm.discard') })] }))] }, `${group}-${entry.path}`));
    return (_jsxs("div", { className: css.pane, "data-testid": "scm-pane", children: [_jsx("div", { className: css.toolbar, children: _jsx("button", { type: "button", className: css.action, "data-testid": "scm-refresh", onClick: () => { void reload(); }, children: t('scm.refresh') }) }), staged.length > 0 && (_jsxs("section", { className: css.group, children: [_jsxs("h4", { className: css.groupTitle, children: [t('scm.staged'), _jsx("span", { className: css.count, children: staged.length })] }), _jsx("ul", { className: css.list, children: staged.map(entry => row(entry, 'staged')) })] })), unstaged.length > 0 && (_jsxs("section", { className: css.group, children: [_jsxs("h4", { className: css.groupTitle, children: [t('scm.changes'), _jsx("span", { className: css.count, children: unstaged.length })] }), _jsx("ul", { className: css.list, children: unstaged.map(entry => row(entry, 'unstaged')) })] }))] }));
}
