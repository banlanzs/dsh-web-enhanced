/**
 * The web-enhanced gateway: one Typert namespace (`webEnhanced`) exposing
 * the task board, git, files, Office preview, balance, and image
 * understanding to the client.
 *
 * This class is the wire face and nothing else: every method declares its
 * `@Remote` binding and delegates to the domain that owns the behaviour (see
 * {@link ./services.ts} for the assembly, and each `*-gateway.ts` for one
 * domain). The methods stay here because `@Remote` records its markers on
 * this service's prototype. Business failures are result fields, never thrown
 * exceptions, so the client renders them inline.
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
import { TypertRemoteService, Remote } from '@deepseek-ai/dsh-typert-protocol';
import { Config, resolveConfig } from "./config.js";
import { createServices } from "./services.js";
/**
 * Config re-exports.
 *
 * Each domain module owns its own slice of the schema (see
 * {@link ./config.ts}); these keep the plugin entry and any external
 * consumer importing the gateway's config surface unchanged.
 */
export { Config, resolveConfig } from "./config.js";
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
    let _pricingGet_decorators;
    let _modelRouteDescribe_decorators;
    let _deepseekRateGet_decorators;
    let _opencodeGoUsageGet_decorators;
    let _visionStatus_decorators;
    let _visionConfigGet_decorators;
    let _visionConfigSet_decorators;
    let _modelRetryGet_decorators;
    let _modelRetrySet_decorators;
    let _globalPromptGet_decorators;
    let _globalPromptSet_decorators;
    let _memoryList_decorators;
    let _memoryDelete_decorators;
    let _memoryConfigGet_decorators;
    let _memoryConfigSet_decorators;
    let _visionEndpointModels_decorators;
    let _gitBranches_decorators;
    let _gitLog_decorators;
    let _gitCommit_decorators;
    let _gitCommitDiff_decorators;
    let _gitWorking_decorators;
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
            _pricingGet_decorators = [Remote('pricingGet')];
            _modelRouteDescribe_decorators = [Remote('modelRouteDescribe')];
            _deepseekRateGet_decorators = [Remote('deepseekRateGet')];
            _opencodeGoUsageGet_decorators = [Remote('opencodeGoUsageGet')];
            _visionStatus_decorators = [Remote('visionStatus')];
            _visionConfigGet_decorators = [Remote('visionConfigGet')];
            _visionConfigSet_decorators = [Remote('visionConfigSet')];
            _modelRetryGet_decorators = [Remote('modelRetryGet')];
            _modelRetrySet_decorators = [Remote('modelRetrySet')];
            _globalPromptGet_decorators = [Remote('globalPromptGet')];
            _globalPromptSet_decorators = [Remote('globalPromptSet')];
            _memoryList_decorators = [Remote('memoryList')];
            _memoryDelete_decorators = [Remote('memoryDelete')];
            _memoryConfigGet_decorators = [Remote('memoryConfigGet')];
            _memoryConfigSet_decorators = [Remote('memoryConfigSet')];
            _visionEndpointModels_decorators = [Remote('visionEndpointModels')];
            _gitBranches_decorators = [Remote('gitBranches')];
            _gitLog_decorators = [Remote('gitLog')];
            _gitCommit_decorators = [Remote('gitCommit')];
            _gitCommitDiff_decorators = [Remote('gitCommitDiff')];
            _gitWorking_decorators = [Remote('gitWorking')];
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
            __esDecorate(this, null, _pricingGet_decorators, { kind: "method", name: "pricingGet", static: false, private: false, access: { has: obj => "pricingGet" in obj, get: obj => obj.pricingGet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _modelRouteDescribe_decorators, { kind: "method", name: "modelRouteDescribe", static: false, private: false, access: { has: obj => "modelRouteDescribe" in obj, get: obj => obj.modelRouteDescribe }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deepseekRateGet_decorators, { kind: "method", name: "deepseekRateGet", static: false, private: false, access: { has: obj => "deepseekRateGet" in obj, get: obj => obj.deepseekRateGet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _opencodeGoUsageGet_decorators, { kind: "method", name: "opencodeGoUsageGet", static: false, private: false, access: { has: obj => "opencodeGoUsageGet" in obj, get: obj => obj.opencodeGoUsageGet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _visionStatus_decorators, { kind: "method", name: "visionStatus", static: false, private: false, access: { has: obj => "visionStatus" in obj, get: obj => obj.visionStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _visionConfigGet_decorators, { kind: "method", name: "visionConfigGet", static: false, private: false, access: { has: obj => "visionConfigGet" in obj, get: obj => obj.visionConfigGet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _visionConfigSet_decorators, { kind: "method", name: "visionConfigSet", static: false, private: false, access: { has: obj => "visionConfigSet" in obj, get: obj => obj.visionConfigSet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _modelRetryGet_decorators, { kind: "method", name: "modelRetryGet", static: false, private: false, access: { has: obj => "modelRetryGet" in obj, get: obj => obj.modelRetryGet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _modelRetrySet_decorators, { kind: "method", name: "modelRetrySet", static: false, private: false, access: { has: obj => "modelRetrySet" in obj, get: obj => obj.modelRetrySet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _globalPromptGet_decorators, { kind: "method", name: "globalPromptGet", static: false, private: false, access: { has: obj => "globalPromptGet" in obj, get: obj => obj.globalPromptGet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _globalPromptSet_decorators, { kind: "method", name: "globalPromptSet", static: false, private: false, access: { has: obj => "globalPromptSet" in obj, get: obj => obj.globalPromptSet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _memoryList_decorators, { kind: "method", name: "memoryList", static: false, private: false, access: { has: obj => "memoryList" in obj, get: obj => obj.memoryList }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _memoryDelete_decorators, { kind: "method", name: "memoryDelete", static: false, private: false, access: { has: obj => "memoryDelete" in obj, get: obj => obj.memoryDelete }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _memoryConfigGet_decorators, { kind: "method", name: "memoryConfigGet", static: false, private: false, access: { has: obj => "memoryConfigGet" in obj, get: obj => obj.memoryConfigGet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _memoryConfigSet_decorators, { kind: "method", name: "memoryConfigSet", static: false, private: false, access: { has: obj => "memoryConfigSet" in obj, get: obj => obj.memoryConfigSet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _visionEndpointModels_decorators, { kind: "method", name: "visionEndpointModels", static: false, private: false, access: { has: obj => "visionEndpointModels" in obj, get: obj => obj.visionEndpointModels }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _gitBranches_decorators, { kind: "method", name: "gitBranches", static: false, private: false, access: { has: obj => "gitBranches" in obj, get: obj => obj.gitBranches }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _gitLog_decorators, { kind: "method", name: "gitLog", static: false, private: false, access: { has: obj => "gitLog" in obj, get: obj => obj.gitLog }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _gitCommit_decorators, { kind: "method", name: "gitCommit", static: false, private: false, access: { has: obj => "gitCommit" in obj, get: obj => obj.gitCommit }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _gitCommitDiff_decorators, { kind: "method", name: "gitCommitDiff", static: false, private: false, access: { has: obj => "gitCommitDiff" in obj, get: obj => obj.gitCommitDiff }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _gitWorking_decorators, { kind: "method", name: "gitWorking", static: false, private: false, access: { has: obj => "gitWorking" in obj, get: obj => obj.gitWorking }, metadata: _metadata }, null, _instanceExtraInitializers);
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
        services = __runInitializers(this, _instanceExtraInitializers);
        /**
         * Register the gateway, assemble every domain (mounting the task board,
         * which recovers interrupted runs and starts the scheduler), and keep the
         * route-name cache in step with the provider directory.
         * @param ctx - owning context with the injected core services.
         * @param config - plugin config; defaults apply field-wise.
         */
        constructor(ctx, config = {}) {
            super(ctx, 'webEnhanced');
            this.services = createServices(ctx, resolveConfig(config));
            // Directory renames reach the balance line without a restart: drop the
            // name caches and let the next describe re-prime them from the directory.
            ctx.on('llm/adapters-updated', () => { this.services.model.clearRouteNames(); });
        }
        // ── tasks ────────────────────────────────────────────────────────────────
        /** List every task, oldest first. */
        taskList() {
            return this.services.board.list();
        }
        /** Create a task; a cron expression is validated and its next run computed. */
        taskCreate(request) {
            return this.services.board.create(request);
        }
        /** Update title, prompt, cron, or board column (planned/todo only). */
        taskUpdate(request) {
            return this.services.board.update(request);
        }
        /** Remove one task record. */
        taskRemove(request) {
            return this.services.board.remove(request);
        }
        /** Start one task immediately in a fresh agent session. */
        taskRun(request) {
            return this.services.board.run(request);
        }
        /** One balance view (cached), hidden when the route bills another account. */
        balanceGet(request) {
            return this.services.model.balance(request);
        }
        /** models.dev pricing for one model route (cached, USD per 1M tokens). */
        pricingGet(request) {
            return this.services.model.pricing(request);
        }
        /** Directory display names for one model route (the model picker's names). */
        modelRouteDescribe(request) {
            return this.services.model.describeRoute(request);
        }
        /** DeepSeek peak/off-peak clock and prices for one model id. */
        deepseekRateGet(request) {
            return this.services.model.deepseekRate(request);
        }
        /** OpenCode Go quota windows (cached; last-good snapshot on failure). */
        opencodeGoUsageGet() {
            return this.services.model.opencodeGoUsage();
        }
        /**
         * Live state of the image-understanding integration: whether the admission
         * patch is active, which vision models/endpoints the transcription engine
         * can use, and its last failure. Read lazily so a deployment that mounts no
         * integration reports that state instead of throwing.
         */
        visionStatus() {
            return this.services.vision.status();
        }
        /**
         * The editable vision configuration plus the picker options and the live
         * status, all in one read. The API key is never returned.
         */
        visionConfigGet() {
            return this.services.vision.configGet();
        }
        /**
         * Save one vision-config patch into the settings namespace. The namespace
         * owner (`VisionInterceptor`) watches the commit and reconfigures live, so
         * no restart is needed; `expectedRevision` gives the save CAS semantics.
         */
        visionConfigSet(request) {
            return this.services.vision.configSet(request);
        }
        /**
         * Read every enabled provider route's current model-request retry policy
         * from the host's settings service — llm-deepseek at its section root and
         * each pi-ai route inside `providers.<route>.retryPolicy`. Saving a number
         * switches the route back to bounded normal mode and takes effect on the
         * next request without a restart (the adapter re-registers its route when
         * the policy changes).
         */
        modelRetryGet() {
            return this.services.model.retryGet();
        }
        /** Save a bounded retry count into one provider route's settings. */
        modelRetrySet(request) {
            return this.services.model.retrySet(request);
        }
        /**
         * Read the global-prompt settings namespace. Served through this plugin's
         * own Typert gateway rather than the host settings RPCs: a plugin-owned
         * namespace is not on the api-proxy settings allowlist, so the browser
         * `settings.describe` would never list it.
         */
        globalPromptGet() {
            return this.services.globalPrompt.get();
        }
        /**
         * Save the two global-prompt fields into the settings namespace. The
         * registered section text is read per assembly, so the next model request
         * uses the saved value without a restart; `expectedRevision` gives the save
         * CAS semantics.
         */
        globalPromptSet(request) {
            return this.services.globalPrompt.set(request);
        }
        // ── memory ──────────────────────────────────────────────────────────────
        /** List memory records, optionally narrowed to one workspace. */
        memoryList(request) {
            return this.services.memory.list(request);
        }
        /** Delete one memory record by id. */
        memoryDelete(request) {
            return this.services.memory.remove(request);
        }
        /**
         * Read the memory settings namespace. Served through this plugin's own
         * gateway for the same reason as the global prompt: a plugin-owned
         * namespace is not on the api-proxy settings allowlist.
         */
        memoryConfigGet() {
            return this.services.memory.configGet();
        }
        /**
         * Save the memory feature switch. The standing section and the recall hook
         * both read the resolved value per step, so a successful save reaches the
         * next model request without a restart.
         */
        memoryConfigSet(request) {
            return this.services.memory.configSet(request);
        }
        /**
         * Fetch the dedicated endpoint's `/models` listing. A typed key is one-shot
         * for this call; otherwise the SAVED key (or its env fallback) is used. The
         * key is never stored, logged, or returned.
         */
        visionEndpointModels(request) {
            return this.services.vision.endpointModels(request);
        }
        // ── git ──────────────────────────────────────────────────────────────────
        /** Local branches; the current branch carries the flag. */
        gitBranches(request) {
            return this.services.git.branches(request);
        }
        /** Recent commits with branch markers; one branch when the graph filters. */
        gitLog(request) {
            return this.services.git.log(request);
        }
        /** One commit's identity, message, and per-file line counts. */
        gitCommit(request) {
            return this.services.git.commit(request);
        }
        /** Unified diff of one file as one commit changed it. */
        gitCommitDiff(request) {
            return this.services.git.commitDiff(request);
        }
        /**
         * The uncommitted state of the work tree: staged, unstaged, and untracked
         * files with their line counts, plus the HEAD the graph attaches them to.
         */
        gitWorking(request) {
            return this.services.git.working(request);
        }
        /** Check out one branch; a rejected switch carries its stderr message. */
        gitCheckout(request) {
            return this.services.git.checkout(request);
        }
        /** Worktree status (porcelain v1). */
        gitStatus(request) {
            return this.services.git.status(request);
        }
        /** Unified diff text, optionally staged, optionally one path. */
        gitDiff(request) {
            return this.services.git.diff(request);
        }
        /** Stage paths. */
        gitStage(request) {
            return this.services.git.stage(request);
        }
        /** Unstage paths. */
        gitUnstage(request) {
            return this.services.git.unstage(request);
        }
        /** Discard worktree changes of tracked paths. */
        gitDiscard(request) {
            return this.services.git.discard(request);
        }
        // ── files ────────────────────────────────────────────────────────────────
        /** List one directory (skips .git and configured skip dirs). */
        fsList(request) {
            return this.services.files.list(request);
        }
        /**
         * Recursive basename search (bounded). An empty query — the mention picker's
         * open state — is served from a short-lived per-workspace-path cache; every
         * non-empty query bypasses it.
         */
        fsSearch(request) {
            return this.services.files.search(request);
        }
        /** Read one file (text capped / binary base64 preview). */
        fsRead(request) {
            return this.services.files.read(request);
        }
        /** Write one UTF-8 file. */
        fsWrite(request) {
            return this.services.files.write(request);
        }
        /** Delete one file (never a directory). */
        fsDelete(request) {
            return this.services.files.remove(request);
        }
        /** Convert an Office file (docx/xlsx) into preview blocks. */
        fsOfficePreview(request) {
            return this.services.files.officePreview(request);
        }
        /**
         * List one absolute directory anywhere on the host (the mention browser).
         *
         * Deliberately NOT workspace-scoped: a mention is a path string, and the
         * path the user wants may sit outside the project. Reads, writes, and
         * previews stay behind the workspace root — this returns names, kinds, and
         * sizes only.
         */
        fsBrowse(request) {
            return this.services.files.browse(request);
        }
        // ── plugins ──────────────────────────────────────────────────────────────
        /**
         * The profile's installed plugins.
         *
         * Answers `no-profile` rather than an empty list when this deployment loads
         * the plugin from outside any profile (a source checkout, a test): those are
         * different facts, and an empty list would invite a removal that cannot work.
         */
        pluginList(request) {
            return this.services.plugins.list(request);
        }
        /** Remove one plugin from the profile (takes effect on the next start). */
        pluginRemove(request) {
            return this.services.plugins.remove(request);
        }
        /** Update one plugin to its spec's head (takes effect on the next start). */
        pluginUpdate(request) {
            return this.services.plugins.update(request);
        }
    };
})();
export { WebEnhancedGateway };
