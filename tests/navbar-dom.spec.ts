// @vitest-environment jsdom
/**
 * DOM rendering guard for the conversation navbar: no matter how many turns
 * a session has, the strip only materializes a bounded number of nodes. The
 * host virtualizes the transcript, so the unbounded part is the per-turn
 * "older turn" dots — this test reproduces a 58-turn session whose DOM only
 * carries the last 10 user rows (older = 48 virtual turns).
 * @module dsh-web-enhanced/tests/navbar-dom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyNavbar } from '../src/client/navbar/index.ts'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => ({ Tooltip: () => null }))

class FakeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', FakeObserver)
  vi.stubGlobal('IntersectionObserver', FakeObserver)
})

const disposers: Array<() => void> = []

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose()
  document.body.innerHTML = ''
})

function t(key: string, args?: Record<string, string>): string {
  return key + (args === undefined ? '' : ' ' + JSON.stringify(args))
}

/** Minimal client-context face the navbar reads. */
function makeCtx(totalTurns: number) {
  return {
    sessions: {
      list: { getSnapshot: () => ({ current: 's1' }) },
      binding: () => ({
        session: {
          getSnapshot: () => ({ hasMore: false, loadingOlder: false }),
          loadOlder: async () => {},
          projections: {
            faceOf: () => ({
              getSnapshot: () => ({ turns: totalTurns }),
              subscribe: () => () => {},
            }),
          },
        },
      }),
    },
    locale: { bind: () => t },
    effect: (cb: () => unknown) => cb(),
    slots: {
      inject: (_slot: string, factory: () => unknown) => factory(),
      register: () => () => {},
    },
  }
}

/**
 * Seed `count` rendered user rows starting at `firstTurn`, each followed by
 * its `data-turn-tail` row, inside a `data-chat-flow` column.
 */
function seedTurns(count: number, firstTurn = 1): void {
  const flow = document.createElement('div')
  flow.setAttribute('data-chat-flow', '')
  document.body.appendChild(flow)
  for (let i = 0; i < count; i++) {
    const row = document.createElement('div')
    row.setAttribute('data-time-hover-root', '')
    const bubble = document.createElement('div')
    bubble.className = 'user-bubble'
    bubble.textContent = `user ${firstTurn + i}`
    row.appendChild(bubble)
    flow.appendChild(row)
    const tail = document.createElement('div')
    tail.setAttribute('data-time-hover-root', '')
    tail.setAttribute('data-turn-tail', String(firstTurn + i))
    flow.appendChild(tail)
  }
}

describe('navbar DOM windowing', () => {
  it('windows 58 fully rendered turns instead of showing every row', () => {
    seedTurns(58, 1)
    const ctx = makeCtx(58)
    disposers.push(applyNavbar(ctx as never))
    const bar = document.querySelector('[data-dsh-we-navbar]') as HTMLElement
    const dots = [...bar.querySelectorAll('[data-we-nav-dot]')].filter(d => !d.hasAttribute('data-virtual-turn'))
    // Active starts at row 0, so the window is half-window + 1; the trailing
    // "more" marker is the extra child.
    expect(dots).toHaveLength(6)
    expect(bar.childElementCount).toBe(7)
  })

  it('folds a 48-turn older backlog into one marker plus six virtual dots', () => {
    seedTurns(10, 49)
    const ctx = makeCtx(58)
    disposers.push(applyNavbar(ctx as never))
    const bar = document.querySelector('[data-dsh-we-navbar]') as HTMLElement
    expect(bar.querySelectorAll('[data-we-nav-older-more]')).toHaveLength(1)
    expect(bar.querySelectorAll('[data-we-nav-dot][data-virtual-turn]')).toHaveLength(6)
    // 1 older-marker + 6 virtual dots + the 10 rendered rows = 17 children.
    expect(bar.childElementCount).toBe(17)
    expect(bar.childElementCount).toBeLessThan(20)
  })
})
