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

import type { Context } from '@deepseek-ai/cordis'
import { errorOf } from './error.ts'
import { settingsFace } from './faces.ts'
import type { MemoryStore } from './memory-store.ts'
import { MEMORY_SETTINGS_NS } from './types.ts'
import type {
  MemoryConfigGetResult, MemoryConfigSaveRequest, MemoryConfigSetResult, MemoryDeleteRequest,
  MemoryDeleteResult, MemoryId, MemoryListRequest, MemoryListResult,
} from './types.ts'
import { workspaceNotFound } from './workspace-service.ts'
import type { WorkspaceFace } from './workspace-service.ts'

/** The memory capabilities, as the gateway consumes them. */
export interface MemoryDomainFace {
  list(request: MemoryListRequest): Promise<MemoryListResult>
  remove(request: MemoryDeleteRequest): Promise<MemoryDeleteResult>
  configGet(): Promise<MemoryConfigGetResult>
  configSet(request: MemoryConfigSaveRequest): Promise<MemoryConfigSetResult>
}

/** What the memory domain needs from the rest of the plugin. */
export interface MemoryDomainDeps {
  readonly ctx: Context
  readonly workspace: WorkspaceFace
  /** The durable store, sharing the task board's storage domain. */
  readonly store: MemoryStore
}

/**
 * Assemble the memory domain.
 * @param deps - context, workspace resolution, and the durable store.
 * @returns the memory capabilities.
 */
export function createMemoryDomain(deps: MemoryDomainDeps): MemoryDomainFace {
  return {
    /** List memory records, optionally narrowed to one workspace. */
    async list(request) {
      try {
        const workspaceId = request.workspaceId === undefined || request.workspaceId === null
          ? undefined
          : deps.workspace.resolveId(request.workspaceId)
        if (request.workspaceId !== undefined && request.workspaceId !== null && workspaceId === null) {
          return { error: workspaceNotFound(request.workspaceId) }
        }
        const memories = await deps.store.list(workspaceId)
        return { memories }
      } catch (error) {
        return { error: errorOf(error, 'memory-list') }
      }
    },

    /** Delete one memory record by id. */
    async remove(request) {
      try {
        const id = request.id
        if (id === '') return { error: { code: 'invalid-id', message: 'memory id must not be empty' } }
        const removed = await deps.store.delete(id as MemoryId)
        return { removed }
      } catch (error) {
        return { error: errorOf(error, 'memory-delete') }
      }
    },

    async configGet() {
      try {
        const settings = settingsFace(deps.ctx)
        if (settings === undefined) {
          return { error: { code: 'memory-settings-unavailable', message: 'the settings service is not mounted in this deployment' } }
        }
        const raw = settings.get(MEMORY_SETTINGS_NS as never) as { readonly enabled?: unknown } | undefined
        if (raw === undefined || typeof raw !== 'object') {
          return { error: { code: 'memory-settings-unmanaged', message: `settings namespace '${MEMORY_SETTINGS_NS}' is not registered` } }
        }
        const descriptor = settings.describe().find(entry => entry.ns === MEMORY_SETTINGS_NS)
        return {
          enabled: raw.enabled === true,
          revision: descriptor?.revision ?? null,
          writable: settings.writable,
        }
      } catch (error) {
        return { error: errorOf(error, 'memory-config') }
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
          return { error: { code: 'memory-config-invalid', message: 'enabled must be a boolean' } }
        }
        const settings = settingsFace(deps.ctx)
        if (settings === undefined) {
          return { error: { code: 'memory-settings-unavailable', message: 'the settings service is not mounted in this deployment' } }
        }
        if (!settings.writable) {
          return { error: { code: 'memory-settings-readonly', message: 'the settings provider is read-only' } }
        }
        if (settings.get(MEMORY_SETTINGS_NS as never) === undefined) {
          return { error: { code: 'memory-settings-unmanaged', message: `settings namespace '${MEMORY_SETTINGS_NS}' is not registered` } }
        }
        await settings.update(MEMORY_SETTINGS_NS as never, { enabled: request.enabled }, request.expectedRevision)
        const revision = settings.describe().find(entry => entry.ns === MEMORY_SETTINGS_NS)?.revision ?? 0
        return { ok: true, revision }
      } catch (error) {
        const conflict = (error as { code?: unknown }).code === 'SETTINGS_CONFLICT'
        return { error: errorOf(error, conflict ? 'memory-config-conflict' : 'memory-config-save') }
      }
    },
  }
}
