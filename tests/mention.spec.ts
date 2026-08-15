/**
 * Composer mention pickers: the workspace listing they offer and the draft
 * text one pick produces.
 * @module dsh-web-enhanced/tests/mention
 */

import { describe, expect, it, vi } from 'vitest'
import { applyMention, BROWSE_OPTION_ID, mentionOptions } from '../src/client/mention.ts'
import type { MentionDeps } from '../src/client/mention.ts'
import type { FsSearchResult, WebEnhancedRemote } from '../src/client/contract.ts'

const entries = [
  { name: 'a.ts', path: 'src/a.ts', kind: 'file' as const, size: 3 },
  { name: 'src', path: 'src', kind: 'dir' as const },
  { name: 'note file.md', path: 'docs/note file.md', kind: 'file' as const, size: 9 },
]

const browseRow = { id: BROWSE_OPTION_ID, label: 'browse…' }

function deps(overrides: Partial<MentionDeps> = {}, result: FsSearchResult = { entries }): MentionDeps {
  return {
    remote: { fsSearch: vi.fn(async () => result) } as unknown as WebEnhancedRemote,
    workspaceOf: () => 'w1',
    appendDraft: vi.fn(),
    openBrowse: vi.fn(),
    browseLabel: () => 'browse…',
    // Run inline so the ordering contract is asserted separately, not awaited.
    defer: run => { run() },
    ...overrides,
  }
}

describe('mentionOptions', () => {
  it('offers only files to the file picker and only folders to the folder picker', async () => {
    expect(await mentionOptions(deps(), 'file', 's1')).toEqual([
      browseRow,
      { id: 'src/a.ts', label: 'src/a.ts' },
      { id: 'docs/note file.md', label: 'docs/note file.md' },
    ])
    expect(await mentionOptions(deps(), 'dir', 's1')).toEqual([
      browseRow,
      { id: 'src', label: 'src' },
    ])
  })

  it('uses the default skipDirs-aware search so vendor trees do not flood the window', async () => {
    // node_modules & co are exactly the paths nobody mentions; including them
    // would fill the bounded list and crowd out real project files. The browse
    // row remains the escape hatch for anything inside a skipped directory.
    const fsSearch = vi.fn(async () => ({ entries: [] }) as const)
    await mentionOptions(deps({ remote: { fsSearch } as unknown as WebEnhancedRemote }), 'file', 's1')
    expect(fsSearch).toHaveBeenCalledWith({ workspaceId: 'w1' })
  })

  it('offers the browse row alone to a session that belongs to no project', async () => {
    // There is no project to list, but nothing about an ungrouped session
    // forbids naming a path.
    const remote = { fsSearch: vi.fn() } as unknown as WebEnhancedRemote
    expect(await mentionOptions(deps({ remote, workspaceOf: () => undefined }), 'file', 's1'))
      .toEqual([browseRow])
    expect(remote.fsSearch).not.toHaveBeenCalled()
  })

  it('surfaces a host listing failure to the shell error strip', async () => {
    await expect(mentionOptions(deps({}, { error: { code: 'fs-search', message: 'boom' } }), 'file', 's1'))
      .rejects.toThrow('boom')
  })
})

describe('applyMention', () => {
  it('appends the path as an @ reference with a trailing space', () => {
    const appendDraft = vi.fn()
    applyMention(deps({ appendDraft }), 'file', 's1', 'src/a.ts')
    expect(appendDraft).toHaveBeenCalledWith('s1', '@src/a.ts ')
  })

  it('quotes a path containing spaces so the reference stays one token', () => {
    const appendDraft = vi.fn()
    applyMention(deps({ appendDraft }), 'file', 's1', 'docs/note file.md')
    expect(appendDraft).toHaveBeenCalledWith('s1', '@"docs/note file.md" ')
    // An absolute Windows path is exactly the case the browser produces.
    applyMention(deps({ appendDraft }), 'file', 's1', 'C:\\Program Files\\x\\a.txt')
    expect(appendDraft).toHaveBeenLastCalledWith('s1', '@"C:\\Program Files\\x\\a.txt" ')
  })

  it('opens the host-wide browser instead of inserting when the browse row is picked', () => {
    const appendDraft = vi.fn()
    const openBrowse = vi.fn()
    applyMention(deps({ appendDraft, openBrowse }), 'dir', 's1', BROWSE_OPTION_ID)
    expect(openBrowse).toHaveBeenCalledWith('dir', 's1')
    expect(appendDraft).not.toHaveBeenCalled()
  })

  it('defers the write past the popup shell settle', () => {
    // The shell consumes its own `/mention-file` token AFTER onSelect settles,
    // under a draft-revision CAS: writing first leaves the command token in
    // the composer.
    const appendDraft = vi.fn()
    const deferred: Array<() => void> = []
    applyMention(deps({ appendDraft, defer: run => deferred.push(run) }), 'file', 's1', 'src/a.ts')
    expect(appendDraft).not.toHaveBeenCalled()
    deferred[0]!()
    expect(appendDraft).toHaveBeenCalledTimes(1)
  })
})
