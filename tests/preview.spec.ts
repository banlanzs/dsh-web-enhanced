/**
 * Preview kind selection and tab loading: which rendered form a path maps to
 * and how host reads become a tab.
 * @module dsh-web-enhanced/tests/preview
 */

import { describe, expect, it, vi } from 'vitest'
import {
  baseNameOf, dataUrlOf, extensionOf, hasRenderedForm, initialModeOf, isEditable,
  loadPreviewTab, previewKindOf,
} from '../src/client/preview.ts'
import type { WebEnhancedRemote } from '../src/client/contract.ts'

/** A remote whose file methods answer fixed results. */
function remoteWith(overrides: Partial<WebEnhancedRemote>): WebEnhancedRemote {
  return overrides as WebEnhancedRemote
}

describe('extensionOf / baseNameOf', () => {
  it('reads the extension and basename of nested paths', () => {
    expect(extensionOf('a/b/c.TS')).toBe('ts')
    expect(baseNameOf('a/b/c.ts')).toBe('c.ts')
    expect(extensionOf('a/b/README')).toBe('')
  })

  it('treats a dotfile as extensionless', () => {
    expect(extensionOf('.gitignore')).toBe('')
    expect(extensionOf('a/.env')).toBe('')
  })
})

describe('previewKindOf', () => {
  it('maps each family to its rendered form', () => {
    expect(previewKindOf('a.md')).toBe('markdown')
    expect(previewKindOf('a.html')).toBe('html')
    expect(previewKindOf('a.patch')).toBe('diff')
    expect(previewKindOf('a.csv')).toBe('csv')
    expect(previewKindOf('a.pdf')).toBe('pdf')
    expect(previewKindOf('a.docx')).toBe('office')
    expect(previewKindOf('a.png')).toBe('image')
    expect(previewKindOf('a.ts')).toBe('code')
    expect(previewKindOf('a.log')).toBe('text')
  })

  it('recognises extensionless build files as code', () => {
    expect(previewKindOf('Dockerfile')).toBe('code')
    expect(previewKindOf('src/Makefile')).toBe('code')
    expect(previewKindOf('LICENSE')).toBe('text')
  })
})

describe('mode and editability rules', () => {
  it('offers a rendered form only where one exists', () => {
    expect(hasRenderedForm('markdown')).toBe(true)
    expect(hasRenderedForm('csv')).toBe(true)
    expect(hasRenderedForm('code')).toBe(false)
    expect(initialModeOf('markdown')).toBe('view')
    expect(initialModeOf('code')).toBe('source')
  })

  it('withholds editing from binary and converted formats', () => {
    expect(isEditable('code')).toBe(true)
    expect(isEditable('markdown')).toBe(true)
    expect(isEditable('image')).toBe(false)
    expect(isEditable('pdf')).toBe(false)
    expect(isEditable('office')).toBe(false)
  })
})

describe('dataUrlOf', () => {
  it('builds a typed data URL per binary family', () => {
    const base = { name: 'x', mode: 'view', truncated: false, size: 1 } as const
    expect(dataUrlOf({ ...base, path: 'a.png', kind: 'image', binary: 'AA' })).toBe('data:image/png;base64,AA')
    expect(dataUrlOf({ ...base, path: 'a.jpg', kind: 'image', binary: 'AA' })).toBe('data:image/jpeg;base64,AA')
    expect(dataUrlOf({ ...base, path: 'a.svg', kind: 'image', binary: 'AA' })).toBe('data:image/svg+xml;base64,AA')
    expect(dataUrlOf({ ...base, path: 'a.pdf', kind: 'pdf', binary: 'AA' })).toBe('data:application/pdf;base64,AA')
  })

  it('answers undefined when the payload was capped away', () => {
    expect(dataUrlOf({
      path: 'a.png', name: 'a.png', kind: 'image', mode: 'view', binary: '', truncated: true, size: 9e9,
    })).toBeUndefined()
  })
})

describe('loadPreviewTab', () => {
  it('loads text through fsRead and starts in the kind default mode', async () => {
    const fsRead = vi.fn(async () => ({ kind: 'text' as const, content: '# hi', truncated: false, size: 4 }))
    const tab = await loadPreviewTab(remoteWith({ fsRead }), 'w1', 'docs/a.md')
    expect(fsRead).toHaveBeenCalledWith({ workspaceId: 'w1', path: 'docs/a.md' })
    expect(tab).toMatchObject({ path: 'docs/a.md', name: 'a.md', kind: 'markdown', mode: 'view', content: '# hi' })
  })

  it('loads binary payloads without a draft-able body', async () => {
    const fsRead = vi.fn(async () => ({ kind: 'binary' as const, content: 'AA', truncated: false, size: 2 }))
    const tab = await loadPreviewTab(remoteWith({ fsRead }), 'w1', 'a.png')
    expect(tab).toMatchObject({ kind: 'image', mode: 'view', binary: 'AA' })
    expect(tab.content).toBeUndefined()
  })

  it('routes Office files through the host converter', async () => {
    const fsOfficePreview = vi.fn(async () => ({
      kind: 'docx' as const, blocks: [{ type: 'p' as const, text: 'x' }], truncated: false,
    }))
    const tab = await loadPreviewTab(remoteWith({ fsOfficePreview }), 'w1', 'a.docx')
    expect(fsOfficePreview).toHaveBeenCalledWith({ workspaceId: 'w1', path: 'a.docx' })
    expect(tab.office).toEqual({ kind: 'docx', blocks: [{ type: 'p', text: 'x' }], truncated: false })
  })

  it('keeps the tab and carries the message when the host refuses', async () => {
    const fsRead = vi.fn(async () => ({ error: { code: 'not-found', message: 'gone' } }))
    const tab = await loadPreviewTab(remoteWith({ fsRead }), 'w1', 'a.ts')
    // A failed read must still produce a tab: the panel renders the reason in
    // place rather than silently dropping the file the user clicked.
    expect(tab).toMatchObject({ path: 'a.ts', kind: 'code', mode: 'source', error: 'gone' })
  })

  it('carries an Office conversion failure the same way', async () => {
    const fsOfficePreview = vi.fn(async () => ({ error: { code: 'office-too-large', message: 'too big' } }))
    const tab = await loadPreviewTab(remoteWith({ fsOfficePreview }), 'w1', 'a.xlsx')
    expect(tab).toMatchObject({ kind: 'office', mode: 'source', error: 'too big' })
  })
})
