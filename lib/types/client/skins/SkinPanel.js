import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The Settings page's Skins tab: one card per catalog skin with a dual-mode
 * swatch preview (light and dark halves side by side — the halves are the
 * literal palette of the skin, so they do not ride the alias tokens), plus a
 * custom background image section. Clicking a card applies the skin
 * immediately through {@link SkinFace}; the swatch's active half follows the
 * resolved Appearance scheme.
 * @module dsh-web-enhanced/src/client/skins/SkinPanel
 */
import { useEffect, useState } from 'react';
import { SKINS } from "./themes.js";
import css from './SkinPanel.module.css';
/** Accepted background image formats (picker filter + validation). */
const BACKGROUND_ACCEPT = '.png,.jpg,.jpeg,.webp,.gif,.avif,.bmp,.ico,.svg,image/*';
/** Upper bound on the stored data URL, bytes (localStorage holds ~5 MiB). */
const BACKGROUND_MAX_BYTES = 4 * 1024 * 1024;
/** The skins tab body. */
export function SkinPanel({ skin, t }) {
    const [current, setCurrent] = useState(skin.current);
    const [dark, setDark] = useState(skin.dark);
    const [background, setBackground] = useState(skin.background);
    const [backgroundError, setBackgroundError] = useState(null);
    useEffect(() => skin.subscribe(setDark), [skin]);
    const onBackgroundPicked = (file) => {
        if (file === undefined)
            return;
        if (!file.type.startsWith('image/') && !/\.(png|jpe?g|webp|gif|avif|bmp|ico|svg)$/iu.test(file.name)) {
            setBackgroundError(t('skins.bg.badType'));
            return;
        }
        if (file.size > BACKGROUND_MAX_BYTES) {
            setBackgroundError(t('skins.bg.tooLarge'));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = typeof reader.result === 'string' ? reader.result : '';
            if (dataUrl === '') {
                setBackgroundError(t('skins.bg.badType'));
                return;
            }
            setBackgroundError(null);
            skin.setBackground(dataUrl);
            setBackground(dataUrl);
        };
        reader.onerror = () => { setBackgroundError(t('skins.bg.badType')); };
        reader.readAsDataURL(file);
    };
    const clearBackground = () => {
        skin.setBackground('');
        setBackground('');
        setBackgroundError(null);
    };
    if (!skin.available) {
        return _jsx("p", { className: css.unavailable, children: t('skins.unavailable') });
    }
    return (_jsxs("div", { className: css.root, children: [_jsx("p", { className: css.hint, children: t('skins.hint') }), _jsx("div", { className: css.grid, role: "radiogroup", "aria-label": t('skins.title'), children: SKINS.map(entry => {
                    const active = entry.id === current;
                    return (_jsxs("button", { type: "button", role: "radio", "aria-checked": active, className: active ? css.cardActive : css.card, "data-testid": `skin-${entry.id}`, onClick: () => { setCurrent(skin.apply(entry.id)); }, children: [_jsxs("span", { className: css.swatch, children: [_jsxs("span", { className: css.swatchHalf, style: { background: entry.lightSwatch[0] }, children: [_jsx("span", { className: css.chipLayer, style: { background: entry.lightSwatch[1] } }), _jsx("span", { className: css.chipAccent, style: { background: entry.lightSwatch[2] } })] }), _jsxs("span", { className: css.swatchHalf, style: { background: entry.darkSwatch[0] }, children: [_jsx("span", { className: css.chipLayer, style: { background: entry.darkSwatch[1] } }), _jsx("span", { className: css.chipAccent, style: { background: entry.darkSwatch[2] } })] }), _jsx("span", { className: dark ? css.markerDark : css.markerLight, "aria-hidden": "true" })] }), _jsxs("span", { className: css.cardBody, children: [_jsx("span", { className: css.cardTitle, children: t(entry.nameKey) }), _jsx("span", { className: css.cardDesc, children: t(entry.descKey) })] })] }, entry.id));
                }) }), _jsxs("section", { className: css.bgSection, children: [_jsx("h4", { className: css.bgTitle, children: t('skins.bg.title') }), _jsx("p", { className: css.bgHint, children: t('skins.bg.hint') }), _jsxs("div", { className: css.bgRow, children: [background !== ''
                                ? _jsx("img", { className: css.bgThumb, src: background, alt: t('skins.bg.title'), "data-testid": "skin-bg-thumb" })
                                : _jsx("span", { className: css.bgEmpty, "data-testid": "skin-bg-empty", children: t('skins.bg.none') }), _jsxs("div", { className: css.bgActions, children: [_jsxs("label", { className: css.bgPick, children: [t('skins.bg.pick'), _jsx("input", { type: "file", accept: BACKGROUND_ACCEPT, "data-testid": "skin-bg-input", onChange: event => {
                                                    onBackgroundPicked(event.target.files?.[0]);
                                                    // Reset so picking the same file again re-fires onChange.
                                                    event.target.value = '';
                                                } })] }), background !== '' && (_jsx("button", { type: "button", className: css.bgClear, "data-testid": "skin-bg-clear", onClick: clearBackground, children: t('skins.bg.clear') }))] })] }), backgroundError !== null && _jsx("p", { className: css.bgError, "data-testid": "skin-bg-error", children: backgroundError })] })] }));
}
