/**
 * dsh-web-enhanced plugin entry: mounts the web-enhanced gateway (task
 * board with cron scheduling, git, files, Office preview, and balance) as
 * one Typert namespace consumed by the browser half.
 * @module dsh-web-enhanced
 */
import { WEB_ENHANCED_DESCRIPTORS, WEB_ENHANCED_PACKAGE } from "./descriptors.js";
import { WebEnhancedGateway, Config } from "./gateway.js";
import { VisionInterceptor } from "./vision.js";
import { applyGlobalPrompt } from "./global-prompt.js";
import { applyMemory } from "./memory.js";
export { WebEnhancedGateway, Config };
export { applyGlobalPrompt, GLOBAL_PROMPT_ORDER, GLOBAL_PROMPT_SECTION, GlobalPromptSettingsSchema, globalPromptTextOf, } from "./global-prompt.js";
export { VisionInterceptor, VisionTranscriber, VISION_SETTINGS_NS, VisionSettingsSchema } from "./vision.js";
export { applyMemory, MEMORY_ORDER, MEMORY_SECTION, MEMORY_SETTINGS_NS, MemorySettingsSchema } from "./memory.js";
/** Cordis plugin name (the loader row references the package, this is the entry name). */
export const name = 'web-enhanced';
/**
 * Core services the gateway and its scheduler require.
 *
 * `typert` is required for the descriptor registration below, not by the
 * gateway itself.
 */
export const inject = [
    'agents', 'sessions', 'agentDefaultModel', 'storageDomain', 'subprocess', 'workspaceRegistry',
    'typert',
];
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
export function apply(ctx, config = {}) {
    const registrar = ctx.typert;
    if (typeof registrar.register !== 'function') {
        throw new TypeError('dsh-web-enhanced: the host Typert service exposes no register() method, '
            + 'so the Remote definitions cannot be published and every endpoint would answer 404');
    }
    const register = registrar.register.bind(registrar);
    ctx.effect(() => register({
        package: WEB_ENHANCED_PACKAGE,
        face: 'host',
        schemas: [],
        model: { services: [], events: [], objects: [] },
        invocations: WEB_ENHANCED_DESCRIPTORS,
    }), 'web-enhanced: Remote definitions');
    applyGlobalPrompt(ctx);
    applyMemory(ctx);
    ctx.plugin(VisionInterceptor, config);
    ctx.plugin(WebEnhancedGateway, config);
}
