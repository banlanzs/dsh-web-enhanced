/**
 * Plugins domain service: the profile's plugin inventory and its mutations.
 *
 * The gateway delegates its plugin* methods here; this module owns the
 * profile-directory resolution cache, the lazy pnpm runner, and the plugins
 * slice of the plugin config. A deployment loaded from outside a profile
 * answers `no-profile` rather than an empty list — those are different facts,
 * and an empty list would invite a removal that cannot work.
 * @module dsh-web-enhanced/src/plugins-gateway
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import type { PluginListRequest, PluginListResult, PluginMutateRequest, PluginMutateResult } from './types.ts';
/** The plugins slice of the plugin config (user input; defaults bind later). */
export interface PluginsConfigInput {
    pluginOpTimeoutMs?: number;
    /**
     * Where the profile lives. Located by walking up from this module by
     * default; naming it explicitly is for a deployment whose profile is not an
     * ancestor of the loaded plugin.
     */
    profileDir?: string;
}
/** The plugins config fragment, as the plugin schema assembles it. */
export declare const pluginsConfigFragment: z<Required<PluginsConfigInput>>;
/** Field defaults applied when the plugins domain is assembled directly. */
export declare function resolvePluginsConfig(config: Partial<PluginsConfigInput>): Required<PluginsConfigInput>;
/** The plugin-management capabilities, as the gateway consumes them. */
export interface PluginsDomainFace {
    list(request: PluginListRequest): Promise<PluginListResult>;
    remove(request: PluginMutateRequest): Promise<PluginMutateResult>;
    update(request: PluginMutateRequest): Promise<PluginMutateResult>;
    /** The resolved profile directory, or undefined outside a profile. */
    profileDir(): Promise<string | undefined>;
}
/** What the plugins domain needs from the rest of the plugin. */
export interface PluginsDomainDeps {
    readonly ctx: Context;
    readonly config: Required<PluginsConfigInput>;
    /** Cap on captured pnpm output, shared with the other subprocess callers. */
    readonly outputMaxBytes: number;
}
/**
 * Assemble the plugins domain.
 * @param deps - context, config, and the shared output cap.
 * @returns the plugin-management capabilities.
 */
export declare function createPluginsDomain(deps: PluginsDomainDeps): PluginsDomainFace;
