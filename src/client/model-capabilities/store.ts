/**
 * Snapshot store behind the Model Capabilities settings page. It joins three
 * wire facts, all already served by the host for the ordinary Models page:
 * the configurable-provider directory (`llm.providers`), the settings
 * namespaces (`settings.describe`), and the live model catalog (`llm.models`)
 * used only to offer override candidates. The host stays the single fact
 * source; every edit writes through `settings.mutate`.
 * @module dsh-web-enhanced/src/client/model-capabilities/store
 */

import type {
  ConfigurableProviderView, IApiClient, ModelCatalogFailure, ModelProviderGroup,
  SettingsNamespaceView,
} from '@deepseek-ai/dsh-api-remotes/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import { visibleCapabilityProvider } from './capability-join.ts'
import type { CatalogModel } from './capability-join.ts'

export { modelOptionsOf, visibleCapabilityProvider } from './capability-join.ts'
export type { CatalogModel, ModelOption } from './capability-join.ts'

/** Page snapshot. */
export interface CapabilitiesState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  /** Whole-load failure text; card-level write failures stay in the card. */
  error: string | null
  /** Whether the settings provider accepts writes. */
  writable: boolean
  /** Providers the page edits (DeepSeek + configured/active pi-ai routes). */
  providers: readonly ConfigurableProviderView[]
  /** Namespace views by ns, for the cards' schema/layers/revisions. */
  namespaces: ReadonlyMap<string, SettingsNamespaceView>
  /** Live model catalog by provider route, for override candidates. */
  modelsByProvider: ReadonlyMap<string, readonly CatalogModel[]>
  /** Provider-local model-catalog failures; the page still edits from settings. */
  modelFailures: readonly ModelCatalogFailure[]
}

/**
 * Refresh the page snapshot only after its first load: an unopened page must
 * not fetch on background invalidations.
 * @param controller - the page store.
 */
export function refreshIfLoaded(controller: CapabilitiesStore): void {
  if (controller.store.getSnapshot().status === 'idle') return
  void controller.load()
}

/** The Model Capabilities page controller (one per settings surface). */
export class CapabilitiesStore {
  /** The snapshot the section renders from. */
  readonly store: SnapshotStore<CapabilitiesState> = createSnapshotStore<CapabilitiesState>({
    status: 'idle',
    error: null,
    writable: false,
    providers: [],
    namespaces: new Map(),
    modelsByProvider: new Map(),
    modelFailures: [],
  })

  /** Latest load wins; an older response never overwrites a newer one. */
  private generation = 0

  /**
   * @param api - the wire face (settings and llm domains).
   */
  constructor(private readonly api: Pick<IApiClient, 'settings' | 'llm'>) {}

  /**
   * Refresh the whole page snapshot: providers, namespaces, and the model
   * catalog in parallel. A failure of either directory keeps the last good
   * rows and surfaces the error; a model-catalog failure alone degrades the
   * override picker rather than the page.
   * @returns nothing; the snapshot carries the outcome.
   */
  async load(): Promise<void> {
    const generation = ++this.generation
    this.store.update((s) => { s.status = 'loading'; s.error = null })
    let providers: ConfigurableProviderView[]
    let writable: boolean
    let views: SettingsNamespaceView[]
    let groups: ModelProviderGroup[] = []
    let modelFailures: ModelCatalogFailure[] = []
    try {
      const [providersResponse, settingsResponse, modelsResponse] = await Promise.all([
        this.api.llm.providers({}),
        this.api.settings.describe({}),
        this.api.llm.models({}),
      ])
      if (!providersResponse.result.ok) throw new Error(providersResponse.result.error.message)
      if (!settingsResponse.result.ok) throw new Error(settingsResponse.result.error.message)
      providers = providersResponse.result.value.providers
      writable = settingsResponse.result.value.writable
      views = settingsResponse.result.value.namespaces
      // The catalog is enrichment: a failed/absent listing must not blank the
      // cards, which can still name models from the settings layers.
      if (modelsResponse.result.ok) {
        groups = modelsResponse.result.value.groups
        modelFailures = modelsResponse.result.value.failures
      }
    } catch (error) {
      if (generation !== this.generation) return
      this.store.update((s) => {
        s.status = 'error'
        s.error = error instanceof Error ? error.message : String(error)
      })
      return
    }
    const namespaces = new Map(views.map(view => [view.ns, view]))
    const visible = providers.filter(entry =>
      visibleCapabilityProvider(entry, namespaces.get(entry.settingsNs)))
    const modelsByProvider = new Map(groups.map(group => [group.id, group.models]))
    if (generation !== this.generation) return
    this.store.update((s) => {
      s.status = 'ready'
      s.error = null
      s.writable = writable
      s.providers = visible
      s.namespaces = namespaces
      s.modelsByProvider = modelsByProvider
      s.modelFailures = modelFailures
    })
  }
}
