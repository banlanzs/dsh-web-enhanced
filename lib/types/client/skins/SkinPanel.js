import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The Settings page's Skins tab: one card per catalog skin with a dual-mode
 * swatch preview (light and dark halves side by side — the halves are the
 * literal palette of the skin, so they do not ride the alias tokens). Clicking
 * a card applies the skin immediately through {@link SkinFace}; the swatch's
 * active half follows the resolved Appearance scheme.
 * @module dsh-web-enhanced/src/client/skins/SkinPanel
 */
import { useEffect, useState } from 'react';
import { SKINS } from "./themes.js";
import css from './SkinPanel.module.css';
/** The skins tab body. */
export function SkinPanel({ skin, t }) {
    const [current, setCurrent] = useState(skin.current);
    const [dark, setDark] = useState(skin.dark);
    useEffect(() => skin.subscribe(setDark), [skin]);
    if (!skin.available) {
        return _jsx("p", { className: css.unavailable, children: t('skins.unavailable') });
    }
    return (_jsxs("div", { className: css.root, children: [_jsx("p", { className: css.hint, children: t('skins.hint') }), _jsx("div", { className: css.grid, role: "radiogroup", "aria-label": t('skins.title'), children: SKINS.map(entry => {
                    const active = entry.id === current;
                    return (_jsxs("button", { type: "button", role: "radio", "aria-checked": active, className: active ? css.cardActive : css.card, "data-testid": `skin-${entry.id}`, onClick: () => { setCurrent(skin.apply(entry.id)); }, children: [_jsxs("span", { className: css.swatch, children: [_jsxs("span", { className: css.swatchHalf, style: { background: entry.lightSwatch[0] }, children: [_jsx("span", { className: css.chipLayer, style: { background: entry.lightSwatch[1] } }), _jsx("span", { className: css.chipAccent, style: { background: entry.lightSwatch[2] } })] }), _jsxs("span", { className: css.swatchHalf, style: { background: entry.darkSwatch[0] }, children: [_jsx("span", { className: css.chipLayer, style: { background: entry.darkSwatch[1] } }), _jsx("span", { className: css.chipAccent, style: { background: entry.darkSwatch[2] } })] }), _jsx("span", { className: dark ? css.markerDark : css.markerLight, "aria-hidden": "true" })] }), _jsxs("span", { className: css.cardBody, children: [_jsx("span", { className: css.cardTitle, children: t(entry.nameKey) }), _jsx("span", { className: css.cardDesc, children: t(entry.descKey) })] })] }, entry.id));
                }) })] }));
}
