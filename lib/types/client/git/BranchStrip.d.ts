/**
 * Branch switcher in the session header's action row (titleCluster): the
 * current branch, a switcher over the local branches, and the dirty-tree
 * confirmation. Rendered only for a session whose workspace is a git
 * repository — an unrelated project should not grow a dead control.
 * @module dsh-web-enhanced/src/client/git/BranchStrip
 */
import type { GitBranchesResult, GitStatusEntry, WebEnhancedProps } from '../contract.ts';
/** Full composed props of the branch strip. */
export type BranchStripProps = WebEnhancedProps<'conversation.session.header.actions'>;
/** How much uncommitted work a checkout would carry along. */
export interface DirtySummary {
    readonly total: number;
    /** Entries git tracks — these are the ones a conflicting checkout refuses over. */
    readonly tracked: number;
    /** Untracked entries; they only block when the target branch has that path. */
    readonly untracked: number;
}
/**
 * Summarize a porcelain status for the switch warning.
 *
 * Tracked and untracked are counted apart because they fail differently: git
 * refuses a checkout whose target changes a file the work tree modified, while
 * an untracked file only collides when the target branch happens to carry the
 * same path.
 * @param entries - porcelain v1 entries.
 * @returns the counts.
 */
export declare function dirtySummary(entries: readonly GitStatusEntry[]): DirtySummary;
/**
 * Fetch one workspace's branches through the shared cache.
 *
 * Every session-header mount asks for the same listing, so a hit (settled or
 * in flight) saves a `git branch --list` subprocess. Error listings and
 * rejections are not cached: they are usually transient (or "not a
 * repository", which the strip renders as nothing) and the next mount
 * retries instead of inheriting them.
 * @param workspaceId - the workspace whose branches to list.
 * @param fetch - the remote call, invoked only on a miss.
 * @returns the branch listing result.
 */
export declare function cachedGitBranches(workspaceId: string, fetch: () => Promise<GitBranchesResult>): Promise<GitBranchesResult>;
/**
 * Drop one workspace's cached branch listing.
 *
 * Called after a checkout this plugin performed: a cached listing still names
 * the branch that WAS current.
 * @param workspaceId - the workspace whose listing to drop.
 */
export declare function invalidateBranchesCache(workspaceId: string): void;
/** The branch strip: current branch and the switcher. */
export declare function BranchStrip({ sessionId, useWorkspaces, remote, t, }: BranchStripProps): import("react").JSX.Element | null;
