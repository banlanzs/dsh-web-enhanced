/**
 * Skin layer: the skin system's runtime half. Owns the durable skin choice
 * (localStorage — a browser-local visual preference, like the selected-session
 * key) and stacks the chosen skin's token layer onto the theme service's
 * override stack. Re-calling `overrideTokens` with the same source replaces
 * the layer, so switching skins is one call and disposing the plugin (or the
 * empty `none` layer) restores the stock palette exactly.
 *
 * The theme service is read uninjected through a structural face: a
 * deployment composed without it keeps every other feature of this plugin and
 * the skin page reports unavailable instead of failing the entry.
 * @module dsh-web-enhanced/src/client/skins/skin-layer
 */
import { skinOf } from "./themes.js";
/** localStorage key carrying the selected skin id. */
export const SKIN_STORAGE_KEY = 'dsh.web-enhanced.skin';
/** The layer's identity in the theme override stack (inspection-visible). */
const OVERRIDE_SOURCE = 'dsh-web-enhanced';
/**
 * The skin system runtime: persisted choice plus one override layer on the
 * theme stack. Created once in the client entry; the settings panel talks to
 * it only through {@link SkinFace}.
 */
export class SkinLayer {
    theme;
    skin;
    /**
     * @param ctx - client root context (the override layer and the
     * `theme/change` listener are effects, released on plugin dispose).
     */
    constructor(ctx) {
        this.theme = ctx.get('theme');
        let stored = null;
        try {
            stored = localStorage.getItem(SKIN_STORAGE_KEY);
        }
        catch {
            // Private-browsing storage quota denials leave the default choice; the
            // preference simply does not survive a reload.
        }
        this.skin = skinOf(stored ?? 'none');
        if (this.theme !== undefined) {
            const theme = this.theme;
            ctx.effect(() => theme.overrideTokens(OVERRIDE_SOURCE, this.skin.tokens), 'web-enhanced: skin token layer');
        }
    }
    /** Whether the theme service is composed (the skin page's availability). */
    get available() {
        return this.theme !== undefined;
    }
    /** The active skin definition. */
    getSkin() {
        return this.skin;
    }
    /**
     * Switch the skin: persist the choice and replace the override layer.
     * @param id - a {@link SKIN_IDS} member.
     */
    setSkin(id) {
        const next = skinOf(id);
        if (next === this.skin)
            return;
        this.skin = next;
        try {
            localStorage.setItem(SKIN_STORAGE_KEY, next.id);
        }
        catch {
            // See the constructor: a storage denial costs persistence, not the switch.
        }
        this.theme?.overrideTokens(OVERRIDE_SOURCE, next.tokens);
    }
    /** The resolved color scheme (drives the swatch preview's active half). */
    isDark() {
        return this.theme?.getTheme().active.colorScheme === 'dark';
    }
    /**
     * Subscribe to theme changes (scheme flips while the preference rides
     * `system`, or later override layers re-stacking).
     * @param ctx - client root context (the listener is an effect).
     * @param listener - invoked with the resolved dark flag on every change.
     * @returns the disposer.
     */
    onChange(ctx, listener) {
        if (this.theme === undefined)
            return () => { };
        return ctx.effect(() => ctx.on('theme/change', () => { listener(this.isDark()); }), 'web-enhanced: skin scheme sync');
    }
}
