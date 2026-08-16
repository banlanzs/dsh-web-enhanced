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
    listProviders(): ReadonlyArray<{
        readonly id: string;
        readonly name?: string;
    }>;
    listModels(provider: string): Promise<ReadonlyArray<{
        readonly id: string;
        readonly name?: string;
    }>>;
}
/** One resolved display pair. */
export interface ModelRouteNamesView {
    readonly provider: string;
    readonly model: string;
    readonly providerName: string;
    readonly modelName: string;
}
/** Cached directory-name resolver (one per gateway). */
export declare class ModelRouteNames {
    private readonly llm;
    private readonly providerNames;
    private readonly modelNames;
    private readonly pendingModels;
    /**
     * @param llm - the host llm directory; undefined degrades to fallbacks.
     */
    constructor(llm: LlmNamesFace | undefined);
    /** Drop every cached directory name (an adapter update re-primes lazily). */
    clear(): void;
    /** Resolve both display names, falling back per field on any failure. */
    describe(provider: string, model: string): Promise<ModelRouteNamesView>;
    private providerName;
    private modelName;
    private loadProviders;
    private loadModels;
}
