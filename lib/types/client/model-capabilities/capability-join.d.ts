/**
 * Pure provider/model joins behind the Model Capabilities page: which
 * directory entries belong on the page and what override candidates a
 * provider offers. Kept separate from the snapshot store so node-env tests
 * can exercise the decisions without loading the browser runtime module.
 * @module dsh-web-enhanced/src/client/model-capabilities/capability-join
 */
import type { ConfigurableProviderView, ModelProviderGroup, SettingsNamespaceView } from '@deepseek-ai/dsh-api-remotes/client';
/** One model inside a live provider group (`llm.models`). */
export type CatalogModel = ModelProviderGroup['models'][number];
/**
 * Whether a directory entry belongs on the capabilities page. DeepSeek always
 * does (its fields live at the section root); a pi-ai route is shown once it
 * is configured, active, or hand-declared — dormant catalog providers stay on
 * the ordinary Models page, where their first profile belongs.
 * @param entry - one configurable-provider directory entry.
 * @param namespace - its settings namespace view, when the host has one.
 * @returns whether the page renders a card for the entry.
 */
export declare function visibleCapabilityProvider(entry: ConfigurableProviderView, namespace: SettingsNamespaceView | undefined): boolean;
/** Model ids and names one provider currently serves, from wire or settings. */
export interface ModelOption {
    /** Provider-owned model id. */
    id: string;
    /** Display name when the directory supplies one. */
    name?: string;
}
/**
 * Effective model options for a provider, preferring the live catalog and
 * falling back to the settings layers so a dormant/declared route still has
 * candidates.
 * @param namespace - the provider's settings namespace view.
 * @param path - the provider profile path.
 * @param catalog - live catalog models for the route (possibly empty).
 * @returns deduplicated options in display order.
 */
export declare function modelOptionsOf(namespace: SettingsNamespaceView, path: readonly string[], catalog: readonly CatalogModel[]): readonly ModelOption[];
