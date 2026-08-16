/**
 * Navbar pure-logic behavior: pin persistence and the sliding-window math.
 * The DOM strip itself is browser-only (see the skin backdrop precedent).
 * @module dsh-web-enhanced/tests/navbar
 */

import { describe, expect, it } from 'vitest'
import { createPinStore } from '../src/client/navbar/pin-store.ts'
import { NAV_HALF_WINDOW, NAV_WINDOW, navWindow, olderNodeCount } from '../src/client/navbar/window.ts'

/** In-memory storage double. */
function memoryStorage(): { store: Map<string, string>; seam: { getItem(k: string): string | null; setItem(k: string, v: string): void } } {
  const store = new Map<string, string>()
  return {
    store,
    seam: {
      getItem: key => store.get(key) ?? null,
      setItem: (key, value) => { store.set(key, value) },
    },
  }
}

describe('pin store', () => {
  it('toggles membership and reports the resulting state', () => {
    const { seam } = memoryStorage()
    const pins = createPinStore(seam)
    expect(pins.toggle('s', 'm1', 'hello', 3)).toBe(true)
    expect(pins.isPinned('s', 'm1')).toBe(true)
    expect(pins.toggle('s', 'm1', 'hello', 3)).toBe(false)
    expect(pins.isPinned('s', 'm1')).toBe(false)
  })

  it('keeps sessions isolated and answers turn lookups', () => {
    const { seam } = memoryStorage()
    const pins = createPinStore(seam)
    pins.toggle('s1', 'm1', 'first user text', 1)
    pins.toggle('s1', 'm2', 'second user text', 4)
    pins.toggle('s2', 'm9', 'other session', 1)
    expect(pins.isPinned('s1', 'm1')).toBe(true)
    expect(pins.isPinned('s2', 'm1')).toBe(false)
    expect(pins.turnsOf('s1')).toEqual(new Set([1, 4]))
    expect(pins.textOfTurn('s1', 4)).toBe('second user text')
    expect(pins.textOf('s2', 'm9')).toBe('other session')
    expect(pins.textOfTurn('s1', 9)).toBeUndefined()
  })

  it('reads corrupted or malformed storage as empty', () => {
    const { store, seam } = memoryStorage()
    const pins = createPinStore(seam)
    store.set('dsh.web-enhanced.navbar.pins:s', '{ not json')
    expect(pins.load('s')).toEqual([])
    store.set('dsh.web-enhanced.navbar.pins:s', JSON.stringify([{ messageId: 'ok', text: 't', ts: 1 }, { nope: true }, 'str']))
    expect(pins.load('s')).toEqual([{ messageId: 'ok', text: 't', ts: 1 }])
  })
})

describe('olderNodeCount', () => {
  it('derives older turns from the first rendered turn number', () => {
    expect(olderNodeCount(1, 12, 10)).toBe(0)
    expect(olderNodeCount(6, 30, 10)).toBe(5)
    expect(olderNodeCount(50, 80, 10)).toBe(49)
  })

  it('falls back to the whole-log projection when the first turn is unknown', () => {
    expect(olderNodeCount(null, 30, 10)).toBe(20)
    expect(olderNodeCount(null, 3, 10)).toBe(0)
    expect(olderNodeCount(null, 12, 0)).toBe(0)
  })
})

describe('navWindow', () => {
  it('shows everything at or under the window size', () => {
    expect(navWindow(0, -1, [])).toEqual({ lo: 0, hi: -1 })
    expect(navWindow(NAV_WINDOW, 3, [])).toEqual({ lo: 0, hi: NAV_WINDOW - 1 })
  })

  it('windows around the active index and clamps at the ends', () => {
    expect(navWindow(30, 15, [])).toEqual({ lo: 15 - NAV_HALF_WINDOW, hi: 15 + NAV_HALF_WINDOW })
    expect(navWindow(30, 1, [])).toEqual({ lo: 0, hi: 1 + NAV_HALF_WINDOW })
    expect(navWindow(30, 29, [])).toEqual({ lo: 29 - NAV_HALF_WINDOW, hi: 29 })
    // A missing active anchors at the start instead of centering on -1.
    expect(navWindow(30, -1, [])).toEqual({ lo: 0, hi: NAV_HALF_WINDOW })
  })

  it('stretches to keep every pinned node visible', () => {
    expect(navWindow(30, 15, [0, 29])).toEqual({ lo: 0, hi: 29 })
    expect(navWindow(30, 20, [3])).toEqual({ lo: 3, hi: 25 })
    // Out-of-range pins are ignored, not clamped in.
    expect(navWindow(20, 10, [99, -5])).toEqual({ lo: 5, hi: 15 })
  })
})
