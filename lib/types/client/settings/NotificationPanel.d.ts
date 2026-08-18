/**
 * Notification tab of the plugin's Settings page.
 *
 * This feature is entirely browser-local, so unlike the global-prompt or
 * memory tabs it does not read/write a host settings namespace — its
 * preferences live in localStorage and its two channels (Web Audio chime and
 * the OS notification popup) are browser capabilities. The only host-adjacent
 * action is the notification click, which opens the finished session.
 *
 * Notification permission is the one thing the panel cannot set by itself:
 * browsers only accept `Notification.requestPermission()` inside a user
 * gesture, hence the explicit request button and the test buttons that let
 * the user verify both channels in place.
 * @module dsh-web-enhanced/src/client/settings/NotificationPanel
 */
import type { CompletionNotifyFace } from '../notify/completion-notify.ts';
import type { Translate } from '../locale-keys.ts';
/** Props of the tab (a plain child, not a slot registration). */
export interface NotificationPanelProps {
    readonly notifications: CompletionNotifyFace;
    readonly t: Translate;
}
/** The completion-notification settings tab. */
export declare function NotificationPanel({ notifications, t }: NotificationPanelProps): import("react").JSX.Element;
