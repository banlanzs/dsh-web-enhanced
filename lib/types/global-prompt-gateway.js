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
import { errorOf } from "./error.js";
import { settingsFace } from "./faces.js";
import { GLOBAL_PROMPT_MAX_CHARS, GLOBAL_PROMPT_SETTINGS_NS } from "./types.js";
/**
 * Assemble the global-prompt domain.
 * @param ctx - the owning context; the settings service is read per call.
 * @returns the global-prompt capabilities.
 */
export function createGlobalPromptDomain(ctx) {
    return {
        async get() {
            try {
                const settings = settingsFace(ctx);
                if (settings === undefined) {
                    return { error: { code: 'global-prompt-settings-unavailable', message: 'the settings service is not mounted in this deployment' } };
                }
                const raw = settings.get(GLOBAL_PROMPT_SETTINGS_NS);
                if (raw === undefined || typeof raw !== 'object') {
                    return { error: { code: 'global-prompt-settings-unmanaged', message: `settings namespace '${GLOBAL_PROMPT_SETTINGS_NS}' is not registered` } };
                }
                const descriptor = settings.describe().find(entry => entry.ns === GLOBAL_PROMPT_SETTINGS_NS);
                const view = {
                    enabled: raw.enabled === true,
                    text: typeof raw.text === 'string' ? raw.text : '',
                    revision: descriptor?.revision ?? null,
                    writable: settings.writable,
                };
                return view;
            }
            catch (error) {
                return { error: errorOf(error, 'global-prompt-config') };
            }
        },
        /**
         * Save the two global-prompt fields into the settings namespace. The
         * registered section text is read per assembly, so the next model request
         * uses the saved value without a restart; `expectedRevision` gives the save
         * CAS semantics.
         */
        async set(request) {
            try {
                if (typeof request.enabled !== 'boolean' || typeof request.text !== 'string') {
                    return { error: { code: 'global-prompt-invalid', message: 'enabled must be a boolean and text must be a string' } };
                }
                if (request.text.length > GLOBAL_PROMPT_MAX_CHARS) {
                    return { error: { code: 'global-prompt-too-long', message: `text exceeds the ${String(GLOBAL_PROMPT_MAX_CHARS)}-character limit` } };
                }
                const settings = settingsFace(ctx);
                if (settings === undefined) {
                    return { error: { code: 'global-prompt-settings-unavailable', message: 'the settings service is not mounted in this deployment' } };
                }
                if (!settings.writable) {
                    return { error: { code: 'global-prompt-settings-readonly', message: 'the settings provider is read-only' } };
                }
                const raw = settings.get(GLOBAL_PROMPT_SETTINGS_NS);
                if (raw === undefined) {
                    return { error: { code: 'global-prompt-settings-unmanaged', message: `settings namespace '${GLOBAL_PROMPT_SETTINGS_NS}' is not registered` } };
                }
                await settings.update(GLOBAL_PROMPT_SETTINGS_NS, {
                    enabled: request.enabled,
                    text: request.text,
                }, request.expectedRevision);
                const revision = settings.describe().find(entry => entry.ns === GLOBAL_PROMPT_SETTINGS_NS)?.revision ?? 0;
                return { ok: true, revision };
            }
            catch (error) {
                const conflict = error.code === 'SETTINGS_CONFLICT';
                return { error: errorOf(error, conflict ? 'global-prompt-config-conflict' : 'global-prompt-config-save') };
            }
        },
    };
}
