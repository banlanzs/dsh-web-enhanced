/**
 * Host-wide file browser behind the composer's mention pickers.
 *
 * The in-project picker is a flat search over the workspace; this is the other
 * half of the same gesture — walking anywhere on the host to name a path that
 * lives outside the project. It lists directories through the plugin's own
 * `fsBrowse` remote (names, kinds, sizes; never content), so the browser works
 * on a Web deployment with no operating-system dialog available. Where the
 * host DOES serve its native directory chooser, folder mode offers it too.
 * @module dsh-web-enhanced/src/client/browse/BrowseOverlay
 */
import type { WebEnhancedProps } from '../contract.ts';
/** Full composed props of the browse overlay. */
export type BrowseOverlayProps = WebEnhancedProps<'shell.overlay'>;
/** Split an absolute path into its navigable ancestors, deepest last. */
export declare function crumbsOf(path: string): {
    readonly name: string;
    readonly path: string;
}[];
/** The host-wide file browser. */
export declare function BrowseOverlay({ useBrowse, remote, closeBrowse, appendMention, t }: BrowseOverlayProps): import("react").JSX.Element | null;
