/**
 * Model-route display names for the balance line.
 *
 * The host LLM directory is the same source the model picker reads, so
 * "DeepSeek · DeepSeek-V4-Flash" matches the picker instead of echoing raw
 * route ids. Lookups are cached per provider with one shared in-flight fetch;
 * a deployment without the llm service, or a query that fails, falls back to
 * a static provider map and the raw model id — never a failure.
 * @module dsh-web-enhanced/src/model-names
 */

/** The llm directory face, narrowed to the two reads this resolver needs. */
export interface LlmNamesFace {
  listProviders(): ReadonlyArray<{ readonly id: string; readonly name?: string }>
  listModels(provider: string): Promise<ReadonlyArray<{ readonly id: string; readonly name?: string }>>
}

/** Static fallbacks for well-known routes (the raw id otherwise). */
const PROVIDER_DISPLAY: Readonly<Record<string, string>> = {
  'deepseek-official': 'DeepSeek',
  deepseek: 'DeepSeek',
  opencode: 'OpenCode',
  'opencode-go': 'OpenCode Go',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  gemini: 'Gemini',
  openrouter: 'OpenRouter',
}

/** One resolved display pair. */
export interface ModelRouteNamesView {
  readonly provider: string
  readonly model: string
  readonly providerName: string
  readonly modelName: string
}

/** Cached directory-name resolver (one per gateway). */
export class ModelRouteNames {
  private readonly providerNames = new Map<string, string>()
  private readonly modelNames = new Map<string, ReadonlyMap<string, string>>()
  private readonly pendingModels = new Map<string, Promise<void>>()

  /**
   * @param llm - the host llm directory; undefined degrades to fallbacks.
   */
  constructor(private readonly llm: LlmNamesFace | undefined) {}

  /** Drop every cached directory name (an adapter update re-primes lazily). */
  clear(): void {
    this.providerNames.clear()
    this.modelNames.clear()
  }

  /** Resolve both display names, falling back per field on any failure. */
  async describe(provider: string, model: string): Promise<ModelRouteNamesView> {
    return {
      provider,
      model,
      providerName: await this.providerName(provider),
      modelName: await this.modelName(provider, model),
    }
  }

  private async providerName(provider: string): Promise<string> {
    if (this.providerNames.size === 0) await this.loadProviders()
    return this.providerNames.get(provider)
      ?? PROVIDER_DISPLAY[provider]
      ?? (provider.length > 0 ? provider.charAt(0).toUpperCase() + provider.slice(1) : provider)
  }

  private async modelName(provider: string, model: string): Promise<string> {
    if (provider !== '') await this.loadModels(provider)
    return this.modelNames.get(provider)?.get(model) ?? model
  }

  private async loadProviders(): Promise<void> {
    if (this.llm === undefined || typeof this.llm.listProviders !== 'function') return
    try {
      for (const provider of this.llm.listProviders()) {
        if (typeof provider.name === 'string' && provider.name.length > 0) {
          this.providerNames.set(provider.id, provider.name)
        }
      }
    } catch {
      // A directory failure is display-only; fallbacks already answer.
    }
  }

  private loadModels(provider: string): Promise<void> {
    const existing = this.pendingModels.get(provider)
    if (existing !== undefined) return existing
    const loading = (async () => {
      if (this.llm === undefined || typeof this.llm.listModels !== 'function') return
      try {
        const models = await this.llm.listModels(provider)
        const names = new Map<string, string>()
        for (const model of models) {
          if (typeof model.name === 'string' && model.name.length > 0) names.set(model.id, model.name)
        }
        this.modelNames.set(provider, names)
      } catch {
        // Fall back to the raw model id for this provider.
      }
    })()
    this.pendingModels.set(provider, loading)
    void loading.finally(() => { this.pendingModels.delete(provider) })
    return loading
  }
}
