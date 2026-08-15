/**
 * DeepSeek balance query.
 *
 * The API key is resolved exactly the way the model adapter resolves it: the
 * credential seam first, the ambient environment only as the fallback for a
 * deployment without that seam. Reading `process.env` alone would miss a key
 * configured through settings or a `.env` layer — which is the normal case, and
 * would report "not set" for an account whose model requests are working.
 * Failures are result fields.
 * @module dsh-web-enhanced/src/balance
 */
import type { BalanceReading } from './types.ts';
/** Balance client configuration (deployment config, not tunables). */
export interface BalanceConfig {
    readonly apiKeyEnv: string;
    readonly cacheTtlMs: number;
    readonly baseUrl: string;
}
/**
 * Resolve one credential reference to its value.
 *
 * Mirrors `ctx.credentials.resolve` narrowed to what this client needs; the
 * gateway supplies it, and a deployment without the credential seam supplies
 * nothing so the ambient environment decides.
 */
export type ResolveCredential = (ref: string) => Promise<string | undefined>;
/** Balance query client with a short-lived view cache. */
export declare class BalanceClient {
    private readonly config;
    private readonly resolveCredential?;
    private cache;
    /**
     * @param config - key reference, cache TTL, and endpoint base.
     * @param resolveCredential - credential-seam lookup; omitted falls back to the environment.
     */
    constructor(config: BalanceConfig, resolveCredential?: ResolveCredential | undefined);
    /** Cached or freshly fetched balance view. */
    get(): Promise<BalanceReading>;
    /** Drop the cached view (the settings plane can force a refresh). */
    clear(): void;
    /**
     * The API key, resolved per query so a rotated credential reaches the very
     * next refresh — the same per-operation contract the adapters follow.
     */
    private apiKey;
    private fetchBalance;
}
