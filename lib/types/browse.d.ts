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
 * The filesystem roots a browser may jump to.
 *
 * POSIX has exactly one and walking up reaches it, so the list is empty
 * there — an affordance that only ever offers `/` is noise. Windows has one
 * root PER DRIVE with no common ancestor above them, so walking up from
 * `C:\Users\me` dead-ends at `C:\` and no other drive is reachable by
 * navigation at all. These jump targets are the only way across.
 *
 * The drives are probed rather than enumerated: Node exposes no drive list
 * without a native binding. The 26 probes run concurrently, so the cost is
 * the slowest one — which for a disconnected network letter can still be a
 * second or two.
 * @returns the roots, or an empty list on POSIX.
 */
export declare function filesystemRoots(): Promise<string[]>;
/**
 * List one absolute directory: subdirectories first, then files, each
 * name-sorted.
 * @param path - absolute directory; omitted or blank lists the host home.
 * @param limits - entry cap.
 * @returns the level, its parent, the host home, and the filesystem roots.
 * @throws when the path does not exist or is not a directory.
 */
export declare function browseDirectory(path: string | undefined, limits: BrowseLimits): Promise<FsBrowseView>;
