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
/** Longest summary the durable schema accepts; longer text is truncated. */
const SUMMARY_MAX_CHARS = 120;
/**
 * Relevance weight per classification. Durable guidance about the user and
 * how work should be done applies to almost any turn, while a pointer to an
 * external resource only matters when the turn is already about it.
 */
const KIND_WEIGHT = {
    user: 1.2,
    feedback: 1.15,
    project: 1,
    reference: 0.85,
};
/** A term found in the summary counts for more than one buried in the body. */
const SUMMARY_TERM_WEIGHT = 1.6;
/** At equal relevance a project-scoped memory outranks a cross-project one. */
const WORKSPACE_SCOPE_BONUS = 1.15;
/** How many records one recall returns when the caller names no limit. */
export const DEFAULT_SEARCH_LIMIT = 3;
/**
 * Distinct terms a record must carry before it is recalled at all.
 *
 * Two-character CJK bigrams are common enough (`什么`, `检查`, `可以`) that a
 * single one is noise, not a match; requiring two independent terms is what
 * keeps an unrelated memory out of every turn. A query too short to produce
 * two terms is matched on its only one, otherwise it could never recall.
 * @param termCount - how many distinct terms the query produced.
 * @returns the minimum number of distinct terms a record must match.
 */
function requiredHits(termCount) {
    return termCount <= 2 ? 1 : 2;
}
/**
 * Score one record against the query terms.
 *
 * The raw weight is normalized by the query's term count so a long question
 * and a short one produce comparable scores, then weighted by classification
 * and scope. Returns `null` when the record carries too few distinct terms.
 * @param record - the candidate memory.
 * @param terms - the query's distinct terms.
 * @param workspaceId - the workspace the search is scoped to.
 * @returns the scored candidate, or `null` when it is below the hit floor.
 */
function scoreRecord(record, terms, workspaceId) {
    const summary = record.summary.toLowerCase();
    const body = record.body.toLowerCase();
    let hits = 0;
    let raw = 0;
    for (const term of terms) {
        if (summary.includes(term)) {
            hits += 1;
            raw += SUMMARY_TERM_WEIGHT;
        }
        else if (body.includes(term)) {
            hits += 1;
            raw += 1;
        }
    }
    if (hits < requiredHits(terms.length))
        return null;
    const scope = record.workspaceId !== null && record.workspaceId === workspaceId
        ? WORKSPACE_SCOPE_BONUS
        : 1;
    return { record, score: (raw / terms.length) * KIND_WEIGHT[record.kind] * scope };
}
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
     *
     * The summary is truncated to the length the durable schema accepts: the
     * tool asks the model for at most {@link SUMMARY_MAX_CHARS} characters, and
     * a model that overshoots must not fail the save at the storage boundary.
     * @param input - the memory to save.
     * @returns the saved record id and whether an existing record was updated.
     */
    async save(input) {
        const domain = await this.ready;
        const table = domain.table('memories');
        const now = Date.now();
        const summary = input.summary.slice(0, SUMMARY_MAX_CHARS);
        const dayAgo = now - 24 * 60 * 60 * 1000;
        for (const [id, record] of [...table.entries()]) {
            if (record.workspaceId === input.workspaceId && record.summary === summary && record.updatedAt > dayAgo) {
                // The classification is refreshed with the body: a re-save that
                // reclassifies the same summary must not keep the stale kind, which
                // the recall weights and the panel's filter both read.
                await table.update(id, current => ({ ...current, kind: input.kind, body: input.body, updatedAt: now }));
                return { ok: true, id, deduplicated: true };
            }
        }
        const id = memoryId(`memory-${randomUUID()}`);
        const record = {
            id,
            workspaceId: input.workspaceId,
            kind: input.kind,
            summary,
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
     * List the memories VISIBLE to one workspace, most recently updated first.
     *
     * Visibility matches {@link MemoryStore.search}: the workspace's own records
     * plus the global pool, so the standing prompt and the recall agree on which
     * memories exist.
     * @param workspaceId - the workspace to list for; `null` lists the global pool only.
     * @returns the visible records sorted by updatedAt descending.
     */
    async visibleTo(workspaceId) {
        const records = await this.list();
        return records
            .filter(record => record.workspaceId === null || record.workspaceId === workspaceId)
            // Reversed before the stable sort so records sharing one millisecond
            // come out newest-inserted first; plain insertion order would put the
            // OLDEST of a same-millisecond batch at the head of "most recent".
            .reverse()
            .sort((left, right) => right.updatedAt - left.updatedAt);
    }
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
    async search(workspaceId, query, limit = DEFAULT_SEARCH_LIMIT) {
        const terms = memorySearchTerms(query);
        if (terms.length === 0 || limit <= 0)
            return [];
        const records = await this.list();
        const scored = [];
        for (const record of records) {
            // The global pool is visible from every workspace; another workspace's
            // records are not.
            if (record.workspaceId !== null && record.workspaceId !== workspaceId)
                continue;
            const candidate = scoreRecord(record, terms, workspaceId);
            if (candidate !== null)
                scored.push(candidate);
        }
        return scored
            .sort((left, right) => right.score - left.score
            || right.record.updatedAt - left.record.updatedAt)
            .slice(0, limit)
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
