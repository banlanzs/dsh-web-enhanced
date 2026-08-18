// @vitest-environment jsdom
/**
 * DOM guard for the tool-call group collapse. The fixtures mirror the host's
 * real chat flow markup — a `data-chat-flow` column of `data-chat-flow-key` /
 * `data-chat-flow-kind` items — because that markup IS this module's contract:
 * it wraps host rows from the outside and never reads inside a tool view.
 * @module dsh-web-enhanced/tests/tool-calls-dom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyToolCallCollapse, toolRuns } from '../src/client/tool-calls/apply.ts'

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
 * assigned positionally so a tool run's leading key is stable across renders.
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

describe('tool run grouping', () => {
  it('groups adjacent tool-call items and ignores lone calls', () => {
    const flow = seedFlow(['user', 'tool-call', 'tool-call', 'assistant', 'tool-call', 'turn'])
    const items = [...flow.children] as HTMLElement[]
    const runs = toolRuns(items)
    expect(runs).toHaveLength(1)
    expect(runs[0]?.map(el => el.getAttribute('data-chat-flow-key'))).toEqual(['n1', 'n2'])
  })

  it('treats a trailing run as one group', () => {
    const flow = seedFlow(['user', 'tool-call', 'tool-call', 'tool-call'])
    expect(toolRuns([...flow.children] as HTMLElement[])).toHaveLength(1)
  })
})

describe('tool-call collapse', () => {
  it('collapses a finished run and keeps the trailing run expanded', () => {
    seedFlow(['user', 'tool-call', 'tool-call', 'assistant', 'tool-call', 'tool-call'])
    mount()

    expect(headers()).toHaveLength(2)
    // The finished run (n1,n2) is hidden; the trailing run (n4,n5) is not.
    expect(hiddenKeys()).toEqual(['n1', 'n2'])
    expect(headers()[0]?.hasAttribute('data-we-tool-expanded')).toBe(false)
    expect(headers()[1]?.hasAttribute('data-we-tool-expanded')).toBe(true)
  })

  it('auto-collapses the trailing run once the step is over', async () => {
    const flow = seedFlow(['user', 'tool-call', 'tool-call'])
    mount()
    expect(hiddenKeys()).toEqual([])
    expect(headers()[0]?.hasAttribute('data-we-tool-expanded')).toBe(true)

    // The assistant reply arriving after the run means that step finished.
    appendItem(flow, 'assistant', 'n3')
    await flush()
    expect(hiddenKeys()).toEqual(['n1', 'n2'])
    expect(headers()[0]?.hasAttribute('data-we-tool-expanded')).toBe(false)
  })

  it('labels the run by whether it can still be running, not by expansion', () => {
    seedFlow(['tool-call', 'tool-call', 'assistant', 'tool-call', 'tool-call'])
    mount()
    const counts = headers().map(h => h.querySelector('[data-we-tool-count]')?.textContent)
    expect(counts[0]).toBe('toolCalls.groupCountSettled {"count":2}')
    expect(counts[1]).toBe('toolCalls.groupCountRunning {"count":2}')
  })

  it('toggles a run when its header is clicked', async () => {
    seedFlow(['user', 'tool-call', 'tool-call', 'assistant'])
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
    const flow = seedFlow(['user', 'tool-call', 'tool-call'])
    mount()
    // Collapse the live run by hand, then re-expand it.
    const button = headers()[0]?.querySelector('button') as HTMLButtonElement
    button.click()
    await flush()
    expect(hiddenKeys()).toEqual(['n1', 'n2'])
    button.click()
    await flush()
    expect(hiddenKeys()).toEqual([])

    // The step now ends; the explicit choice survives it.
    appendItem(flow, 'assistant', 'n3')
    await flush()
    expect(hiddenKeys()).toEqual([])
  })

  it('settles without looping on the header it inserts', async () => {
    seedFlow(['user', 'tool-call', 'tool-call', 'assistant'])
    mount()
    expect(headers()).toHaveLength(1)
    // Re-render passes triggered by our own insertion must be idempotent.
    await flush()
    await flush()
    expect(headers()).toHaveLength(1)
    expect(hiddenKeys()).toEqual(['n1', 'n2'])
  })

  it('drops a header whose run was virtualized away', async () => {
    const flow = seedFlow(['user', 'tool-call', 'tool-call', 'assistant'])
    mount()
    expect(headers()).toHaveLength(1)

    for (const key of ['n1', 'n2']) {
      flow.querySelector(`[data-chat-flow-key="${key}"]`)?.remove()
    }
    await flush()
    expect(headers()).toHaveLength(0)
  })

  it('does not carry one session\'s collapse choice into another', async () => {
    let sessionId = 's1'
    const flow = seedFlow(['user', 'tool-call', 'tool-call'])
    mount({
      sessions: { list: { getSnapshot: () => ({ current: sessionId }) } },
      locale: { bind: () => t },
    })
    // Collapse the live run by hand in s1.
    ;(headers()[0]?.querySelector('button') as HTMLButtonElement).click()
    await flush()
    expect(hiddenKeys()).toEqual(['n1', 'n2'])

    // Switching sessions rebuilds the flow, and positional node keys repeat —
    // the choice above must not follow them into the new session.
    sessionId = 's2'
    flow.innerHTML = ''
    for (const [i, kind] of ['user', 'tool-call', 'tool-call'].entries()) {
      appendItem(flow, kind, `n${i}`)
    }
    await flush()
    expect(hiddenKeys()).toEqual([])
  })

  it('restores the host DOM on dispose', () => {
    seedFlow(['user', 'tool-call', 'tool-call', 'assistant'])
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
