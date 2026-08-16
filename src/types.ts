/**
 * Wire and durable payload vocabulary of the web-enhanced host gateway.
 * Types only — the zod schemas live in `./schemas.ts` and the gateway in
 * `./gateway.ts`. Every payload here crosses the Typert wire, so fields stay
 * plain JSON values (brands are compile-time only).
 * @module dsh-web-enhanced/src/types
 */

import type { Branded } from '@deepseek-ai/dsh-brand'
import type { SessionId } from '@deepseek-ai/dsh-session'
import type { WorkspaceId } from '@deepseek-ai/dsh-workspace'

export type { WorkspaceId } from '@deepseek-ai/dsh-workspace'

/** Identifies one task board record. */
export type TaskId = Branded<'TaskId'>

/** Task board column: planned, todo, running, done, or failed. */
export type TaskStatus = 'planned' | 'todo' | 'running' | 'done' | 'failed'

/** Structured outcome of one task execution. */
export interface TaskResult {
  /** `turn/end` reason kind when the run reached quiescence. */
  readonly reasonKind?: 'completed' | 'error' | 'interrupted'
  /** Last assistant text of the run, when any. */
  readonly summary?: string
  /** Machine code of a failure (turn error, host restart, execution fault). */
  readonly errorCode?: string
  /** Human message of a failure. */
  readonly errorMessage?: string
}

/** Durable task board record (storage-domain table value). */
export interface TaskRecord {
  readonly id: TaskId
  readonly title: string
  readonly prompt: string
  readonly status: TaskStatus
  /** Five-field cron expression, or null for manual tasks. */
  readonly cron: string | null
  /** Next scheduled run instant (ms epoch), when the task has a cron. */
  readonly nextRunAt: number | null
  readonly workspaceId: WorkspaceId | null
  readonly sessionId: SessionId | null
  readonly result: TaskResult | null
  readonly createdAt: number
  readonly updatedAt: number
  readonly lastRunAt: number | null
}

/** Business error carried inside a result (never a thrown exception). */
export interface ApiError {
  readonly code: string
  readonly message: string
}

export type TaskListResult = { readonly tasks: readonly TaskRecord[] } | { readonly error: ApiError }
export type TaskCreateResult = { readonly task: TaskRecord } | { readonly error: ApiError }
export type TaskUpdateResult = { readonly task: TaskRecord } | { readonly error: ApiError }
export type TaskRemoveResult = { readonly removed: boolean } | { readonly error: ApiError }
export type TaskRunResult = { readonly started: boolean; readonly sessionId: SessionId | null } | { readonly error: ApiError }

export interface TaskCreateRequest {
  readonly title: string
  readonly prompt: string
  readonly cron?: string
  readonly workspaceId?: string | null
}

export interface TaskUpdateRequest {
  readonly id: string
  readonly title?: string
  readonly prompt?: string
  readonly cron?: string | null
  readonly status?: 'planned' | 'todo'
  /** Rebind the task's workspace; `null` clears it, omitted keeps the current one. */
  readonly workspaceId?: string | null
}

export interface TaskRemoveRequest { readonly id: string }
export interface TaskRunRequest { readonly id: string; readonly workspaceId?: string | null }

/** One branch with its current marker. */
export interface GitBranchView {
  readonly name: string
  readonly current: boolean
}

/** One commit for the lane renderer. */
export interface GitCommitView {
  readonly hash: string
  readonly parents: readonly string[]
  readonly refs: readonly string[]
  readonly author: string
  readonly date: number
  readonly subject: string
}

/** One file a commit touched, with its line counts. */
export interface GitCommitFileView {
  readonly path: string
  /** Added lines; `null` for a binary file, which git reports as `-`. */
  readonly added: number | null
  /** Removed lines; `null` for a binary file. */
  readonly removed: number | null
}

/** One commit's full identity and per-file change counts. */
export interface GitCommitDetailView {
  readonly hash: string
  readonly parents: readonly string[]
  readonly author: string
  readonly email: string
  readonly date: number
  readonly subject: string
  readonly body: string
  readonly files: readonly GitCommitFileView[]
}

/**
 * How one working-tree file differs, i.e. which diff it came out of.
 *
 * The three are not exclusive per path: a file staged and then edited again
 * appears once as `staged` (index vs HEAD) and once as `unstaged` (worktree vs
 * index), with different counts. Collapsing them would invent a third number
 * git never computed.
 */
export type GitWorkingState = 'staged' | 'unstaged' | 'untracked'

/** One uncommitted file with its line counts. */
export interface GitWorkingFileView {
  readonly path: string
  readonly state: GitWorkingState
  /** Added lines; `null` when unknown (binary, or an untracked file over the read cap). */
  readonly added: number | null
  /** Removed lines; always `null` for an untracked file, which has no old side. */
  readonly removed: number | null
}

/** The uncommitted state of a work tree, as the graph's top row shows it. */
export interface GitWorkingView {
  /**
   * HEAD's commit hash, so the graph can attach the row to the commit it sits
   * on. Empty in a repository with no commits yet.
   */
  readonly head: string
  readonly files: readonly GitWorkingFileView[]
  /** Totals BEFORE the file cap, so a truncated list still reports the truth. */
  readonly staged: number
  readonly unstaged: number
  readonly untracked: number
  /** True when `files` was cut at the cap. */
  readonly truncated: boolean
}

/**
 * One porcelain-v1 status entry. `path` is always the entry's CURRENT path,
 * so it is what stage/unstage/discard pass to git; a rename or copy carries
 * its source separately in `origPath` for display (`origPath -> path`).
 */
export interface GitStatusEntry {
  readonly path: string
  /** Source path of a rename (`R`) or copy (`C`); absent otherwise. */
  readonly origPath?: string
  readonly staged: string
  readonly unstaged: string
}

export type GitBranchesResult = { readonly branches: readonly GitBranchView[] } | { readonly error: ApiError }
export type GitLogResult = { readonly commits: readonly GitCommitView[] } | { readonly error: ApiError }
export type GitCommitResult = { readonly commit: GitCommitDetailView } | { readonly error: ApiError }
export type GitWorkingResult = { readonly working: GitWorkingView } | { readonly error: ApiError }
export type GitCheckoutResult = { readonly ok: boolean; readonly message?: string } | { readonly error: ApiError }
export type GitStatusResult = { readonly entries: readonly GitStatusEntry[] } | { readonly error: ApiError }
export type GitDiffResult = { readonly text: string } | { readonly error: ApiError }
export type GitMutateResult = { readonly ok: boolean; readonly message?: string } | { readonly error: ApiError }

export interface GitBranchesRequest { readonly workspaceId: string }
export interface GitStatusRequest { readonly workspaceId: string }
export interface GitLogRequest {
  readonly workspaceId: string
  readonly maxCount?: number
  /**
   * Draw only this ref's history. Omitted walks every ref, which is the
   * graph's default view. This is the GRAPH's own filter — the composer's
   * branch strip switches the checked-out branch, a different operation.
   */
  readonly branch?: string
}
export interface GitCommitRequest { readonly workspaceId: string; readonly hash: string }
export interface GitWorkingRequest { readonly workspaceId: string }
export interface GitCheckoutRequest { readonly workspaceId: string; readonly branch: string }
export interface GitDiffRequest { readonly workspaceId: string; readonly path?: string; readonly staged?: boolean }
export interface GitMutateRequest { readonly workspaceId: string; readonly paths: readonly string[] }

/** One workspace-relative file entry. */
export interface FsEntryView {
  readonly name: string
  readonly path: string
  readonly kind: 'file' | 'dir'
  readonly size?: number
}

export type FsListResult = { readonly entries: readonly FsEntryView[] } | { readonly error: ApiError }
export type FsSearchResult = { readonly entries: readonly FsEntryView[] } | { readonly error: ApiError }
export type FsReadResult =
  | { readonly kind: 'text'; readonly content: string; readonly truncated: boolean; readonly size: number }
  | { readonly kind: 'binary'; readonly content: string; readonly truncated: boolean; readonly size: number }
  | { readonly error: ApiError }
export type FsWriteResult = { readonly ok: boolean } | { readonly error: ApiError }

export interface FsListRequest { readonly workspaceId: string; readonly path?: string }
export interface FsSearchRequest { readonly workspaceId: string; readonly query?: string; readonly path?: string }
export interface FsReadRequest { readonly workspaceId: string; readonly path: string }
export interface FsWriteRequest { readonly workspaceId: string; readonly path: string; readonly content: string }
export interface FsDeleteRequest { readonly workspaceId: string; readonly path: string }

/** One structural block of an Office document preview (never raw HTML). */
export type OfficeBlock =
  | { readonly type: 'h1' | 'h2' | 'h3'; readonly text: string }
  | { readonly type: 'p'; readonly text: string }
  | { readonly type: 'li'; readonly text: string }
  | { readonly type: 'table'; readonly rows: readonly (readonly string[])[] }

/** Office preview kinds the converter understands. */
export type OfficeKind = 'docx' | 'xlsx'

export type FsOfficePreviewResult =
  | { readonly kind: OfficeKind; readonly blocks: readonly OfficeBlock[]; readonly truncated: boolean }
  | { readonly error: ApiError }

export interface FsOfficePreviewRequest { readonly workspaceId: string; readonly path: string }

/** One entry of a host-wide browse level. */
export interface FsBrowseEntry {
  readonly name: string
  /** ABSOLUTE host path — this listing is not workspace-relative. */
  readonly path: string
  readonly kind: 'file' | 'dir'
  readonly size?: number
}

/** One browsed directory level, with its parent and the host home. */
export interface FsBrowseView {
  readonly path: string
  /** Parent directory, or null at a filesystem root. */
  readonly parent: string | null
  /** Host account home, so the browser can offer a stable starting point. */
  readonly home: string
  /**
   * Filesystem roots reachable only by jumping.
   *
   * Empty on POSIX, where walking up reaches the single root. On Windows this
   * is one entry per drive (`C:\`, `D:\`, …): the drives have no common
   * ancestor, so no amount of walking up leads from one to another.
   */
  readonly roots: readonly string[]
  readonly entries: readonly FsBrowseEntry[]
  /** True when the level was cut at the entry cap. */
  readonly truncated: boolean
}

export type FsBrowseResult = FsBrowseView | { readonly error: ApiError }

/** Browse one absolute directory; omitted path starts at the host home. */
export interface FsBrowseRequest { readonly path?: string }

/** One balance line of the DeepSeek account. */
export interface BalanceInfo {
  readonly currency: string
  readonly totalBalance: number
  readonly grantedBalance: number
  readonly toppedUpBalance: number
}

/** Result of the balance query; `error` is a field, never a throw. */
export interface BalanceView {
  /**
   * Whether this balance describes the account the session's current model
   * route bills. `false` hides the line: the number would be about a
   * different account than the one paying for the conversation.
   */
  readonly applicable: boolean
  readonly isAvailable: boolean
  readonly infos: readonly BalanceInfo[]
  readonly cachedAt: number
  readonly error?: ApiError
}

/** One balance query, naming the session's current model route. */
export interface BalanceGetRequest {
  /** Provider route of the current selection; omitted when the client has none yet. */
  readonly provider?: string
}

/** The balance itself, before the channel decision is folded in. */
export type BalanceReading = Omit<BalanceView, 'applicable'>

/** Per-million-token prices of one model, as models.dev publishes them. */
export interface ModelPricingView {
  /** Cache-miss input price, USD per 1M tokens. */
  readonly input: number
  /** Output price, USD per 1M tokens. */
  readonly output: number
  /** Cached-read price, USD per 1M tokens; null when not published. */
  readonly cacheRead: number | null
  /** Cache-write price, USD per 1M tokens; null when not published. */
  readonly cacheWrite: number | null
}

/** One models.dev pricing lookup for the session's current model route. */
export interface PricingGetRequest {
  readonly provider: string
  readonly model: string
}

/** Pricing lookup result; `error` is a field, never a throw. */
export interface PricingView {
  /** The provider route the request named (echoed for client-side cache keys). */
  readonly provider: string
  /** The model id the request named. */
  readonly model: string
  readonly pricing: ModelPricingView
}

export type PricingGetResult = PricingView | { readonly error: ApiError }

/** One display-name lookup for the balance line's provider/model group. */
export interface ModelRouteDescribeRequest {
  readonly provider: string
  readonly model: string
}

/** Directory display names matching the model picker, with raw ids echoed. */
export interface ModelRouteDescribeView {
  readonly provider: string
  readonly model: string
  readonly providerName: string
  readonly modelName: string
}

export type ModelRouteDescribeResult = ModelRouteDescribeView | { readonly error: ApiError }

/** One DeepSeek price window, CNY per one million tokens. */
export interface DeepSeekRateWindow {
  readonly inputCacheHit: number
  readonly inputCacheMiss: number
  readonly output: number
}

/** One DeepSeek billing-clock lookup for the session's current model. */
export interface DeepSeekRateGetRequest {
  readonly model: string
}

/** The current DeepSeek period and prices; `unknown` hides the period group. */
export interface DeepSeekRateView {
  readonly model: string
  readonly mode: 'peak-valley' | 'flat' | 'unknown'
  readonly period: 'peak' | 'offpeak' | 'flat'
  readonly currency: 'CNY'
  /** Prices active at `now`; null for models outside the table. */
  readonly prices: DeepSeekRateWindow | null
  /** Epoch ms of the next peak/off-peak switch; null for flat/unknown. */
  readonly nextSwitchAt: number | null
  /** Beijing `HH:MM` of the next switch. */
  readonly nextSwitchLabel: string | null
  /** Whether the next switch enters a peak window. */
  readonly nextIsPeak: boolean
  /** The instant the view describes. */
  readonly now: number
}

export type DeepSeekRateGetResult = DeepSeekRateView | { readonly error: ApiError }

/** One OpenCode Go usage window: rolling 5 hours, weekly, or monthly. */
export interface OpencodeGoWindow {
  readonly key: 'five_hour' | 'seven_day' | 'monthly'
  /** Used percent as published, 0–100. */
  readonly usedPercent: number
  /** Reset instant in epoch ms, or null when the API omitted it. */
  readonly resetsAt: number | null
}

/** OpenCode Go subscription usage; `error` is a field, never a throw. */
export interface OpencodeGoUsageView {
  readonly provider: 'opencode-go'
  readonly plan: 'OpenCode Go'
  readonly windows: readonly OpencodeGoWindow[]
  /** Last successful fetch; null until one succeeds. */
  readonly fetchedAt: number | null
  readonly error?: ApiError
}

/** One installed profile plugin. */
export interface PluginView {
  readonly name: string
  /** Dependency spec as written in the profile manifest. */
  readonly spec: string
  /** Installed version, or null when the package is not materialized. */
  readonly version: string | null
  readonly description: string | null
  /** Whether the installed package declares `dsh.bundle` (i.e. is a layer). */
  readonly bundle: boolean
  /** Whether the profile's layer list currently carries it. */
  readonly active: boolean
  /** True for this very plugin — removing it takes this UI with it. */
  readonly self: boolean
}

/** The profile's plugin inventory, or why there is none to show. */
export interface PluginListView {
  /** Absolute profile directory. */
  readonly profileDir: string
  /** Profile name (`dsh --profile <name>`). */
  readonly profileName: string
  readonly plugins: readonly PluginView[]
  /**
   * Layers that are not dependencies — the profile template's own bundles.
   * Listed for orientation; pnpm cannot remove what nothing depends on.
   */
  readonly templateBundles: readonly string[]
  /** True while an operation holds the single-flight lock. */
  readonly busy: boolean
}

export type PluginListResult = PluginListView | { readonly error: ApiError }

/**
 * Outcome of one plugin mutation.
 *
 * `restartRequired` is always true on success: Cordis composes the layer stack
 * at boot, so a rewritten `node_modules` describes the NEXT start, never the
 * running tree.
 */
export interface PluginMutateView {
  readonly ok: boolean
  /** Layer names added to `dsh.profile.bundles` by the reconciliation. */
  readonly added: readonly string[]
  /** Layer names removed from it. */
  readonly removed: readonly string[]
  /** Whether the deployment must restart before the change takes effect. */
  readonly restartRequired: boolean
  /** pnpm's own output, trimmed and bounded — shown verbatim on failure. */
  readonly output: string
}

export type PluginMutateResult = PluginMutateView | { readonly error: ApiError }

/** Address one installed plugin by package name. */
export interface PluginMutateRequest { readonly name: string }

/** List the profile's plugins; takes no arguments beyond the envelope. */
export interface PluginListRequest { readonly refresh?: boolean }

/** One vision-capable provider/model route the harness can transcribe with. */
export interface VisionHarnessModelView {
  readonly provider: string
  readonly model: string
}

/** One transcription attempt that failed, kept for the Settings tab. */
export interface VisionAttemptFailureView {
  /** Unix epoch ms. */
  readonly time: number
  /** Which source was being tried. */
  readonly source: 'dsh' | 'ollama' | 'endpoint'
  /** The model or endpoint that failed (never contains secrets). */
  readonly label: string
  readonly message: string
}

/** Live state of the image-understanding integration, shown in Settings. */
export interface VisionStatusView {
  /** False when the integration service is absent from this deployment. */
  readonly mounted: boolean
  readonly enabled: boolean
  readonly patchAdmission: boolean
  /** Whether the `resolveModelInfo` admission patch is on the live service. */
  readonly admissionActive: boolean
  /** Vision models discovered from DSH-configured providers (auto path). */
  readonly harnessModels: readonly VisionHarnessModelView[]
  /** Whether `visionBaseUrl` + `visionEndpointModel` name a usable endpoint. */
  readonly endpointConfigured: boolean
  /** The configured endpoint model, or null when not configured. */
  readonly endpointModel: string | null
  /** Where the endpoint API key comes from (never the key itself). */
  readonly apiKeySource: 'config' | 'env' | 'none-needed' | 'unset'
  readonly ollamaDetected: boolean
  readonly ollamaModel: string | null
  /** In-process transcription cache entries (content-hash keyed). */
  readonly cacheSize: number
  /** The most recent transcription failure, or null. */
  readonly lastError: string | null
  /** Recent per-attempt failures, newest first (bounded, in-process). */
  readonly failures: readonly VisionAttemptFailureView[]
}

export type VisionStatusResult = VisionStatusView | { readonly error: ApiError }

/**
 * The DeepSeek provider's model-request retry policy, as the Settings tab
 * edits it. `maxRetries` is null when the provider is configured for
 * unbounded (`always`) retries; saving a number switches it to bounded normal
 * mode.
 */
export interface ModelRetryConfigView {
  readonly provider: 'deepseek-official'
  /** Whether the llm-deepseek settings namespace is registered. */
  readonly managed: boolean
  readonly writable: boolean
  /** CAS revision; send it back with the next save. */
  readonly revision: number | null
  readonly mode: 'normal' | 'always'
  /** null = retries every failure until success, cancellation, or disposal. */
  readonly maxRetries: number | null
  readonly initialDelayMs: number
  readonly maxDelayMs: number
  readonly jitterRatio: number
}

export type ModelRetryGetResult = { readonly config: ModelRetryConfigView } | { readonly error: ApiError }

/** One save, carrying the revision the form loaded. */
export interface ModelRetrySetRequest {
  readonly maxRetries: number
  readonly expectedRevision?: number
}

/** Successful save; `revision` is the new CAS value. */
export interface ModelRetrySetView {
  readonly ok: true
  readonly revision: number
}

export type ModelRetrySetResult = ModelRetrySetView | { readonly error: ApiError }

/** One model a DSH provider offers, with its advertised image capability. */
export interface VisionModelOptionView {
  readonly id: string
  readonly name: string
  readonly supportsImage: boolean
}

/** One DSH provider route and its model list (the model-picker data source). */
export interface VisionProviderOptionView {
  readonly provider: string
  readonly name: string
  readonly models: readonly VisionModelOptionView[]
}

/**
 * The user-editable vision configuration, as the Settings tab renders it.
 * `apiKey` is never returned — only whether one is set.
 */
export interface VisionConfigView {
  /** Whether the settings namespace is registered in this deployment. */
  readonly managed: boolean
  readonly writable: boolean
  /** CAS revision; send it back with the next save. */
  readonly revision: number | null
  readonly enabled: boolean
  readonly patchAdmission: boolean
  /** Empty = auto-detect DSH vision models. */
  readonly provider: string
  readonly model: string
  /**
   * The user-selected DSH model pool, tried in order. Non-empty replaces
   * auto-detection (the pinned pair above still goes first).
   */
  readonly harnessModels: readonly VisionHarnessModelView[]
  readonly prompt: string
  readonly marker: string
  /** Dedicated transcription endpoint (never touches DSH channels). */
  readonly baseUrl: string
  readonly apiKeySet: boolean
  readonly apiKeyEnv: string
  /** The ACTIVE transcription model, picked from {@link endpointModels}. */
  readonly endpointModel: string
  /** The saved candidate pool; the active model is chosen from these. */
  readonly endpointModels: readonly string[]
  readonly anonymous: boolean
  readonly timeoutMs: number
  readonly maxTokens: number
  readonly autoLocalOllama: boolean
  readonly localOllamaModel: string
  readonly localOllamaUrl: string
  /** Advanced fallback entries; configured statically / in settings.yaml. */
  readonly fallbackCount: number
  readonly cacheLimit: number
  readonly cooldownMs: number
  /** DSH providers and models, the same directory the model picker uses. */
  readonly providers: readonly VisionProviderOptionView[]
  /** Live integration state, in the same shape `visionStatus` returns. */
  readonly status: VisionStatusView
}

export type VisionConfigGetResult = VisionConfigView | { readonly error: ApiError }

/** Fields the Settings tab may edit; everything else is read-only there. */
export interface VisionConfigPatch {
  enabled?: boolean
  patchAdmission?: boolean
  provider?: string
  model?: string
  /** DSH model pool; an empty array restores auto-detection. */
  harnessModels?: VisionHarnessModelView[]
  prompt?: string
  marker?: string
  baseUrl?: string
  /** Present only when the user typed a new key; omitted keeps the old one. */
  apiKey?: string
  endpointModel?: string
  /** Candidate pool saved from the fetched model list. */
  endpointModels?: string[]
  anonymous?: boolean
  timeoutMs?: number
  maxTokens?: number
  autoLocalOllama?: boolean
  localOllamaModel?: string
  localOllamaUrl?: string
  cacheLimit?: number
  cooldownMs?: number
}

/** One settings save, carrying the revision the form loaded. */
export interface VisionConfigSaveRequest {
  readonly patch: VisionConfigPatch
  readonly expectedRevision?: number
}

/** Successful save; `revision` is the new CAS value. */
export interface VisionConfigSaveView {
  readonly ok: true
  readonly revision: number
}

export type VisionConfigSetResult = VisionConfigSaveView | { readonly error: ApiError }

/** One model reported by the dedicated endpoint's `/models` listing. */
export interface VisionEndpointModelView {
  readonly id: string
  readonly name: string
}

/**
 * Fetch the dedicated endpoint's model list. Omitted fields fall back to the
 * SAVED settings (base URL, key, anonymous flag); a typed key is one-shot and
 * is never stored or returned.
 */
export interface VisionEndpointModelsRequest {
  readonly baseUrl?: string
  readonly apiKey?: string
  readonly anonymous?: boolean
}

/** The endpoint's model list; `truncated` says the cap cut it. */
export interface VisionEndpointModelsView {
  readonly baseUrl: string
  readonly models: readonly VisionEndpointModelView[]
  readonly truncated: boolean
}

export type VisionEndpointModelsResult = VisionEndpointModelsView | { readonly error: ApiError }
