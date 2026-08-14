/**
 * DeepSeek balance query: resolves the API key the same way the model
 * provider does (an environment variable, by default `DEEPSEEK_API_KEY`),
 * calls `/user/balance`, and caches the view. Failures are result fields.
 * @module dsh-web-enhanced/src/balance
 */
import type { BalanceView } from './types.ts';
/** Balance client configuration (deployment config, not tunables). */
export interface BalanceConfig {
    readonly apiKeyEnv: string;
    readonly cacheTtlMs: number;
    readonly baseUrl: string;
}
/** Balance query client with a short-lived view cache. */
export declare class BalanceClient {
    private readonly config;
    private cache;
    /**
     * @param config - key source, cache TTL, and endpoint base.
     */
    constructor(config: BalanceConfig);
    /** Cached or freshly fetched balance view. */
    get(): Promise<BalanceView>;
    /** Drop the cached view (the settings plane can force a refresh). */
    clear(): void;
    private fetchBalance;
}
