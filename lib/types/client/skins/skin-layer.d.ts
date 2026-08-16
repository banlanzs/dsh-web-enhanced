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
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client';
import { type SkinDefinition } from './themes.ts';
import { type BackgroundStore } from './background-store.ts';
/** localStorage key carrying the selected skin id. */
export declare const SKIN_STORAGE_KEY = "dsh.web-enhanced.skin";
/** Legacy localStorage key of the background data URL; migrates to the blob store. */
export declare const SKIN_BACKGROUND_KEY = "dsh.web-enhanced.skin-bg";
/** Structural face of `ctx.theme` — everything the skin layer consumes. */
export interface ThemeFace {
    /** Stack (or replace) one override layer keyed by source. */
    overrideTokens(source: string, tokens: ThemeTokenOverrides): () => void;
    /** Current immutable theme snapshot (carries the resolved scheme). */
    getTheme(): {
        readonly active: {
            readonly colorScheme: 'light' | 'dark';
        };
    };
}
/**
 * The skin system runtime: persisted choice plus one override layer on the
 * theme stack. Created once in the client entry; the settings panel talks to
 * it only through {@link SkinFace}.
 */
export declare class SkinLayer {
    private readonly theme;
    private readonly store;
    private skin;
    private backgroundUrl;
    private backdrop;
    private alive;
    private initStarted;
    private readyPromise;
    /**
     * @param ctx - client root context (the override layer, the background
     * load, the background node, and the `theme/change` listener are effects,
     * released on plugin dispose).
     * @param store - background blob persistence; defaults to the IndexedDB
     * wrapper (tests inject an in-memory double).
     */
    constructor(ctx: ClientContext, store?: BackgroundStore);
    /** Whether the theme service is composed (the skin page's availability). */
    get available(): boolean;
    /** The active skin definition. */
    getSkin(): SkinDefinition;
    /** Resolves once the persisted background has settled; never rejects. */
    ready(): Promise<void>;
    /**
     * Switch the skin: persist the choice and replace the override layer.
     * @param id - a {@link SKIN_IDS} member.
     */
    setSkin(id: string): void;
    /** The background image's object URL ('' when none is set). */
    getBackground(): string;
    /**
     * Set or clear the custom background: persist the blob, swap the fixed
     * backdrop node, and re-stack the token layer (a set background makes the
     * frame's base paint transparent so the image shows; every content surface
     * stays opaque).
     * @param dataUrl - the image as a data URL, or '' to clear.
     */
    setBackground(dataUrl: string): void;
    /**
     * The token layer to stack: the skin's palette, plus a transparent
     * `--dsw-alias-bg-base` while a background is set (later spread wins over
     * the skin's own base value).
     */
    private tokensOf;
    /**
     * Load the persisted background once: a legacy localStorage data URL
     * migrates into the blob store first (best-effort; an undecodable value
     * paints nothing, a failed put retries next session), then the blob is
     * revealed as one object URL plus the transparent-base token layer. A
     * dispose before the load settles leaves the page without a background.
     */
    private initBackground;
    /** The legacy localStorage data URL, '' when absent or unreadable. */
    private readLegacyBackground;
    /** (Re)build the fixed backdrop under the app frame; a no-op without one set. */
    private mountBackdrop;
    /** Remove the live backdrop node, if any. */
    private unmountBackdrop;
    /** Revoke the live object URL, if any, and clear the background state. */
    private releaseBackground;
    /** The resolved color scheme (drives the swatch preview's active half). */
    isDark(): boolean;
    /**
     * Subscribe to theme changes (scheme flips while the preference rides
     * `system`, or later override layers re-stacking).
     * @param ctx - client root context (the listener is an effect).
     * @param listener - invoked with the resolved dark flag on every change.
     * @returns the disposer.
     */
    onChange(ctx: ClientContext, listener: (dark: boolean) => void): () => void;
}
/**
 * The settings panel's view of {@link SkinLayer}: the current choice, the
 * switch gesture, and the live scheme flag.
 */
export interface SkinFace {
    /** Whether skins can apply (theme service composed). */
    readonly available: boolean;
    /** The active skin id. */
    readonly current: string;
    /** The resolved scheme is dark. */
    readonly dark: boolean;
    /** The custom background image's object URL, usable as an img src ('' when none). */
    readonly background: string;
    /**
     * Set ('' clears) the custom background image.
     * @param dataUrl - the image as a data URL, or ''.
     */
    setBackground(dataUrl: string): void;
    /**
     * Switch the active skin and report the applied id.
     * @param id - a {@link SKIN_IDS} member.
     */
    apply(id: string): string;
    /**
     * Observe scheme changes (the swatch preview follows Appearance flips).
     * @param listener - invoked with the resolved dark flag.
     * @returns the disposer.
     */
    subscribe(listener: (dark: boolean) => void): () => void;
}
