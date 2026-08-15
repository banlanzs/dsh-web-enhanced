/**
 * Vision integration tests: the pure endpoint helpers, the dual-source
 * transcription engine (harness models → Ollama → OpenAI-compatible endpoint),
 * and the transparent interceptor (admission patch, pre-step surface
 * replacement, deriveMessages wrapper, read_image rewrite).
 * @module dsh-web-enhanced/tests/vision
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import {
  VISION_SETTINGS_NS, VisionInterceptor, VisionSettingsSchema, VisionTranscriber,
  classifyVisionHttpError, detectLocalOllama, hasImageBlocks, isLocalVisionUrl,
  parseRetryAfter, resolveVisionApiKey, resolveVisionSettings, staticVisionSettingsBase,
  visionConfigSourceOf,
} from '../src/vision.ts'
import type {
  AttachmentsFace, ImageRefFace, LlmVisionFace, VisionSettings, VisionSettingsValue,
} from '../src/vision.ts'

const contexts: Context[] = []

afterEach(async () => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  delete process.env.VISION_API_KEY
  delete process.env.DASHSCOPE_API_KEY
  delete process.env.WE_VISION_KEY
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
})

const silentLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
}

/** One image reference, reused across tests. */
const ref = (id = 'a1'): ImageRefFace => ({ attachmentId: id, mediaType: 'image/png' })

/** Fake vision-capable provider directory. */
function llmWithVision(overrides: Partial<LlmVisionFace> = {}): LlmVisionFace {
  return {
    resolveModelInfo: async () => ({ inputModalities: ['text'] }),
    listProviders: () => [{ id: 'vision-provider' }, { id: 'text-provider' }],
    listModels: async provider => provider === 'vision-provider'
      ? [{ id: 'v1', inputModalities: ['text', 'image'] }]
      : [{ id: 't1', inputModalities: ['text'] }],
    stream: async function* () {
      yield { type: 'text-delta', text: '一只蓝色的猫' }
    },
    ...overrides,
  }
}

/** Fake attachment store holding fixed bytes. */
const attachments = (bytes = new TextEncoder().encode('PNG-bytes')): AttachmentsFace => ({
  readImage: async imageRef => ({ ref: imageRef, data: bytes }),
})

/** OpenAI-compatible response carrying `content`. */
function chatResponse(content: string | Array<{ text: string }>, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: async () => JSON.stringify({ choices: [{ message: { content } }] }),
  } as unknown as Response
}

/** Settings with every endpoint source disabled. */
const harnessOnly = (): VisionSettings => resolveVisionSettings({
  visionEnabled: true,
  visionPatchAdmission: true,
  visionAutoLocalOllama: false,
})

describe('vision helpers', () => {
  it('detects image blocks recursively through tool results', () => {
    expect(hasImageBlocks([{ type: 'text', text: 'x' }])).toBe(false)
    expect(hasImageBlocks(undefined)).toBe(false)
    expect(hasImageBlocks([{ type: 'image', attachment: ref() }])).toBe(true)
    expect(hasImageBlocks([{
      type: 'tool-result',
      content: [{ type: 'text', text: 'x' }, { type: 'image', attachment: ref() }],
    }])).toBe(true)
  })

  it('classifies VLM HTTP failures with actionable hints', () => {
    expect(classifyVisionHttpError(429, '').kind).toBe('rate_limit')
    expect(classifyVisionHttpError(402, 'insufficient_quota').kind).toBe('quota')
    expect(classifyVisionHttpError(403, 'not available in your region').kind).toBe('region')
    expect(classifyVisionHttpError(401, '').kind).toBe('auth')
    expect(classifyVisionHttpError(404, '').kind).toBe('model_not_found')
    expect(classifyVisionHttpError(400, 'context length too long').kind).toBe('context_too_large')
    expect(classifyVisionHttpError(502, '').kind).toBe('http')
  })

  it('parses Retry-After seconds and HTTP dates', () => {
    expect(parseRetryAfter('12')).toBe(12)
    expect(parseRetryAfter('0')).toBe(0)
    expect(parseRetryAfter('bad')).toBeUndefined()
    expect(parseRetryAfter(undefined)).toBeUndefined()
    // A date in the past clamps to zero, never a negative sleep.
    expect(parseRetryAfter('Wed, 21 Oct 2020 07:28:00 GMT')).toBe(0)
  })

  it('resolves endpoint keys config-first, then env, and skips local/anonymous', () => {
    process.env.VISION_API_KEY = 'sk-env'
    process.env.DASHSCOPE_API_KEY = 'sk-dash'
    process.env.WE_VISION_KEY = 'sk-we'
    const attempt = { apiKey: 'sk-config', anonymous: false }
    expect(resolveVisionApiKey(attempt, 'https://vlm.example/v1', 'WE_VISION_KEY')).toBe('sk-config')
    expect(resolveVisionApiKey({ apiKey: '', anonymous: false }, 'https://vlm.example/v1', 'WE_VISION_KEY')).toBe('sk-we')
    expect(resolveVisionApiKey({ apiKey: '', anonymous: false }, 'https://vlm.example/v1', 'OTHER_KEY')).toBe('sk-env')
    expect(resolveVisionApiKey({ apiKey: '', anonymous: false }, 'http://127.0.0.1:11434/v1', 'MISSING')).toBe('')
    expect(resolveVisionApiKey({ apiKey: '', anonymous: true }, 'https://vlm.example/v1', 'MISSING')).toBe('')
    delete process.env.VISION_API_KEY
    expect(resolveVisionApiKey({ apiKey: '', anonymous: false }, 'https://vlm.example/v1', 'MISSING')).toBe('sk-dash')
    delete process.env.DASHSCOPE_API_KEY
    expect(() => resolveVisionApiKey({ apiKey: '', anonymous: false }, 'https://vlm.example/v1', 'MISSING'))
      .toThrow(/no vision API key/u)
  })

  it('recognizes localhost endpoints', () => {
    expect(isLocalVisionUrl('http://localhost:11434/v1')).toBe(true)
    expect(isLocalVisionUrl('http://127.0.0.1:8080')).toBe(true)
    expect(isLocalVisionUrl('https://vlm.example.com')).toBe(false)
  })

  it('probes an OpenAI-compatible endpoint for a vision model', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ data: [{ id: 'llama3' }, { id: 'qwen3-vl:4b' }] }),
    })) as unknown as typeof fetch
    expect(await detectLocalOllama(fetchImpl, 'http://localhost:11434/v1', 500, '')).toEqual({
      baseURL: 'http://localhost:11434/v1',
      model: 'qwen3-vl:4b',
    })
    expect(await detectLocalOllama(fetchImpl, 'http://localhost:11434/v1', 500, 'llama3'))
      .toEqual({ baseURL: 'http://localhost:11434/v1', model: 'llama3' })
    const down = vi.fn(async () => ({ ok: false, text: async () => '' })) as unknown as typeof fetch
    expect(await detectLocalOllama(down, 'http://localhost:11434/v1', 500, '')).toBeNull()
  })

  it('resolves vision settings with folded fallback defaults', () => {
    const settings = resolveVisionSettings({
      visionBaseUrl: 'https://vlm.example/v1/',
      visionEndpointModel: 'qwen-vl',
      visionApiKey: 'sk-main',
      visionTimeoutMs: 3000,
      visionFallbackModels: [{ model: 'backup', timeoutMs: 2000 }, { model: 'backup-anon', anonymous: true }],
    })
    expect(settings.enabled).toBe(true)
    expect(settings.baseUrl).toBe('https://vlm.example/v1/')
    expect(settings.fallbacks).toEqual([
      { model: 'backup', baseURL: '', apiKey: '', anonymous: false, timeoutMs: 2000 },
      { model: 'backup-anon', baseURL: '', apiKey: '', anonymous: true, timeoutMs: 0 },
    ])
    expect(settings.marker).toBe('[图片内容描述]')
  })

  it('maps static config into the settings base and back', () => {
    const base = staticVisionSettingsBase({
      visionEnabled: false,
      visionBaseUrl: 'https://vlm.example/v1',
      visionHarnessModels: [{ provider: 'glm', model: 'glm-4.6v' }],
      visionEndpointModels: ['qwen-vl', 'backup-vl'],
      visionFallbackModels: [{ model: 'backup', anonymous: true }],
    })
    expect(base).toEqual({
      enabled: false,
      baseUrl: 'https://vlm.example/v1',
      harnessModels: [{ provider: 'glm', model: 'glm-4.6v' }],
      endpointModels: ['qwen-vl', 'backup-vl'],
      fallbackModels: [{ model: 'backup', anonymous: true }],
    })
    const value = {
      enabled: true, patchAdmission: true, provider: 'glm', model: 'glm-4.6v',
      harnessModels: [{ provider: 'glm', model: 'glm-4.6v' }],
      prompt: 'p', marker: 'm', baseUrl: '', apiKey: 'sk', apiKeyEnv: 'VISION_API_KEY',
      endpointModel: '', endpointModels: ['qwen-vl'], anonymous: false,
      timeoutMs: 120000, maxTokens: 4096,
      autoLocalOllama: false, localOllamaModel: '', localOllamaUrl: '',
      fallbackModels: [], cacheLimit: 200, cooldownMs: 60000,
    } satisfies VisionSettingsValue
    expect(visionConfigSourceOf(value)).toMatchObject({
      visionEnabled: true, visionProvider: 'glm', visionModel: 'glm-4.6v',
      visionHarnessModels: [{ provider: 'glm', model: 'glm-4.6v' }],
      visionApiKey: 'sk', visionAutoLocalOllama: false, visionEndpointModels: ['qwen-vl'],
    })
    expect(visionConfigSourceOf(value).visionBaseUrl).toBe('')
  })
})

describe('VisionTranscriber', () => {
  it('describes an image through a DSH-configured vision model, memoized per decision', async () => {
    const stream = vi.fn(async function* () {
      yield { type: 'text-delta', text: '蓝色' }
      yield { type: 'text-delta', text: '的猫' }
    })
    const transcriber = new VisionTranscriber(harnessOnly(), {
      llm: llmWithVision({ stream: stream as never }),
      logger: silentLogger,
    })
    const memo = new Map<string, string>()
    expect(await transcriber.describe(ref(), memo)).toBe('蓝色的猫')
    expect(await transcriber.describe(ref(), memo)).toBe('蓝色的猫')
    expect(stream).toHaveBeenCalledTimes(1)
  })

  it('ignores text-only models when scanning providers', async () => {
    const stream = vi.fn(async function* () {
      yield { type: 'text-delta', text: 'x' }
    })
    const transcriber = new VisionTranscriber(harnessOnly(), {
      llm: {
        listProviders: () => [{ id: 'text-only' }],
        listModels: async () => [{ id: 'chat', inputModalities: ['text'] }],
        stream: stream as never,
      },
      logger: silentLogger,
    })
    const memo = new Map<string, string>()
    expect(await transcriber.describe(ref(), memo)).toContain('图片内容识别不可用')
    expect(stream).not.toHaveBeenCalled()
  })

  it('tries the user-selected DSH pool in order and skips auto-detection', async () => {
    const order: string[] = []
    const listModels = vi.fn(async () => [{ id: 'unexpected', inputModalities: ['text', 'image'] }])
    const stream = vi.fn(async function* (options?: unknown) {
      const model = (options as { model: string }).model
      order.push(model)
      if (model === 'b') yield { type: 'text-delta', text: 'B 成功' }
      // Model 'a' yields no text: a failed transcription, not a success.
    })
    const transcriber = new VisionTranscriber(resolveVisionSettings({
      visionAutoLocalOllama: false,
      visionHarnessModels: [
        { provider: 'p', model: 'a' },
        { provider: 'q', model: 'b' },
      ],
    }), {
      llm: {
        listProviders: () => [{ id: 'p' }],
        listModels,
        stream: stream as never,
      },
      logger: silentLogger,
    })
    expect(await transcriber.describe(ref(), new Map())).toBe('B 成功')
    expect(order).toEqual(['a', 'b'])
    expect(listModels).not.toHaveBeenCalled()
    expect(transcriber.attemptFailures()).toEqual([{
      time: expect.any(Number),
      source: 'dsh',
      label: 'p/a',
      message: 'returned no text',
    }])
  })

  it('tries the preferred endpoint model, then the rest of the saved pool', async () => {
    const urls: string[] = []
    let calls = 0
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      urls.push(String(input))
      calls += 1
      if (calls === 1) {
        return { ok: false, status: 500, headers: { get: () => null }, text: async () => 'first failed' } as unknown as Response
      }
      if (calls === 2) return chatResponse('second-ok')
      throw new Error('no later attempt may run')
    })
    const transcriber = new VisionTranscriber(resolveVisionSettings({
      visionAutoLocalOllama: false,
      visionBaseUrl: 'https://vlm.example/v1',
      visionApiKey: 'sk-pool',
      visionEndpointModel: 'first',
      visionEndpointModels: ['first', 'second', 'third'],
    }), {
      llm: { listProviders: () => [], listModels: async () => [], stream: async function* () {} },
      attachments: attachments(),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      logger: silentLogger,
    })
    expect(await transcriber.describe(ref(), new Map())).toBe('second-ok')
    expect(urls).toHaveLength(2)
    const bodies = fetchImpl.mock.calls.map(call => JSON.parse(String((call[1] as RequestInit).body)) as { model: string })
    expect(bodies.map(body => body.model)).toEqual(['first', 'second'])
    expect(transcriber.attemptFailures()).toMatchObject([{
      source: 'endpoint',
      label: 'first @ https://vlm.example/v1',
      message: expect.stringContaining('first failed'),
    }])
  })

  it('falls back to the configured endpoint and caches by content hash', async () => {
    const fetchImpl = vi.fn(async () => chatResponse('OCR 文本'))
    const transcriber = new VisionTranscriber(resolveVisionSettings({
      visionAutoLocalOllama: false,
      visionBaseUrl: 'https://vlm.example/v1',
      visionApiKey: 'sk-test',
      visionEndpointModel: 'qwen-vl',
    }), {
      llm: { listProviders: () => [], listModels: async () => [], stream: async function* () {} },
      attachments: attachments(),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      logger: silentLogger,
    })
    expect(await transcriber.describe(ref(), new Map())).toBe('OCR 文本')
    // A second attachment id with the SAME bytes hits the content-hash cache.
    expect(await transcriber.describe(ref('a2'), new Map())).toBe('OCR 文本')
    const calls = fetchImpl.mock.calls
    expect(calls).toHaveLength(1)
    expect(String(calls[0]![0])).toContain('/chat/completions')
    const body = JSON.parse(String((calls[0]![1] as RequestInit).body)) as { model: string; messages: unknown[] }
    expect(body.model).toBe('qwen-vl')
    expect((calls[0]![1] as RequestInit).headers).toMatchObject({ authorization: 'Bearer sk-test' })
  })

  it('skips keyless non-anonymous endpoints with guidance, and tries fallbacks', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes('backup')) return chatResponse('备用识别')
      throw new Error('main must never be called without a key')
    })
    const transcriber = new VisionTranscriber(resolveVisionSettings({
      visionAutoLocalOllama: false,
      visionBaseUrl: 'https://paid.example/v1',
      visionEndpointModel: 'main-vl',
      visionFallbackModels: [{
        model: 'backup-vl',
        baseURL: 'https://backup.example/v1',
        apiKey: 'sk-backup',
      }],
    }), {
      llm: { listProviders: () => [], listModels: async () => [], stream: async function* () {} },
      attachments: attachments(),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      logger: silentLogger,
    })
    expect(await transcriber.describe(ref(), new Map())).toBe('备用识别')
    const urls = fetchImpl.mock.calls.map(call => String(call[0]))
    expect(urls).not.toContain('https://paid.example/v1/chat/completions')
    expect(urls).toContain('https://backup.example/v1/chat/completions')
  })

  it('fails an anonymous 429 immediately and cools the endpoint down', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 429,
      headers: { get: () => null },
      text: async () => 'rate limited',
    }))
    const settings = resolveVisionSettings({
      visionAutoLocalOllama: false,
      visionBaseUrl: 'https://free.example/v1',
      visionEndpointModel: 'free-vl',
      visionAnonymous: true,
    })
    const transcriber = new VisionTranscriber(settings, {
      llm: { listProviders: () => [], listModels: async () => [], stream: async function* () {} },
      attachments: attachments(),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      logger: silentLogger,
    })
    const first = await transcriber.describe(ref(), new Map())
    expect(first).toContain('图片内容识别失败')
    expect(first).toContain('rate_limit')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    // Cooldown keeps the broken anonymous endpoint out of the second attempt.
    await transcriber.describe(ref('a3'), new Map())
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('prepends a detected local Ollama to the transcription chain', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/models')) {
        return { ok: true, text: async () => JSON.stringify({ data: [{ id: 'qwen3-vl:4b' }] }) } as unknown as Response
      }
      return chatResponse('本地识别')
    })
    const transcriber = new VisionTranscriber(resolveVisionSettings({
      visionEnabled: true,
      visionAutoLocalOllama: true,
      visionLocalOllamaUrl: 'http://localhost:11434/v1',
    }), {
      llm: { listProviders: () => [], listModels: async () => [], stream: async function* () {} },
      attachments: attachments(),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      logger: silentLogger,
    })
    expect(await transcriber.describe(ref(), new Map())).toBe('本地识别')
    const body = JSON.parse(String((fetchImpl.mock.calls[1]![1] as RequestInit).body)) as { model: string }
    expect(body.model).toBe('qwen3-vl:4b')
    expect((fetchImpl.mock.calls[1]![1] as RequestInit).headers).toEqual({ 'content-type': 'application/json' })
  })

  it('replaces image blocks recursively and preserves surrounding text', async () => {
    const transcriber = new VisionTranscriber(harnessOnly(), {
      llm: llmWithVision(),
      logger: silentLogger,
    })
    const transformed = await transcriber.transformBlocks([
      { type: 'text', text: '看这张图' },
      {
        type: 'tool-result',
        content: [{ type: 'image', attachment: ref() }],
      },
    ], new Map())
    expect(transformed.changed).toBe(true)
    expect(transformed.blocks[0]).toEqual({ type: 'text', text: '看这张图' })
    const inner = (transformed.blocks[1] as { content: Array<{ type: string; text?: string }> }).content
    expect(inner).toHaveLength(1)
    expect(inner[0]!.type).toBe('text')
    expect(inner[0]!.text).toContain('[图片内容描述]')
    expect(inner[0]!.text).toContain('蓝色的猫')
  })
})

describe('VisionInterceptor', () => {
  /** Typed dispatch bypass for events whose payloads are structural here. */
  const bus = (ctx: Context) => ctx as unknown as {
    waterfall: (...args: unknown[]) => Promise<unknown>
    emit: (...args: unknown[]) => void
  }

  /** Fresh root context with the interceptor mounted as its service. */
  async function mount(options: {
    config?: Record<string, unknown>
    llm?: LlmVisionFace
    stream?: () => AsyncIterable<{ type: string; text?: string }>
    agent?: unknown
  } = {}): Promise<{ ctx: Context; interceptor: VisionInterceptor }> {
    const ctx = new Context()
    contexts.push(ctx)
    const stream = options.stream ?? (async function* () {
      yield { type: 'text-delta', text: '一只猫' }
    })
    ctx.provide('llm' as never, options.llm ?? llmWithVision({ stream: stream as never }) as never)
    ctx.provide('agentDefaultModel' as never, {
      currentSelection: () => ({ provider: 'deepseek', model: 'deepseek-chat' }),
    } as never)
    const interceptor = new VisionInterceptor(ctx, {
      visionAutoLocalOllama: false,
      ...(options.config ?? {}),
    })
    return { ctx, interceptor }
  }

  /** One user message carrying an image. */
  const imageMessage = {
    id: 'm1',
    role: 'user',
    content: [
      { type: 'text', text: '看这张图' },
      { type: 'image', attachment: { attachmentId: 'img-1', mediaType: 'image/png' } },
    ],
    source: { kind: 'user' },
  }

  it('patches admission reversibly and restores only its own wrapper', async () => {
    const original = vi.fn(async () => ({ inputModalities: ['text'] }))
    const { ctx, interceptor } = await mount({ llm: llmWithVision({ resolveModelInfo: original }) })
    const llm = ctx.get('llm' as never) as { resolveModelInfo: (p: string, m: string) => Promise<{ inputModalities: string[] }> }

    // Patched: images are admitted.
    const patched = await llm.resolveModelInfo('deepseek', 'chat')
    expect(patched.inputModalities).toEqual(['text', 'image'])
    expect((await interceptor.status()).admissionActive).toBe(true)

    // A foreign wrapper lands on top; teardown must leave it intact.
    const foreign = vi.fn(async () => ({ inputModalities: ['text', 'audio'] }))
    llm.resolveModelInfo = foreign as never
    await ctx.fiber.dispose()
    contexts.splice(contexts.indexOf(ctx), 1)
    expect(llm.resolveModelInfo).toBe(foreign)
    expect(original).toHaveBeenCalled()

    // Without a foreign wrapper, teardown restores the captured original.
    const second = new Context()
    contexts.push(second)
    second.provide('llm' as never, {
      ...llmWithVision(),
      resolveModelInfo: original,
    } as never)
    second.provide('agentDefaultModel' as never, { currentSelection: () => undefined } as never)
    new VisionInterceptor(second, { visionAutoLocalOllama: false })
    const secondLlm = second.get('llm' as never) as { resolveModelInfo: (p: string, m: string) => Promise<{ inputModalities: string[] }> }
    expect((await secondLlm.resolveModelInfo('deepseek', 'chat')).inputModalities).toContain('image')
    await second.fiber.dispose()
    contexts.splice(contexts.indexOf(second), 1)
    expect((await secondLlm.resolveModelInfo('deepseek', 'chat')).inputModalities).toEqual(['text'])
  })

  it('leaves a step unchanged for a real multimodal route', async () => {
    const stream = vi.fn(async function* () {
      yield { type: 'text-delta', text: 'x' }
    })
    const { ctx } = await mount({
      stream: stream as never,
      llm: llmWithVision({
        resolveModelInfo: async () => ({ inputModalities: ['text', 'image'] }),
      }),
      agent: { id: 'a1', options: { provider: 'vision-provider', model: 'v1' } },
    })
    const decision = { kind: 'enter' as const, messages: [imageMessage] }
    const result = await bus(ctx).waterfall('agent/pre-step', {
      agent: { id: 'a1', options: { provider: 'vision-provider', model: 'v1' }, session: undefined },
      messages: [imageMessage],
      turn: 1,
      step: 1,
      signal: new AbortController().signal,
    }, async () => decision)
    expect(result).toBe(decision)
    expect(stream).not.toHaveBeenCalled()
  })

  it('computes a description in pre-step and applies it through deriveMessages and the surface replace', async () => {
    const appended: Array<{ data: unknown; opts: unknown }> = []
    const session = {
      id: 's1',
      requestHeader: () => ({ config: { provider: 'deepseek', model: 'chat' } }),
      deriveMessages: () => [imageMessage],
      append: vi.fn((_type: string, data: unknown, opts: unknown) => {
        appended.push({ data, opts })
        return { seq: 5, time: 1, data }
      }),
    }
    const { ctx } = await mount({
      agent: { id: 'a1', options: { provider: 'deepseek', model: 'chat' }, session },
    })
    const decision = { kind: 'enter' as const, messages: [imageMessage] }
    await bus(ctx).waterfall('agent/pre-step', {
      agent: { id: 'a1', options: { provider: 'deepseek', model: 'chat' }, session },
      messages: [imageMessage],
      turn: 1,
      step: 1,
      signal: new AbortController().signal,
    }, async () => decision)

    // The first step reads the pending description synchronously.
    const derived = session.deriveMessages()
    expect(derived[0]!.content).toEqual([
      { type: 'text', text: '看这张图' },
      { type: 'text', text: '\n[图片内容描述]\n一只猫\n' },
    ])

    // The durable replacement follows the original append in a microtask.
    bus(ctx).emit('session/event', session, {
      type: 'user/message',
      seq: 4,
      time: 1,
      data: imageMessage,
      surfaceOp: 'append',
    })
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(session.append).toHaveBeenCalledTimes(1)
    expect(appended[0]!.opts).toEqual({
      surfaceOp: { op: 'replace', start: 4, end: 4 },
      sourceEventSeqs: [4],
    })
    expect((appended[0]!.data as { content: Array<{ type: string }> }).content.map(block => block.type)).toEqual(['text', 'text'])
  })

  it('rewrites read_image results for text-only models and honors downstream replacements', async () => {
    const { ctx } = await mount({
      agent: {
        id: 'a1',
        options: { provider: 'deepseek', model: 'chat' },
        session: { id: 's1', requestHeader: () => ({ config: { provider: 'deepseek', model: 'chat' } }) },
      },
    })
    const exec = { name: 'read_image', agent: { id: 'a1', options: { provider: 'deepseek', model: 'chat' } } }
    const result = {
      isError: false,
      content: [
        { type: 'text', text: '<path>/tmp/a.png</path>' },
        { type: 'image', attachment: { attachmentId: 'img-2', mediaType: 'image/png' } },
      ],
    }
    const decision = await bus(ctx).waterfall('tools/post-execute', exec, result, async () => ({
      kind: 'accept',
      content: result.content,
    }))
    expect(decision).toMatchObject({ kind: 'accept' })
    const accepted = decision as { content: Array<{ type: string; text?: string }> }
    expect(accepted.content).toHaveLength(1)
    expect(accepted.content[0]!.type).toBe('text')
    expect(accepted.content[0]!.text).toContain('<path>/tmp/a.png</path>')
    expect(accepted.content[0]!.text).toContain('[图片内容描述]')

    // A downstream listener already removed the image: no second transcription.
    const stream = vi.fn(async function* () {
      yield { type: 'text-delta', text: 'x' }
    })
    const other = await mount({ stream: stream as never })
    const downstream = await bus(other.ctx).waterfall('tools/post-execute', exec, result, async () => ({
      kind: 'accept',
      content: [{ type: 'text', text: 'already replaced' }],
    }))
    expect((downstream as { content: Array<{ type: string; text: string }> }).content).toEqual([{ type: 'text', text: 'already replaced' }])
    expect(stream).not.toHaveBeenCalled()
  })

  it('reports its live status including discovered harness models', async () => {
    const { interceptor } = await mount()
    const status = await interceptor.status()
    expect(status).toMatchObject({
      mounted: true,
      enabled: true,
      patchAdmission: true,
      admissionActive: true,
      endpointConfigured: false,
      ollamaDetected: false,
      cacheSize: 0,
    })
    expect(status.harnessModels).toEqual([{ provider: 'vision-provider', model: 'v1' }])
  })

  it('stays inert when disabled', async () => {
    const stream = vi.fn(async function* () {
      yield { type: 'text-delta', text: 'x' }
    })
    const { ctx } = await mount({
      config: { visionEnabled: false, visionPatchAdmission: false },
      stream: stream as never,
      agent: { id: 'a1', options: { provider: 'deepseek', model: 'chat' } },
    })
    const llm = ctx.get('llm' as never) as { resolveModelInfo: (p: string, m: string) => Promise<{ inputModalities: string[] }> }
    expect((await llm.resolveModelInfo('deepseek', 'chat')).inputModalities).toEqual(['text'])
    const decision = { kind: 'enter' as const, messages: [imageMessage] }
    await bus(ctx).waterfall('agent/pre-step', {
      agent: { id: 'a1', options: { provider: 'deepseek', model: 'chat' }, session: undefined },
      messages: [imageMessage],
      turn: 1,
      step: 1,
      signal: new AbortController().signal,
    }, async () => decision)
    expect(stream).not.toHaveBeenCalled()
  })

  it('registers the settings namespace with static config as base and reconfigures live', async () => {
    const scopeValue: VisionSettingsValue = {
      enabled: true, patchAdmission: true, provider: '', model: '',
      harnessModels: [],
      prompt: 'p', marker: 'm', baseUrl: '', apiKey: '', apiKeyEnv: 'VISION_API_KEY',
      endpointModel: '', endpointModels: [], anonymous: false, timeoutMs: 120000,
      maxTokens: 4096, autoLocalOllama: false, localOllamaModel: '', localOllamaUrl: '',
      fallbackModels: [], cacheLimit: 200, cooldownMs: 60000,
    }
    const watchers: Array<(next: unknown, prev: unknown) => void> = []
    const register = vi.fn(() => ({
      get: () => scopeValue,
      watch: (callback: (next: unknown, prev: unknown) => void) => {
        watchers.push(callback)
        return () => {}
      },
    }))
    const ctx = new Context()
    contexts.push(ctx)
    ctx.provide('llm' as never, llmWithVision() as never)
    ctx.provide('agentDefaultModel' as never, { currentSelection: () => undefined } as never)
    ctx.provide('settings' as never, { register } as never)

    // Static config says disabled; the namespace base carries that, while the
    // resolved user value (enabled above) is what the integration actually runs.
    const interceptor = new VisionInterceptor(ctx, { visionEnabled: false, visionPatchAdmission: true })
    expect(register).toHaveBeenCalledWith(VISION_SETTINGS_NS, VisionSettingsSchema, {
      base: expect.objectContaining({ enabled: false }),
      applies: 'live',
    })
    expect((await interceptor.status()).enabled).toBe(true)

    const llm = ctx.get('llm' as never) as { resolveModelInfo: (p: string, m: string) => Promise<{ inputModalities: string[] }> }
    expect((await llm.resolveModelInfo('deepseek', 'chat')).inputModalities).toContain('image')

    // A committed save that turns the admission patch off restores the real method.
    watchers[0]!({ ...scopeValue, patchAdmission: false }, scopeValue)
    expect((await llm.resolveModelInfo('deepseek', 'chat')).inputModalities).toEqual(['text'])
    expect((await interceptor.status())).toMatchObject({ patchAdmission: false, admissionActive: false })

    // And turning it back on re-patches.
    watchers[0]!({ ...scopeValue, patchAdmission: true }, scopeValue)
    expect((await llm.resolveModelInfo('deepseek', 'chat')).inputModalities).toContain('image')
  })

  it('keeps static config in force when the settings service is absent', async () => {
    const { interceptor } = await mount({ config: { visionEnabled: false, visionPatchAdmission: false } })
    expect((await interceptor.status())).toMatchObject({ enabled: false, patchAdmission: false })
  })
})
