import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { zipSync } from 'fflate'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { defineDomain, DomainFacility, domainTable } from '@deepseek-ai/dsh-storage-domain'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import { remoteMethods } from '@deepseek-ai/dsh-typert-protocol'
import { MemoryMediaPool, MemoryStorageBackend } from './helpers/memory-backend.ts'
import { taskRecordSchema } from '../src/schemas.ts'
import type { TaskId, TaskRecord, VisionConfigPatch } from '../src/types.ts'
import { WebEnhancedGateway } from '../src/index.ts'
import { FakeSubprocess } from './helpers/fake-subprocess.ts'

const DOMAIN_SPEC = defineDomain({
  name: 'web_enhanced',
  version: 1,
  tables: { tasks: domainTable<TaskId, TaskRecord>(taskRecordSchema as never) },
})

const contexts: Context[] = []
const roots: string[] = []

async function tempRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'web-enhanced-gw-'))
  roots.push(root)
  return root
}

afterEach(async () => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  delete process.env.WEB_ENHANCED_TEST_KEY
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

/** Fake agent whose run settles with the given outcome events. */
function fakeAgent(events: SessionEvent[], id = 's-run'): unknown {
  return {
    whenIdle: vi.fn(async () => {}),
    followup: vi.fn(),
    session: { seq: 10, events, id },
  }
}

function completedEvents(): SessionEvent[] {
  return [
    { seq: 10, time: 10, type: 'turn/start', data: { turn: 1 } },
    { seq: 11, time: 11, type: 'assistant/message', data: { message: { content: [{ type: 'text', text: 'all done' }] } } },
    { seq: 12, time: 12, type: 'turn/end', data: { turn: 1, reason: { kind: 'completed' } } },
  ] as unknown as SessionEvent[]
}

interface HarnessOptions {
  pool?: MemoryMediaPool
  createAgent?: () => unknown
  flush?: () => Promise<unknown>
  workspaces?: Array<{ id: string; path: string }>
  /** Roster the runs compose against; omitted means a deployment without one. */
  presets?: { resolve: (id?: string) => Promise<{ id: string }>; mount: (agentCtx: unknown, id?: string) => Promise<unknown> }
  /** Membership refusal, so the run-survives-a-refused-attach path is reachable. */
  attachFails?: string
  /** Profile directory the plugin-management methods act on. */
  profileDir?: string
}

async function harness(options: HarnessOptions = {}): Promise<{
  ctx: Context
  gateway: WebEnhancedGateway
  pool: MemoryMediaPool
  subprocess: FakeSubprocess
  create: ReturnType<typeof vi.fn>
  attached: Array<[string, string]>
  warnings: string[]
  setCreate: (fn: (options: unknown) => Promise<unknown>) => void
}> {
  const pool = options.pool ?? new MemoryMediaPool()
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(Storage)
  ctx.storage.backend.register('memory', new MemoryStorageBackend(pool))
  const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  const workspaces = options.workspaces ?? []
  const attached: Array<[string, string]> = []
  const entityOf = (id: string): unknown => ({
    ...workspaces.find(workspace => workspace.id === id),
    attachSession: async (sessionId: string) => {
      if (options.attachFails !== undefined) throw new Error(options.attachFails)
      attached.push([id, sessionId])
    },
  })
  ctx.provide('workspaceRegistry', {
    list: () => workspaces,
    get: (id: string) => (workspaces.some(workspace => workspace.id === id) ? entityOf(id) : undefined),
  } as never)
  const warnings: string[] = []
  const baseWarn = ctx.logger.warn.bind(ctx.logger)
  ctx.logger.warn = ((...args: unknown[]) => {
    warnings.push(args.map(String).join(' '))
    // Silence only what this gateway reports; anything else still prints.
    if (!warnings[warnings.length - 1]!.startsWith('web-enhanced')) baseWarn(...args as [unknown])
  }) as typeof ctx.logger.warn
  if (options.presets !== undefined) ctx.provide('agentPresets' as never, options.presets as never)
  // Constructing the Service subclass registers it as ctx.subprocess.
  const subprocess = new FakeSubprocess(ctx)
  const createRef: { current: (options: unknown) => Promise<unknown> } = {
    current: async () => ({
      agent: (options.createAgent ?? (() => fakeAgent(completedEvents())))() as never,
      dispose: async () => {},
    }),
  }
  const create = vi.fn((agentOptions: unknown) => createRef.current(agentOptions))
  ctx.provide('agents', { create } as never)
  ctx.provide('sessions', { flush: vi.fn(async () => options.flush === undefined ? true : options.flush()) } as never)
  ctx.provide('agentDefaultModel', { currentSelection: () => ({ provider: 'deepseek', model: 'deepseek-chat' }) } as never)
  await ctx.plugin(WebEnhancedGateway, {
    balanceApiKeyEnv: 'WEB_ENHANCED_TEST_KEY',
    ...options.profileDir === undefined ? {} : { profileDir: options.profileDir },
  })
  const gateway = ctx.get('webEnhanced') as WebEnhancedGateway
  return {
    ctx, gateway, pool, subprocess, create, attached, warnings,
    setCreate: (fn) => { createRef.current = fn },
  }
}

/** Poll with real timers until the assertion passes (awaited; async asserts poll). */
async function settleUntil(assert: () => void | Promise<void>, timeoutMs = 3000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    try {
      await assert()
      return
    } catch {
      // keep polling
    }
    if (Date.now() > deadline) throw new Error('settleUntil timed out')
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}

/** Seed one record into the medium before the gateway mounts (restart simulation). */
async function seedRecord(pool: MemoryMediaPool, record: TaskRecord): Promise<void> {
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('memory', new MemoryStorageBackend(pool))
  const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  const domain = await facility.open(DOMAIN_SPEC)
  await domain.table('tasks').put(record.id, record)
  await domain.close()
  await ctx.fiber.dispose()
}

const taskBase = (id: string, overrides: Partial<TaskRecord> = {}): TaskRecord => ({
  id: id as TaskId,
  title: 'task',
  prompt: 'prompt',
  status: 'planned',
  cron: null,
  nextRunAt: null,
  workspaceId: null,
  sessionId: null,
  result: null,
  createdAt: 1,
  updatedAt: 1,
  lastRunAt: null,
  ...overrides,
})

/** Minimal docx document.xml exercising headings, paragraphs, lists, tables. */
function docxXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Title</w:t></w:r></w:p>
    <w:p><w:r><w:t>Hello world</w:t></w:r></w:p>
    <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/></w:numPr></w:pPr><w:r><w:t>Item</w:t></w:r></w:p>
    <w:tbl>
      <w:tr><w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:p><w:r><w:t>1</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>2</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
  </w:body>
</w:document>`
}

/** Minimal xlsx: one sheet referencing shared strings and inline numbers. */
function xlsxXml(): { workbook: string; rels: string; strings: string; sheet: string } {
  return {
    workbook: '<?xml version="1.0"?><workbook xmlns="x" xmlns:r="r"><sheets><sheet name="S1" sheetId="1" r:id="rId1"/></sheets></workbook>',
    rels: '<?xml version="1.0"?><Relationships xmlns="x"><Relationship Id="rId1" Type="t" Target="worksheets/sheet1.xml"/></Relationships>',
    strings: '<?xml version="1.0"?><sst><si><t>Alpha</t></si><si><t>Beta</t></si></sst>',
    sheet: '<?xml version="1.0"?><worksheet xmlns="x"><sheetData>' +
      '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><v>42</v></c></row>' +
      '<row r="2"><c r="A2" t="s"><v>1</v></c><c r="B2"><v>7</v></c></row>' +
      '</sheetData></worksheet>',
  }
}

const encode = (text: string): Uint8Array => new TextEncoder().encode(text)

/** Pack a docx zip with the minimal document part. */
function docxBytes(xml: string): Buffer {
  return Buffer.from(zipSync({ 'word/document.xml': encode(xml) }))
}

/** Pack an xlsx zip with workbook, rels, shared strings, and one sheet. */
function xlsxBytes(parts: ReturnType<typeof xlsxXml>): Buffer {
  return Buffer.from(zipSync({
    'xl/workbook.xml': encode(parts.workbook),
    'xl/_rels/workbook.xml.rels': encode(parts.rels),
    'xl/sharedStrings.xml': encode(parts.strings),
    'xl/worksheets/sheet1.xml': encode(parts.sheet),
  }))
}

describe('WebEnhancedGateway', () => {
  it('publishes every remote under the webEnhanced namespace', async () => {
    const { gateway } = await harness()
    expect(gateway.typertRemote).toMatchObject({ serviceKey: 'webEnhanced', namespace: 'webEnhanced' })
    expect(remoteMethods(gateway).map(entry => entry.method)).toEqual([
      'taskList', 'taskCreate', 'taskUpdate', 'taskRemove', 'taskRun', 'balanceGet', 'pricingGet',
      'modelRouteDescribe', 'deepseekRateGet', 'opencodeGoUsageGet',
      'visionStatus', 'visionConfigGet', 'visionConfigSet', 'modelRetryGet', 'modelRetrySet', 'visionEndpointModels',
      'gitBranches', 'gitLog', 'gitCommit', 'gitCommitDiff', 'gitWorking', 'gitCheckout', 'gitStatus', 'gitDiff',
      'gitStage', 'gitUnstage', 'gitDiscard',
      'fsList', 'fsSearch', 'fsRead', 'fsWrite', 'fsDelete', 'fsOfficePreview', 'fsBrowse',
      'pluginList', 'pluginRemove', 'pluginUpdate',
    ])
  })

  describe('tasks', () => {
    it('creates, lists, updates, and removes tasks', async () => {
      const { gateway } = await harness()
      const created = await gateway.taskCreate({ title: ' 升级 DSH ', prompt: ' run pnpm run build ', cron: '0 23 * * *' })
      if ('error' in created) throw new Error(created.error.message)
      expect(created.task.title).toBe('升级 DSH')
      expect(created.task.cron).toBe('0 23 * * *')
      expect(created.task.nextRunAt).not.toBeNull()
      expect((await gateway.taskList()).tasks).toHaveLength(1)
      const updated = await gateway.taskUpdate({ id: created.task.id, status: 'todo', title: 'renamed' })
      if ('error' in updated) throw new Error(updated.error.message)
      expect(updated.task).toMatchObject({ status: 'todo', title: 'renamed' })
      const removed = await gateway.taskRemove({ id: created.task.id })
      if ('error' in removed) throw new Error(removed.error.message)
      expect(removed.removed).toBe(true)
      expect((await gateway.taskRemove({ id: created.task.id })).removed).toBe(false)
    })

    it('rejects empty titles, prompts, unreachable crons, and unknown workspaces', async () => {
      const { gateway } = await harness()
      expect((await gateway.taskCreate({ title: ' ', prompt: 'x' })).error?.code).toBe('invalid-title')
      expect((await gateway.taskCreate({ title: 'x', prompt: ' ' })).error?.code).toBe('invalid-prompt')
      expect((await gateway.taskCreate({ title: 'x', prompt: 'y', cron: '0 0 30 2 *' })).error?.code).toBe('cron-never')
      expect((await gateway.taskCreate({ title: 'x', prompt: 'y', workspaceId: 'ghost' })).error?.code).toBe('workspace-not-found')
      expect((await gateway.taskCreate({ title: 'x', prompt: 'y', cron: 'bad cron' })).error?.code).toBe('task-create')
    })

    it('update rejects empty titles, running tasks, invalid statuses, and never-firing crons', async () => {
      const { gateway } = await harness()
      const created = await gateway.taskCreate({ title: 'a', prompt: 'b' })
      if ('error' in created) throw new Error(created.error.message)
      const id = created.task.id
      expect((await gateway.taskUpdate({ id, title: ' ' })).error?.code).toBe('task-update')
      expect((await gateway.taskUpdate({ id, status: 'done' })).error?.code).toBe('task-update')
      expect((await gateway.taskUpdate({ id, cron: '0 0 30 2 *' })).error?.code).toBe('task-update')
      const cleared = await gateway.taskUpdate({ id, cron: null })
      if ('error' in cleared) throw new Error(cleared.error.message)
      expect(cleared.task.cron).toBeNull()
      expect(cleared.task.nextRunAt).toBeNull()
      // A running task is immutable through update: the second whenIdle hangs.
      let idleCalls = 0
      const hanging = {
        whenIdle: vi.fn(() => {
          idleCalls += 1
          return idleCalls === 1 ? Promise.resolve() : new Promise(() => {})
        }),
        followup: vi.fn(),
        session: { seq: 10, events: [], id: 's-hang' },
      }
      const stuck = await harness({ createAgent: () => hanging })
      const created2 = await stuck.gateway.taskCreate({ title: 'c', prompt: 'd' })
      if ('error' in created2) throw new Error(created2.error.message)
      const started = await stuck.gateway.taskRun({ id: created2.task.id })
      if ('error' in started) throw new Error(started.error.message)
      expect((await stuck.gateway.taskUpdate({ id: created2.task.id, title: 'x' })).error?.code).toBe('task-update')
    })

    it('rebinds and clears the task workspace through update', async () => {
      const root = await tempRoot()
      const { gateway } = await harness({ workspaces: [{ id: 'w1', path: root }] })
      const created = await gateway.taskCreate({ title: 'a', prompt: 'b' })
      if ('error' in created) throw new Error(created.error.message)
      const id = created.task.id
      expect(created.task.workspaceId).toBeNull()

      const bound = await gateway.taskUpdate({ id, workspaceId: 'w1' })
      if ('error' in bound) throw new Error(bound.error.message)
      expect(bound.task.workspaceId).toBe('w1')

      // An omitted field keeps the binding; only an explicit null clears it.
      const kept = await gateway.taskUpdate({ id, title: 'renamed' })
      if ('error' in kept) throw new Error(kept.error.message)
      expect(kept.task.workspaceId).toBe('w1')

      const cleared = await gateway.taskUpdate({ id, workspaceId: null })
      if ('error' in cleared) throw new Error(cleared.error.message)
      expect(cleared.task.workspaceId).toBeNull()

      expect((await gateway.taskUpdate({ id, workspaceId: 'ghost' })).error?.code).toBe('workspace-not-found')
    })

    it('runs a task to completion and writes the result back', async () => {
      const { gateway } = await harness()
      const created = await gateway.taskCreate({ title: 'run', prompt: 'do it', cron: '* * * * *' })
      if ('error' in created) throw new Error(created.error.message)
      const started = await gateway.taskRun({ id: created.task.id })
      if ('error' in started) throw new Error(started.error.message)
      expect(started.started).toBe(true)
      expect(started.sessionId).not.toBeNull()
      expect((await gateway.taskRun({ id: created.task.id })).error?.code).toBe('task-already-running')
      await settleUntil(async () => {
        const list = await gateway.taskList()
        const record = list.tasks.find(task => task.id === created.task.id)!
        if (record.status !== 'done') throw new Error('not done yet')
        expect(record).toMatchObject({
          status: 'done',
          result: { reasonKind: 'completed', summary: 'all done' },
        })
        expect(record.nextRunAt).toBeGreaterThan(Date.now())
      })
    })

    it('fails the task when the run cannot start and releases the admission lock', async () => {
      const { gateway, setCreate } = await harness()
      const created = await gateway.taskCreate({ title: 'x', prompt: 'y' })
      if ('error' in created) throw new Error(created.error.message)
      setCreate(async () => { throw new Error('no factory') })
      expect((await gateway.taskRun({ id: created.task.id })).error?.code).toBe('task-run')
      setCreate(async () => ({
        agent: fakeAgent(completedEvents()),
        dispose: async () => {},
      }))
      expect((await gateway.taskRun({ id: created.task.id })).error).toBeUndefined()
    })

    it('settles an execution fault as a failed task', async () => {
      const { gateway } = await harness({
        createAgent: () => fakeAgent(completedEvents()),
        flush: async () => { throw new Error('persistence down') },
      })
      const created = await gateway.taskCreate({ title: 'x', prompt: 'y' })
      if ('error' in created) throw new Error(created.error.message)
      const started = await gateway.taskRun({ id: created.task.id })
      if ('error' in started) throw new Error(started.error.message)
      await settleUntil(async () => {
        const list = await gateway.taskList()
        const record = list.tasks.find(task => task.id === created.task.id)!
        if (record.status !== 'failed') throw new Error('not failed yet')
        expect(record.result).toMatchObject({ errorCode: 'run-failed', reasonKind: 'interrupted' })
      })
    })

    it('schedules a due cron task on boot and recomputes its next run', async () => {
      const pool = new MemoryMediaPool()
      const due = taskBase('task-due', {
        status: 'planned',
        cron: '* * * * *',
        nextRunAt: Date.now() - 5_000,
      })
      await seedRecord(pool, due)
      const { gateway } = await harness({ pool })
      await settleUntil(async () => {
        const list = await gateway.taskList()
        const record = list.tasks.find(task => task.id === 'task-due')!
        if (record.status !== 'done') throw new Error('not done yet')
        expect(record.nextRunAt).toBeGreaterThan(Date.now())
      })
    })

    it('recovers interrupted runs as failed after a host restart', async () => {
      const pool = new MemoryMediaPool()
      await seedRecord(pool, taskBase('task-stuck', { status: 'running', sessionId: 's-old' as never }))
      const { gateway } = await harness({ pool })
      const record = (await gateway.taskList()).tasks.find(task => task.id === 'task-stuck')!
      expect(record).toMatchObject({
        status: 'failed',
        result: { reasonKind: 'interrupted', errorCode: 'host-restart' },
      })
    })

    it('runs a task in a workspace root and rejects an unknown run workspace', async () => {
      const root = await tempRoot()
      const { gateway, create, attached } = await harness({ workspaces: [{ id: 'w1', path: root }] })
      const created = await gateway.taskCreate({ title: 'x', prompt: 'y', workspaceId: 'w1' })
      if ('error' in created) throw new Error(created.error.message)
      const started = await gateway.taskRun({ id: created.task.id, workspaceId: 'w1' })
      if ('error' in started) throw new Error(started.error.message)
      const options = create.mock.calls[0]![0]
      expect(options.meta.cwd).toBe(root)
      // Without membership the run's session belongs to no project, and every
      // workspace-derived surface (the board's own jump included) misses it.
      expect(attached).toEqual([['w1', String(started.sessionId)]])
      const ghost = await gateway.taskCreate({ title: 'g', prompt: 'y' })
      if ('error' in ghost) throw new Error(ghost.error.message)
      expect((await gateway.taskRun({ id: ghost.task.id, workspaceId: 'ghost' })).error?.code).toBe('workspace-not-found')
    })

    it('composes the deployment agent preset into the run session', async () => {
      // The preset carries the tools: a run composed without one sees only what
      // the host root registered, which is neither bash nor read_file.
      const root = await tempRoot()
      const mounted: string[] = []
      const { gateway, create } = await harness({
        workspaces: [{ id: 'w1', path: root }],
        presets: {
          resolve: async () => ({ id: 'coder' }),
          mount: async (_agentCtx, id) => { mounted.push(id ?? '<none>') },
        },
      })
      const created = await gateway.taskCreate({ title: 'x', prompt: 'y', workspaceId: 'w1' })
      if ('error' in created) throw new Error(created.error.message)
      const started = await gateway.taskRun({ id: created.task.id })
      if ('error' in started) throw new Error(started.error.message)
      expect(create.mock.calls[0]![0].meta).toEqual({ cwd: root, agentPreset: 'coder' })
      await create.mock.calls[0]![0].setup(new Context())
      expect(mounted).toEqual(['coder'])
    })

    it('starts the run even when the workspace refuses the session', async () => {
      const root = await tempRoot()
      const { gateway, warnings } = await harness({
        workspaces: [{ id: 'w1', path: root }],
        attachFails: 'cwd moved under the record',
      })
      const created = await gateway.taskCreate({ title: 'x', prompt: 'y', workspaceId: 'w1' })
      if ('error' in created) throw new Error(created.error.message)
      const started = await gateway.taskRun({ id: created.task.id })
      // The session exists and works in the right directory; losing the run
      // over a bookkeeping refusal would be the worse outcome.
      expect(started).toMatchObject({ started: true })
      expect(warnings.join('\n')).toContain('cwd moved under the record')
    })
  })

  describe('git remotes', () => {
    it('serves branches, log, checkout, status, diff, and mutations', async () => {
      const root = await tempRoot()
      const { gateway, subprocess } = await harness({ workspaces: [{ id: 'w1', path: root }] })
      subprocess.enqueue({ stdout: 'main\n' })
      subprocess.enqueue({ stdout: 'main\n' })
      const branches = await gateway.gitBranches({ workspaceId: 'w1' })
      if ('error' in branches) throw new Error(branches.error.message)
      expect(branches.branches).toEqual([{ name: 'main', current: true }])

      subprocess.enqueue({ stdout: 'h1\x1f\x1fA\x1f1\x1fsubject' })
      subprocess.enqueue({ stdout: '' })
      const log = await gateway.gitLog({ workspaceId: 'w1' })
      if ('error' in log) throw new Error(log.error.message)
      expect(log.commits[0]!.subject).toBe('subject')

      subprocess.enqueue({ exitCode: 1, stderr: 'error: dirty\n' })
      expect(await gateway.gitCheckout({ workspaceId: 'w1', branch: 'dev' })).toEqual({ ok: false, message: 'error: dirty' })

      subprocess.enqueue({ stdout: ' M a.txt\0' })
      const status = await gateway.gitStatus({ workspaceId: 'w1' })
      if ('error' in status) throw new Error(status.error.message)
      expect(status.entries).toEqual([{ path: 'a.txt', staged: ' ', unstaged: 'M' }])

      subprocess.enqueue({ stdout: 'diff text' })
      const diff = await gateway.gitDiff({ workspaceId: 'w1', path: 'a.txt', staged: true })
      if ('error' in diff) throw new Error(diff.error.message)
      expect(diff.text).toBe('diff text')

      subprocess.enqueue({ exitCode: 0 })
      expect(await gateway.gitStage({ workspaceId: 'w1', paths: ['a.txt'] })).toEqual({ ok: true })
      subprocess.enqueue({ exitCode: 0 })
      expect(await gateway.gitUnstage({ workspaceId: 'w1', paths: ['a.txt'] })).toEqual({ ok: true })
      subprocess.enqueue({ exitCode: 0 })
      expect(await gateway.gitDiscard({ workspaceId: 'w1', paths: ['a.txt'] })).toEqual({ ok: true })
    })

    it('reads the uncommitted state and counts an untracked file for real', async () => {
      const root = await tempRoot()
      await writeFile(join(root, 'fresh.md'), 'one\ntwo\nthree')
      const { gateway, subprocess } = await harness({ workspaces: [{ id: 'w1', path: root }] })
      subprocess.enqueue({ stdout: 'head-hash\n' })
      subprocess.enqueue({ stdout: '3\t1\tsrc/a.ts\n' })
      subprocess.enqueue({ stdout: '0\t2\tsrc/b.ts\n' })
      subprocess.enqueue({ stdout: 'fresh.md\0gone.txt\0' })
      const working = await gateway.gitWorking({ workspaceId: 'w1' })
      if ('error' in working) throw new Error(working.error.message)
      expect(working.working).toEqual({
        head: 'head-hash',
        files: [
          { path: 'src/a.ts', state: 'staged', added: 3, removed: 1 },
          { path: 'src/b.ts', state: 'unstaged', added: 0, removed: 2 },
          // Counted by reading the file: git has no numstat for a path it does
          // not track, and staging it to get one would be a mutation.
          { path: 'fresh.md', state: 'untracked', added: 3, removed: null },
          // Listed by git but gone by the time it was read — not an error.
          { path: 'gone.txt', state: 'untracked', added: null, removed: null },
        ],
        staged: 1,
        unstaged: 1,
        untracked: 2,
        truncated: false,
      })
    })

    it('answers errors for unknown workspaces', async () => {
      const { gateway } = await harness()
      expect((await gateway.gitBranches({ workspaceId: 'ghost' })).error?.code).toBe('workspace-not-found')
      const failed = await gateway.gitStatus({ workspaceId: 'w-missing' })
      expect(failed).toEqual({
        error: { code: 'workspace-not-found', message: "workspace 'w-missing' does not exist" },
      })
    })
  })

  describe('fs remotes', () => {
    it('lists, searches, reads, writes, and deletes within the workspace root', async () => {
      const root = await tempRoot()
      await writeFile(join(root, 'hello.txt'), 'hello world')
      const { gateway } = await harness({ workspaces: [{ id: 'w1', path: root }] })
      const list = await gateway.fsList({ workspaceId: 'w1' })
      if ('error' in list) throw new Error(list.error.message)
      expect(list.entries.map(entry => entry.name)).toEqual(['hello.txt'])
      const search = await gateway.fsSearch({ workspaceId: 'w1', query: 'HELLO' })
      if ('error' in search) throw new Error(search.error.message)
      expect(search.entries[0]!.path).toBe('hello.txt')
      const read = await gateway.fsRead({ workspaceId: 'w1', path: 'hello.txt' })
      if ('error' in read) throw new Error(read.error.message)
      expect(read).toMatchObject({ kind: 'text', content: 'hello world' })
      expect(await gateway.fsWrite({ workspaceId: 'w1', path: 'out.txt', content: 'written' })).toEqual({ ok: true })
      const readBack = await gateway.fsRead({ workspaceId: 'w1', path: 'out.txt' })
      if ('error' in readBack) throw new Error(readBack.error.message)
      expect(readBack).toMatchObject({ kind: 'text', content: 'written' })
      expect(await gateway.fsDelete({ workspaceId: 'w1', path: 'out.txt' })).toEqual({ ok: true })
      expect((await gateway.fsRead({ workspaceId: 'w1', path: 'out.txt' })).error?.code).toBe('not-found')
    })

    it('rejects unknown workspaces, unsafe paths, and directories', async () => {
      const root = await tempRoot()
      const { gateway } = await harness({ workspaces: [{ id: 'w1', path: root }] })
      expect((await gateway.fsList({ workspaceId: 'ghost' })).error?.code).toBe('workspace-not-found')
      expect((await gateway.fsRead({ workspaceId: 'w1', path: '../evil' })).error?.code).toBe('fs-read')
      expect((await gateway.fsWrite({ workspaceId: 'w1', path: 'a/../b', content: 'x' })).error?.code).toBe('fs-write')
      expect((await gateway.fsDelete({ workspaceId: 'w1', path: '..' })).error?.code).toBe('fs-delete')
    })

    it('converts a docx file into structural preview blocks', async () => {
      const root = await tempRoot()
      await writeFile(join(root, 'doc.docx'), docxBytes(docxXml()))
      const { gateway } = await harness({ workspaces: [{ id: 'w1', path: root }] })
      const preview = await gateway.fsOfficePreview({ workspaceId: 'w1', path: 'doc.docx' })
      if ('error' in preview) throw new Error(preview.error.message)
      expect(preview.kind).toBe('docx')
      expect(preview.blocks).toEqual([
        { type: 'h1', text: 'Title' },
        { type: 'p', text: 'Hello world' },
        { type: 'li', text: 'Item' },
        { type: 'table', rows: [['A', 'B'], ['1', '2']] },
      ])
    })

    it('converts an xlsx file into a bounded table block', async () => {
      const root = await tempRoot()
      await writeFile(join(root, 'sheet.xlsx'), xlsxBytes(xlsxXml()))
      const { gateway } = await harness({ workspaces: [{ id: 'w1', path: root }] })
      const preview = await gateway.fsOfficePreview({ workspaceId: 'w1', path: 'sheet.xlsx' })
      if ('error' in preview) throw new Error(preview.error.message)
      expect(preview.kind).toBe('xlsx')
      expect(preview.blocks).toEqual([{ type: 'table', rows: [['Alpha', '42'], ['Beta', '7']] }])
    })

    it('answers office-specific errors for unsupported, oversized, and broken files', async () => {
      const root = await tempRoot()
      await writeFile(join(root, 'legacy.doc'), Buffer.from('not a real doc'))
      await writeFile(join(root, 'big.docx'), Buffer.alloc(64)) // small but replaced below
      const { gateway } = await harness({ workspaces: [{ id: 'w1', path: root }] })
      expect((await gateway.fsOfficePreview({ workspaceId: 'w1', path: 'legacy.doc' })).error?.code).toBe('office-unsupported')
      // Over the 5 MiB default cap.
      await writeFile(join(root, 'big.docx'), Buffer.alloc(5 * 1024 * 1024 + 1))
      expect((await gateway.fsOfficePreview({ workspaceId: 'w1', path: 'big.docx' })).error?.code).toBe('office-too-large')
      // A zip that is not an Office document.
      await writeFile(join(root, 'bad.xlsx'), Buffer.from('PK\x03\x04 not a zip'))
      expect((await gateway.fsOfficePreview({ workspaceId: 'w1', path: 'bad.xlsx' })).error?.code).toBe('office-invalid')
      // Unknown workspace and unsafe paths keep the fs guards.
      expect((await gateway.fsOfficePreview({ workspaceId: 'ghost', path: 'x.docx' })).error?.code).toBe('workspace-not-found')
      expect((await gateway.fsOfficePreview({ workspaceId: 'w1', path: '../x.docx' })).error?.code).toBe('office-preview')
    })
  })

  describe('balance remote', () => {
    it('returns the parsed balance view', async () => {
      process.env.WEB_ENHANCED_TEST_KEY = 'sk-test'
      vi.stubGlobal('fetch', vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ is_available: true, balance_infos: [{ currency: 'CNY', total_balance: '9.9' }] }),
      })))
      const { gateway } = await harness({})
      const view = await gateway.balanceGet({})
      expect(view).toMatchObject({
        applicable: true,
        isAvailable: true,
        infos: [{ currency: 'CNY', totalBalance: 9.9, grantedBalance: 0, toppedUpBalance: 0 }],
      })
    })

    it('answers inapplicable for a route the balance account does not bill', async () => {
      // The endpoint serves ONE account; reporting it beside another vendor's
      // model would be a number about somebody else's balance.
      const fetched = vi.fn()
      vi.stubGlobal('fetch', fetched)
      const { gateway } = await harness({})
      expect(await gateway.balanceGet({ provider: 'openai' })).toMatchObject({
        applicable: false, isAvailable: false, infos: [],
      })
      // An inapplicable route never reaches the endpoint at all.
      expect(fetched).not.toHaveBeenCalled()
    })

    it('answers inapplicable when the allowed route is repointed elsewhere', async () => {
      process.env.WEB_ENHANCED_TEST_KEY = 'sk-test'
      const { ctx, gateway } = await harness({})
      ctx.provide('llm' as never, {
        listConfigurableProviders: () => [
          { provider: 'deepseek-official', settingsNs: 'llm-deepseek', settingsPath: [] },
        ],
      } as never)
      ctx.provide('settings' as never, {
        get: () => ({ baseURL: 'https://gateway.internal/v1' }),
      } as never)
      expect(await gateway.balanceGet({ provider: 'deepseek-official' })).toMatchObject({ applicable: false })
    })
  })

  describe('vision remote', () => {
    it('reports an unmounted integration as a state, never a throw', async () => {
      const { gateway } = await harness()
      const status = await gateway.visionStatus()
      expect(status).toMatchObject({ mounted: false, enabled: false, admissionActive: false })
    })

    it('answers vision-settings-unavailable when no settings service is mounted', async () => {
      const { gateway } = await harness()
      const view = await gateway.visionConfigGet()
      expect(view).toMatchObject({ error: { code: 'vision-settings-unavailable' } })
      expect(await gateway.visionConfigSet({ patch: { enabled: true } }))
        .toMatchObject({ error: { code: 'vision-settings-unavailable' } })
    })

    it('reads the namespace without exposing the key and saves a filtered patch with CAS', async () => {
      const { ctx, gateway } = await harness()
      const section = {
        enabled: true, patchAdmission: true, provider: '', model: '',
        harnessModels: [{ provider: 'glm', model: 'glm-4.6v' }],
        prompt: 'p', marker: 'm', baseUrl: '', apiKey: 'sk-secret', apiKeyEnv: 'VISION_API_KEY',
        endpointModel: '', endpointModels: ['qwen-vl'], anonymous: false,
        timeoutMs: 120000, maxTokens: 4096, autoLocalOllama: true,
        localOllamaModel: '', localOllamaUrl: 'http://localhost:11434/v1',
        fallbackModels: [], cacheLimit: 200, cooldownMs: 60000,
      }
      const sections: Record<string, Record<string, unknown>> = { 'dsh-web-enhanced-vision': { ...section } }
      const update = vi.fn(async (_ns: unknown, patch: object) => {
        sections['dsh-web-enhanced-vision'] = { ...sections['dsh-web-enhanced-vision'], ...patch }
      })
      ctx.provide('settings' as never, {
        get: (ns: unknown) => sections[String(ns)],
        describe: () => [{ ns: 'dsh-web-enhanced-vision', revision: 7 }],
        update,
        writable: true,
      } as never)
      ctx.provide('llm' as never, {
        listProviders: () => [{ id: 'deepseek-official', name: 'DeepSeek' }],
        listModels: async () => [
          { id: 'deepseek-chat', name: 'DeepSeek Chat', inputModalities: ['text'] },
          { id: 'deepseek-vl', name: 'DeepSeek VL', inputModalities: ['text', 'image'] },
        ],
        listConfigurableProviders: () => [],
      } as never)
      const view = await gateway.visionConfigGet()
      if ('error' in view) throw new Error(view.error.message)
      expect(view).toMatchObject({
        managed: true, writable: true, revision: 7, enabled: true,
        apiKeySet: true, fallbackCount: 0, endpointModel: '',
        harnessModels: [{ provider: 'glm', model: 'glm-4.6v' }],
        endpointModels: ['qwen-vl'],
        providers: [{
          provider: 'deepseek-official', name: 'DeepSeek',
          models: [
            { id: 'deepseek-chat', name: 'DeepSeek Chat', supportsImage: false },
            { id: 'deepseek-vl', name: 'DeepSeek VL', supportsImage: true },
          ],
        }],
      })
      expect(JSON.stringify(view)).not.toContain('sk-secret')
      // The integration service is absent in this harness; status still exists.
      expect(view.status).toMatchObject({ mounted: false })

      const saved = await gateway.visionConfigSet({
        patch: {
          baseUrl: 'https://vlm.example/v1',
          endpointModel: 'qwen-vl',
          endpointModels: ['qwen-vl', 'backup-vl'],
          harnessModels: [{ provider: 'glm', model: 'glm-4.6v' }, { provider: 'octopus', model: 'claude-sonnet-5' }],
          unknownField: true,
        } as unknown as VisionConfigPatch,
        expectedRevision: 7,
      })
      expect(saved).toEqual({ ok: true, revision: 7 })
      expect(update).toHaveBeenCalledWith('dsh-web-enhanced-vision', {
        baseUrl: 'https://vlm.example/v1',
        endpointModel: 'qwen-vl',
        endpointModels: ['qwen-vl', 'backup-vl'],
        harnessModels: [{ provider: 'glm', model: 'glm-4.6v' }, { provider: 'octopus', model: 'claude-sonnet-5' }],
      }, 7)
      expect(sections['dsh-web-enhanced-vision']).toMatchObject({
        baseUrl: 'https://vlm.example/v1', apiKey: 'sk-secret',
      })
    })

    it('maps a settings conflict onto the conflict code', async () => {
      const { ctx, gateway } = await harness()
      ctx.provide('settings' as never, {
        get: () => ({ enabled: true, patchAdmission: true, fallbackModels: [] }),
        describe: () => [{ ns: 'dsh-web-enhanced-vision', revision: 9 }],
        update: async () => {
          const error = new Error('stale') as Error & { code: string }
          error.code = 'SETTINGS_CONFLICT'
          throw error
        },
        writable: true,
      } as never)
      expect(await gateway.visionConfigSet({ patch: { enabled: false }, expectedRevision: 3 }))
        .toMatchObject({ error: { code: 'vision-config-conflict' } })
    })

    it('fetches the dedicated endpoint model list with the saved key', async () => {
      const { ctx, gateway } = await harness()
      ctx.provide('settings' as never, {
        get: () => ({
          enabled: true, patchAdmission: true, fallbackModels: [],
          baseUrl: 'https://vlm.example/v1', apiKey: 'sk-saved', apiKeyEnv: 'MISSING',
          endpointModels: [], anonymous: false, timeoutMs: 120000,
        }),
        describe: () => [{ ns: 'dsh-web-enhanced-vision', revision: 1 }],
        update: async () => {},
        writable: true,
      } as never)
      const fetched = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => ({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          object: 'list',
          data: [
            { id: 'qwen3.7-flash', name: 'Qwen3.7 Flash' },
            { id: '', name: 'empty' },
            { id: 'qwen3-vl-flash' },
          ],
        }),
      }))
      vi.stubGlobal('fetch', fetched)
      const result = await gateway.visionEndpointModels({})
      if ('error' in result) throw new Error(result.error.message)
      expect(result).toEqual({
        baseUrl: 'https://vlm.example/v1',
        models: [
          { id: 'qwen3.7-flash', name: 'Qwen3.7 Flash' },
          { id: 'qwen3-vl-flash', name: 'qwen3-vl-flash' },
        ],
        truncated: false,
      })
      expect(fetched).toHaveBeenCalledWith(
        'https://vlm.example/v1/models',
        expect.objectContaining({ headers: { authorization: 'Bearer sk-saved' } }),
      )
    })

    it('uses a one-shot key override and classifies a refused model listing', async () => {
      const { ctx, gateway } = await harness()
      ctx.provide('settings' as never, {
        get: () => ({ enabled: true, patchAdmission: true, fallbackModels: [], baseUrl: '', apiKey: '', apiKeyEnv: 'MISSING' }),
        describe: () => [],
        update: async () => {},
        writable: true,
      } as never)
      const fetched = vi.fn(async () => ({
        ok: false,
        status: 401,
        text: async () => 'bad key',
      }))
      vi.stubGlobal('fetch', fetched)
      const denied = await gateway.visionEndpointModels({
        baseUrl: 'https://vlm.example/v1',
        apiKey: 'sk-one-shot',
      })
      expect(denied).toMatchObject({ error: { code: 'vision-endpoint-auth' } })
      expect(fetched).toHaveBeenCalledWith(
        'https://vlm.example/v1/models',
        expect.objectContaining({ headers: { authorization: 'Bearer sk-one-shot' } }),
      )

      vi.unstubAllGlobals()
      expect(await gateway.visionEndpointModels({})).toMatchObject({ error: { code: 'vision-endpoint-missing' } })
    })
  })

  describe('model retry remote', () => {
    it('answers model-retry-settings-unavailable when no settings service is mounted', async () => {
      const { gateway } = await harness()
      expect(await gateway.modelRetryGet()).toMatchObject({ error: { code: 'model-retry-settings-unavailable' } })
      expect(await gateway.modelRetrySet({ maxRetries: 3 }))
        .toMatchObject({ error: { code: 'model-retry-settings-unavailable' } })
    })

    it('reads the DeepSeek retry policy and saves a bounded retry count with CAS', async () => {
      const { ctx, gateway } = await harness()
      const section: Record<string, unknown> = {
        retryPolicy: {
          mode: 'always',
          backoff: { initialDelayMs: 25, maxDelayMs: 100, jitterRatio: 0.2 },
        },
      }
      const update = vi.fn(async (_ns: unknown, patch: object) => {
        Object.assign(section.retryPolicy as Record<string, unknown>, patch.retryPolicy as Record<string, unknown>)
      })
      ctx.provide('settings' as never, {
        get: () => section,
        describe: () => [{ ns: 'llm-deepseek', revision: 5 }],
        update,
        writable: true,
      } as never)

      const view = await gateway.modelRetryGet()
      if ('error' in view) throw new Error(view.error.message)
      expect(view.config).toMatchObject({
        provider: 'deepseek-official', mode: 'always', maxRetries: null,
        initialDelayMs: 25, maxDelayMs: 100, jitterRatio: 0.2,
      })

      expect(await gateway.modelRetrySet({ maxRetries: 4, expectedRevision: 5 }))
        .toEqual({ ok: true, revision: 5 })
      expect(update).toHaveBeenCalledWith('llm-deepseek', {
        retryPolicy: { mode: 'normal', maxRetries: 4 },
      }, 5)
    })

    it('reads normal defaults when the namespace has no stored retryPolicy yet', async () => {
      const { ctx, gateway } = await harness()
      ctx.provide('settings' as never, {
        get: () => ({}),
        describe: () => [{ ns: 'llm-deepseek', revision: 1 }],
        update: async () => {},
        writable: true,
      } as never)
      const view = await gateway.modelRetryGet()
      if ('error' in view) throw new Error(view.error.message)
      expect(view.config).toMatchObject({
        provider: 'deepseek-official', mode: 'normal', maxRetries: 2,
        initialDelayMs: 500, maxDelayMs: 10000, jitterRatio: 0.1,
      })
      expect(await gateway.modelRetrySet({ maxRetries: 0 })).toEqual({ ok: true, revision: 1 })
    })

    it('rejects a non-integer retry count before touching settings', async () => {
      const { ctx, gateway } = await harness()
      const update = vi.fn(async () => {})
      ctx.provide('settings' as never, {
        get: () => ({ retryPolicy: { mode: 'normal', maxRetries: 2 } }),
        describe: () => [{ ns: 'llm-deepseek', revision: 1 }],
        update,
        writable: true,
      } as never)
      expect(await gateway.modelRetrySet({ maxRetries: 1.5 }))
        .toMatchObject({ error: { code: 'model-retry-invalid' } })
      expect(update).not.toHaveBeenCalled()
    })

    it('maps a settings conflict onto the conflict code', async () => {
      const { ctx, gateway } = await harness()
      ctx.provide('settings' as never, {
        get: () => ({ retryPolicy: { mode: 'normal', maxRetries: 2 } }),
        describe: () => [{ ns: 'llm-deepseek', revision: 9 }],
        update: async () => {
          const error = new Error('stale') as Error & { code: string }
          error.code = 'SETTINGS_CONFLICT'
          throw error
        },
        writable: true,
      } as never)
      expect(await gateway.modelRetrySet({ maxRetries: 1, expectedRevision: 3 }))
        .toMatchObject({ error: { code: 'model-retry-conflict' } })
    })
  })

  describe('plugins', () => {
    /** A profile fixture with one bundle dependency and one template layer. */
    async function profileFixture(): Promise<string> {
      const dir = await tempRoot()
      await writeFile(join(dir, 'package.json'), JSON.stringify({
        name: 'dsh-profile-test',
        dependencies: { 'plugin-a': 'github:o/a' },
        dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', 'plugin-a'] } },
      }, null, 2))
      const packageDir = join(dir, 'node_modules', 'plugin-a')
      await mkdir(packageDir, { recursive: true })
      await writeFile(join(packageDir, 'package.json'), JSON.stringify({
        name: 'plugin-a',
        version: '1.4.0',
        description: 'a plugin',
        dsh: { bundle: { patch: './cordis.patch.yml' } },
      }))
      return dir
    }

    it('lists the profile dependencies with their layer state', async () => {
      const dir = await profileFixture()
      const { gateway } = await harness({ profileDir: dir })
      const result = await gateway.pluginList({})
      if ('error' in result) throw new Error(result.error.message)
      expect(result.profileName).toBe(dir.split(/[/\\]/u).pop())
      expect(result.plugins).toEqual([{
        name: 'plugin-a',
        spec: 'github:o/a',
        version: '1.4.0',
        description: 'a plugin',
        bundle: true,
        active: true,
        self: false,
      }])
      // Not a dependency, so pnpm cannot act on it — reported apart from the
      // rows the surface offers buttons for.
      expect(result.templateBundles).toEqual(['@deepseek-ai/dsh-base'])
      expect(result.busy).toBe(false)
    })

    it('answers no-profile when the deployment sits outside one', async () => {
      // The default: this repository's own checkout is not a profile, so the
      // upward walk finds none. A state, not a failure.
      const { gateway } = await harness({})
      const result = await gateway.pluginList({})
      expect(result).toMatchObject({ error: { code: 'no-profile' } })
    })

    it('refuses to act on a template layer', async () => {
      const dir = await profileFixture()
      const { gateway } = await harness({ profileDir: dir })
      const result = await gateway.pluginRemove({ name: '@deepseek-ai/dsh-base' })
      // Forwarding this to pnpm would report success having removed nothing.
      expect(result).toMatchObject({ error: { code: 'plugin-not-removable' } })
    })

    it('refuses a name that is not a dependency', async () => {
      const dir = await profileFixture()
      const { gateway } = await harness({ profileDir: dir })
      expect(await gateway.pluginUpdate({ name: 'never-installed' }))
        .toMatchObject({ error: { code: 'plugin-not-found' } })
    })

    it('reports a pnpm failure as a result, keeping the layer list intact', async () => {
      const dir = await profileFixture()
      const { gateway, subprocess } = await harness({ profileDir: dir })
      subprocess.enqueue({ exitCode: 1, stderr: 'ERR_PNPM_FETCH_404' })
      const result = await gateway.pluginRemove({ name: 'plugin-a' })
      if ('error' in result) throw new Error(result.error.message)
      expect(result.ok).toBe(false)
      expect(result.restartRequired).toBe(false)
      expect(result.output).toContain('ERR_PNPM_FETCH_404')
      const manifest = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8')) as {
        dsh: { profile: { bundles: string[] } }
      }
      expect(manifest.dsh.profile.bundles).toEqual(['@deepseek-ai/dsh-base', 'plugin-a'])
    })

    it('reconciles the layer list and demands a restart after a successful removal', async () => {
      const dir = await profileFixture()
      const { gateway, subprocess } = await harness({ profileDir: dir })
      // The seam is scripted, so the removal pnpm would perform is applied
      // here at spawn time. Without it the manifest still lists `plugin-a` as
      // a dependency and reconciliation would correctly change nothing —
      // the post-pnpm state is what this path is about.
      const spawn = subprocess.spawn.bind(subprocess)
      subprocess.spawn = (spec) => {
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
          name: 'dsh-profile-test',
          dependencies: {},
          dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', 'plugin-a'] } },
        }, null, 2))
        rmSync(join(dir, 'node_modules', 'plugin-a'), { recursive: true, force: true })
        return spawn(spec)
      }
      subprocess.enqueue({ exitCode: 0, stdout: 'Packages: -1' })
      const result = await gateway.pluginRemove({ name: 'plugin-a' })
      if ('error' in result) throw new Error(result.error.message)
      expect(result.ok).toBe(true)
      expect(result.removed).toEqual(['plugin-a'])
      // Always: the layer stack was composed at boot, so nothing here reaches
      // the running tree.
      expect(result.restartRequired).toBe(true)
      const manifest = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8')) as {
        dsh: { profile: { bundles: string[] } }
      }
      expect(manifest.dsh.profile.bundles).toEqual(['@deepseek-ai/dsh-base'])
    })
  })
})
