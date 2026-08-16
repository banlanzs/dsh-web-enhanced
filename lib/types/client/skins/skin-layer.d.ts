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
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client';
import { type SkinDefinition } from './themes.ts';
/** localStorage key carrying the selected skin id. */
export declare const SKIN_STORAGE_KEY = "dsh.web-enhanced.skin";
/** localStorage key carrying the custom background image as a data URL. */
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
    private skin;
    private background;
    private backdrop;
    /**
     * @param ctx - client root context (the override layer, the background
     * node, and the `theme/change` listener are effects, released on plugin
     * dispose).
     */
    constructor(ctx: ClientContext);
    /** Whether the theme service is composed (the skin page's availability). */
    get available(): boolean;
    /** The active skin definition. */
    getSkin(): SkinDefinition;
    /**
     * Switch the skin: persist the choice and replace the override layer.
     * @param id - a {@link SKIN_IDS} member.
     */
    setSkin(id: string): void;
    /** The custom background image data URL ('' when none is set). */
    getBackground(): string;
    /**
     * Set or clear the custom background: persist the choice, swap the fixed
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
    /** (Re)build the fixed backdrop under the app frame; a no-op without one set. */
    private mountBackdrop;
    /** Remove the live backdrop node, if any. */
    private unmountBackdrop;
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
    /** The custom background image data URL ('' when none is set). */
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
