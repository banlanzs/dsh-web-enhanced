import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Git graph overlay: branch lanes and commit history for the current
 * session's workspace. Registered into `shell.overlay` and rendered only
 * while the overlay state selects it, so an unopened graph costs one
 * subscription and nothing else.
 *
 * The branch selector here is the GRAPH's own filter: it decides which
 * history the lanes are drawn from and changes nothing in the repository.
 * The composer's branch strip is the other operation — it checks a branch
 * out. Two controls because they are two different questions.
 * @module dsh-web-enhanced/src/client/git/GraphOverlay
 */
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { OverlayShell } from "../shell/OverlayShell.js";
import { workspaceOfSession } from "../workspace.js";
import { laneColor, layoutLanes, placeWorking, shortHash } from "./lanes.js";
import css from './GraphOverlay.module.css';
/** Horizontal distance between lanes, in CSS pixels. */
const LANE_STEP = 16;
/** Row height, in CSS pixels; must match `.row` in the stylesheet. */
const ROW_HEIGHT = 34;
/** Number of lane colours the stylesheet defines. */
const PALETTE_SIZE = 6;
/** The filter value meaning "every ref", distinct from any branch name. */
const ALL_BRANCHES = '';
/** The git graph overlay. */
export function GraphOverlay({ useOverlay, useSessions, useWorkspaces, remote, closeOverlay, t, }) {
    const open = useOverlay(state => state.open === 'graph');
    const sessions = useSessions(state => state);
    const workspaces = useWorkspaces(state => state);
    const workspaceId = workspaceOfSession(sessions, workspaces)?.workspaceId;
    const [commits, setCommits] = useState({ phase: 'loading' });
    const [working, setWorking] = useState(null);
    const [workingOpen, setWorkingOpen] = useState(false);
    const [branches, setBranches] = useState([]);
    const [branch, setBranch] = useState(ALL_BRANCHES);
    const [expanded, setExpanded] = useState(null);
    const live = useRef(true);
    useEffect(() => () => { live.current = false; }, []);
    const load = useCallback(async () => {
        if (workspaceId === undefined)
            return;
        setCommits({ phase: 'loading' });
        const [log, uncommitted] = await Promise.all([
            remote.gitLog({ workspaceId, ...branch === ALL_BRANCHES ? {} : { branch } }),
            // The work tree is the same whichever branch the graph filters to, but it
            // is re-read with the commits so one Refresh answers both questions.
            remote.gitWorking({ workspaceId }),
        ]);
        if (!live.current)
            return;
        setCommits('error' in log
            ? { phase: 'error', message: log.error.message }
            : { phase: 'ready', items: log.commits });
        setWorking('error' in uncommitted ? null : uncommitted.working);
    }, [branch, remote, workspaceId]);
    useEffect(() => {
        if (!open || workspaceId === undefined)
            return;
        // The filter list is repository state, not view state: it is loaded with
        // the overlay and left alone while the user switches filters.
        void (async () => {
            const result = await remote.gitBranches({ workspaceId });
            if (live.current && !('error' in result))
                setBranches(result.branches);
        })();
    }, [open, remote, workspaceId]);
    useEffect(() => {
        if (open)
            void load();
    }, [load, open]);
    // A filter change re-cuts the list, so an open detail no longer has a row.
    useEffect(() => { setExpanded(null); }, [branch]);
    if (!open)
        return null;
    return (_jsx(OverlayShell, { title: t('graph.title'), closeLabel: t('graph.close'), onClose: closeOverlay, testId: "graph-overlay", actions: workspaceId === undefined
            ? null
            : (_jsxs(_Fragment, { children: [_jsxs("label", { className: css.filter, children: [_jsx("span", { className: css.filterLabel, children: t('graph.filter') }), _jsxs("select", { className: css.select, value: branch, "data-testid": "graph-branch-filter", onChange: event => { setBranch(event.target.value); }, children: [_jsx("option", { value: ALL_BRANCHES, children: t('graph.allBranches') }), branches.map(item => (_jsx("option", { value: item.name, children: item.name }, item.name)))] })] }), _jsx("button", { type: "button", className: css.action, onClick: () => { void load(); }, children: t('graph.refresh') })] })), children: workspaceId === undefined
            ? _jsx("p", { className: css.empty, children: t('graph.noWorkspace') })
            : commits.phase === 'loading'
                ? _jsx("p", { className: css.empty, children: t('graph.loading') })
                : commits.phase === 'error'
                    ? _jsx("p", { className: css.error, children: t('graph.error', { message: commits.message }) })
                    : (_jsx(GraphBody, { commits: commits.items, working: working, empty: t('graph.empty'), expanded: expanded, workingOpen: workingOpen, workspaceId: workspaceId, remote: remote, onToggle: hash => { setExpanded(current => (current === hash ? null : hash)); }, onToggleWorking: () => { setWorkingOpen(value => !value); }, t: t })) }));
}
/** Whether a working view has anything to show. */
function hasChanges(working) {
    return working !== null && working.staged + working.unstaged + working.untracked > 0;
}
/** The laid-out commit list; the lane math itself lives in `./lanes.ts`. */
function GraphBody({ commits, working, empty, expanded, workingOpen, workspaceId, remote, onToggle, onToggleWorking, t, }) {
    const layout = layoutLanes(commits);
    const railWidth = (layout.width + 1) * LANE_STEP;
    const dirty = hasChanges(working);
    const placement = dirty ? placeWorking(layout.rows, working.head) : null;
    const workingRow = dirty
        ? (_jsx(WorkingRow, { working: working, lane: placement?.lane ?? 0, through: placement?.through ?? [], railWidth: railWidth, open: workingOpen, onToggle: onToggleWorking, t: t }))
        : null;
    // A repository with no commits yet still has a work tree, and that is
    // precisely when the uncommitted row is the only thing there is to draw.
    if (commits.length === 0) {
        return workingRow === null
            ? _jsx("p", { className: css.empty, children: empty })
            : _jsx("ol", { className: css.rows, "data-testid": "graph-rows", children: workingRow });
    }
    return (_jsx("ol", { className: css.rows, "data-testid": "graph-rows", children: layout.rows.map((row, index) => (_jsxs(Fragment, { children: [placement?.index === index && workingRow, _jsxs("li", { className: css.entry, children: [_jsxs("button", { type: "button", className: css.row, "aria-expanded": expanded === row.commit.hash, "data-testid": "graph-row", onClick: () => { onToggle(row.commit.hash); }, children: [_jsxs("svg", { className: css.rail, width: railWidth, height: ROW_HEIGHT, "aria-hidden": true, children: [row.through.map(lane => (_jsx("line", { className: css.edge, "data-lane": laneColor(lane, PALETTE_SIZE), x1: (lane + 1) * LANE_STEP, y1: 0, x2: (lane + 1) * LANE_STEP, y2: ROW_HEIGHT }, `through-${String(lane)}`))), row.parentLanes.map(lane => (_jsx("line", { className: css.edge, "data-lane": laneColor(lane, PALETTE_SIZE), x1: (row.lane + 1) * LANE_STEP, y1: ROW_HEIGHT / 2, x2: (lane + 1) * LANE_STEP, y2: ROW_HEIGHT }, `parent-${String(lane)}`))), _jsx("circle", { className: css.dot, "data-lane": laneColor(row.lane, PALETTE_SIZE), cx: (row.lane + 1) * LANE_STEP, cy: ROW_HEIGHT / 2, r: 4 })] }), _jsx("span", { className: css.hash, children: shortHash(row.commit.hash) }), _jsx("span", { className: css.subject, title: row.commit.subject, children: row.commit.subject }), row.commit.refs.map(ref => (_jsx("span", { className: css.ref, children: ref }, ref))), _jsx("span", { className: css.author, children: row.commit.author }), _jsx("time", { className: css.date, dateTime: new Date(row.commit.date * 1000).toISOString(), children: new Date(row.commit.date * 1000).toLocaleDateString() })] }), expanded === row.commit.hash && (_jsx(CommitDetail, { hash: row.commit.hash, workspaceId: workspaceId, remote: remote, t: t }))] })] }, row.commit.hash))) }));
}
/**
 * The uncommitted-changes row: a hollow dot on HEAD's lane, joined to HEAD by
 * a dashed stub. Dashed and hollow because it is not a commit — nothing in the
 * repository records it, and it disappears the moment it is committed.
 */
function WorkingRow({ working, lane, through, railWidth, open, onToggle, t }) {
    const dotX = (lane + 1) * LANE_STEP;
    return (_jsxs("li", { className: css.entry, children: [_jsxs("button", { type: "button", className: css.row, "aria-expanded": open, "data-testid": "graph-working-row", onClick: onToggle, children: [_jsxs("svg", { className: css.rail, width: railWidth, height: ROW_HEIGHT, "aria-hidden": true, children: [through.map(other => (_jsx("line", { className: css.edge, "data-lane": laneColor(other, PALETTE_SIZE), x1: (other + 1) * LANE_STEP, y1: 0, x2: (other + 1) * LANE_STEP, y2: ROW_HEIGHT }, `through-${String(other)}`))), _jsx("line", { className: css.pendingEdge, "data-lane": laneColor(lane, PALETTE_SIZE), x1: dotX, y1: ROW_HEIGHT / 2, x2: dotX, y2: ROW_HEIGHT }), _jsx("circle", { className: css.pendingDot, "data-lane": laneColor(lane, PALETTE_SIZE), cx: dotX, cy: ROW_HEIGHT / 2, r: 4 })] }), _jsx("span", { className: css.hash, children: "\u2022\u2022\u2022\u2022\u2022\u2022" }), _jsx("span", { className: css.subject, children: t('graph.working.title') }), _jsx("span", { className: css.workingCounts, children: t('graph.working.counts', {
                            staged: String(working.staged),
                            unstaged: String(working.unstaged),
                            untracked: String(working.untracked),
                        }) })] }), open && _jsx(WorkingDetail, { working: working, t: t })] }));
}
/** The expanded file list of the uncommitted row. */
function WorkingDetail({ working, t }) {
    return (_jsxs("div", { className: css.detail, "data-testid": "graph-working-detail", children: [working.truncated && (_jsx("p", { className: css.filesTitle, children: t('graph.working.truncated', { count: String(working.files.length) }) })), _jsx("ul", { className: css.files, children: working.files.map(file => (_jsxs("li", { className: css.file, children: [_jsx("span", { className: css.stateTag, "data-state": file.state, children: stateLabel(file, t) }), _jsx("span", { className: css.filePath, title: file.path, children: file.path }), _jsx("span", { className: css.added, title: file.added === null ? t('graph.working.unknown') : undefined, children: file.added === null ? '—' : `+${String(file.added)}` }), _jsx("span", { className: css.removed, children: file.removed === null ? '—' : `-${String(file.removed)}` })] }, `${file.state}:${file.path}`))) })] }));
}
/** Short tag naming which diff a working file came out of. */
function stateLabel(file, t) {
    if (file.state === 'staged')
        return t('graph.working.staged');
    return file.state === 'unstaged' ? t('graph.working.unstaged') : t('graph.working.untracked');
}
/** One expanded commit: identity, message body, and the files it touched. */
function CommitDetail({ hash, workspaceId, remote, t }) {
    const [detail, setDetail] = useState({ phase: 'loading' });
    const live = useRef(true);
    useEffect(() => () => { live.current = false; }, []);
    useEffect(() => {
        setDetail({ phase: 'loading' });
        void (async () => {
            const result = await remote.gitCommit({ workspaceId, hash });
            if (!live.current)
                return;
            setDetail('error' in result
                ? { phase: 'error', message: result.error.message }
                : { phase: 'ready', value: result.commit });
        })();
    }, [hash, remote, workspaceId]);
    if (detail.phase === 'loading')
        return _jsx("p", { className: css.empty, children: t('graph.loading') });
    if (detail.phase === 'error')
        return _jsx("p", { className: css.error, children: t('graph.error', { message: detail.message }) });
    const commit = detail.value;
    return (_jsxs("div", { className: css.detail, "data-testid": "graph-detail", children: [_jsxs("dl", { className: css.facts, children: [_jsx("dt", { children: t('graph.detail.hash') }), _jsx("dd", { className: css.mono, children: commit.hash }), _jsx("dt", { children: t('graph.detail.parents') }), _jsx("dd", { className: css.mono, children: commit.parents.length === 0 ? '—' : commit.parents.map(shortHash).join(' ') }), _jsx("dt", { children: t('graph.detail.author') }), _jsx("dd", { children: commit.email === '' ? commit.author : `${commit.author} <${commit.email}>` }), _jsx("dt", { children: t('graph.detail.date') }), _jsx("dd", { children: new Date(commit.date * 1000).toLocaleString() })] }), commit.body !== '' && _jsx("pre", { className: css.body, children: commit.body }), _jsx("p", { className: css.filesTitle, children: t('graph.detail.files', { count: String(commit.files.length) }) }), commit.files.length > 0 && (_jsx("ul", { className: css.files, children: commit.files.map(file => (_jsxs("li", { className: css.file, children: [_jsx("span", { className: css.filePath, title: file.path, children: file.path }), _jsx("span", { className: css.added, children: file.added === null ? '—' : `+${String(file.added)}` }), _jsx("span", { className: css.removed, children: file.removed === null ? '—' : `-${String(file.removed)}` })] }, file.path))) }))] }));
}
