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

  it('reads strikethrough and images', () => {
    expect(parseInline('~~gone~~ ![alt](https://x/a.png)')).toEqual([
      { type: 'del', text: 'gone' },
      { type: 'text', text: ' ' },
      { type: 'image', text: 'alt', href: 'https://x/a.png' },
    ])
  })

  it('maps a known inline HTML element to its span instead of printing the tag', () => {
    expect(parseInline('press <kbd>Esc</kbd> to <b>stop</b>')).toEqual([
      { type: 'text', text: 'press ' },
      { type: 'code', text: 'Esc' },
      { type: 'text', text: ' to ' },
      { type: 'strong', text: 'stop' },
    ])
  })

  it('reads html breaks, anchors, and images', () => {
    expect(parseInline('a<br/>b <a href="https://x">t</a> <img src="p.png" alt="A">')).toEqual([
      { type: 'text', text: 'a' },
      { type: 'break' },
      { type: 'text', text: 'b ' },
      { type: 'link', text: 't', href: 'https://x' },
      { type: 'text', text: ' ' },
      { type: 'image', text: 'A', href: 'p.png' },
    ])
  })

  it('drops the markup of an unknown element but keeps its content', () => {
    // Rendering arbitrary HTML is not on offer — the whole preview is React
    // elements so file content cannot inject markup — but the words are the
    // document, and printing the tags is the wrong reading of the source.
    expect(parseInline('<div align="center">centred</div>')).toEqual([
      { type: 'text', text: 'centred' },
    ])
  })

  it('drops script and style content entirely', () => {
    expect(parseInline('before<script>alert(1)</script>after')).toEqual([
      { type: 'text', text: 'beforeafter' },
    ])
  })

  it('refuses an executable href or image source, keeping the text', () => {
    expect(parseInline('<a href="javascript:alert(1)">x</a>')).toEqual([{ type: 'text', text: 'x' }])
    expect(parseInline('<img src="javascript:alert(1)" alt="x">')).toEqual([])
    // A data: bitmap is how a self-contained document embeds a picture.
    expect(parseInline('<img src="data:image/png;base64,AA" alt="x">')).toEqual([
      { type: 'image', text: 'x', href: 'data:image/png;base64,AA' },
    ])
    expect(parseInline('<img src="data:text/html,y" alt="x">')).toEqual([])
  })

  it('decodes the entities a document writes by hand', () => {
    expect(parseInline('a &amp; b &lt;c&gt; &#65; &#x42;')).toEqual([
      { type: 'text', text: 'a & b <c> A B' },
    ])
    // An unknown reference stays literal rather than vanishing.
    expect(parseInline('&notanentity;')).toEqual([{ type: 'text', text: '&notanentity;' }])
  })

  it('keeps a lone angle bracket as text', () => {
    expect(parseInline('a < b')).toEqual([{ type: 'text', text: 'a < b' }])
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

  it('reads a pipe table with its alignment row', () => {
    const [table] = parseMarkdown([
      '| key | default | meaning |',
      '|:---|:---:|---:|',
      '| `a` | 1 | first |',
      '| b | 2 | second |',
    ].join('\n'))
    expect(table).toMatchObject({ type: 'table', align: ['left', 'center', 'right'] })
    const parsed = table as Extract<typeof table, { type: 'table' }>
    expect(parsed.header.map(cell => cell.map(span => 'text' in span ? span.text : ''))).toEqual([
      ['key'], ['default'], ['meaning'],
    ])
    // Cells keep their inline markup.
    expect(parsed.rows[0]![0]).toEqual([{ type: 'code', text: 'a' }])
    expect(parsed.rows).toHaveLength(2)
  })

  it('pads and clips a ragged row to the header width', () => {
    const [table] = parseMarkdown('| a | b |\n| --- | --- |\n| 1 |\n| 1 | 2 | 3 |')
    const parsed = table as Extract<typeof table, { type: 'table' }>
    expect(parsed.rows.map(row => row.length)).toEqual([2, 2])
  })

  it('claims a table only with its alignment row, and releases it from a paragraph', () => {
    // A lone pipe line is prose; `---` under a prose line is still a rule.
    expect(parseMarkdown('a | b\n\nnot a table').map(block => block.type)).toEqual(['paragraph', 'paragraph'])
    expect(parseMarkdown('intro\n| a |\n| --- |\n| 1 |').map(block => block.type))
      .toEqual(['paragraph', 'table'])
  })

  it('honours escaped pipes inside a cell', () => {
    const [table] = parseMarkdown('| a |\n| --- |\n| x \\| y |')
    const parsed = table as Extract<typeof table, { type: 'table' }>
    expect(parsed.rows[0]![0]).toEqual([{ type: 'text', text: 'x | y' }])
  })

  it('reads an HTML table structurally instead of flattening its cells', () => {
    const [table] = parseMarkdown([
      '<table>',
      '  <tr><th>Name</th><th>Note</th></tr>',
      '  <tr><td>a</td><td>first<br>line</td></tr>',
      '</table>',
    ].join('\n'))
    const parsed = table as Extract<typeof table, { type: 'table' }>
    expect(parsed.type).toBe('table')
    expect(parsed.header).toHaveLength(2)
    expect(parsed.rows[0]![1]).toEqual([
      { type: 'text', text: 'first' },
      { type: 'break' },
      { type: 'text', text: 'line' },
    ])
  })

  it('treats a rowless table element as ordinary content', () => {
    expect(parseMarkdown('<table></table>').map(block => block.type)).toEqual(['paragraph'])
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
