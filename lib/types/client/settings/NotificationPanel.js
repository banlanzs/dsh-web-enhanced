import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { useCallback, useState, useSyncExternalStore } from 'react';
import css from './NotificationPanel.module.css';
/** Localized permission-state label. */
function permissionLabel(permission, t) {
    switch (permission) {
        case 'granted': return t('notify.permissionGranted');
        case 'denied': return t('notify.permissionDenied');
        case 'default': return t('notify.permissionDefault');
        case 'unsupported': return t('notify.permissionUnsupported');
    }
}
/** The completion-notification settings tab. */
export function NotificationPanel({ notifications, t }) {
    const settings = useSyncExternalStore(notifications.settings.subscribe, notifications.settings.getSnapshot, notifications.settings.getSnapshot);
    const [permission, setPermission] = useState(() => notifications.permission());
    const [requesting, setRequesting] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const patch = useCallback((next) => {
        notifications.settings.update(current => ({ ...current, ...next }));
    }, [notifications]);
    const requestPermission = useCallback(async () => {
        if (requesting)
            return;
        setRequesting(true);
        setFeedback(null);
        const result = await notifications.requestPermission();
        setPermission(result);
        setRequesting(false);
        setFeedback(result === 'granted' ? t('notify.permissionJustGranted') : null);
    }, [notifications, requesting, t]);
    const testSound = useCallback(() => {
        notifications.testSound();
        setFeedback(t('notify.testSoundPlayed'));
    }, [notifications, t]);
    const testPopup = useCallback(() => {
        const shown = notifications.testPopup(t('notify.testPopupTitle'), t('notify.testPopupBody'));
        setFeedback(shown ? t('notify.testPopupShown') : t('notify.testPopupBlocked'));
    }, [notifications, t]);
    const popupReady = permission === 'granted';
    const canRequest = permission === 'default' && !requesting;
    return (_jsxs("section", { className: css.panel, "data-testid": "notification-panel", children: [_jsx("h3", { className: css.title, children: t('notify.title') }), _jsx("p", { className: css.hint, children: t('notify.hint') }), _jsxs("label", { className: css.option, children: [_jsx("input", { type: "checkbox", checked: settings.enabled, onChange: event => { patch({ enabled: event.target.checked }); } }), _jsx("span", { children: t('notify.enabled') })] }), _jsxs("label", { className: css.option, children: [_jsx("input", { type: "checkbox", checked: settings.sound, disabled: !settings.enabled, onChange: event => { patch({ sound: event.target.checked }); } }), _jsx("span", { children: t('notify.sound') })] }), _jsxs("label", { className: css.option, children: [_jsx("input", { type: "checkbox", checked: settings.popup, disabled: !settings.enabled, onChange: event => { patch({ popup: event.target.checked }); } }), _jsx("span", { children: t('notify.popup') })] }), _jsxs("label", { className: css.option, children: [_jsx("input", { type: "checkbox", checked: settings.onlyBackground, disabled: !settings.enabled, onChange: event => { patch({ onlyBackground: event.target.checked }); } }), _jsx("span", { children: t('notify.onlyBackground') })] }), _jsxs("div", { className: css.permission, children: [_jsx("span", { className: css.permissionLabel, children: t('notify.permission') }), _jsx("span", { className: css.permissionValue, children: permissionLabel(permission, t) })] }), _jsxs("div", { className: css.actions, children: [_jsx("button", { type: "button", className: css.button, onClick: testSound, children: t('notify.testSound') }), _jsx("button", { type: "button", className: css.button, disabled: !popupReady, onClick: testPopup, children: t('notify.testPopup') }), _jsx("button", { type: "button", className: css.button, disabled: !canRequest, onClick: () => { void requestPermission(); }, children: t('notify.requestPermission') })] }), feedback !== null && _jsx("p", { className: css.feedback, children: feedback })] }));
}
