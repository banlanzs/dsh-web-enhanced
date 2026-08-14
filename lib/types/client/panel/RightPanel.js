import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The right dock: file tree, preview, and SCM for the current session's
 * workspace.
 *
 * It lives in `shell.overlay`, not in the layout's `details` slot. `details`
 * is a `single` slot already occupied by ui-conversation's DetailsPanel, so
 * registering there would replace the tool-details column and remove the
 * `conversation.details.tool` seat it declares. `shell.overlay` is additive
 * and sits outside every column's scroll container, which is also what lets
 * this panel own its own geometry — `ctx.layout` exposes open/close for the
 * details column but no width API, and the feature request asks for a
 * draggable width that persists per project.
 * @module dsh-web-enhanced/src/client/panel/RightPanel
 */
import { useCallback, useEffect, useRef } from 'react';
import { PANEL_DEFAULT_WIDTH, clampPanelWidth } from "../stores.js";
import { workspaceOfSession } from "../workspace.js";
import { FileTree } from "./FileTree.js";
import { PreviewPane } from "./PreviewPane.js";
import { ScmPane } from "./ScmPane.js";
import css from './RightPanel.module.css';
/** Tabs in display order with their dictionary keys. */
const TABS = [
    { tab: 'files', key: 'panel.tab.files' },
    { tab: 'preview', key: 'panel.tab.preview' },
    { tab: 'scm', key: 'panel.tab.scm' },
];
/** The right dock. */
export function RightPanel(props) {
    const { usePanel, useSessions, useWorkspaces, setCollapsed, setWidth, resetWidth, selectTab, clearTabs, t, } = props;
    const sessions = useSessions(state => state);
    const workspaces = useWorkspaces(state => state);
    const workspace = workspaceOfSession(sessions, workspaces);
    const workspaceId = workspace?.workspaceId;
    const tab = usePanel(state => state.tab);
    const collapsed = usePanel(state => workspaceId === undefined ? false : (state.collapsed[workspaceId] ?? false));
    const width = usePanel(state => workspaceId === undefined
        ? PANEL_DEFAULT_WIDTH
        : (state.width[workspaceId] ?? PANEL_DEFAULT_WIDTH));
    // Preview tabs address paths inside one workspace root; carrying them into
    // another project would show stale files under valid-looking names.
    const lastWorkspace = useRef(workspaceId);
    useEffect(() => {
        if (lastWorkspace.current === workspaceId)
            return;
        lastWorkspace.current = workspaceId;
        clearTabs();
    }, [clearTabs, workspaceId]);
    const dragging = useRef(false);
    const onHandleDown = useCallback((event) => {
        if (workspaceId === undefined)
            return;
        event.preventDefault();
        dragging.current = true;
        const onMove = (move) => {
            if (!dragging.current)
                return;
            // The dock is right-anchored, so its width grows as the pointer moves left.
            setWidth(workspaceId, clampPanelWidth(window.innerWidth - move.clientX));
        };
        const onUp = () => {
            dragging.current = false;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, [setWidth, workspaceId]);
    // The panel belongs to a project; an ungrouped session has no root to browse.
    if (workspaceId === undefined)
        return null;
    if (collapsed) {
        return (_jsx("button", { type: "button", className: css.collapsed, "data-testid": "right-panel-expand", "aria-label": t('panel.expand'), title: t('panel.expand'), onClick: () => { setCollapsed(workspaceId, false); }, children: "\u2039" }));
    }
    return (_jsxs("aside", { className: css.dock, style: { width: `${String(width)}px` }, "data-testid": "right-panel", children: [_jsx("div", { className: css.handle, role: "separator", "aria-orientation": "vertical", "aria-label": t('panel.resize'), title: t('panel.resize'), "data-testid": "right-panel-handle", onMouseDown: onHandleDown, onDoubleClick: () => { resetWidth(workspaceId); } }), _jsxs("header", { className: css.header, children: [_jsx("nav", { className: css.tabs, role: "tablist", children: TABS.map(entry => (_jsx("button", { type: "button", role: "tab", className: css.tab, "data-active": tab === entry.tab || undefined, "aria-selected": tab === entry.tab, "data-testid": `right-panel-tab-${entry.tab}`, onClick: () => { selectTab(entry.tab); }, children: t(entry.key) }, entry.tab))) }), _jsx("button", { type: "button", className: css.collapse, "aria-label": t('panel.collapse'), title: t('panel.collapse'), "data-testid": "right-panel-collapse", onClick: () => { setCollapsed(workspaceId, true); }, children: "\u203A" })] }), _jsxs("div", { className: css.body, role: "tabpanel", children: [tab === 'files' && _jsx(FileTree, { ...props, workspaceId: workspaceId }), tab === 'preview' && _jsx(PreviewPane, { ...props, workspaceId: workspaceId }), tab === 'scm' && _jsx(ScmPane, { ...props, workspaceId: workspaceId })] })] }));
}
