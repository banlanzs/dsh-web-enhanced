/**
 * Structural service faces shared by the gateway and every domain service.
 *
 * The host services these describe are the host's own dependencies, not this
 * plugin's: each face is declared structurally here (rather than imported)
 * and read through the untyped store accessor, so a deployment composed
 * without one still mounts the rest of the plugin.
 * @module dsh-web-enhanced/src/faces
 */
import type { Context } from '@deepseek-ai/cordis';
import type { VisionStatusView } from './types.ts';
/**
 * The provider directory face, structurally.
 *
 * Declared locally rather than imported: `dsh-llm` is the host's dependency,
 * and the gateway only needs to know where a route keeps its settings.
 */
export interface LlmDirectoryFace {
    listConfigurableProviders(): ReadonlyArray<{
        readonly provider: string;
        readonly settingsNs: string;
        readonly settingsPath: readonly string[];
        /** True when the route is hand-declared rather than a built-in catalog entry. */
        readonly declared?: boolean;
    }>;
    listProviders(): ReadonlyArray<{
        readonly id: string;
    }>;
}
/** The settings read face, structurally (see {@link LlmDirectoryFace}). */
export interface SettingsReadFace {
    get(ns: never): unknown;
}
/** The settings write face the config remotes use, structurally. */
export interface SettingsVisionFace {
    get(ns: unknown): unknown;
    describe(options?: {
        readonly redactSecrets?: boolean;
    }): ReadonlyArray<{
        readonly ns: string;
        readonly revision: number;
    }>;
    update(ns: unknown, patch: object, expectedRevision?: number): Promise<void>;
    readonly writable: boolean;
}
/** The provider/model directory face the vision config picker reads. */
export interface LlmVisionDirectoryFace {
    listProviders(): ReadonlyArray<{
        readonly id: string;
        readonly name?: string;
    }>;
    listModels(provider: string): Promise<ReadonlyArray<{
        readonly id: string;
        readonly name?: string;
        readonly inputModalities?: readonly string[];
    }>>;
}
/** The vision integration service face the status remote reads, structurally. */
export interface VisionIntegrationFace {
    status(): Promise<VisionStatusView>;
}
/**
 * The settings provider the config remotes read and write.
 *
 * Read uninjected: a deployment that composes no settings service still gets
 * a working gateway that reports `*-settings-unavailable` per remote.
 * @param ctx - the owning context.
 * @returns the settings service, or undefined when not composed.
 */
export declare function settingsFace(ctx: Context): SettingsVisionFace | undefined;
