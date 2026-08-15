/**
 * Task board: the five status columns, the create form, and the refresh
 * cadence. Two surfaces share the same panel — the full-frame overlay and the
 * workspace view's「任务看板」tab — so the data/logic lives in {@link
 * BoardPanel} and the two wrappers own only their chrome.
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
/** What the chrome-free panel needs from its host surface. */
export interface BoardPanelProps {
    readonly remote: WebEnhancedProps<'shell.overlay'>['remote'];
    readonly workspaces: readonly {
        workspaceId: string;
        title: string;
    }[];
    readonly openSession: (sessionId: string) => void;
    readonly t: WebEnhancedProps<'shell.overlay'>['t'];
}
/** The chrome-free board: error strip, create form, and the five columns. */
export declare function BoardPanel({ remote, workspaces, openSession, t }: BoardPanelProps): import("react").JSX.Element;
/** The task board overlay: the same panel under the full-frame chrome. */
export declare function BoardOverlay({ useOverlay, useWorkspaces, remote, openSession, closeOverlay, t, }: BoardOverlayProps): import("react").JSX.Element | null;
