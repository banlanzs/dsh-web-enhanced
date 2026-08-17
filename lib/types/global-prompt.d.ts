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
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
/** Global prompt section name, unique across every prompt registration. */
export declare const GLOBAL_PROMPT_SECTION = "web-enhanced:global-prompt";
/**
 * Render order of the section: after the deployment persona (`0`) and before
 * tool guidance (`100`–`199`), so it reads as standing project instructions.
 */
export declare const GLOBAL_PROMPT_ORDER = 50;
/** Settings-namespace shape (schema defaults make both fields optional to write). */
export interface GlobalPromptSettingsValue {
    readonly enabled: boolean;
    readonly text: string;
}
/** Schema of the `dsh-web-enhanced-global-prompt` settings namespace. */
export declare const GlobalPromptSettingsSchema: z<GlobalPromptSettingsValue>;
/** Settings scope face this module needs, structurally. */
export interface GlobalPromptSettingsScopeFace {
    get(): unknown;
}
/** Settings provider face, structurally (see `@deepseek-ai/dsh-settings`). */
export interface GlobalPromptSettingsServiceFace {
    register(ns: unknown, schema: unknown, options?: {
        readonly base?: unknown;
        readonly applies?: string;
    }): GlobalPromptSettingsScopeFace;
}
/** Prompt registry face this module needs, structurally. */
export interface SystemPromptSectionFace {
    section(section: {
        readonly name: string;
        readonly order: number;
        readonly text: string | (() => string);
    }): () => void;
}
/**
 * The effective section text for one resolved settings value. Disabled or
 * whitespace-only values contribute nothing, and the registry drops empty
 * sections at render.
 * @param value - resolved namespace value (schema defaults included).
 * @returns the exact configured text, or `''` when inactive.
 */
export declare function globalPromptTextOf(value: unknown): string;
/**
 * Register the settings namespace and the global prompt section.
 * @param ctx - the plugin's host context.
 */
export declare function applyGlobalPrompt(ctx: Context): void;
