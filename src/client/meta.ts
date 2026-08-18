/**
 * Build-time metadata shown in the Settings → About tab.
 *
 * `WEB_ENHANCED_VERSION` must be bumped together with `package.json`'s
 * `version` (the client bundle cannot read the package manifest at runtime).
 * `tests/meta.spec.ts` pins the two equal, so a release with only one side
 * bumped fails `pnpm check` instead of shipping a stale About page.
 * @module dsh-web-enhanced/src/client/meta
 */

/** Plugin version rendered in the About tab. */
export const WEB_ENHANCED_VERSION = '0.20.1'

/** Public repository, rendered as the project-home link. */
export const WEB_ENHANCED_REPOSITORY = 'https://github.com/banlanzs/dsh-web-enhanced'
