/**
 * Memory store: durable CRUD over the `memories` table of the web-enhanced
 * storage domain. Saves deduplicate by workspace + summary within one day,
 * and every workspace is capped at a fixed record count. The gateway opens
 * the domain once (TaskBoard shares the same `web_enhanced` name); a
 * standalone spec covers tests that mount MemoryStore without TaskBoard.
 * @module dsh-web-enhanced/src/memory-store
 */
import { randomUUID } from 'node:crypto';
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain';
import { memoryRecordSchema } from "./schemas.js";
/** Brand a raw id as a memory id at the owning boundary. */
function memoryId(raw) {
    return raw;
}
/** CJK-script characters that participate in bigram tokenization. */
const CJK = /\p{Script=Han}/u;
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
export function memorySearchTerms(query) {
    const terms = [];
    for (const raw of query.toLowerCase().split(/\s+/)) {
        if (raw === '')
            continue;
        // Latin/digit chunks stay whole words even inside a mixed CJK run.
        for (const match of raw.match(/[a-z0-9]+/g) ?? [])
            terms.push(match);
        const cjk = raw.replace(/[^\p{Script=Han}]/gu, '');
        const chars = [...cjk];
        if (chars.length === 1) {
            terms.push(chars[0]);
        }
        else {
            for (let index = 0; index + 1 < chars.length; index += 1) {
                terms.push(chars[index] + chars[index + 1]);
            }
        }
    }
    return [...new Set(terms)];
}
/** Per-workspace record cap; the oldest records fall past it. */
const WORKSPACE_MEMORY_CAP = 200;
/** The web-enhanced memory domain: one validated memories table. */
const memoryDomainSpec = defineDomain({
    // The unit-name grammar allows letters, digits, and underscores only.
    name: 'web_enhanced',
    version: 2,
    tables: {
        // The record schema validates at the durable boundary; MemoryId is a
        // compile-time brand over the same string field.
        memories: domainTable(memoryRecordSchema),
    },
});
/**
 * The memory store: durable CRUD and search over the memories table.
 * One instance per gateway; the storage domain opens once (sharing the
 * `web_enhanced` name with TaskBoard), and saves keep every workspace
 * within the record cap.
 */
export class MemoryStore {
    ready;
    /**
     * @param ctx - owning context with the injected storageDomain service.
     * @param domain - an already-opened web-enhanced domain; when omitted the
     *   store opens its own standalone domain (unit tests without TaskBoard).
     */
    constructor(ctx, domain) {
        this.ready = domain !== undefined
            ? domain
            : ctx.get('storageDomain').open(memoryDomainSpec);
    }
    /**
     * Save one memory record. A record with the same workspace and summary
     * updated within the last day is refreshed in place instead of creating a
     * new one; otherwise a new record is written and the workspace cap applied.
     * @param input - the memory to save.
     * @returns the saved record id and whether an existing record was updated.
     */
    async save(input) {
        const domain = await this.ready;
        const table = domain.table('memories');
        const now = Date.now();
        const dayAgo = now - 24 * 60 * 60 * 1000;
        for (const [id, record] of [...table.entries()]) {
            if (record.workspaceId === input.workspaceId && record.summary === input.summary && record.updatedAt > dayAgo) {
                await table.update(id, current => ({ ...current, body: input.body, updatedAt: now }));
                return { ok: true, id, deduplicated: true };
            }
        }
        const id = memoryId(`memory-${randomUUID()}`);
        const record = {
            id,
            workspaceId: input.workspaceId,
            kind: input.kind,
            summary: input.summary,
            body: input.body,
            sourceSessionId: input.sourceSessionId,
            createdAt: now,
            updatedAt: now,
        };
        await table.put(id, record);
        await this.enforceWorkspaceCap(domain, input.workspaceId);
        return { ok: true, id, deduplicated: false };
    }
    /**
     * List every memory record, oldest first, optionally narrowed to one
     * workspace.
     * @param workspaceId - the workspace to keep; omitted lists all workspaces.
     * @returns the matching records in insertion order.
     */
    async list(workspaceId) {
        const domain = await this.ready;
        return [...domain.table('memories').entries()]
            .map(([, record]) => record)
            .filter(record => workspaceId === undefined || record.workspaceId === workspaceId);
    }
    /**
     * Remove one memory record.
     * @param id - the record to remove.
     * @returns whether a record was removed.
     */
    async delete(id) {
        const domain = await this.ready;
        return await domain.table('memories').delete(id);
    }
    /**
     * List one workspace's memories, most recently updated first.
     * @param workspaceId - the workspace to list.
     * @returns the matching records sorted by updatedAt descending.
     */
    async byWorkspace(workspaceId) {
        const records = await this.list(workspaceId);
        return [...records].sort((left, right) => right.updatedAt - left.updatedAt);
    }
    /**
     * Search one workspace's memories by terms in their summary or body.
     * @param workspaceId - the workspace to search.
     * @param query - a natural-language question; Latin runs stay whole words,
     *   CJK runs become overlapping bigrams so a Chinese sentence can match
     *   stored summaries without requiring the exact full phrase.
     * @returns the top three records by matching term count, most relevant first.
     */
    async search(workspaceId, query) {
        const terms = memorySearchTerms(query);
        if (terms.length === 0)
            return [];
        const records = await this.list(workspaceId);
        return [...records]
            .map(record => {
            const haystack = `${record.summary} ${record.body}`.toLowerCase();
            const hits = terms.filter(term => haystack.includes(term)).length;
            return { record, hits };
        })
            .filter(candidate => candidate.hits > 0)
            .sort((left, right) => right.hits - left.hits)
            .slice(0, 3)
            .map(candidate => candidate.record);
    }
    /**
     * Enforce the per-workspace record cap: delete the oldest records while
     * the workspace's count exceeds it.
     * @param domain - the opened memory domain.
     * @param workspaceId - the workspace whose records are capped.
     */
    async enforceWorkspaceCap(domain, workspaceId) {
        const records = [...domain.table('memories').entries()]
            .map(([, record]) => record)
            .filter(record => record.workspaceId === workspaceId)
            .sort((left, right) => left.updatedAt - right.updatedAt);
        let excess = records.length - WORKSPACE_MEMORY_CAP;
        for (const record of records) {
            if (excess <= 0)
                break;
            await domain.table('memories').delete(record.id);
            excess -= 1;
        }
    }
}
