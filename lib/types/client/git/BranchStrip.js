import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Branch switcher in the session header's action row (titleCluster): the
 * current branch, a switcher over the local branches, and the dirty-tree
 * confirmation. Rendered only for a session whose workspace is a git
 * repository — an unrelated project should not grow a dead control.
 * @module dsh-web-enhanced/src/client/git/BranchStrip
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { workspaceOfSessionId } from "../workspace.js";
import css from './BranchStrip.module.css';
/**
 * Summarize a porcelain status for the switch warning.
 *
 * Tracked and untracked are counted apart because they fail differently: git
 * refuses a checkout whose target changes a file the work tree modified, while
 * an untracked file only collides when the target branch happens to carry the
 * same path.
 * @param entries - porcelain v1 entries.
 * @returns the counts.
 */
export function dirtySummary(entries) {
    let untracked = 0;
    for (const entry of entries) {
        if (entry.staged === '?' && entry.unstaged === '?')
            untracked += 1;
    }
    return { total: entries.length, tracked: entries.length - untracked, untracked };
}
/** The branch strip: current branch and the switcher. */
export function BranchStrip({ sessionId, useWorkspaces, remote, t, }) {
    const workspaces = useWorkspaces(state => state);
    const workspaceId = workspaceOfSessionId(sessionId, workspaces)?.workspaceId;
    const [branches, setBranches] = useState({ phase: 'loading' });
    const [switching, setSwitching] = useState(false);
    const [message, setMessage] = useState(null);
    const [pending, setPending] = useState(null);
    const live = useRef(true);
    useEffect(() => () => { live.current = false; }, []);
    const load = useCallback(async () => {
        if (workspaceId === undefined)
            return;
        const result = await remote.gitBranches({ workspaceId });
        if (!live.current)
            return;
        setBranches('error' in result ? { phase: 'error' } : { phase: 'ready', items: result.branches });
    }, [remote, workspaceId]);
    useEffect(() => {
        setBranches({ phase: 'loading' });
        void load();
    }, [load]);
    const runSwitch = useCallback(async (branch) => {
        if (workspaceId === undefined)
            return;
        setSwitching(true);
        setMessage(null);
        try {
            const result = await remote.gitCheckout({ workspaceId, branch });
            if (!live.current)
                return;
            if ('error' in result) {
                setMessage(result.error.message);
                return;
            }
            if (!result.ok) {
                setMessage(result.message ?? null);
                return;
            }
            await load();
        }
        finally {
            if (live.current)
                setSwitching(false);
        }
    }, [load, remote, workspaceId]);
    /**
     * Ask before switching out of a dirty tree.
     *
     * Not a refusal: git carries non-conflicting changes across a checkout and
     * refuses the conflicting case on its own, so blocking here would forbid
     * something that ordinarily works. What is missing without this step is that
     * the user is never told the tree is dirty at all — a silent success that
     * moved edited files to another branch reads as data loss even though it is
     * not.
     */
    const requestSwitch = useCallback(async (branch) => {
        if (workspaceId === undefined)
            return;
        setMessage(null);
        const status = await remote.gitStatus({ workspaceId });
        if (!live.current)
            return;
        // An unreadable status is not a reason to block the switch: git would still
        // do the right thing, and the checkout itself reports its own failure.
        const dirty = 'error' in status ? { total: 0, tracked: 0, untracked: 0 } : dirtySummary(status.entries);
        if (dirty.total === 0) {
            await runSwitch(branch);
            return;
        }
        setPending({ branch, dirty });
    }, [remote, runSwitch, workspaceId]);
    // No workspace, no git root: the strip has nothing to address.
    if (workspaceId === undefined)
        return null;
    // A non-repository answers an error result; the strip stays out of the way
    // rather than shouting about a project that simply is not versioned.
    if (branches.phase === 'error')
        return null;
    if (branches.phase === 'loading') {
        return _jsx("div", { className: css.strip, "data-testid": "branch-strip-loading", children: t('branch.loading') });
    }
    if (branches.items.length === 0)
        return null;
    const current = branches.items.find(branch => branch.current)?.name ?? '';
    return (_jsxs("div", { className: css.strip, "data-testid": "branch-strip", children: [_jsxs("div", { className: css.line, children: [_jsx("span", { className: css.label, children: t('branch.label') }), _jsx("select", { className: css.select, value: current, disabled: switching || pending !== null, "data-testid": "branch-select", "aria-label": t('branch.label'), onChange: (event) => { void requestSwitch(event.target.value); }, children: branches.items.map(branch => (_jsx("option", { value: branch.name, children: branch.name }, branch.name))) })] }), pending !== null && (_jsxs("div", { className: css.confirm, "data-testid": "branch-dirty-confirm", children: [_jsx("span", { className: css.confirmText, children: t('branch.dirty', {
                            count: String(pending.dirty.total),
                            tracked: String(pending.dirty.tracked),
                            untracked: String(pending.dirty.untracked),
                            branch: pending.branch,
                        }) }), _jsx("button", { type: "button", className: css.confirmAction, "data-testid": "branch-dirty-continue", onClick: () => {
                            const target = pending.branch;
                            setPending(null);
                            void runSwitch(target);
                        }, children: t('branch.dirtyConfirm') }), _jsx("button", { type: "button", className: css.confirmAction, onClick: () => { setPending(null); }, children: t('branch.dirtyCancel') })] })), message !== null && (_jsxs("div", { className: css.message, "data-testid": "branch-message", children: [_jsx("span", { className: css.messageTitle, children: t('branch.failed') }), _jsx("pre", { className: css.messageBody, children: message })] }))] }));
}
