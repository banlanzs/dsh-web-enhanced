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

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client'
import { skinOf, type SkinDefinition } from './themes.ts'

/** localStorage key carrying the selected skin id. */
export const SKIN_STORAGE_KEY = 'dsh.web-enhanced.skin'

/** The layer's identity in the theme override stack (inspection-visible). */
const OVERRIDE_SOURCE = 'dsh-web-enhanced'

/** Structural face of `ctx.theme` — everything the skin layer consumes. */
export interface ThemeFace {
  /** Stack (or replace) one override layer keyed by source. */
  overrideTokens(source: string, tokens: ThemeTokenOverrides): () => void
  /** Current immutable theme snapshot (carries the resolved scheme). */
  getTheme(): { readonly active: { readonly colorScheme: 'light' | 'dark' } }
}

/**
 * The skin system runtime: persisted choice plus one override layer on the
 * theme stack. Created once in the client entry; the settings panel talks to
 * it only through {@link SkinFace}.
 */
export class SkinLayer {
  private readonly theme: ThemeFace | undefined
  private skin: SkinDefinition

  /**
   * @param ctx - client root context (the override layer and the
   * `theme/change` listener are effects, released on plugin dispose).
   */
  constructor(ctx: ClientContext) {
    this.theme = ctx.get('theme' as never) as unknown as ThemeFace | undefined
    let stored: string | null = null
    try {
      stored = localStorage.getItem(SKIN_STORAGE_KEY)
    } catch {
      // Private-browsing storage quota denials leave the default choice; the
      // preference simply does not survive a reload.
    }
    this.skin = skinOf(stored ?? 'none')
    if (this.theme !== undefined) {
      const theme = this.theme
      ctx.effect(() => theme.overrideTokens(OVERRIDE_SOURCE, this.skin.tokens),
        'web-enhanced: skin token layer')
    }
  }

  /** Whether the theme service is composed (the skin page's availability). */
  get available(): boolean {
    return this.theme !== undefined
  }

  /** The active skin definition. */
  getSkin(): SkinDefinition {
    return this.skin
  }

  /**
   * Switch the skin: persist the choice and replace the override layer.
   * @param id - a {@link SKIN_IDS} member.
   */
  setSkin(id: string): void {
    const next = skinOf(id)
    if (next === this.skin) return
    this.skin = next
    try {
      localStorage.setItem(SKIN_STORAGE_KEY, next.id)
    } catch {
      // See the constructor: a storage denial costs persistence, not the switch.
    }
    this.theme?.overrideTokens(OVERRIDE_SOURCE, next.tokens)
  }

  /** The resolved color scheme (drives the swatch preview's active half). */
  isDark(): boolean {
    return this.theme?.getTheme().active.colorScheme === 'dark'
  }

  /**
   * Subscribe to theme changes (scheme flips while the preference rides
   * `system`, or later override layers re-stacking).
   * @param ctx - client root context (the listener is an effect).
   * @param listener - invoked with the resolved dark flag on every change.
   * @returns the disposer.
   */
  onChange(ctx: ClientContext, listener: (dark: boolean) => void): () => void {
    if (this.theme === undefined) return () => {}
    return ctx.effect(() => ctx.on('theme/change', () => { listener(this.isDark()) }),
      'web-enhanced: skin scheme sync')
  }
}

/**
 * The settings panel's view of {@link SkinLayer}: the current choice, the
 * switch gesture, and the live scheme flag.
 */
export interface SkinFace {
  /** Whether skins can apply (theme service composed). */
  readonly available: boolean
  /** The active skin id. */
  readonly current: string
  /** The resolved scheme is dark. */
  readonly dark: boolean
  /**
   * Switch the active skin and report the applied id.
   * @param id - a {@link SKIN_IDS} member.
   */
  apply(id: string): string
  /**
   * Observe scheme changes (the swatch preview follows Appearance flips).
   * @param listener - invoked with the resolved dark flag.
   * @returns the disposer.
   */
  subscribe(listener: (dark: boolean) => void): () => void
}
