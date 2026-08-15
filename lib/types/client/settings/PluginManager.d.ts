/**
 * Installed-plugin management: list, update, remove.
 *
 * The host's own `pluginInventory` service lists the LOADER TREE and states
 * plainly that it cannot mutate anything. This surface answers a different
 * question — what the profile has INSTALLED — because that is the set `pnpm`
 * can act on. The two do not coincide: one npm package can contribute several
 * loader rows, and the profile template's bundles are loader rows that no
 * dependency provides at all.
 *
 * Every mutation is confirmed before it runs, and every success says the same
 * thing: it takes effect on the next start. Nothing here can change the running
 * tree, because Cordis composed that tree at boot.
 * @module dsh-web-enhanced/src/client/settings/PluginManager
 */
import type { PluginView, WebEnhancedRemote } from '../contract.ts';
import type { Translate } from '../locale-keys.ts';
/** Props of the manager (a plain child, not a slot registration). */
export interface PluginManagerProps {
    readonly remote: WebEnhancedRemote;
    readonly t: Translate;
}
/**
 * Describe what a row is in the layer stack.
 *
 * Three distinct states, not two: a package can be installed without declaring
 * `dsh.bundle` (a plain library), and one that declares it can still be absent
 * from the list if the manifest was edited by hand.
 * @param plugin - the row.
 * @param t - translate.
 * @returns the tag text.
 */
export declare function layerTag(plugin: PluginView, t: Translate): string;
/**
 * Which confirmation a pending mutation asks for.
 *
 * Removing the row that IS this plugin is its own branch, not a wording
 * variation: the consequence — no settings page, no board, no graph after the
 * next start, and no way back except the command line — is not something the
 * ordinary removal sentence conveys.
 * @param action - the pending action.
 * @param plugin - the row it targets.
 * @returns the locale key of the confirmation text.
 */
export declare function confirmKeyOf(action: 'remove' | 'update', plugin: PluginView): 'plugins.confirmUpdate' | 'plugins.confirmRemove' | 'plugins.confirmRemoveSelf';
/** Installed-plugin management. */
export declare function PluginManager({ remote, t }: PluginManagerProps): import("react").JSX.Element;
