import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Workspace view: file tree, preview, and SCM for the session's project,
 * registered as one tab in the conversation's view ring beside Chat and
 * Trajectory.
 *
 * It lives in `conversation.view` rather than floating over the frame. The
 * view ring renders one entry at a time at full column width, so this surface
 * owns no geometry — no docking, no drag-to-resize, no collapse. Those belong
 * to the frame, and a tab that tried to own them would fight it.
 * @module dsh-web-enhanced/src/client/panel/WorkspaceView
 */
import { useEffect, useRef } from 'react';
import { workspaceOfSessionId } from "../workspace.js";
import { FileTree } from "./FileTree.js";
import { PreviewPane } from "./PreviewPane.js";
import { ScmPane } from "./ScmPane.js";
import css from './WorkspaceView.module.css';
/** Tabs in display order with their dictionary keys. */
const TABS = [
    { tab: 'files', key: 'panel.tab.files' },
    { tab: 'preview', key: 'panel.tab.preview' },
    { tab: 'scm', key: 'panel.tab.scm' },
];
/** The workspace view. */
export function WorkspaceView(props) {
    const { sessionId, usePanel, useWorkspaces, selectTab, clearTabs, t } = props;
    const workspaces = useWorkspaces(state => state);
    // Session scope: this view renders for one exact session, so the workspace
    // comes from that id rather than from whichever session is current.
    const workspaceId = workspaceOfSessionId(sessionId, workspaces)?.workspaceId;
    const tab = usePanel(state => state.tab);
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
    return (_jsxs("section", { className: css.view, "data-testid": "workspace-view", children: [_jsx("nav", { className: css.tabs, role: "tablist", children: TABS.map(entry => (_jsx("button", { type: "button", role: "tab", className: css.tab, "data-active": tab === entry.tab || undefined, "aria-selected": tab === entry.tab, "data-testid": `workspace-view-tab-${entry.tab}`, onClick: () => { selectTab(entry.tab); }, children: t(entry.key) }, entry.tab))) }), _jsxs("div", { className: css.body, role: "tabpanel", children: [tab === 'files' && _jsx(FileTree, { ...props, workspaceId: workspaceId }), tab === 'preview' && _jsx(PreviewPane, { ...props, workspaceId: workspaceId }), tab === 'scm' && _jsx(ScmPane, { ...props, workspaceId: workspaceId })] })] }));
}
