/**
 * Locale key domain of the web-enhanced namespace.
 *
 * The `LocaleNamespaceMap` merge lives here rather than in the plugin entry so
 * that any module importing {@link Translate} also carries the declaration it
 * depends on — a component file that only imported the alias would otherwise
 * see `webEnhanced` as an unknown namespace.
 * @module dsh-web-enhanced/src/client/locale-keys
 */

import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { zh } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Web-enhanced feature copy. */
    webEnhanced: keyof typeof zh
  }
}

/** Every key of the Chinese dictionary (the canonical copy). */
export type WebEnhancedKey = keyof typeof zh

/**
 * Translate function of this namespace: the exact type the framework injects
 * as the `t` seat, so a child component's `t` prop and the injected one are
 * one type and keys stay checked all the way down.
 */
export type Translate = TranslateNS<'webEnhanced'>
