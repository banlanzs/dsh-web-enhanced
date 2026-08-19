import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Workspace view: the explorer (VSCode-style file tree sidebar plus preview
 * of the open file), SCM, the task board, and the git graph for the session's
 * project, registered as one tab in the conversation's view ring beside Chat
 * and Trajectory, over a terminal drawer shared by all four.
 *
 * It lives in `conversation.view` rather than floating over the frame. The
 * view ring renders one entry at a time at full column width, so this surface
 * does not dock or collapse within the frame. The geometry it does own is
 * internal: the explorer's sidebar width split, and the terminal drawer's
 * height. The drawer is the view's last row rather than a fifth tab, so a
 * command stays visible next to whichever tab is in front; because it now sits
 * on the view's bottom edge, it also carries the clearance for the composer
 * the host floats there.
 * @module dsh-web-enhanced/src/client/panel/WorkspaceView
 */
import { useEffect, useRef } from 'react';
import { workspaceOfSessionId } from "../workspace.js";
import { releaseAllObjectUrls } from "../media.js";
import { BoardPanel } from "../board/BoardOverlay.js";
import { GraphPanel } from "../git/GraphOverlay.js";
import { TerminalDrawer } from "../terminal/TerminalDrawer.js";
import { FileTree } from "./FileTree.js";
import { PreviewPane } from "./PreviewPane.js";
import { ScmPane } from "./ScmPane.js";
import css from './WorkspaceView.module.css';
/** Tabs in display order with their dictionary keys. */
const TABS = [
    { tab: 'explorer', key: 'panel.tab.explorer' },
    { tab: 'scm', key: 'panel.tab.scm' },
    { tab: 'board', key: 'panel.tab.board' },
    { tab: 'graph', key: 'panel.tab.graph' },
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
        // Preview tabs address paths inside one root; their object URLs do too.
        releaseAllObjectUrls();
        clearTabs();
    }, [clearTabs, workspaceId]);
    if (workspaceId === undefined) {
        return _jsx("p", { className: css.empty, "data-testid": "workspace-view-no-project", children: t('panel.noWorkspace') });
    }
    return (
    // Opting into the host's composer-overlay layout: ConversationRoot then
    // gives this view a definite height and lets it own every scroller (the
    // same contract the Trajectory view uses), instead of the page-scrolled
    // default where the tree and the preview would ride one scroll together.
    _jsxs("section", { className: css.view, "data-testid": "workspace-view", "data-conversation-composer-overlay": "", children: [_jsx("nav", { className: css.tabs, role: "tablist", children: TABS.map(entry => (_jsx("button", { type: "button", role: "tab", className: css.tab, "data-active": tab === entry.tab || undefined, "aria-selected": tab === entry.tab, "data-testid": `workspace-view-tab-${entry.tab}`, onClick: () => { selectTab(entry.tab); }, children: t(entry.key) }, entry.tab))) }), _jsxs("div", { className: css.body, role: "tabpanel", children: [tab === 'explorer' && (_jsx("div", { className: css.module, children: _jsxs("div", { className: sidebarCollapsed ? css.explorerCollapsed : css.explorer, "data-testid": "workspace-explorer", "data-sidebar": sidebarCollapsed ? 'collapsed' : 'expanded', children: [sidebarCollapsed
                                    ? (_jsx("button", { type: "button", className: css.expand, "aria-label": t('files.expand'), "data-testid": "workspace-sidebar-expand", title: t('files.expand'), onClick: () => { setSidebarCollapsed(false); }, children: _jsx("span", { "aria-hidden": "true", children: "\u203A" }) }))
                                    : (_jsx("aside", { className: css.sidebar, children: _jsx(FileTree, { ...props, workspaceId: String(workspaceId), onCollapse: () => { setSidebarCollapsed(true); }, collapseLabel: t('files.collapse') }) })), _jsx(PreviewPane, { ...props, workspaceId: String(workspaceId) })] }) })), tab === 'scm' && (_jsx("div", { className: css.module, children: _jsx(ScmPane, { ...props, workspaceId: String(workspaceId) }) })), tab === 'board' && (_jsx("div", { className: css.module, children: _jsx(BoardPanel, { remote: props.remote, workspaces: workspaces.items, openSession: props.openSession, t: t }) })), tab === 'graph' && (_jsx("div", { className: css.module, children: _jsx(GraphPanel, { workspaceId: String(workspaceId), remote: props.remote, t: t, openTab: props.openTab, selectTab: props.selectTab }) }))] }), _jsx(TerminalDrawer, { ...props, workspaceId: String(workspaceId) })] }));
}
