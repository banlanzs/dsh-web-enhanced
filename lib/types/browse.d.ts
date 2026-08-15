/**
 * Filesystem browsing outside the workspace.
 *
 * Every other fs capability of this plugin is workspace-scoped and refuses
 * absolute paths — that guard is what keeps file READS inside the project. A
 * mention is a different need: the path the user wants may sit anywhere on the
 * host, and what the composer receives is a STRING, not the bytes. So this
 * module lists directories anywhere and returns nothing but names, kinds, and
 * sizes; reading, writing, and previewing stay behind the workspace root.
 * @module dsh-web-enhanced/src/browse
 */
import type { FsBrowseView } from './types.ts';
/** Listing bound for one browse level (deployment config, not a tunable). */
export interface BrowseLimits {
    readonly maxEntries: number;
}
/**
 * List one absolute directory: subdirectories first, then files, each
 * name-sorted.
 * @param path - absolute directory; omitted or blank lists the host home.
 * @param limits - entry cap.
 * @returns the level, its parent, and the host home for rooting.
 * @throws when the path does not exist or is not a directory.
 */
export declare function browseDirectory(path: string | undefined, limits: BrowseLimits): Promise<FsBrowseView>;
