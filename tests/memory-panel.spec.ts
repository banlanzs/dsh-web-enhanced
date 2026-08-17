/**
 * Memory panel decisions that are not React.
 *
 * The panel itself is not rendered here — this package's tests run in the node
 * environment and its UI is guarded by the type checker — so the judgement
 * worth pinning is extracted as a pure function: which rows the three filters
 * keep, and that the wording the tab depends on exists in the dictionary.
 * @module dsh-web-enhanced/tests/memory-panel
 */

import { describe, expect, it } from 'vitest'
import { matches } from '../src/client/settings/MemoryPanel.tsx'
import { zh, en } from '../src/client/locales.ts'
import type { MemoryId, MemoryRecord, WorkspaceId } from '../src/types.ts'

const row = (overrides: Partial<MemoryRecord> = {}): MemoryRecord => ({
  id: 'memory-1' as MemoryId,
  workspaceId: 'ws-1' as WorkspaceId,
  kind: 'project',
  summary: '提交信息中英双语',
  body: '每条 commit 一行中文一行英文。',
  sourceSessionId: null,
  createdAt: 1,
  updatedAt: 2,
  ...overrides,
})

describe('matches', () => {
  it('keeps every row when no filter is active', () => {
    expect(matches(row(), undefined, 'all', '')).toBe(true)
    expect(matches(row({ workspaceId: null, kind: 'user' }), undefined, 'all', '')).toBe(true)
  })

  it('separates the global pool from project-owned records', () => {
    // The panel lists BOTH pools, so this filter is the only way a user can
    // tell a cross-project memory from one this project owns.
    expect(matches(row({ workspaceId: null }), undefined, 'global', '')).toBe(true)
    expect(matches(row({ workspaceId: null }), undefined, 'workspace', '')).toBe(false)
    expect(matches(row(), undefined, 'workspace', '')).toBe(true)
    expect(matches(row(), undefined, 'global', '')).toBe(false)
  })

  it('narrows by classification', () => {
    expect(matches(row({ kind: 'user' }), 'user', 'all', '')).toBe(true)
    expect(matches(row({ kind: 'user' }), 'project', 'all', '')).toBe(false)
  })

  it('searches the body as well as the summary', () => {
    // A memory's point is often in its body; matching the summary alone would
    // hide the row a user is searching for.
    expect(matches(row(), undefined, 'all', 'commit')).toBe(true)
    expect(matches(row(), undefined, 'all', '双语')).toBe(true)
    expect(matches(row(), undefined, 'all', 'nothing-here')).toBe(false)
  })

  it('applies the filters together, not in the alternative', () => {
    expect(matches(row({ kind: 'user', workspaceId: null }), 'user', 'global', 'commit')).toBe(true)
    expect(matches(row({ kind: 'user', workspaceId: null }), 'user', 'workspace', 'commit')).toBe(false)
  })
})

describe('memory dictionary', () => {
  it('carries every key the tab renders, in both languages', () => {
    const keys = [
      'memory.title', 'memory.hint', 'memory.enabled', 'memory.enabledHint',
      'memory.saving', 'memory.saved', 'memory.saveError', 'memory.conflict',
      'memory.readonly', 'memory.configMissing', 'memory.searchPlaceholder',
      'memory.searchEmpty', 'memory.expand', 'memory.collapse', 'memory.deleted',
      'memory.scope.all', 'memory.scope.workspace', 'memory.scope.global',
    ] as const
    for (const key of keys) {
      expect(zh, key).toHaveProperty(key)
      expect(en, key).toHaveProperty(key)
    }
  })

  it('states that turning the switch off keeps the stored memories', () => {
    // The switch sits above a delete-capable list; a user must not read it as
    // "this erases what was saved".
    expect(zh['memory.enabledHint']).toContain('不受影响')
  })
})
