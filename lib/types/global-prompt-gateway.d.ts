/**
 * Global-prompt domain service: the settings projection behind the panel.
 *
 * Served through this plugin's own Typert gateway rather than the host
 * settings RPCs: a plugin-owned namespace is not on the api-proxy settings
 * allowlist, so the browser `settings.describe` would never list it. The
 * assembly half (the registered prompt section) lives in
 * `./global-prompt.ts` — this is only its wire face.
 * @module dsh-web-enhanced/src/global-prompt-gateway
 */
import type { Context } from '@deepseek-ai/cordis';
import type { GlobalPromptGetResult, GlobalPromptSaveRequest, GlobalPromptSetResult } from './types.ts';
/** The global-prompt capabilities, as the gateway consumes them. */
export interface GlobalPromptDomainFace {
    get(): Promise<GlobalPromptGetResult>;
    set(request: GlobalPromptSaveRequest): Promise<GlobalPromptSetResult>;
}
/**
 * Assemble the global-prompt domain.
 * @param ctx - the owning context; the settings service is read per call.
 * @returns the global-prompt capabilities.
 */
export declare function createGlobalPromptDomain(ctx: Context): GlobalPromptDomainFace;
