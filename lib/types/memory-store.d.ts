/**
 * Memory store: durable CRUD over the `memories` table of the web-enhanced
 * storage domain. Saves deduplicate by workspace + summary within one day,
 * and every workspace is capped at a fixed record count. The gateway opens
 * the domain once (TaskBoard shares the same `web_enhanced` name); a
 * standalone spec covers tests that mount MemoryStore without TaskBoard.
 * @module dsh-web-enhanced/src/memory-store
 */
import type { Context } from '@deepseek-ai/cordis';
import type { Domain } from '@deepseek-ai/dsh-storage-domain';
import type { MemoryId, MemoryKind, MemoryRecord, WorkspaceId } from './types.ts';
/** One memory save request. */
export interface MemorySaveInput {
    readonly workspaceId: WorkspaceId | null;
    readonly kind: MemoryKind;
    readonly summary: string;
    readonly body: string;
    readonly sourceSessionId: string | null;
}
/** Outcome of one memory save. */
export interface MemorySaveResult {
    readonly ok: boolean;
    readonly id: MemoryId;
    /** True when an existing record was updated instead of creating a new one. */
    readonly deduplicated: boolean;
}
/**
 * The memory store: durable CRUD and search over the memories table.
 * One instance per gateway; the storage domain opens once (sharing the
 * `web_enhanced` name with TaskBoard), and saves keep every workspace
 * within the record cap.
 */
export declare class MemoryStore {
    private readonly ready;
    /**
     * @param ctx - owning context with the injected storageDomain service.
     * @param domain - an already-opened web-enhanced domain; when omitted the
     *   store opens its own standalone domain (unit tests without TaskBoard).
     */
    constructor(ctx: Context, domain?: Promise<Domain<any>>);
    /**
     * Save one memory record. A record with the same workspace and summary
     * updated within the last day is refreshed in place instead of creating a
     * new one; otherwise a new record is written and the workspace cap applied.
     * @param input - the memory to save.
     * @returns the saved record id and whether an existing record was updated.
     */
    save(input: MemorySaveInput): Promise<MemorySaveResult>;
    /**
     * List every memory record, oldest first, optionally narrowed to one
     * workspace.
     * @param workspaceId - the workspace to keep; omitted lists all workspaces.
     * @returns the matching records in insertion order.
     */
    list(workspaceId?: WorkspaceId | null): Promise<readonly MemoryRecord[]>;
    /**
     * Remove one memory record.
     * @param id - the record to remove.
     * @returns whether a record was removed.
     */
    delete(id: MemoryId): Promise<boolean>;
    /**
     * List one workspace's memories, most recently updated first.
     * @param workspaceId - the workspace to list.
     * @returns the matching records sorted by updatedAt descending.
     */
    byWorkspace(workspaceId: WorkspaceId | null): Promise<readonly MemoryRecord[]>;
    /**
     * Search one workspace's memories by terms in their summary or body.
     * @param workspaceId - the workspace to search.
     * @param query - whitespace-separated terms; empty matches nothing.
     * @returns the top three records by matching term count, most relevant first.
     */
    search(workspaceId: WorkspaceId | null, query: string): Promise<readonly MemoryRecord[]>;
    /**
     * Enforce the per-workspace record cap: delete the oldest records while
     * the workspace's count exceeds it.
     * @param domain - the opened memory domain.
     * @param workspaceId - the workspace whose records are capped.
     */
    private enforceWorkspaceCap;
}
