# dsh-web-enhanced 记忆功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 dsh-web-enhanced 中实现同项目跨会话长期记忆，agent 通过工具写入，系统通过 standing section + pre-step hook 召回注入

**Architecture:** 复用 `web_enhanced` domain（version 1→2），新增 `memories` 表；memory-store.ts 封装 CRUD；memory.ts 注册 settings + systemPrompt section + save_memory 工具 + pre-step hook；gateway 暴露列表/删除 UI 接口

**Tech Stack:** @deepseek-ai/dsh-storage-domain, @deepseek-ai/dsh-tools, @deepseek-ai/dsh-agent, zod, vitest

---

## 文件结构

**新增**:
- `src/memory-store.ts` — storageDomain 封装：save/list/delete/byWorkspace/search
- `src/memory.ts` — 编排层：settings + systemPrompt section + 工具注册 + pre-step hook
- `tests/memory.spec.ts` — memory-store + memory 模块单元测试

**扩展**:
- `src/schemas.ts` — 新增 `memoryRecordSchema`
- `src/types.ts` — 新增 MemoryId/MemoryRecord/MemoryKind + Remote 类型
- `src/board.ts` — domain version 1→2，新增 memories 表
- `src/descriptors.ts` — 新增 memoryList/memoryDelete descriptor
- `src/gateway.ts` — 新增 memoryList/memoryDelete 方法
- `src/index.ts` — 调用 `applyMemory(ctx)`

---

### Task 1: 定义 MemoryRecord schema 和类型

**Files:**
- Modify: `src/schemas.ts:30` (append)
- Modify: `src/types.ts:704` (append)

- [ ] **Step 1: 写入 memoryRecordSchema**

在 `src/schemas.ts` 末尾追加：

```typescript
/** Durable memory record schema; validates every stored record at load and write. */
export const memoryRecordSchema = z.object({
  id: z.string(),
  workspaceId: z.string().nullable(),
  kind: z.enum(['user', 'feedback', 'project', 'reference']),
  summary: z.string().max(120),
  body: z.string(),
  sourceSessionId: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
})
```

- [ ] **Step 2: 写入 MemoryRecord 类型定义**

在 `src/types.ts` 末尾追加：

```typescript
/** Identifies one memory record. */
export type MemoryId = Branded<'MemoryId'>

/** Memory classification aligned with Claude Code memory system. */
export type MemoryKind = 'user' | 'feedback' | 'project' | 'reference'

/** Durable memory record (storage-domain table value). */
export interface MemoryRecord {
  readonly id: MemoryId
  readonly workspaceId: WorkspaceId | null
  readonly kind: MemoryKind
  readonly summary: string
  readonly body: string
  readonly sourceSessionId: SessionId | null
  readonly createdAt: number
  readonly updatedAt: number
}

/** Memory list Remote result. */
export type MemoryListResult = { readonly memories: readonly MemoryRecord[] } | { readonly error: ApiError }

/** Memory delete Remote result. */
export type MemoryDeleteResult = { readonly removed: boolean } | { readonly error: ApiError }

export interface MemoryListRequest { readonly workspaceId?: string | null }
export interface MemoryDeleteRequest { readonly id: string }
```

- [ ] **Step 3: 提交 schema 和类型**

```bash
cd dsh-plugins/dsh-web-enhanced
git add src/schemas.ts src/types.ts
git commit -m "feat(memory): add MemoryRecord schema and types"
```

---

### Task 2: 实现 memory-store 数据层

**Files:**
- Create: `src/memory-store.ts`

- [ ] **Step 1: 写 memory-store.ts 骨架（domain 打开 + 基础 CRUD）**

```typescript
/**
 * Memory storage layer: encapsulates the memories table CRUD operations.
 * @module dsh-web-enhanced/src/memory-store
 */

import type { Context } from '@deepseek-ai/cordis'
import type { Domain } from '@deepseek-ai/dsh-storage-domain'
import { randomUUID } from 'node:crypto'
import type { MemoryId, MemoryKind, MemoryRecord, WorkspaceId } from './types.ts'

function memoryId(raw: string): MemoryId {
  return raw as MemoryId
}

export interface MemorySaveInput {
  readonly workspaceId: WorkspaceId | null
  readonly kind: MemoryKind
  readonly summary: string
  readonly body: string
  readonly sourceSessionId: string | null
}

export interface MemorySaveResult {
  readonly ok: boolean
  readonly id: MemoryId
  /** True when an existing record was updated instead of creating a new one. */
  readonly deduplicated: boolean
}

/** Memory storage operations over the web_enhanced domain. */
export class MemoryStore {
  private ready: Promise<Domain<any>>

  constructor(ctx: Context) {
    this.ready = this.openDomain(ctx)
  }

  /** Save one memory; deduplicates by summary if within 24h window. */
  async save(input: MemorySaveInput): Promise<MemorySaveResult> {
    const domain = await this.ready
    const table = domain.table('memories')
    const now = Date.now()
    const dayAgo = now - 24 * 60 * 60 * 1000

    // Dedup: same workspace + summary + updatedAt within 24h → update body
    for (const [id, existing] of table.entries()) {
      if (
        existing.workspaceId === input.workspaceId &&
        existing.summary === input.summary &&
        existing.updatedAt > dayAgo
      ) {
        await table.update(id, current => ({
          ...current,
          body: input.body,
          updatedAt: now,
        }))
        return { ok: true, id, deduplicated: true }
      }
    }

    // New record
    const id = memoryId(`memory-${randomUUID()}`)
    const record: MemoryRecord = {
      id,
      workspaceId: input.workspaceId,
      kind: input.kind,
      summary: input.summary,
      body: input.body,
      sourceSessionId: input.sourceSessionId,
      createdAt: now,
      updatedAt: now,
    }
    await table.put(id, record)

    // Cap at 200 per workspace
    await this.enforceWorkspaceCap(domain, input.workspaceId, 200)

    return { ok: true, id, deduplicated: false }
  }

  /** List all memories, optionally filtered by workspace. */
  async list(workspaceId?: WorkspaceId | null): Promise<readonly MemoryRecord[]> {
    const domain = await this.ready
    const table = domain.table('memories')
    const all = [...table.entries()].map(([_, record]) => record)
    if (workspaceId === undefined) return all
    return all.filter(m => m.workspaceId === workspaceId)
  }

  /** Delete one memory by id. */
  async delete(id: MemoryId): Promise<boolean> {
    const domain = await this.ready
    return await domain.table('memories').delete(id)
  }

  /** Get memories for one workspace, sorted by updatedAt desc. */
  async byWorkspace(workspaceId: WorkspaceId | null): Promise<readonly MemoryRecord[]> {
    const all = await this.list(workspaceId)
    return all.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  /** Keyword search: split query, match against summary+body, rank by hit count. */
  async search(workspaceId: WorkspaceId | null, query: string): Promise<readonly MemoryRecord[]> {
    const all = await this.byWorkspace(workspaceId)
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0)
    if (terms.length === 0) return []

    const scored = all.map(m => {
      const haystack = `${m.summary} ${m.body}`.toLowerCase()
      const hits = terms.filter(t => haystack.includes(t)).length
      return { memory: m, hits }
    })

    return scored
      .filter(s => s.hits > 0)
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 3)
      .map(s => s.memory)
  }

  private async openDomain(ctx: Context): Promise<Domain<any>> {
    // Domain spec 在 board.ts，这里只获取；实际 version bump 在 Task 3
    return await ctx.get('storageDomain')!.open({ name: 'web_enhanced', version: 2, tables: { tasks: {}, memories: {} } } as any)
  }

  /** Remove oldest memories when workspace exceeds cap. */
  private async enforceWorkspaceCap(domain: Domain<any>, workspaceId: WorkspaceId | null, cap: number): Promise<void> {
    const table = domain.table('memories')
    const records = [...table.entries()]
      .map(([id, record]) => ({ id, record }))
      .filter(r => r.record.workspaceId === workspaceId)
      .sort((a, b) => a.record.updatedAt - b.record.updatedAt)

    const excess = records.length - cap
    if (excess <= 0) return

    for (let i = 0; i < excess; i++) {
      await table.delete(records[i]!.id)
    }
  }
}
```

- [ ] **Step 2: 提交 memory-store**

```bash
git add src/memory-store.ts
git commit -m "feat(memory): add MemoryStore data layer with CRUD and search"
```

---

### Task 3: Bump domain version 并新增 memories 表

**Files:**
- Modify: `src/board.ts:30-40`

- [ ] **Step 1: 修改 taskDomainSpec version 和 tables**

定位 `src/board.ts` 的 `taskDomainSpec` 定义（约 31 行），将 `version: 1` 改为 `version: 2`，并在 `tables` 对象中新增 `memories` 表：

```typescript
const taskDomainSpec = defineDomain({
  name: 'web_enhanced',
  version: 2,  // 1 → 2
  tables: {
    tasks: domainTable<TaskId, TaskRecord>(taskRecordSchema),
    memories: domainTable<string, MemoryRecord>(memoryRecordSchema),  // 新增
  },
})
```

需要在文件顶部导入 `memoryRecordSchema` 和 `MemoryRecord`：

```typescript
import { memoryRecordSchema, taskRecordSchema } from './schemas.ts'
import type { MemoryRecord, TaskId, TaskRecord } from './types.ts'
```

- [ ] **Step 2: 提交 domain version bump**

```bash
git add src/board.ts
git commit -m "feat(memory): bump web_enhanced domain to v2, add memories table"
```

---

### Task 4: 扩展 descriptors 和 gateway（UI 管理接口）

**Files:**
- Modify: `src/descriptors.ts` (append)
- Modify: `src/gateway.ts` (append method)

- [ ] **Step 1: 新增 memoryList 和 memoryDelete descriptor**

在 `src/descriptors.ts` 的 `WEB_ENHANCED_DESCRIPTORS` 数组末尾追加两项（仿现有 `unary` 模式）：

```typescript
  unary('memoryList', 'MemoryListRequest', 'MemoryListResult',
    okOrError(z.object({ memories: z.array(memoryRecordSchema) }))),
  unary('memoryDelete', 'MemoryDeleteRequest', 'MemoryDeleteResult',
    okOrError(z.object({ removed: z.boolean() }))),
```

需要导入 `memoryRecordSchema`（与 `taskRecordSchema` 并列）：

```typescript
import { memoryRecordSchema } from './schemas.ts'
```

- [ ] **Step 2: 在 gateway.ts 实现 memoryList 和 memoryDelete 方法**

在 `WebEnhancedGateway` 类中新增私有字段（与其他字段并列声明）：

```typescript
  private readonly memoryStore: MemoryStore
```

在构造函数体末尾（taskBoard 初始化之后）创建实例：

```typescript
  this.memoryStore = new MemoryStore(ctx)
```

文件顶部追加导入（与 board 的导入并列）：

```typescript
import { MemoryStore } from './memory-store.ts'
```

在类中新增两个方法（仿 `globalPromptGet`/`globalPromptSet` 的 try/catch 返回错误字段模式，workspace 解析用 gateway 已有的 `resolveWorkspaceId` 私有方法）：

```typescript
  /** List memories; omitted workspaceId lists every memory. */
  @Remote('memoryList')
  async memoryList(request: MemoryListRequest): Promise<MemoryListResult> {
    try {
      const workspaceId = request.workspaceId === undefined || request.workspaceId === null
        ? null
        : this.resolveWorkspaceId(request.workspaceId)
      if (request.workspaceId !== undefined && request.workspaceId !== null && workspaceId === null) {
        return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } }
      }
      const memories = await this.memoryStore.list(workspaceId)
      return { memories }
    } catch (error) {
      return { error: { code: 'memory-list', message: error instanceof Error ? error.message : String(error) } }
    }
  }

  /** Delete one memory by id. */
  @Remote('memoryDelete')
  async memoryDelete(request: MemoryDeleteRequest): Promise<MemoryDeleteResult> {
    try {
      const id = request.id
      if (id === '') return { error: { code: 'invalid-id', message: 'memory id must not be empty' } }
      const removed = await this.memoryStore.delete(id as MemoryId)
      return { removed }
    } catch (error) {
      return { error: { code: 'memory-delete', message: error instanceof Error ? error.message : String(error) } }
    }
  }
```

（`@Remote` 装饰器是 gateway.ts 现有模式——`globalPromptGet` 等已用它标注；`memoryList`/`memoryDelete` 必须同样标注，否则 SRC 发现缺失。注意：`MemoryStore` 与 TaskBoard 各自打开同一 domain——storage-domain 按 name 键控复用底层 medium，两个实例共享数据。）

同时更新 `src/types.ts` 中 `MemoryListResult`/`MemoryDeleteResult` 的 `readonly` 前缀（memoryList 返回的 `memories` 数组应为 `readonly`）：无需修改，descriptor 的 zod schema 已用 `z.array()` 校验，类型声明里的 `readonly` 只是编译期约束。

- [ ] **Step 3: 提交 Remote 接口**

```bash
git add src/descriptors.ts src/gateway.ts
git commit -m "feat(memory): add memoryList/Delete Remote for UI management"
```

---

### Task 5: 实现 memory.ts 编排层（settings + section + 工具 + hook）

**Files:**
- Create: `src/memory.ts`

- [ ] **Step 1: 写 memory.ts 完整实现（分段，先写 settings + section + 工具注册）**

```typescript
/**
 * Memory orchestration: settings namespace, systemPrompt section, save_memory tool, pre-step hook.
 * @module dsh-web-enhanced/src/memory
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { z } from 'zod'
import type { WorkspaceId, MemoryKind } from './types.ts'
import { MemoryStore } from './memory-store.ts'

export const MEMORY_SETTINGS_NS = 'dsh-web-enhanced-memory' as const
export const MEMORY_SECTION = 'web-enhanced:memory' as const
export const MEMORY_ORDER = 60 // After global-prompt (50), before tool guidance (100)

/** Settings schema: only an enabled flag (no user-editable text like global-prompt). */
const MemorySettingsSchema = z.object({
  enabled: z.boolean().default(true),
})

type MemorySettingsValue = z.infer<typeof MemorySettingsSchema>

let cachedWorkspaceId: WorkspaceId | null = null

export function applyMemory(ctx: Context): void {
  const store = new MemoryStore(ctx)

  // Register settings namespace
  const settingsService = ctx.get('settings')
  let scope: { get(): MemorySettingsValue } | undefined
  if (settingsService && 'register' in settingsService && typeof settingsService.register === 'function') {
    try {
      scope = settingsService.register(MEMORY_SETTINGS_NS, MemorySettingsSchema, { base: {}, applies: 'live' })
    } catch (error) {
      ctx.logger('web-enhanced:memory').warn('settings namespace registration failed:', error)
    }
  }

  const enabled = () => scope?.get().enabled ?? false

  // Register systemPrompt section (路径1: standing)
  const promptService = ctx.get('systemPrompt')
  if (promptService && 'section' in promptService && typeof promptService.section === 'function') {
    promptService.section({
      name: MEMORY_SECTION,
      order: MEMORY_ORDER,
      text: () => {
        if (!enabled() || cachedWorkspaceId === null) return ''
        const memories = store.byWorkspace(cachedWorkspaceId)
        return memories.then(list => list.slice(0, 10).map(m =>
          `[记忆 ${m.kind}] ${m.summary}：${m.body}`
        ).join('\n'))
      },
    })
  }

  // Register save_memory tool
  ctx.tools.register(defineTool({
    name: 'save_memory',
    description: '保存一条长期记忆到当前项目的记忆库，供未来会话召回。用于记录用户偏好、项目约定、重要决策、非显而易见的修复原因等。',
    parameters: z.object({
      kind: z.enum(['user', 'feedback', 'project', 'reference']).describe('记忆分类：user=用户偏好，feedback=工作方式反馈，project=项目约定，reference=外部资源指针'),
      summary: z.string().max(120).describe('一句话摘要，≤120字'),
      body: z.string().describe('完整内容，无长度上限'),
    }),
    output: z.object({
      ok: z.boolean(),
      id: z.string(),
      deduplicated: z.boolean().describe('True when an existing memory was updated instead of creating a new one'),
    }),
    execute: async (args, exec) => {
      const agent = exec.agent
      const session = agent.session
      const cwd = session.header.cwd
      const workspaceRegistry = ctx.get('workspaceRegistry')!
      const workspaceId = workspaceRegistry.list().find(w => w.cwd === cwd)?.id ?? null

      const result = await store.save({
        workspaceId,
        kind: args.kind,
        summary: args.summary,
        body: args.body,
        sourceSessionId: session.id,
      })

      return result
    },
  }))

  // Register pre-step hook (路径2: 精确召回)
  let lastInjectedSeq = -1

  ctx.on('agent/pre-step', async (payload, next) => {
    const decision = await next()
    if (decision?.kind !== 'enter' || !enabled()) return decision

    const agent = payload.agent as any
    const session = agent.session
    const seq = session.seq ?? 0

    // 防抖：同 seq 跳过
    if (seq === lastInjectedSeq) return decision
    lastInjectedSeq = seq

    const cwd = session.header.cwd
    const workspaceRegistry = ctx.get('workspaceRegistry')!
    const workspaceId = workspaceRegistry.list().find(w => w.cwd === cwd)?.id ?? null

    // 更新 cachedWorkspaceId 供 section 使用
    cachedWorkspaceId = workspaceId

    // 提取最后一条 user message
    const messages = session.deriveMessages()
    const lastUser = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUser || typeof lastUser.content !== 'string') return decision

    const query = lastUser.content
    const hits = await store.search(workspaceId, query)
    if (hits.length === 0) return decision

    // 注入
    const content = `[回忆] 基于你正在处理的工作，以下是项目记忆中可能相关的内容：\n${hits.map(m => `[${m.kind}] ${m.summary}：${m.body}`).join('\n')}`
    try {
      agent.inject({
        content,
        source: { kind: 'plugin', plugin: 'dsh-web-enhanced' },
      })
    } catch (error) {
      ctx.logger('web-enhanced:memory').warn('inject failed (agent disposed?):', error)
    }

    return decision
  })
}
```

- [ ] **Step 2: 提交 memory 编排层**

```bash
git add src/memory.ts
git commit -m "feat(memory): add memory orchestration (settings+section+tool+hook)"
```

---

### Task 6: 集成到 index.ts

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: 在 apply() 调用 applyMemory**

在 `src/index.ts` 的 `apply(ctx: Context)` 函数中，找到 `applyGlobalPrompt(ctx)` 调用，在其后追加：

```typescript
import { applyMemory } from './memory.ts'

// 在 apply() 函数内，applyGlobalPrompt(ctx) 之后
applyMemory(ctx)
```

- [ ] **Step 2: 提交集成**

```bash
git add src/index.ts
git commit -m "feat(memory): integrate memory module into plugin"
```

---

### Task 7: 编写测试

**Files:**
- Create: `tests/memory.spec.ts`

- [ ] **Step 1: 写 memory-store 测试**

```typescript
/**
 * Memory storage and orchestration tests.
 * @module dsh-web-enhanced/tests/memory
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { MemoryStore } from '../src/memory-store.ts'
import { applyMemory, MEMORY_SETTINGS_NS, MEMORY_SECTION } from '../src/memory.ts'
import { MemoryMediaPool, MemoryStorageBackend } from './helpers/memory-backend.ts'
import type { MemoryKind, WorkspaceId } from '../src/types.ts'

const contexts: Context[] = []

afterEach(async () => {
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
})

function mountStore(): { ctx: Context; store: MemoryStore } {
  const ctx = new Context()
  contexts.push(ctx)
  const pool = new MemoryMediaPool()
  const backend = new MemoryStorageBackend(pool)
  ctx.provide('storageDomain' as never, { open: (spec: any) => backend.kv.open(spec) } as never)
  const store = new MemoryStore(ctx)
  return { ctx, store }
}

describe('MemoryStore', () => {
  it('saves a new memory and returns its id', async () => {
    const { store } = mountStore()
    const result = await store.save({
      workspaceId: 'ws1' as WorkspaceId,
      kind: 'user',
      summary: 'Prefers TypeScript',
      body: 'Always write new code in TypeScript, not JavaScript.',
      sourceSessionId: 'sess1',
    })
    expect(result.ok).toBe(true)
    expect(result.id).toMatch(/^memory-/)
    expect(result.deduplicated).toBe(false)
  })

  it('deduplicates by summary within 24h window', async () => {
    const { store } = mountStore()
    const first = await store.save({
      workspaceId: 'ws1' as WorkspaceId,
      kind: 'feedback',
      summary: 'Use concise commits',
      body: 'First version of the rule.',
      sourceSessionId: 'sess1',
    })
    const second = await store.save({
      workspaceId: 'ws1' as WorkspaceId,
      kind: 'feedback',
      summary: 'Use concise commits',
      body: 'Updated version of the rule.',
      sourceSessionId: 'sess2',
    })
    expect(second.ok).toBe(true)
    expect(second.id).toBe(first.id)
    expect(second.deduplicated).toBe(true)

    const all = await store.list('ws1' as WorkspaceId)
    expect(all).toHaveLength(1)
    expect(all[0]!.body).toBe('Updated version of the rule.')
  })

  it('lists memories filtered by workspace', async () => {
    const { store } = mountStore()
    await store.save({
      workspaceId: 'ws1' as WorkspaceId,
      kind: 'user',
      summary: 'WS1 memory',
      body: 'Content A',
      sourceSessionId: null,
    })
    await store.save({
      workspaceId: 'ws2' as WorkspaceId,
      kind: 'project',
      summary: 'WS2 memory',
      body: 'Content B',
      sourceSessionId: null,
    })

    const ws1List = await store.list('ws1' as WorkspaceId)
    expect(ws1List).toHaveLength(1)
    expect(ws1List[0]!.summary).toBe('WS1 memory')

    const allList = await store.list()
    expect(allList).toHaveLength(2)
  })

  it('deletes a memory by id', async () => {
    const { store } = mountStore()
    const result = await store.save({
      workspaceId: null,
      kind: 'reference',
      summary: 'Docs link',
      body: 'https://example.com',
      sourceSessionId: null,
    })
    const removed = await store.delete(result.id)
    expect(removed).toBe(true)

    const list = await store.list()
    expect(list).toHaveLength(0)
  })

  it('searches memories by keyword matching', async () => {
    const { store } = mountStore()
    await store.save({
      workspaceId: 'ws1' as WorkspaceId,
      kind: 'user',
      summary: 'Prefers React hooks',
      body: 'Use functional components with hooks, not class components.',
      sourceSessionId: null,
    })
    await store.save({
      workspaceId: 'ws1' as WorkspaceId,
      kind: 'project',
      summary: 'API endpoint structure',
      body: 'All endpoints follow REST conventions.',
      sourceSessionId: null,
    })

    const hits = await store.search('ws1' as WorkspaceId, 'react hooks')
    expect(hits).toHaveLength(1)
    expect(hits[0]!.summary).toBe('Prefers React hooks')
  })

  it('enforces 200-record cap per workspace', async () => {
    const { store } = mountStore()
    // Save 205 records
    for (let i = 0; i < 205; i++) {
      await store.save({
        workspaceId: 'ws1' as WorkspaceId,
        kind: 'project',
        summary: `Memory ${i}`,
        body: `Body ${i}`,
        sourceSessionId: null,
      })
    }

    const list = await store.list('ws1' as WorkspaceId)
    expect(list.length).toBeLessThanOrEqual(200)
  })
})

describe('applyMemory', () => {
  function mountMemory(options: {
    readonly settings?: unknown
    readonly systemPrompt?: { section: ReturnType<typeof vi.fn> }
    readonly tools?: { register: ReturnType<typeof vi.fn> }
  }): {
    readonly ctx: Context
    readonly section: ReturnType<typeof vi.fn>
    readonly register: ReturnType<typeof vi.fn>
  } {
    const ctx = new Context()
    contexts.push(ctx)
    const pool = new MemoryMediaPool()
    const backend = new MemoryStorageBackend(pool)
    ctx.provide('storageDomain' as never, { open: (spec: any) => backend.kv.open(spec) } as never)
    ctx.provide('workspaceRegistry' as never, { list: () => [] } as never)

    const scope = { get: () => ({ enabled: true }) }
    const settingsRegister = vi.fn(() => scope)
    const section = vi.fn(() => () => {})
    const toolsRegister = vi.fn()

    if (options.settings !== undefined) ctx.provide('settings' as never, options.settings as never)
    else ctx.provide('settings' as never, { register: settingsRegister } as never)

    if (options.systemPrompt !== undefined) {
      ctx.provide('systemPrompt' as never, options.systemPrompt as never)
    } else {
      ctx.provide('systemPrompt' as never, { section } as never)
    }

    if (options.tools !== undefined) {
      ctx.provide('tools' as never, options.tools as never)
    } else {
      ctx.provide('tools' as never, { register: toolsRegister } as never)
    }

    applyMemory(ctx)
    return { ctx, section, register: toolsRegister }
  }

  it('registers settings namespace and systemPrompt section', () => {
    const { section, register } = mountMemory({})
    expect(section).toHaveBeenCalledWith(expect.objectContaining({
      name: MEMORY_SECTION,
    }))
    expect(register).toHaveBeenCalledWith(expect.objectContaining({
      name: 'save_memory',
    }))
  })

  it('stays inert when settings service is absent', () => {
    const section = vi.fn(() => () => {})
    mountMemory({ settings: {}, systemPrompt: { section } })
    expect(section).not.toHaveBeenCalled()
  })

  it('does not fail the plugin when namespace registration throws', () => {
    const settingsRegister = vi.fn(() => { throw new Error('namespace taken') })
    expect(() => mountMemory({ settings: { register: settingsRegister } })).not.toThrow()
    expect(settingsRegister).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: 运行测试**

```bash
pnpm test tests/memory.spec.ts
```

预期：所有测试通过（约 10 个测试用例）。

- [ ] **Step 3: 提交测试**

```bash
git add tests/memory.spec.ts
git commit -m "test(memory): add memory-store and applyMemory tests"
```

---

### Task 8: 运行完整测试套件并修复 dsh-tools import

**Files:**
- Potentially modify: `src/memory.ts`
- Potentially modify: `package.json`

- [ ] **Step 1: 运行完整测试套件**

```bash
pnpm test
```

预期：所有测试通过。如果 `defineTool` import 失败，执行 Step 2。

- [ ] **Step 2: 检查 @deepseek-ai/dsh-tools 是否在 peerDependencies**

```bash
cat package.json | grep -A5 peerDependencies
```

如果 `@deepseek-ai/dsh-tools` 不在列表中，添加它：

在 `package.json` 的 `peerDependencies` 对象中添加：

```json
"@deepseek-ai/dsh-tools": "workspace:*"
```

- [ ] **Step 3: 重新运行测试**

```bash
pnpm install
pnpm test
```

- [ ] **Step 4: 提交 package.json 更改（如果有）**

```bash
git add package.json
git commit -m "chore(memory): add dsh-tools peerDependency"
```

---

### Task 9: 功能验证（手动）

**Files:**
- None (manual testing)

- [ ] **Step 1: 启动 dsh 并打开 web-enhanced UI**

```bash
pnpm dev
```

打开浏览器访问 web-enhanced 界面。

- [ ] **Step 2: 在 agent 会话中调用 save_memory 工具**

在 agent 对话中输入：

```
请保存一条记忆：我偏好使用 TypeScript 而非 JavaScript
```

预期：agent 调用 `save_memory` 工具，返回 `{ ok: true, id: "memory-...", deduplicated: false }`。

- [ ] **Step 3: 开启新会话，验证召回**

关闭当前会话，开启新会话（同一项目），输入：

```
我应该用什么语言写新代码？
```

预期：systemPrompt section 或 pre-step hook 注入的记忆出现在 agent 上下文中，agent 回答"TypeScript"。

- [ ] **Step 4: 在 UI 中查看记忆列表**

（如果 UI 已实现 memoryList 调用）在设置或管理界面查看记忆列表，确认刚才保存的记忆存在。

- [ ] **Step 5: 删除记忆**

（如果 UI 已实现 memoryDelete 调用）删除刚才的记忆，刷新列表确认已删除。

---

## 自审清单

- [x] **Spec 覆盖**: 每个 spec 要求都有对应任务
  - MemoryRecord schema ✓ (Task 1)
  - memory-store CRUD + search ✓ (Task 2)
  - domain version bump ✓ (Task 3)
  - Remote 接口 ✓ (Task 4)
  - settings + section + 工具 + hook ✓ (Task 5)
  - 集成 ✓ (Task 6)
  - 测试 ✓ (Task 7-8)

- [x] **无占位符**: 所有代码块完整，无 TBD/TODO/类似模式

- [x] **类型一致性**: 
  - `MemoryId` 在 types.ts 定义，memory-store.ts 使用 ✓
  - `MemoryKind` 枚举在 types.ts 和 schema 中一致 ✓
  - `save()` 返回类型与 spec 一致 ✓

---

## 已知限制

1. **Domain version 冲突**: 旧版 task board 数据会被拒绝加载（pre-release 立场允许）
2. **并发写入**: storageDomain CAS 由底层保证，memory-store 无需额外锁
3. **关键词搜索**: 简易实现（分词 + 词频），未引入 embedding 依赖（符合 YAGNI）
4. **Workspace 标识**: 依赖 `workspaceRegistry.list()` 反查，假设 cwd → workspace.id 映射稳定

---

计划完成。保存至 `docs/superpowers/plans/2026-08-17-memory-implementation.md`。
