/**
 * The gateway's empty-query search cache.
 *
 * The `+` mention picker opens with no query, which walks the whole workspace;
 * the cache keeps that walk from repeating on every open. Tested through the
 * real gateway remotes: what is pinned is which results go stale (and when),
 * not the Map that holds them.
 * @module dsh-web-enhanced/tests/search-cache
 */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { MemoryMediaPool, MemoryStorageBackend } from './helpers/memory-backend.ts'
import { WebEnhancedGateway } from '../src/index.ts'
import type { FsSearchResult } from '../src/types.ts'

const contexts: Context[] = []
const roots: string[] = []

async function tempRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'web-enhanced-sc-'))
  roots.push(root)
  return root
}

/** A gateway over the given workspaces, mounted the way the host mounts it. */
async function searchGateway(workspaces: Array<{ id: string; path: string }>): Promise<WebEnhancedGateway> {
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(Storage)
  ctx.storage.backend.register('memory', new MemoryStorageBackend(new MemoryMediaPool()))
  const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  ctx.provide('workspaceRegistry', { list: () => workspaces, get: () => undefined } as never)
  ctx.provide('agents', { create: vi.fn() } as never)
  ctx.provide('sessions', { flush: vi.fn(async () => true) } as never)
  ctx.provide('agentDefaultModel', { currentSelection: () => ({ provider: 'deepseek', model: 'deepseek-chat' }) } as never)
  await ctx.plugin(WebEnhancedGateway, {})
  return ctx.get('webEnhanced') as WebEnhancedGateway
}

/** Result paths of one search; a rejection result fails the test. */
async function searchPaths(result: Promise<FsSearchResult>): Promise<string[]> {
  const settled = await result
  if ('error' in settled) throw new Error(settled.error.message)
  return settled.entries.map(entry => entry.path)
}

afterEach(async () => {
  vi.useRealTimers()
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

describe('fsSearch empty-query cache', () => {
  it('serves repeated empty queries from the cache and bypasses for non-empty ones', async () => {
    const root = await tempRoot()
    await writeFile(join(root, 'hello.txt'), 'hello')
    const gateway = await searchGateway([{ id: 'w1', path: root }])
    expect(await searchPaths(gateway.fsSearch({ workspaceId: 'w1' }))).toEqual(['hello.txt'])
    await writeFile(join(root, 'added.txt'), 'x')
    // Both an omitted and a whitespace query are the picker's open state.
    expect(await searchPaths(gateway.fsSearch({ workspaceId: 'w1' }))).toEqual(['hello.txt'])
    expect(await searchPaths(gateway.fsSearch({ workspaceId: 'w1', query: '   ' }))).toEqual(['hello.txt'])
    // A real query always walks.
    expect(await searchPaths(gateway.fsSearch({ workspaceId: 'w1', query: 'added' }))).toEqual(['added.txt'])
  })

  it('expires after the TTL', async () => {
    const root = await tempRoot()
    await writeFile(join(root, 'hello.txt'), 'hello')
    const gateway = await searchGateway([{ id: 'w1', path: root }])
    vi.useFakeTimers()
    expect(await searchPaths(gateway.fsSearch({ workspaceId: 'w1' }))).toEqual(['hello.txt'])
    await writeFile(join(root, 'late.txt'), 'x')
    expect(await searchPaths(gateway.fsSearch({ workspaceId: 'w1' }))).toEqual(['hello.txt'])
    vi.advanceTimersByTime(30_000)
    expect(await searchPaths(gateway.fsSearch({ workspaceId: 'w1' }))).toEqual(['hello.txt', 'late.txt'])
  })

  it('drops the workspace\'s cached results on fsWrite and fsDelete, leaving other workspaces alone', async () => {
    const root1 = await tempRoot()
    const root2 = await tempRoot()
    await writeFile(join(root1, 'a.txt'), 'a')
    await writeFile(join(root2, 'b.txt'), 'b')
    const gateway = await searchGateway([
      { id: 'w1', path: root1 },
      { id: 'w2', path: root2 },
    ])
    expect(await searchPaths(gateway.fsSearch({ workspaceId: 'w1' }))).toEqual(['a.txt'])
    expect(await searchPaths(gateway.fsSearch({ workspaceId: 'w2' }))).toEqual(['b.txt'])

    expect(await gateway.fsWrite({ workspaceId: 'w1', path: 'new.txt', content: 'n' })).toEqual({ ok: true })
    // w1's entries were dumped; w2 keeps its cached walk.
    expect(await searchPaths(gateway.fsSearch({ workspaceId: 'w1' }))).toEqual(['a.txt', 'new.txt'])
    await writeFile(join(root2, 'late.txt'), 'x')
    expect(await searchPaths(gateway.fsSearch({ workspaceId: 'w2' }))).toEqual(['b.txt'])

    expect(await gateway.fsDelete({ workspaceId: 'w1', path: 'new.txt' })).toEqual({ ok: true })
    expect(await searchPaths(gateway.fsSearch({ workspaceId: 'w1' }))).toEqual(['a.txt'])
  })

  it('keeps at most the latest four keys, evicting the oldest first', async () => {
    const root = await tempRoot()
    for (let index = 1; index <= 4; index++) {
      await mkdir(join(root, `sub${index}`))
      await writeFile(join(root, `sub${index}`, `f${index}.txt`), 'x')
    }
    const gateway = await searchGateway([{ id: 'w1', path: root }])
    // Five distinct keys: root plus four subdirectories.
    await searchPaths(gateway.fsSearch({ workspaceId: 'w1' }))
    for (let index = 1; index <= 4; index++) {
      await searchPaths(gateway.fsSearch({ workspaceId: 'w1', path: `sub${index}` }))
    }
    // The root search (oldest key) was evicted, so it walks again...
    await writeFile(join(root, 'fresh-root.txt'), 'x')
    expect(await searchPaths(gateway.fsSearch({ workspaceId: 'w1' }))).toContain('fresh-root.txt')
    // ...while sub4 (latest four) still serves its cached walk.
    await writeFile(join(root, 'sub4', 'fresh-sub.txt'), 'x')
    expect(await searchPaths(gateway.fsSearch({ workspaceId: 'w1', path: 'sub4' }))).toEqual(['sub4/f4.txt'])
  })

  it('does not cache error results', async () => {
    const root = await tempRoot()
    const gateway = await searchGateway([{ id: 'w1', path: root }])
    const failed = await gateway.fsSearch({ workspaceId: 'w1', path: 'missing' })
    // ENOENT maps to not-found through the gateway's error mapping.
    expect('error' in failed && failed.error.code).toBe('not-found')
    // The failed walk was not cached: once the directory exists, it is found.
    await mkdir(join(root, 'missing'))
    await writeFile(join(root, 'missing', 'found.txt'), 'x')
    expect(await searchPaths(gateway.fsSearch({ workspaceId: 'w1', path: 'missing' }))).toEqual(['missing/found.txt'])
  })
})
