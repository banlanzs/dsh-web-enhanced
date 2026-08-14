import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { GitClient } from '../src/git.ts'
import type { GitLimits } from '../src/git.ts'
import { FakeSubprocess } from './helpers/fake-subprocess.ts'

const limits: GitLimits = { outputMaxBytes: 1024, maxCount: 5 }

function client(): { fake: FakeSubprocess; git: GitClient } {
  const ctx = new Context()
  const fake = new FakeSubprocess(ctx)
  return { fake, git: new GitClient(fake, join('C:', 'ws'), limits) }
}

describe('GitClient', () => {
  it('isRepo answers from rev-parse', async () => {
    const { fake, git } = client()
    fake.enqueue({ stdout: 'true\n' })
    expect(await git.isRepo()).toBe(true)
    fake.enqueue({ stdout: 'false\n' })
    expect(await git.isRepo()).toBe(false)
    fake.enqueue({ exitCode: 128 })
    expect(await git.isRepo()).toBe(false)
  })

  it('branches lists names with the current marker and tolerates a detached HEAD', async () => {
    const { fake, git } = client()
    fake.enqueue({ stdout: 'main\nfeature\n' })
    fake.enqueue({ stdout: 'main\n' })
    expect(await git.branches()).toEqual([
      { name: 'main', current: true },
      { name: 'feature', current: false },
    ])
    fake.enqueue({ stdout: 'main\n' })
    fake.enqueue({ exitCode: 1, stderr: 'fatal: ref HEAD is not a symbolic ref\n' })
    const detached = await git.branches()
    expect(detached.every(branch => !branch.current)).toBe(true)
  })

  it('branches throws when the branch command fails', async () => {
    const { fake, git } = client()
    fake.enqueue({ exitCode: 128, stderr: 'fatal: not a git repository\n' })
    await expect(git.branches()).rejects.toThrow('fatal: not a git repository')
  })

  it('log parses commits with parents, refs, and skips malformed ref lines', async () => {
    const { fake, git } = client()
    fake.enqueue({
      stdout: [
        'h1\x1f\x1fAlice\x1f1700000000\x1ffirst commit',
        'h2\x1fh1\x1fBob\x1f1700000001\x1fsecond',
        '',
      ].join('\n'),
    })
    fake.enqueue({ stdout: 'main\x1fh2\nbroken-line\n' })
    const commits = await git.log(5)
    expect(commits).toEqual([
      { hash: 'h1', parents: [], refs: [], author: 'Alice', date: 1700000000, subject: 'first commit' },
      { hash: 'h2', parents: ['h1'], refs: ['main'], author: 'Bob', date: 1700000001, subject: 'second' },
    ])
    expect(fake.calls[0]!.argv.join(' ')).toContain('--max-count=5')
  })

  it('log falls back to an empty ref map when for-each-ref fails', async () => {
    const { fake, git } = client()
    fake.enqueue({ stdout: 'h1\x1f\x1fA\x1f1\x1fs' })
    fake.enqueue({ exitCode: 128 })
    const commits = await git.log(5)
    expect(commits[0]!.refs).toEqual([])
  })

  it('log throws when git log fails', async () => {
    const { fake, git } = client()
    fake.enqueue({ exitCode: 128, stderr: 'fatal: bad config\n' })
    await expect(git.log(5)).rejects.toThrow('fatal: bad config')
  })

  it('checkout succeeds or carries the rejection message', async () => {
    const { fake, git } = client()
    fake.enqueue({ exitCode: 0 })
    expect(await git.checkout('feature')).toEqual({ ok: true })
    fake.enqueue({ exitCode: 1, stderr: 'error: Your local changes would be overwritten\n' })
    expect(await git.checkout('feature')).toEqual({ ok: false, message: 'error: Your local changes would be overwritten' })
    await expect(git.checkout('')).rejects.toThrow(/empty/)
  })

  it('status parses porcelain v1 entries including renames and untracked', async () => {
    const { fake, git } = client()
    // Under -z a rename is emitted as `XY <new>\0<orig>\0` — the new path
    // first, so it stays usable as a git path argument.
    fake.enqueue({ stdout: ' M a.txt\0?? untracked.txt\0R  new.txt\0old.txt\0xy\0' })
    expect(await git.status()).toEqual([
      { path: 'a.txt', staged: ' ', unstaged: 'M' },
      { path: 'untracked.txt', staged: '?', unstaged: '?' },
      { path: 'new.txt', origPath: 'old.txt', staged: 'R', unstaged: ' ' },
    ])
    fake.enqueue({ exitCode: 128, stderr: 'fatal\n' })
    await expect(git.status()).rejects.toThrow('fatal')
  })

  it('diff passes the staged flag and path, and rejects unsafe paths', async () => {
    const { fake, git } = client()
    fake.enqueue({ stdout: 'diff --git a/a.txt b/a.txt\n' })
    expect(await git.diff('a.txt', true)).toContain('diff --git')
    expect(fake.calls[0]!.argv).toEqual(['git', 'diff', '--cached', '--', 'a.txt'])
    fake.enqueue({ stdout: '' })
    expect(await git.diff(undefined, false)).toBe('')
    expect(fake.calls[1]!.argv).toEqual(['git', 'diff'])
    await expect(git.diff('../evil', false)).rejects.toThrow(/must not contain/)
    fake.enqueue({ exitCode: 1, stderr: 'boom' })
    await expect(git.diff(undefined, false)).rejects.toThrow('boom')
  })

  it('stage, unstage, and discard run with safe paths and reject empty or unsafe lists', async () => {
    const { fake, git } = client()
    fake.enqueue({ exitCode: 0 })
    await git.stage(['a.txt', 'b/c.txt'])
    expect(fake.calls[0]!.argv).toEqual(['git', 'add', '--', 'a.txt', 'b/c.txt'])
    fake.enqueue({ exitCode: 0 })
    await git.unstage(['a.txt'])
    expect(fake.calls[1]!.argv).toEqual(['git', 'restore', '--staged', '--', 'a.txt'])
    fake.enqueue({ exitCode: 0 })
    await git.discard(['a.txt'])
    expect(fake.calls[2]!.argv).toEqual(['git', 'restore', '--', 'a.txt'])
    await expect(git.stage([])).rejects.toThrow(/at least one path/)
    await expect(git.unstage(['a/../b'])).rejects.toThrow(/must not contain/)
    await expect(git.discard(['/abs'])).rejects.toThrow(/must be relative/)
    fake.enqueue({ exitCode: 1, stderr: 'nope' })
    await expect(git.stage(['a.txt'])).rejects.toThrow('nope')
  })

  it('falls back to generic messages when stderr is empty and tolerates missing collected readers', async () => {
    const { fake, git } = client()
    fake.enqueue({ exitCode: 128, stderr: '' })
    await expect(git.branches()).rejects.toThrow('git branch failed')
    fake.enqueue({ exitCode: 128, stderr: '' })
    await expect(git.log(5)).rejects.toThrow('git log failed')
    fake.enqueue({ exitCode: 1, stderr: '' })
    expect(await git.checkout('x')).toEqual({ ok: false, message: 'git checkout failed' })
    fake.enqueue({ exitCode: 128, stderr: '' })
    await expect(git.status()).rejects.toThrow('git status failed')
    fake.enqueue({ exitCode: 1, stderr: '' })
    await expect(git.diff(undefined, false)).rejects.toThrow('git diff failed')
    fake.enqueue({ exitCode: 1, stderr: '' })
    await expect(git.stage(['a.txt'])).rejects.toThrow('git command failed')
    fake.omitCollected = true
    fake.enqueue({ exitCode: 0 })
    await git.isRepo()
    expect(fake.calls.at(-1)!.argv[0]).toBe('git')
  })
})
