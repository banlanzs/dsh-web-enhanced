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

import { useCallback, useState, useSyncExternalStore } from 'react'
import type {
  CompletionNotifyFace, CompletionNotifySettings, SystemNotificationPermission,
} from '../notify/completion-notify.ts'
import type { Translate } from '../locale-keys.ts'
import css from './NotificationPanel.module.css'

/** Props of the tab (a plain child, not a slot registration). */
export interface NotificationPanelProps {
  readonly notifications: CompletionNotifyFace
  readonly t: Translate
}

/** Localized permission-state label. */
function permissionLabel(
  permission: SystemNotificationPermission,
  t: Translate,
): string {
  switch (permission) {
    case 'granted': return t('notify.permissionGranted')
    case 'denied': return t('notify.permissionDenied')
    case 'default': return t('notify.permissionDefault')
    case 'unsupported': return t('notify.permissionUnsupported')
  }
}

/** The completion-notification settings tab. */
export function NotificationPanel({ notifications, t }: NotificationPanelProps) {
  const settings = useSyncExternalStore(
    notifications.settings.subscribe,
    notifications.settings.getSnapshot,
    notifications.settings.getSnapshot,
  )
  const [permission, setPermission] = useState<SystemNotificationPermission>(
    () => notifications.permission(),
  )
  const [requesting, setRequesting] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const patch = useCallback((next: Partial<CompletionNotifySettings>): void => {
    notifications.settings.update(current => ({ ...current, ...next }))
  }, [notifications])

  const requestPermission = useCallback(async (): Promise<void> => {
    if (requesting) return
    setRequesting(true)
    setFeedback(null)
    const result = await notifications.requestPermission()
    setPermission(result)
    setRequesting(false)
    setFeedback(result === 'granted' ? t('notify.permissionJustGranted') : null)
  }, [notifications, requesting, t])

  const testSound = useCallback((): void => {
    notifications.testSound()
    setFeedback(t('notify.testSoundPlayed'))
  }, [notifications, t])

  const testPopup = useCallback((): void => {
    const shown = notifications.testPopup(t('notify.testPopupTitle'), t('notify.testPopupBody'))
    setFeedback(shown ? t('notify.testPopupShown') : t('notify.testPopupBlocked'))
  }, [notifications, t])

  const popupReady = permission === 'granted'
  const canRequest = permission === 'default' && !requesting

  return (
    <section className={css.panel} data-testid="notification-panel">
      <h3 className={css.title}>{t('notify.title')}</h3>
      <p className={css.hint}>{t('notify.hint')}</p>

      <label className={css.option}>
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={event => { patch({ enabled: event.target.checked }) }}
        />
        <span>{t('notify.enabled')}</span>
      </label>
      <label className={css.option}>
        <input
          type="checkbox"
          checked={settings.sound}
          disabled={!settings.enabled}
          onChange={event => { patch({ sound: event.target.checked }) }}
        />
        <span>{t('notify.sound')}</span>
      </label>
      <label className={css.option}>
        <input
          type="checkbox"
          checked={settings.popup}
          disabled={!settings.enabled}
          onChange={event => { patch({ popup: event.target.checked }) }}
        />
        <span>{t('notify.popup')}</span>
      </label>
      <label className={css.option}>
        <input
          type="checkbox"
          checked={settings.onlyBackground}
          disabled={!settings.enabled}
          onChange={event => { patch({ onlyBackground: event.target.checked }) }}
        />
        <span>{t('notify.onlyBackground')}</span>
      </label>

      <div className={css.permission}>
        <span className={css.permissionLabel}>{t('notify.permission')}</span>
        <span className={css.permissionValue}>{permissionLabel(permission, t)}</span>
      </div>

      <div className={css.actions}>
        <button
          type="button"
          className={css.button}
          onClick={testSound}
        >
          {t('notify.testSound')}
        </button>
        <button
          type="button"
          className={css.button}
          disabled={!popupReady}
          onClick={testPopup}
        >
          {t('notify.testPopup')}
        </button>
        <button
          type="button"
          className={css.button}
          disabled={!canRequest}
          onClick={() => { void requestPermission() }}
        >
          {t('notify.requestPermission')}
        </button>
      </div>

      {feedback !== null && <p className={css.feedback}>{feedback}</p>}
    </section>
  )
}
