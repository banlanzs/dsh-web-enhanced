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
import type { Context } from '@deepseek-ai/cordis';
import type { MemoryStore } from './memory-store.ts';
import type { MemoryConfigGetResult, MemoryConfigSaveRequest, MemoryConfigSetResult, MemoryDeleteRequest, MemoryDeleteResult, MemoryListRequest, MemoryListResult } from './types.ts';
import type { WorkspaceFace } from './workspace-service.ts';
/** The memory capabilities, as the gateway consumes them. */
export interface MemoryDomainFace {
    list(request: MemoryListRequest): Promise<MemoryListResult>;
    remove(request: MemoryDeleteRequest): Promise<MemoryDeleteResult>;
    configGet(): Promise<MemoryConfigGetResult>;
    configSet(request: MemoryConfigSaveRequest): Promise<MemoryConfigSetResult>;
}
/** What the memory domain needs from the rest of the plugin. */
export interface MemoryDomainDeps {
    readonly ctx: Context;
    readonly workspace: WorkspaceFace;
    /** The durable store, sharing the task board's storage domain. */
    readonly store: MemoryStore;
}
/**
 * Assemble the memory domain.
 * @param deps - context, workspace resolution, and the durable store.
 * @returns the memory capabilities.
 */
export declare function createMemoryDomain(deps: MemoryDomainDeps): MemoryDomainFace;
