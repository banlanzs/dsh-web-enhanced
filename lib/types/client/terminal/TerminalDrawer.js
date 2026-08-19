import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The workspace's terminal drawer: a collapsible, drag-resized strip along the
 * bottom of the workspace view holding one tab per live PTY.
 *
 * It sits below the tab body rather than inside one tab so a terminal stays
 * visible while the file tree, changes, board, or graph is in front — the
 * point of a bottom drawer is to type commands without leaving what you were
 * looking at.
 * @module dsh-web-enhanced/src/client/terminal/TerminalDrawer
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { clampDrawerHeight } from "../stores.js";
import { TerminalSession } from "./TerminalSession.js";
import css from './TerminalDrawer.module.css';
/** The terminal drawer. */
export function TerminalDrawer(props) {
    const { workspaceId, remote, usePanel, setDrawerCollapsed, setDrawerHeight, setActiveTerminal, t, } = props;
    const collapsed = usePanel(state => state.drawerCollapsed);
    const height = usePanel(state => state.drawerHeight);
    const activeId = usePanel(state => state.activeTerminalId);
    const [sessions, setSessions] = useState([]);
    /** True while a viewport is measuring itself and creating its PTY. */
    const [creating, setCreating] = useState(false);
    const live = useRef(true);
    useEffect(() => () => { live.current = false; }, []);
    // The registry lives in the host process, so what exists is authoritative
    // there: a reload, a restart, or a second browser tab all reconcile here.
    useEffect(() => {
        if (collapsed)
            return;
        let cancelled = false;
        void (async () => {
            const result = await remote.terminalList({ workspaceId });
            if (cancelled || !live.current || 'error' in result)
                return;
            setSessions(result.terminals);
            if (result.terminals.length === 0)
                setCreating(true);
        })();
        return () => { cancelled = true; };
    }, [collapsed, remote, workspaceId]);
    const active = sessions.find(session => session.id === activeId)
        ?? (sessions.length > 0 ? sessions[0] : undefined);
    const spawned = useCallback((terminal) => {
        setCreating(false);
        setSessions(current => current.some(session => session.id === terminal.id)
            ? current
            : [...current, terminal]);
        setActiveTerminal(terminal.id);
    }, [setActiveTerminal]);
    const dropped = useCallback((terminalId) => {
        setSessions(current => current.filter(session => session.id !== terminalId));
    }, []);
    const close = useCallback(async (terminalId) => {
        await remote.terminalClose({ terminalId });
        if (!live.current)
            return;
        dropped(terminalId);
        if (activeId === terminalId)
            setActiveTerminal(null);
    }, [activeId, dropped, remote, setActiveTerminal]);
    // Pointer capture rather than window listeners: the drag must survive the
    // pointer crossing the terminal surface, which swallows its own events.
    const dragFrom = useRef(null);
    const startDrag = useCallback((event) => {
        dragFrom.current = { y: event.clientY, height };
        event.currentTarget.setPointerCapture(event.pointerId);
    }, [height]);
    const drag = useCallback((event) => {
        const from = dragFrom.current;
        if (from === null)
            return;
        // Upward drag grows the drawer, so the delta is inverted.
        setDrawerHeight(clampDrawerHeight(from.height + (from.y - event.clientY)));
    }, [setDrawerHeight]);
    const endDrag = useCallback((event) => {
        dragFrom.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
    }, []);
    const labels = {
        connecting: t('terminal.connecting'),
        reconnecting: t('terminal.reconnecting'),
        gone: t('terminal.gone'),
        exited: (code) => t('terminal.exited', { code }),
        error: (message) => t('terminal.error', { message }),
    };
    return (_jsxs("section", { className: css.drawer, "data-testid": "terminal-drawer", "data-collapsed": collapsed || undefined, style: collapsed ? undefined : { height: `${height}px` }, children: [!collapsed && (_jsx("div", { className: css.handle, role: "separator", "aria-orientation": "horizontal", "aria-label": t('terminal.resize'), "data-testid": "terminal-resize", onPointerDown: startDrag, onPointerMove: drag, onPointerUp: endDrag, onPointerCancel: endDrag })), _jsxs("nav", { className: css.strip, children: [_jsxs("button", { type: "button", className: css.toggle, "data-testid": "terminal-toggle", "aria-expanded": !collapsed, title: collapsed ? t('terminal.expand') : t('terminal.collapse'), onClick: () => { setDrawerCollapsed(!collapsed); }, children: [_jsx("span", { "aria-hidden": "true", children: collapsed ? '▲' : '▼' }), t('terminal.title')] }), !collapsed && sessions.map(session => (_jsxs("span", { className: css.tab, "data-active": session.id === active?.id || undefined, children: [_jsx("button", { type: "button", className: css.tabName, "data-testid": `terminal-tab-${session.id}`, onClick: () => { setActiveTerminal(session.id); }, children: session.title }), _jsx("button", { type: "button", className: css.tabClose, "aria-label": t('terminal.close'), title: t('terminal.close'), "data-testid": `terminal-close-${session.id}`, onClick: () => { void close(session.id); }, children: _jsx("span", { "aria-hidden": "true", children: "\u00D7" }) })] }, session.id))), !collapsed && (_jsx("button", { type: "button", className: css.new, "aria-label": t('terminal.new'), title: t('terminal.new'), "data-testid": "terminal-new", onClick: () => { setCreating(true); }, children: _jsx("span", { "aria-hidden": "true", children: "+" }) }))] }), !collapsed && (_jsxs("div", { className: css.body, "data-testid": "terminal-body", children: [sessions.map(session => (_jsx("div", { className: session.id === active?.id ? css.pane : css.paneHidden, children: _jsx(TerminalSession, { workspaceId: workspaceId, terminal: session, remote: remote, onSpawned: spawned, onExit: dropped, labels: labels }) }, session.id))), creating && (_jsx("div", { className: css.pane, children: _jsx(TerminalSession, { workspaceId: workspaceId, terminal: null, remote: remote, onSpawned: spawned, onExit: dropped, labels: labels }) })), !creating && sessions.length === 0 && (_jsx("p", { className: css.empty, "data-testid": "terminal-empty", children: t('terminal.empty') }))] }))] }));
}
