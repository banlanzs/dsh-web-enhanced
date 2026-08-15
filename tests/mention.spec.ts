/**
 * Composer mention pickers: the workspace listing they offer and the draft
 * text one pick produces.
 * @module dsh-web-enhanced/tests/mention
 */

import { describe, expect, it, vi } from 'vitest'
import { applyMention, mentionOptions } from '../src/client/mention.ts'
import type { MentionDeps } from '../src/client/mention.ts'
import type { FsSearchResult, WebEnhancedRemote } from '../src/client/contract.ts'

const entries = [
  { name: 'a.ts', path: 'src/a.ts', kind: 'file' as const, size: 3 },
  { name: 'src', path: 'src', kind: 'dir' as const },
  { name: 'note file.md', path: 'docs/note file.md', kind: 'file' as const, size: 9 },
]

function deps(overrides: Partial<MentionDeps> = {}, result: FsSearchResult = { entries }): MentionDeps {
  return {
    remote: { fsSearch: vi.fn(async () => result) } as unknown as WebEnhancedRemote,
    workspaceOf: () => 'w1',
    appendDraft: vi.fn(),
    // Run inline so the ordering contract is asserted separately, not awaited.
    defer: run => { run() },
    ...overrides,
  }
}

describe('mentionOptions', () => {
  it('offers only files to the file picker and only folders to the folder picker', async () => {
    expect(await mentionOptions(deps(), 'file', 's1')).toEqual([
      { id: 'src/a.ts', label: 'src/a.ts' },
      { id: 'docs/note file.md', label: 'docs/note file.md' },
    ])
    expect(await mentionOptions(deps(), 'dir', 's1')).toEqual([{ id: 'src', label: 'src' }])
  })

  it('refuses a session that belongs to no project', async () => {
    // The picker lists a project root; an ungrouped session has none.
    await expect(mentionOptions(deps({ workspaceOf: () => undefined }), 'file', 's1'))
      .rejects.toThrow('belongs to no project')
  })

  it('surfaces a host listing failure to the shell error strip', async () => {
    await expect(mentionOptions(deps({}, { error: { code: 'fs-search', message: 'boom' } }), 'file', 's1'))
      .rejects.toThrow('boom')
  })
})

describe('applyMention', () => {
  it('appends the path as an @ reference with a trailing space', () => {
    const appendDraft = vi.fn()
    applyMention(deps({ appendDraft }), 's1', 'src/a.ts')
    expect(appendDraft).toHaveBeenCalledWith('s1', '@src/a.ts ')
  })

  it('quotes a path containing spaces so the reference stays one token', () => {
    const appendDraft = vi.fn()
    applyMention(deps({ appendDraft }), 's1', 'docs/note file.md')
    expect(appendDraft).toHaveBeenCalledWith('s1', '@"docs/note file.md" ')
  })

  it('defers the write past the popup shell settle', () => {
    // The shell consumes its own `/mention-file` token AFTER onSelect settles,
    // under a draft-revision CAS: writing first leaves the command token in
    // the composer.
    const appendDraft = vi.fn()
    const deferred: Array<() => void> = []
    applyMention(deps({ appendDraft, defer: run => deferred.push(run) }), 's1', 'src/a.ts')
    expect(appendDraft).not.toHaveBeenCalled()
    deferred[0]!()
    expect(appendDraft).toHaveBeenCalledTimes(1)
  })
})
