/**
 * Unit tests for the completion-notification core: settings revival, the
 * running→idle edge detector, the delivery gating (master switch, channel
 * toggles, background-only), the synthesized chime, and the Notification
 * adapter. The tests run in the node environment, so every browser global is
 * injected as a structural double.
 * @module dsh-web-enhanced/tests/completion-notify
 */

import { describe, expect, it, vi } from 'vitest'
import {
  CompletionNotifier, CompletionTracker, completionDelivery,
  createBrowserChimePlayer, createBrowserNotificationApi, DEFAULT_COMPLETION_NOTIFY_SETTINGS,
  reviveCompletionNotifySettings, scheduleCompletionChime,
  type ChimeContext, type ChimeGain, type ChimeOscillator, type SystemNotificationApi,
} from '../src/client/notify/completion-notify.ts'

describe('completion notification settings revival', () => {
  it('keeps a full valid stored value', () => {
    expect(reviveCompletionNotifySettings({
      enabled: false, sound: false, popup: true, onlyBackground: true,
    })).toEqual({ enabled: false, sound: false, popup: true, onlyBackground: true })
  })

  it('fills missing or mistyped fields from the shipped defaults', () => {
    expect(reviveCompletionNotifySettings({ enabled: 1 })).toEqual({
      enabled: true, sound: true, popup: true, onlyBackground: false,
    })
  })

  it('rejects non-object payloads', () => {
    expect(reviveCompletionNotifySettings(null)).toBeUndefined()
    expect(reviveCompletionNotifySettings([])).toBeUndefined()
    expect(reviveCompletionNotifySettings('true')).toBeUndefined()
  })
})

describe('completion delivery gating', () => {
  const defaults = DEFAULT_COMPLETION_NOTIFY_SETTINGS

  it('fires every enabled channel for a visible page by default', () => {
    expect(completionDelivery(defaults, false)).toEqual({ sound: true, popup: true })
  })

  it('is silent when the master switch is off', () => {
    expect(completionDelivery({ ...defaults, enabled: false }, true)).toBeNull()
  })

  it('is silent while the page is visible in background-only mode', () => {
    expect(completionDelivery({ ...defaults, onlyBackground: true }, false)).toBeNull()
    expect(completionDelivery({ ...defaults, onlyBackground: true }, true))
      .toEqual({ sound: true, popup: true })
  })

  it('only keeps the channels that are toggled on', () => {
    expect(completionDelivery({ ...defaults, popup: false }, true)).toEqual({ sound: true, popup: false })
    expect(completionDelivery({ ...defaults, sound: false }, false)).toEqual({ sound: false, popup: true })
    expect(completionDelivery({ ...defaults, sound: false, popup: false }, true)).toBeNull()
  })
})

describe('completion tracker', () => {
  it('seeds the baseline on first observation without emitting', () => {
    const tracker = new CompletionTracker()
    expect(tracker.observe([
      { id: 'idle', running: false },
      { id: 'running', running: true },
    ])).toEqual([])
    expect(tracker.observe([{ id: 'idle', running: false }])).toEqual([])
  })

  it('emits exactly the sessions with a watched running→idle edge', () => {
    const tracker = new CompletionTracker()
    tracker.observe([
      { id: 'a', running: false },
      { id: 'b', running: true },
    ])
    const completed = tracker.observe([
      { id: 'a', running: false },
      { id: 'b', running: false },
    ])
    expect(completed).toEqual([{ id: 'b', running: false }])
  })

  it('does not emit for idle→running or running→running', () => {
    const tracker = new CompletionTracker()
    tracker.observe([{ id: 'a', running: false }])
    tracker.observe([{ id: 'a', running: true }])
    tracker.observe([{ id: 'a', running: true }])
    expect(tracker.observe([{ id: 'a', running: false }])).toHaveLength(1)
  })

  it('treats a removed-then-reappearing running session as a new watched run', () => {
    const tracker = new CompletionTracker()
    tracker.observe([{ id: 'a', running: true }])
    tracker.observe([])
    expect(tracker.observe([{ id: 'a', running: false }])).toEqual([])
    tracker.observe([{ id: 'a', running: true }])
    expect(tracker.observe([{ id: 'a', running: false }])).toEqual([{ id: 'a', running: false }])
  })

  it('reset drops the baseline', () => {
    const tracker = new CompletionTracker()
    tracker.observe([{ id: 'a', running: true }])
    tracker.reset()
    expect(tracker.observe([{ id: 'a', running: false }])).toEqual([])
  })
})

describe('completion notifier', () => {
  it('plays the chime and shows the popup once per completed session', () => {
    const settings = { getSnapshot: () => DEFAULT_COMPLETION_NOTIFY_SETTINGS }
    const chime = vi.fn()
    const popup = vi.fn(() => true)
    const openSession = vi.fn()
    const notifier = new CompletionNotifier({
      settings,
      hidden: () => false,
      text: session => ({ title: 'done', body: session.id }),
      chime,
      popup,
      openSession,
    })
    notifier.observe([{ id: 's1', running: false }])
    notifier.observe([{ id: 's1', running: true }])
    notifier.observe([{ id: 's1', running: false }])

    expect(chime).toHaveBeenCalledTimes(1)
    expect(popup).toHaveBeenCalledTimes(1)
    const request = popup.mock.calls[0][0]
    expect(request.title).toBe('done')
    expect(request.body).toBe('s1')
    expect(request.tag).toContain('s1')
    request.onClick()
    expect(openSession).toHaveBeenCalledWith('s1')
  })

  it('honors the master switch and the background-only preference', () => {
    let settings = DEFAULT_COMPLETION_NOTIFY_SETTINGS
    let hidden = false
    const chime = vi.fn()
    const popup = vi.fn(() => true)
    const notifier = new CompletionNotifier({
      settings: { getSnapshot: () => settings },
      hidden: () => hidden,
      text: () => ({ title: 'done', body: '' }),
      chime,
      popup,
      openSession: () => {},
    })
    const finish = (): void => {
      notifier.observe([{ id: 's', running: true }])
      notifier.observe([{ id: 's', running: false }])
    }
    settings = { ...settings, enabled: false }
    finish()
    expect(chime).not.toHaveBeenCalled()

    settings = { ...settings, enabled: true, onlyBackground: true }
    hidden = false
    finish()
    expect(chime).not.toHaveBeenCalled()

    hidden = true
    finish()
    expect(chime).toHaveBeenCalledTimes(1)
    expect(popup).toHaveBeenCalledTimes(1)
  })

  it('chimes once even when several sessions finish in one snapshot', () => {
    const chime = vi.fn()
    const popup = vi.fn(() => true)
    const notifier = new CompletionNotifier({
      settings: { getSnapshot: () => DEFAULT_COMPLETION_NOTIFY_SETTINGS },
      hidden: () => false,
      text: session => ({ title: 'done', body: session.id }),
      chime,
      popup,
      openSession: () => {},
    })
    notifier.observe([
      { id: 'a', running: true },
      { id: 'b', running: true },
    ])
    notifier.observe([
      { id: 'a', running: false },
      { id: 'b', running: false },
    ])
    expect(chime).toHaveBeenCalledTimes(1)
    expect(popup).toHaveBeenCalledTimes(2)
    expect(popup.mock.calls[0][0].tag).toContain('a')
    expect(popup.mock.calls[1][0].tag).toContain('b')
  })

  it('keeps an already-idle session quiet on first observation', () => {
    const chime = vi.fn()
    const popup = vi.fn(() => true)
    const notifier = new CompletionNotifier({
      settings: { getSnapshot: () => DEFAULT_COMPLETION_NOTIFY_SETTINGS },
      hidden: () => true,
      text: () => ({ title: 'done', body: '' }),
      chime,
      popup,
      openSession: () => {},
    })
    notifier.observe([{ id: 'old', running: false }])
    expect(chime).not.toHaveBeenCalled()
    expect(popup).not.toHaveBeenCalled()
  })
})

describe('completion chime', () => {
  class FakeParam {
    value = 0
    setValueAtTime = vi.fn()
    linearRampToValueAtTime = vi.fn()
    exponentialRampToValueAtTime = vi.fn()
  }

  class FakeOscillator implements ChimeOscillator {
    readonly frequency = new FakeParam()
    connect = vi.fn()
    start = vi.fn()
    stop = vi.fn()
  }

  class FakeGain implements ChimeGain {
    readonly gain = new FakeParam()
    connect = vi.fn()
  }

  function makeContext(): ChimeContext & { oscillators: FakeOscillator[]; gains: FakeGain[] } {
    const oscillators: FakeOscillator[] = []
    const gains: FakeGain[] = []
    return {
      currentTime: 12,
      destination: {},
      resume: vi.fn(async () => {}),
      createOscillator: vi.fn(() => {
        const oscillator = new FakeOscillator()
        oscillators.push(oscillator)
        return oscillator
      }),
      createGain: vi.fn(() => {
        const gain = new FakeGain()
        gains.push(gain)
        return gain
      }),
      oscillators,
      gains,
    }
  }

  it('schedules two enveloped notes through the supplied context', () => {
    const context = makeContext()
    scheduleCompletionChime(context)
    expect(context.createOscillator).toHaveBeenCalledTimes(2)
    expect(context.createGain).toHaveBeenCalledTimes(2)
    for (const oscillator of context.oscillators) {
      expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledOnce()
      expect(oscillator.connect).toHaveBeenCalledOnce()
      expect(oscillator.start).toHaveBeenCalledOnce()
      expect(oscillator.stop).toHaveBeenCalledOnce()
    }
    for (const gain of context.gains) {
      expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0, expect.any(Number))
      expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledOnce()
      expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledOnce()
      expect(gain.connect).toHaveBeenCalledOnce()
    }
  })

  it('creates the AudioContext lazily and schedules after resume', async () => {
    const oscillators: FakeOscillator[] = []
    class FakeAudioContext {
      currentTime = 1
      destination = {}
      resume = vi.fn(async () => {})
      createOscillator = vi.fn(() => {
        const oscillator = new FakeOscillator()
        oscillators.push(oscillator)
        return oscillator
      })
      createGain = vi.fn(() => new FakeGain())
    }
    const play = createBrowserChimePlayer({ AudioContext: FakeAudioContext })
    expect(play).toBeTypeOf('function')
    play?.()
    await Promise.resolve()
    await Promise.resolve()
    expect(oscillators).toHaveLength(2)
  })

  it('returns undefined when the page has no AudioContext', () => {
    expect(createBrowserChimePlayer({})).toBeUndefined()
  })
})

describe('browser notification adapter', () => {
  function makeApi(permission: string): SystemNotificationApi & { shown: FakeNotification[] } {
    const shown: FakeNotification[] = []
    class Fake {
      static permission = permission
      static requestPermission = vi.fn(async () => 'granted')
      onclick: ((event: Event) => void) | null = null
      close = vi.fn()
      constructor(title: string, options?: NotificationOptions) {
        const instance = new FakeNotification(title, options)
        shown.push(instance)
        return instance as FakeNotification & this
      }
    }
    const api = createBrowserNotificationApi({ Notification: Fake })
    return { ...api, shown }
  }

  class FakeNotification {
    onclick: ((event: Event) => void) | null = null
    readonly options: NotificationOptions | undefined
    close = vi.fn()
    constructor(readonly title: string, options?: NotificationOptions) {
      this.options = options
    }
  }

  it('returns the unsupported fallback without a Notification constructor', async () => {
    const api = createBrowserNotificationApi({})
    expect(api.supported).toBe(false)
    expect(api.permission()).toBe('unsupported')
    expect(await api.requestPermission()).toBe('unsupported')
    expect(api.show({ title: 'x' })).toBe(false)
  })

  it('shows a tagged notification and wires the click action', () => {
    const onClick = vi.fn()
    const { shown, ...api } = makeApi('granted')
    expect(api.show({ title: 'done', body: 'body', tag: 't1', onClick })).toBe(true)
    expect(shown).toHaveLength(1)
    expect(shown[0].title).toBe('done')
    expect(shown[0].options).toEqual({ body: 'body', tag: 't1' })
    expect(onClick).not.toHaveBeenCalled()
    shown[0].onclick?.(new Event('click'))
    expect(onClick).toHaveBeenCalledOnce()
    expect(shown[0].close).toHaveBeenCalledOnce()
  })

  it('refuses to show while permission is not granted', () => {
    const { shown, ...api } = makeApi('default')
    expect(api.show({ title: 'x' })).toBe(false)
    expect(shown).toHaveLength(0)
    expect(api.permission()).toBe('default')
  })
})
