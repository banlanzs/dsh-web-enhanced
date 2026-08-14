/**
 * Branch strip above the composer: the current branch, a switcher over the
 * local branches, and the entry to the commit graph. Rendered only for a
 * session whose workspace is a git repository — an unrelated project should
 * not grow a dead control.
 * @module dsh-web-enhanced/src/client/git/BranchStrip
 */
import type { WebEnhancedProps } from '../contract.ts';
/** Full composed props of the branch strip. */
export type BranchStripProps = WebEnhancedProps<'conversation.input.dock'>;
/** The branch strip: current branch, switcher, and the graph entry. */
export declare function BranchStrip({ useSessions, useWorkspaces, remote, openOverlay, t, }: BranchStripProps): import("react").JSX.Element | null;
