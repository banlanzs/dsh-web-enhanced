/**
 * Model domain service: the facts the composer's cost line and the model
 * settings need — account balance, models.dev pricing, route display names,
 * the DeepSeek peak/off-peak clock, OpenCode Go quota, and the per-route
 * request retry policy.
 *
 * The gateway delegates those methods here; this module owns the clients it
 * builds and the model slice of the plugin config.
 * @module dsh-web-enhanced/src/model-gateway
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import type { BalanceGetRequest, BalanceView, DeepSeekRateGetRequest, DeepSeekRateGetResult, ModelRetryGetResult, ModelRetrySetRequest, ModelRetrySetResult, ModelRouteDescribeRequest, ModelRouteDescribeResult, OpencodeGoUsageView, PricingGetRequest, PricingGetResult } from './types.ts';
/** The model slice of the plugin config (user input; defaults bind later). */
export interface ModelConfigInput {
    balanceApiKeyEnv?: string;
    balanceCacheTtlMs?: number;
    balanceBaseUrl?: string;
    balanceProviders?: string[];
    modelsDevUrl?: string;
    modelsDevCacheTtlMs?: number;
    modelsDevTimeoutMs?: number;
    pricingProviderMap?: Record<string, string>;
    /** OpenCode Go usage endpoint (quota windows for the subscription line). */
    opencodeGoUsageUrl?: string;
    /** How long one OpenCode Go quota snapshot stays fresh. */
    opencodeGoCacheTtlMs?: number;
    /** Override of the opencode CLI auth.json path (empty = platform default). */
    opencodeGoAuthFile?: string;
}
/** The model config fragment, as the plugin schema assembles it. */
export declare const modelConfigFragment: z<Required<ModelConfigInput>>;
/** Field defaults applied when the model domain is assembled directly. */
export declare function resolveModelConfig(config: Partial<ModelConfigInput>): Required<ModelConfigInput>;
/** The model capabilities, as the gateway consumes them. */
export interface ModelDomainFace {
    balance(request: BalanceGetRequest): Promise<BalanceView>;
    pricing(request: PricingGetRequest): Promise<PricingGetResult>;
    describeRoute(request: ModelRouteDescribeRequest): Promise<ModelRouteDescribeResult>;
    deepseekRate(request: DeepSeekRateGetRequest): DeepSeekRateGetResult;
    opencodeGoUsage(): Promise<OpencodeGoUsageView>;
    retryGet(): Promise<ModelRetryGetResult>;
    retrySet(request: ModelRetrySetRequest): Promise<ModelRetrySetResult>;
    /** Drop the cached route display names after a directory change. */
    clearRouteNames(): void;
}
/** What the model domain needs from the rest of the plugin. */
export interface ModelDomainDeps {
    readonly ctx: Context;
    readonly config: Required<ModelConfigInput>;
}
/**
 * Assemble the model domain.
 * @param deps - context and the resolved model config.
 * @returns the model capabilities.
 */
export declare function createModelDomain(deps: ModelDomainDeps): ModelDomainFace;
