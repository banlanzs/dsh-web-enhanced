/**
 * Memory feature unit tests: durable CRUD and dedup on `MemoryStore`, plus
 * the orchestrator wiring (`applyMemory`) that registers the settings
 * namespace, the standing prompt section, and the `save_memory` tool.
 *
 * Mounts the real `DomainFacility` from `@deepseek-ai/dsh-storage-domain`
 * over the in-memory backend, the same way `board.spec.ts` does, so
 * `MemoryStore` sees a fully-featured domain object — not just a bare
 * `KvUnit` returned by `backend.kv.open`.
 * @module dsh-web-enhanced/tests/memory
 */

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { MemoryMediaPool, MemoryStorageBackend } from './helpers/memory-backend.ts'
import { migrateJsonDomainV1ToV2 } from '../src/board.ts'
import { MemoryStore, memorySearchTerms } from '../src/memory-store.ts'
import { applyMemory, lastUserText, MEMORY_ORDER, MEMORY_SECTION, MEMORY_SETTINGS_NS, MemorySettingsSchema, textOfMessageContent } from '../src/memory.ts'
import type { WorkspaceId } from '../src/types.ts'

const contexts: Context[] = []
const roots: string[] = []

afterEach(async () => {
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

/**
 * Mount one Cordis context with a real `DomainFacility` over an in-memory
 * backend, identical to the harness `board.spec.ts` uses; this is what
 * `MemoryStore` (and `openSharedDomain`) read as `storageDomain`.
 */
async function mountStoreContext(): Promise<Context> {
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(Storage)
  ctx.storage.backend.register('memory', new MemoryStorageBackend(new MemoryMediaPool()))
  const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  return ctx
}

describe('memorySearchTerms', () => {
  it('turns a Chinese question into overlapping bigrams without keeping the whole sentence', () => {
    const terms = memorySearchTerms('这个项目的发布前检查命令是什么？')
    expect(terms).toEqual(expect.arrayContaining(['发布', '检查', '命令']))
    expect(terms).not.toContain('这个项目的发布前检查命令是什么')
  })

  it('keeps Latin words whole inside a mixed query', () => {
    const terms = memorySearchTerms('pnpm check 是什么')
    expect(terms).toEqual(expect.arrayContaining(['pnpm', 'check', '是什', '什么']))
  })

  it('returns an empty list for blank input', () => {
    expect(memorySearchTerms('')).toEqual([])
    expect(memorySearchTerms('   ')).toEqual([])
  })
})

describe('MemoryStore', () => {
  it('saves a new record with the expected fields and id prefix', async () => {
    const ctx = await mountStoreContext()
    const store = new MemoryStore(ctx)
    const result = await store.save({
      workspaceId: 'ws-1' as WorkspaceId,
      kind: 'project',
      summary: 'use react hooks for state',
      body: 'Prefer hooks over class components for local state.',
      sourceSessionId: 'sess-abc',
    })
    expect(result.ok).toBe(true)
    expect(result.deduplicated).toBe(false)
    expect(result.id).toMatch(/^memory-/)
    const records = await store.list()
    expect(records).toHaveLength(1)
    const [record] = records
    expect(record).toBeDefined()
    expect(record!.kind).toBe('project')
    expect(record!.summary).toBe('use react hooks for state')
    expect(record!.body).toBe('Prefer hooks over class components for local state.')
    expect(record!.workspaceId).toBe('ws-1' as WorkspaceId)
    expect(record!.sourceSessionId).toBe('sess-abc')
    expect(record!.createdAt).toBe(record!.updatedAt)
  })

  it('deduplicates same workspace+summary within 24 hours by updating body in place', async () => {
    const ctx = await mountStoreContext()
    const store = new MemoryStore(ctx)
    const first = await store.save({
      workspaceId: 'ws-1' as WorkspaceId,
      kind: 'project',
      summary: 'repo conventions',
      body: 'first body',
      sourceSessionId: 's1',
    })
    const second = await store.save({
      workspaceId: 'ws-1' as WorkspaceId,
      kind: 'project',
      summary: 'repo conventions',
      body: 'updated body',
      sourceSessionId: 's1',
    })
    expect(second.deduplicated).toBe(true)
    expect(second.id).toBe(first.id)
    const records = await store.list()
    expect(records).toHaveLength(1)
    expect(records[0]!.body).toBe('updated body')
    expect(records[0]!.updatedAt).toBeGreaterThanOrEqual(records[0]!.createdAt)
  })

  it('does not deduplicate across distinct workspace ids', async () => {
    const ctx = await mountStoreContext()
    const store = new MemoryStore(ctx)
    const a = await store.save({
      workspaceId: 'ws-1' as WorkspaceId,
      kind: 'project',
      summary: 'shared summary',
      body: 'a',
      sourceSessionId: null,
    })
    const b = await store.save({
      workspaceId: 'ws-2' as WorkspaceId,
      kind: 'project',
      summary: 'shared summary',
      body: 'b',
      sourceSessionId: null,
    })
    const c = await store.save({
      workspaceId: null,
      kind: 'project',
      summary: 'shared summary',
      body: 'c',
      sourceSessionId: null,
    })
    expect(a.deduplicated).toBe(false)
    expect(b.deduplicated).toBe(false)
    expect(c.deduplicated).toBe(false)
    expect(new Set([String(a.id), String(b.id), String(c.id)]).size).toBe(3)
    const all = await store.list()
    expect(all).toHaveLength(3)
  })

  it('list(workspaceId) filters to that workspace only', async () => {
    const ctx = await mountStoreContext()
    const store = new MemoryStore(ctx)
    await store.save({ workspaceId: 'ws-1' as WorkspaceId, kind: 'user', summary: 'a', body: 'a', sourceSessionId: null })
    await store.save({ workspaceId: 'ws-2' as WorkspaceId, kind: 'user', summary: 'b', body: 'b', sourceSessionId: null })
    await store.save({ workspaceId: null, kind: 'user', summary: 'c', body: 'c', sourceSessionId: null })
    const ws1 = await store.list('ws-1' as WorkspaceId)
    expect(ws1).toHaveLength(1)
    expect(ws1[0]!.summary).toBe('a')
    const wsNull = await store.list(null)
    expect(wsNull).toHaveLength(1)
    expect(wsNull[0]!.summary).toBe('c')
    const everything = await store.list()
    expect(everything).toHaveLength(3)
  })

  it('delete returns true for an existing id and false for an unknown id', async () => {
    const ctx = await mountStoreContext()
    const store = new MemoryStore(ctx)
    const { id } = await store.save({
      workspaceId: 'ws-1' as WorkspaceId,
      kind: 'project',
      summary: 'deletable',
      body: 'x',
      sourceSessionId: null,
    })
    expect(await store.delete(id)).toBe(true)
    expect(await store.list()).toHaveLength(0)
    expect(await store.delete(id)).toBe(false)
    expect(await store.delete('memory-not-real' as never)).toBe(false)
  })

  it('byWorkspace sorts records by updatedAt descending', async () => {
    const ctx = await mountStoreContext()
    const store = new MemoryStore(ctx)
    await store.save({ workspaceId: 'ws-1' as WorkspaceId, kind: 'project', summary: 'first', body: '1', sourceSessionId: null })
    await new Promise(resolve => setTimeout(resolve, 5))
    await store.save({ workspaceId: 'ws-1' as WorkspaceId, kind: 'project', summary: 'second', body: '2', sourceSessionId: null })
    const ordered = await store.byWorkspace('ws-1' as WorkspaceId)
    expect(ordered).toHaveLength(2)
    expect(ordered[0]!.summary).toBe('second')
    expect(ordered[1]!.summary).toBe('first')
    expect(ordered[0]!.updatedAt).toBeGreaterThanOrEqual(ordered[1]!.updatedAt)
  })

  it('search returns top hits and ignores unrelated queries', async () => {
    const ctx = await mountStoreContext()
    const store = new MemoryStore(ctx)
    await store.save({
      workspaceId: 'ws-1' as WorkspaceId,
      kind: 'reference',
      summary: 'react hooks pattern',
      body: 'Use hooks for component state.',
      sourceSessionId: null,
    })
    await store.save({
      workspaceId: 'ws-1' as WorkspaceId,
      kind: 'reference',
      summary: 'rest api endpoints',
      body: 'The REST API exposes /users and /sessions.',
      sourceSessionId: null,
    })
    const reactHits = await store.search('ws-1' as WorkspaceId, 'react')
    expect(reactHits).toHaveLength(1)
    expect(reactHits[0]!.summary).toContain('react hooks pattern')
    const noneHits = await store.search('ws-1' as WorkspaceId, 'zzz')
    expect(noneHits).toEqual([])
  })

  it('search matches a Chinese natural-language question against a stored summary', async () => {
    const ctx = await mountStoreContext()
    const store = new MemoryStore(ctx)
    await store.save({
      workspaceId: 'ws-1' as WorkspaceId,
      kind: 'project',
      summary: '发布前必须运行 pnpm check',
      body: '这个项目的发布前检查命令是 pnpm check。',
      sourceSessionId: null,
    })
    const hits = await store.search('ws-1' as WorkspaceId, '这个项目的发布前检查命令是什么？')
    expect(hits).toHaveLength(1)
    expect(hits[0]!.summary).toContain('pnpm check')
  })

  it('search returns empty for an empty query', async () => {
    const ctx = await mountStoreContext()
    const store = new MemoryStore(ctx)
    await store.save({
      workspaceId: 'ws-1' as WorkspaceId,
      kind: 'project',
      summary: 'anything',
      body: 'body',
      sourceSessionId: null,
    })
    expect(await store.search('ws-1' as WorkspaceId, '')).toEqual([])
    expect(await store.search('ws-1' as WorkspaceId, '   ')).toEqual([])
  })

  it('caps each workspace at 200 records by dropping the oldest', async () => {
    const ctx = await mountStoreContext()
    const store = new MemoryStore(ctx)
    for (let index = 0; index < 205; index += 1) {
      await store.save({
        workspaceId: 'ws-1' as WorkspaceId,
        kind: 'project',
        summary: `summary-${index}`,
        body: `body-${index}`,
        sourceSessionId: null,
      })
    }
    const records = await store.list('ws-1' as WorkspaceId)
    expect(records.length).toBe(200)
    // The five oldest records (summary-0..4) fall past the cap; the survivors
    // keep insertion order, so assert the extrema through their timestamps
    // rather than lexicographic summary order (summary-10 < summary-5 as text).
    const byUpdatedAt = [...records].sort((left, right) => left.updatedAt - right.updatedAt)
    expect(byUpdatedAt[0]!.summary).toBe('summary-5')
    expect(byUpdatedAt[byUpdatedAt.length - 1]!.summary).toBe('summary-204')
  })
})

describe('lastUserText', () => {
  it('picks the latest user text from claimed block messages', () => {
    expect(lastUserText([
      { role: 'user', content: [{ type: 'text', text: '第一条' }] },
      { role: 'assistant', content: [{ type: 'text', text: '回答' }] },
      { role: 'user', content: [{ type: 'text', text: '这个项目的发布前检查命令是什么？' }] },
    ])).toBe('这个项目的发布前检查命令是什么？')
  })

  it('skips plugin context until it finds the real user question', () => {
    expect(lastUserText([
      { role: 'user', content: [{ type: 'text', text: '这个项目的发布前检查命令是什么？' }] },
      { role: 'user', content: [{ type: 'text', text: 'runtime context' }] },
    ])).toBe('runtime context')
  })

  it('returns empty for no user messages', () => {
    expect(lastUserText([])).toBe('')
    expect(lastUserText([{ role: 'assistant', content: 'x' }])).toBe('')
  })
})

describe('textOfMessageContent', () => {
  it('reads raw strings and joins text blocks while ignoring non-text blocks', () => {
    expect(textOfMessageContent('plain question')).toBe('plain question')
    expect(textOfMessageContent([
      { type: 'text', text: '这个项目的' },
      { type: 'text', text: '发布前检查命令是什么？' },
    ])).toBe('这个项目的 发布前检查命令是什么？')
    expect(textOfMessageContent([
      { type: 'text', text: 'x' },
      { type: 'image', attachment: {} },
      { type: 'tool-result', content: [] },
    ])).toBe('x')
    expect(textOfMessageContent(undefined)).toBe('')
    expect(textOfMessageContent({ type: 'text', text: 'x' })).toBe('')
  })
})

describe('migrateJsonDomainV1ToV2', () => {
  it('stamps an existing v1 web_enhanced file to v2 and adds an empty memories table', async () => {
    const root = await mkdtemp(join(tmpdir(), 'web-enhanced-memory-migration-'))
    roots.push(root)
    await writeFile(join(root, 'web_enhanced.json'), JSON.stringify({
      unit: { name: 'web_enhanced', version: 1 },
      global: null,
      tables: { tasks: {} },
    }, null, 2) + '\n', 'utf8')
    const ctx = new Context()
    contexts.push(ctx)
    ctx.provide('storage' as never, { backend: { get: () => ({ root }) } } as never)
    ctx.provide('storageDomain' as never, { config: { backend: 'json' } } as never)
    await migrateJsonDomainV1ToV2(ctx)
    const migrated = JSON.parse(await readFile(join(root, 'web_enhanced.json'), 'utf8'))
    expect(migrated.unit).toEqual({ name: 'web_enhanced', version: 2 })
    expect(migrated.tables.memories).toEqual({})
  })

  it('leaves an already-v2 or non-web-enhanced file untouched', async () => {
    const root = await mkdtemp(join(tmpdir(), 'web-enhanced-memory-migration-'))
    roots.push(root)
    const already = JSON.stringify({
      unit: { name: 'web_enhanced', version: 2 },
      global: null,
      tables: { tasks: {}, memories: {} },
    }, null, 2) + '\n'
    await writeFile(join(root, 'web_enhanced.json'), already, 'utf8')
    const ctx = new Context()
    contexts.push(ctx)
    ctx.provide('storage' as never, { backend: { get: () => ({ root }) } } as never)
    ctx.provide('storageDomain' as never, { config: { backend: 'json' } } as never)
    await migrateJsonDomainV1ToV2(ctx)
    expect(await readFile(join(root, 'web_enhanced.json'), 'utf8')).toBe(already)
  })
})

describe('applyMemory wiring', () => {
  /** Mount one orchestrator context with fakes for every host service. */
  async function mountOrchestrator(options: {
    readonly withSettings?: boolean
    readonly withSystemPrompt?: boolean
    readonly withTools?: boolean
    readonly withRegistry?: boolean
  }): Promise<{
    readonly ctx: Context
    readonly register: ReturnType<typeof vi.fn>
    readonly section: ReturnType<typeof vi.fn>
    readonly toolsRegister: ReturnType<typeof vi.fn>
    readonly registry: { list: ReturnType<typeof vi.fn> }
  }> {
    const ctx = await mountStoreContext()
    const register = vi.fn(() => ({ get: () => ({ enabled: true }) }))
    const section = vi.fn(() => () => {})
    const toolsRegister = vi.fn()
    const registry = { list: vi.fn(() => []) }
    if (options.withSettings !== false) ctx.provide('settings' as never, { register } as never)
    if (options.withSystemPrompt !== false) ctx.provide('systemPrompt' as never, { section } as never)
    if (options.withTools !== false) ctx.provide('tools' as never, { register: toolsRegister } as never)
    if (options.withRegistry !== false) ctx.provide('workspaceRegistry' as never, registry as never)
    applyMemory(ctx)
    return { ctx, register, section, toolsRegister, registry }
  }

  it('registers the settings namespace with the live schema', async () => {
    const { register } = await mountOrchestrator({})
    expect(register).toHaveBeenCalledWith(
      MEMORY_SETTINGS_NS,
      MemorySettingsSchema,
      { base: {}, applies: 'live' },
    )
  })

  it('installs the standing prompt section at MEMORY_ORDER with MEMORY_SECTION name', async () => {
    const { section } = await mountOrchestrator({})
    expect(section).toHaveBeenCalledWith(expect.objectContaining({
      name: MEMORY_SECTION,
      order: MEMORY_ORDER,
      text: expect.any(Function),
    }))
  })

  it('registers save_memory with a full JSON-Schema parameters object and an execute function', async () => {
    const { toolsRegister } = await mountOrchestrator({})
    expect(toolsRegister).toHaveBeenCalledTimes(1)
    const definition = toolsRegister.mock.calls[0]![0] as {
      name: string
      parameters: {
        type: string
        properties: Record<string, { type: string }>
        required: string[]
      }
      execute: (...args: unknown[]) => unknown
    }
    expect(definition.name).toBe('save_memory')
    expect(definition.parameters.type).toBe('object')
    expect(Object.keys(definition.parameters.properties).sort()).toEqual(['body', 'kind', 'summary'])
    expect(definition.parameters.required).toEqual(['kind', 'summary', 'body'])
    expect(typeof definition.execute).toBe('function')
  })

  it('stays inert without settings, systemPrompt, tools, or workspaceRegistry', async () => {
    const register = vi.fn()
    const section = vi.fn(() => () => {})
    const toolsRegister = vi.fn()
    const registry = { list: vi.fn(() => []) }
    const ctx = await mountStoreContext()
    ctx.provide('settings' as never, { register } as never)
    ctx.provide('systemPrompt' as never, { section } as never)
    ctx.provide('tools' as never, { register: toolsRegister } as never)
    ctx.provide('workspaceRegistry' as never, registry as never)
    expect(() => applyMemory(ctx)).not.toThrow()
    expect(register).toHaveBeenCalled()
    expect(section).toHaveBeenCalled()
    expect(toolsRegister).toHaveBeenCalled()
  })

  it('tolerates missing settings service: prompt section and tool still register', async () => {
    const section = vi.fn(() => () => {})
    const toolsRegister = vi.fn()
    const ctx = await mountStoreContext()
    ctx.provide('systemPrompt' as never, { section } as never)
    ctx.provide('tools' as never, { register: toolsRegister } as never)
    ctx.provide('workspaceRegistry' as never, { list: () => [] } as never)
    expect(() => applyMemory(ctx)).not.toThrow()
    expect(section).toHaveBeenCalled()
    expect(toolsRegister).toHaveBeenCalled()
  })

  it('tolerates missing tools service: settings and prompt still register', async () => {
    const register = vi.fn(() => ({ get: () => ({ enabled: true }) }))
    const section = vi.fn(() => () => {})
    const ctx = await mountStoreContext()
    ctx.provide('settings' as never, { register } as never)
    ctx.provide('systemPrompt' as never, { section } as never)
    ctx.provide('workspaceRegistry' as never, { list: () => [] } as never)
    expect(() => applyMemory(ctx)).not.toThrow()
    expect(register).toHaveBeenCalled()
    expect(section).toHaveBeenCalled()
  })
})
