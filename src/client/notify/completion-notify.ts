/**
 * Completion notifications: the "work is done" alert system.
 *
 * The client half watches the session list snapshot — the same running bit
 * that drives the sidebar's green completion reminder — and turns each
 * `running: true → false` edge into an optional chime and/or an OS
 * notification. A session that is already idle when the page loads only
 * seeds the baseline, so opening the app never replays old completions.
 *
 * Two browser capabilities are optional by nature:
 * - sound is synthesized with Web Audio (no asset, and the user gesture that
 *   sent the prompt has already unlocked audio on the page);
 * - the system popup uses the Notification API, whose permission browsers
 *   only grant from a user gesture — the Settings panel owns that button.
 *
 * Preferences are browser-local (localStorage), like the skin choice: nothing
 * on the host needs to know about them, and each browser can keep its own
 * notification policy.
 * @module dsh-web-enhanced/src/client/notify/completion-notify
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { Translate } from '../locale-keys.ts'
import type { Cell } from '../stores.ts'

/** localStorage key carrying the notification preferences. */
export const COMPLETION_NOTIFY_SETTINGS_KEY = 'dsh.webEnhanced.completionNotify.v1'

/** Durable notification preferences. */
export interface CompletionNotifySettings {
  /** Master switch for the whole feature. */
  readonly enabled: boolean
  /** Play the Web Audio chime when a run finishes. */
  readonly sound: boolean
  /** Show the OS notification when a run finishes. */
  readonly popup: boolean
  /** Suppress both alerts while the page is visible and focused. */
  readonly onlyBackground: boolean
}

/** The shipped defaults: everything on, even in the foreground. */
export const DEFAULT_COMPLETION_NOTIFY_SETTINGS: CompletionNotifySettings = {
  enabled: true,
  sound: true,
  popup: true,
  onlyBackground: false,
}

/**
 * Defensive localStorage revival: each field falls back to the shipped
 * default independently, so a hand-edited or older stored value cannot wedge
 * the feature. Non-object payloads (or arrays) are rejected wholesale.
 * @param raw - the parsed stored value.
 * @returns valid settings, or undefined when the envelope itself is wrong.
 */
export function reviveCompletionNotifySettings(raw: unknown): CompletionNotifySettings | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined
  const record = raw as Record<string, unknown>
  const booleanOf = (key: string, fallback: boolean): boolean => {
    const value = record[key]
    return typeof value === 'boolean' ? value : fallback
  }
  return {
    enabled: booleanOf('enabled', DEFAULT_COMPLETION_NOTIFY_SETTINGS.enabled),
    sound: booleanOf('sound', DEFAULT_COMPLETION_NOTIFY_SETTINGS.sound),
    popup: booleanOf('popup', DEFAULT_COMPLETION_NOTIFY_SETTINGS.popup),
    onlyBackground: booleanOf('onlyBackground', DEFAULT_COMPLETION_NOTIFY_SETTINGS.onlyBackground),
  }
}

/** The two fields the session-list watcher reads from a session row. */
export interface RunningSessionLike {
  readonly id: string
  readonly running: boolean
  /** Human-facing row title for the notification body (optional in tests). */
  readonly title?: string
}

/**
 * True→false running-edge detector over successive session-list snapshots.
 *
 * The first observation of a session records its bit without emitting — the
 * alert is for work the page WATCHED finish, not for work that finished
 * before the plugin was there to see it. Sessions that leave the list drop
 * their memory; if they return running and then finish, that is a new
 * watched run.
 */
export class CompletionTracker {
  private readonly previous = new Map<string, boolean>()

  /**
   * Observe one full session-list snapshot.
   * @param sessions - every row of the list.
   * @returns the rows that were running before and are now idle.
   */
  observe(sessions: Iterable<RunningSessionLike>): readonly RunningSessionLike[] {
    const completed: RunningSessionLike[] = []
    const seen = new Set<string>()
    for (const session of sessions) {
      seen.add(session.id)
      const wasRunning = this.previous.get(session.id)
      if (wasRunning === undefined) {
        this.previous.set(session.id, session.running)
        continue
      }
      if (wasRunning && !session.running) completed.push(session)
      this.previous.set(session.id, session.running)
    }
    for (const id of [...this.previous.keys()]) {
      if (!seen.has(id)) this.previous.delete(id)
    }
    return completed
  }

  /** Drop the whole baseline (plugin re-mount / a fresh page generation). */
  reset(): void {
    this.previous.clear()
  }
}

/** Which alert channels one completed run should use; null means stay quiet. */
export interface CompletionDelivery {
  readonly sound: boolean
  readonly popup: boolean
}

/**
 * Fold settings and page visibility into one delivery decision.
 *
 * Pure and exported for tests: `onlyBackground` alone does not force an
 * alert when every channel is disabled, and the master switch wins over the
 * per-channel toggles.
 * @param settings - the current preferences.
 * @param hidden - whether the document is currently hidden.
 * @returns the channels to fire, or null for none.
 */
export function completionDelivery(
  settings: CompletionNotifySettings,
  hidden: boolean,
): CompletionDelivery | null {
  if (!settings.enabled) return null
  if (settings.onlyBackground && !hidden) return null
  if (!settings.sound && !settings.popup) return null
  return { sound: settings.sound, popup: settings.popup }
}

/** Browser notification permission folded with "this browser has no API". */
export type SystemNotificationPermission = 'unsupported' | 'default' | 'granted' | 'denied'

/** One OS notification to show. */
export interface SystemNotificationRequest {
  readonly title: string
  readonly body?: string
  readonly tag?: string
  readonly onClick?: () => void
}

/** The structural Notification face the notifier consumes. */
export interface SystemNotificationApi {
  readonly supported: boolean
  permission(): SystemNotificationPermission
  requestPermission(): Promise<SystemNotificationPermission>
  /**
   * Show one OS notification.
   * @param request - title, optional body/tag, and the click action.
   * @returns whether a notification was actually shown (permission held).
   */
  show(request: SystemNotificationRequest): boolean
}

/** The minimal Notification constructor shape taken from the page. */
interface BrowserNotificationConstructor {
  new(title: string, options?: NotificationOptions): {
    onclick: ((event: Event) => void) | null
    close(): void
  }
  readonly permission: string
  requestPermission(): Promise<unknown> | unknown
}

/** The no-Notification-API fallback. */
const UNSUPPORTED_NOTIFICATION_API: SystemNotificationApi = {
  supported: false,
  permission: () => 'unsupported',
  requestPermission: async () => 'unsupported',
  show: () => false,
}

/** Normalize a DOM permission string (and unknown legacy values) to the union. */
function normalizePermission(value: unknown): SystemNotificationPermission {
  if (value === 'granted' || value === 'denied' || value === 'default') return value
  return 'default'
}

/**
 * Wrap the page's Notification API, if it exists.
 * @param source - the globals carrying the constructor; defaults to `window`.
 * @returns the structural face, or the unsupported fallback.
 */
export function createBrowserNotificationApi(
  source: { readonly Notification?: unknown } = window,
): SystemNotificationApi {
  if (typeof source.Notification !== 'function') return UNSUPPORTED_NOTIFICATION_API
  const Ctor = source.Notification as unknown as BrowserNotificationConstructor
  return {
    supported: true,
    permission: () => normalizePermission(Ctor.permission),
    requestPermission: async () => {
      try {
        const pending = Ctor.requestPermission()
        const result = pending !== null && typeof (pending as PromiseLike<unknown>).then === 'function'
          ? await (pending as PromiseLike<unknown>)
          : pending
        return normalizePermission(result)
      } catch {
        // A throw says nothing definitive about the user's choice.
        return 'default'
      }
    },
    show: (request) => {
      if (Ctor.permission !== 'granted') return false
      try {
        const options: NotificationOptions = {
          ...(request.body === undefined ? {} : { body: request.body }),
          ...(request.tag === undefined ? {} : { tag: request.tag }),
        }
        const notification = new Ctor(request.title, options)
        notification.onclick = () => {
          request.onClick?.()
          notification.close()
        }
        return true
      } catch {
        return false
      }
    },
  }
}

// ── Web Audio chime ───────────────────────────────────────────────────────

/** The AudioParam subset the chime schedules against. */
export interface ChimeAudioParam {
  readonly value: number
  setValueAtTime(value: number, startTime: number): unknown
  linearRampToValueAtTime(value: number, endTime: number): unknown
  exponentialRampToValueAtTime(value: number, endTime: number): unknown
}

/** The oscillator subset the chime schedules against. */
export interface ChimeOscillator {
  readonly frequency: ChimeAudioParam
  connect(destination: unknown): unknown
  start(when?: number): unknown
  stop(when?: number): unknown
}

/** The gain subset the chime schedules against. */
export interface ChimeGain {
  readonly gain: ChimeAudioParam
  connect(destination: unknown): unknown
}

/** The Web Audio context subset the chime schedules against. */
export interface ChimeContext {
  readonly currentTime: number
  readonly destination: unknown
  resume(): void | Promise<unknown>
  createOscillator(): ChimeOscillator
  createGain(): ChimeGain
}

/**
 * Schedule a two-note "done" chime (A5 then E6) through one Web Audio
 * context. Oscillators and gains are created per note so a context already
 * playing something else still gets a complete, independently enveloped
 * chime; every node is stopped, so none of it keeps the context alive.
 * @param context - the live AudioContext.
 */
export function scheduleCompletionChime(context: ChimeContext): void {
  const notes: ReadonlyArray<{ readonly at: number; readonly frequency: number; readonly duration: number }> = [
    { at: 0, frequency: 880, duration: 0.22 },
    { at: 0.18, frequency: 1318.5, duration: 0.3 },
  ]
  for (const note of notes) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const start = context.currentTime + note.at
    const stop = start + note.duration + 0.02
    oscillator.frequency.setValueAtTime(note.frequency, start)
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.22, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(start)
    oscillator.stop(stop)
  }
}

/** Minimal AudioContext constructor shape. */
type BrowserAudioContextConstructor = new () => ChimeContext

/**
 * Build a lazily-initialized chime player from the page's AudioContext.
 *
 * The context is created on first completion (or the Settings test button),
 * not at plugin load, because browsers audit AudioContext creation against
 * user activation — a context minted during boot may never be allowed to
 * resume. Autoplay policy can still suspend the first completion until the
 * page has seen a gesture; sending a prompt is one, and the test button is
 * the explicit path.
 * @param source - the globals carrying the constructors; defaults to `window`.
 * @returns the player, or undefined when Web Audio is unavailable.
 */
export function createBrowserChimePlayer(
  source: { readonly AudioContext?: unknown; readonly webkitAudioContext?: unknown } = window,
): (() => void) | undefined {
  const Ctor = (source.AudioContext ?? source.webkitAudioContext) as unknown
  if (typeof Ctor !== 'function') return undefined
  const AudioCtor = Ctor as BrowserAudioContextConstructor
  let context: ChimeContext | undefined
  return () => {
    try {
      context ??= new AudioCtor()
      const live = context
      // Resume first: scheduling against a suspended context freezes the
      // currentTime, and a delayed resume could then fire the chime at an
      // arbitrary later moment. When resume resolves, the context is live.
      void Promise.resolve(live.resume()).then(
        () => { scheduleCompletionChime(live) },
        () => { /* autoplay denied: the next gesture or retry can still unlock it */ },
      )
    } catch {
      // A missing/blocked AudioContext costs one alert, never a crash.
    }
  }
}

/** The text of one completion notification. */
export interface CompletionNoticeText {
  readonly title: string
  readonly body: string
}

/** Dependencies of the completion notifier (all injected for tests). */
export interface CompletionNotifierDeps {
  readonly settings: { getSnapshot(): CompletionNotifySettings }
  /** Whether the page is currently hidden. */
  readonly hidden: () => boolean
  /** Build the localized notification text for one completed session. */
  readonly text: (session: RunningSessionLike) => CompletionNoticeText
  /** Play the sound channel. */
  readonly chime: () => void
  /**
   * Show the popup channel.
   * @param request - localized text, dedupe tag, and the focus/open action.
   * @returns whether the OS accepted it.
   */
  readonly popup: (request: {
    readonly title: string
    readonly body: string
    readonly tag: string
    readonly onClick: () => void
  }) => boolean
  /** Make the completed session current (the notification click action). */
  readonly openSession: (sessionId: string) => void
}

/**
 * Own the running-edge detector and deliver one completion's alerts.
 *
 * Deliberately not tied to any framework face beyond a `getSnapshot` read:
 * the class stays testable in the node environment, while the page wiring in
 * {@link applyCompletionNotify} supplies the session-list subscription.
 */
export class CompletionNotifier {
  private readonly tracker = new CompletionTracker()

  /** @param deps - the channel implementations and localization. */
  constructor(private readonly deps: CompletionNotifierDeps) {}

  /**
   * Feed one session-list snapshot; deliver alerts for every watched
   * running→idle edge inside it.
   * @param sessions - all rows currently in the list.
   */
  observe(sessions: Iterable<RunningSessionLike>): void {
    const completed = this.tracker.observe(sessions)
    if (completed.length === 0) return
    const delivery = completionDelivery(this.deps.settings.getSnapshot(), this.deps.hidden())
    if (delivery === null) return
    // One chime per snapshot even when a batch of tasks lands together — a
    // chord of overlapping chimes is louder, not more informative.
    if (delivery.sound) this.deps.chime()
    if (!delivery.popup) return
    for (const session of completed) {
      const text = this.deps.text(session)
      this.deps.popup({
        title: text.title,
        body: text.body,
        tag: `dsh-web-enhanced:completion:${session.id}`,
        onClick: () => { this.deps.openSession(session.id) },
      })
    }
  }

  /** Drop the running baseline (used when the plugin effect re-mounts). */
  reset(): void {
    this.tracker.reset()
  }
}

/** The runtime face the Settings panel consumes. */
export interface CompletionNotifyFace {
  /** The durable preference cell (read and write). */
  readonly settings: Cell<CompletionNotifySettings>
  /** Current browser permission state (unsupported included). */
  readonly permission: () => SystemNotificationPermission
  /** Ask the browser for the notification permission. */
  readonly requestPermission: () => Promise<SystemNotificationPermission>
  /** Play the completion chime once (the Settings test button). */
  readonly testSound: () => void
  /**
   * Show one OS notification with the completion title/body.
   * @returns whether it was shown (permission denied returns false).
   */
  readonly testPopup: (title: string, body: string) => boolean
}

/** The outward session-service face the watcher reads. */
interface ClientSessionsFace {
  readonly list: {
    getSnapshot(): {
      readonly byId: Record<string, {
        readonly id: unknown
        readonly running: boolean
        readonly displayTitle: string
      }>
    }
    subscribe(fn: () => void): () => void
  }
  open(id: never): void
}

/**
 * Wire completion notifications into a client context: create the channel
 * adapters, the tracker, and the session-list subscription, and return the
 * settings face for the Settings section.
 * @param ctx - client root context.
 * @param settings - the persisted preference cell.
 * @param t - the web-enhanced translator for notification copy.
 * @returns the face handed to the Settings page.
 */
export function applyCompletionNotify(
  ctx: ClientContext,
  settings: Cell<CompletionNotifySettings>,
  t: Translate,
): CompletionNotifyFace {
  const chime = createBrowserChimePlayer(window)
  const popup = createBrowserNotificationApi(window)
  const sessions = ctx.sessions as unknown as ClientSessionsFace
  const notifier = new CompletionNotifier({
    settings,
    hidden: () => typeof document === 'undefined' ? false : document.hidden,
    text: (session) => ({
      title: t('notify.completeTitle'),
      body: t('notify.completeBody', { title: session.title ?? session.id }),
    }),
    chime: () => { chime?.() },
    popup: (request) => popup.show({
      title: request.title,
      body: request.body,
      tag: request.tag,
      onClick: request.onClick,
    }),
    openSession: (sessionId) => {
      window.focus()
      sessions.open(sessionId as never)
    },
  })
  ctx.effect(() => {
    const list = sessions.list
    const rows = (): readonly RunningSessionLike[] => Object.values(list.getSnapshot().byId).map(entry => ({
      id: String(entry.id),
      running: entry.running,
      title: entry.displayTitle,
    }))
    // Re-mount = a new page generation; old running bits must not leak.
    notifier.reset()
    // Baseline first observation, then subscribe: a completion between the
    // two would otherwise arm without a baseline, but the subscription flush
    // is synchronous and list snapshots are frame-batched, so this window is
    // the same one the sidebar already accepts.
    notifier.observe(rows())
    return list.subscribe(() => { notifier.observe(rows()) })
  }, 'web-enhanced: completion notifications')
  return {
    settings,
    permission: popup.permission,
    requestPermission: popup.requestPermission,
    testSound: () => { chime?.() },
    testPopup: (title, body) => popup.show({
      title,
      body,
      tag: 'dsh-web-enhanced:notification-test',
    }),
  }
}
