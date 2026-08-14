import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Branch strip above the composer: the current branch, a switcher over the
 * local branches, and the entry to the commit graph. Rendered only for a
 * session whose workspace is a git repository — an unrelated project should
 * not grow a dead control.
 * @module dsh-web-enhanced/src/client/git/BranchStrip
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { workspaceOfSession } from "../workspace.js";
import css from './BranchStrip.module.css';
/** The branch strip: current branch, switcher, and the graph entry. */
export function BranchStrip({ useSessions, useWorkspaces, remote, openOverlay, t, }) {
    const sessions = useSessions(state => state);
    const workspaces = useWorkspaces(state => state);
    const workspace = workspaceOfSession(sessions, workspaces);
    const workspaceId = workspace?.workspaceId;
    const [branches, setBranches] = useState({ phase: 'loading' });
    const [switching, setSwitching] = useState(false);
    const [message, setMessage] = useState(null);
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
    const switchTo = useCallback(async (branch) => {
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
    return (_jsxs("div", { className: css.strip, "data-testid": "branch-strip", children: [_jsx("span", { className: css.label, children: t('branch.label') }), _jsx("select", { className: css.select, value: current, disabled: switching, "data-testid": "branch-select", "aria-label": t('branch.label'), onChange: (event) => { void switchTo(event.target.value); }, children: branches.items.map(branch => (_jsx("option", { value: branch.name, children: branch.name }, branch.name))) }), _jsx("button", { type: "button", className: css.graph, "data-testid": "branch-open-graph", onClick: () => { openOverlay('graph'); }, children: t('branch.openGraph') }), message !== null && _jsx("span", { className: css.message, "data-testid": "branch-message", children: message })] }));
}
