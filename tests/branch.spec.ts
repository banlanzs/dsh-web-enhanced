/**
 * Branch-switch decisions and the branch-listing cache.
 *
 * The strip itself is not rendered here (node environment, no DOM), so what is
 * pinned is the judgement the switch depends on: how much uncommitted work a
 * checkout would carry, whether it is the kind git refuses over, and what the
 * per-workspace listing cache serves without a second `git branch --list`.
 * @module dsh-web-enhanced/tests/branch
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cachedGitBranches, dirtySummary, invalidateBranchesCache } from '../src/client/git/BranchStrip.tsx'
import { zh } from '../src/client/locales.ts'
import type { GitBranchesResult, GitStatusEntry } from '../src/types.ts'

const entry = (staged: string, unstaged: string, path = 'a.txt'): GitStatusEntry => ({
  path, staged, unstaged,
})

describe('dirtySummary', () => {
  it('counts untracked apart from tracked, because they fail differently', () => {
    // git refuses a checkout that would overwrite a MODIFIED tracked file; an
    // untracked one only collides when the target branch carries that path.
    expect(dirtySummary([
      entry(' ', 'M'),
      entry('M', ' ', 'b.txt'),
      entry('?', '?', 'new.txt'),
      entry('?', '?', 'other.txt'),
    ])).toEqual({ total: 4, tracked: 2, untracked: 2 })
  })

  it('reports a clean tree as nothing to warn about', () => {
    expect(dirtySummary([])).toEqual({ total: 0, tracked: 0, untracked: 0 })
  })

  it('does not mistake a staged add for an untracked file', () => {
    // `A ` is a NEW file already in the index — git carries it across a
    // checkout like any other staged change, so it is tracked work.
    expect(dirtySummary([entry('A', ' ')])).toEqual({ total: 1, tracked: 1, untracked: 0 })
  })
})

describe('the switch warning', () => {
  it('says what git will actually do rather than forbidding the switch', () => {
    // The strip does not block a dirty switch: git carries non-conflicting
    // changes and refuses the rest on its own. The warning exists because the
    // silent success is what reads as data loss.
    const text = zh['branch.dirty']
    expect(text).toContain('未提交')
    expect(text).toContain('拒绝')
    expect(zh['branch.dirtyConfirm']).toBe('仍然切换')
  })
})

describe('branch listing cache', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('serves a settled listing within the TTL and refetches once it expires', async () => {
    vi.useFakeTimers()
    let calls = 0
    const fetchBranches = (): Promise<GitBranchesResult> => {
      calls += 1
      return Promise.resolve({ branches: [{ name: 'main', current: true }] })
    }
    await cachedGitBranches('w-ttl', fetchBranches)
    await cachedGitBranches('w-ttl', fetchBranches)
    expect(calls).toBe(1)
    vi.advanceTimersByTime(5_000)
    await cachedGitBranches('w-ttl', fetchBranches)
    expect(calls).toBe(2)
  })

  it('shares one in-flight fetch across concurrent mounts', async () => {
    let calls = 0
    let release: (result: GitBranchesResult) => void = () => {}
    const gate = new Promise<GitBranchesResult>(resolve => { release = resolve })
    const fetchBranches = (): Promise<GitBranchesResult> => {
      calls += 1
      return gate
    }
    const first = cachedGitBranches('w-share', fetchBranches)
    const second = cachedGitBranches('w-share', fetchBranches)
    expect(calls).toBe(1)
    release({ branches: [{ name: 'main', current: true }] })
    expect(await second).toEqual(await first)
  })

  it('does not cache error listings or rejected fetches', async () => {
    let calls = 0
    const fetchBranches = (): Promise<GitBranchesResult> => {
      calls += 1
      return calls === 1
        ? Promise.resolve({ error: { code: 'git-error', message: 'not a repository' } })
        : Promise.resolve({ branches: [] })
    }
    await cachedGitBranches('w-error', fetchBranches)
    const retried = await cachedGitBranches('w-error', fetchBranches)
    expect(calls).toBe(2)
    expect(retried).toEqual({ branches: [] })

    let rejections = 0
    const rejectOnce = (): Promise<GitBranchesResult> => {
      rejections += 1
      return rejections === 1 ? Promise.reject(new Error('transport gone')) : Promise.resolve({ branches: [] })
    }
    // The first call's rejection is the input under test, not a failure here.
    await cachedGitBranches('w-reject', rejectOnce).catch(() => {})
    await expect(cachedGitBranches('w-reject', rejectOnce)).resolves.toEqual({ branches: [] })
    expect(rejections).toBe(2)
  })

  it('drops the listing on invalidateBranchesCache (the post-checkout path)', async () => {
    vi.useFakeTimers()
    let calls = 0
    const fetchBranches = (): Promise<GitBranchesResult> => {
      calls += 1
      return Promise.resolve({ branches: [{ name: 'dev', current: true }] })
    }
    await cachedGitBranches('w-invalidate', fetchBranches)
    invalidateBranchesCache('w-invalidate')
    await cachedGitBranches('w-invalidate', fetchBranches)
    expect(calls).toBe(2)
  })
})
