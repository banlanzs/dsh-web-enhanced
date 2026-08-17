/**
 * Pasted-text store: persistence shape, bounds, and preview projection.
 * @module dsh-web-enhanced/tests/pasted-text
 */

import { describe, expect, it } from 'vitest'
import { pastedTextHitOfDraft } from '../src/client/pasted-text/apply.ts'
import { PastedTextStore, pastedTextClipboard, pastedTextPreview, revivePastedText } from '../src/client/pasted-text/store.ts'

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

describe('pastedTextHitOfDraft', () => {
  it('finds the longest stored text restored verbatim into a draft', () => {
    const store = new PastedTextStore()
    store.set('short', 'abc')
    store.set('long', 'abcdef')
    expect(pastedTextHitOfDraft(store, '前缀 abcdef 后缀')).toMatchObject({
      entry: { id: 'long', text: 'abcdef' },
      start: 3,
      end: 9,
    })
    expect(pastedTextHitOfDraft(store, 'abcxyz')).toMatchObject({
      entry: { id: 'short' },
      start: 0,
      end: 3,
    })
  })

  it('matches the trimmed projection restored after a failed send', () => {
    const store = new PastedTextStore()
    store.set('trailing', '长文本内容  ')
    const hit = pastedTextHitOfDraft(store, '长文本内容')
    expect(hit).toMatchObject({ entry: { id: 'trailing' }, start: 0, end: 5 })
  })

  it('returns undefined when no stored text is present', () => {
    const store = new PastedTextStore()
    store.set('x', 'abcdef')
    expect(pastedTextHitOfDraft(store, '')).toBeUndefined()
    expect(pastedTextHitOfDraft(store, 'no match')).toBeUndefined()
  })
})
