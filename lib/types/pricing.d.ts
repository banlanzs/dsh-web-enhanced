/**
 * models.dev pricing lookup for the session-cost readout.
 *
 * The endpoint ships one JSON blob for every provider/model (currently a few
 * megabytes), so the gateway fetches it once per cache TTL and indexes only
 * the cost fields. Costs are USD per one million tokens, the unit models.dev
 * publishes and the same unit the token-usage projection is billed in.
 * @module dsh-web-enhanced/src/pricing
 */
/** Per-million-token prices of one model (USD). */
export interface ModelPricing {
    /** Cache-miss input price per 1M tokens. */
    readonly input: number;
    /** Output price per 1M tokens. */
    readonly output: number;
    /** Cached-read input price per 1M tokens; null when not published. */
    readonly cacheRead: number | null;
    /** Cache-write input price per 1M tokens; null when not published. */
    readonly cacheWrite: number | null;
}
/** Behaviour of one models.dev client instance. */
export interface ModelsDevPricingOptions {
    /** Endpoint returning the models.dev JSON blob. */
    readonly url: string;
    /** How long one fetched index stays fresh. */
    readonly ttlMs: number;
    /** Request timeout. */
    readonly timeoutMs: number;
    /** Model-route provider id → models.dev provider id. */
    readonly providerMap: Readonly<Record<string, string>>;
    /** Fetch seam; defaults to global fetch. */
    readonly fetchImpl?: typeof fetch;
}
/** Parse the models.dev JSON shape into `provider/model → ModelPricing`. */
export declare function parseModelsDev(raw: unknown): Map<string, ModelPricing>;
/**
 * Cached, single-flight models.dev pricing index.
 *
 * One instance per gateway; a deployment asking for prices of many models
 * still performs one download per TTL. In-flight requests share the same
 * promise, and a fetch failure clears the pending state so the next call
 * retries instead of replaying a dead rejection.
 */
export declare class ModelsDevPricing {
    private readonly options;
    private index;
    private loadedAt;
    private pending;
    constructor(options: ModelsDevPricingOptions);
    /**
     * Look up one route's price.
     * @param provider - the model route's provider id (mapped by config).
     * @param model - the model id the route selected.
     * @returns the price, or undefined when models.dev has no entry.
     */
    pricingFor(provider: string, model: string): Promise<ModelPricing | undefined>;
    /** Fetch (or return the cached) index; concurrent callers share one flight. */
    private loaded;
    private fetchIndex;
}
