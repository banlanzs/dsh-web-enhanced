import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Git graph overlay: branch lanes and commit history for the current
 * session's workspace. Registered into `shell.overlay` and rendered only
 * while the overlay state selects it, so an unopened graph costs one
 * subscription and nothing else.
 * @module dsh-web-enhanced/src/client/git/GraphOverlay
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { OverlayShell } from "../shell/OverlayShell.js";
import { workspaceOfSession } from "../workspace.js";
import { laneColor, layoutLanes, shortHash } from "./lanes.js";
import css from './GraphOverlay.module.css';
/** Horizontal distance between lanes, in CSS pixels. */
const LANE_STEP = 16;
/** Row height, in CSS pixels; must match `.row` in the stylesheet. */
const ROW_HEIGHT = 34;
/** Number of lane colours the stylesheet defines. */
const PALETTE_SIZE = 6;
/** The git graph overlay. */
export function GraphOverlay({ useOverlay, useSessions, useWorkspaces, remote, closeOverlay, t, }) {
    const open = useOverlay(state => state.open === 'graph');
    const sessions = useSessions(state => state);
    const workspaces = useWorkspaces(state => state);
    const workspaceId = workspaceOfSession(sessions, workspaces)?.workspaceId;
    const [commits, setCommits] = useState({ phase: 'loading' });
    const live = useRef(true);
    useEffect(() => () => { live.current = false; }, []);
    const load = useCallback(async () => {
        if (workspaceId === undefined)
            return;
        setCommits({ phase: 'loading' });
        const result = await remote.gitLog({ workspaceId });
        if (!live.current)
            return;
        setCommits('error' in result
            ? { phase: 'error', message: result.error.message }
            : { phase: 'ready', items: result.commits });
    }, [remote, workspaceId]);
    useEffect(() => {
        if (open)
            void load();
    }, [load, open]);
    if (!open)
        return null;
    return (_jsx(OverlayShell, { title: t('graph.title'), closeLabel: t('graph.close'), onClose: closeOverlay, testId: "graph-overlay", actions: workspaceId === undefined
            ? null
            : (_jsx("button", { type: "button", className: css.action, onClick: () => { void load(); }, children: t('graph.refresh') })), children: workspaceId === undefined
            ? _jsx("p", { className: css.empty, children: t('graph.noWorkspace') })
            : commits.phase === 'loading'
                ? _jsx("p", { className: css.empty, children: t('graph.loading') })
                : commits.phase === 'error'
                    ? _jsx("p", { className: css.error, children: t('graph.error', { message: commits.message }) })
                    : _jsx(GraphBody, { commits: commits.items, empty: t('graph.empty') }) }));
}
/** The laid-out commit list; the lane math itself lives in `./lanes.ts`. */
function GraphBody({ commits, empty }) {
    if (commits.length === 0)
        return _jsx("p", { className: css.empty, children: empty });
    const layout = layoutLanes(commits);
    const railWidth = (layout.width + 1) * LANE_STEP;
    return (_jsx("ol", { className: css.rows, "data-testid": "graph-rows", children: layout.rows.map(row => (_jsxs("li", { className: css.row, children: [_jsxs("svg", { className: css.rail, width: railWidth, height: ROW_HEIGHT, "aria-hidden": true, children: [row.through.map(lane => (_jsx("line", { className: css.edge, "data-lane": laneColor(lane, PALETTE_SIZE), x1: (lane + 1) * LANE_STEP, y1: 0, x2: (lane + 1) * LANE_STEP, y2: ROW_HEIGHT }, `through-${String(lane)}`))), row.parentLanes.map(lane => (_jsx("line", { className: css.edge, "data-lane": laneColor(lane, PALETTE_SIZE), x1: (row.lane + 1) * LANE_STEP, y1: ROW_HEIGHT / 2, x2: (lane + 1) * LANE_STEP, y2: ROW_HEIGHT }, `parent-${String(lane)}`))), _jsx("circle", { className: css.dot, "data-lane": laneColor(row.lane, PALETTE_SIZE), cx: (row.lane + 1) * LANE_STEP, cy: ROW_HEIGHT / 2, r: 4 })] }), _jsx("span", { className: css.hash, children: shortHash(row.commit.hash) }), _jsx("span", { className: css.subject, title: row.commit.subject, children: row.commit.subject }), row.commit.refs.map(ref => (_jsx("span", { className: css.ref, children: ref }, ref))), _jsx("span", { className: css.author, children: row.commit.author }), _jsx("time", { className: css.date, dateTime: new Date(row.commit.date * 1000).toISOString(), children: new Date(row.commit.date * 1000).toLocaleDateString() })] }, row.commit.hash))) }));
}
