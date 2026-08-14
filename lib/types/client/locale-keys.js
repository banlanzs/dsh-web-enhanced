/**
 * Locale key domain of the web-enhanced namespace.
 *
 * The `LocaleNamespaceMap` merge lives here rather than in the plugin entry so
 * that any module importing {@link Translate} also carries the declaration it
 * depends on — a component file that only imported the alias would otherwise
 * see `webEnhanced` as an unknown namespace.
 * @module dsh-web-enhanced/src/client/locale-keys
 */
export {};
