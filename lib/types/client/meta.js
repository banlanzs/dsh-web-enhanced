/**
 * Build-time metadata shown in the Settings → About tab.
 *
 * `WEB_ENHANCED_VERSION` must be bumped together with `package.json`'s
 * `version` (the client bundle cannot read the package manifest at runtime).
 * @module dsh-web-enhanced/src/client/meta
 */
/** Plugin version rendered in the About tab. */
export const WEB_ENHANCED_VERSION = '0.17.2';
/** Public repository, rendered as the project-home link. */
export const WEB_ENHANCED_REPOSITORY = 'https://github.com/banlanzs/dsh-web-enhanced';
