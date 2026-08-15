/**
 * Image-understanding integration for text-only models.
 *
 * The design merges the two reference plugins in `dsh-plugins`:
 * - `DSH-vision` contributes the TRANSPARENT interception: a reversible,
 *   identity-guarded wrap of the shared `llm.resolveModelInfo` admits images
 *   past the send preflight and the `read_image` capability gate; the
 *   `agent/pre-step` + surface-replace + `deriveMessages` chain keeps the
 *   image in the durable transcript (the UI shows it) while the model receives
 *   a `[图片内容描述]` text block; `tools/post-execute` does the same for
 *   `read_image` results. Multimodal detection always reads the captured
 *   ORIGINAL resolver, so native multimodal routes pass through untouched.
 * - `dsh-vision-proxy` contributes the TRANSCRIPTION ENGINE: the description
 *   itself comes first from DSH-configured vision models (`llm.stream` with
 *   the image reference, zero extra keys), then from local Ollama, then from
 *   a configured OpenAI-compatible endpoint with an ordered fallback chain,
 *   content-hash caching, classified HTTP errors, anonymous-endpoint timeout
 *   caps, and a cooldown for endpoints that just failed.
 *
 * Unlike `DSH-vision`, admission-restore is unload-order safe: our wrapper is
 * marked, and teardown only restores the resolver when the live function is
 * still ours. It still must not run beside `DSH-vision` (both would pay for
 * duplicate transcriptions); this plugin supersedes it.
 *
 * All faces are structural: the owning host services (`llm`, `attachments`,
 * `agentDefaultModel`) are read through `ctx.get`, so a deployment that
 * composes none of them still mounts a disabled-but-reporting service rather
 * than refusing to boot.
 * @module dsh-web-enhanced/src/vision
 */

import { createHash } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import { Service } from '@deepseek-ai/cordis'
import type { Message } from '@deepseek-ai/dsh-llm'
import type { Session } from '@deepseek-ai/dsh-session'
import type { VisionFallbackConfig } from './gateway.ts'
import type { VisionStatusView } from './types.ts'

/** Default description prompt: thorough Chinese transcription + scene detail. */
export const DEFAULT_VISION_PROMPT =
  '请仔细观察这张图片并详细描述其内容，包括：所有可见的文字（请逐字转录）、物体、人物、场景、布局、颜色以及任何值得注意的细节。请用中文回答。'

/** Marker the model sees instead of the image block. */
export const DEFAULT_VISION_MARKER = '[图片内容描述]'

/** Local Ollama health-check budget; it is a probe, not a transcription. */
const OLLAMA_PROBE_TIMEOUT_MS = 1_500
/** Hard cap on the effective timeout for anonymous endpoints (they can hang). */
const ANONYMOUS_TIMEOUT_CAP_MS = 20_000
/** How many harness vision models are tried for one image. */
const HARNESS_CANDIDATE_CAP = 4
/** Pause between failed vision-model attempts. */
const RETRY_DELAY_MS = 600
/** Upper bound for honoring a Retry-After header (seconds), paid endpoints only. */
const MAX_RETRY_AFTER_SECONDS = 15

/** Durable image reference face (see `@deepseek-ai/dsh-attachment`). */
export interface ImageRefFace {
  readonly attachmentId?: string
  readonly mediaType?: string
  readonly bytes?: number
  readonly width?: number
  readonly height?: number
  readonly name?: string
}

/** Verified stored bytes face returned by the attachment service. */
export interface StoredImageFace {
  readonly ref: ImageRefFace
  readonly data: Uint8Array
}

/** Attachment service face, structurally. */
export interface AttachmentsFace {
  readImage(ref: ImageRefFace, signal?: AbortSignal): Promise<StoredImageFace>
}

/** One registered provider route, as far as vision needs it. */
export interface LlmProviderFace {
  readonly id: string
}

/** One model listing entry, as far as vision needs it. */
export interface LlmModelFace {
  readonly id: string
  readonly inputModalities?: readonly string[]
}

/** Resolved model metadata face. */
export interface LlmResolvedFace {
  readonly inputModalities?: readonly string[]
  readonly [key: string]: unknown
}

/** One streamed chunk face. */
export interface LlmStreamChunkFace {
  readonly type: string
  readonly text?: string
}

/** One hand-built model call face. */
export interface LlmGenerateFace {
  readonly provider: string
  readonly model: string
  readonly messages: readonly unknown[]
  readonly signal?: AbortSignal
}

/** The resolver shape the admission patch wraps. */
export interface LlmResolverFace {
  (provider: string, model: string, signal?: AbortSignal): Promise<LlmResolvedFace>
}

/** The `llm` service face, structurally. */
export interface LlmVisionFace {
  resolveModelInfo?: LlmResolverFace
  listProviders(): readonly LlmProviderFace[]
  listModels(provider: string): Promise<readonly LlmModelFace[]>
  stream(options: LlmGenerateFace): AsyncIterable<LlmStreamChunkFace>
}

/** A content block face; unknown shapes pass through untouched. */
export interface ContentBlockFace {
  readonly type: string
  readonly [key: string]: unknown
}

/** One fallback endpoint after defaults have been folded in. */
export interface VisionFallbackSettings {
  readonly model: string
  readonly baseURL: string
  readonly apiKey: string
  readonly anonymous: boolean
  readonly timeoutMs: number
}

/** Resolved vision settings (every field has a default). */
export interface VisionSettings {
  readonly enabled: boolean
  readonly patchAdmission: boolean
  readonly prompt: string
  readonly marker: string
  readonly provider: string
  readonly model: string
  readonly baseUrl: string
  readonly apiKey: string
  readonly apiKeyEnv: string
  readonly endpointModel: string
  readonly anonymous: boolean
  readonly timeoutMs: number
  readonly maxTokens: number
  readonly autoLocalOllama: boolean
  readonly localOllamaModel: string
  readonly localOllamaUrl: string
  readonly fallbacks: readonly VisionFallbackSettings[]
  readonly cacheLimit: number
  readonly cooldownMs: number
}

/** The optional fields of the plugin config vision reads. */
export interface VisionConfigSource {
  readonly visionEnabled?: boolean
  readonly visionPatchAdmission?: boolean
  readonly visionPrompt?: string
  readonly visionMarker?: string
  readonly visionProvider?: string
  readonly visionModel?: string
  readonly visionBaseUrl?: string
  readonly visionApiKey?: string
  readonly visionApiKeyEnv?: string
  readonly visionEndpointModel?: string
  readonly visionAnonymous?: boolean
  readonly visionTimeoutMs?: number
  readonly visionMaxTokens?: number
  readonly visionAutoLocalOllama?: boolean
  readonly visionLocalOllamaModel?: string
  readonly visionLocalOllamaUrl?: string
  readonly visionFallbackModels?: readonly VisionFallbackConfig[]
  readonly visionCacheLimit?: number
  readonly visionCooldownMs?: number
}

/** Field-wise defaults for the vision subset of the plugin config. */
export function resolveVisionSettings(config: VisionConfigSource): VisionSettings {
  return {
    enabled: config.visionEnabled ?? true,
    patchAdmission: config.visionPatchAdmission ?? true,
    prompt: config.visionPrompt ?? DEFAULT_VISION_PROMPT,
    marker: config.visionMarker ?? DEFAULT_VISION_MARKER,
    provider: config.visionProvider ?? '',
    model: config.visionModel ?? '',
    baseUrl: config.visionBaseUrl ?? '',
    apiKey: config.visionApiKey ?? '',
    apiKeyEnv: config.visionApiKeyEnv ?? 'VISION_API_KEY',
    endpointModel: config.visionEndpointModel ?? '',
    anonymous: config.visionAnonymous ?? false,
    timeoutMs: config.visionTimeoutMs ?? 120_000,
    maxTokens: config.visionMaxTokens ?? 4_096,
    autoLocalOllama: config.visionAutoLocalOllama ?? true,
    localOllamaModel: config.visionLocalOllamaModel ?? '',
    localOllamaUrl: config.visionLocalOllamaUrl ?? 'http://localhost:11434/v1',
    fallbacks: (config.visionFallbackModels ?? []).map(fallback => ({
      model: fallback.model,
      baseURL: fallback.baseURL ?? '',
      apiKey: fallback.apiKey ?? '',
      anonymous: fallback.anonymous ?? false,
      timeoutMs: fallback.timeoutMs ?? 0,
    })),
    cacheLimit: config.visionCacheLimit ?? 200,
    cooldownMs: config.visionCooldownMs ?? 60_000,
  }
}

/** Recursively detect image blocks, walking tool-result content. */
export function hasImageBlocks(blocks: readonly unknown[] | undefined): boolean {
  if (blocks === undefined) return false
  for (const raw of blocks) {
    const block = raw as ContentBlockFace | null | undefined
    if (block === null || block === undefined) continue
    if (block.type === 'image') return true
    if (block.type === 'tool-result' && Array.isArray(block.content)) {
      if (hasImageBlocks(block.content as readonly unknown[])) return true
    }
  }
  return false
}

/** Whether an endpoint is a localhost service (no key required). */
export function isLocalVisionUrl(baseURL: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/u.test(baseURL)
}

/**
 * Resolve the endpoint API key: config, then environment, per call. Anonymous
 * and local endpoints need none; anything else without a key fails fast with
 * guidance instead of hanging.
 */
export function resolveVisionApiKey(
  attempt: { readonly apiKey: string; readonly anonymous: boolean },
  baseURL: string,
  apiKeyEnv: string,
  env: Record<string, string | undefined> = process.env,
): string {
  if (attempt.anonymous || isLocalVisionUrl(baseURL)) return ''
  const key = attempt.apiKey !== ''
    ? attempt.apiKey
    : env[apiKeyEnv] ?? env.VISION_API_KEY ?? env.DASHSCOPE_API_KEY ?? ''
  if (key === '') {
    throw new Error(
      `dsh-web-enhanced: no vision API key for ${baseURL}. Set visionApiKey in the plugin config `
      + `(the reliable path on Windows), or export ${apiKeyEnv} / VISION_API_KEY / DASHSCOPE_API_KEY. `
      + 'Local endpoints like Ollama need none.',
    )
  }
  return key
}

/** Classified failure of one VLM HTTP response. */
export interface VisionHttpErrorKind {
  readonly kind: string
  readonly hint: string
}

/** Classify a failed VLM response into a kind + actionable hint. */
export function classifyVisionHttpError(status: number, body: unknown): VisionHttpErrorKind {
  const text = String(body)
  if (status === 429) {
    return {
      kind: 'rate_limit',
      hint: 'the vision endpoint is rate-limited; for anonymous free endpoints this usually persists — configure a key or use local Ollama instead',
    }
  }
  if (status === 402 || /insufficient_quota|quota|billing|balance|credit|arrear/iu.test(text)) {
    return { kind: 'quota', hint: 'the vision endpoint quota or balance is exhausted — top up at the provider console' }
  }
  if (status === 401 || status === 403) {
    if (/region|area|not available in your|unsupported.*region/iu.test(text)) {
      return { kind: 'region', hint: 'the vision model is not available in this region — use another endpoint' }
    }
    return { kind: 'auth', hint: 'the endpoint rejected the API key — verify it matches the platform-issued format exactly, with no extra prefix or line breaks' }
  }
  if (status === 404) {
    return { kind: 'model_not_found', hint: 'the model id was not found at this endpoint — check visionEndpointModel and visionBaseUrl' }
  }
  if (status === 400 && /context|length|too (large|long)|token/iu.test(text)) {
    return { kind: 'context_too_large', hint: 'the image is too large for this model — try a smaller image or a model with a longer context' }
  }
  return { kind: 'http', hint: `endpoint returned HTTP ${status}` }
}

/** Parse a Retry-After header value (seconds or HTTP date) into seconds. */
export function parseRetryAfter(header: string | null | undefined): number | undefined {
  if (header === null || header === undefined) return undefined
  const seconds = Number(header)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds
  const date = Date.parse(header)
  if (Number.isFinite(date)) return Math.max(0, (date - Date.now()) / 1000)
  return undefined
}

/** Probe an OpenAI-compatible endpoint for its model list. */
export async function detectLocalOllama(
  fetchImpl: typeof fetch,
  baseURL: string,
  timeoutMs: number,
  preferredModel: string,
): Promise<{ baseURL: string; model: string } | null> {
  try {
    const response = await fetchImpl(`${baseURL.replace(/\/+$/u, '')}/models`, {
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) return null
    const text = await response.text()
    let payload: unknown
    try {
      payload = JSON.parse(text)
    } catch {
      return null
    }
    const ids = Array.isArray((payload as { data?: unknown })?.data)
      ? ((payload as { data: readonly unknown[] }).data)
        .map(model => ((model as { id?: unknown })?.id))
        .filter((id): id is string => typeof id === 'string' && id !== '')
      : []
    if (ids.length === 0) return null
    if (preferredModel !== '' && ids.includes(preferredModel)) return { baseURL, model: preferredModel }
    const vision = ids.find(id => /vl|vision/iu.test(id))
    return { baseURL, model: vision ?? ids[0]! }
  } catch {
    return null
  }
}

/** Minimal logger face; Cordis' logger satisfies it. */
export interface VisionLogger {
  info(message: string): void
  warn(message: string): void
  error(message: string): void
}

/** Dependencies the transcription engine reads. */
export interface VisionTranscriberDeps {
  readonly llm?: LlmVisionFace
  readonly attachments?: AttachmentsFace
  readonly fetchImpl?: typeof fetch
  readonly logger: VisionLogger
}

/** One endpoint attempt after defaults and overrides are folded in. */
interface EndpointAttempt {
  readonly model: string
  readonly baseURL: string
  readonly apiKey: string
  readonly anonymous: boolean
  readonly timeoutMs: number
  readonly maxTokens: number
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => { setTimeout(resolve, ms) })

/**
 * The transcription engine: image reference → text description.
 *
 * Source order: DSH-configured vision models (zero extra keys), then local
 * Ollama, then the configured OpenAI-compatible endpoint with its fallback
 * chain. Failures are collected; when every source fails the description is a
 * placeholder the model can still read, so an image never reaches a text-only
 * adapter raw.
 */
export class VisionTranscriber {
  private readonly cache = new Map<string, string>()
  private readonly cooldowns = new Map<string, number>()
  private readonly ollamaProbe: Promise<EndpointAttempt | null>
  private failure: string | null = null

  constructor(
    readonly settings: VisionSettings,
    private readonly deps: VisionTranscriberDeps,
  ) {
    this.ollamaProbe = settings.autoLocalOllama
      ? detectLocalOllama(this.fetchImpl, settings.localOllamaUrl, OLLAMA_PROBE_TIMEOUT_MS, settings.localOllamaModel)
        .then(local => local === null
          ? null
          : {
              model: local.model,
              baseURL: local.baseURL,
              apiKey: '',
              anonymous: true,
              timeoutMs: Math.min(settings.timeoutMs, ANONYMOUS_TIMEOUT_CAP_MS),
              maxTokens: settings.maxTokens,
            })
        .catch(() => null)
      : Promise.resolve(null)
  }

  private get fetchImpl(): typeof fetch {
    return this.deps.fetchImpl ?? globalThis.fetch
  }

  /** Entries currently held in the content-hash cache. */
  get cacheSize(): number {
    return this.cache.size
  }

  /** The most recent total transcription failure, or null. */
  get lastError(): string | null {
    return this.failure
  }

  /**
   * Describe one image. `memo` deduplicates within one decision (a user
   * message plus its `read_image` duplicate must not transcribe twice).
   * @param ref - durable image reference.
   * @param memo - per-decision attachmentId → description cache.
   * @param signal - caller cancellation.
   * @returns the description (a placeholder when every source failed).
   */
  async describe(ref: ImageRefFace, memo: Map<string, string>, signal?: AbortSignal): Promise<string> {
    const memoKey = typeof ref.attachmentId === 'string' ? ref.attachmentId : ''
    if (memoKey !== '') {
      const hit = memo.get(memoKey)
      if (hit !== undefined) return hit
    }
    const text = await this.describeFresh(ref, signal)
    if (memoKey !== '') memo.set(memoKey, text)
    return text
  }

  /**
   * Replace image blocks with descriptions, walking tool-result content. The
   * message itself is never mutated: the caller decides where the transformed
   * blocks go (the model-visible surface replacement).
   */
  async transformBlocks(
    blocks: readonly unknown[],
    memo: Map<string, string>,
    signal?: AbortSignal,
  ): Promise<{ blocks: ContentBlockFace[]; changed: boolean }> {
    const out: ContentBlockFace[] = []
    let changed = false
    for (const raw of blocks) {
      const block = raw as ContentBlockFace | null | undefined
      if (block === null || block === undefined) {
        out.push(block as unknown as ContentBlockFace)
        continue
      }
      if (block.type === 'image') {
        const attachment = block.attachment as ImageRefFace | undefined
        if (attachment === undefined) {
          out.push(block)
          continue
        }
        const description = await this.describe(attachment, memo, signal)
        out.push({ type: 'text', text: `\n${this.settings.marker}\n${description}\n` })
        changed = true
      } else if (block.type === 'tool-result' && Array.isArray(block.content)) {
        const inner = await this.transformBlocks(block.content as readonly unknown[], memo, signal)
        if (inner.changed) {
          out.push({ ...block, content: inner.blocks })
          changed = true
        } else {
          out.push(block)
        }
      } else {
        out.push(block)
      }
    }
    return { blocks: out, changed }
  }

  /**
   * Vision models from DSH-configured providers: the pinned `visionProvider` /
   * `visionModel` first, then every listed model that declares image input.
   */
  async harnessCandidates(): Promise<Array<{ provider: string; model: string }>> {
    const list: Array<{ provider: string; model: string }> = []
    const seen = new Set<string>()
    const push = (provider: string, model: string): void => {
      if (list.length >= HARNESS_CANDIDATE_CAP) return
      const key = `${provider}/${model}`
      if (seen.has(key)) return
      seen.add(key)
      list.push({ provider, model })
    }
    if (this.settings.provider !== '' && this.settings.model !== '') push(this.settings.provider, this.settings.model)
    const llm = this.deps.llm
    if (llm === undefined) return list
    try {
      for (const provider of llm.listProviders()) {
        if (list.length >= HARNESS_CANDIDATE_CAP) break
        try {
          const models = await llm.listModels(provider.id)
          for (const model of models) {
            if ((model.inputModalities ?? []).includes('image')) push(provider.id, model.id)
          }
        } catch {
          // One failing provider must not veto the others.
        }
      }
    } catch {
      // The directory itself can fail; the endpoint path is the fallback.
    }
    return list
  }

  /** Where the configured endpoint key comes from (never the key itself). */
  apiKeySource(): 'config' | 'env' | 'none-needed' | 'unset' {
    if (this.settings.anonymous) return 'none-needed'
    if (this.settings.apiKey !== '') return 'config'
    const env = process.env
    if ((this.settings.apiKeyEnv !== '' && env[this.settings.apiKeyEnv] !== undefined)
      || env.VISION_API_KEY !== undefined || env.DASHSCOPE_API_KEY !== undefined) {
      return 'env'
    }
    return 'unset'
  }

  /** Local Ollama probe state (detected at construction, memoized). */
  async ollamaState(): Promise<{ detected: boolean; model: string | null }> {
    const local = await this.ollamaProbe
    return local === null ? { detected: false, model: null } : { detected: true, model: local.model }
  }

  private async describeFresh(ref: ImageRefFace, signal?: AbortSignal): Promise<string> {
    const errors: string[] = []
    for (const candidate of await this.harnessCandidates()) {
      const text = await this.streamHarness(candidate, ref, signal)
      if (text !== null) return text
      errors.push(`vision model ${candidate.provider}/${candidate.model} returned no text`)
      await sleep(RETRY_DELAY_MS)
    }
    for (const attempt of await this.endpointAttempts()) {
      const until = this.cooldowns.get(attempt.baseURL)
      if (until !== undefined) {
        if (Date.now() < until) {
          errors.push(`${attempt.model} @ ${attempt.baseURL}: skipped — endpoint cooling down after a recent failure`)
          continue
        }
        this.cooldowns.delete(attempt.baseURL)
      }
      if (!attempt.anonymous) {
        try {
          resolveVisionApiKey(attempt, attempt.baseURL, this.settings.apiKeyEnv)
        } catch (error) {
          errors.push(error instanceof Error ? error.message : String(error))
          continue
        }
      }
      try {
        return await this.transcribeEndpoint(attempt, ref, signal)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        errors.push(`${attempt.model} @ ${attempt.baseURL}: ${message}`)
        const timedOut = error instanceof Error && error.name === 'TimeoutError'
          || /aborted due to timeout|timed out|timeout/iu.test(message)
        if (message.includes('(rate_limit)') || timedOut) {
          this.cooldowns.set(attempt.baseURL, Date.now() + this.settings.cooldownMs)
        }
      }
    }
    this.failure = errors.join(' | ')
    this.deps.logger.warn(`dsh-web-enhanced vision: image description failed — ${this.failure}`)
    return this.placeholder(errors)
  }

  /** One `llm.stream` description through a DSH-configured vision model. */
  private async streamHarness(
    candidate: { provider: string; model: string },
    ref: ImageRefFace,
    signal?: AbortSignal,
  ): Promise<string | null> {
    const llm = this.deps.llm
    if (llm === undefined || typeof llm.stream !== 'function') return null
    const messages = [{
      id: `web-enhanced-vision-${String(Math.random().toString(36).slice(2))}`,
      role: 'user',
      content: [
        { type: 'text', text: this.settings.prompt },
        { type: 'image', attachment: ref },
      ],
      source: { kind: 'user' },
    }]
    let text = ''
    try {
      for await (const chunk of llm.stream({
        provider: candidate.provider,
        model: candidate.model,
        messages,
        ...(signal === undefined ? {} : { signal }),
      })) {
        if (chunk.type === 'text-delta' && typeof chunk.text === 'string') text += chunk.text
      }
    } catch (error) {
      this.deps.logger.warn(
        `dsh-web-enhanced vision: ${candidate.provider}/${candidate.model} failed — `
        + (error instanceof Error ? error.message : String(error)),
      )
      return null
    }
    const trimmed = text.trim()
    return trimmed === '' ? null : trimmed
  }

  /** Ordered endpoint attempts: local Ollama, main endpoint, fallbacks. */
  private async endpointAttempts(): Promise<EndpointAttempt[]> {
    const attempts: EndpointAttempt[] = []
    const local = await this.ollamaProbe
    if (local !== null) attempts.push(local)
    if (this.settings.baseUrl.trim() !== '' && this.settings.endpointModel.trim() !== '') {
      attempts.push({
        model: this.settings.endpointModel,
        baseURL: this.settings.baseUrl.replace(/\/+$/u, ''),
        apiKey: this.settings.apiKey,
        anonymous: this.settings.anonymous,
        timeoutMs: this.settings.timeoutMs,
        maxTokens: this.settings.maxTokens,
      })
    }
    for (const fallback of this.settings.fallbacks) {
      const baseURL = fallback.baseURL === '' ? this.settings.baseUrl : fallback.baseURL
      if (fallback.model.trim() === '' || baseURL.trim() === '') continue
      attempts.push({
        model: fallback.model,
        baseURL: baseURL.replace(/\/+$/u, ''),
        apiKey: fallback.apiKey === '' ? this.settings.apiKey : fallback.apiKey,
        anonymous: fallback.anonymous,
        timeoutMs: fallback.timeoutMs > 0 ? fallback.timeoutMs : this.settings.timeoutMs,
        maxTokens: this.settings.maxTokens,
      })
    }
    return attempts
  }

  /** Read the image bytes once, then hit the content-hash cache. */
  private async transcribeEndpoint(attempt: EndpointAttempt, ref: ImageRefFace, signal?: AbortSignal): Promise<string> {
    const attachments = this.deps.attachments
    if (attachments === undefined) {
      throw new Error('no attachment service is mounted, so image bytes cannot be read for the endpoint transcriber')
    }
    const stored = await attachments.readImage(ref, signal)
    const data = stored.data
    const hash = createHash('sha256').update(data).digest('hex')
    const key = `sha256:${hash}`
    const cached = this.cache.get(key)
    if (cached !== undefined) return cached
    const mediaType = stored.ref.mediaType ?? ref.mediaType ?? 'image/png'
    const text = await this.transcribeRequest(attempt, mediaType, data, signal)
    if (this.cache.size >= this.settings.cacheLimit) {
      const oldest = this.cache.keys().next().value
      if (oldest !== undefined) this.cache.delete(oldest)
    }
    this.cache.set(key, text)
    return text
  }

  /** One `/chat/completions` request for already-read image bytes. */
  private async transcribeRequest(
    attempt: EndpointAttempt,
    mediaType: string,
    data: Uint8Array,
    signal?: AbortSignal,
  ): Promise<string> {
    const baseURL = attempt.baseURL.replace(/\/+$/u, '')
    const url = `${baseURL}/chat/completions`
    const apiKey = resolveVisionApiKey(attempt, baseURL, this.settings.apiKeyEnv)
    // Anonymous endpoints (free tiers) can hang: cap them hard so one bad
    // endpoint cannot stall a turn for the full configured timeout.
    const effectiveTimeout = attempt.anonymous
      ? Math.min(attempt.timeoutMs, ANONYMOUS_TIMEOUT_CAP_MS)
      : attempt.timeoutMs
    const dataUrl = `data:${mediaType};base64,${Buffer.from(data).toString('base64')}`
    const post = (): Promise<Response> => this.fetchImpl(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(apiKey === '' ? {} : { authorization: `Bearer ${apiKey}` }),
      },
      body: JSON.stringify({
        model: attempt.model,
        max_tokens: attempt.maxTokens,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: dataUrl } },
            { type: 'text', text: this.settings.prompt },
          ],
        }],
      }),
      signal: AbortSignal.any([
        AbortSignal.timeout(effectiveTimeout),
        ...(signal === undefined ? [] : [signal]),
      ]),
    })

    let response = await post()
    if (response.status === 429) {
      if (attempt.anonymous) {
        // Free anonymous tiers are rate-limited far beyond any Retry-After;
        // retrying only adds a long stall. Fail immediately with guidance.
        const body = await response.text()
        throw new Error(
          `dsh-web-enhanced vision: transcription failed (rate_limit) at ${url}: ${body.slice(0, 200)} `
          + '— anonymous free endpoints are strictly rate-limited and may hang; they are not retried. '
          + 'Configure visionApiKey, or use local Ollama.',
        )
      }
      const retryAfter = parseRetryAfter(response.headers.get('retry-after'))
      if (retryAfter !== undefined) {
        await sleep(Math.min(retryAfter, MAX_RETRY_AFTER_SECONDS) * 1000)
        response = await post()
      }
    }
    const body = await response.text()
    if (!response.ok) {
      const { kind, hint } = classifyVisionHttpError(response.status, body)
      throw new Error(`dsh-web-enhanced vision: transcription failed (${kind}) at ${url}: ${body.slice(0, 200)} — ${hint}`)
    }
    let payload: unknown
    try {
      payload = JSON.parse(body)
    } catch {
      throw new Error(`dsh-web-enhanced vision: transcription failed, non-JSON response: ${body.slice(0, 200)}`)
    }
    const content = (payload as {
      choices?: ReadonlyArray<{ message?: { content?: unknown } }>
    })?.choices?.[0]?.message?.content
    const text = typeof content === 'string'
      ? content
      : Array.isArray(content)
        ? content
          .map(part => typeof (part as { text?: unknown })?.text === 'string'
            ? (part as { text: string }).text
            : '')
          .filter(part => part !== '')
          .join('\n')
        : undefined
    if (text === undefined || text.trim() === '') {
      throw new Error('dsh-web-enhanced vision: transcription failed, the VLM returned no text')
    }
    return text.trim()
  }

  /** The last-resort description: the turn still works, with guidance inside. */
  private placeholder(errors: readonly string[]): string {
    if (errors.length > 0) {
      return '（图片内容识别失败，请稍后重试或检查视觉模型配置。'
        + `已尝试：${errors.join('；')}）`
    }
    return '（图片内容识别不可用：DSH 中没有配置支持图片的模型，也未配置视觉转译端点。'
      + '请在 DSH 中配置一个多模态模型，或在本插件的 cordis.patch.yml 中设置 visionBaseUrl / visionApiKey，'
      + '或在 http://localhost:11434 启动本地 Ollama。）'
  }
}

/** One agent face, structurally (see `@deepseek-ai/dsh-agent`). */
interface AgentFace {
  readonly id?: unknown
  readonly options?: { readonly provider?: unknown; readonly model?: unknown }
  readonly session?: SessionFace
}

/** One live session face, structurally (see `@deepseek-ai/dsh-session`). */
interface SessionFace {
  readonly id?: unknown
  readonly requestHeader?: () => { readonly config?: unknown } | undefined
  readonly deriveMessages?: () => Message[]
}

/** One model call config face, as `agent/request` yields it. */
interface RequestConfigFace {
  readonly provider?: unknown
  readonly model?: unknown
}

/** One tool execution face, as `tools/post-execute` sees it. */
interface ToolExecutionFace {
  readonly name?: unknown
  readonly agent?: AgentFace
  readonly signal?: AbortSignal
}

/** One tool result face, as `tools/post-execute` sees it. */
interface ToolResultFace {
  readonly isError?: unknown
  readonly content?: readonly ContentBlockFace[]
}

/** One post-execute decision face. */
interface PostDecisionFace {
  readonly kind?: unknown
  readonly content?: readonly ContentBlockFace[]
  readonly [key: string]: unknown
}

/** Our admission wrapper, carrying the marker that makes teardown order-safe. */
type MarkedResolver = LlmResolverFace & { readonly __webEnhancedVisionAdmission?: boolean }

/**
 * The transparent half of the integration, mounted as the `visionIntegration`
 * Cordis service. It patches admission, transcribes image-bearing steps into
 * model-visible replacements, and rewrites `read_image` results.
 */
export class VisionInterceptor extends Service {
  private readonly settings: VisionSettings
  private readonly transcriber: VisionTranscriber
  private readonly llm: LlmVisionFace | undefined
  private readonly defaultModel: { currentSelection?: () => { provider?: unknown; model?: unknown } } | undefined
  private readonly modelByAgent = new Map<string, { provider: string; model: string }>()
  private readonly pending = new Map<string, { content: ContentBlockFace[] }>()
  private readonly lastTurns = new Map<string, number>()
  private readonly deriveOriginals = new Map<Session, () => Message[]>()
  private originalResolver: LlmResolverFace | null = null
  private admissionPatched = false

  constructor(ctx: Context, config: VisionConfigSource = {}) {
    super(ctx, 'visionIntegration')
    this.settings = resolveVisionSettings(config)
    const llm = ctx.get('llm' as never, false) as unknown as LlmVisionFace | undefined
    const attachments = ctx.get('attachments' as never, false) as unknown as AttachmentsFace | undefined
    this.llm = llm
    this.defaultModel = ctx.get('agentDefaultModel' as never, false) as unknown as
      | { currentSelection?: () => { provider?: unknown; model?: unknown } }
      | undefined
    this.transcriber = new VisionTranscriber(this.settings, {
      ...(llm === undefined ? {} : { llm }),
      ...(attachments === undefined ? {} : { attachments }),
      logger: ctx.logger as unknown as VisionLogger,
    })

    if (this.settings.patchAdmission) this.patchAdmission()

    ctx.on('agent/request', async (payload, next) => {
      const resolved = await next()
      this.rememberModel(payload.agent, resolved)
      return resolved
    })

    // Not declared by any package this plugin depends on directly; the event
    // is dispatched by dsh-system-prompt with the same payload DSH-vision
    // reads. Structural on purpose.
    ctx.on('system-prompt/assemble' as never, (async (
      _assembly: unknown,
      context: unknown,
      next: () => Promise<unknown>,
    ) => {
      const result = await next()
      try {
        const agent = (context as { agent?: AgentFace })?.agent
        const variables = (result as { variables?: unknown })?.variables as RequestConfigFace | undefined
        if (agent !== undefined) this.rememberModel(agent, variables)
      } catch {
        // Capture is best-effort; the next waterfall levels carry the model.
      }
      return result
    }) as never)

    ctx.on('agent/pre-step', async (payload, next) => {
      const decision = await next()
      if (!decision || decision.kind !== 'enter' || !this.settings.enabled) return decision

      const agent = payload.agent as unknown as AgentFace | undefined
      const session = agent?.session
      this.ensureDeriveWrapped(session)

      const current = this.currentModel(agent)
      if (current !== null && await this.supportsImage(current.provider, current.model)) return decision

      const sessionId = session?.id === undefined ? '' : String(session.id)
      const agentId = agent?.id === undefined ? '' : String(agent.id)
      if (this.lastTurns.get(agentId) !== payload.turn) {
        this.lastTurns.set(agentId, payload.turn)
        if (sessionId !== '') {
          const prefix = `${sessionId}:`
          for (const key of this.pending.keys()) {
            if (key.startsWith(prefix)) this.pending.delete(key)
          }
        }
      }

      const memo = new Map<string, string>()
      for (const message of decision.messages) {
        if (message === null || message === undefined || !Array.isArray(message.content)
          || !hasImageBlocks(message.content)) continue
        const id = (message as { id?: unknown }).id
        if (typeof id !== 'string' || sessionId === '') continue
        const transformed = await this.transcriber.transformBlocks(message.content, memo, payload.signal)
        if (transformed.changed) this.pending.set(`${sessionId}:${id}`, { content: transformed.blocks })
      }
      // The decision itself is unchanged: the image stays in durable history,
      // while the pending replacement changes only the model-visible surface.
      return decision
    })

    ctx.on('session/event', (session, event) => {
      if (!this.settings.enabled) return
      if (!event || event.type !== 'user/message' || event.surfaceOp !== 'append') return
      const data = event.data as { id?: unknown }
      if (typeof data?.id !== 'string') return
      const key = `${String(session.id)}:${data.id}`
      const pending = this.pending.get(key)
      if (pending === undefined) return
      const replacement = { ...data, content: pending.content } as never
      const shadowed = event.seq
      // Cannot re-enter append from inside the `session/event` dispatch; the
      // microtask runs after the loop's synchronous step block, and the
      // deriveMessages wrapper covers that first request synchronously.
      queueMicrotask(() => {
        try {
          session.append('user/message', replacement, {
            surfaceOp: { op: 'replace', start: shadowed, end: shadowed },
            sourceEventSeqs: [shadowed],
          })
          this.pending.delete(key)
        } catch (error) {
          this.logWarn(`could not write the model-visible replacement (deriveMessages wrapper still covers the step): ${this.messageOf(error)}`)
        }
      })
    })

    ctx.on('tools/post-execute' as never, (async (
      exec: ToolExecutionFace,
      result: ToolResultFace,
      next: () => Promise<PostDecisionFace>,
    ) => {
      if (exec.name !== 'read_image') return next()
      const decision = await next()
      if (decision?.kind !== 'accept') return decision
      if (result.isError || !this.settings.enabled) return decision

      const current = this.currentModel(exec.agent)
      if (current !== null && await this.supportsImage(current.provider, current.model)) return decision

      const blocks = result.content ?? []
      const imageBlock = blocks.find(block => block?.type === 'image')
      const attachment = imageBlock?.attachment as ImageRefFace | undefined
      if (attachment === undefined) return decision

      // A downstream listener already replaced the image: honor its work
      // instead of paying for a second transcription.
      const accepted = decision.content
      if (accepted !== undefined && !accepted.some(block => block?.type === 'image')) return decision

      const description = await this.transcriber.describe(attachment, new Map<string, string>(), exec.signal)
      const envelope = blocks
        .filter(block => block?.type === 'text')
        .map(block => (typeof block.text === 'string' ? block.text : ''))
        .filter(text => text !== '')
        .join('\n')
      return {
        kind: 'accept',
        content: [{
          type: 'text',
          text: (envelope === '' ? '' : `${envelope}\n`) + `\n${this.settings.marker}\n${description}\n`,
        }],
      } as PostDecisionFace
    }) as never)

    ctx.effect(() => () => {
      this.restoreAdmission()
      this.restoreDerive()
    }, 'dsh-web-enhanced: vision teardown')
  }

  /** Live status for the Settings tab and the `visionStatus` remote. */
  async status(): Promise<VisionStatusView> {
    const [harnessModels, ollama] = await Promise.all([
      this.transcriber.harnessCandidates(),
      this.transcriber.ollamaState(),
    ])
    const endpointConfigured = this.settings.baseUrl.trim() !== '' && this.settings.endpointModel.trim() !== ''
    return {
      mounted: true,
      enabled: this.settings.enabled,
      patchAdmission: this.settings.patchAdmission,
      admissionActive: this.admissionPatched,
      harnessModels,
      endpointConfigured,
      endpointModel: endpointConfigured ? this.settings.endpointModel : null,
      apiKeySource: this.transcriber.apiKeySource(),
      ollamaDetected: ollama.detected,
      ollamaModel: ollama.model,
      cacheSize: this.transcriber.cacheSize,
      lastError: this.transcriber.lastError,
    }
  }

  /** Add `image` to the model metadata the two admission gates read. */
  private patchAdmission(): void {
    const llm = this.llm
    if (llm === undefined || typeof llm.resolveModelInfo !== 'function') return
    const current = llm.resolveModelInfo as MarkedResolver
    if (current.__webEnhancedVisionAdmission === true) {
      // Re-entry (HMR of this plugin): the live wrapper is already ours.
      this.admissionPatched = true
      return
    }
    const original = llm.resolveModelInfo.bind(llm)
    this.originalResolver = original
    const wrapped = (async (provider: string, model: string, signal?: AbortSignal) => {
      const info = await original(provider, model, signal)
      const modalities = Array.isArray(info?.inputModalities) ? info.inputModalities.slice() : ['text']
      if (!modalities.includes('image')) return { ...info, inputModalities: [...modalities, 'image'] }
      return info
    }) as MarkedResolver
    Object.defineProperty(wrapped, '__webEnhancedVisionAdmission', { value: true })
    llm.resolveModelInfo = wrapped
    this.admissionPatched = true
  }

  /**
   * Restore only when the live resolver is still ours. If another plugin
   * wrapped after us, removing ours would amputate their wrapper, so the chain
   * is left intact instead (this is the unload-order bug DSH-vision has).
   */
  private restoreAdmission(): void {
    const llm = this.llm
    if (llm === undefined || !this.admissionPatched) return
    const current = llm.resolveModelInfo as MarkedResolver | undefined
    if (typeof current === 'function' && current.__webEnhancedVisionAdmission === true) {
      llm.resolveModelInfo = this.originalResolver ?? current
    } else if (this.originalResolver !== null) {
      this.logWarn('vision admission patch was superseded by another resolver wrapper; leaving the live chain intact')
    }
    this.admissionPatched = false
  }

  /** Real multimodal capability, read through the captured original method. */
  private async supportsImage(provider: string, model: string): Promise<boolean> {
    if (provider === '' || model === '') return false
    try {
      const resolve = this.originalResolver ?? this.llm?.resolveModelInfo
      if (resolve === undefined) return false
      const info = await resolve(provider, model)
      return Array.isArray(info?.inputModalities) && info.inputModalities.includes('image')
    } catch {
      return false
    }
  }

  /**
   * Model in force for one agent: the assembly/request capture (zero lag for
   * UI selection), then the session request header, then agent options, then
   * the global default selection.
   */
  private currentModel(agent: AgentFace | undefined): { provider: string; model: string } | null {
    const agentId = agent?.id === undefined ? undefined : String(agent.id)
    const cached = agentId === undefined ? undefined : this.modelByAgent.get(agentId)
    if (cached !== undefined) return cached
    try {
      const header = agent?.session?.requestHeader?.() as { config?: RequestConfigFace } | undefined
      const config = header?.config
      if (typeof config?.provider === 'string' && typeof config.model === 'string') {
        return { provider: config.provider, model: config.model }
      }
    } catch {
      // Fall through to the coarser sources.
    }
    const options = agent?.options
    if (typeof options?.provider === 'string' && typeof options.model === 'string') {
      return { provider: options.provider, model: options.model }
    }
    try {
      const selected = this.defaultModel?.currentSelection?.()
      if (typeof selected?.provider === 'string' && typeof selected.model === 'string') {
        return { provider: selected.provider, model: selected.model }
      }
    } catch {
      // No selection is a valid state; the step is then treated as text-only.
    }
    return null
  }

  /** Cache the provider/model an assembly or request actually used. */
  private rememberModel(agent: unknown, config: unknown): void {
    const agentId = (agent as AgentFace | undefined)?.id
    const pair = config as RequestConfigFace | null | undefined
    if (agentId === undefined || typeof pair?.provider !== 'string' || typeof pair.model !== 'string') return
    this.modelByAgent.set(String(agentId), { provider: pair.provider, model: pair.model })
  }

  /**
   * Wrap one session's `deriveMessages` so the first step of a turn already
   * sees the pending description — the loop derives history synchronously
   * before the microtask that persists the surface replacement can run.
   */
  private ensureDeriveWrapped(session: SessionFace | undefined): void {
    if (session === undefined || typeof session.deriveMessages !== 'function') return
    const live = session as Session
    const marker = live as unknown as { __webEnhancedVisionDeriveWrapped?: boolean }
    if (marker.__webEnhancedVisionDeriveWrapped === true || this.deriveOriginals.has(live)) return
    const original = live.deriveMessages.bind(live)
    const sessionId = String(live.id)
    const pending = this.pending
    live.deriveMessages = function (): Message[] {
      const messages = original()
      let changed = false
      const out = messages.map(message => {
        const id = (message as { id?: unknown }).id
        if (typeof id !== 'string') return message
        const replacement = pending.get(`${sessionId}:${id}`)
        if (replacement === undefined) return message
        changed = true
        return { ...message, content: replacement.content } as unknown as Message
      })
      return changed ? out : messages
    }
    marker.__webEnhancedVisionDeriveWrapped = true
    this.deriveOriginals.set(live, original)
  }

  /** Restore every wrapped `deriveMessages` (idempotent, teardown-only). */
  private restoreDerive(): void {
    for (const [session, original] of this.deriveOriginals) {
      try {
        session.deriveMessages = original
      } catch {
        // The session is already gone; nothing to restore.
      }
    }
    this.deriveOriginals.clear()
  }

  private messageOf(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
  }

  private logWarn(message: string): void {
    try {
      this.ctx.logger.warn(`dsh-web-enhanced vision: ${message}`)
    } catch {
      // Logging must never take the interception path down.
    }
  }
}

export { VisionInterceptor as VisionIntegration }
