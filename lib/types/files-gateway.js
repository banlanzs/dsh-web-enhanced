/**
 * Files domain service: every fs remote of the web-enhanced gateway.
 *
 * The gateway delegates its fs* methods here; this module owns the limits
 * plumbing, the empty-query search cache the mention picker leans on, and
 * the files slice of the plugin config. Reads, writes, and previews stay
 * behind a workspace root — only `browse` reaches the wider host, and it
 * returns names, kinds, and sizes only.
 * @module dsh-web-enhanced/src/files-gateway
 */
import z from '@deepseek-ai/schemastery';
import { browseDirectory } from "./browse.js";
import { errorOf } from "./error.js";
import { countTextLines, deleteFileView, listDirectory, readFileView, searchFiles, writeFileView } from "./files.js";
import { officePreviewView } from "./office.js";
import { workspaceNotFound } from "./workspace-service.js";
/** How long one cached empty-query search result serves the mention picker (ms). */
const FS_SEARCH_CACHE_TTL_MS = 30_000;
/** Distinct empty-query search results kept at once (insertion-order eviction). */
const FS_SEARCH_CACHE_LIMIT = 4;
/** The files config fragment, as the plugin schema assembles it. */
export const filesConfigFragment = z.object({
    skipDirs: z.array(z.string()).default(['node_modules']),
    readMaxBytes: z.number().default(1_048_576),
    writeMaxBytes: z.number().default(2_097_152),
    binaryMaxBytes: z.number().default(5_242_880),
    searchMaxDepth: z.number().default(8),
    searchMaxEntries: z.number().default(200),
    officeMaxBytes: z.number().default(5_242_880),
    browseMaxEntries: z.number().default(500),
});
/** Field defaults applied when the files domain is assembled directly. */
export function resolveFilesConfig(config) {
    return {
        skipDirs: config.skipDirs ?? ['node_modules'],
        readMaxBytes: config.readMaxBytes ?? 1_048_576,
        writeMaxBytes: config.writeMaxBytes ?? 2_097_152,
        binaryMaxBytes: config.binaryMaxBytes ?? 5_242_880,
        searchMaxDepth: config.searchMaxDepth ?? 8,
        searchMaxEntries: config.searchMaxEntries ?? 200,
        officeMaxBytes: config.officeMaxBytes ?? 5_242_880,
        browseMaxEntries: config.browseMaxEntries ?? 500,
    };
}
/**
 * Assemble the files domain.
 * @param deps - workspace resolution and the resolved limits.
 * @returns the file capabilities.
 */
export function createFilesDomain(deps) {
    /**
     * Empty-query search results by `${workspaceId}:${path}`. The `+` mention
     * picker opens with no query and would otherwise rewalk the workspace on
     * every open; non-empty queries bypass this cache entirely.
     */
    const emptySearchCache = new Map();
    const fsLimits = () => ({
        skipDirs: deps.config.skipDirs,
        readMaxBytes: deps.config.readMaxBytes,
        writeMaxBytes: deps.config.writeMaxBytes,
        binaryMaxBytes: deps.config.binaryMaxBytes,
        searchMaxDepth: deps.config.searchMaxDepth,
        searchMaxEntries: deps.config.searchMaxEntries,
    });
    const officeLimits = () => ({ maxBytes: deps.config.officeMaxBytes });
    /**
     * Store one empty-query result, keeping at most {@link FS_SEARCH_CACHE_LIMIT}
     * keys: a re-set refreshes recency, and the oldest key is evicted past the
     * limit (Map insertion order).
     */
    const storeEmptySearch = (key, result) => {
        emptySearchCache.delete(key);
        emptySearchCache.set(key, { at: Date.now(), result });
        while (emptySearchCache.size > FS_SEARCH_CACHE_LIMIT) {
            emptySearchCache.delete(emptySearchCache.keys().next().value);
        }
    };
    /**
     * Drop every cached empty-query result of one workspace. A write or delete
     * changes what an unfiltered listing returns; dropping the whole workspace's
     * entries is cheap correctness over per-path tracking.
     */
    const invalidateSearchCache = (workspaceId) => {
        const prefix = `${workspaceId}:`;
        for (const key of [...emptySearchCache.keys()]) {
            if (key.startsWith(prefix))
                emptySearchCache.delete(key);
        }
    };
    return {
        countLines: (root, path) => countTextLines(root, path, fsLimits()),
        async list(request) {
            const root = deps.workspace.rootFor(request.workspaceId);
            if (root === null)
                return { error: workspaceNotFound(request.workspaceId) };
            try {
                return { entries: await listDirectory(root, request.path ?? '', fsLimits()) };
            }
            catch (error) {
                return { error: errorOf(error, 'fs-list') };
            }
        },
        async search(request) {
            const root = deps.workspace.rootFor(request.workspaceId);
            if (root === null)
                return { error: workspaceNotFound(request.workspaceId) };
            const rel = request.path ?? '';
            const cacheable = (request.query ?? '').trim() === '';
            const key = `${request.workspaceId}:${rel}`;
            if (cacheable) {
                const hit = emptySearchCache.get(key);
                if (hit !== undefined && Date.now() - hit.at < FS_SEARCH_CACHE_TTL_MS)
                    return hit.result;
            }
            try {
                const result = { entries: await searchFiles(root, rel, request.query ?? '', fsLimits()) };
                if (cacheable)
                    storeEmptySearch(key, result);
                return result;
            }
            catch (error) {
                return { error: errorOf(error, 'fs-search') };
            }
        },
        async read(request) {
            const root = deps.workspace.rootFor(request.workspaceId);
            if (root === null)
                return { error: workspaceNotFound(request.workspaceId) };
            try {
                return await readFileView(root, request.path, fsLimits());
            }
            catch (error) {
                return { error: errorOf(error, 'fs-read') };
            }
        },
        async write(request) {
            const root = deps.workspace.rootFor(request.workspaceId);
            if (root === null)
                return { error: workspaceNotFound(request.workspaceId) };
            try {
                await writeFileView(root, request.path, request.content, fsLimits());
                invalidateSearchCache(request.workspaceId);
                return { ok: true };
            }
            catch (error) {
                return { error: errorOf(error, 'fs-write') };
            }
        },
        async remove(request) {
            const root = deps.workspace.rootFor(request.workspaceId);
            if (root === null)
                return { error: workspaceNotFound(request.workspaceId) };
            try {
                await deleteFileView(root, request.path);
                invalidateSearchCache(request.workspaceId);
                return { ok: true };
            }
            catch (error) {
                return { error: errorOf(error, 'fs-delete') };
            }
        },
        async officePreview(request) {
            const root = deps.workspace.rootFor(request.workspaceId);
            if (root === null)
                return { error: workspaceNotFound(request.workspaceId) };
            try {
                return await officePreviewView(root, request.path, officeLimits());
            }
            catch (error) {
                return { error: errorOf(error, 'office-preview') };
            }
        },
        async browse(request) {
            try {
                return await browseDirectory(request.path, { maxEntries: deps.config.browseMaxEntries });
            }
            catch (error) {
                return { error: errorOf(error, 'fs-browse') };
            }
        },
    };
}
