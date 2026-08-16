/**
 * The cron scheduler's one-shot arming.
 *
 * Focused on TaskBoard directly (fake timers) because the observable is the
 * timer itself: nothing scheduled means no timer exists, and a scheduled task
 * fires at its own next run, never on a fixed polling interval.
 * @module dsh-web-enhanced/tests/board
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { MemoryMediaPool, MemoryStorageBackend } from './helpers/memory-backend.ts'
import { TaskBoard } from '../src/board.ts'
import type { BoardDeps } from '../src/board.ts'

const contexts: Context[] = []

afterEach(async () => {
  vi.useRealTimers()
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
})

/** A board over an in-memory domain whose runs start instantly. */
async function boardFixture(cronIntervalMs: number): Promise<{
  ctx: Context
  board: TaskBoard
  started: () => number
}> {
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(Storage)
  ctx.storage.backend.register('memory', new MemoryStorageBackend(new MemoryMediaPool()))
  const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  const create = vi.fn(async () => ({
    agent: {
      whenIdle: vi.fn(async () => {}),
      followup: vi.fn(),
      // No events: the run settles as failed, which is enough to observe that
      // the scheduler started it.
      session: { seq: 0, events: [], id: 's1' },
    },
  }))
  const board = new TaskBoard(ctx, {
    agents: { create },
    sessions: { flush: vi.fn(async () => true) },
    agentDefaultModel: { currentSelection: () => ({ provider: 'deepseek', model: 'deepseek-chat' }) },
    awaitLoader: undefined,
    presets: () => undefined,
    attachWorkspaceSession: undefined,
    workspaceRoot: () => process.cwd(),
    resolveWorkspaceId: () => null,
    logger: { warn: () => {} },
  } as unknown as BoardDeps, { cronIntervalMs })
  return { ctx, board, started: () => create.mock.calls.length }
}

/** Create one cron task, failing the test on a rejection result. */
async function cronTask(board: TaskBoard, cron: string): Promise<number> {
  const created = await board.create({ title: 't', prompt: 'p', cron })
  if ('error' in created) throw new Error(created.error.message)
  return created.task.nextRunAt!
}

describe('TaskBoard scheduler', () => {
  it('arms no timer while no task has a next run', async () => {
    vi.useFakeTimers()
    await boardFixture(30_000)
    await vi.advanceTimersByTimeAsync(0)
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(120_000)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('arms one timer at the nearest next run and fires there', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 15, 12, 30, 0))
    const { board, started } = await boardFixture(1_000)
    await vi.advanceTimersByTimeAsync(0)
    const near = await cronTask(board, '* * * * *')
    await cronTask(board, '0 23 * * *')
    expect(vi.getTimerCount()).toBe(1)
    await vi.advanceTimersByTimeAsync(near - Date.now() - 1)
    expect(started()).toBe(0)
    await vi.advanceTimersByTimeAsync(1)
    // Only the near task was due; the 23:00 one must not have started.
    expect(started()).toBe(1)
  })

  it('never arms sooner than the configured interval', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 15, 12, 30, 45))
    const { board, started } = await boardFixture(30_000)
    await vi.advanceTimersByTimeAsync(0)
    // 15s to the next minute — under the 30s floor, so the run starts one
    // interval after the create, not at the boundary itself.
    const due = await cronTask(board, '* * * * *')
    await vi.advanceTimersByTimeAsync(due - Date.now())
    expect(started()).toBe(0)
    await vi.advanceTimersByTimeAsync(30_000 - (due - Date.now()))
    expect(started()).toBe(1)
  })

  it('re-arms on cron edits and disarms when no next run remains', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 15, 12, 30, 0))
    const { board, started } = await boardFixture(1_000)
    await vi.advanceTimersByTimeAsync(0)
    const far = await cronTask(board, '0 23 * * *')
    await vi.advanceTimersByTimeAsync(3_600_000)
    expect(started()).toBe(0)
    expect(far).toBeGreaterThan(Date.now())

    const id = (await board.list()).tasks[0]!.id
    const updated = await board.update({ id, cron: '* * * * *' })
    if ('error' in updated) throw new Error(updated.error.message)
    const due = updated.task.nextRunAt!
    await vi.advanceTimersByTimeAsync(due - Date.now() - 1)
    expect(started()).toBe(0)
    await vi.advanceTimersByTimeAsync(1)
    expect(started()).toBe(1)
    // Let the run settle (it re-arms at the following minute), then clear the
    // cron — moving the failed task back to todo, since update cannot keep a
    // settled status. Nothing is scheduled anymore, so no timer stays armed.
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)
    const cleared = await board.update({ id, cron: null, status: 'todo' })
    if ('error' in cleared) throw new Error(cleared.error.message)
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(120_000)
    expect(started()).toBe(1)
  })

  it('clears the pending timer on dispose', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 15, 12, 30, 0))
    const { ctx, board, started } = await boardFixture(1_000)
    await vi.advanceTimersByTimeAsync(0)
    const due = await cronTask(board, '* * * * *')
    expect(vi.getTimerCount()).toBe(1)
    await ctx.fiber.dispose()
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(due - Date.now() + 1_000)
    expect(started()).toBe(0)
  })
})
