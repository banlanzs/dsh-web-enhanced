// @vitest-environment jsdom
/**
 * Tests for the tool-call collapse renderer: the pure call-tree helpers, the
 * step-key grouping, and the auto-collapse state transition when a running
 * group settles. The host primitive DisclosureRow is mocked to keep this test
 * about the renderer's behavior, not the primitive's chrome.
 * @module dsh-web-enhanced/tests/tool-calls
 */

import { createElement } from 'react'
import { fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ToolCallBlock, ToolResultNode } from '@deepseek-ai/dsh-client-runtime/client'
import {
  ToolCallGroup, countCalls, isSettled, keysOf, nameOf, orderedToolKeys, resultText,
} from '../src/client/tool-calls/CollapsedToolCalls.tsx'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => ({
  DisclosureRow: (props: {
    open: boolean
    title: string
    onToggle: () => void
    collapsedContent: unknown
    children: unknown
  }) => createElement('div', { 'data-testid': 'disclosure', 'data-open': String(props.open) },
    createElement('button', { type: 'button', onClick: props.onToggle }, props.title),
    props.collapsedContent,
    props.open ? props.children : null),
  IconSparkle16: () => null,
}))

const runningBlock: ToolCallBlock = {
  callId: 'c1',
  name: 'bash',
  argsRaw: 'echo hi',
  turn: 1,
  step: 1,
  time: 0,
  callView: null,
  subCalls: [],
}

const settledBlock: ToolResultNode = {
  kind: 'tool-result',
  seq: 2,
  time: 1,
  callId: 'c1',
  call: { name: 'bash', argsRaw: 'echo hi' },
  callTime: 0,
  content: [{ type: 'text', text: 'hi\nworld' }],
  isError: false,
  callView: null,
  resultView: null,
  subCalls: [],
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('tool call helpers', () => {
  it('distinguishes running from settled blocks without the rc.6 kind tag', () => {
    expect(isSettled(runningBlock)).toBe(false)
    expect(isSettled(settledBlock)).toBe(true)
    expect(nameOf(runningBlock)).toBe('bash')
    expect(nameOf(settledBlock)).toBe('bash')
    expect(nameOf({ ...settledBlock, call: null })).toBe('')
  })

  it('counts nested subcalls recursively', () => {
    const child: ToolCallBlock = { ...runningBlock, callId: 'c2' }
    const root: ToolCallBlock = {
      ...runningBlock,
      subCalls: [child, { ...settledBlock, callId: 'c3', subCalls: [child] }],
    }
    expect(countCalls(root)).toBe(4)
  })

  it('flattens text blocks and falls back to the structured error', () => {
    expect(resultText(settledBlock)).toBe('hi\nworld')
    expect(resultText({ ...settledBlock, content: [] })).toBe('')
    expect(resultText({
      ...settledBlock,
      content: [],
      error: { name: 'ExitCodeError', code: '2' },
    })).toBe('ExitCodeError: 2')
  })

  it('picks step keys, then turn keys, then falls back to the node key', () => {
    const node = {
      key: 'tool:1',
      location: { kind: 'step', turn: { turn: 3 }, step: { step: 2 } },
    } as never
    const chat = {
      locations: {
        getStep: vi.fn(() => ['user:1', 'tool:1', 'tool:2']),
        getTurn: vi.fn(() => ['tool:9']),
      },
    } as never
    expect(keysOf(node, chat)).toEqual(['user:1', 'tool:1', 'tool:2'])
    expect(orderedToolKeys('tool:1', ['user:1', 'tool:1', 'tool:2'], key => key.startsWith('tool') ? 'tool-call' : 'user'))
      .toEqual(['tool:1', 'tool:2'])
    expect(orderedToolKeys('tool:1', ['user:1'], () => undefined)).toEqual(['tool:1'])
  })
})

describe('tool call group', () => {
  function propsFor(blocks: readonly ToolCallBlock[]) {
    return {
      blocks,
      renderSlot: () => null,
      selectedCallId: undefined,
      cwd: undefined,
      openFile: () => {},
      inspectCall: () => {},
      t: (key: string) => key,
    }
  }

  it('expands while running and auto-collapses when every call settles', () => {
    const view = render(createElement(ToolCallGroup, propsFor([runningBlock])))
    expect(document.querySelector('[data-testid="disclosure"]')?.getAttribute('data-open')).toBe('true')

    view.rerender(createElement(ToolCallGroup, propsFor([settledBlock])))
    expect(document.querySelector('[data-testid="disclosure"]')?.getAttribute('data-open')).toBe('false')
  })

  it('does not auto-collapse again after the user re-expands a settled group', () => {
    const view = render(createElement(ToolCallGroup, propsFor([settledBlock])))
    expect(document.querySelector('[data-testid="disclosure"]')?.getAttribute('data-open')).toBe('false')

    fireEvent.click(document.querySelector('button') as HTMLButtonElement)
    expect(document.querySelector('[data-testid="disclosure"]')?.getAttribute('data-open')).toBe('true')

    view.rerender(createElement(ToolCallGroup, propsFor([settledBlock])))
    expect(document.querySelector('[data-testid="disclosure"]')?.getAttribute('data-open')).toBe('true')
  })
})
