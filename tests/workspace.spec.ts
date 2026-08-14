/**
 * Session-to-workspace resolution: the bridge from the framework's current
 * session to the project root every panel surface addresses.
 * @module dsh-web-enhanced/tests/workspace
 */

import { describe, expect, it } from 'vitest'
import { workspaceOfSession } from '../src/client/workspace.ts'
import type { WorkspaceSlice } from '../src/client/workspace.ts'

/** A workspace list holding two projects. */
const workspaces = {
  items: [
    { workspaceId: 'w1', path: '/a', title: 'A', sessionIds: ['s1', 's2'], createdAt: '', updatedAt: '' },
    { workspaceId: 'w2', path: '/b', title: 'B', sessionIds: ['s3'], createdAt: '', updatedAt: '' },
  ],
} as unknown as WorkspaceSlice

describe('workspaceOfSession', () => {
  it('finds the workspace accounting for the current session', () => {
    expect(workspaceOfSession({ current: 's2' }, workspaces)?.workspaceId).toBe('w1')
    expect(workspaceOfSession({ current: 's3' }, workspaces)?.workspaceId).toBe('w2')
  })

  it('answers undefined with no current session', () => {
    expect(workspaceOfSession({ current: undefined }, workspaces)).toBeUndefined()
  })

  it('answers undefined for an ungrouped session', () => {
    // An ungrouped session has no project root, so the surfaces that need one
    // render their empty state instead of guessing at a directory.
    expect(workspaceOfSession({ current: 'sX' }, workspaces)).toBeUndefined()
  })

  it('answers undefined when no workspace exists yet', () => {
    expect(workspaceOfSession({ current: 's1' }, { items: [] })).toBeUndefined()
  })
})
