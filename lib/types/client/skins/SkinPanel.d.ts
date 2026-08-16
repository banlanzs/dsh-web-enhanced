/**
 * The Settings page's Skins tab: one card per catalog skin with a dual-mode
 * swatch preview (light and dark halves side by side — the halves are the
 * literal palette of the skin, so they do not ride the alias tokens), plus a
 * custom background image section. Clicking a card applies the skin
 * immediately through {@link SkinFace}; the swatch's active half follows the
 * resolved Appearance scheme.
 * @module dsh-web-enhanced/src/client/skins/SkinPanel
 */
import type { Translate } from '../locale-keys.ts';
import type { SkinFace } from './skin-layer.ts';
/** Props of the skins panel. */
export interface SkinPanelProps {
    /** The client entry's skin face. */
    readonly skin: SkinFace;
    /** Translate seat of the webEnhanced namespace. */
    readonly t: Translate;
}
/** The skins tab body. */
export declare function SkinPanel({ skin, t }: SkinPanelProps): import("react").JSX.Element;
