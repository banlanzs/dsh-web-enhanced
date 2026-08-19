/**
 * Build-time metadata shown in the Settings → About tab.
 *
 * `WEB_ENHANCED_VERSION` duplicates `package.json`'s `version` because the
 * client bundle cannot read the package manifest at runtime. `npm version`
 * writes it through the `version` lifecycle script
 * (`scripts/sync-version.mjs`), so both sides land in one commit;
 * `tests/meta.spec.ts` pins them equal, so a hand-edited bump that skips that
 * path still fails `pnpm check` instead of shipping a stale About page.
 * @module dsh-web-enhanced/src/client/meta
 */
/** Plugin version rendered in the About tab. */
export declare const WEB_ENHANCED_VERSION = "0.20.1";
/** Public repository, rendered as the project-home link. */
export declare const WEB_ENHANCED_REPOSITORY = "https://github.com/banlanzs/dsh-web-enhanced";
