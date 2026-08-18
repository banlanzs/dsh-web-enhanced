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
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import type { Translate } from '../locale-keys.ts';
import type { Cell } from '../stores.ts';
/** localStorage key carrying the notification preferences. */
export declare const COMPLETION_NOTIFY_SETTINGS_KEY = "dsh.webEnhanced.completionNotify.v1";
/** Durable notification preferences. */
export interface CompletionNotifySettings {
    /** Master switch for the whole feature. */
    readonly enabled: boolean;
    /** Play the Web Audio chime when a run finishes. */
    readonly sound: boolean;
    /** Show the OS notification when a run finishes. */
    readonly popup: boolean;
    /** Suppress both alerts while the page is visible and focused. */
    readonly onlyBackground: boolean;
}
/** The shipped defaults: everything on, even in the foreground. */
export declare const DEFAULT_COMPLETION_NOTIFY_SETTINGS: CompletionNotifySettings;
/**
 * Defensive localStorage revival: each field falls back to the shipped
 * default independently, so a hand-edited or older stored value cannot wedge
 * the feature. Non-object payloads (or arrays) are rejected wholesale.
 * @param raw - the parsed stored value.
 * @returns valid settings, or undefined when the envelope itself is wrong.
 */
export declare function reviveCompletionNotifySettings(raw: unknown): CompletionNotifySettings | undefined;
/** The two fields the session-list watcher reads from a session row. */
export interface RunningSessionLike {
    readonly id: string;
    readonly running: boolean;
    /** Human-facing row title for the notification body (optional in tests). */
    readonly title?: string;
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
export declare class CompletionTracker {
    private readonly previous;
    /**
     * Observe one full session-list snapshot.
     * @param sessions - every row of the list.
     * @returns the rows that were running before and are now idle.
     */
    observe(sessions: Iterable<RunningSessionLike>): readonly RunningSessionLike[];
    /** Drop the whole baseline (plugin re-mount / a fresh page generation). */
    reset(): void;
}
/** Which alert channels one completed run should use; null means stay quiet. */
export interface CompletionDelivery {
    readonly sound: boolean;
    readonly popup: boolean;
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
export declare function completionDelivery(settings: CompletionNotifySettings, hidden: boolean): CompletionDelivery | null;
/** Browser notification permission folded with "this browser has no API". */
export type SystemNotificationPermission = 'unsupported' | 'default' | 'granted' | 'denied';
/** One OS notification to show. */
export interface SystemNotificationRequest {
    readonly title: string;
    readonly body?: string;
    readonly tag?: string;
    readonly onClick?: () => void;
}
/** The structural Notification face the notifier consumes. */
export interface SystemNotificationApi {
    readonly supported: boolean;
    permission(): SystemNotificationPermission;
    requestPermission(): Promise<SystemNotificationPermission>;
    /**
     * Show one OS notification.
     * @param request - title, optional body/tag, and the click action.
     * @returns whether a notification was actually shown (permission held).
     */
    show(request: SystemNotificationRequest): boolean;
}
/**
 * Wrap the page's Notification API, if it exists.
 * @param source - the globals carrying the constructor; defaults to `window`.
 * @returns the structural face, or the unsupported fallback.
 */
export declare function createBrowserNotificationApi(source?: {
    readonly Notification?: unknown;
}): SystemNotificationApi;
/** The AudioParam subset the chime schedules against. */
export interface ChimeAudioParam {
    readonly value: number;
    setValueAtTime(value: number, startTime: number): unknown;
    linearRampToValueAtTime(value: number, endTime: number): unknown;
    exponentialRampToValueAtTime(value: number, endTime: number): unknown;
}
/** The oscillator subset the chime schedules against. */
export interface ChimeOscillator {
    readonly frequency: ChimeAudioParam;
    connect(destination: unknown): unknown;
    start(when?: number): unknown;
    stop(when?: number): unknown;
}
/** The gain subset the chime schedules against. */
export interface ChimeGain {
    readonly gain: ChimeAudioParam;
    connect(destination: unknown): unknown;
}
/** The Web Audio context subset the chime schedules against. */
export interface ChimeContext {
    readonly currentTime: number;
    readonly destination: unknown;
    resume(): void | Promise<unknown>;
    createOscillator(): ChimeOscillator;
    createGain(): ChimeGain;
}
/**
 * Schedule a two-note "done" chime (A5 then E6) through one Web Audio
 * context. Oscillators and gains are created per note so a context already
 * playing something else still gets a complete, independently enveloped
 * chime; every node is stopped, so none of it keeps the context alive.
 * @param context - the live AudioContext.
 */
export declare function scheduleCompletionChime(context: ChimeContext): void;
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
export declare function createBrowserChimePlayer(source?: {
    readonly AudioContext?: unknown;
    readonly webkitAudioContext?: unknown;
}): (() => void) | undefined;
/** The text of one completion notification. */
export interface CompletionNoticeText {
    readonly title: string;
    readonly body: string;
}
/** Dependencies of the completion notifier (all injected for tests). */
export interface CompletionNotifierDeps {
    readonly settings: {
        getSnapshot(): CompletionNotifySettings;
    };
    /** Whether the page is currently hidden. */
    readonly hidden: () => boolean;
    /** Build the localized notification text for one completed session. */
    readonly text: (session: RunningSessionLike) => CompletionNoticeText;
    /** Play the sound channel. */
    readonly chime: () => void;
    /**
     * Show the popup channel.
     * @param request - localized text, dedupe tag, and the focus/open action.
     * @returns whether the OS accepted it.
     */
    readonly popup: (request: {
        readonly title: string;
        readonly body: string;
        readonly tag: string;
        readonly onClick: () => void;
    }) => boolean;
    /** Make the completed session current (the notification click action). */
    readonly openSession: (sessionId: string) => void;
}
/**
 * Own the running-edge detector and deliver one completion's alerts.
 *
 * Deliberately not tied to any framework face beyond a `getSnapshot` read:
 * the class stays testable in the node environment, while the page wiring in
 * {@link applyCompletionNotify} supplies the session-list subscription.
 */
export declare class CompletionNotifier {
    private readonly deps;
    private readonly tracker;
    /** @param deps - the channel implementations and localization. */
    constructor(deps: CompletionNotifierDeps);
    /**
     * Feed one session-list snapshot; deliver alerts for every watched
     * running→idle edge inside it.
     * @param sessions - all rows currently in the list.
     */
    observe(sessions: Iterable<RunningSessionLike>): void;
    /** Drop the running baseline (used when the plugin effect re-mounts). */
    reset(): void;
}
/** The runtime face the Settings panel consumes. */
export interface CompletionNotifyFace {
    /** The durable preference cell (read and write). */
    readonly settings: Cell<CompletionNotifySettings>;
    /** Current browser permission state (unsupported included). */
    readonly permission: () => SystemNotificationPermission;
    /** Ask the browser for the notification permission. */
    readonly requestPermission: () => Promise<SystemNotificationPermission>;
    /** Play the completion chime once (the Settings test button). */
    readonly testSound: () => void;
    /**
     * Show one OS notification with the completion title/body.
     * @returns whether it was shown (permission denied returns false).
     */
    readonly testPopup: (title: string, body: string) => boolean;
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
export declare function applyCompletionNotify(ctx: ClientContext, settings: Cell<CompletionNotifySettings>, t: Translate): CompletionNotifyFace;
