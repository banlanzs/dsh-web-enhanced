/**
 * Branch strip above the composer: the current branch, a switcher over the
 * local branches, and the entry to the commit graph. Rendered only for a
 * session whose workspace is a git repository — an unrelated project should
 * not grow a dead control.
 * @module dsh-web-enhanced/src/client/git/BranchStrip
 */
import type { GitStatusEntry, WebEnhancedProps } from '../contract.ts';
/** Full composed props of the branch strip. */
export type BranchStripProps = WebEnhancedProps<'conversation.input.dock'>;
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
/** The branch strip: current branch and the switcher. */
export declare function BranchStrip({ useSessions, useWorkspaces, remote, t, }: BranchStripProps): import("react").JSX.Element | null;
