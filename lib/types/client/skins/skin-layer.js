/**
 * Skin layer: the skin system's runtime half. Owns the durable skin choice
 * (localStorage — a browser-local visual preference, like the selected-session
 * key) and stacks the chosen skin's token layer onto the theme service's
 * override stack. The custom background persists as one Blob in IndexedDB
 * (see `background-store.ts`) and lives in the page as an object URL — no
 * long-lived base64 string copies. Re-calling `overrideTokens` with the same
 * source replaces the layer, so switching skins is one call and disposing the
 * plugin (or the empty `none` layer) restores the stock palette exactly.
 *
 * The theme service is read uninjected through a structural face: a
 * deployment composed without it keeps every other feature of this plugin and
 * the skin page reports unavailable instead of failing the entry.
 * @module dsh-web-enhanced/src/client/skins/skin-layer
 */
import { skinOf } from "./themes.js";
import { backgroundStore, dataUrlToBlob } from "./background-store.js";
import css from './skin-bg.module.css';
/** localStorage key carrying the selected skin id. */
export const SKIN_STORAGE_KEY = 'dsh.web-enhanced.skin';
/** Legacy localStorage key of the background data URL; migrates to the blob store. */
export const SKIN_BACKGROUND_KEY = 'dsh.web-enhanced.skin-bg';
/** The layer's identity in the theme override stack (inspection-visible). */
const OVERRIDE_SOURCE = 'dsh-web-enhanced';
/**
 * The skin system runtime: persisted choice plus one override layer on the
 * theme stack. Created once in the client entry; the settings panel talks to
 * it only through {@link SkinFace}.
 */
export class SkinLayer {
    theme;
    store;
    skin;
    backgroundUrl = '';
    backdrop;
    alive = true;
    initStarted = false;
    readyPromise = Promise.resolve();
    /**
     * @param ctx - client root context (the override layer, the background
     * load, the background node, and the `theme/change` listener are effects,
     * released on plugin dispose).
     * @param store - background blob persistence; defaults to the IndexedDB
     * wrapper (tests inject an in-memory double).
     */
    constructor(ctx, store = backgroundStore) {
        this.theme = ctx.get('theme');
        this.store = store;
        let storedSkin = null;
        try {
            storedSkin = localStorage.getItem(SKIN_STORAGE_KEY);
        }
        catch {
            // Private-browsing storage quota denials leave the default choice; the
            // preference simply does not survive a reload.
        }
        this.skin = skinOf(storedSkin ?? 'none');
        if (this.theme !== undefined) {
            const theme = this.theme;
            ctx.effect(() => theme.overrideTokens(OVERRIDE_SOURCE, this.tokensOf()), 'web-enhanced: skin token layer');
        }
        ctx.effect(() => {
            // The persisted background loads asynchronously: the first token stack
            // carries no background (no transparent-base flash), then this load
            // swaps the image in.
            this.readyPromise = this.initBackground();
            return () => {
                this.alive = false;
                this.unmountBackdrop();
                this.releaseBackground();
            };
        }, 'web-enhanced: skin background layer');
    }
    /** Whether the theme service is composed (the skin page's availability). */
    get available() {
        return this.theme !== undefined;
    }
    /** The active skin definition. */
    getSkin() {
        return this.skin;
    }
    /** Resolves once the persisted background has settled; never rejects. */
    ready() {
        return this.readyPromise;
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
        this.theme?.overrideTokens(OVERRIDE_SOURCE, this.tokensOf());
    }
    /** The background image's object URL ('' when none is set). */
    getBackground() {
        return this.backgroundUrl;
    }
    /**
     * Set or clear the custom background: persist the blob, swap the fixed
     * backdrop node, and re-stack the token layer (a set background makes the
     * frame's base paint transparent so the image shows; every content surface
     * stays opaque).
     * @param dataUrl - the image as a data URL, or '' to clear.
     */
    setBackground(dataUrl) {
        if (dataUrl === '') {
            if (this.backgroundUrl === '')
                return;
            this.releaseBackground();
            this.unmountBackdrop();
            void this.store.remove().catch(() => {
                // A storage denial costs persistence, not the live background.
            });
        }
        else {
            const blob = dataUrlToBlob(dataUrl);
            this.releaseBackground();
            this.backgroundUrl = URL.createObjectURL(blob);
            this.mountBackdrop();
            void this.store.put(blob).catch(() => {
                // A storage denial costs persistence, not the live background.
            });
        }
        this.theme?.overrideTokens(OVERRIDE_SOURCE, this.tokensOf());
    }
    /**
     * The token layer to stack: the skin's palette, plus a transparent
     * `--dsw-alias-bg-base` while a background is set (later spread wins over
     * the skin's own base value).
     */
    tokensOf() {
        if (this.backgroundUrl === '')
            return this.skin.tokens;
        return { ...this.skin.tokens, '--dsw-alias-bg-base': { light: 'transparent', dark: 'transparent' } };
    }
    /**
     * Load the persisted background once: a legacy localStorage data URL
     * migrates into the blob store first (best-effort; an undecodable value
     * paints nothing, a failed put retries next session), then the blob is
     * revealed as one object URL plus the transparent-base token layer. A
     * dispose before the load settles leaves the page without a background.
     */
    async initBackground() {
        if (this.initStarted)
            return;
        this.initStarted = true;
        const legacy = this.readLegacyBackground();
        let blob;
        if (legacy !== '') {
            try {
                blob = dataUrlToBlob(legacy);
                await this.store.put(blob);
                try {
                    localStorage.removeItem(SKIN_BACKGROUND_KEY);
                }
                catch {
                    // Keep the key: the migration retries next session.
                }
            }
            catch {
                // Migration failed; the decoded blob still paints this session.
            }
        }
        else {
            try {
                blob = await this.store.get();
            }
            catch {
                // An unreadable store reads as "no background"; a later set rewrites it.
            }
        }
        if (blob === undefined || !this.alive)
            return;
        this.backgroundUrl = URL.createObjectURL(blob);
        this.mountBackdrop();
        this.theme?.overrideTokens(OVERRIDE_SOURCE, this.tokensOf());
    }
    /** The legacy localStorage data URL, '' when absent or unreadable. */
    readLegacyBackground() {
        try {
            return localStorage.getItem(SKIN_BACKGROUND_KEY) ?? '';
        }
        catch {
            // See the constructor: a storage denial costs the persisted background.
            return '';
        }
    }
    /** (Re)build the fixed backdrop under the app frame; a no-op without one set. */
    mountBackdrop() {
        // Node tests have no DOM; the background is a browser-only surface.
        if (typeof document === 'undefined')
            return;
        this.unmountBackdrop();
        if (this.backgroundUrl === '')
            return;
        const image = document.createElement('img');
        image.className = css.image;
        image.alt = '';
        image.src = this.backgroundUrl;
        const veilLight = document.createElement('div');
        veilLight.className = css.veilLight;
        const veilDark = document.createElement('div');
        veilDark.className = css.veilDark;
        const backdrop = document.createElement('div');
        backdrop.className = css.backdrop;
        backdrop.setAttribute('aria-hidden', 'true');
        backdrop.setAttribute('data-dsh-webenhanced-skin-bg', '');
        backdrop.append(image, veilLight, veilDark);
        document.body.prepend(backdrop);
        // The frame's base token turns transparent while a background is set;
        // surfaces that relied on it (notably the composer seat's fade) need an
        // explicit flag so they can repaint with an opaque token instead.
        document.body.dataset.dshWebenhancedSkinBg = 'true';
        this.backdrop = backdrop;
    }
    /** Remove the live backdrop node, if any. */
    unmountBackdrop() {
        this.backdrop?.remove();
        this.backdrop = undefined;
        if (typeof document !== 'undefined')
            delete document.body.dataset.dshWebenhancedSkinBg;
    }
    /** Revoke the live object URL, if any, and clear the background state. */
    releaseBackground() {
        if (this.backgroundUrl === '')
            return;
        URL.revokeObjectURL(this.backgroundUrl);
        this.backgroundUrl = '';
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
