/**
 * Git operations behind the web-enhanced gateway. Every command runs through
 * the subprocess seam against the workspace root; output is bounded and
 * mutation failures surface their stderr.
 * @module dsh-web-enhanced/src/git
 */
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
export function parseNumstat(text) {
    const files = [];
    for (const line of text.split('\n')) {
        const row = line.trimEnd();
        if (row === '')
            continue;
        const fields = row.split('\t');
        if (fields.length < 3)
            continue;
        const [added = '', removed = '', ...pathParts] = fields;
        files.push({
            path: pathParts.join('\t'),
            added: added === '-' ? null : Number(added),
            removed: removed === '-' ? null : Number(removed),
        });
    }
    return files;
}
/**
 * Read `git show --numstat` output into one commit detail.
 *
 * The header is everything before the record separator the format appends;
 * the numstat rows follow it.
 * @param stdout - the command's output.
 * @returns the parsed detail; a missing separator yields an empty file list.
 */
export function parseCommitDetail(stdout) {
    const split = stdout.indexOf('\x1e');
    const header = split === -1 ? stdout : stdout.slice(0, split);
    const rest = split === -1 ? '' : stdout.slice(split + 1);
    const [hash = '', parents = '', author = '', email = '', at = '', subject = '', ...bodyParts] = header.split('\x1f');
    return {
        hash,
        parents: parents === '' ? [] : parents.split(' '),
        author,
        email,
        date: Number(at),
        subject,
        body: bodyParts.join('\x1f').trim(),
        files: parseNumstat(rest),
    };
}
/** Reject a repository-relative path with traversal or absolutes. */
function assertSafeRelPath(path) {
    if (path.startsWith('/') || /^[A-Za-z]:[\\/]/u.test(path))
        throw new Error(`path '${path}' must be relative`);
    const segments = path.split('/');
    if (segments.some(segment => segment === '..' || segment === '.')) {
        throw new Error(`path '${path}' must not contain '.' or '..' segments`);
    }
}
/** Reject anything that could be read as a git option or a second revision. */
function assertSafeRev(rev) {
    if (rev === '')
        throw new Error('revision must not be empty');
    if (rev.startsWith('-'))
        throw new Error(`revision '${rev}' must not start with '-'`);
    // `..`/`...` are range syntax and `^`/`~` walk elsewhere: a filter names ONE
    // ref, and whitespace or a glob would let one argument become several.
    if (/[\s~^:?*[\]\\]/u.test(rev) || rev.includes('..')) {
        throw new Error(`revision '${rev}' contains characters a single ref may not`);
    }
}
/** Thin subprocess-backed git client rooted at one workspace. */
export class GitClient {
    subprocess;
    root;
    limits;
    /**
     * @param subprocess - subprocess seam.
     * @param root - workspace root; the cwd of every invocation.
     * @param limits - output bounds.
     */
    constructor(subprocess, root, limits) {
        this.subprocess = subprocess;
        this.root = root;
        this.limits = limits;
    }
    async run(argv) {
        const handle = this.subprocess.spawn({
            argv: ['git', ...argv],
            cwd: this.root,
            stdio: {
                stdin: 'ignore',
                stdout: { maxBytes: this.limits.outputMaxBytes },
                stderr: { maxBytes: this.limits.outputMaxBytes },
            },
            graceMs: 5_000,
        });
        const outcome = await handle.done;
        return {
            exitCode: outcome.exitCode,
            stdout: handle.collected.stdout?.readFrom(0).text ?? '',
            stderr: handle.collected.stderr?.readFrom(0).text ?? '',
        };
    }
    /** True when the root is inside a git work tree. */
    async isRepo() {
        const run = await this.run(['rev-parse', '--is-inside-work-tree']);
        return run.exitCode === 0 && run.stdout.trim() === 'true';
    }
    /** Local branches with the checked-out marker. */
    async branches() {
        const run = await this.run(['branch', '--format=%(refname:short)']);
        if (run.exitCode !== 0)
            throw new Error(run.stderr.trim() || 'git branch failed');
        const head = await this.run(['symbolic-ref', '--short', 'HEAD']);
        const current = head.exitCode === 0 ? head.stdout.trim() : null;
        return run.stdout.split('\n').filter(Boolean).map(name => ({
            name: name.trim(),
            current: name.trim() === current,
        }));
    }
    /**
     * Recent commits, newest first, with branch markers.
     * @param maxCount - row cap.
     * @param branch - walk only this ref's history; omitted walks every ref.
     * @returns the commit rows.
     */
    async log(maxCount, branch) {
        const fmt = '%H%x1f%P%x1f%an%x1f%at%x1f%s';
        // `--all` and a named ref are alternatives, not modifiers of each other:
        // the filter is what decides which history the lanes are drawn from.
        let scope = ['--all'];
        if (branch !== undefined && branch !== '') {
            assertSafeRev(branch);
            scope = [branch];
        }
        const run = await this.run([
            'log', ...scope, '--date-order', `--max-count=${maxCount}`, `--pretty=format:${fmt}`,
        ]);
        if (run.exitCode !== 0)
            throw new Error(run.stderr.trim() || 'git log failed');
        const refs = await this.collectRefs();
        return run.stdout.split('\n').filter(Boolean).map(line => {
            const [hash = '', parents = '', author = '', at = '', ...rest] = line.split('\x1f');
            return {
                hash,
                parents: parents === '' ? [] : parents.split(' '),
                refs: refs.get(hash) ?? [],
                author,
                date: Number(at),
                subject: rest.join('\x1f'),
            };
        });
    }
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
    async commit(hash) {
        assertSafeRev(hash);
        // The body is multi-line, so it goes LAST and a record separator closes
        // the header: splitting on newlines alone could not tell a body line from
        // the first numstat row.
        const fmt = '%H%x1f%P%x1f%an%x1f%ae%x1f%at%x1f%s%x1f%b%x1e';
        const run = await this.run([
            'show', '--no-color', '--first-parent', '-m', '--numstat', `--format=${fmt}`, hash,
        ]);
        if (run.exitCode !== 0)
            throw new Error(run.stderr.trim() || 'git show failed');
        return parseCommitDetail(run.stdout);
    }
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
    async working(maxFiles, countLines) {
        const headRun = await this.run(['rev-parse', 'HEAD']);
        // An unborn branch has no HEAD; that is a state, not a failure — the row
        // simply has no commit to attach itself to.
        const head = headRun.exitCode === 0 ? headRun.stdout.trim() : '';
        const stagedRun = await this.run(['diff', '--cached', '--numstat']);
        if (stagedRun.exitCode !== 0)
            throw new Error(stagedRun.stderr.trim() || 'git diff --cached failed');
        const unstagedRun = await this.run(['diff', '--numstat']);
        if (unstagedRun.exitCode !== 0)
            throw new Error(unstagedRun.stderr.trim() || 'git diff failed');
        const othersRun = await this.run(['ls-files', '--others', '--exclude-standard', '-z']);
        if (othersRun.exitCode !== 0)
            throw new Error(othersRun.stderr.trim() || 'git ls-files failed');
        const staged = parseNumstat(stagedRun.stdout);
        const unstaged = parseNumstat(unstagedRun.stdout);
        const untracked = othersRun.stdout.split('\0').filter(path => path !== '');
        const all = [
            ...staged.map(file => ({ ...file, state: 'staged' })),
            ...unstaged.map(file => ({ ...file, state: 'unstaged' })),
            ...untracked.map(path => ({ path, state: 'untracked', added: null, removed: null })),
        ];
        const truncated = all.length > maxFiles;
        const files = truncated ? all.slice(0, maxFiles) : all;
        if (countLines !== undefined) {
            await Promise.all(files.map(async (file, index) => {
                if (file.state !== 'untracked')
                    return;
                files[index] = { ...file, added: await countLines(file.path) };
            }));
        }
        return {
            head,
            files,
            staged: staged.length,
            unstaged: unstaged.length,
            untracked: untracked.length,
            truncated,
        };
    }
    /** Branch names per commit hash (heads and remotes). */
    async collectRefs() {
        const run = await this.run(['for-each-ref', 'refs/heads', 'refs/remotes', '--format=%(refname:short)%x1f%(objectname)']);
        if (run.exitCode !== 0)
            return new Map();
        const map = new Map();
        for (const line of run.stdout.split('\n')) {
            if (line === '')
                continue;
            const split = line.indexOf('\x1f');
            if (split === -1)
                continue;
            const name = line.slice(0, split);
            const hash = line.slice(split + 1);
            const list = map.get(hash) ?? [];
            list.push(name);
            map.set(hash, list);
        }
        return map;
    }
    /** Check out one branch; a rejected switch returns its stderr. */
    async checkout(branch) {
        if (branch === '')
            throw new Error('branch name must not be empty');
        const run = await this.run(['checkout', branch]);
        if (run.exitCode === 0)
            return { ok: true };
        return { ok: false, message: run.stderr.trim() || 'git checkout failed' };
    }
    /**
     * Worktree status in porcelain v1 (NUL-separated). A rename or copy is
     * emitted as `XY <new>\0<orig>\0` — the entry's own path is the NEW one, so
     * it stays usable as a git path argument, and the source rides `origPath`.
     */
    async status() {
        const run = await this.run(['status', '--porcelain=v1', '-z']);
        if (run.exitCode !== 0)
            throw new Error(run.stderr.trim() || 'git status failed');
        const entries = [];
        const parts = run.stdout.split('\0');
        for (let index = 0; index < parts.length; index++) {
            const part = parts[index];
            if (part.length < 3)
                continue;
            const staged = part[0];
            const unstaged = part[1];
            const path = part.slice(3);
            let origPath;
            if ((staged === 'R' || staged === 'C') && index + 1 < parts.length) {
                origPath = parts[index + 1];
                index++;
            }
            entries.push({ path, ...(origPath === undefined ? {} : { origPath }), staged, unstaged });
        }
        return entries;
    }
    /** Unified diff text of one path (or the whole tree), optionally staged. */
    async diff(path, staged) {
        const argv = ['diff'];
        if (staged)
            argv.push('--cached');
        if (path !== undefined && path !== '') {
            assertSafeRelPath(path);
            argv.push('--', path);
        }
        const run = await this.run(argv);
        if (run.exitCode !== 0)
            throw new Error(run.stderr.trim() || 'git diff failed');
        return run.stdout;
    }
    /** Stage one or more paths. */
    async stage(paths) {
        await this.mutate(['add', '--', ...this.assertPaths(paths)]);
    }
    /** Unstage one or more paths. */
    async unstage(paths) {
        await this.mutate(['restore', '--staged', '--', ...this.assertPaths(paths)]);
    }
    /** Discard worktree changes of one or more tracked paths. */
    async discard(paths) {
        await this.mutate(['restore', '--', ...this.assertPaths(paths)]);
    }
    assertPaths(paths) {
        if (paths.length === 0)
            throw new Error('at least one path is required');
        for (const path of paths)
            assertSafeRelPath(path);
        return [...paths];
    }
    async mutate(argv) {
        const run = await this.run(argv);
        if (run.exitCode !== 0)
            throw new Error(run.stderr.trim() || 'git command failed');
    }
}
