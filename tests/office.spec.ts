import { describe, expect, it } from 'vitest'
import { zipSync } from 'fflate'
import {
  isOfficeName, officeKindOf, officePreviewView, OFFICE_MAX_BLOCKS, OFFICE_MAX_TABLE_ROWS,
} from '../src/office.ts'

const encode = (text: string): Uint8Array => new TextEncoder().encode(text)

/** One minimal docx with the given body XML. */
function docx(body: string): Buffer {
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`
  return Buffer.from(zipSync({ 'word/document.xml': encode(xml) }))
}

/** One minimal xlsx with the given sheet rows and optional shared strings. */
function xlsx(rowsXml: string, stringsXml = ''): Buffer {
  const files: Record<string, Uint8Array> = {
    'xl/workbook.xml': encode('<workbook xmlns:r="r"><sheets><sheet name="S1" r:id="rId1"/></sheets></workbook>'),
    'xl/_rels/workbook.xml.rels': encode('<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>'),
    'xl/worksheets/sheet1.xml': encode(`<worksheet><sheetData>${rowsXml}</sheetData></worksheet>`),
  }
  if (stringsXml !== '') files['xl/sharedStrings.xml'] = encode(stringsXml)
  return Buffer.from(zipSync(files))
}

describe('officeKindOf', () => {
  it('maps supported extensions and rejects everything else', () => {
    expect(officeKindOf('a.docx')).toBe('docx')
    expect(officeKindOf('A.XLSX')).toBe('xlsx')
    expect(officeKindOf('a.doc')).toBeNull()
    expect(officeKindOf('a.xls')).toBeNull()
    expect(officeKindOf('a.txt')).toBeNull()
    expect(isOfficeName('notes.docx')).toBe(true)
    expect(isOfficeName('notes.md')).toBe(false)
  })
})

describe('officePreviewView', () => {
  it('rejects unsupported formats before reading', async () => {
    const result = await officePreviewView('/root', 'legacy.doc', { maxBytes: 5 * 1024 * 1024 })
    expect(result).toMatchObject({ error: { code: 'office-unsupported' } })
  })

  it('rejects files over the byte cap', async () => {
    // The path never touches the filesystem for the size check to fail first:
    // write a real small file in a temp root via a helper instead.
    const { mkdtemp, writeFile, rm } = await import('node:fs/promises')
    const { tmpdir } = await import('node:os')
    const { join } = await import('node:path')
    const root = await mkdtemp(join(tmpdir(), 'office-spec-'))
    try {
      await writeFile(join(root, 'big.docx'), Buffer.alloc(11))
      const result = await officePreviewView(root, 'big.docx', { maxBytes: 10 })
      expect(result).toMatchObject({ error: { code: 'office-too-large' } })
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('answers office-invalid for a broken zip', async () => {
    const { mkdtemp, writeFile, rm } = await import('node:fs/promises')
    const { tmpdir } = await import('node:os')
    const { join } = await import('node:path')
    const root = await mkdtemp(join(tmpdir(), 'office-spec-'))
    try {
      await writeFile(join(root, 'bad.xlsx'), Buffer.from('PK not a zip'))
      const result = await officePreviewView(root, 'bad.xlsx', { maxBytes: 1024 })
      expect(result).toMatchObject({ error: { code: 'office-invalid' } })
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})

describe('docx conversion', () => {
  it('maps headings, paragraphs, lists, and tables into blocks', async () => {
    const { mkdtemp, writeFile, rm } = await import('node:fs/promises')
    const { tmpdir } = await import('node:os')
    const { join } = await import('node:path')
    const root = await mkdtemp(join(tmpdir(), 'office-spec-'))
    try {
      await writeFile(join(root, 'doc.docx'), docx(
        '<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Sub</w:t></w:r></w:p>'
        + '<w:p><w:r><w:t>Body with</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>tab</w:t></w:r></w:p>'
        + '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/></w:numPr></w:pPr><w:r><w:t>First</w:t></w:r></w:p>'
        + '<w:p><w:pPr><w:numPr/></w:pPr><w:r><w:t>Second</w:t></w:r></w:p>'
        + '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>X</w:t></w:r></w:p></w:tc></w:tr></w:tbl>',
      ))
      const result = await officePreviewView(root, 'doc.docx', { maxBytes: 5 * 1024 * 1024 })
      if ('error' in result) throw new Error(result.error.message)
      expect(result.kind).toBe('docx')
      expect(result.blocks).toEqual([
        { type: 'h2', text: 'Sub' },
        { type: 'p', text: 'Body with\ttab' },
        { type: 'li', text: 'First' },
        { type: 'li', text: 'Second' },
        { type: 'table', rows: [['X']] },
      ])
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('skips empty paragraphs and truncates block floods', async () => {
    const { mkdtemp, writeFile, rm } = await import('node:fs/promises')
    const { tmpdir } = await import('node:os')
    const { join } = await import('node:path')
    const root = await mkdtemp(join(tmpdir(), 'office-spec-'))
    try {
      const many = Array.from({ length: OFFICE_MAX_BLOCKS + 5 }, (_, i) =>
        `<w:p><w:r><w:t>P${i}</w:t></w:r></w:p>`).join('')
      await writeFile(join(root, 'flood.docx'), docx('<w:p><w:r><w:t>   </w:t></w:r></w:p>' + many))
      const result = await officePreviewView(root, 'flood.docx', { maxBytes: 5 * 1024 * 1024 })
      if ('error' in result) throw new Error(result.error.message)
      expect(result.truncated).toBe(true)
      expect(result.blocks).toHaveLength(OFFICE_MAX_BLOCKS)
      expect(result.blocks[0]).toEqual({ type: 'p', text: 'P0' })
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})

describe('xlsx conversion', () => {
  it('resolves shared strings and numeric cells into a padded table', async () => {
    const { mkdtemp, writeFile, rm } = await import('node:fs/promises')
    const { tmpdir } = await import('node:os')
    const { join } = await import('node:path')
    const root = await mkdtemp(join(tmpdir(), 'office-spec-'))
    try {
      await writeFile(join(root, 'sheet.xlsx'), xlsx(
        '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1"><v>9</v></c></row>'
        + '<row r="2"><c r="A2" t="s"><v>1</v></c></row>',
        '<sst><si><t>Alpha</t></si><si><t>Beta</t></si></sst>',
      ))
      const result = await officePreviewView(root, 'sheet.xlsx', { maxBytes: 5 * 1024 * 1024 })
      if ('error' in result) throw new Error(result.error.message)
      expect(result.kind).toBe('xlsx')
      expect(result.blocks).toEqual([{ type: 'table', rows: [['Alpha', '', '9'], ['Beta', '', '']] }])
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('bounds table rows and marks truncation', async () => {
    const { mkdtemp, writeFile, rm } = await import('node:fs/promises')
    const { tmpdir } = await import('node:os')
    const { join } = await import('node:path')
    const root = await mkdtemp(join(tmpdir(), 'office-spec-'))
    try {
      const rows = Array.from({ length: OFFICE_MAX_TABLE_ROWS + 10 }, (_, i) =>
        `<row r="${i + 1}"><c r="A${i + 1}"><v>${i}</v></c></row>`).join('')
      await writeFile(join(root, 'tall.xlsx'), xlsx(rows))
      const result = await officePreviewView(root, 'tall.xlsx', { maxBytes: 5 * 1024 * 1024 })
      if ('error' in result) throw new Error(result.error.message)
      expect(result.truncated).toBe(true)
      const table = result.blocks[0]
      expect(table.type).toBe('table')
      expect(table.rows).toHaveLength(OFFICE_MAX_TABLE_ROWS)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
