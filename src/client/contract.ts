/**
 * Client-side contract of dsh-web-enhanced: the remote facade components
 * call, the preview/panel vocabulary they share, and the injected face each
 * slot registration receives. Wire payload types come from the plugin's own
 * `../types.ts` — one authority for both halves.
 * @module dsh-web-enhanced/src/client/contract
 */

import type {
  InjectFace, PropsLocale, PropsRuntime, SlotMap,
} from '@deepseek-ai/dsh-client-ui-slots'
import type {
  BalanceView, FsDeleteRequest, FsListRequest, FsListResult, FsOfficePreviewRequest,
  FsOfficePreviewResult, FsReadRequest, FsReadResult, FsSearchRequest, FsSearchResult,
  FsWriteRequest, FsWriteResult, GitBranchesRequest, GitBranchesResult, GitCheckoutRequest,
  GitCheckoutResult, GitDiffRequest, GitDiffResult, GitLogRequest, GitLogResult, GitMutateRequest,
  GitMutateResult, GitStatusRequest, GitStatusResult, OfficeBlock, OfficeKind, TaskCreateRequest,
  TaskCreateResult, TaskListResult, TaskRemoveRequest, TaskRemoveResult, TaskRunRequest,
  TaskRunResult, TaskUpdateRequest, TaskUpdateResult,
} from '../types.ts'
import type {
  Observable, OverlayActions, OverlayState, PanelActions, PanelState, PreviewActions, PreviewState,
} from './stores.ts'

/**
 * The remote facade components call. Every member mirrors one `@Remote`
 * method of `WebEnhancedGateway`, and the request types are the gateway's own
 * — a signature that drifts from the host stops compiling instead of dropping
 * a field silently on the wire.
 *
 * Every method takes at most ONE argument. The Typert gateway maps
 * `descriptor.parameters` positionally onto the host method and rejects a
 * mismatched argument count on both sides, so "one request object" is a wire
 * contract here, not a style choice.
 */
export interface WebEnhancedRemote {
  taskList(): Promise<TaskListResult>
  taskCreate(request: TaskCreateRequest): Promise<TaskCreateResult>
  taskUpdate(request: TaskUpdateRequest): Promise<TaskUpdateResult>
  taskRemove(request: TaskRemoveRequest): Promise<TaskRemoveResult>
  taskRun(request: TaskRunRequest): Promise<TaskRunResult>
  balanceGet(): Promise<BalanceView>
  gitBranches(request: GitBranchesRequest): Promise<GitBranchesResult>
  gitLog(request: GitLogRequest): Promise<GitLogResult>
  gitCheckout(request: GitCheckoutRequest): Promise<GitCheckoutResult>
  gitStatus(request: GitStatusRequest): Promise<GitStatusResult>
  gitDiff(request: GitDiffRequest): Promise<GitDiffResult>
  gitStage(request: GitMutateRequest): Promise<GitMutateResult>
  gitUnstage(request: GitMutateRequest): Promise<GitMutateResult>
  gitDiscard(request: GitMutateRequest): Promise<GitMutateResult>
  fsList(request: FsListRequest): Promise<FsListResult>
  fsSearch(request: FsSearchRequest): Promise<FsSearchResult>
  fsRead(request: FsReadRequest): Promise<FsReadResult>
  fsWrite(request: FsWriteRequest): Promise<FsWriteResult>
  fsDelete(request: FsDeleteRequest): Promise<FsWriteResult>
  fsOfficePreview(request: FsOfficePreviewRequest): Promise<FsOfficePreviewResult>
}

/** Re-exported payload types (components, tests, and preview helpers). */
export type {
  ApiError, BalanceView, FsDeleteRequest, FsEntryView, FsListRequest, FsListResult,
  FsOfficePreviewRequest, FsOfficePreviewResult, FsReadRequest, FsReadResult, FsSearchRequest,
  FsSearchResult, FsWriteRequest, FsWriteResult, GitBranchView, GitBranchesRequest,
  GitBranchesResult, GitCheckoutRequest, GitCheckoutResult, GitCommitView, GitDiffRequest,
  GitDiffResult, GitLogRequest, GitLogResult, GitMutateRequest, GitMutateResult, GitStatusEntry,
  GitStatusRequest, GitStatusResult, OfficeBlock, OfficeKind, TaskCreateRequest, TaskCreateResult,
  TaskListResult, TaskRecord, TaskRemoveRequest, TaskRemoveResult, TaskRunRequest, TaskRunResult,
  TaskStatus, TaskUpdateRequest, TaskUpdateResult,
} from '../types.ts'

/** Right-panel tab selection. */
export type PanelTab = 'files' | 'preview' | 'scm'

/**
 * How one preview tab renders. `source` is the raw editor, `view` the
 * rendered form, `split` shows both side by side. A format with no rendered
 * form (plain text, unknown extensions) stays on `source`.
 */
export type PreviewMode = 'source' | 'split' | 'view'

/**
 * Rendered form a path maps to. Decided from the extension alone, so the
 * decision is a pure function available before the bytes arrive.
 */
export type PreviewKind =
  | 'markdown'
  | 'html'
  | 'code'
  | 'diff'
  | 'csv'
  | 'pdf'
  | 'office'
  | 'image'
  | 'text'

/** One open preview tab and everything needed to render it. */
export interface PreviewTab {
  /** Workspace-relative path; the tab identity. */
  readonly path: string
  /** Basename, for the tab strip. */
  readonly name: string
  /** Rendered form this path maps to. */
  readonly kind: PreviewKind
  /** Current render mode. */
  readonly mode: PreviewMode
  /** UTF-8 text of a text-shaped file. */
  readonly content?: string
  /** Base64 bytes of a binary file (images, PDF). */
  readonly binary?: string
  /** Office conversion blocks, when `kind` is `office`. */
  readonly office?: {
    readonly kind: OfficeKind
    readonly blocks: readonly OfficeBlock[]
    readonly truncated: boolean
  }
  /** Unsaved editor text; absent means the buffer matches `content`. */
  readonly draft?: string
  /** Host-reported failure for this tab, rendered inline. */
  readonly error?: string
  /** Whether the host capped the payload. */
  readonly truncated: boolean
  /** File size in bytes as the host reported it. */
  readonly size: number
}

/**
 * The face every web-enhanced registration injects. Built once in `apply`, so
 * components never reach for a service themselves.
 *
 * The `hooks` compartment is the framework's shared-state channel: each
 * observable arrives at the component as a `use<Name>` selector hook
 * (`overlay` → `useOverlay`). It carries the cross-scope state deliberately —
 * these surfaces span `root` and `session` slots, which a single slot-store
 * handle cannot (see `./stores.ts`).
 *
 * No `t` here: every registration declares `locale: 'webEnhanced'`, so the
 * framework already supplies a `t` seat typed to this namespace's dictionary.
 * Injecting a second one would intersect two translate signatures at the
 * component and lose the key checking.
 */
export interface WebEnhancedInject extends OverlayActions, PanelActions, PreviewActions {
  /** Host capabilities of this plugin's Typert namespace. */
  readonly remote: WebEnhancedRemote
  /**
   * Make one session current (the task board's "jump to the run" gesture).
   * @param sessionId - a session id the host minted.
   */
  readonly openSession: (sessionId: string) => void
  /** Shared state sources; delivered to components as selector hooks. */
  readonly hooks: {
    readonly overlay: Observable<OverlayState>
    readonly panel: Observable<PanelState>
    readonly preview: Observable<PreviewState>
  }
}

/**
 * Component-side view of {@link WebEnhancedInject}: the `hooks` compartment
 * has become `useOverlay` / `usePanel` / `usePreview`.
 */
export type WebEnhancedInjected = InjectFace<WebEnhancedInject>

/**
 * Full composed props of one web-enhanced registration: the framework runtime
 * share for the target slot, this plugin's injected face, and the `t` seat of
 * the declared dictionary namespace.
 */
export type WebEnhancedProps<K extends keyof SlotMap & string> =
  PropsRuntime<K> & WebEnhancedInjected & PropsLocale<'webEnhanced'>
