// @vitest-environment jsdom
/**
 * DOM guard for the tool-call group collapse. The fixtures mirror the host's
 * real chat flow markup — a `data-chat-flow` column of `data-chat-flow-key` /
 * `data-chat-flow-kind` items — because that markup IS this module's contract:
 * it wraps host rows from the outside and never reads inside a tool view.
 *
 * The real host alternates `assistant-step` (Think) and `tool-call` rows, and
 * the final assistant-step of a turn is the user's answer. These tests pin
 * both facts: runs include the alternating rows, but the answer never folds.
 * @module dsh-web-enhanced/tests/tool-calls-dom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  activityRuns, applyToolCallCollapse, collapseTargets,
} from '../src/client/tool-calls/apply.ts'

const disposers: Array<() => void> = []

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose()
  vi.useRealTimers()
  document.body.innerHTML = ''
  document.head.innerHTML = ''
})

function t(key: string, args?: Record<string, unknown>): string {
  return key + (args === undefined ? '' : ' ' + JSON.stringify(args))
}

/** Minimal client-context face the collapse reads. */
function makeCtx(sessionId = 's1') {
  return {
    sessions: { list: { getSnapshot: () => ({ current: sessionId }) } },
    locale: { bind: () => t },
  }
}

/**
 * Seed a host chat flow. Each spec entry is one flow item's kind; keys are
 * assigned positionally so a run's leading key is stable across renders.
 */
function seedFlow(kinds: readonly string[]): HTMLElement {
  const flow = document.createElement('div')
  flow.setAttribute('data-chat-flow', '')
  document.body.appendChild(flow)
  kinds.forEach((kind, i) => { appendItem(flow, kind, `n${i}`) })
  return flow
}

function appendItem(flow: HTMLElement, kind: string, key: string): HTMLElement {
  const item = document.createElement('div')
  item.setAttribute('data-chat-anchor-key', key)
  item.setAttribute('data-chat-flow-key', key)
  item.setAttribute('data-chat-flow-kind', kind)
  flow.appendChild(item)
  return item
}

/** Inserted headers, in flow order. */
function headers(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[data-we-tool-group]')]
}

function hiddenKeys(): string[] {
  return [...document.querySelectorAll<HTMLElement>('[data-we-tool-hidden]')]
    .map(el => el.getAttribute('data-chat-flow-key') ?? '')
}

/**
 * Flush one update cycle: the MutationObserver callback lands in a microtask,
 * and the render it schedules rides a requestAnimationFrame.
 */
async function flush(): Promise<void> {
  await Promise.resolve()
  vi.advanceTimersByTime(50)
}

function mount(ctx = makeCtx()): void {
  disposers.push(applyToolCallCollapse(ctx as never))
}

describe('activity run grouping', () => {
  it('groups alternating Think/tool rows and splits at boundaries', () => {
    const flow = seedFlow([
      'user', 'assistant-step', 'tool-call', 'assistant-step', 'tool-call',
      'assistant-step', 'turn-tail', 'assistant-step', 'tool-call',
    ])
    const runs = activityRuns([...flow.children] as HTMLElement[])
    expect(runs.map(run => run.map(el => el.getAttribute('data-chat-flow-key')))).toEqual([
      ['n1', 'n2', 'n3', 'n4', 'n5'],
      ['n7', 'n8'],
    ])
  })

  it('keeps the final assistant-step visible when a run collapses', () => {
    const flow = seedFlow(['assistant-step', 'tool-call', 'assistant-step'])
    const run = [...flow.children] as HTMLElement[]
    expect(collapseTargets(run).map(el => el.getAttribute('data-chat-flow-key'))).toEqual(['n0', 'n1'])
    expect(collapseTargets(run.slice(0, 2)).map(el => el.getAttribute('data-chat-flow-key'))).toEqual(['n0', 'n1'])
  })
})

describe('tool-call collapse', () => {
  it('collapses a finished Think/tool run but keeps its final answer visible', () => {
    seedFlow([
      'user', 'assistant-step', 'tool-call', 'assistant-step', 'tool-call',
      'assistant-step', 'turn-tail',
    ])
    mount()

    expect(headers()).toHaveLength(1)
    // n5 is the final answer, so only n1..n4 fold.
    expect(hiddenKeys()).toEqual(['n1', 'n2', 'n3', 'n4'])
    expect(headers()[0]?.hasAttribute('data-we-tool-expanded')).toBe(false)
    expect(headers()[0]?.querySelector('[data-we-tool-count]')?.textContent)
      .toBe('toolCalls.groupCountSettled {"count":4}')
  })

  it('does not wrap a pure assistant-step run or a lone tool call', () => {
    seedFlow(['user', 'assistant-step', 'assistant-step', 'turn-tail'])
    mount()
    expect(headers()).toHaveLength(0)

    document.body.innerHTML = ''
    seedFlow(['user', 'tool-call', 'turn-tail'])
    mount()
    expect(headers()).toHaveLength(0)
    expect(hiddenKeys()).toEqual([])
  })

  it('keeps the trailing run expanded while the turn is live', () => {
    seedFlow(['user', 'assistant-step', 'tool-call', 'assistant-step'])
    mount()

    expect(headers()).toHaveLength(1)
    expect(headers()[0]?.hasAttribute('data-we-tool-expanded')).toBe(true)
    expect(hiddenKeys()).toEqual([])
    expect(headers()[0]?.querySelector('[data-we-tool-count]')?.textContent)
      .toBe('toolCalls.groupCountRunning {"count":3}')
  })

  it('auto-collapses the trailing run once the turn tail lands', async () => {
    const flow = seedFlow(['user', 'assistant-step', 'tool-call', 'assistant-step'])
    mount()
    expect(hiddenKeys()).toEqual([])

    appendItem(flow, 'turn-tail', 'n4')
    await flush()
    expect(hiddenKeys()).toEqual(['n1', 'n2'])
    expect(headers()[0]?.hasAttribute('data-we-tool-expanded')).toBe(false)
  })

  it('hides every member of a run that ends on a tool call', () => {
    seedFlow(['user', 'assistant-step', 'tool-call', 'tool-call', 'turn-tail'])
    mount()
    expect(hiddenKeys()).toEqual(['n1', 'n2', 'n3'])
    expect(headers()[0]?.querySelector('[data-we-tool-count]')?.textContent)
      .toBe('toolCalls.groupCountSettled {"count":3}')
  })

  it('toggles a run when its header is clicked', async () => {
    seedFlow(['user', 'assistant-step', 'tool-call', 'assistant-step', 'turn-tail'])
    mount()
    expect(hiddenKeys()).toEqual(['n1', 'n2'])

    const button = headers()[0]?.querySelector('button') as HTMLButtonElement
    button.click()
    await flush()
    expect(hiddenKeys()).toEqual([])
    expect(button.getAttribute('aria-expanded')).toBe('true')

    button.click()
    await flush()
    expect(hiddenKeys()).toEqual(['n1', 'n2'])
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })

  it('does not auto-collapse a run the user re-expanded', async () => {
    const flow = seedFlow(['user', 'assistant-step', 'tool-call', 'assistant-step'])
    mount()
    const button = headers()[0]?.querySelector('button') as HTMLButtonElement
    // Collapse the live run by hand, then re-expand it.
    button.click()
    await flush()
    expect(hiddenKeys()).toEqual(['n1', 'n2'])
    button.click()
    await flush()
    expect(hiddenKeys()).toEqual([])

    // The step now ends; the explicit choice survives it.
    appendItem(flow, 'turn-tail', 'n4')
    await flush()
    expect(hiddenKeys()).toEqual([])
  })

  it('settles without looping on the header it inserts', async () => {
    seedFlow(['user', 'assistant-step', 'tool-call', 'assistant-step', 'turn-tail'])
    mount()
    expect(headers()).toHaveLength(1)
    await flush()
    await flush()
    expect(headers()).toHaveLength(1)
    expect(hiddenKeys()).toEqual(['n1', 'n2'])
  })

  it('drops a header whose run was virtualized away', async () => {
    const flow = seedFlow(['user', 'assistant-step', 'tool-call', 'assistant-step', 'turn-tail'])
    mount()
    expect(headers()).toHaveLength(1)

    for (const key of ['n1', 'n2', 'n3']) {
      flow.querySelector(`[data-chat-flow-key="${key}"]`)?.remove()
    }
    await flush()
    expect(headers()).toHaveLength(0)
  })

  it('does not carry one session\'s collapse choice into another', async () => {
    let sessionId = 's1'
    const flow = seedFlow(['user', 'assistant-step', 'tool-call', 'assistant-step'])
    mount({
      sessions: { list: { getSnapshot: () => ({ current: sessionId }) } },
      locale: { bind: () => t },
    })
    ;(headers()[0]?.querySelector('button') as HTMLButtonElement).click()
    await flush()
    expect(hiddenKeys()).toEqual(['n1', 'n2'])

    // Switching sessions rebuilds the flow, and positional node keys repeat —
    // the choice above must not follow them into the new session.
    sessionId = 's2'
    flow.innerHTML = ''
    for (const [i, kind] of ['user', 'assistant-step', 'tool-call', 'assistant-step'].entries()) {
      appendItem(flow, kind, `n${i}`)
    }
    await flush()
    expect(hiddenKeys()).toEqual([])
  })

  it('restores the host DOM on dispose', () => {
    seedFlow(['user', 'assistant-step', 'tool-call', 'assistant-step', 'turn-tail'])
    const before = (document.querySelector('[data-chat-flow]') as HTMLElement).innerHTML
    mount()
    expect(headers()).toHaveLength(1)

    for (const dispose of disposers.splice(0)) dispose()
    expect(headers()).toHaveLength(0)
    expect(hiddenKeys()).toEqual([])
    expect((document.querySelector('[data-chat-flow]') as HTMLElement).innerHTML).toBe(before)
    expect(document.getElementById('dsh-web-enhanced-tool-calls-style')).toBeNull()
  })
})
