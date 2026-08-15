/**
 * Minimal Markdown and CSV parsing for the preview pane.
 *
 * Deliberately hand-rolled and small rather than a Markdown library: the
 * browser bundle is fetched eagerly per plugin, and the preview needs
 * headings, code, lists, quotes, and basic inline spans — not a CommonMark
 * implementation. Parsing to a block/span tree (never to an HTML string) is
 * also what keeps the renderer free of `dangerouslySetInnerHTML`, so
 * untrusted file content cannot inject markup.
 * @module dsh-web-enhanced/src/client/panel/markdown
 */

/** One inline span of Markdown text. */
export type MdSpan =
  | { readonly type: 'text'; readonly text: string }
  | { readonly type: 'code'; readonly text: string }
  | { readonly type: 'strong'; readonly text: string }
  | { readonly type: 'em'; readonly text: string }
  | { readonly type: 'del'; readonly text: string }
  | { readonly type: 'link'; readonly text: string; readonly href: string }
  | { readonly type: 'image'; readonly text: string; readonly href: string }
  | { readonly type: 'break' }

/** Column alignment of a GFM table, from its delimiter row. */
export type MdAlign = 'left' | 'center' | 'right' | undefined

/** One block-level Markdown element. */
export type MdBlock =
  | { readonly type: 'heading'; readonly level: number; readonly spans: readonly MdSpan[] }
  | { readonly type: 'paragraph'; readonly spans: readonly MdSpan[] }
  | { readonly type: 'code'; readonly lang: string; readonly code: string }
  | { readonly type: 'list'; readonly ordered: boolean; readonly items: readonly (readonly MdSpan[])[] }
  | { readonly type: 'quote'; readonly spans: readonly MdSpan[] }
  | { readonly type: 'rule' }
  | {
    readonly type: 'table'
    readonly header: readonly (readonly MdSpan[])[]
    readonly align: readonly MdAlign[]
    readonly rows: readonly (readonly (readonly MdSpan[])[])[]
  }

/**
 * Inline patterns, tried in order at each scan position.
 *
 * The emphasis patterns require the delimited run to start and end with a
 * non-space character, which is what keeps arithmetic like `2 * 3 * 4` from
 * reading as emphasis. Written without lookbehind so the bundle stays
 * portable across browser engines.
 */
const INLINE = [
  { type: 'code', re: /^`([^`]+)`/u },
  { type: 'strong', re: /^\*\*([^\s*](?:[^*]*[^\s*])?)\*\*/u },
  { type: 'em', re: /^\*([^\s*](?:[^*]*[^\s*])?)\*/u },
  { type: 'del', re: /^~~([^\s~](?:[^~]*[^\s~])?)~~/u },
] as const

/**
 * Inline HTML element names this preview can render, mapped to the span they
 * become.
 *
 * Documents mix HTML into Markdown constantly (`<br>`, `<kbd>`, `<img>`), and
 * printing the tag text verbatim is the wrong reading of the source. Rendering
 * arbitrary HTML is not on offer either: the whole preview is built as React
 * elements precisely so untrusted file content cannot inject markup. So a
 * known element becomes the matching span, and anything else has its tag
 * markup dropped while its content keeps rendering — the same shape a
 * sanitizer produces.
 */
const HTML_SPAN: Readonly<Record<string, MdSpan['type']>> = {
  b: 'strong', strong: 'strong',
  i: 'em', em: 'em', var: 'em', cite: 'em',
  code: 'code', kbd: 'code', samp: 'code', tt: 'code',
  del: 'del', s: 'del', strike: 'del',
}

/** Elements whose CONTENT is markup, not prose: dropped whole. */
const HTML_VOIDED = new Set(['script', 'style'])

/** One opening/closing/self-closing HTML tag, or a comment. */
const HTML_TAG = /^<(\/)?([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/)?>/u
const HTML_COMMENT = /^<!--[\s\S]*?-->/u

/** Read one attribute out of a raw tag attribute string. */
function attributeOf(raw: string, name: string): string | undefined {
  const found = new RegExp(`(?:^|\\s)${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'iu').exec(raw)
  if (found === null) return undefined
  return found[2] ?? found[3] ?? found[4]
}

/** Link targets that may not be rendered as an anchor href. */
function safeHref(href: string): string | undefined {
  const trimmed = href.trim()
  // `javascript:` and `data:` targets turn a rendered document into an
  // execution vector; anything else relative or http(s) is fine.
  if (/^(?:javascript|data|vbscript):/iu.test(trimmed)) return undefined
  return trimmed
}

/**
 * Image sources the preview may load. Unlike a link target, an inline `data:`
 * image is the ordinary way a self-contained document embeds a picture, so it
 * stays — the element renders a bitmap, never markup or script.
 */
function safeSrc(src: string): string | undefined {
  const trimmed = src.trim()
  if (/^(?:javascript|vbscript):/iu.test(trimmed)) return undefined
  if (/^data:/iu.test(trimmed) && !/^data:image\//iu.test(trimmed)) return undefined
  return trimmed
}

/** The five entities a Markdown document realistically writes by hand. */
const ENTITY: Readonly<Record<string, string>> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ',
}

/** Decode one `&name;` or `&#NN;` reference; undefined when it is not one. */
function decodeEntity(source: string): { readonly text: string; readonly length: number } | undefined {
  const named = /^&([a-zA-Z]+);/u.exec(source)
  if (named !== null) {
    const text = ENTITY[named[1]!.toLowerCase()]
    return text === undefined ? undefined : { text, length: named[0].length }
  }
  const numeric = /^&#(x[0-9a-fA-F]+|\d+);/u.exec(source)
  if (numeric === null) return undefined
  const raw = numeric[1]!
  const code = raw[0] === 'x' || raw[0] === 'X' ? Number.parseInt(raw.slice(1), 16) : Number.parseInt(raw, 10)
  if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return undefined
  return { text: String.fromCodePoint(code), length: numeric[0].length }
}

/**
 * Parse inline Markdown into spans.
 * @param text - one block's raw text.
 * @returns the spans, with unmatched text preserved verbatim.
 */
export function parseInline(text: string): MdSpan[] {
  const spans: MdSpan[] = []
  let plain = ''
  let rest = text
  // Text always merges into a preceding text span: a rejected link or an
  // unmatched marker contributes literal characters, and the caller should
  // see one run of text rather than a seam wherever a pattern was tried.
  const pushText = (value: string): void => {
    if (value === '') return
    const last = spans[spans.length - 1]
    if (last?.type === 'text') {
      spans[spans.length - 1] = { type: 'text', text: last.text + value }
      return
    }
    spans.push({ type: 'text', text: value })
  }
  const flush = (): void => {
    pushText(plain)
    plain = ''
  }
  while (rest !== '') {
    const image = /^!\[([^\]]*)\]\(([^)\s]+)\)/u.exec(rest)
    if (image !== null) {
      const src = safeSrc(image[2]!)
      flush()
      if (src === undefined) pushText(image[0])
      else spans.push({ type: 'image', text: image[1]!, href: src })
      rest = rest.slice(image[0].length)
      continue
    }
    const link = /^\[([^\]]*)\]\(([^)\s]+)\)/u.exec(rest)
    if (link !== null) {
      const href = safeHref(link[2]!)
      flush()
      if (href === undefined) pushText(link[0])
      else spans.push({ type: 'link', text: link[1]!, href })
      rest = rest.slice(link[0].length)
      continue
    }
    if (rest[0] === '<') {
      const consumed = consumeHtml(rest, spans, flush, pushText)
      if (consumed > 0) {
        rest = rest.slice(consumed)
        continue
      }
    }
    if (rest[0] === '&') {
      const entity = decodeEntity(rest)
      if (entity !== undefined) {
        plain += entity.text
        rest = rest.slice(entity.length)
        continue
      }
    }
    let matched = false
    for (const pattern of INLINE) {
      const found = pattern.re.exec(rest)
      if (found === null) continue
      flush()
      spans.push({ type: pattern.type, text: found[1]! })
      rest = rest.slice(found[0].length)
      matched = true
      break
    }
    if (matched) continue
    plain += rest[0]!
    rest = rest.slice(1)
  }
  flush()
  return spans
}

/**
 * Consume one inline HTML construct at the head of `rest`.
 *
 * A known element becomes its span (its text content read from the source up
 * to the closing tag); a comment and a voided element disappear with their
 * content; every other tag disappears while its content keeps rendering. A
 * lone `<` that opens nothing returns 0 so the caller keeps it as text.
 * @returns how many characters were consumed; 0 when this is not HTML.
 */
function consumeHtml(
  rest: string,
  spans: MdSpan[],
  flush: () => void,
  pushText: (value: string) => void,
): number {
  const comment = HTML_COMMENT.exec(rest)
  if (comment !== null) return comment[0].length
  const tag = HTML_TAG.exec(rest)
  if (tag === null) return 0
  const closing = tag[1] === '/'
  const name = tag[2]!.toLowerCase()
  const attributes = tag[3] ?? ''
  if (name === 'br') {
    flush()
    spans.push({ type: 'break' })
    return tag[0].length
  }
  if (name === 'img' && !closing) {
    const src = safeSrc(attributeOf(attributes, 'src') ?? '')
    if (src !== undefined) {
      flush()
      spans.push({ type: 'image', text: attributeOf(attributes, 'alt') ?? '', href: src })
    }
    return tag[0].length
  }
  if (closing) return tag[0].length
  const end = closingIndexOf(rest, name, tag[0].length)
  if (name === 'a') {
    const href = safeHref(attributeOf(attributes, 'href') ?? '')
    const inner = end === undefined ? '' : rest.slice(tag[0].length, end.start)
    if (href === undefined) {
      pushText(stripTags(inner))
      return end === undefined ? tag[0].length : end.after
    }
    flush()
    spans.push({ type: 'link', text: stripTags(inner), href })
    return end === undefined ? tag[0].length : end.after
  }
  const mapped = HTML_SPAN[name]
  if (mapped !== undefined && end !== undefined) {
    flush()
    const inner = stripTags(rest.slice(tag[0].length, end.start))
    spans.push(mapped === 'code'
      ? { type: 'code', text: inner }
      : mapped === 'strong'
        ? { type: 'strong', text: inner }
        : mapped === 'del' ? { type: 'del', text: inner } : { type: 'em', text: inner })
    return end.after
  }
  if (HTML_VOIDED.has(name)) return end === undefined ? rest.length : end.after
  // An unknown element: drop the tag, keep the content.
  return tag[0].length
}

/** Locate one element's closing tag, honouring same-name nesting. */
function closingIndexOf(source: string, name: string, from: number): { start: number; after: number } | undefined {
  const pattern = new RegExp(`<(/)?${name}(?![a-zA-Z0-9-])((?:"[^"]*"|'[^']*'|[^>"'])*?)(/)?>`, 'giu')
  pattern.lastIndex = from
  let depth = 0
  for (;;) {
    const found = pattern.exec(source)
    if (found === null) return undefined
    if (found[1] === '/') {
      if (depth === 0) return { start: found.index, after: found.index + found[0].length }
      depth -= 1
      continue
    }
    if (found[3] !== '/') depth += 1
  }
}

/** Flatten any residual markup inside an element's content to its text. */
function stripTags(source: string): string {
  let text = ''
  let rest = source
  while (rest !== '') {
    if (rest[0] === '<') {
      const comment = HTML_COMMENT.exec(rest)
      if (comment !== null) {
        rest = rest.slice(comment[0].length)
        continue
      }
      const tag = HTML_TAG.exec(rest)
      if (tag !== null) {
        rest = rest.slice(tag[0].length)
        continue
      }
    }
    if (rest[0] === '&') {
      const entity = decodeEntity(rest)
      if (entity !== undefined) {
        text += entity.text
        rest = rest.slice(entity.length)
        continue
      }
    }
    text += rest[0]!
    rest = rest.slice(1)
  }
  return text
}

/** Split one pipe-table row into its cells, honouring `\|` escapes. */
function tableCells(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/u, '').replace(/\|\s*$/u, '')
  const cells: string[] = []
  let cell = ''
  for (let at = 0; at < trimmed.length; at += 1) {
    const char = trimmed[at]!
    if (char === '\\' && trimmed[at + 1] === '|') {
      cell += '|'
      at += 1
      continue
    }
    if (char === '|') {
      cells.push(cell.trim())
      cell = ''
      continue
    }
    cell += char
  }
  cells.push(cell.trim())
  return cells
}

/**
 * Read the alignment row of a GFM table (`---`, `:--`, `:-:`, `--:`).
 * @returns one entry per column, or undefined when the line is not one.
 */
function tableAlignment(line: string): MdAlign[] | undefined {
  if (!line.includes('|')) return undefined
  const cells = tableCells(line)
  const align: MdAlign[] = []
  for (const cell of cells) {
    if (!/^:?-{1,}:?$/u.test(cell)) return undefined
    const left = cell.startsWith(':')
    const right = cell.endsWith(':')
    align.push(left && right ? 'center' : right ? 'right' : left ? 'left' : undefined)
  }
  return align.length === 0 ? undefined : align
}

/**
 * Parse Markdown into blocks.
 * @param source - the document text.
 * @returns the block list; an unterminated fence still yields its code block.
 */
export function parseMarkdown(source: string): MdBlock[] {
  const blocks: MdBlock[] = []
  const lines = source.split(/\r?\n/u)
  let index = 0

  /** Consume a run of list items sharing one marker style. */
  const takeList = (ordered: boolean): MdBlock => {
    const items: MdSpan[][] = []
    const marker = ordered ? /^\s*\d+[.)]\s+(.*)$/u : /^\s*[-*+]\s+(.*)$/u
    while (index < lines.length) {
      const found = marker.exec(lines[index]!)
      if (found === null) break
      items.push(parseInline(found[1]!))
      index += 1
    }
    return { type: 'list', ordered, items }
  }

  /**
   * Consume a GFM pipe table starting at the header row, which the caller has
   * already paired with its alignment row. Body rows are padded or clipped to
   * the header width so a ragged row cannot shift the columns.
   */
  const takeTable = (align: readonly MdAlign[]): MdBlock => {
    const header = tableCells(lines[index]!).map(cell => parseInline(cell))
    index += 2
    const width = header.length
    const rows: MdSpan[][][] = []
    while (index < lines.length) {
      const line = lines[index]!
      if (line.trim() === '' || !line.includes('|')) break
      const cells = tableCells(line)
      rows.push(Array.from({ length: width }, (_unused, at) => parseInline(cells[at] ?? '')))
      index += 1
    }
    return {
      type: 'table',
      header,
      align: Array.from({ length: width }, (_unused, at) => align[at]),
      rows,
    }
  }

  while (index < lines.length) {
    const line = lines[index]!
    if (line.trim() === '') {
      index += 1
      continue
    }
    const fence = /^\s*```\s*(\S*)\s*$/u.exec(line)
    if (fence !== null) {
      index += 1
      const body: string[] = []
      while (index < lines.length && !/^\s*```\s*$/u.test(lines[index]!)) {
        body.push(lines[index]!)
        index += 1
      }
      // Skip the closing fence when there is one; EOF closes it otherwise.
      if (index < lines.length) index += 1
      blocks.push({ type: 'code', lang: fence[1] ?? '', code: body.join('\n') })
      continue
    }
    const heading = /^(#{1,6})\s+(.*)$/u.exec(line)
    if (heading !== null) {
      blocks.push({ type: 'heading', level: heading[1]!.length, spans: parseInline(heading[2]!) })
      index += 1
      continue
    }
    if (/^\s*(?:[-*_]\s*){3,}$/u.test(line)) {
      blocks.push({ type: 'rule' })
      index += 1
      continue
    }
    // A table is claimed by its header/alignment PAIR, so a lone pipe line
    // stays a paragraph and `--- ` under it stays a rule.
    if (line.includes('|') && index + 1 < lines.length) {
      const align = tableAlignment(lines[index + 1]!)
      if (align !== undefined && align.length === tableCells(line).length) {
        blocks.push(takeTable(align))
        continue
      }
    }
    const quote = /^\s*>\s?(.*)$/u.exec(line)
    if (quote !== null) {
      const body: string[] = [quote[1]!]
      index += 1
      while (index < lines.length) {
        const next = /^\s*>\s?(.*)$/u.exec(lines[index]!)
        if (next === null) break
        body.push(next[1]!)
        index += 1
      }
      blocks.push({ type: 'quote', spans: parseInline(body.join(' ')) })
      continue
    }
    // An HTML table is the one block-level element worth reading structurally:
    // documents reach for it whenever a pipe table cannot express the cell, and
    // flattening it inline would run every cell together into one paragraph.
    if (/^\s*<table[\s>]/iu.test(line)) {
      const start = index
      while (index < lines.length && !/<\/table\s*>/iu.test(lines[index]!)) index += 1
      if (index < lines.length) index += 1
      const table = parseHtmlTable(lines.slice(start, index).join('\n'))
      if (table !== undefined) {
        blocks.push(table)
        continue
      }
      index = start
    }
    if (/^\s*[-*+]\s+/u.test(line)) {
      blocks.push(takeList(false))
      continue
    }
    if (/^\s*\d+[.)]\s+/u.test(line)) {
      blocks.push(takeList(true))
      continue
    }
    // A paragraph runs to the next blank line or block-level marker.
    const body: string[] = []
    while (index < lines.length) {
      const current = lines[index]!
      if (current.trim() === '') break
      if (/^\s*(?:```|#{1,6}\s|>|[-*+]\s|\d+[.)]\s|<table[\s>])/iu.test(current)) break
      // A table header claims the line before its alignment row, so a
      // paragraph must release it rather than swallow the whole table.
      if (body.length > 0 && current.includes('|') && index + 1 < lines.length
        && tableAlignment(lines[index + 1]!)?.length === tableCells(current).length) break
      body.push(current.trim())
      index += 1
    }
    blocks.push({ type: 'paragraph', spans: parseInline(body.join(' ')) })
  }
  return blocks
}

/**
 * Read one `<table>` element into a table block.
 *
 * Cells keep their inline content (so `<br>`, `<b>`, and Markdown inside a
 * cell still render); a `<th>` anywhere in the first row makes it the header,
 * and a table with no rows is not a table.
 * @param html - the element's source, opening tag through closing tag.
 * @returns the block, or undefined when nothing row-shaped was found.
 */
export function parseHtmlTable(html: string): MdBlock | undefined {
  const rows: { readonly head: boolean; readonly cells: MdSpan[][] }[] = []
  const rowPattern = /<tr(?:\s(?:"[^"]*"|'[^']*'|[^>"'])*)?>([\s\S]*?)<\/tr\s*>/giu
  for (;;) {
    const row = rowPattern.exec(html)
    if (row === null) break
    const cells: MdSpan[][] = []
    let head = false
    const cellPattern = /<(th|td)(?:\s(?:"[^"]*"|'[^']*'|[^>"'])*)?>([\s\S]*?)<\/\1\s*>/giu
    for (;;) {
      const cell = cellPattern.exec(row[1]!)
      if (cell === null) break
      if (cell[1]!.toLowerCase() === 'th') head = true
      cells.push(parseInline(cell[2]!.trim()))
    }
    if (cells.length > 0) rows.push({ head, cells })
  }
  if (rows.length === 0) return undefined
  const first = rows[0]!
  const body = first.head ? rows.slice(1) : rows
  const width = Math.max(...rows.map(row => row.cells.length))
  const pad = (cells: readonly MdSpan[][]): MdSpan[][] =>
    Array.from({ length: width }, (_unused, at) => cells[at] ?? [])
  return {
    type: 'table',
    header: first.head ? pad(first.cells) : [],
    align: Array.from({ length: width }, () => undefined),
    rows: body.map(row => pad(row.cells)),
  }
}

/**
 * Parse delimiter-separated text into rows, honouring quoted fields.
 *
 * Follows the usual CSV quoting rules: a field may be wrapped in double
 * quotes, a doubled quote inside one is a literal quote, and delimiters and
 * newlines lose their meaning inside quotes.
 * @param source - the file text.
 * @param delimiter - field separator; tab for `.tsv`.
 * @returns rows of fields; a trailing newline adds no empty row.
 */
export function parseDelimited(source: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let index = 0
  while (index < source.length) {
    const char = source[index]!
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"'
          index += 2
          continue
        }
        quoted = false
        index += 1
        continue
      }
      field += char
      index += 1
      continue
    }
    if (char === '"') {
      quoted = true
      index += 1
      continue
    }
    if (char === delimiter) {
      row.push(field)
      field = ''
      index += 1
      continue
    }
    if (char === '\n' || char === '\r') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      // Consume the LF of a CRLF pair so it does not open an empty row.
      index += char === '\r' && source[index + 1] === '\n' ? 2 : 1
      continue
    }
    field += char
    index += 1
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/** Line class of a unified-diff line, for colouring. */
export type DiffLineKind = 'added' | 'removed' | 'meta' | 'hunk' | 'context'

/**
 * Classify one unified-diff line.
 * @param line - the raw line.
 * @returns its display class.
 */
export function diffLineKind(line: string): DiffLineKind {
  if (line.startsWith('+++') || line.startsWith('---')) return 'meta'
  if (line.startsWith('@@')) return 'hunk'
  if (line.startsWith('diff ') || line.startsWith('index ')) return 'meta'
  if (line.startsWith('+')) return 'added'
  if (line.startsWith('-')) return 'removed'
  return 'context'
}
