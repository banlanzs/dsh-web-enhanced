import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import css from './SidebarEntry.module.css';
function SidebarEntryButton({ wide, label, glyph, active, testId, onToggle }) {
    // `wide === false` is the only rail signal: a shell from before the owner
    // prop existed never hands it, and an unknown state must render expanded
    // rather than drop both labels.
    const rail = wide === false;
    return (_jsxs("button", { type: "button", className: css.entry, "data-wide": rail || undefined, "data-active": active || undefined, "aria-pressed": active, "aria-label": rail ? label : undefined, title: rail ? label : undefined, "data-testid": testId, onClick: onToggle, children: [_jsx("span", { className: css.glyph, "aria-hidden": true, children: glyph }), !rail && _jsx("span", { className: css.label, children: label })] }));
}
/** Task-board entry: toggles the board overlay. */
export function BoardSidebarEntry({ wide, useOverlay, openOverlay, closeOverlay, t }) {
    const open = useOverlay(state => state.open === 'board');
    return (_jsx(SidebarEntryButton, { wide: wide, label: t('board.entry'), glyph: "\u25A4", active: open, testId: "web-enhanced-board-entry", onToggle: () => { open ? closeOverlay() : openOverlay('board'); } }));
}
/** Git-graph entry: toggles the graph overlay. */
export function GraphSidebarEntry({ wide, useOverlay, openOverlay, closeOverlay, t }) {
    const open = useOverlay(state => state.open === 'graph');
    return (_jsx(SidebarEntryButton, { wide: wide, label: t('graph.entry'), glyph: "\u2387", active: open, testId: "web-enhanced-graph-entry", onToggle: () => { open ? closeOverlay() : openOverlay('graph'); } }));
}
