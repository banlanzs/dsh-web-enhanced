/**
 * Git operations behind the web-enhanced gateway. Every command runs through
 * the subprocess seam against the workspace root; output is bounded and
 * mutation failures surface their stderr.
 * @module dsh-web-enhanced/src/git
 */
import type { SubprocessRuntime } from '@deepseek-ai/dsh-subprocess';
import type { GitBranchView, GitCommitDetailView, GitCommitFileView, GitCommitView, GitStatusEntry, GitWorkingView } from './types.ts';
/**
 * Read `--numstat` rows into per-file line counts.
 *
 * One `<added>\t<removed>\t<path>` per file, with `-` for a binary file's
 * counts. A rename is emitted as three NUL-free fields where the path is
 * `old => new` inside braces, so it is kept verbatim — the display shows what
 * git says rather than guessing at the halves.
 * @param text - the numstat section.
 * @returns one entry per parsable row.
 */
export declare function parseNumstat(text: string): GitCommitFileView[];
/**
 * Read `git show --numstat` output into one commit detail.
 *
 * The header is everything before the record separator the format appends;
 * the numstat rows follow it.
 * @param stdout - the command's output.
 * @returns the parsed detail; a missing separator yields an empty file list.
 */
export declare function parseCommitDetail(stdout: string): GitCommitDetailView;
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
    /**
     * Recent commits, newest first, with branch markers.
     * @param maxCount - row cap.
     * @param branch - walk only this ref's history; omitted walks every ref.
     * @returns the commit rows.
     */
    log(maxCount: number, branch?: string): Promise<GitCommitView[]>;
    /**
     * One commit's identity and per-file change counts.
     *
     * `--numstat` against the FIRST parent only: a merge diffed against every
     * parent lists the same file once per side and would read as several
     * changes, and the useful question about a merge is what it brought in.
     * A binary file reports `-` for both counts, which stays `null` here rather
     * than becoming a fake zero.
     * @param hash - the commit to describe.
     * @returns identity, message body, and changed files.
     */
    commit(hash: string): Promise<GitCommitDetailView>;
    /**
     * Unified diff of one file as one commit changed it, against the commit's
     * first parent (the same side {@link commit} counts). Binary files still
     * yield git's binary diff marker, which the preview renders as text.
     * @param hash - commit to diff against its first parent.
     * @param path - repository-relative path the commit touched.
     * @returns the diff text.
     */
    commitDiff(hash: string, path: string): Promise<string>;
    /**
     * The uncommitted state of the work tree, as the graph's top row shows it.
     *
     * Three reads, because git computes three different diffs and there is no
     * single command that answers all of them: `--cached` is the index against
     * HEAD, a plain `diff` is the work tree against the index, and untracked
     * files are in neither — they are listed by `ls-files --others`.
     *
     * An untracked file has no numstat at all (git would have to add it to the
     * index first, which this must not do), so its added-line count comes from
     * `countLines`, applied only to the entries that survive the cap. Without a
     * counter, or when the file is binary or over the read cap, the count stays
     * `null` and the display shows what a binary file shows.
     * @param maxFiles - cap on the returned file list.
     * @param countLines - optional line counter for untracked files.
     * @returns the working view; totals are pre-cap.
     */
    working(maxFiles: number, countLines?: (path: string) => Promise<number | null>): Promise<GitWorkingView>;
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
