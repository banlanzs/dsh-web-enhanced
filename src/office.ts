/**
 * Office preview conversion: docx/xlsx are ZIP containers, so the host
 * unpacks them with fflate and projects the document into a bounded list of
 * structural blocks (headings, paragraphs, list items, tables). Blocks are
 * never raw HTML — the client renders a whitelisted React tree, so there is
 * no markup-injection surface. Styling beyond structure (bold, italics,
 * colors) is intentionally dropped.
 * @module dsh-web-enhanced/src/office
 */

import { readFile, stat } from 'node:fs/promises'
import { unzipSync } from 'fflate'
import { resolveWithin } from './files.ts'
import type { FsOfficePreviewResult, OfficeBlock, OfficeKind } from './types.ts'

/** Scale bounds of one conversion (pathological-document guards, not tunables). */
export interface OfficeLimits {
  /** File size cap; larger files are rejected instead of parsed. */
  readonly maxBytes: number
}

/** Bounded structural output: hard caps with truncation, never unbounded. */
export const OFFICE_MAX_BLOCKS = 2_000
export const OFFICE_MAX_TABLE_ROWS = 200
export const OFFICE_MAX_TABLE_COLS = 50
/** XML nesting guard against pathological documents. */
const MAX_XML_DEPTH = 64

/** Office extensions mapped to their converter kind. */
const OFFICE_EXT: Readonly<Record<string, OfficeKind>> = {
  '.docx': 'docx',
  '.xlsx': 'xlsx',
}

/** Whether the file name targets a supported Office format. */
export function isOfficeName(name: string): boolean {
  return officeKindOf(name) !== null
}

/** The converter kind for one file name, or null for unsupported formats. */
export function officeKindOf(name: string): OfficeKind | null {
  const lower = name.toLowerCase()
  for (const [ext, kind] of Object.entries(OFFICE_EXT)) {
    if (lower.endsWith(ext)) return kind
  }
  return null
}

/**
 * Read one Office file inside the workspace and convert it to preview
 * blocks. Legacy binary formats (.doc/.xls) answer a dedicated error.
 * @param root - canonical workspace root.
 * @param rel - workspace-relative path.
 * @param limits - conversion bounds.
 * @returns the preview result; errors are result fields, never throws.
 */
export async function officePreviewView(root: string, rel: string, limits: OfficeLimits): Promise<FsOfficePreviewResult> {
  const kind = officeKindOf(rel)
  if (kind === null) {
    return {
      error: {
        code: 'office-unsupported',
        message: `'${rel}' is not a supported Office format (docx/xlsx)`,
      },
    }
  }
  const full = resolveWithin(root, rel)
  const info = await stat(full)
  if (info.size > limits.maxBytes) {
    return {
      error: {
        code: 'office-too-large',
        message: `'${rel}' is ${info.size} bytes, over the ${limits.maxBytes} byte preview cap`,
      },
    }
  }
  const data = await readFile(full)
  try {
    const converted = kind === 'docx' ? convertDocx(data) : convertXlsx(data)
    return { kind, blocks: converted.blocks, truncated: converted.truncated }
  } catch {
    return { error: { code: 'office-invalid', message: `'${rel}' could not be parsed as ${kind}` } }
  }
}

/* ---------------- XML parsing (docx/xlsx documents are well-formed) ------ */

/** One node of the lightweight XML tree (no namespaces, no entities). */
interface XmlNode {
  name: string
  attrs: Readonly<Record<string, string>>
  children: XmlNode[]
  /** Concatenated character data directly inside this node. */
  text: string
}

/** Tag shape discovered while scanning: opening, closing, or self-closing. */
interface Tag {
  readonly name: string
  readonly attrs: Readonly<Record<string, string>>
  readonly closing: boolean
  readonly selfClosing: boolean
}

/** Split a tag's attribute list into a name/value map. */
function parseAttrs(raw: string): Readonly<Record<string, string>> {
  const attrs: Record<string, string> = {}
  const re = /([A-Za-z_:][A-Za-z0-9_.:-]*)\s*=\s*"([^"]*)"/gu
  let match: RegExpExecArray | null
  while ((match = re.exec(raw)) !== null) {
    attrs[match[1]!] = match[2]!
  }
  return attrs
}

/** Scan one XML document into a tag/character-data event stream. */
function* scanXml(xml: string): Generator<Tag | string> {
  let index = 0
  const length = xml.length
  while (index < length) {
    const open = xml.indexOf('<', index)
    if (open === -1) {
      if (index < length) yield xml.slice(index)
      return
    }
    if (open > index) yield xml.slice(index, open)
    if (xml.startsWith('<!--', open)) {
      const close = xml.indexOf('-->', open + 4)
      if (close === -1) return
      index = close + 3
      continue
    }
    if (xml.startsWith('<![CDATA[', open)) {
      const close = xml.indexOf(']]>', open + 9)
      if (close === -1) return
      yield xml.slice(open + 9, close)
      index = close + 3
      continue
    }
    if (xml.startsWith('<?', open) || xml.startsWith('<!', open)) {
      const close = xml.indexOf('>', open)
      if (close === -1) return
      index = close + 1
      continue
    }
    const close = xml.indexOf('>', open)
    if (close === -1) return
    const inner = xml.slice(open + 1, close)
    const selfClosing = inner.endsWith('/')
    const body = selfClosing ? inner.slice(0, -1).trimEnd() : inner.trim()
    const space = body.search(/[\s]/u)
    const name = space === -1 ? body : body.slice(0, space)
    const attrsRaw = space === -1 ? '' : body.slice(space + 1)
    const closing = name.startsWith('/')
    yield {
      name: closing ? name.slice(1) : name,
      attrs: closing ? {} : parseAttrs(attrsRaw),
      closing,
      selfClosing,
    }
    index = close + 1
  }
}

/** Build a bounded XML tree from one document. */
function parseXml(xml: string): XmlNode {
  const root: XmlNode = { name: '#root', attrs: {}, children: [], text: '' }
  const stack: XmlNode[] = [root]
  for (const event of scanXml(xml)) {
    if (typeof event === 'string') {
      const current = stack[stack.length - 1]!
      if (current.children.length === 0) current.text += event
      else current.children[current.children.length - 1]!.text += event
      continue
    }
    if (event.closing) {
      if (stack.length > 1) stack.pop()
      continue
    }
    const node: XmlNode = { name: event.name, attrs: event.attrs, children: [], text: '' }
    const parent = stack[stack.length - 1]!
    parent.children.push(node)
    if (!event.selfClosing && stack.length < MAX_XML_DEPTH) stack.push(node)
  }
  return root
}

/** Collect the text of a subtree in document order, with tab/break tokens. */
function collectText(node: XmlNode): string {
  if (node.name === 'w:t' || node.name === 't') return node.text
  if (node.name === 'w:tab' || node.name === 'tab') return '\t'
  if (node.name === 'w:br' || node.name === 'br') return '\n'
  // Field codes, deleted revisions, and phonetic guides are not content.
  if (node.name === 'w:instrText' || node.name === 'w:delText' || node.name === 'rPh') return ''
  let out = ''
  for (const child of node.children) out += collectText(child)
  return out
}

/** Find all descendants with one tag name, in document order. */
function descendants(node: XmlNode, name: string): XmlNode[] {
  const out: XmlNode[] = []
  for (const child of node.children) {
    if (child.name === name) out.push(child)
    out.push(...descendants(child, name))
  }
  return out
}

/** Heading level of a paragraph's style, or 0 for body text. */
function headingLevel(paragraph: XmlNode): 0 | 1 | 2 | 3 {
  const style = paragraph.children.find(child => child.name === 'w:pPr')?.children
    .find(child => child.name === 'w:pStyle')
  const value = style?.attrs['w:val'] ?? ''
  const heading = /^(?:Heading|标题|Titre|Überschrift)\s*([1-3])$/iu.exec(value)
  if (heading !== null) return Number(heading[1]) as 1 | 2 | 3
  if (value === '1' || value === '2' || value === '3') return Number(value) as 1 | 2 | 3
  return 0
}

/** Whether a paragraph carries a numbering property (a list item). */
function isListItem(paragraph: XmlNode): boolean {
  return paragraph.children.some(child => child.name === 'w:pPr' &&
    child.children.some(grand => grand.name === 'w:numPr'))
}

/** One conversion outcome: bounded blocks plus a truncation signal. */
interface Converted {
  readonly blocks: OfficeBlock[]
  readonly truncated: boolean
}

/** Bounded table extraction: rows capped, columns capped, cells padded. */
function extractTable(table: XmlNode): { rows: string[][]; truncated: boolean } {
  const rows: string[][] = []
  let truncated = false
  for (const row of descendants(table, 'w:tr')) {
    if (rows.length >= OFFICE_MAX_TABLE_ROWS) {
      truncated = true
      break
    }
    const cells: string[] = []
    for (const cell of descendants(row, 'w:tc')) {
      if (cells.length >= OFFICE_MAX_TABLE_COLS) break
      cells.push(collectText(cell).replace(/\s+/gu, ' ').trim())
    }
    if (cells.some(cell => cell !== '')) rows.push(cells)
  }
  return { rows, truncated }
}

/* ---------------- docx: word/document.xml → blocks ------------------------ */

function convertDocx(data: Uint8Array): Converted {
  const files = unzipIndex(data)
  const document = files['word/document.xml']
  if (document === undefined) throw new Error('docx: word/document.xml missing')
  const root = parseXml(new TextDecoder().decode(document))
  const body = descendants(root, 'w:body')[0]
  const blocks: OfficeBlock[] = []
  let truncated = false
  const push = (block: OfficeBlock | null): void => {
    if (block === null) return
    if (blocks.length >= OFFICE_MAX_BLOCKS) {
      truncated = true
      return
    }
    blocks.push(block)
  }
  const walk = (node: XmlNode): void => {
    if (node.name === 'w:p') {
      const text = collectText(node).trim()
      if (text === '') return
      const level = headingLevel(node)
      if (level !== 0) push({ type: `h${level}` as const, text })
      else if (isListItem(node)) push({ type: 'li', text })
      else push({ type: 'p', text })
      return
    }
    if (node.name === 'w:tbl') {
      const table = extractTable(node)
      if (table.rows.length > 0) push({ type: 'table', rows: table.rows })
      if (table.truncated) truncated = true
      return
    }
    if (node.name === 'w:sectPr' || node.name === 'w:bookmarkStart' || node.name === 'w:bookmarkEnd') return
    for (const child of node.children) walk(child)
  }
  if (body !== undefined) walk(body)
  return { blocks, truncated }
}

/* ---------------- xlsx: shared strings + first worksheet → blocks --------- */

/** Parse the shared string table into an ordered string list. */
function sharedStrings(data: Uint8Array): string[] {
  const root = parseXml(new TextDecoder().decode(data))
  const out: string[] = []
  for (const si of descendants(root, 'si')) {
    out.push(collectText(si).replace(/\s+/gu, ' ').trim())
  }
  return out
}

/** One parsed worksheet cell. */
interface SheetCell {
  readonly column: number
  readonly value: string
}

/** Convert a spreadsheet cell reference like "AB12" into a zero-based column. */
function columnOf(ref: string): number {
  let column = 0
  for (const char of ref) {
    if (char < 'A' || char > 'Z') break
    column = column * 26 + (char.charCodeAt(0) - 64)
  }
  return column - 1
}

function convertXlsx(data: Uint8Array): Converted {
  const files = unzipIndex(data)
  const stringsXml = files['xl/sharedStrings.xml']
  const strings = stringsXml === undefined ? [] : sharedStrings(stringsXml)
  const sheetName = firstWorksheet(files)
  const sheetXml = sheetName === null ? undefined : files[sheetName]
  if (sheetXml === undefined) throw new Error('xlsx: no worksheet found')
  const root = parseXml(new TextDecoder().decode(sheetXml))
  const rows: string[][] = []
  let truncated = false
  for (const row of descendants(root, 'row')) {
    if (rows.length >= OFFICE_MAX_TABLE_ROWS) {
      truncated = true
      break
    }
    const cells: string[] = []
    for (const cell of descendants(row, 'c')) {
      if (cells.length >= OFFICE_MAX_TABLE_COLS) break
      const type = cell.attrs['t']
      const valueNode = cell.children.find(child => child.name === 'v')
      let value = ''
      if (type === 's' && valueNode !== undefined) {
        const shared = Number(valueNode.text)
        value = Number.isInteger(shared) && shared >= 0 && shared < strings.length ? strings[shared]! : ''
      } else if (type === 'inlineStr') {
        const is = cell.children.find(child => child.name === 'is')
        value = is === undefined ? '' : collectText(is)
      } else {
        value = valueNode?.text ?? ''
      }
      const column = columnOf(cell.attrs['r'] ?? '')
      const index = column >= 0 && column < OFFICE_MAX_TABLE_COLS ? column : cells.length
      while (cells.length < index) cells.push('')
      if (index < OFFICE_MAX_TABLE_COLS) cells[index] = value.replace(/\s+/gu, ' ').trim()
    }
    if (cells.some(cell => cell !== '')) rows.push(cells)
  }
  if (rows.length === 0) return { blocks: [], truncated }
  const width = Math.max(...rows.map(row => row.length))
  const padded = rows.map(row => {
    const filled = [...row]
    while (filled.length < width) filled.push('')
    return filled
  })
  return { blocks: [{ type: 'table', rows: padded }], truncated }
}

/** The first worksheet path by worksheet order (workbook.xml) or sheet1. */
function firstWorksheet(files: Readonly<Record<string, Uint8Array>>): string | null {
  const workbook = files['xl/workbook.xml']
  if (workbook !== undefined) {
    const root = parseXml(new TextDecoder().decode(workbook))
    const sheet = descendants(root, 'sheet')[0]
    const rid = sheet?.attrs['r:id']
    if (rid !== undefined) {
      const rels = files['xl/_rels/workbook.xml.rels']
      if (rels !== undefined) {
        const relRoot = parseXml(new TextDecoder().decode(rels))
        for (const rel of descendants(relRoot, 'Relationship')) {
          if (rel.attrs['Id'] === rid) {
            const target = rel.attrs['Target']
            if (target !== undefined) {
              const name = target.startsWith('/') ? target.slice(1) : `xl/${target}`
              if (files[name] !== undefined) return name
            }
          }
        }
      }
    }
  }
  if (files['xl/worksheets/sheet1.xml'] !== undefined) return 'xl/worksheets/sheet1.xml'
  const sheet = Object.keys(files).find(name => /^xl\/worksheets\/sheet\d+\.xml$/u.test(name))
  return sheet ?? null
}

/** Unzip into a name→content map; zip bombs are guarded by the byte cap. */
function unzipIndex(data: Uint8Array): Readonly<Record<string, Uint8Array>> {
  return unzipSync(data)
}
