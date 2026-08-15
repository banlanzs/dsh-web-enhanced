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
  readonly input: number
  /** Output price per 1M tokens. */
  readonly output: number
  /** Cached-read input price per 1M tokens; null when not published. */
  readonly cacheRead: number | null
  /** Cache-write input price per 1M tokens; null when not published. */
  readonly cacheWrite: number | null
}

/** Behaviour of one models.dev client instance. */
export interface ModelsDevPricingOptions {
  /** Endpoint returning the models.dev JSON blob. */
  readonly url: string
  /** How long one fetched index stays fresh. */
  readonly ttlMs: number
  /** Request timeout. */
  readonly timeoutMs: number
  /** Model-route provider id → models.dev provider id. */
  readonly providerMap: Readonly<Record<string, string>>
  /** Fetch seam; defaults to global fetch. */
  readonly fetchImpl?: typeof fetch
}

/** The raw cost object models.dev attaches to a model entry. */
interface RawCost {
  readonly input?: unknown
  readonly output?: unknown
  readonly cache_read?: unknown
  readonly cache_write?: unknown
}

/** One provider entry of the models.dev blob. */
interface RawProvider {
  readonly models?: Readonly<Record<string, { readonly cost?: RawCost }>>
}

/** One provider entry of the models.dev blob. */
interface RawProviderTable {
  readonly [provider: string]: RawProvider
}

/** Read one non-negative finite price, or null for absent/unknown. */
function priceOf(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

/** Parse the models.dev JSON shape into `provider/model → ModelPricing`. */
export function parseModelsDev(raw: unknown): Map<string, ModelPricing> {
  const out = new Map<string, ModelPricing>()
  /** Bare-model aliases; a name shared by several providers is ambiguous and dropped. */
  const bare = new Map<string, ModelPricing | 'ambiguous'>()
  if (typeof raw !== 'object' || raw === null) return out
  for (const [providerId, provider] of Object.entries(raw as RawProviderTable)) {
    if (provider.models === undefined) continue
    for (const [modelId, model] of Object.entries(provider.models)) {
      const cost = model.cost
      if (cost === undefined) continue
      const input = priceOf(cost.input)
      const output = priceOf(cost.output)
      if (input === null || output === null) continue
      const pricing: ModelPricing = {
        input,
        output,
        cacheRead: priceOf(cost.cache_read),
        cacheWrite: priceOf(cost.cache_write),
      }
      out.set(`${providerId}/${modelId}`, pricing)
      bare.set(modelId, bare.has(modelId) ? 'ambiguous' : pricing)
    }
  }
  for (const [modelId, pricing] of bare) {
    if (pricing !== 'ambiguous') out.set(modelId, pricing)
  }
  return out
}

/**
 * Cached, single-flight models.dev pricing index.
 *
 * One instance per gateway; a deployment asking for prices of many models
 * still performs one download per TTL. In-flight requests share the same
 * promise, and a fetch failure clears the pending state so the next call
 * retries instead of replaying a dead rejection.
 */
export class ModelsDevPricing {
  private index: Map<string, ModelPricing> | undefined
  private loadedAt = 0
  private pending: Promise<Map<string, ModelPricing>> | undefined

  constructor(private readonly options: ModelsDevPricingOptions) {}

  /**
   * Look up one route's price.
   * @param provider - the model route's provider id (mapped by config).
   * @param model - the model id the route selected.
   * @returns the price, or undefined when models.dev has no entry.
   */
  async pricingFor(provider: string, model: string): Promise<ModelPricing | undefined> {
    const index = await this.loaded()
    const providerId = this.options.providerMap[provider] ?? provider
    return index.get(`${providerId}/${model}`) ?? index.get(model)
  }

  /** Fetch (or return the cached) index; concurrent callers share one flight. */
  private async loaded(): Promise<Map<string, ModelPricing>> {
    const now = Date.now()
    if (this.index !== undefined && now - this.loadedAt < this.options.ttlMs) return this.index
    this.pending ??= this.fetchIndex()
    try {
      const index = await this.pending
      this.index = index
      this.loadedAt = now
      return index
    } finally {
      this.pending = undefined
    }
  }

  private async fetchIndex(): Promise<Map<string, ModelPricing>> {
    const fetchImpl = this.options.fetchImpl ?? fetch
    const response = await fetchImpl(this.options.url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(this.options.timeoutMs),
    })
    if (!response.ok) throw new Error(`models.dev answered ${response.status}`)
    return parseModelsDev(await response.json() as unknown)
  }
}
