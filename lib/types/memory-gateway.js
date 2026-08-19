/**
 * Memory domain service: the record list, deletions, and the feature switch.
 *
 * The gateway delegates its memory* methods here. The settings namespace is
 * served through this plugin's own gateway for the same reason as the global
 * prompt: a plugin-owned namespace is not on the api-proxy settings
 * allowlist. The recall/standing-section half lives in `./memory.ts` and the
 * durable store in `./memory-store.ts` — this is only their wire face.
 * @module dsh-web-enhanced/src/memory-gateway
 */
import { errorOf } from "./error.js";
import { settingsFace } from "./faces.js";
import { MEMORY_SETTINGS_NS } from "./types.js";
import { workspaceNotFound } from "./workspace-service.js";
/**
 * Assemble the memory domain.
 * @param deps - context, workspace resolution, and the durable store.
 * @returns the memory capabilities.
 */
export function createMemoryDomain(deps) {
    return {
        /** List memory records, optionally narrowed to one workspace. */
        async list(request) {
            try {
                const workspaceId = request.workspaceId === undefined || request.workspaceId === null
                    ? undefined
                    : deps.workspace.resolveId(request.workspaceId);
                if (request.workspaceId !== undefined && request.workspaceId !== null && workspaceId === null) {
                    return { error: workspaceNotFound(request.workspaceId) };
                }
                const memories = await deps.store.list(workspaceId);
                return { memories };
            }
            catch (error) {
                return { error: errorOf(error, 'memory-list') };
            }
        },
        /** Delete one memory record by id. */
        async remove(request) {
            try {
                const id = request.id;
                if (id === '')
                    return { error: { code: 'invalid-id', message: 'memory id must not be empty' } };
                const removed = await deps.store.delete(id);
                return { removed };
            }
            catch (error) {
                return { error: errorOf(error, 'memory-delete') };
            }
        },
        async configGet() {
            try {
                const settings = settingsFace(deps.ctx);
                if (settings === undefined) {
                    return { error: { code: 'memory-settings-unavailable', message: 'the settings service is not mounted in this deployment' } };
                }
                const raw = settings.get(MEMORY_SETTINGS_NS);
                if (raw === undefined || typeof raw !== 'object') {
                    return { error: { code: 'memory-settings-unmanaged', message: `settings namespace '${MEMORY_SETTINGS_NS}' is not registered` } };
                }
                const descriptor = settings.describe().find(entry => entry.ns === MEMORY_SETTINGS_NS);
                return {
                    enabled: raw.enabled === true,
                    revision: descriptor?.revision ?? null,
                    writable: settings.writable,
                };
            }
            catch (error) {
                return { error: errorOf(error, 'memory-config') };
            }
        },
        /**
         * Save the memory feature switch. The standing section and the recall hook
         * both read the resolved value per step, so a successful save reaches the
         * next model request without a restart.
         */
        async configSet(request) {
            try {
                if (typeof request.enabled !== 'boolean') {
                    return { error: { code: 'memory-config-invalid', message: 'enabled must be a boolean' } };
                }
                const settings = settingsFace(deps.ctx);
                if (settings === undefined) {
                    return { error: { code: 'memory-settings-unavailable', message: 'the settings service is not mounted in this deployment' } };
                }
                if (!settings.writable) {
                    return { error: { code: 'memory-settings-readonly', message: 'the settings provider is read-only' } };
                }
                if (settings.get(MEMORY_SETTINGS_NS) === undefined) {
                    return { error: { code: 'memory-settings-unmanaged', message: `settings namespace '${MEMORY_SETTINGS_NS}' is not registered` } };
                }
                await settings.update(MEMORY_SETTINGS_NS, { enabled: request.enabled }, request.expectedRevision);
                const revision = settings.describe().find(entry => entry.ns === MEMORY_SETTINGS_NS)?.revision ?? 0;
                return { ok: true, revision };
            }
            catch (error) {
                const conflict = error.code === 'SETTINGS_CONFLICT';
                return { error: errorOf(error, conflict ? 'memory-config-conflict' : 'memory-config-save') };
            }
        },
    };
}
