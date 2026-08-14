/**
 * Shared chrome of the two full-frame overlays (task board, git graph).
 *
 * `shell.overlay` is a click-through layer: entries opt into pointer events.
 * This shell is where that opt-in happens, together with the dismissal
 * contract — Escape anywhere, or a click on the backdrop but not inside the
 * panel. Keeping both in one component is what stops the two overlays from
 * drifting apart on keyboard behaviour.
 * @module dsh-web-enhanced/src/client/shell/OverlayShell
 */
import type { ReactNode } from 'react';
/** Props of the overlay shell. */
export interface OverlayShellProps {
    /** Heading shown in the title bar. */
    readonly title: string;
    /** Accessible label of the close button. */
    readonly closeLabel: string;
    /** Dismiss request from Escape, the backdrop, or the close button. */
    readonly onClose: () => void;
    /** Controls rendered next to the title (refresh, create, …). */
    readonly actions?: ReactNode;
    /** `data-testid` of the panel element. */
    readonly testId?: string;
    /** Panel body. */
    readonly children: ReactNode;
}
/** Full-frame overlay chrome: backdrop, panel, title bar, dismissal. */
export declare function OverlayShell({ title, closeLabel, onClose, actions, testId, children }: OverlayShellProps): import("react").JSX.Element;
