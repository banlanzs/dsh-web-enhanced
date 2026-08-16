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
import { tasksUnchanged } from '../src/client/board/BoardOverlay.tsx'

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

describe('tasksUnchanged (poll shallow compare)', () => {
  const task = (id: string, status: string, updatedAt: number) =>
    ({ id, status, updatedAt }) as never as Parameters<typeof tasksUnchanged>[0][number]

  it('keeps a still board reference-equal and reacts to any movement', () => {
    const before = [task('a', 'running', 1), task('b', 'done', 2)]
    expect(tasksUnchanged(before, [task('a', 'running', 1), task('b', 'done', 2)])).toBe(true)
    expect(tasksUnchanged(before, [task('a', 'running', 3), task('b', 'done', 2)])).toBe(false)
    expect(tasksUnchanged(before, [task('a', 'done', 1), task('b', 'done', 2)])).toBe(false)
    expect(tasksUnchanged(before, [task('a', 'running', 1)])).toBe(false)
    expect(tasksUnchanged(before, [task('a', 'running', 1), task('b', 'done', 2), task('c', 'todo', 4)])).toBe(false)
  })
})
