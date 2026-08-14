/**
 * Git operations behind the web-enhanced gateway. Every command runs through
 * the subprocess seam against the workspace root; output is bounded and
 * mutation failures surface their stderr.
 * @module dsh-web-enhanced/src/git
 */

import type { SubprocessRuntime } from '@deepseek-ai/dsh-subprocess'
import type { GitBranchView, GitCommitView, GitStatusEntry } from './types.ts'

/** Output bounds for one git invocation (deployment config, not tunables). */
export interface GitLimits {
  readonly outputMaxBytes: number
  readonly maxCount: number
}

/** One settled git invocation: exit facts plus collected output. */
interface GitRun {
  readonly exitCode: number | null
  readonly stdout: string
  readonly stderr: string
}

/** Reject a repository-relative path with traversal or absolutes. */
function assertSafeRelPath(path: string): void {
  if (path.startsWith('/') || /^[A-Za-z]:[\\/]/u.test(path)) throw new Error(`path '${path}' must be relative`)
  const segments = path.split('/')
  if (segments.some(segment => segment === '..' || segment === '.')) {
    throw new Error(`path '${path}' must not contain '.' or '..' segments`)
  }
}

/** Thin subprocess-backed git client rooted at one workspace. */
export class GitClient {
  /**
   * @param subprocess - subprocess seam.
   * @param root - workspace root; the cwd of every invocation.
   * @param limits - output bounds.
   */
  constructor(
    private readonly subprocess: SubprocessRuntime,
    private readonly root: string,
    private readonly limits: GitLimits,
  ) {}

  private async run(argv: readonly string[]): Promise<GitRun> {
    const handle = this.subprocess.spawn({
      argv: ['git', ...argv],
      cwd: this.root,
      stdio: {
        stdin: 'ignore',
        stdout: { maxBytes: this.limits.outputMaxBytes },
        stderr: { maxBytes: this.limits.outputMaxBytes },
      },
      graceMs: 5_000,
    })
    const outcome = await handle.done
    return {
      exitCode: outcome.exitCode,
      stdout: handle.collected.stdout?.readFrom(0).text ?? '',
      stderr: handle.collected.stderr?.readFrom(0).text ?? '',
    }
  }

  /** True when the root is inside a git work tree. */
  async isRepo(): Promise<boolean> {
    const run = await this.run(['rev-parse', '--is-inside-work-tree'])
    return run.exitCode === 0 && run.stdout.trim() === 'true'
  }

  /** Local branches with the checked-out marker. */
  async branches(): Promise<GitBranchView[]> {
    const run = await this.run(['branch', '--format=%(refname:short)'])
    if (run.exitCode !== 0) throw new Error(run.stderr.trim() || 'git branch failed')
    const head = await this.run(['symbolic-ref', '--short', 'HEAD'])
    const current = head.exitCode === 0 ? head.stdout.trim() : null
    return run.stdout.split('\n').filter(Boolean).map(name => ({
      name: name.trim(),
      current: name.trim() === current,
    }))
  }

  /** Recent commits across all refs, newest first, with branch markers. */
  async log(maxCount: number): Promise<GitCommitView[]> {
    const fmt = '%H%x1f%P%x1f%an%x1f%at%x1f%s'
    const run = await this.run([
      'log', '--all', '--date-order', `--max-count=${maxCount}`, `--pretty=format:${fmt}`,
    ])
    if (run.exitCode !== 0) throw new Error(run.stderr.trim() || 'git log failed')
    const refs = await this.collectRefs()
    return run.stdout.split('\n').filter(Boolean).map(line => {
      const [hash = '', parents = '', author = '', at = '', ...rest] = line.split('\x1f')
      return {
        hash,
        parents: parents === '' ? [] : parents.split(' '),
        refs: refs.get(hash) ?? [],
        author,
        date: Number(at),
        subject: rest.join('\x1f'),
      }
    })
  }

  /** Branch names per commit hash (heads and remotes). */
  private async collectRefs(): Promise<Map<string, string[]>> {
    const run = await this.run(['for-each-ref', 'refs/heads', 'refs/remotes', '--format=%(refname:short)%x1f%(objectname)'])
    if (run.exitCode !== 0) return new Map()
    const map = new Map<string, string[]>()
    for (const line of run.stdout.split('\n')) {
      if (line === '') continue
      const split = line.indexOf('\x1f')
      if (split === -1) continue
      const name = line.slice(0, split)
      const hash = line.slice(split + 1)
      const list = map.get(hash) ?? []
      list.push(name)
      map.set(hash, list)
    }
    return map
  }

  /** Check out one branch; a rejected switch returns its stderr. */
  async checkout(branch: string): Promise<{ ok: boolean; message?: string }> {
    if (branch === '') throw new Error('branch name must not be empty')
    const run = await this.run(['checkout', branch])
    if (run.exitCode === 0) return { ok: true }
    return { ok: false, message: run.stderr.trim() || 'git checkout failed' }
  }

  /**
   * Worktree status in porcelain v1 (NUL-separated). A rename or copy is
   * emitted as `XY <new>\0<orig>\0` — the entry's own path is the NEW one, so
   * it stays usable as a git path argument, and the source rides `origPath`.
   */
  async status(): Promise<GitStatusEntry[]> {
    const run = await this.run(['status', '--porcelain=v1', '-z'])
    if (run.exitCode !== 0) throw new Error(run.stderr.trim() || 'git status failed')
    const entries: GitStatusEntry[] = []
    const parts = run.stdout.split('\0')
    for (let index = 0; index < parts.length; index++) {
      const part = parts[index]!
      if (part.length < 3) continue
      const staged = part[0]!
      const unstaged = part[1]!
      const path = part.slice(3)
      let origPath: string | undefined
      if ((staged === 'R' || staged === 'C') && index + 1 < parts.length) {
        origPath = parts[index + 1]!
        index++
      }
      entries.push({ path, ...(origPath === undefined ? {} : { origPath }), staged, unstaged })
    }
    return entries
  }

  /** Unified diff text of one path (or the whole tree), optionally staged. */
  async diff(path: string | undefined, staged: boolean): Promise<string> {
    const argv = ['diff']
    if (staged) argv.push('--cached')
    if (path !== undefined && path !== '') {
      assertSafeRelPath(path)
      argv.push('--', path)
    }
    const run = await this.run(argv)
    if (run.exitCode !== 0) throw new Error(run.stderr.trim() || 'git diff failed')
    return run.stdout
  }

  /** Stage one or more paths. */
  async stage(paths: readonly string[]): Promise<void> {
    await this.mutate(['add', '--', ...this.assertPaths(paths)])
  }

  /** Unstage one or more paths. */
  async unstage(paths: readonly string[]): Promise<void> {
    await this.mutate(['restore', '--staged', '--', ...this.assertPaths(paths)])
  }

  /** Discard worktree changes of one or more tracked paths. */
  async discard(paths: readonly string[]): Promise<void> {
    await this.mutate(['restore', '--', ...this.assertPaths(paths)])
  }

  private assertPaths(paths: readonly string[]): string[] {
    if (paths.length === 0) throw new Error('at least one path is required')
    for (const path of paths) assertSafeRelPath(path)
    return [...paths]
  }

  private async mutate(argv: readonly string[]): Promise<void> {
    const run = await this.run(argv)
    if (run.exitCode !== 0) throw new Error(run.stderr.trim() || 'git command failed')
  }
}
