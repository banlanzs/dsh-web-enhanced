/**
 * Wire and durable payload vocabulary of the web-enhanced host gateway.
 * Types only — the zod schemas live in `./schemas.ts` and the gateway in
 * `./gateway.ts`. Every payload here crosses the Typert wire, so fields stay
 * plain JSON values (brands are compile-time only).
 * @module dsh-web-enhanced/src/types
 */
import type { Branded } from '@deepseek-ai/dsh-brand';
import type { SessionId } from '@deepseek-ai/dsh-session';
import type { WorkspaceId } from '@deepseek-ai/dsh-workspace';
export type { WorkspaceId } from '@deepseek-ai/dsh-workspace';
/** Identifies one task board record. */
export type TaskId = Branded<'TaskId'>;
/** Task board column: planned, todo, running, done, or failed. */
export type TaskStatus = 'planned' | 'todo' | 'running' | 'done' | 'failed';
/** Structured outcome of one task execution. */
export interface TaskResult {
    /** `turn/end` reason kind when the run reached quiescence. */
    readonly reasonKind?: 'completed' | 'error' | 'interrupted';
    /** Last assistant text of the run, when any. */
    readonly summary?: string;
    /** Machine code of a failure (turn error, host restart, execution fault). */
    readonly errorCode?: string;
    /** Human message of a failure. */
    readonly errorMessage?: string;
}
/** Durable task board record (storage-domain table value). */
export interface TaskRecord {
    readonly id: TaskId;
    readonly title: string;
    readonly prompt: string;
    readonly status: TaskStatus;
    /** Five-field cron expression, or null for manual tasks. */
    readonly cron: string | null;
    /** Next scheduled run instant (ms epoch), when the task has a cron. */
    readonly nextRunAt: number | null;
    readonly workspaceId: WorkspaceId | null;
    readonly sessionId: SessionId | null;
    readonly result: TaskResult | null;
    readonly createdAt: number;
    readonly updatedAt: number;
    readonly lastRunAt: number | null;
}
/** Business error carried inside a result (never a thrown exception). */
export interface ApiError {
    readonly code: string;
    readonly message: string;
}
export type TaskListResult = {
    readonly tasks: readonly TaskRecord[];
} | {
    readonly error: ApiError;
};
export type TaskCreateResult = {
    readonly task: TaskRecord;
} | {
    readonly error: ApiError;
};
export type TaskUpdateResult = {
    readonly task: TaskRecord;
} | {
    readonly error: ApiError;
};
export type TaskRemoveResult = {
    readonly removed: boolean;
} | {
    readonly error: ApiError;
};
export type TaskRunResult = {
    readonly started: boolean;
    readonly sessionId: SessionId | null;
} | {
    readonly error: ApiError;
};
export interface TaskCreateRequest {
    readonly title: string;
    readonly prompt: string;
    readonly cron?: string;
    readonly workspaceId?: string | null;
}
export interface TaskUpdateRequest {
    readonly id: string;
    readonly title?: string;
    readonly prompt?: string;
    readonly cron?: string | null;
    readonly status?: 'planned' | 'todo';
    /** Rebind the task's workspace; `null` clears it, omitted keeps the current one. */
    readonly workspaceId?: string | null;
}
export interface TaskRemoveRequest {
    readonly id: string;
}
export interface TaskRunRequest {
    readonly id: string;
    readonly workspaceId?: string | null;
}
/** One branch with its current marker. */
export interface GitBranchView {
    readonly name: string;
    readonly current: boolean;
}
/** One commit for the lane renderer. */
export interface GitCommitView {
    readonly hash: string;
    readonly parents: readonly string[];
    readonly refs: readonly string[];
    readonly author: string;
    readonly date: number;
    readonly subject: string;
}
/**
 * One porcelain-v1 status entry. `path` is always the entry's CURRENT path,
 * so it is what stage/unstage/discard pass to git; a rename or copy carries
 * its source separately in `origPath` for display (`origPath -> path`).
 */
export interface GitStatusEntry {
    readonly path: string;
    /** Source path of a rename (`R`) or copy (`C`); absent otherwise. */
    readonly origPath?: string;
    readonly staged: string;
    readonly unstaged: string;
}
export type GitBranchesResult = {
    readonly branches: readonly GitBranchView[];
} | {
    readonly error: ApiError;
};
export type GitLogResult = {
    readonly commits: readonly GitCommitView[];
} | {
    readonly error: ApiError;
};
export type GitCheckoutResult = {
    readonly ok: boolean;
    readonly message?: string;
} | {
    readonly error: ApiError;
};
export type GitStatusResult = {
    readonly entries: readonly GitStatusEntry[];
} | {
    readonly error: ApiError;
};
export type GitDiffResult = {
    readonly text: string;
} | {
    readonly error: ApiError;
};
export type GitMutateResult = {
    readonly ok: boolean;
    readonly message?: string;
} | {
    readonly error: ApiError;
};
export interface GitBranchesRequest {
    readonly workspaceId: string;
}
export interface GitStatusRequest {
    readonly workspaceId: string;
}
export interface GitLogRequest {
    readonly workspaceId: string;
    readonly maxCount?: number;
}
export interface GitCheckoutRequest {
    readonly workspaceId: string;
    readonly branch: string;
}
export interface GitDiffRequest {
    readonly workspaceId: string;
    readonly path?: string;
    readonly staged?: boolean;
}
export interface GitMutateRequest {
    readonly workspaceId: string;
    readonly paths: readonly string[];
}
/** One workspace-relative file entry. */
export interface FsEntryView {
    readonly name: string;
    readonly path: string;
    readonly kind: 'file' | 'dir';
    readonly size?: number;
}
export type FsListResult = {
    readonly entries: readonly FsEntryView[];
} | {
    readonly error: ApiError;
};
export type FsSearchResult = {
    readonly entries: readonly FsEntryView[];
} | {
    readonly error: ApiError;
};
export type FsReadResult = {
    readonly kind: 'text';
    readonly content: string;
    readonly truncated: boolean;
    readonly size: number;
} | {
    readonly kind: 'binary';
    readonly content: string;
    readonly truncated: boolean;
    readonly size: number;
} | {
    readonly error: ApiError;
};
export type FsWriteResult = {
    readonly ok: boolean;
} | {
    readonly error: ApiError;
};
export interface FsListRequest {
    readonly workspaceId: string;
    readonly path?: string;
}
export interface FsSearchRequest {
    readonly workspaceId: string;
    readonly query?: string;
    readonly path?: string;
}
export interface FsReadRequest {
    readonly workspaceId: string;
    readonly path: string;
}
export interface FsWriteRequest {
    readonly workspaceId: string;
    readonly path: string;
    readonly content: string;
}
export interface FsDeleteRequest {
    readonly workspaceId: string;
    readonly path: string;
}
/** One structural block of an Office document preview (never raw HTML). */
export type OfficeBlock = {
    readonly type: 'h1' | 'h2' | 'h3';
    readonly text: string;
} | {
    readonly type: 'p';
    readonly text: string;
} | {
    readonly type: 'li';
    readonly text: string;
} | {
    readonly type: 'table';
    readonly rows: readonly (readonly string[])[];
};
/** Office preview kinds the converter understands. */
export type OfficeKind = 'docx' | 'xlsx';
export type FsOfficePreviewResult = {
    readonly kind: OfficeKind;
    readonly blocks: readonly OfficeBlock[];
    readonly truncated: boolean;
} | {
    readonly error: ApiError;
};
export interface FsOfficePreviewRequest {
    readonly workspaceId: string;
    readonly path: string;
}
/** One balance line of the DeepSeek account. */
export interface BalanceInfo {
    readonly currency: string;
    readonly totalBalance: number;
    readonly grantedBalance: number;
    readonly toppedUpBalance: number;
}
/** Result of the balance query; `error` is a field, never a throw. */
export interface BalanceView {
    readonly isAvailable: boolean;
    readonly infos: readonly BalanceInfo[];
    readonly cachedAt: number;
    readonly error?: ApiError;
}
