/**
 * dsh-web-enhanced plugin entry: mounts the web-enhanced gateway (task
 * board with cron scheduling, git, files, Office preview, and balance) as
 * one Typert namespace consumed by the browser half.
 * @module dsh-web-enhanced
 */
import type { Context } from '@deepseek-ai/cordis';
import { WebEnhancedGateway, Config } from './gateway.ts';
export { WebEnhancedGateway, Config };
export { applyGlobalPrompt, GLOBAL_PROMPT_ORDER, GLOBAL_PROMPT_SECTION, GlobalPromptSettingsSchema, globalPromptTextOf, } from './global-prompt.ts';
export type { GlobalPromptSettingsValue } from './global-prompt.ts';
export { VisionInterceptor, VisionTranscriber, VISION_SETTINGS_NS, VisionSettingsSchema } from './vision.ts';
export type { VisionConfigSource, VisionSettings, VisionSettingsScopeFace, VisionSettingsServiceFace, VisionSettingsValue, } from './vision.ts';
/** Cordis plugin name (the loader row references the package, this is the entry name). */
export declare const name = "web-enhanced";
/**
 * Core services the gateway and its scheduler require.
 *
 * `typert` is required for the descriptor registration below, not by the
 * gateway itself.
 */
export declare const inject: string[];
/**
 * Mount the gateway, its scheduler, and the strict Remote definitions.
 *
 * The descriptors are registered explicitly instead of relying on the
 * Gateway's SRC discovery. SRC mode reads the `@Remote` markers out of
 * dsh-typert-protocol's private module state, which is only shared when the
 * plugin and the host resolve that package to the same file — a globally
 * installed `dsh` CLI bundles its own copy while an installed plugin binds to
 * the profile's, so the markers never meet and the Gateway refuses (404s)
 * every endpoint. The `ctx.typert.local` registry is a Cordis service and does
 * not care how the specifier resolved.
 * @param ctx - owning context with the injected core services.
 * @param config - plugin config; defaults apply field-wise.
 * @throws when the host's Typert service exposes no registration method,
 * which would otherwise surface as every endpoint answering 404.
 */
export declare function apply(ctx: Context, config?: Config): void;
