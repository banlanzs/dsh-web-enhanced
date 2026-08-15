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
import type { Context } from '@deepseek-ai/cordis';
import { Service } from '@deepseek-ai/cordis';
import type { VisionFallbackConfig } from './gateway.ts';
import type { VisionStatusView } from './types.ts';
/** Default description prompt: thorough Chinese transcription + scene detail. */
export declare const DEFAULT_VISION_PROMPT = "\u8BF7\u4ED4\u7EC6\u89C2\u5BDF\u8FD9\u5F20\u56FE\u7247\u5E76\u8BE6\u7EC6\u63CF\u8FF0\u5176\u5185\u5BB9\uFF0C\u5305\u62EC\uFF1A\u6240\u6709\u53EF\u89C1\u7684\u6587\u5B57\uFF08\u8BF7\u9010\u5B57\u8F6C\u5F55\uFF09\u3001\u7269\u4F53\u3001\u4EBA\u7269\u3001\u573A\u666F\u3001\u5E03\u5C40\u3001\u989C\u8272\u4EE5\u53CA\u4EFB\u4F55\u503C\u5F97\u6CE8\u610F\u7684\u7EC6\u8282\u3002\u8BF7\u7528\u4E2D\u6587\u56DE\u7B54\u3002";
/** Marker the model sees instead of the image block. */
export declare const DEFAULT_VISION_MARKER = "[\u56FE\u7247\u5185\u5BB9\u63CF\u8FF0]";
/** Durable image reference face (see `@deepseek-ai/dsh-attachment`). */
export interface ImageRefFace {
    readonly attachmentId?: string;
    readonly mediaType?: string;
    readonly bytes?: number;
    readonly width?: number;
    readonly height?: number;
    readonly name?: string;
}
/** Verified stored bytes face returned by the attachment service. */
export interface StoredImageFace {
    readonly ref: ImageRefFace;
    readonly data: Uint8Array;
}
/** Attachment service face, structurally. */
export interface AttachmentsFace {
    readImage(ref: ImageRefFace, signal?: AbortSignal): Promise<StoredImageFace>;
}
/** One registered provider route, as far as vision needs it. */
export interface LlmProviderFace {
    readonly id: string;
}
/** One model listing entry, as far as vision needs it. */
export interface LlmModelFace {
    readonly id: string;
    readonly inputModalities?: readonly string[];
}
/** Resolved model metadata face. */
export interface LlmResolvedFace {
    readonly inputModalities?: readonly string[];
    readonly [key: string]: unknown;
}
/** One streamed chunk face. */
export interface LlmStreamChunkFace {
    readonly type: string;
    readonly text?: string;
}
/** One hand-built model call face. */
export interface LlmGenerateFace {
    readonly provider: string;
    readonly model: string;
    readonly messages: readonly unknown[];
    readonly signal?: AbortSignal;
}
/** The resolver shape the admission patch wraps. */
export interface LlmResolverFace {
    (provider: string, model: string, signal?: AbortSignal): Promise<LlmResolvedFace>;
}
/** The `llm` service face, structurally. */
export interface LlmVisionFace {
    resolveModelInfo?: LlmResolverFace;
    listProviders(): readonly LlmProviderFace[];
    listModels(provider: string): Promise<readonly LlmModelFace[]>;
    stream(options: LlmGenerateFace): AsyncIterable<LlmStreamChunkFace>;
}
/** A content block face; unknown shapes pass through untouched. */
export interface ContentBlockFace {
    readonly type: string;
    readonly [key: string]: unknown;
}
/** One fallback endpoint after defaults have been folded in. */
export interface VisionFallbackSettings {
    readonly model: string;
    readonly baseURL: string;
    readonly apiKey: string;
    readonly anonymous: boolean;
    readonly timeoutMs: number;
}
/** Resolved vision settings (every field has a default). */
export interface VisionSettings {
    readonly enabled: boolean;
    readonly patchAdmission: boolean;
    readonly prompt: string;
    readonly marker: string;
    readonly provider: string;
    readonly model: string;
    readonly baseUrl: string;
    readonly apiKey: string;
    readonly apiKeyEnv: string;
    readonly endpointModel: string;
    readonly anonymous: boolean;
    readonly timeoutMs: number;
    readonly maxTokens: number;
    readonly autoLocalOllama: boolean;
    readonly localOllamaModel: string;
    readonly localOllamaUrl: string;
    readonly fallbacks: readonly VisionFallbackSettings[];
    readonly cacheLimit: number;
    readonly cooldownMs: number;
}
/** The optional fields of the plugin config vision reads. */
export interface VisionConfigSource {
    readonly visionEnabled?: boolean;
    readonly visionPatchAdmission?: boolean;
    readonly visionPrompt?: string;
    readonly visionMarker?: string;
    readonly visionProvider?: string;
    readonly visionModel?: string;
    readonly visionBaseUrl?: string;
    readonly visionApiKey?: string;
    readonly visionApiKeyEnv?: string;
    readonly visionEndpointModel?: string;
    readonly visionAnonymous?: boolean;
    readonly visionTimeoutMs?: number;
    readonly visionMaxTokens?: number;
    readonly visionAutoLocalOllama?: boolean;
    readonly visionLocalOllamaModel?: string;
    readonly visionLocalOllamaUrl?: string;
    readonly visionFallbackModels?: readonly VisionFallbackConfig[];
    readonly visionCacheLimit?: number;
    readonly visionCooldownMs?: number;
}
/** Field-wise defaults for the vision subset of the plugin config. */
export declare function resolveVisionSettings(config: VisionConfigSource): VisionSettings;
/** Recursively detect image blocks, walking tool-result content. */
export declare function hasImageBlocks(blocks: readonly unknown[] | undefined): boolean;
/** Whether an endpoint is a localhost service (no key required). */
export declare function isLocalVisionUrl(baseURL: string): boolean;
/**
 * Resolve the endpoint API key: config, then environment, per call. Anonymous
 * and local endpoints need none; anything else without a key fails fast with
 * guidance instead of hanging.
 */
export declare function resolveVisionApiKey(attempt: {
    readonly apiKey: string;
    readonly anonymous: boolean;
}, baseURL: string, apiKeyEnv: string, env?: Record<string, string | undefined>): string;
/** Classified failure of one VLM HTTP response. */
export interface VisionHttpErrorKind {
    readonly kind: string;
    readonly hint: string;
}
/** Classify a failed VLM response into a kind + actionable hint. */
export declare function classifyVisionHttpError(status: number, body: unknown): VisionHttpErrorKind;
/** Parse a Retry-After header value (seconds or HTTP date) into seconds. */
export declare function parseRetryAfter(header: string | null | undefined): number | undefined;
/** Probe an OpenAI-compatible endpoint for its model list. */
export declare function detectLocalOllama(fetchImpl: typeof fetch, baseURL: string, timeoutMs: number, preferredModel: string): Promise<{
    baseURL: string;
    model: string;
} | null>;
/** Minimal logger face; Cordis' logger satisfies it. */
export interface VisionLogger {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}
/** Dependencies the transcription engine reads. */
export interface VisionTranscriberDeps {
    readonly llm?: LlmVisionFace;
    readonly attachments?: AttachmentsFace;
    readonly fetchImpl?: typeof fetch;
    readonly logger: VisionLogger;
}
/**
 * The transcription engine: image reference → text description.
 *
 * Source order: DSH-configured vision models (zero extra keys), then local
 * Ollama, then the configured OpenAI-compatible endpoint with its fallback
 * chain. Failures are collected; when every source fails the description is a
 * placeholder the model can still read, so an image never reaches a text-only
 * adapter raw.
 */
export declare class VisionTranscriber {
    readonly settings: VisionSettings;
    private readonly deps;
    private readonly cache;
    private readonly cooldowns;
    private readonly ollamaProbe;
    private failure;
    constructor(settings: VisionSettings, deps: VisionTranscriberDeps);
    private get fetchImpl();
    /** Entries currently held in the content-hash cache. */
    get cacheSize(): number;
    /** The most recent total transcription failure, or null. */
    get lastError(): string | null;
    /**
     * Describe one image. `memo` deduplicates within one decision (a user
     * message plus its `read_image` duplicate must not transcribe twice).
     * @param ref - durable image reference.
     * @param memo - per-decision attachmentId → description cache.
     * @param signal - caller cancellation.
     * @returns the description (a placeholder when every source failed).
     */
    describe(ref: ImageRefFace, memo: Map<string, string>, signal?: AbortSignal): Promise<string>;
    /**
     * Replace image blocks with descriptions, walking tool-result content. The
     * message itself is never mutated: the caller decides where the transformed
     * blocks go (the model-visible surface replacement).
     */
    transformBlocks(blocks: readonly unknown[], memo: Map<string, string>, signal?: AbortSignal): Promise<{
        blocks: ContentBlockFace[];
        changed: boolean;
    }>;
    /**
     * Vision models from DSH-configured providers: the pinned `visionProvider` /
     * `visionModel` first, then every listed model that declares image input.
     */
    harnessCandidates(): Promise<Array<{
        provider: string;
        model: string;
    }>>;
    /** Where the configured endpoint key comes from (never the key itself). */
    apiKeySource(): 'config' | 'env' | 'none-needed' | 'unset';
    /** Local Ollama probe state (detected at construction, memoized). */
    ollamaState(): Promise<{
        detected: boolean;
        model: string | null;
    }>;
    private describeFresh;
    /** One `llm.stream` description through a DSH-configured vision model. */
    private streamHarness;
    /** Ordered endpoint attempts: local Ollama, main endpoint, fallbacks. */
    private endpointAttempts;
    /** Read the image bytes once, then hit the content-hash cache. */
    private transcribeEndpoint;
    /** One `/chat/completions` request for already-read image bytes. */
    private transcribeRequest;
    /** The last-resort description: the turn still works, with guidance inside. */
    private placeholder;
}
/**
 * The transparent half of the integration, mounted as the `visionIntegration`
 * Cordis service. It patches admission, transcribes image-bearing steps into
 * model-visible replacements, and rewrites `read_image` results.
 */
export declare class VisionInterceptor extends Service {
    private readonly settings;
    private readonly transcriber;
    private readonly llm;
    private readonly defaultModel;
    private readonly modelByAgent;
    private readonly pending;
    private readonly lastTurns;
    private readonly deriveOriginals;
    private originalResolver;
    private admissionPatched;
    constructor(ctx: Context, config?: VisionConfigSource);
    /** Live status for the Settings tab and the `visionStatus` remote. */
    status(): Promise<VisionStatusView>;
    /** Add `image` to the model metadata the two admission gates read. */
    private patchAdmission;
    /**
     * Restore only when the live resolver is still ours. If another plugin
     * wrapped after us, removing ours would amputate their wrapper, so the chain
     * is left intact instead (this is the unload-order bug DSH-vision has).
     */
    private restoreAdmission;
    /** Real multimodal capability, read through the captured original method. */
    private supportsImage;
    /**
     * Model in force for one agent: the assembly/request capture (zero lag for
     * UI selection), then the session request header, then agent options, then
     * the global default selection.
     */
    private currentModel;
    /** Cache the provider/model an assembly or request actually used. */
    private rememberModel;
    /**
     * Wrap one session's `deriveMessages` so the first step of a turn already
     * sees the pending description — the loop derives history synchronously
     * before the microtask that persists the surface replacement can run.
     */
    private ensureDeriveWrapped;
    /** Restore every wrapped `deriveMessages` (idempotent, teardown-only). */
    private restoreDerive;
    private messageOf;
    private logWarn;
}
export { VisionInterceptor as VisionIntegration };
