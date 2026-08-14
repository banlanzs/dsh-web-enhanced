import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Shared chrome of the two full-frame overlays (task board, git graph).
 *
 * `shell.overlay` is a click-through layer: entries opt into pointer events.
 * This shell is where that opt-in happens, together with the dismissal
 * contract — Escape anywhere, or a click on the backdrop but not inside the
 * panel. Keeping both in one component is what stops the two overlays from
 * drifting apart on keyboard behaviour.
 * @module dsh-web-enhanced/src/client/shell/OverlayShell
 */
import { useEffect, useRef } from 'react';
import css from './OverlayShell.module.css';
/** Full-frame overlay chrome: backdrop, panel, title bar, dismissal. */
export function OverlayShell({ title, closeLabel, onClose, actions, testId, children }) {
    const panelRef = useRef(null);
    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key !== 'Escape')
                return;
            event.stopPropagation();
            onClose();
        };
        // Capture phase: the composer and other session surfaces also listen for
        // Escape, and the topmost surface is the one that should consume it.
        document.addEventListener('keydown', onKeyDown, true);
        return () => { document.removeEventListener('keydown', onKeyDown, true); };
    }, [onClose]);
    useEffect(() => {
        panelRef.current?.focus();
    }, []);
    return (_jsx("div", { className: css.backdrop, "data-testid": testId, onMouseDown: (event) => {
            // Only a press that STARTS on the backdrop dismisses: a drag that
            // began inside the panel and released outside is not a dismissal.
            if (event.target === event.currentTarget)
                onClose();
        }, children: _jsxs("div", { className: css.panel, ref: panelRef, role: "dialog", "aria-modal": "true", "aria-label": title, tabIndex: -1, children: [_jsxs("header", { className: css.header, children: [_jsx("h2", { className: css.title, children: title }), _jsx("div", { className: css.actions, children: actions }), _jsx("button", { type: "button", className: css.close, "aria-label": closeLabel, "data-testid": "overlay-close", onClick: onClose, children: "\u2715" })] }), _jsx("div", { className: css.body, children: children })] }) }));
}
