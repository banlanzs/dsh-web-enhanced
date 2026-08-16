/**
 * Skin catalog: the selectable full-surface skins. Each skin is one
 * `ThemeTokenOverrides` layer — every value a `{ light, dark }` pair so the
 * skin stays legible under both Appearance preferences (the host owns the
 * scheme; a skin only recolors the alias tokens). Applied through the theme
 * service's override stack, a skin composes with (never replaces) the built-in
 * light/dark palettes, and removing the layer restores the stock UI.
 *
 * `none` carries no tokens: it is the "stock" choice that simply stacks
 * nothing.
 * @module dsh-web-enhanced/src/client/skins/themes
 */
import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client';
/** Selectable skin id. */
export declare const SKIN_IDS: readonly ["none", "ocean", "amber", "forest", "violet"];
/** One selectable skin: id plus its alias-token override layer. */
export interface SkinDefinition {
    /** Skin id — the persisted choice. */
    readonly id: (typeof SKIN_IDS)[number];
    /** Locale key naming the skin. */
    readonly nameKey: `skins.${(typeof SKIN_IDS)[number]}.name`;
    /** Locale key describing the skin. */
    readonly descKey: `skins.${(typeof SKIN_IDS)[number]}.desc`;
    /** Alias-token overrides stacked over the active theme (empty = stock). */
    readonly tokens: ThemeTokenOverrides;
    /** Preview swatches: [background, layer, accent] for the light mode. */
    readonly lightSwatch: readonly [string, string, string];
    /** Preview swatches: [background, layer, accent] for the dark mode. */
    readonly darkSwatch: readonly [string, string, string];
}
/** The catalog, in display order. */
export declare const SKINS: readonly SkinDefinition[];
/** Look up one skin by id (unknown/absent storage resolves to `none`). */
export declare function skinOf(id: string): SkinDefinition;
