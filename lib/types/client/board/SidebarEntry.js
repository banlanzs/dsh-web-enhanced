import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import css from './SidebarEntry.module.css';
/** Task-board entry: toggles the board overlay. */
export function BoardSidebarEntry({ useOverlay, openOverlay, closeOverlay, t }) {
    const open = useOverlay(state => state.open === 'board');
    return (_jsxs("button", { type: "button", className: css.entry, "data-active": open || undefined, "aria-pressed": open, "data-testid": "web-enhanced-board-entry", onClick: () => { open ? closeOverlay() : openOverlay('board'); }, children: [_jsx("span", { className: css.glyph, "aria-hidden": true, children: "\u25A4" }), _jsx("span", { className: css.label, children: t('board.entry') })] }));
}
/** Git-graph entry: toggles the graph overlay. */
export function GraphSidebarEntry({ useOverlay, openOverlay, closeOverlay, t }) {
    const open = useOverlay(state => state.open === 'graph');
    return (_jsxs("button", { type: "button", className: css.entry, "data-active": open || undefined, "aria-pressed": open, "data-testid": "web-enhanced-graph-entry", onClick: () => { open ? closeOverlay() : openOverlay('graph'); }, children: [_jsx("span", { className: css.glyph, "aria-hidden": true, children: "\u2387" }), _jsx("span", { className: css.label, children: t('graph.entry') })] }));
}
