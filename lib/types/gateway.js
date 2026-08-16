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
import { deleteFileView, countTextLines, listDirectory, readFileView, searchFiles, writeFileView } from "./files.js";
import { GitClient } from "./git.js";
import { officePreviewView } from "./office.js";
import { PnpmRunner, pnpmFailureCode } from "./pnpm.js";
import { ModelsDevPricing } from "./pricing.js";
import { TerminalHost } from "./terminal.js";
import { findProfileDir, readInventory } from "./profile.js";
import { classifyVisionHttpError, DEFAULT_VISION_MARKER, DEFAULT_VISION_PROMPT, resolveVisionApiKey, VISION_SETTINGS_NS } from "./vision.js";
/** Settings keys the Vision tab may edit (everything else is read-only). */
const VISION_CONFIG_EDITABLE_KEYS = new Set([
    'enabled', 'patchAdmission', 'provider', 'model', 'harnessModels', 'prompt', 'marker',
    'baseUrl', 'apiKey', 'endpointModel', 'endpointModels', 'anonymous', 'timeoutMs',
    'maxTokens', 'autoLocalOllama', 'localOllamaModel', 'localOllamaUrl',
    'cacheLimit', 'cooldownMs',
]);
export const Config = z.object({
    cronIntervalMs: z.number().default(30_000),
    balanceApiKeyEnv: z.string().default('DEEPSEEK_API_KEY'),
    balanceCacheTtlMs: z.number().default(60_000),
    balanceBaseUrl: z.string().default('https://api.deepseek.com'),
    balanceProviders: z.array(z.string()).default(['deepseek-official']),
    modelsDevUrl: z.string().default('https://models.dev/api.json'),
    modelsDevCacheTtlMs: z.number().default(21_600_000),
    modelsDevTimeoutMs: z.number().default(10_000),
    // models.dev names the official vendor `deepseek`; the route id is `deepseek-official`.
    pricingProviderMap: z.dict(z.string()).default({ 'deepseek-official': 'deepseek' }),
    skipDirs: z.array(z.string()).default(['node_modules']),
    readMaxBytes: z.number().default(1_048_576),
    writeMaxBytes: z.number().default(2_097_152),
    binaryMaxBytes: z.number().default(5_242_880),
    gitOutputMaxBytes: z.number().default(262_144),
    gitMaxCount: z.number().default(100),
    // Caps the uncommitted file list, and with it how many untracked files are
    // read to count their lines. A repository with thousands of untracked files
    // would otherwise turn one graph open into thousands of reads.
    gitWorkingMaxFiles: z.number().default(300),
    searchMaxDepth: z.number().default(8),
    searchMaxEntries: z.number().default(200),
    officeMaxBytes: z.number().default(5_242_880),
    browseMaxEntries: z.number().default(500),
    pluginOpTimeoutMs: z.number().default(300_000),
    // Located by walking up from this module by default; naming it explicitly is
    // for a deployment whose profile is not an ancestor of the loaded plugin.
    profileDir: z.string().default(''),
    // Image understanding. The interception core is transparent (images stay in
    // the UI, text-only models see the description) and the transcription engine
    // tries, in order: DSH-configured vision models, local Ollama, then the
    // configured OpenAI-compatible endpoint with its fallback chain.
    visionEnabled: z.boolean().default(true),
    visionPatchAdmission: z.boolean().default(true),
    visionPrompt: z.string().default(DEFAULT_VISION_PROMPT),
    visionMarker: z.string().default(DEFAULT_VISION_MARKER),
    visionProvider: z.string().default(''),
    visionModel: z.string().default(''),
    visionHarnessModels: z.array(z.object({
        provider: z.string(),
        model: z.string(),
    })).default([]),
    visionBaseUrl: z.string().default(''),
    visionApiKey: z.string().role('secret').default(''),
    visionApiKeyEnv: z.string().default('VISION_API_KEY'),
    visionEndpointModel: z.string().default(''),
    visionEndpointModels: z.array(z.string()).default([]),
    visionAnonymous: z.boolean().default(false),
    visionTimeoutMs: z.number().default(120_000),
    visionMaxTokens: z.number().default(4_096),
    visionAutoLocalOllama: z.boolean().default(true),
    visionLocalOllamaModel: z.string().default(''),
    visionLocalOllamaUrl: z.string().default('http://localhost:11434/v1'),
    visionFallbackModels: z.array(z.object({
        model: z.string(),
        baseURL: z.string().default(''),
        apiKey: z.string().role('secret').default(''),
        anonymous: z.boolean().default(false),
        timeoutMs: z.number().default(0),
    })).default([]),
    visionCacheLimit: z.number().default(200),
    visionCooldownMs: z.number().default(60_000),
});
/** Field defaults applied when the gateway is constructed directly. */
export function resolveConfig(config) {
    return {
        cronIntervalMs: config.cronIntervalMs ?? 30_000,
        balanceApiKeyEnv: config.balanceApiKeyEnv ?? 'DEEPSEEK_API_KEY',
        balanceCacheTtlMs: config.balanceCacheTtlMs ?? 60_000,
        balanceBaseUrl: config.balanceBaseUrl ?? 'https://api.deepseek.com',
        balanceProviders: config.balanceProviders ?? ['deepseek-official'],
        modelsDevUrl: config.modelsDevUrl ?? 'https://models.dev/api.json',
        modelsDevCacheTtlMs: config.modelsDevCacheTtlMs ?? 21_600_000,
        modelsDevTimeoutMs: config.modelsDevTimeoutMs ?? 10_000,
        pricingProviderMap: config.pricingProviderMap ?? { 'deepseek-official': 'deepseek' },
        skipDirs: config.skipDirs ?? ['node_modules'],
        readMaxBytes: config.readMaxBytes ?? 1_048_576,
        writeMaxBytes: config.writeMaxBytes ?? 2_097_152,
        binaryMaxBytes: config.binaryMaxBytes ?? 5_242_880,
        gitOutputMaxBytes: config.gitOutputMaxBytes ?? 262_144,
        gitMaxCount: config.gitMaxCount ?? 100,
        gitWorkingMaxFiles: config.gitWorkingMaxFiles ?? 300,
        searchMaxDepth: config.searchMaxDepth ?? 8,
        searchMaxEntries: config.searchMaxEntries ?? 200,
        officeMaxBytes: config.officeMaxBytes ?? 5_242_880,
        browseMaxEntries: config.browseMaxEntries ?? 500,
        pluginOpTimeoutMs: config.pluginOpTimeoutMs ?? 300_000,
        profileDir: config.profileDir ?? '',
        visionEnabled: config.visionEnabled ?? true,
        visionPatchAdmission: config.visionPatchAdmission ?? true,
        visionPrompt: config.visionPrompt ?? DEFAULT_VISION_PROMPT,
        visionMarker: config.visionMarker ?? DEFAULT_VISION_MARKER,
        visionProvider: config.visionProvider ?? '',
        visionModel: config.visionModel ?? '',
        visionHarnessModels: config.visionHarnessModels ?? [],
        visionBaseUrl: config.visionBaseUrl ?? '',
        visionApiKey: config.visionApiKey ?? '',
        visionApiKeyEnv: config.visionApiKeyEnv ?? 'VISION_API_KEY',
        visionEndpointModel: config.visionEndpointModel ?? '',
        visionEndpointModels: config.visionEndpointModels ?? [],
        visionAnonymous: config.visionAnonymous ?? false,
        visionTimeoutMs: config.visionTimeoutMs ?? 120_000,
        visionMaxTokens: config.visionMaxTokens ?? 4_096,
        visionAutoLocalOllama: config.visionAutoLocalOllama ?? true,
        visionLocalOllamaModel: config.visionLocalOllamaModel ?? '',
        visionLocalOllamaUrl: config.visionLocalOllamaUrl ?? 'http://localhost:11434/v1',
        visionFallbackModels: config.visionFallbackModels ?? [],
        visionCacheLimit: config.visionCacheLimit ?? 200,
        visionCooldownMs: config.visionCooldownMs ?? 60_000,
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
    let _pricingGet_decorators;
    let _visionStatus_decorators;
    let _visionConfigGet_decorators;
    let _visionConfigSet_decorators;
    let _visionEndpointModels_decorators;
    let _terminalOpen_decorators;
    let _terminalSend_decorators;
    let _terminalRead_decorators;
    let _terminalSignal_decorators;
    let _terminalClose_decorators;
    let _terminalList_decorators;
    let _gitBranches_decorators;
    let _gitLog_decorators;
    let _gitCommit_decorators;
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
            _visionStatus_decorators = [Remote('visionStatus')];
            _visionConfigGet_decorators = [Remote('visionConfigGet')];
            _visionConfigSet_decorators = [Remote('visionConfigSet')];
            _visionEndpointModels_decorators = [Remote('visionEndpointModels')];
            _terminalOpen_decorators = [Remote('terminalOpen')];
            _terminalSend_decorators = [Remote('terminalSend')];
            _terminalRead_decorators = [Remote('terminalRead')];
            _terminalSignal_decorators = [Remote('terminalSignal')];
            _terminalClose_decorators = [Remote('terminalClose')];
            _terminalList_decorators = [Remote('terminalList')];
            _gitBranches_decorators = [Remote('gitBranches')];
            _gitLog_decorators = [Remote('gitLog')];
            _gitCommit_decorators = [Remote('gitCommit')];
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
            __esDecorate(this, null, _visionStatus_decorators, { kind: "method", name: "visionStatus", static: false, private: false, access: { has: obj => "visionStatus" in obj, get: obj => obj.visionStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _visionConfigGet_decorators, { kind: "method", name: "visionConfigGet", static: false, private: false, access: { has: obj => "visionConfigGet" in obj, get: obj => obj.visionConfigGet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _visionConfigSet_decorators, { kind: "method", name: "visionConfigSet", static: false, private: false, access: { has: obj => "visionConfigSet" in obj, get: obj => obj.visionConfigSet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _visionEndpointModels_decorators, { kind: "method", name: "visionEndpointModels", static: false, private: false, access: { has: obj => "visionEndpointModels" in obj, get: obj => obj.visionEndpointModels }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _terminalOpen_decorators, { kind: "method", name: "terminalOpen", static: false, private: false, access: { has: obj => "terminalOpen" in obj, get: obj => obj.terminalOpen }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _terminalSend_decorators, { kind: "method", name: "terminalSend", static: false, private: false, access: { has: obj => "terminalSend" in obj, get: obj => obj.terminalSend }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _terminalRead_decorators, { kind: "method", name: "terminalRead", static: false, private: false, access: { has: obj => "terminalRead" in obj, get: obj => obj.terminalRead }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _terminalSignal_decorators, { kind: "method", name: "terminalSignal", static: false, private: false, access: { has: obj => "terminalSignal" in obj, get: obj => obj.terminalSignal }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _terminalClose_decorators, { kind: "method", name: "terminalClose", static: false, private: false, access: { has: obj => "terminalClose" in obj, get: obj => obj.terminalClose }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _terminalList_decorators, { kind: "method", name: "terminalList", static: false, private: false, access: { has: obj => "terminalList" in obj, get: obj => obj.terminalList }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _gitBranches_decorators, { kind: "method", name: "gitBranches", static: false, private: false, access: { has: obj => "gitBranches" in obj, get: obj => obj.gitBranches }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _gitLog_decorators, { kind: "method", name: "gitLog", static: false, private: false, access: { has: obj => "gitLog" in obj, get: obj => obj.gitLog }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _gitCommit_decorators, { kind: "method", name: "gitCommit", static: false, private: false, access: { has: obj => "gitCommit" in obj, get: obj => obj.gitCommit }, metadata: _metadata }, null, _instanceExtraInitializers);
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
        resolved = __runInitializers(this, _instanceExtraInitializers);
        balance;
        board;
        pricing;
        /** Resolved lazily: the walk is filesystem work no other capability needs. */
        profileDirCache;
        /** The web terminal's server half over the host's native PTY registry. */
        terminal;
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
            this.terminal = new TerminalHost(ctx);
            this.pricing = new ModelsDevPricing({
                url: this.resolved.modelsDevUrl,
                ttlMs: this.resolved.modelsDevCacheTtlMs,
                timeoutMs: this.resolved.modelsDevTimeoutMs,
                providerMap: this.resolved.pricingProviderMap,
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
        /** models.dev pricing for one model route (cached, USD per 1M tokens). */
        async pricingGet(request) {
            try {
                const pricing = await this.pricing.pricingFor(request.provider, request.model);
                if (pricing === undefined) {
                    return {
                        error: {
                            code: 'pricing-not-found',
                            message: `models.dev has no pricing for '${request.provider}/${request.model}'`,
                        },
                    };
                }
                return { provider: request.provider, model: request.model, pricing };
            }
            catch (error) {
                return { error: this.errorOf(error, 'pricing-error') };
            }
        }
        /**
         * Live state of the image-understanding integration: whether the admission
         * patch is active, which vision models/endpoints the transcription engine
         * can use, and its last failure. Read lazily so a deployment that mounts no
         * integration reports that state instead of throwing.
         */
        async visionStatus() {
            try {
                return await this.visionStatusView();
            }
            catch (error) {
                return { error: this.errorOf(error, 'vision-status') };
            }
        }
        /**
         * The editable vision configuration plus the picker options and the live
         * status, all in one read. The API key is never returned.
         */
        async visionConfigGet() {
            try {
                const settings = this.visionSettings();
                if (settings === undefined) {
                    return { error: { code: 'vision-settings-unavailable', message: 'the settings service is not mounted in this deployment' } };
                }
                const raw = settings.get(VISION_SETTINGS_NS);
                if (raw === undefined || typeof raw !== 'object') {
                    return { error: { code: 'vision-settings-unmanaged', message: `settings namespace '${VISION_SETTINGS_NS}' is not registered` } };
                }
                const descriptor = settings.describe().find(entry => entry.ns === VISION_SETTINGS_NS);
                return {
                    managed: true,
                    writable: settings.writable,
                    revision: descriptor?.revision ?? null,
                    enabled: raw.enabled,
                    patchAdmission: raw.patchAdmission,
                    provider: raw.provider,
                    model: raw.model,
                    harnessModels: raw.harnessModels,
                    prompt: raw.prompt,
                    marker: raw.marker,
                    baseUrl: raw.baseUrl,
                    apiKeySet: raw.apiKey !== '',
                    apiKeyEnv: raw.apiKeyEnv,
                    endpointModel: raw.endpointModel,
                    endpointModels: raw.endpointModels,
                    anonymous: raw.anonymous,
                    timeoutMs: raw.timeoutMs,
                    maxTokens: raw.maxTokens,
                    autoLocalOllama: raw.autoLocalOllama,
                    localOllamaModel: raw.localOllamaModel,
                    localOllamaUrl: raw.localOllamaUrl,
                    fallbackCount: raw.fallbackModels.length,
                    cacheLimit: raw.cacheLimit,
                    cooldownMs: raw.cooldownMs,
                    providers: await this.visionProviderOptions(),
                    status: await this.visionStatusView(),
                };
            }
            catch (error) {
                return { error: this.errorOf(error, 'vision-config') };
            }
        }
        /**
         * Save one vision-config patch into the settings namespace. The namespace
         * owner (`VisionInterceptor`) watches the commit and reconfigures live, so
         * no restart is needed; `expectedRevision` gives the save CAS semantics.
         */
        async visionConfigSet(request) {
            try {
                const settings = this.visionSettings();
                if (settings === undefined) {
                    return { error: { code: 'vision-settings-unavailable', message: 'the settings service is not mounted in this deployment' } };
                }
                if (!settings.writable) {
                    return { error: { code: 'vision-settings-readonly', message: 'the settings provider is read-only' } };
                }
                const raw = settings.get(VISION_SETTINGS_NS);
                if (raw === undefined) {
                    return { error: { code: 'vision-settings-unmanaged', message: `settings namespace '${VISION_SETTINGS_NS}' is not registered` } };
                }
                const patch = {};
                const source = request.patch;
                if (source !== undefined) {
                    for (const [key, value] of Object.entries(source)) {
                        if (VISION_CONFIG_EDITABLE_KEYS.has(key))
                            patch[key] = value;
                    }
                }
                await settings.update(VISION_SETTINGS_NS, patch, request.expectedRevision);
                const revision = settings.describe().find(entry => entry.ns === VISION_SETTINGS_NS)?.revision ?? 0;
                return { ok: true, revision };
            }
            catch (error) {
                const conflict = error.code === 'SETTINGS_CONFLICT';
                return { error: this.errorOf(error, conflict ? 'vision-config-conflict' : 'vision-config-save') };
            }
        }
        /**
         * Fetch the dedicated endpoint's `/models` listing. A typed key is one-shot
         * for this call; otherwise the SAVED key (or its env fallback) is used. The
         * key is never stored, logged, or returned.
         */
        async visionEndpointModels(request) {
            try {
                const saved = this.visionSettings()?.get(VISION_SETTINGS_NS);
                const baseUrl = (request.baseUrl?.trim() ?? saved?.baseUrl ?? '').trim();
                if (baseUrl === '') {
                    return {
                        error: {
                            code: 'vision-endpoint-missing',
                            message: 'set the dedicated API base URL first (in the form or in the saved settings)',
                        },
                    };
                }
                const attempt = {
                    apiKey: request.apiKey !== undefined && request.apiKey !== '' ? request.apiKey : saved?.apiKey ?? '',
                    anonymous: request.anonymous ?? saved?.anonymous ?? false,
                };
                const apiKey = resolveVisionApiKey(attempt, baseUrl, saved?.apiKeyEnv ?? 'VISION_API_KEY');
                const timeoutMs = Math.min(saved?.timeoutMs ?? 120_000, 15_000);
                const response = await fetch(`${baseUrl.replace(/\/+$/u, '')}/models`, {
                    headers: { ...(apiKey === '' ? {} : { authorization: `Bearer ${apiKey}` }) },
                    signal: AbortSignal.timeout(timeoutMs),
                });
                if (!response.ok) {
                    const body = await response.text();
                    const { kind, hint } = classifyVisionHttpError(response.status, body);
                    return {
                        error: {
                            code: `vision-endpoint-${kind}`,
                            message: `model listing failed at ${baseUrl}: ${body.slice(0, 200)} — ${hint}`,
                        },
                    };
                }
                let payload;
                try {
                    payload = JSON.parse(await response.text());
                }
                catch {
                    return { error: { code: 'vision-endpoint-parse', message: 'the endpoint returned a non-JSON model listing' } };
                }
                const listed = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : [];
                const models = [];
                let truncated = false;
                for (const entry of listed) {
                    const id = entry?.id;
                    if (typeof id !== 'string' || id.trim() === '')
                        continue;
                    const name = entry?.name;
                    models.push({ id: id.trim(), name: typeof name === 'string' && name.trim() !== '' ? name.trim() : id.trim() });
                    if (models.length >= 200) {
                        truncated = listed.length > 200;
                        break;
                    }
                }
                return { baseUrl, models, truncated };
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                const aborted = error instanceof Error && error.name === 'TimeoutError' || /aborted due to timeout|timed out/iu.test(message);
                return {
                    error: this.errorOf(error, aborted ? 'vision-endpoint-timeout' : 'vision-endpoint-fetch'),
                };
            }
        }
        // ── terminal ─────────────────────────────────────────────────────────────
        /** Open one PTY owned by the conversation's live agent, rooted in the workspace. */
        async terminalOpen(request) {
            const root = this.workspaceRootFor(request.workspaceId);
            if (root === null) {
                return { error: { code: 'workspace-not-found', message: `workspace '${String(request.workspaceId)}' does not exist` } };
            }
            return this.terminal.open(request, root);
        }
        /** Send one line of input and await the backend's wait boundary. */
        terminalSend(request) {
            return Promise.resolve(this.terminal.send(request));
        }
        /** Read one bounded page of retained scrollback. */
        terminalRead(request) {
            return this.terminal.read(request);
        }
        /** Deliver one permitted signal to the foreground process group. */
        async terminalSignal(request) {
            return this.terminal.signal(request);
        }
        /** Close one session and drop it from the owner's registry. */
        async terminalClose(request) {
            return this.terminal.close(request);
        }
        /** List the conversation agent's live sessions. */
        async terminalList(request) {
            return this.terminal.list(request.ownerSessionId);
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
        /**
         * The uncommitted state of the work tree: staged, unstaged, and untracked
         * files with their line counts, plus the HEAD the graph attaches them to.
         */
        async gitWorking(request) {
            return this.withGit(request.workspaceId, async (client, root) => ({
                working: await client.working(this.resolved.gitWorkingMaxFiles, path => countTextLines(root, path, this.fsLimits)),
            }));
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
        /** The settings provider the vision config remotes read and write. */
        visionSettings() {
            return this.ctx.get('settings', false);
        }
        /** The live integration status, or the explicit unmounted state. */
        async visionStatusView() {
            const service = this.ctx.get('visionIntegration', false);
            if (service === undefined) {
                return {
                    mounted: false,
                    enabled: false,
                    patchAdmission: false,
                    admissionActive: false,
                    harnessModels: [],
                    endpointConfigured: false,
                    endpointModel: null,
                    apiKeySource: 'unset',
                    ollamaDetected: false,
                    ollamaModel: null,
                    cacheSize: 0,
                    lastError: 'the vision integration service is not mounted in this deployment',
                    failures: [],
                };
            }
            return await service.status();
        }
        /** Providers and models for the Vision tab, from the model picker's source. */
        async visionProviderOptions() {
            const llm = this.ctx.get('llm', false);
            if (llm === undefined || typeof llm.listProviders !== 'function')
                return [];
            const options = [];
            for (const provider of llm.listProviders()) {
                try {
                    const models = await llm.listModels(provider.id);
                    options.push({
                        provider: provider.id,
                        name: provider.name ?? provider.id,
                        models: models.map((model) => ({
                            id: model.id,
                            name: model.name ?? model.id,
                            supportsImage: (model.inputModalities ?? []).includes('image'),
                        })),
                    });
                }
                catch {
                    // A provider that cannot answer its model list offers no options.
                }
            }
            return options;
        }
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
                return await fn(new GitClient(this.ctx.subprocess, root, this.gitLimits), root);
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
