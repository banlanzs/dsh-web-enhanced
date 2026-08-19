/**
 * Vision domain service: the image-understanding status and config remotes.
 *
 * The gateway delegates its vision* methods here; this module owns the
 * settings projection, the picker options, the endpoint model listing, and
 * the vision slice of the plugin config. The interception runtime itself
 * lives in `./vision.ts` — this is only its wire face.
 * @module dsh-web-enhanced/src/vision-gateway
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import type { VisionConfigGetResult, VisionConfigSaveRequest, VisionConfigSetResult, VisionEndpointModelsRequest, VisionEndpointModelsResult, VisionFallbackConfig, VisionStatusResult } from './types.ts';
/** The vision slice of the plugin config (user input; defaults bind later). */
export interface VisionConfigInput {
    visionEnabled?: boolean;
    visionPatchAdmission?: boolean;
    visionPrompt?: string;
    visionMarker?: string;
    visionProvider?: string;
    visionModel?: string;
    /** User-selected DSH model pool; non-empty replaces auto-detection. */
    visionHarnessModels?: Array<{
        provider: string;
        model: string;
    }>;
    visionBaseUrl?: string;
    visionApiKey?: string;
    visionApiKeyEnv?: string;
    visionEndpointModel?: string;
    /** Candidate pool for the dedicated endpoint; the active model is one of them. */
    visionEndpointModels?: string[];
    visionAnonymous?: boolean;
    visionTimeoutMs?: number;
    visionMaxTokens?: number;
    visionAutoLocalOllama?: boolean;
    visionLocalOllamaModel?: string;
    visionLocalOllamaUrl?: string;
    visionFallbackModels?: VisionFallbackConfig[];
    visionCacheLimit?: number;
    visionCooldownMs?: number;
}
/**
 * The vision config fragment, as the plugin schema assembles it.
 *
 * The interception core is transparent (images stay in the UI, text-only
 * models see the description) and the transcription engine tries, in order:
 * DSH-configured vision models, local Ollama, then the configured
 * OpenAI-compatible endpoint with its fallback chain.
 */
export declare const visionConfigFragment: z<Required<VisionConfigInput>>;
/** Field defaults applied when the vision domain is assembled directly. */
export declare function resolveVisionConfig(config: Partial<VisionConfigInput>): Required<VisionConfigInput>;
/** The vision wire capabilities, as the gateway consumes them. */
export interface VisionDomainFace {
    status(): Promise<VisionStatusResult>;
    configGet(): Promise<VisionConfigGetResult>;
    configSet(request: VisionConfigSaveRequest): Promise<VisionConfigSetResult>;
    endpointModels(request: VisionEndpointModelsRequest): Promise<VisionEndpointModelsResult>;
}
/**
 * Assemble the vision wire domain.
 * @param ctx - the owning context; settings, llm, and the integration service
 *   are all read per call and all optional.
 * @returns the vision wire capabilities.
 */
export declare function createVisionDomain(ctx: Context): VisionDomainFace;
