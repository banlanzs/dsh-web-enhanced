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
import type { ModelRouteFace } from './contract.ts';
/** The per-session directory face this read needs, structurally. */
interface ModelDirectoriesFace {
    directoryFor(sessionId: never): {
        readonly store: {
            getSnapshot(): {
                readonly current: {
                    readonly provider: string;
                } | null;
            };
            subscribe(listener: () => void): () => void;
        };
    };
}
/** How this module reaches the optional selector service. */
export interface ModelRouteDeps {
    /** Uninjected service lookup; `undefined` when the deployment has none. */
    readonly directories: () => ModelDirectoriesFace | undefined;
}
/**
 * Build the model-route face.
 * @param deps - the optional directory service lookup.
 * @returns the face injected into every registration.
 */
export declare function createModelRoute(deps: ModelRouteDeps): ModelRouteFace;
export {};
