/**
 * The model-route read: which provider a session's current selection uses.
 *
 * Resolved from `ctx.modelDirectories`, the per-session directory the model
 * selector itself renders from — the same fact source, so switching models in
 * the composer moves this the moment it moves there. Read UNINJECTED: the
 * selector plugin is optional, and a deployment without it must still get a
 * working balance line rather than a client entry that never starts.
 * @module dsh-web-enhanced/src/client/model-route
 */

import type { ModelRouteFace } from './contract.ts'

/** The per-session directory face this read needs, structurally. */
interface ModelDirectoriesFace {
  directoryFor(sessionId: never): {
    readonly store: {
      getSnapshot(): { readonly current: { readonly provider: string; readonly model: string } | null }
      subscribe(listener: () => void): () => void
    }
  }
}

/** How this module reaches the optional selector service. */
export interface ModelRouteDeps {
  /** Uninjected service lookup; `undefined` when the deployment has none. */
  readonly directories: () => ModelDirectoriesFace | undefined
}

/**
 * Build the model-route face.
 * @param deps - the optional directory service lookup.
 * @returns the face injected into every registration.
 */
export function createModelRoute(deps: ModelRouteDeps): ModelRouteFace {
  // `directoryFor` throws for a session with no client scope (one being torn
  // down, or an addressed subagent). A missing route is not an error here — it
  // only means "nothing contradicts the line" — so every lookup degrades.
  const storeOf = (sessionId: string): ReturnType<ModelDirectoriesFace['directoryFor']>['store'] | undefined => {
    try {
      return deps.directories()?.directoryFor(sessionId as never).store
    } catch {
      return undefined
    }
  }
  return {
    provider: sessionId => storeOf(sessionId)?.getSnapshot().current?.provider,
    model: sessionId => storeOf(sessionId)?.getSnapshot().current?.model,
    subscribe: (sessionId, listener) => storeOf(sessionId)?.subscribe(listener) ?? (() => {}),
  }
}
