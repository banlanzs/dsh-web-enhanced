/**
 * Git graph overlay: branch lanes and commit history for the current
 * session's workspace. Registered into `shell.overlay` and rendered only
 * while the overlay state selects it, so an unopened graph costs one
 * subscription and nothing else.
 *
 * The branch selector here is the GRAPH's own filter: it decides which
 * history the lanes are drawn from and changes nothing in the repository.
 * The composer's branch strip is the other operation — it checks a branch
 * out. Two controls because they are two different questions.
 * @module dsh-web-enhanced/src/client/git/GraphOverlay
 */
import type { WebEnhancedProps } from '../contract.ts';
/** Full composed props of the graph overlay. */
export type GraphOverlayProps = WebEnhancedProps<'shell.overlay'>;
/** The git graph overlay. */
export declare function GraphOverlay({ useOverlay, useSessions, useWorkspaces, remote, closeOverlay, t, }: GraphOverlayProps): import("react").JSX.Element | null;
