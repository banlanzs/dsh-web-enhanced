/**
 * Task board overlay: the five status columns, the create form, and the
 * refresh cadence. Registered into `shell.overlay`; the sidebar entry only
 * flips the shared overlay state.
 *
 * A running task settles on the host (the agent session finishes and the
 * record is written back), so the board polls WHILE it shows a running task
 * and stops as soon as none is left — the status change has no push channel
 * to this plugin, and a permanent timer would poll an idle board forever.
 * @module dsh-web-enhanced/src/client/board/BoardOverlay
 */
import type { WebEnhancedProps } from '../contract.ts';
/** Full composed props of the board overlay. */
export type BoardOverlayProps = WebEnhancedProps<'shell.overlay'>;
/** The task board overlay. */
export declare function BoardOverlay({ useOverlay, useWorkspaces, remote, openSession, closeOverlay, t, }: BoardOverlayProps): import("react").JSX.Element | null;
