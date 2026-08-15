/**
 * The web-enhanced gateway: one Typert namespace (`webEnhanced`) exposing
 * the task board, git, files, Office preview, and balance capabilities to
 * the client. Business failures are result fields, never thrown exceptions,
 * so the client renders them inline. The task domain lives in {@link
 * TaskBoard}; this class is the wire-facing assembly.
 * @module dsh-web-enhanced/src/gateway
 */
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import z from '@deepseek-ai/schemastery';
import { TypertRemoteService, Remote } from '@deepseek-ai/dsh-typert-protocol';
import { BalanceClient } from "./balance.js";
import { browseDirectory } from "./browse.js";
import { balanceApplies } from "./channel.js";
import { TaskBoard } from "./board.js";
import { deleteFileView, listDirectory, readFileView, searchFiles, writeFileView } from "./files.js";
import { GitClient } from "./git.js";
import { officePreviewView } from "./office.js";
import { PnpmRunner, pnpmFailureCode } from "./pnpm.js";
import { findProfileDir, readInventory } from "./profile.js";
export const Config = z.object({
    cronIntervalMs: z.number().default(30_000),
    balanceApiKeyEnv: z.string().default('DEEPSEEK_API_KEY'),
    balanceCacheTtlMs: z.number().default(60_000),
    balanceBaseUrl: z.string().default('https://api.deepseek.com'),
    balanceProviders: z.array(z.string()).default(['deepseek-official']),
    skipDirs: z.array(z.string()).default(['node_modules']),
    readMaxBytes: z.number().default(1_048_576),
    writeMaxBytes: z.number().default(2_097_152),
    binaryMaxBytes: z.number().default(5_242_880),
    gitOutputMaxBytes: z.number().default(262_144),
    gitMaxCount: z.number().default(100),
    searchMaxDepth: z.number().default(8),
    searchMaxEntries: z.number().default(200),
    officeMaxBytes: z.number().default(5_242_880),
    browseMaxEntries: z.number().default(500),
    pluginOpTimeoutMs: z.number().default(300_000),
    // Located by walking up from this module by default; naming it explicitly is
    // for a deployment whose profile is not an ancestor of the loaded plugin.
    profileDir: z.string().default(''),
});
/** Field defaults applied when the gateway is constructed directly. */
export function resolveConfig(config) {
    return {
        cronIntervalMs: config.cronIntervalMs ?? 30_000,
        balanceApiKeyEnv: config.balanceApiKeyEnv ?? 'DEEPSEEK_API_KEY',
        balanceCacheTtlMs: config.balanceCacheTtlMs ?? 60_000,
        balanceBaseUrl: config.balanceBaseUrl ?? 'https://api.deepseek.com',
        balanceProviders: config.balanceProviders ?? ['deepseek-official'],
        skipDirs: config.skipDirs ?? ['node_modules'],
        readMaxBytes: config.readMaxBytes ?? 1_048_576,
        writeMaxBytes: config.writeMaxBytes ?? 2_097_152,
        binaryMaxBytes: config.binaryMaxBytes ?? 5_242_880,
        gitOutputMaxBytes: config.gitOutputMaxBytes ?? 262_144,
        gitMaxCount: config.gitMaxCount ?? 100,
        searchMaxDepth: config.searchMaxDepth ?? 8,
        searchMaxEntries: config.searchMaxEntries ?? 200,
        officeMaxBytes: config.officeMaxBytes ?? 5_242_880,
        browseMaxEntries: config.browseMaxEntries ?? 500,
        pluginOpTimeoutMs: config.pluginOpTimeoutMs ?? 300_000,
        profileDir: config.profileDir ?? '',
    };
}
/**
 * The web-enhanced gateway. One Typert namespace so a single `remote`
 * contribution reaches the client; methods are grouped by prefix.
 */
let WebEnhancedGateway = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _taskList_decorators;
    let _taskCreate_decorators;
    let _taskUpdate_decorators;
    let _taskRemove_decorators;
    let _taskRun_decorators;
    let _balanceGet_decorators;
    let _gitBranches_decorators;
    let _gitLog_decorators;
    let _gitCommit_decorators;
    let _gitCheckout_decorators;
    let _gitStatus_decorators;
    let _gitDiff_decorators;
    let _gitStage_decorators;
    let _gitUnstage_decorators;
    let _gitDiscard_decorators;
    let _fsList_decorators;
    let _fsSearch_decorators;
    let _fsRead_decorators;
    let _fsWrite_decorators;
    let _fsDelete_decorators;
    let _fsOfficePreview_decorators;
    let _fsBrowse_decorators;
    let _pluginList_decorators;
    let _pluginRemove_decorators;
    let _pluginUpdate_decorators;
    return class WebEnhancedGateway extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _taskList_decorators = [Remote('taskList')];
            _taskCreate_decorators = [Remote('taskCreate')];
            _taskUpdate_decorators = [Remote('taskUpdate')];
            _taskRemove_decorators = [Remote('taskRemove')];
            _taskRun_decorators = [Remote('taskRun')];
            _balanceGet_decorators = [Remote('balanceGet')];
            _gitBranches_decorators = [Remote('gitBranches')];
            _gitLog_decorators = [Remote('gitLog')];
            _gitCommit_decorators = [Remote('gitCommit')];
            _gitCheckout_decorators = [Remote('gitCheckout')];
            _gitStatus_decorators = [Remote('gitStatus')];
            _gitDiff_decorators = [Remote('gitDiff')];
            _gitStage_decorators = [Remote('gitStage')];
            _gitUnstage_decorators = [Remote('gitUnstage')];
            _gitDiscard_decorators = [Remote('gitDiscard')];
            _fsList_decorators = [Remote('fsList')];
            _fsSearch_decorators = [Remote('fsSearch')];
            _fsRead_decorators = [Remote('fsRead')];
            _fsWrite_decorators = [Remote('fsWrite')];
            _fsDelete_decorators = [Remote('fsDelete')];
            _fsOfficePreview_decorators = [Remote('fsOfficePreview')];
            _fsBrowse_decorators = [Remote('fsBrowse')];
            _pluginList_decorators = [Remote('pluginList')];
            _pluginRemove_decorators = [Remote('pluginRemove')];
            _pluginUpdate_decorators = [Remote('pluginUpdate')];
            __esDecorate(this, null, _taskList_decorators, { kind: "method", name: "taskList", static: false, private: false, access: { has: obj => "taskList" in obj, get: obj => obj.taskList }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _taskCreate_decorators, { kind: "method", name: "taskCreate", static: false, private: false, access: { has: obj => "taskCreate" in obj, get: obj => obj.taskCreate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _taskUpdate_decorators, { kind: "method", name: "taskUpdate", static: false, private: false, access: { has: obj => "taskUpdate" in obj, get: obj => obj.taskUpdate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _taskRemove_decorators, { kind: "method", name: "taskRemove", static: false, private: false, access: { has: obj => "taskRemove" in obj, get: obj => obj.taskRemove }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _taskRun_decorators, { kind: "method", name: "taskRun", static: false, private: false, access: { has: obj => "taskRun" in obj, get: obj => obj.taskRun }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _balanceGet_decorators, { kind: "method", name: "balanceGet", static: false, private: false, access: { has: obj => "balanceGet" in obj, get: obj => obj.balanceGet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _gitBranches_decorators, { kind: "method", name: "gitBranches", static: false, private: false, access: { has: obj => "gitBranches" in obj, get: obj => obj.gitBranches }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _gitLog_decorators, { kind: "method", name: "gitLog", static: false, private: false, access: { has: obj => "gitLog" in obj, get: obj => obj.gitLog }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _gitCommit_decorators, { kind: "method", name: "gitCommit", static: false, private: false, access: { has: obj => "gitCommit" in obj, get: obj => obj.gitCommit }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _gitCheckout_decorators, { kind: "method", name: "gitCheckout", static: false, private: false, access: { has: obj => "gitCheckout" in obj, get: obj => obj.gitCheckout }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _gitStatus_decorators, { kind: "method", name: "gitStatus", static: false, private: false, access: { has: obj => "gitStatus" in obj, get: obj => obj.gitStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _gitDiff_decorators, { kind: "method", name: "gitDiff", static: false, private: false, access: { has: obj => "gitDiff" in obj, get: obj => obj.gitDiff }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _gitStage_decorators, { kind: "method", name: "gitStage", static: false, private: false, access: { has: obj => "gitStage" in obj, get: obj => obj.gitStage }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _gitUnstage_decorators, { kind: "method", name: "gitUnstage", static: false, private: false, access: { has: obj => "gitUnstage" in obj, get: obj => obj.gitUnstage }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _gitDiscard_decorators, { kind: "method", name: "gitDiscard", static: false, private: false, access: { has: obj => "gitDiscard" in obj, get: obj => obj.gitDiscard }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _fsList_decorators, { kind: "method", name: "fsList", static: false, private: false, access: { has: obj => "fsList" in obj, get: obj => obj.fsList }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _fsSearch_decorators, { kind: "method", name: "fsSearch", static: false, private: false, access: { has: obj => "fsSearch" in obj, get: obj => obj.fsSearch }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _fsRead_decorators, { kind: "method", name: "fsRead", static: false, private: false, access: { has: obj => "fsRead" in obj, get: obj => obj.fsRead }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _fsWrite_decorators, { kind: "method", name: "fsWrite", static: false, private: false, access: { has: obj => "fsWrite" in obj, get: obj => obj.fsWrite }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _fsDelete_decorators, { kind: "method", name: "fsDelete", static: false, private: false, access: { has: obj => "fsDelete" in obj, get: obj => obj.fsDelete }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _fsOfficePreview_decorators, { kind: "method", name: "fsOfficePreview", static: false, private: false, access: { has: obj => "fsOfficePreview" in obj, get: obj => obj.fsOfficePreview }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _fsBrowse_decorators, { kind: "method", name: "fsBrowse", static: false, private: false, access: { has: obj => "fsBrowse" in obj, get: obj => obj.fsBrowse }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _pluginList_decorators, { kind: "method", name: "pluginList", static: false, private: false, access: { has: obj => "pluginList" in obj, get: obj => obj.pluginList }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _pluginRemove_decorators, { kind: "method", name: "pluginRemove", static: false, private: false, access: { has: obj => "pluginRemove" in obj, get: obj => obj.pluginRemove }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _pluginUpdate_decorators, { kind: "method", name: "pluginUpdate", static: false, private: false, access: { has: obj => "pluginUpdate" in obj, get: obj => obj.pluginUpdate }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        resolved = __runInitializers(this, _instanceExtraInitializers);
        balance;
        board;
        /** Resolved lazily: the walk is filesystem work no other capability needs. */
        profileDirCache;
        /** Built on first mutation, so a deployment outside a profile never makes one. */
        pnpm;
        /**
         * Register the gateway, mount the task board (recovering interrupted
         * runs), and start the scheduler.
         * @param ctx - owning context with the injected core services.
         * @param config - plugin config; defaults apply field-wise.
         */
        constructor(ctx, config = {}) {
            super(ctx, 'webEnhanced');
            this.resolved = resolveConfig(config);
            this.balance = new BalanceClient({
                apiKeyEnv: this.resolved.balanceApiKeyEnv,
                cacheTtlMs: this.resolved.balanceCacheTtlMs,
                baseUrl: this.resolved.balanceBaseUrl,
            }, 
            // Resolved per query, never captured: the seam's own contract is that a
            // rotated credential reaches the next operation without a restart. Read
            // uninjected so a deployment without the seam still mounts the gateway.
            async (ref) => {
                const credentials = ctx.get('credentials');
                if (credentials === undefined)
                    return undefined;
                // The seam brands its references; this one comes from validated config.
                const hit = await credentials.resolve(ref);
                return hit?.value;
            });
            this.board = new TaskBoard(ctx, this.boardDeps(ctx), {
                cronIntervalMs: this.resolved.cronIntervalMs,
            });
        }
        // ── tasks ────────────────────────────────────────────────────────────────
        /** List every task, oldest first. */
        taskList() {
            return this.board.list();
        }
        /** Create a task; a cron expression is validated and its next run computed. */
        taskCreate(request) {
            return this.board.create(request);
        }
        /** Update title, prompt, cron, or board column (planned/todo only). */
        taskUpdate(request) {
            return this.board.update(request);
        }
        /** Remove one task record. */
        taskRemove(request) {
            return this.board.remove(request);
        }
        /** Start one task immediately in a fresh agent session. */
        taskRun(request) {
            return this.board.run(request);
        }
        /** One balance view (cached), hidden when the route bills another account. */
        async balanceGet(request) {
            if (!this.balanceApplies(request.provider)) {
                return { applicable: false, isAvailable: false, infos: [], cachedAt: Date.now() };
            }
            return { ...await this.balance.get(), applicable: true };
        }
        // ── git ──────────────────────────────────────────────────────────────────
        /** Local branches; the current branch carries the flag. */
        async gitBranches(request) {
            return this.withGit(request.workspaceId, async (client) => ({ branches: await client.branches() }));
        }
        /** Recent commits with branch markers; one branch when the graph filters. */
        async gitLog(request) {
            return this.withGit(request.workspaceId, async (client) => {
                const maxCount = request.maxCount === undefined ? this.resolved.gitMaxCount : request.maxCount;
                return { commits: await client.log(maxCount, request.branch) };
            });
        }
        /** One commit's identity, message, and per-file line counts. */
        async gitCommit(request) {
            return this.withGit(request.workspaceId, async (client) => ({ commit: await client.commit(request.hash) }));
        }
        /** Check out one branch; a rejected switch carries its stderr message. */
        async gitCheckout(request) {
            return this.withGit(request.workspaceId, async (client) => client.checkout(request.branch));
        }
        /** Worktree status (porcelain v1). */
        async gitStatus(request) {
            return this.withGit(request.workspaceId, async (client) => ({ entries: await client.status() }));
        }
        /** Unified diff text, optionally staged, optionally one path. */
        async gitDiff(request) {
            return this.withGit(request.workspaceId, async (client) => ({
                text: await client.diff(request.path, request.staged === true),
            }));
        }
        /** Stage paths. */
        async gitStage(request) {
            return this.withGit(request.workspaceId, async (client) => {
                await client.stage(request.paths);
                return { ok: true };
            });
        }
        /** Unstage paths. */
        async gitUnstage(request) {
            return this.withGit(request.workspaceId, async (client) => {
                await client.unstage(request.paths);
                return { ok: true };
            });
        }
        /** Discard worktree changes of tracked paths. */
        async gitDiscard(request) {
            return this.withGit(request.workspaceId, async (client) => {
                await client.discard(request.paths);
                return { ok: true };
            });
        }
        // ── files ────────────────────────────────────────────────────────────────
        /** List one directory (skips .git and configured skip dirs). */
        async fsList(request) {
            const root = this.workspaceRootFor(request.workspaceId);
            if (root === null)
                return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } };
            try {
                return { entries: await listDirectory(root, request.path ?? '', this.fsLimits) };
            }
            catch (error) {
                return { error: this.errorOf(error, 'fs-list') };
            }
        }
        /** Recursive basename search (bounded). */
        async fsSearch(request) {
            const root = this.workspaceRootFor(request.workspaceId);
            if (root === null)
                return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } };
            try {
                return { entries: await searchFiles(root, request.path ?? '', request.query ?? '', this.fsLimits) };
            }
            catch (error) {
                return { error: this.errorOf(error, 'fs-search') };
            }
        }
        /** Read one file (text capped / binary base64 preview). */
        async fsRead(request) {
            const root = this.workspaceRootFor(request.workspaceId);
            if (root === null)
                return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } };
            try {
                return await readFileView(root, request.path, this.fsLimits);
            }
            catch (error) {
                return { error: this.errorOf(error, 'fs-read') };
            }
        }
        /** Write one UTF-8 file. */
        async fsWrite(request) {
            const root = this.workspaceRootFor(request.workspaceId);
            if (root === null)
                return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } };
            try {
                await writeFileView(root, request.path, request.content, this.fsLimits);
                return { ok: true };
            }
            catch (error) {
                return { error: this.errorOf(error, 'fs-write') };
            }
        }
        /** Delete one file (never a directory). */
        async fsDelete(request) {
            const root = this.workspaceRootFor(request.workspaceId);
            if (root === null)
                return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } };
            try {
                await deleteFileView(root, request.path);
                return { ok: true };
            }
            catch (error) {
                return { error: this.errorOf(error, 'fs-delete') };
            }
        }
        /** Convert an Office file (docx/xlsx) into preview blocks. */
        async fsOfficePreview(request) {
            const root = this.workspaceRootFor(request.workspaceId);
            if (root === null)
                return { error: { code: 'workspace-not-found', message: `workspace '${request.workspaceId}' does not exist` } };
            try {
                return await officePreviewView(root, request.path, this.officeLimits);
            }
            catch (error) {
                return { error: this.errorOf(error, 'office-preview') };
            }
        }
        /**
         * List one absolute directory anywhere on the host (the mention browser).
         *
         * Deliberately NOT workspace-scoped: a mention is a path string, and the
         * path the user wants may sit outside the project. Reads, writes, and
         * previews stay behind the workspace root — this returns names, kinds, and
         * sizes only.
         */
        async fsBrowse(request) {
            try {
                return await browseDirectory(request.path, { maxEntries: this.resolved.browseMaxEntries });
            }
            catch (error) {
                return { error: this.errorOf(error, 'fs-browse') };
            }
        }
        // ── plugins ──────────────────────────────────────────────────────────────
        /**
         * The profile's installed plugins.
         *
         * Answers `no-profile` rather than an empty list when this deployment loads
         * the plugin from outside any profile (a source checkout, a test): those are
         * different facts, and an empty list would invite a removal that cannot work.
         */
        async pluginList(_request) {
            try {
                const dir = await this.profileDir();
                if (dir === undefined)
                    return { error: this.noProfile() };
                const inventory = await readInventory(dir);
                return {
                    profileDir: inventory.dir,
                    profileName: inventory.name,
                    plugins: inventory.plugins,
                    templateBundles: inventory.templateBundles,
                    busy: this.pnpm?.running ?? false,
                };
            }
            catch (error) {
                return { error: this.errorOf(error, 'plugin-list') };
            }
        }
        /** Remove one plugin from the profile (takes effect on the next start). */
        async pluginRemove(request) {
            return this.pluginOperation(request.name, runner => runner.remove(request.name));
        }
        /** Update one plugin to its spec's head (takes effect on the next start). */
        async pluginUpdate(request) {
            return this.pluginOperation(request.name, runner => runner.update(request.name));
        }
        // ── internals ────────────────────────────────────────────────────────────
        /**
         * Whether the balance describes the account one model route bills.
         *
         * The provider's endpoint is read from the settings section its own adapter
         * declares, through `ctx.llm`'s configurable-provider directory — both read
         * uninjected, because a deployment that composes neither still has a working
         * gateway and simply falls back to the allow list.
         */
        balanceApplies(provider) {
            return balanceApplies({
                provider,
                allowed: this.resolved.balanceProviders,
                balanceBaseUrl: this.resolved.balanceBaseUrl,
                providerBaseUrl: provider === undefined ? undefined : this.providerBaseUrl(provider),
            });
        }
        /** Configured endpoint of one provider route, when its settings declare one. */
        providerBaseUrl(provider) {
            const llm = this.ctx.get('llm');
            const settings = this.ctx.get('settings');
            if (llm === undefined || settings === undefined)
                return undefined;
            const entry = llm.listConfigurableProviders().find(candidate => candidate.provider === provider);
            if (entry === undefined || entry.settingsNs === '')
                return undefined;
            let value = settings.get(entry.settingsNs);
            for (const step of entry.settingsPath) {
                if (typeof value !== 'object' || value === null)
                    return undefined;
                value = value[step];
            }
            if (typeof value !== 'object' || value === null)
                return undefined;
            const baseUrl = value['baseURL'];
            return typeof baseUrl === 'string' && baseUrl.trim() !== '' ? baseUrl : undefined;
        }
        get fsLimits() {
            return {
                skipDirs: this.resolved.skipDirs,
                readMaxBytes: this.resolved.readMaxBytes,
                writeMaxBytes: this.resolved.writeMaxBytes,
                binaryMaxBytes: this.resolved.binaryMaxBytes,
                searchMaxDepth: this.resolved.searchMaxDepth,
                searchMaxEntries: this.resolved.searchMaxEntries,
            };
        }
        get gitLimits() {
            return { outputMaxBytes: this.resolved.gitOutputMaxBytes, maxCount: this.resolved.gitMaxCount };
        }
        get officeLimits() {
            return { maxBytes: this.resolved.officeMaxBytes };
        }
        runDeps(ctx) {
            const loader = ctx.get('loader');
            return {
                agents: ctx.agents,
                sessions: ctx.sessions,
                agentDefaultModel: ctx.agentDefaultModel,
                awaitLoader: loader === undefined ? undefined : () => loader.await(),
                // Read uninjected and per call: the roster is what carries a session's
                // tools, but a deployment composed without one must still run tasks, and
                // the service may mount after this gateway does.
                presets: () => ctx.get('agentPresets'),
                attachWorkspaceSession: async (workspaceId, sessionId) => {
                    // Never fatal to the run: the session already exists and already works
                    // in the right directory, so a refused membership is a reportable miss
                    // rather than a reason to lose a started run. The registry validates
                    // the session header's canonical cwd against the workspace path, which
                    // is the realistic refusal (a path that moved under the record).
                    try {
                        const workspace = this.ctx.workspaceRegistry.get(workspaceId);
                        if (workspace === undefined) {
                            throw new Error(`workspace '${workspaceId}' is no longer registered`);
                        }
                        await workspace.attachSession(sessionId);
                    }
                    catch (error) {
                        ctx.logger.warn(`web-enhanced could not record run session '${sessionId}' on workspace '${workspaceId}': `
                            + (error instanceof Error ? error.message : String(error)));
                    }
                },
            };
        }
        boardDeps(ctx) {
            return {
                ...this.runDeps(ctx),
                workspaceRoot: workspaceId => this.workspaceRoot(workspaceId),
                resolveWorkspaceId: workspaceId => this.resolveWorkspaceId(workspaceId),
                logger: ctx.logger,
            };
        }
        /** Resolve a workspace id to its canonical root; null when unknown. */
        workspaceRootFor(workspaceId) {
            return this.ctx.workspaceRegistry.list().find(workspace => workspace.id === workspaceId)?.path ?? null;
        }
        resolveWorkspaceId(workspaceId) {
            const found = this.ctx.workspaceRegistry.list().find(workspace => workspace.id === workspaceId);
            return found === undefined ? null : found.id;
        }
        workspaceRoot(workspaceId) {
            if (workspaceId === null)
                return process.cwd();
            const found = this.ctx.workspaceRegistry.list().find(workspace => workspace.id === workspaceId);
            return found?.path ?? process.cwd();
        }
        async withGit(workspaceId, fn) {
            const root = this.workspaceRootFor(workspaceId);
            if (root === null)
                return { error: { code: 'workspace-not-found', message: `workspace '${workspaceId}' does not exist` } };
            try {
                return await fn(new GitClient(this.ctx.subprocess, root, this.gitLimits));
            }
            catch (error) {
                return { error: this.errorOf(error, 'git-error') };
            }
        }
        /** The error returned when this deployment sits outside any profile. */
        noProfile() {
            return {
                code: 'no-profile',
                message: 'this deployment does not load the plugin from a dsh profile, so there is nothing to manage',
            };
        }
        /**
         * The profile directory, resolved once and cached.
         *
         * A profile cannot move under a running host, so a repeated walk would only
         * repeat the same filesystem reads. The promise itself is cached so
         * concurrent first callers share one walk. A configured path wins outright:
         * the walk is a heuristic over where the module happens to sit.
         */
        profileDir() {
            if (this.resolved.profileDir !== '')
                return Promise.resolve(this.resolved.profileDir);
            this.profileDirCache ??= findProfileDir();
            return this.profileDirCache;
        }
        /**
         * Run one plugin mutation, guarding what pnpm itself would not.
         *
         * The refusal here is for a name pnpm cannot act on: a template bundle is in
         * the layer list precisely because nothing depends on it, so `pnpm remove`
         * would report success having done nothing. Removing the row that IS this
         * plugin is NOT refused — that is a legitimate thing to want, and the
         * `self` flag exists so the surface can confirm it rather than have the
         * gateway decide on the user's behalf.
         * @param name - package name from the request.
         * @param operation - the runner call to perform.
         * @returns the mutation result.
         */
        async pluginOperation(name, operation) {
            try {
                const dir = await this.profileDir();
                if (dir === undefined)
                    return { error: this.noProfile() };
                const inventory = await readInventory(dir);
                const row = inventory.plugins.find(plugin => plugin.name === name);
                if (row === undefined) {
                    const template = inventory.templateBundles.includes(name);
                    return {
                        error: {
                            code: template ? 'plugin-not-removable' : 'plugin-not-found',
                            message: template
                                ? `'${name}' is a profile template layer, not a dependency — it cannot be removed or updated by pnpm`
                                : `'${name}' is not a dependency of profile '${inventory.name}'`,
                        },
                    };
                }
                this.pnpm ??= new PnpmRunner(this.ctx.subprocess, dir, {
                    timeoutMs: this.resolved.pluginOpTimeoutMs,
                    outputMaxBytes: this.resolved.gitOutputMaxBytes,
                });
                const { run, added, removed } = await operation(this.pnpm);
                const output = `${run.stdout}\n${run.stderr}`.trim();
                const failure = pnpmFailureCode(run);
                if (failure !== undefined) {
                    return { ok: false, added, removed, restartRequired: false, output: output || failure };
                }
                // Always true on success: Cordis composed the layer stack at boot, so
                // what changed on disk describes the next start, not this process.
                return { ok: true, added, removed, restartRequired: true, output };
            }
            catch (error) {
                return { error: this.errorOf(error, 'plugin-operation') };
            }
        }
        errorOf(error, fallback) {
            const message = error instanceof Error ? error.message : String(error);
            const code = error instanceof Error && error.code === 'ENOENT'
                ? 'not-found'
                : fallback;
            return { code, message };
        }
    };
})();
export { WebEnhancedGateway };
