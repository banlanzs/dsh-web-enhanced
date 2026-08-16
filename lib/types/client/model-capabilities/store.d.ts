/**
 * Snapshot store behind the Model Capabilities settings page. It joins three
 * wire facts, all already served by the host for the ordinary Models page:
 * the configurable-provider directory (`llm.providers`), the settings
 * namespaces (`settings.describe`), and the live model catalog (`llm.models`)
 * used only to offer override candidates. The host stays the single fact
 * source; every edit writes through `settings.mutate`.
 * @module dsh-web-enhanced/src/client/model-capabilities/store
 */
import type { ConfigurableProviderView, IApiClient, ModelCatalogFailure, SettingsNamespaceView } from '@deepseek-ai/dsh-api-remotes/client';
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { CatalogModel } from './capability-join.ts';
export { modelOptionsOf, visibleCapabilityProvider } from './capability-join.ts';
export type { CatalogModel, ModelOption } from './capability-join.ts';
/** Page snapshot. */
export interface CapabilitiesState {
    status: 'idle' | 'loading' | 'ready' | 'error';
    /** Whole-load failure text; card-level write failures stay in the card. */
    error: string | null;
    /** Whether the settings provider accepts writes. */
    writable: boolean;
    /** Providers the page edits (DeepSeek + configured/active pi-ai routes). */
    providers: readonly ConfigurableProviderView[];
    /** Namespace views by ns, for the cards' schema/layers/revisions. */
    namespaces: ReadonlyMap<string, SettingsNamespaceView>;
    /** Live model catalog by provider route, for override candidates. */
    modelsByProvider: ReadonlyMap<string, readonly CatalogModel[]>;
    /** Provider-local model-catalog failures; the page still edits from settings. */
    modelFailures: readonly ModelCatalogFailure[];
}
/**
 * Refresh the page snapshot only after its first load: an unopened page must
 * not fetch on background invalidations.
 * @param controller - the page store.
 */
export declare function refreshIfLoaded(controller: CapabilitiesStore): void;
/** The Model Capabilities page controller (one per settings surface). */
export declare class CapabilitiesStore {
    private readonly api;
    /** The snapshot the section renders from. */
    readonly store: SnapshotStore<CapabilitiesState>;
    /** Latest load wins; an older response never overwrites a newer one. */
    private generation;
    /**
     * @param api - the wire face (settings and llm domains).
     */
    constructor(api: Pick<IApiClient, 'settings' | 'llm'>);
    /**
     * Refresh the whole page snapshot: providers, namespaces, and the model
     * catalog in parallel. A failure of either directory keeps the last good
     * rows and surfaces the error; a model-catalog failure alone degrades the
     * override picker rather than the page.
     * @returns nothing; the snapshot carries the outcome.
     */
    load(): Promise<void>;
}
