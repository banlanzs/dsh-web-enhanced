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
/** Static fallbacks for well-known routes (the raw id otherwise). */
const PROVIDER_DISPLAY = {
    'deepseek-official': 'DeepSeek',
    deepseek: 'DeepSeek',
    opencode: 'OpenCode',
    'opencode-go': 'OpenCode Go',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    gemini: 'Gemini',
    openrouter: 'OpenRouter',
};
/** Cached directory-name resolver (one per gateway). */
export class ModelRouteNames {
    llm;
    providerNames = new Map();
    modelNames = new Map();
    pendingModels = new Map();
    /**
     * @param llm - the host llm directory; undefined degrades to fallbacks.
     */
    constructor(llm) {
        this.llm = llm;
    }
    /** Drop every cached directory name (an adapter update re-primes lazily). */
    clear() {
        this.providerNames.clear();
        this.modelNames.clear();
    }
    /** Resolve both display names, falling back per field on any failure. */
    async describe(provider, model) {
        return {
            provider,
            model,
            providerName: await this.providerName(provider),
            modelName: await this.modelName(provider, model),
        };
    }
    async providerName(provider) {
        if (this.providerNames.size === 0)
            await this.loadProviders();
        return this.providerNames.get(provider)
            ?? PROVIDER_DISPLAY[provider]
            ?? (provider.length > 0 ? provider.charAt(0).toUpperCase() + provider.slice(1) : provider);
    }
    async modelName(provider, model) {
        if (provider !== '')
            await this.loadModels(provider);
        return this.modelNames.get(provider)?.get(model) ?? model;
    }
    async loadProviders() {
        if (this.llm === undefined || typeof this.llm.listProviders !== 'function')
            return;
        try {
            for (const provider of this.llm.listProviders()) {
                if (typeof provider.name === 'string' && provider.name.length > 0) {
                    this.providerNames.set(provider.id, provider.name);
                }
            }
        }
        catch {
            // A directory failure is display-only; fallbacks already answer.
        }
    }
    loadModels(provider) {
        const existing = this.pendingModels.get(provider);
        if (existing !== undefined)
            return existing;
        const loading = (async () => {
            if (this.llm === undefined || typeof this.llm.listModels !== 'function')
                return;
            try {
                const models = await this.llm.listModels(provider);
                const names = new Map();
                for (const model of models) {
                    if (typeof model.name === 'string' && model.name.length > 0)
                        names.set(model.id, model.name);
                }
                this.modelNames.set(provider, names);
            }
            catch {
                // Fall back to the raw model id for this provider.
            }
        })();
        this.pendingModels.set(provider, loading);
        void loading.finally(() => { this.pendingModels.delete(provider); });
        return loading;
    }
}
