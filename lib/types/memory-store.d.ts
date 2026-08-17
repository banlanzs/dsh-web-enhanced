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
/**
 * Split one natural-language query into searchable terms.
 *
 * Latin/digit runs behave like ordinary whitespace-separated words. A run
 * containing CJK characters is split into overlapping character bigrams
 * (`发布前检查` → `发布` `布前` `前检` `检查`), because Chinese has no word
 * boundaries and a whole-sentence term would never match a stored summary.
 * @param query - the raw question text.
 * @returns unique lowercase terms, longest-first-independent insertion order.
 */
export declare function memorySearchTerms(query: string): readonly string[];
/** How many records one recall returns when the caller names no limit. */
export declare const DEFAULT_SEARCH_LIMIT = 3;
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
     *
     * The summary is truncated to the length the durable schema accepts: the
     * tool asks the model for at most {@link SUMMARY_MAX_CHARS} characters, and
     * a model that overshoots must not fail the save at the storage boundary.
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
     * List the memories VISIBLE to one workspace, most recently updated first.
     *
     * Visibility matches {@link MemoryStore.search}: the workspace's own records
     * plus the global pool, so the standing prompt and the recall agree on which
     * memories exist.
     * @param workspaceId - the workspace to list for; `null` lists the global pool only.
     * @returns the visible records sorted by updatedAt descending.
     */
    visibleTo(workspaceId: WorkspaceId | null): Promise<readonly MemoryRecord[]>;
    /**
     * Search the memories visible to one workspace, most relevant first.
     *
     * The candidate set is the workspace's own records PLUS the global pool
     * (`workspaceId === null`): a memory saved while no workspace matched the
     * session cwd would otherwise be unreachable forever. Project-scoped hits
     * outrank cross-project ones at equal relevance.
     * @param workspaceId - the workspace to search; `null` searches the global pool only.
     * @param query - a natural-language question; Latin runs stay whole words,
     *   CJK runs become overlapping bigrams so a Chinese sentence can match
     *   stored summaries without requiring the exact full phrase.
     * @param limit - how many records to return at most.
     * @returns the top records by relevance, most relevant first.
     */
    search(workspaceId: WorkspaceId | null, query: string, limit?: number): Promise<readonly MemoryRecord[]>;
    /**
     * Enforce the per-workspace record cap: delete the oldest records while
     * the workspace's count exceeds it.
     * @param domain - the opened memory domain.
     * @param workspaceId - the workspace whose records are capped.
     */
    private enforceWorkspaceCap;
}
