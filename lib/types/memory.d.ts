/**
 * Memory orchestrator: settings-namespace registration, the standing
 * `systemPrompt` section, the `save_memory` tool, and the recall hook that
 * injects matching memories as user-role context ahead of each step.
 *
 * All host services are read structurally (`ctx.get('...' as never, false)`).
 * A deployment that composes neither the settings service, the system-prompt
 * registry, the workspace registry, nor the tool registry still mounts the
 * plugin and the feature simply stays inert.
 *
 * The pre-step listener is a Cordis waterfall: it MUST call `next()` first
 * and return its resolved decision, otherwise downstream listeners never run.
 * After `next()`, when the model is about to enter the step, the hook walks
 * the session's derived messages, locates the latest user-role text query,
 * searches the memory store for matches, and injects a user message carrying
 * the hits so the model can recall them without a tool call.
 * @module dsh-web-enhanced/src/memory
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
/** Settings namespace owning the memory feature switch. */
export declare const MEMORY_SETTINGS_NS = "dsh-web-enhanced-memory";
/** Standing prompt section name, unique across every prompt registration. */
export declare const MEMORY_SECTION = "web-enhanced:memory";
/**
 * Render order of the section: after the deployment persona (`0`) and the
 * global prompt (`50`), before tool guidance (`100`–`199`), so it reads as
 * project standing instructions.
 */
export declare const MEMORY_ORDER = 60;
/** Shape of the `dsh-web-enhanced-memory` settings value. */
export interface MemorySettingsValue {
    readonly enabled: boolean;
}
/** Schema of the `dsh-web-enhanced-memory` settings namespace. */
export declare const MemorySettingsSchema: z<MemorySettingsValue>;
/**
 * Flatten one message content value into queryable text.
 *
 * The wire message shape carries content as an array of blocks
 * (`[{ type: 'text', text: … }, …]`), not a raw string; only text blocks
 * contribute. A raw string is accepted for tests and minimal harnesses.
 * @param content - the message's content field.
 * @returns joined text, or `''`.
 */
export declare function textOfMessageContent(content: unknown): string;
/**
 * Mount the memory orchestrator: open the store, register the settings
 * namespace, install the standing prompt section, register the `save_memory`
 * tool, and wire the recall hook.
 * @param ctx - the plugin's host context.
 * @param domain - optional pre-opened web-enhanced storage domain.
 */
export declare function applyMemory(ctx: Context, domain?: Promise<any>): void;
