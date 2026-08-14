/**
 * Preview parsing: Markdown blocks and inline spans, delimited rows, and
 * unified-diff line classes.
 * @module dsh-web-enhanced/tests/markdown
 */

import { describe, expect, it } from 'vitest'
import { diffLineKind, parseDelimited, parseInline, parseMarkdown } from '../src/client/panel/markdown.ts'

describe('parseInline', () => {
  it('reads code, strong, em, and links', () => {
    expect(parseInline('a `c` **b** *i* [t](https://x)')).toEqual([
      { type: 'text', text: 'a ' },
      { type: 'code', text: 'c' },
      { type: 'text', text: ' ' },
      { type: 'strong', text: 'b' },
      { type: 'text', text: ' ' },
      { type: 'em', text: 'i' },
      { type: 'text', text: ' ' },
      { type: 'link', text: 't', href: 'https://x' },
    ])
  })

  it('keeps a javascript: link as literal text instead of an anchor', () => {
    // A rendered document is untrusted content; a scheme that executes must
    // never reach an href.
    expect(parseInline('[x](javascript:alert(1))')).toEqual([
      { type: 'text', text: '[x](javascript:alert(1))' },
    ])
    expect(parseInline('[x](DATA:text/html,y)')).toEqual([
      { type: 'text', text: '[x](DATA:text/html,y)' },
    ])
  })

  it('leaves unmatched markers as text', () => {
    expect(parseInline('2 * 3 * 4')).toEqual([{ type: 'text', text: '2 * 3 * 4' }])
  })
})

describe('parseMarkdown', () => {
  it('reads headings, paragraphs, rules, quotes, and both list styles', () => {
    const blocks = parseMarkdown([
      '# Title',
      '',
      'A paragraph',
      'continued on the next line.',
      '',
      '---',
      '',
      '> quoted',
      '> across lines',
      '',
      '- one',
      '- two',
      '',
      '1. first',
      '2. second',
    ].join('\n'))
    expect(blocks.map(block => block.type)).toEqual([
      'heading', 'paragraph', 'rule', 'quote', 'list', 'list',
    ])
    expect(blocks[0]).toMatchObject({ level: 1 })
    // Soft-wrapped lines join into one paragraph.
    expect(blocks[1]).toMatchObject({ spans: [{ type: 'text', text: 'A paragraph continued on the next line.' }] })
    expect(blocks[4]).toMatchObject({ ordered: false })
    expect(blocks[5]).toMatchObject({ ordered: true })
  })

  it('keeps fenced code verbatim, including an unterminated fence', () => {
    const [fenced] = parseMarkdown('```ts\nconst a = 1\n# not a heading\n```')
    expect(fenced).toEqual({ type: 'code', lang: 'ts', code: 'const a = 1\n# not a heading' })
    const [open] = parseMarkdown('```\nstill code')
    expect(open).toEqual({ type: 'code', lang: '', code: 'still code' })
  })

  it('starts a new block at a marker without a blank line before it', () => {
    const blocks = parseMarkdown('text\n# heading')
    expect(blocks.map(block => block.type)).toEqual(['paragraph', 'heading'])
  })
})

describe('parseDelimited', () => {
  it('splits plain rows and ignores a trailing newline', () => {
    expect(parseDelimited('a,b\n1,2\n', ',')).toEqual([['a', 'b'], ['1', '2']])
  })

  it('honours quoted fields containing delimiters, newlines, and escaped quotes', () => {
    expect(parseDelimited('"a,b","c\nd","e""f"', ',')).toEqual([['a,b', 'c\nd', 'e"f']])
  })

  it('handles CRLF without producing empty rows', () => {
    expect(parseDelimited('a,b\r\n1,2', ',')).toEqual([['a', 'b'], ['1', '2']])
  })

  it('splits tabs when asked', () => {
    expect(parseDelimited('a\tb', '\t')).toEqual([['a', 'b']])
  })

  it('returns nothing for empty input', () => {
    expect(parseDelimited('', ',')).toEqual([])
  })
})

describe('diffLineKind', () => {
  it('classifies headers, hunks, and content', () => {
    expect(diffLineKind('diff --git a/x b/x')).toBe('meta')
    expect(diffLineKind('index 1..2')).toBe('meta')
    expect(diffLineKind('--- a/x')).toBe('meta')
    expect(diffLineKind('+++ b/x')).toBe('meta')
    expect(diffLineKind('@@ -1 +1 @@')).toBe('hunk')
    expect(diffLineKind('+added')).toBe('added')
    expect(diffLineKind('-removed')).toBe('removed')
    expect(diffLineKind(' context')).toBe('context')
  })
})
