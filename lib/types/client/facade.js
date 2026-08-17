/**
 * Remote envelope adapter.
 *
 * A mounted Typert namespace method does NOT resolve to the host's business
 * payload — it resolves to `RemoteResult<T>`, the `{ ok: true, value }` /
 * `{ ok: false, error }` envelope. The Remote face folds carrier failures
 * (offline, an unmounted host method, a rejected payload) into that error
 * branch rather than rejecting, so a component that reads the resolved value
 * as if it were the payload sees `undefined` fields instead of a failure.
 *
 * This adapter is the one place that opens the envelope. Every method comes
 * back as this plugin's own success-or-`{ error }` union, which is what the
 * components already narrow on, so a transport failure renders exactly like a
 * business failure instead of crashing the slot entry.
 * @module dsh-web-enhanced/src/client/facade
 */
/** Project a transport failure onto this plugin's error payload. */
function apiErrorOf(failure) {
    return { code: failure.code, message: failure.message };
}
/**
 * Open one envelope, folding a transport failure into the `{ error }` branch
 * every gateway result already carries.
 * @param settled - the resolved envelope.
 * @returns the payload, or the error branch.
 */
function open(settled) {
    return settled.ok ? settled.value : { error: apiErrorOf(settled.error) };
}
/**
 * Wrap a mounted namespace into the facade components call.
 * @param raw - the mounted `remote.webEnhanced` namespace.
 * @param now - clock for the balance fallback's `cachedAt`.
 * @returns the envelope-free facade.
 */
export function createRemoteFacade(raw, now = Date.now) {
    return {
        taskList: async () => open(await raw.taskList()),
        taskCreate: async (request) => open(await raw.taskCreate(request)),
        taskUpdate: async (request) => open(await raw.taskUpdate(request)),
        taskRemove: async (request) => open(await raw.taskRemove(request)),
        taskRun: async (request) => open(await raw.taskRun(request)),
        // BalanceView is not a union — it carries its own optional `error` — so a
        // transport failure becomes an unavailable view rather than a foreign
        // shape. It stays `applicable`: an unreachable host says nothing about
        // which channel the session runs on, and hiding the line on a transport
        // blip would read as "this model has no balance".
        balanceGet: async (request) => {
            const settled = await raw.balanceGet(request);
            return settled.ok
                ? settled.value
                : { applicable: true, isAvailable: false, infos: [], cachedAt: now(), error: apiErrorOf(settled.error) };
        },
        pricingGet: async (request) => open(await raw.pricingGet(request)),
        modelRouteDescribe: async (request) => open(await raw.modelRouteDescribe(request)),
        deepseekRateGet: async (request) => open(await raw.deepseekRateGet(request)),
        // OpencodeGoUsageView carries its own optional `error`, so a carrier
        // failure becomes an unavailable view instead of a foreign shape.
        opencodeGoUsageGet: async () => {
            const settled = await raw.opencodeGoUsageGet();
            return settled.ok
                ? settled.value
                : {
                    provider: 'opencode-go',
                    plan: 'OpenCode Go',
                    windows: [],
                    fetchedAt: null,
                    error: apiErrorOf(settled.error),
                };
        },
        visionStatus: async () => open(await raw.visionStatus()),
        visionConfigGet: async () => open(await raw.visionConfigGet()),
        visionConfigSet: async (request) => open(await raw.visionConfigSet(request)),
        visionEndpointModels: async (request) => open(await raw.visionEndpointModels(request)),
        modelRetryGet: async () => open(await raw.modelRetryGet()),
        modelRetrySet: async (request) => open(await raw.modelRetrySet(request)),
        globalPromptGet: async () => open(await raw.globalPromptGet()),
        globalPromptSet: async (request) => open(await raw.globalPromptSet(request)),
        gitBranches: async (request) => open(await raw.gitBranches(request)),
        gitLog: async (request) => open(await raw.gitLog(request)),
        gitCommit: async (request) => open(await raw.gitCommit(request)),
        gitCommitDiff: async (request) => open(await raw.gitCommitDiff(request)),
        gitWorking: async (request) => open(await raw.gitWorking(request)),
        gitCheckout: async (request) => open(await raw.gitCheckout(request)),
        gitStatus: async (request) => open(await raw.gitStatus(request)),
        gitDiff: async (request) => open(await raw.gitDiff(request)),
        gitStage: async (request) => open(await raw.gitStage(request)),
        gitUnstage: async (request) => open(await raw.gitUnstage(request)),
        gitDiscard: async (request) => open(await raw.gitDiscard(request)),
        fsList: async (request) => open(await raw.fsList(request)),
        fsSearch: async (request) => open(await raw.fsSearch(request)),
        fsRead: async (request) => open(await raw.fsRead(request)),
        fsWrite: async (request) => open(await raw.fsWrite(request)),
        fsDelete: async (request) => open(await raw.fsDelete(request)),
        fsOfficePreview: async (request) => open(await raw.fsOfficePreview(request)),
        fsBrowse: async (request) => open(await raw.fsBrowse(request)),
        pluginList: async (request) => open(await raw.pluginList(request)),
        pluginRemove: async (request) => open(await raw.pluginRemove(request)),
        pluginUpdate: async (request) => open(await raw.pluginUpdate(request)),
    };
}
