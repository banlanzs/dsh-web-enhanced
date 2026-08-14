/**
 * Git graph overlay: branch lanes and commit history for the current
 * session's workspace. Registered into `shell.overlay` and rendered only
 * while the overlay state selects it, so an unopened graph costs one
 * subscription and nothing else.
 * @module dsh-web-enhanced/src/client/git/GraphOverlay
 */
import type { WebEnhancedProps } from '../contract.ts';
/** Full composed props of the graph overlay. */
export type GraphOverlayProps = WebEnhancedProps<'shell.overlay'>;
/** The git graph overlay. */
export declare function GraphOverlay({ useOverlay, useSessions, useWorkspaces, remote, closeOverlay, t, }: GraphOverlayProps): import("react").JSX.Element | null;
