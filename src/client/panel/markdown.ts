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
  | { readonly type: 'link'; readonly text: string; readonly href: string }

/** One block-level Markdown element. */
export type MdBlock =
  | { readonly type: 'heading'; readonly level: number; readonly spans: readonly MdSpan[] }
  | { readonly type: 'paragraph'; readonly spans: readonly MdSpan[] }
  | { readonly type: 'code'; readonly lang: string; readonly code: string }
  | { readonly type: 'list'; readonly ordered: boolean; readonly items: readonly (readonly MdSpan[])[] }
  | { readonly type: 'quote'; readonly spans: readonly MdSpan[] }
  | { readonly type: 'rule' }

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
] as const

/** Link targets that may not be rendered as an anchor href. */
function safeHref(href: string): string | undefined {
  const trimmed = href.trim()
  // `javascript:` and `data:` targets turn a rendered document into an
  // execution vector; anything else relative or http(s) is fine.
  if (/^(?:javascript|data|vbscript):/iu.test(trimmed)) return undefined
  return trimmed
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
    const link = /^\[([^\]]*)\]\(([^)\s]+)\)/u.exec(rest)
    if (link !== null) {
      const href = safeHref(link[2]!)
      flush()
      if (href === undefined) pushText(link[0])
      else spans.push({ type: 'link', text: link[1]!, href })
      rest = rest.slice(link[0].length)
      continue
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
      if (/^\s*(?:```|#{1,6}\s|>|[-*+]\s|\d+[.)]\s)/u.test(current)) break
      body.push(current.trim())
      index += 1
    }
    blocks.push({ type: 'paragraph', spans: parseInline(body.join(' ')) })
  }
  return blocks
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
