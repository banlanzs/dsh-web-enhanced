/**
 * Pasted-text store: persistence shape, bounds, and preview projection.
 * @module dsh-web-enhanced/tests/pasted-text
 */

import { describe, expect, it } from 'vitest'
import {
  pastedTextClipboard, pastedTextPreview, revivePastedText,
} from '../src/client/pasted-text/store.ts'

describe('revivePastedText', () => {
  it('drops malformed, duplicate, and empty entries', () => {
    expect(revivePastedText([
      { id: 'ok', text: 'hello', createdAt: 1 },
      null,
      { id: 'ok', text: 'dup', createdAt: 2 },
      { id: '', text: 'x', createdAt: 3 },
      { id: 'blank', text: '  ', createdAt: 4 },
      { id: 'bad-ts', text: 'x', createdAt: 'now' },
    ])).toEqual([{ id: 'ok', text: 'hello', createdAt: 1 }])
  })

  it('caps every entry at the stored-character bound', () => {
    const long = 'x'.repeat(200_100)
    expect(revivePastedText([{ id: 'long', text: long, createdAt: 1 }])[0]!.text).toHaveLength(200_000)
  })
})

describe('pastedTextPreview', () => {
  it('flattens whitespace and shortens long first lines', () => {
    expect(pastedTextPreview('  first\nsecond  line ')).toBe('first second line')
    expect(pastedTextPreview('x'.repeat(80))).toBe(`${'x'.repeat(60)}…`)
  })
})

describe('pastedTextClipboard', () => {
  it('names the chip with a short id prefix', () => {
    expect(pastedTextClipboard('01234567-aaaa')).toBe('[已粘贴文本:01234567]')
  })
})
