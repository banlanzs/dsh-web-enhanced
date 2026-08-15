/**
 * Which task cards start collapsed.
 *
 * One line of logic, but it encodes a choice worth pinning: the done column is
 * what grew unreadable, and a failed task is the opposite case — its message is
 * the reason to open the board at all.
 * @module dsh-web-enhanced/tests/task-card
 */

import { describe, expect, it } from 'vitest'
import { collapsesByDefault } from '../src/client/board/TaskCard.tsx'

describe('collapsesByDefault', () => {
  it('collapses finished tasks and nothing else', () => {
    expect(collapsesByDefault('done')).toBe(true)
    expect(collapsesByDefault('planned')).toBe(false)
    expect(collapsesByDefault('todo')).toBe(false)
    expect(collapsesByDefault('running')).toBe(false)
  })

  it('keeps a failed task open, because its message is the point', () => {
    expect(collapsesByDefault('failed')).toBe(false)
  })
})
