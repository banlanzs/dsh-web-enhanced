/**
 * Guards the hand-declared remote contribution against the rc.6 client
 * gateway contract: every result and parameter codec must be strict, and
 * every result schema must accept the payload shapes declared in
 * `../src/types.ts` (success and error branches).
 * @module dsh-web-enhanced/tests/contribution
 */

import { describe, expect, it } from 'vitest'
import { webEnhancedRemote } from '../src/client/remote.ts'

/** The rc.6 gateway check: mode must be strict, schema must parse. */
function requireStrictCodec(codec: { mode: string; schema?: { parse(value: unknown): unknown } }, endpoint: string, field: string): void {
  if (codec.mode !== 'strict') throw new Error(`generated Remote ${endpoint} field ${JSON.stringify(field)} has no strict codec`)
  if (typeof codec.schema?.parse !== 'function') throw new Error(`generated Remote ${endpoint} field ${JSON.stringify(field)} has no parseable schema`)
}

const errorPayload = { error: { code: 'E_TEST', message: 'boom' } }
const task = {
  id: 'task_1', title: 't', prompt: 'p', status: 'todo', cron: null, nextRunAt: null,
  workspaceId: null, sessionId: null, result: null, createdAt: 1, updatedAt: 2, lastRunAt: null,
}
const commit = { hash: 'a', parents: [], refs: ['main'], author: 'x', date: 1, subject: 's' }
const commitDetail = {
  hash: 'a', parents: ['b'], author: 'x', email: 'x@y', date: 1, subject: 's', body: '',
  files: [{ path: 'a.ts', added: 1, removed: 2 }, { path: 'bin', added: null, removed: null }],
}
const entry = { name: 'a', path: 'a', kind: 'file', size: 3 }

/**
 * Methods invoked with no argument at all. Everything else takes exactly one
 * request object — see the arity guard below.
 */
const nullaryMethods = new Set(['taskList', 'visionStatus', 'visionConfigGet', 'modelRetryGet', 'globalPromptGet', 'memoryConfigGet', 'opencodeGoUsageGet'])

const visionStatusSample = {
  mounted: true,
  enabled: true,
  patchAdmission: true,
  admissionActive: true,
  harnessModels: [{ provider: 'glm', model: 'glm-4.6v' }],
  endpointConfigured: true,
  endpointModel: 'qwen3.7-flash',
  apiKeySource: 'config',
  ollamaDetected: true,
  ollamaModel: 'qwen3-vl:4b',
  cacheSize: 3,
  lastError: null,
  failures: [{
    time: 1755280000000,
    source: 'dsh',
    label: 'opencode-free/mimo-v2.5-free',
    message: 'UNSUPPORTED_CONTENT',
  }],
}

/** One representative payload per method, both the success and the error branch. */
const payloads: Record<string, unknown[]> = {
  taskList: [{ tasks: [task] }, errorPayload],
  taskCreate: [{ task }, errorPayload],
  taskUpdate: [{ task }, errorPayload],
  taskRemove: [{ removed: true }, errorPayload],
  taskRun: [{ started: true, sessionId: null }, errorPayload],
  balanceGet: [
    { applicable: true, isAvailable: true, infos: [{ currency: 'CNY', totalBalance: 1, grantedBalance: 2, toppedUpBalance: 3 }], cachedAt: 4 },
    { applicable: false, isAvailable: false, infos: [], cachedAt: 4 },
  ],
  pricingGet: [{
    provider: 'deepseek-official',
    model: 'deepseek-chat',
    pricing: { input: 0.14, output: 0.28, cacheRead: 0.0028, cacheWrite: null },
  }, errorPayload],
  modelRouteDescribe: [{
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
    providerName: 'DeepSeek',
    modelName: 'DeepSeek-V4-Flash',
  }, errorPayload],
  deepseekRateGet: [{
    model: 'deepseek-v4-flash',
    mode: 'peak-valley',
    period: 'peak',
    currency: 'CNY',
    prices: { inputCacheHit: 0.1, inputCacheMiss: 3, output: 9 },
    nextSwitchAt: 1756000000000,
    nextSwitchLabel: '12:00',
    nextIsPeak: false,
    now: 1755990000000,
  }, errorPayload],
  opencodeGoUsageGet: [
    {
      provider: 'opencode-go',
      plan: 'OpenCode Go',
      windows: [{ key: 'five_hour', usedPercent: 9, resetsAt: 1756000000000 }],
      fetchedAt: 1755990000000,
    },
    {
      provider: 'opencode-go',
      plan: 'OpenCode Go',
      windows: [],
      fetchedAt: null,
      error: { code: 'opencode-go-no-key', message: 'not configured' },
    },
  ],
  visionStatus: [visionStatusSample, {
    mounted: false,
    enabled: false,
    patchAdmission: false,
    admissionActive: false,
    harnessModels: [],
    endpointConfigured: false,
    endpointModel: null,
    apiKeySource: 'unset',
    ollamaDetected: false,
    ollamaModel: null,
    cacheSize: 0,
    lastError: 'not mounted',
    failures: [],
  }, errorPayload],
  visionConfigGet: [{
    managed: true,
    writable: true,
    revision: 3,
    enabled: true,
    patchAdmission: true,
    provider: 'glm',
    model: 'glm-4.6v',
    harnessModels: [{ provider: 'glm', model: 'glm-4.6v' }, { provider: 'octopus', model: 'claude-sonnet-5' }],
    prompt: 'describe',
    marker: '[图片内容描述]',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKeySet: true,
    apiKeyEnv: 'VISION_API_KEY',
    endpointModel: 'qwen3.7-flash',
    endpointModels: ['qwen3.7-flash', 'qwen3-vl-flash'],
    anonymous: false,
    timeoutMs: 120000,
    maxTokens: 4096,
    autoLocalOllama: true,
    localOllamaModel: '',
    localOllamaUrl: 'http://localhost:11434/v1',
    fallbackCount: 1,
    cacheLimit: 200,
    cooldownMs: 60000,
    providers: [{
      provider: 'glm',
      name: 'GLM',
      models: [
        { id: 'glm-4.6v', name: 'GLM-4.6V', supportsImage: true },
        { id: 'glm-chat', name: 'GLM Chat', supportsImage: false },
      ],
    }],
    status: visionStatusSample,
  }, errorPayload],
  visionConfigSet: [{ ok: true, revision: 4 }, errorPayload],
  visionEndpointModels: [{
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      { id: 'qwen3.7-flash', name: 'Qwen3.7 Flash' },
      { id: 'qwen3-vl-flash', name: 'Qwen3-VL Flash' },
    ],
    truncated: false,
  }, {
    baseUrl: 'http://localhost:11434/v1',
    models: [],
    truncated: true,
  }, errorPayload],
  modelRetryGet: [{
    config: {
      provider: 'deepseek-official',
      managed: true,
      writable: true,
      revision: 7,
      mode: 'normal',
      maxRetries: 3,
      initialDelayMs: 500,
      maxDelayMs: 10000,
      jitterRatio: 0.1,
    },
  }, {
    config: {
      provider: 'deepseek-official',
      managed: true,
      writable: true,
      revision: 8,
      mode: 'always',
      maxRetries: null,
      initialDelayMs: 25,
      maxDelayMs: 100,
      jitterRatio: 0.2,
    },
  }, errorPayload],
  modelRetrySet: [{ ok: true, revision: 9 }, errorPayload],
  globalPromptGet: [{
    enabled: true,
    text: 'You are a project engineer.',
    revision: 5,
    writable: true,
  }, {
    enabled: false,
    text: '',
    revision: null,
    writable: false,
  }, errorPayload],
  globalPromptSet: [{ ok: true, revision: 6 }, errorPayload],
  memoryList: [{ memories: [] }, errorPayload],
  memoryDelete: [{ removed: true }, errorPayload],
  memoryConfigGet: [
    { enabled: true, revision: 3, writable: true },
    { enabled: false, revision: null, writable: false },
    errorPayload,
  ],
  memoryConfigSet: [{ ok: true, revision: 4 }, errorPayload],
  gitBranches: [{ branches: [{ name: 'main', current: true }] }, errorPayload],
  gitLog: [{ commits: [commit] }, errorPayload],
  gitCommit: [{ commit: commitDetail }, errorPayload],
  gitCommitDiff: [{ text: 'diff --git a/a.ts b/a.ts' }, errorPayload],
  gitWorking: [{
    working: {
      head: 'abc',
      files: [
        { path: 'a.ts', state: 'staged', added: 3, removed: 1 },
        { path: 'b.ts', state: 'unstaged', added: 0, removed: 2 },
        { path: 'new.md', state: 'untracked', added: 12, removed: null },
        { path: 'bin.png', state: 'untracked', added: null, removed: null },
      ],
      staged: 1,
      unstaged: 1,
      untracked: 2,
      truncated: false,
    },
  }, {
    working: { head: '', files: [], staged: 0, unstaged: 0, untracked: 0, truncated: false },
  }, errorPayload],
  gitCheckout: [{ ok: true, message: 'm' }, errorPayload],
  gitStatus: [{ entries: [{ path: 'a', staged: 'M', unstaged: '' }] }, { entries: [{ path: 'new', origPath: 'old', staged: 'R', unstaged: ' ' }] }, errorPayload],
  gitDiff: [{ text: 'diff' }, errorPayload],
  gitStage: [{ ok: true }, errorPayload],
  gitUnstage: [{ ok: true }, errorPayload],
  gitDiscard: [{ ok: true }, errorPayload],
  fsList: [{ entries: [entry] }, errorPayload],
  fsSearch: [{ entries: [entry] }, errorPayload],
  fsRead: [{ kind: 'text', content: 'c', truncated: false, size: 1 }, { kind: 'binary', content: 'b', truncated: true, size: 2 }, errorPayload],
  fsWrite: [{ ok: true }, errorPayload],
  fsDelete: [{ ok: true }, errorPayload],
  fsOfficePreview: [{
    kind: 'docx',
    blocks: [{ type: 'p', text: 'x' }, { type: 'table', rows: [['a']] }],
    truncated: false,
  }, errorPayload],
  fsBrowse: [{
    path: '/home/u',
    parent: '/home',
    home: '/home/u',
    roots: [],
    entries: [{ name: 'a', path: '/home/u/a', kind: 'dir' }, { name: 'b.txt', path: '/home/u/b.txt', kind: 'file', size: 2 }],
    truncated: false,
  }, {
    path: 'C:\\', parent: null, home: 'C:\\Users\\u', roots: ['C:\\', 'D:\\'], entries: [], truncated: true,
  }, errorPayload],
  pluginList: [{
    profileDir: '/home/u/.dsh/profiles/web',
    profileName: 'web',
    plugins: [{
      name: 'dsh-web-enhanced',
      spec: 'github:banlanzs/dsh-web-enhanced',
      version: '0.6.0',
      description: 'plugin',
      bundle: true,
      active: true,
      self: true,
    }, {
      name: 'some-lib', spec: '^1.0.0', version: null, description: null, bundle: false, active: false, self: false,
    }],
    templateBundles: ['@deepseek-ai/dsh-base'],
    busy: false,
  }, errorPayload],
  pluginRemove: [
    { ok: true, added: [], removed: ['x'], restartRequired: true, output: '' },
    { ok: false, added: [], removed: [], restartRequired: false, output: 'pnpm failed' },
    errorPayload,
  ],
  pluginUpdate: [
    { ok: true, added: ['x'], removed: [], restartRequired: true, output: 'up to date' },
    errorPayload,
  ],
}

describe('webEnhancedRemote contribution', () => {
  it('every descriptor uses strict codecs with parseable schemas', () => {
    expect(webEnhancedRemote.package).toBe('dsh-web-enhanced')
    for (const descriptor of webEnhancedRemote.descriptors) {
      const endpoint = `${descriptor.namespace}/${descriptor.method}`
      requireStrictCodec(descriptor.result, endpoint, 'result')
      for (const parameter of descriptor.parameters) requireStrictCodec(parameter.codec, endpoint, parameter.wire)
      expect(descriptor.invocation).toEqual({ kind: 'direct' })
      expect(descriptor.service).toBe('webEnhanced')
      expect(descriptor.namespace).toBe('webEnhanced')
      expect(descriptor.method).toBe(descriptor.method)
      expect(descriptor.parameters.every(p => p.source === 'json' && p.wire === p.name)).toBe(true)
    }
  })

  it('declares one request parameter per method, matching the positional gateway contract', () => {
    // The Typert gateway builds the host call as Reflect.apply(method, receiver,
    // descriptor.parameters.map(...)) and the client half refuses a call whose
    // argument count differs from descriptor.parameters.length. A descriptor
    // that splits a request object into per-field parameters therefore compiles
    // but fails at runtime on both sides — this guard is what catches that.
    for (const descriptor of webEnhancedRemote.descriptors) {
      const expected = nullaryMethods.has(descriptor.method) ? 0 : 1
      expect(descriptor.parameters, `${descriptor.method} arity`).toHaveLength(expected)
      if (expected === 1) expect(descriptor.parameters[0]!.wire).toBe('request')
    }
  })

  it('exposes exactly the 43 gateway methods, each with a representative payload', () => {
    const methods = webEnhancedRemote.descriptors.map(d => d.method).sort()
    expect(methods).toEqual(Object.keys(payloads).sort())
    expect(methods).toHaveLength(43)
  })

  it('every result schema accepts its success and error payloads', () => {
    for (const descriptor of webEnhancedRemote.descriptors) {
      const schema = descriptor.result.schema
      const samples = payloads[descriptor.method]
      expect(samples.length).toBeGreaterThan(0)
      for (const sample of samples) expect(() => schema.parse(sample), `${descriptor.method} rejected sample`).not.toThrow()
    }
  })

  it('parameter schemas accept undefined and plain JSON values', () => {
    for (const descriptor of webEnhancedRemote.descriptors) {
      for (const parameter of descriptor.parameters) {
        expect(() => parameter.codec.schema.parse(undefined), `${descriptor.method}.${parameter.wire} rejected undefined`).not.toThrow()
        expect(() => parameter.codec.schema.parse('x'), `${descriptor.method}.${parameter.wire} rejected string`).not.toThrow()
        expect(() => parameter.codec.schema.parse(42), `${descriptor.method}.${parameter.wire} rejected number`).not.toThrow()
      }
    }
  })
})
