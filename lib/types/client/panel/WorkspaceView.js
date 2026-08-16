import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Workspace view: the explorer (VSCode-style file tree sidebar plus preview
 * of the open file), SCM, the task board, and the git graph for the session's
 * project, registered as one tab in the conversation's view ring beside Chat
 * and Trajectory.
 *
 * It lives in `conversation.view` rather than floating over the frame. The
 * view ring renders one entry at a time at full column width, so this surface
 * owns no geometry of its own — no docking, no collapse. The one geometry it
 * does own is the explorer's sidebar width split, which lives entirely inside
 * the tab.
 * @module dsh-web-enhanced/src/client/panel/WorkspaceView
 */
import { useEffect, useRef } from 'react';
import { workspaceOfSessionId } from "../workspace.js";
import { BoardPanel } from "../board/BoardOverlay.js";
import { GraphPanel } from "../git/GraphOverlay.js";
import { FileTree } from "./FileTree.js";
import { TerminalPane } from "./TerminalPane.js";
import { PreviewPane } from "./PreviewPane.js";
import { ScmPane } from "./ScmPane.js";
import css from './WorkspaceView.module.css';
/** Tabs in display order with their dictionary keys. */
const TABS = [
    { tab: 'explorer', key: 'panel.tab.explorer' },
    { tab: 'scm', key: 'panel.tab.scm' },
    { tab: 'board', key: 'panel.tab.board' },
    { tab: 'graph', key: 'panel.tab.graph' },
    { tab: 'terminal', key: 'panel.tab.terminal' },
];
/** The workspace view. */
export function WorkspaceView(props) {
    const { sessionId, usePanel, useWorkspaces, selectTab, clearTabs, setSidebarCollapsed, t } = props;
    const workspaces = useWorkspaces(state => state);
    // Session scope: this view renders for one exact session, so the workspace
    // comes from that id rather than from whichever session is current.
    const workspaceId = workspaceOfSessionId(sessionId, workspaces)?.workspaceId;
    const tab = usePanel(state => state.tab);
    const sidebarCollapsed = usePanel(state => state.sidebarCollapsed);
    // Preview tabs address paths inside one workspace root; carrying them into
    // another project would show stale files under valid-looking names.
    const lastWorkspace = useRef(workspaceId);
    useEffect(() => {
        if (lastWorkspace.current === workspaceId)
            return;
        lastWorkspace.current = workspaceId;
        clearTabs();
    }, [clearTabs, workspaceId]);
    if (workspaceId === undefined) {
        return _jsx("p", { className: css.empty, "data-testid": "workspace-view-no-project", children: t('panel.noWorkspace') });
    }
    return (_jsxs("section", { className: css.view, "data-testid": "workspace-view", children: [_jsx("nav", { className: css.tabs, role: "tablist", children: TABS.map(entry => (_jsx("button", { type: "button", role: "tab", className: css.tab, "data-active": tab === entry.tab || undefined, "aria-selected": tab === entry.tab, "data-testid": `workspace-view-tab-${entry.tab}`, onClick: () => { selectTab(entry.tab); }, children: t(entry.key) }, entry.tab))) }), _jsxs("div", { className: css.body, role: "tabpanel", children: [tab === 'explorer' && (_jsxs("div", { className: sidebarCollapsed ? css.explorerCollapsed : css.explorer, "data-testid": "workspace-explorer", "data-sidebar": sidebarCollapsed ? 'collapsed' : 'expanded', children: [sidebarCollapsed
                                ? (_jsx("button", { type: "button", className: css.expand, "aria-label": t('files.expand'), "data-testid": "workspace-sidebar-expand", title: t('files.expand'), onClick: () => { setSidebarCollapsed(false); }, children: _jsx("span", { "aria-hidden": "true", children: "\u203A" }) }))
                                : (_jsxs("aside", { className: css.sidebar, children: [_jsx("button", { type: "button", className: css.collapse, "aria-label": t('files.collapse'), "data-testid": "workspace-sidebar-collapse", title: t('files.collapse'), onClick: () => { setSidebarCollapsed(true); }, children: _jsx("span", { "aria-hidden": "true", children: "\u2039" }) }), _jsx(FileTree, { ...props, workspaceId: String(workspaceId) })] })), _jsx(PreviewPane, { ...props, workspaceId: String(workspaceId) })] })), tab === 'terminal' && _jsx(TerminalPane, { ...props, workspaceId: String(workspaceId) }), tab === 'scm' && _jsx(ScmPane, { ...props, workspaceId: String(workspaceId) }), tab === 'board' && (_jsx(BoardPanel, { remote: props.remote, workspaces: workspaces.items, openSession: props.openSession, t: t })), tab === 'graph' && (_jsx(GraphPanel, { workspaceId: String(workspaceId), remote: props.remote, t: t }))] })] }));
}
