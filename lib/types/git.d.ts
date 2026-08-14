/**
 * Git operations behind the web-enhanced gateway. Every command runs through
 * the subprocess seam against the workspace root; output is bounded and
 * mutation failures surface their stderr.
 * @module dsh-web-enhanced/src/git
 */
import type { SubprocessRuntime } from '@deepseek-ai/dsh-subprocess';
import type { GitBranchView, GitCommitView, GitStatusEntry } from './types.ts';
/** Output bounds for one git invocation (deployment config, not tunables). */
export interface GitLimits {
    readonly outputMaxBytes: number;
    readonly maxCount: number;
}
/** Thin subprocess-backed git client rooted at one workspace. */
export declare class GitClient {
    private readonly subprocess;
    private readonly root;
    private readonly limits;
    /**
     * @param subprocess - subprocess seam.
     * @param root - workspace root; the cwd of every invocation.
     * @param limits - output bounds.
     */
    constructor(subprocess: SubprocessRuntime, root: string, limits: GitLimits);
    private run;
    /** True when the root is inside a git work tree. */
    isRepo(): Promise<boolean>;
    /** Local branches with the checked-out marker. */
    branches(): Promise<GitBranchView[]>;
    /** Recent commits across all refs, newest first, with branch markers. */
    log(maxCount: number): Promise<GitCommitView[]>;
    /** Branch names per commit hash (heads and remotes). */
    private collectRefs;
    /** Check out one branch; a rejected switch returns its stderr. */
    checkout(branch: string): Promise<{
        ok: boolean;
        message?: string;
    }>;
    /**
     * Worktree status in porcelain v1 (NUL-separated). A rename or copy is
     * emitted as `XY <new>\0<orig>\0` — the entry's own path is the NEW one, so
     * it stays usable as a git path argument, and the source rides `origPath`.
     */
    status(): Promise<GitStatusEntry[]>;
    /** Unified diff text of one path (or the whole tree), optionally staged. */
    diff(path: string | undefined, staged: boolean): Promise<string>;
    /** Stage one or more paths. */
    stage(paths: readonly string[]): Promise<void>;
    /** Unstage one or more paths. */
    unstage(paths: readonly string[]): Promise<void>;
    /** Discard worktree changes of one or more tracked paths. */
    discard(paths: readonly string[]): Promise<void>;
    private assertPaths;
    private mutate;
}
