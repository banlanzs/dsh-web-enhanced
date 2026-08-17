/**
 * User-editable global system prompt.
 *
 * The settings namespace (`dsh-web-enhanced-global-prompt`) carries one switch
 * and one text block. This host half registers that namespace and contributes
 * a single GLOBAL `systemPrompt` section whose text is read per assembly, so a
 * save reaches the next model request without a restart and applies to every
 * agent preset, session, and subagent — the global layer of the prompt
 * registry is always included in scoped assemblies.
 *
 * The section name deliberately does NOT reuse `deployment:persona`: that
 * global slot is already registered by the prompt registry itself, and the
 * per-preset replacement path (`@deepseek-ai/dsh-persona`) shadows it in the
 * agent scope. A plugin-owned extra section sits beside it instead.
 *
 * Both host services are read structurally and uninjected, matching the rest
 * of this plugin: a deployment that composes neither service still mounts the
 * gateway, and the feature simply stays inert.
 * @module dsh-web-enhanced/src/global-prompt
 */
import z from '@deepseek-ai/schemastery';
import { GLOBAL_PROMPT_SETTINGS_NS } from "./types.js";
/** Global prompt section name, unique across every prompt registration. */
export const GLOBAL_PROMPT_SECTION = 'web-enhanced:global-prompt';
/**
 * Render order of the section: after the deployment persona (`0`) and before
 * tool guidance (`100`–`199`), so it reads as standing project instructions.
 */
export const GLOBAL_PROMPT_ORDER = 50;
/** Schema of the `dsh-web-enhanced-global-prompt` settings namespace. */
export const GlobalPromptSettingsSchema = z.object({
    enabled: z.boolean().default(false),
    text: z.string().default(''),
});
/**
 * The effective section text for one resolved settings value. Disabled or
 * whitespace-only values contribute nothing, and the registry drops empty
 * sections at render.
 * @param value - resolved namespace value (schema defaults included).
 * @returns the exact configured text, or `''` when inactive.
 */
export function globalPromptTextOf(value) {
    if (typeof value !== 'object' || value === null)
        return '';
    const settings = value;
    if (settings.enabled !== true)
        return '';
    return typeof settings.text === 'string' && settings.text.trim() !== '' ? settings.text : '';
}
/**
 * Register the settings namespace and the global prompt section.
 * @param ctx - the plugin's host context.
 */
export function applyGlobalPrompt(ctx) {
    const settings = ctx.get('settings', false);
    if (settings === undefined || typeof settings.register !== 'function')
        return;
    let scope;
    try {
        scope = settings.register(GLOBAL_PROMPT_SETTINGS_NS, GlobalPromptSettingsSchema, {
            base: {},
            applies: 'live',
        });
    }
    catch {
        // A conflicting namespace registration must not keep the rest of the
        // plugin from booting; the feature is then simply absent.
        return;
    }
    const systemPrompt = ctx.get('systemPrompt', false);
    if (systemPrompt === undefined || typeof systemPrompt.section !== 'function')
        return;
    // The text provider reads the CURRENT resolved settings value on every
    // assembly, so an in-process or settings.yaml save applies immediately.
    ctx.effect(() => systemPrompt.section({
        name: GLOBAL_PROMPT_SECTION,
        order: GLOBAL_PROMPT_ORDER,
        text: () => globalPromptTextOf(scope.get()),
    }), 'dsh-web-enhanced: global prompt section');
}
