/**
 * Branch-switch decisions that are not React.
 *
 * The strip itself is not rendered here (node environment, no DOM), so what is
 * pinned is the judgement the switch depends on: how much uncommitted work a
 * checkout would carry, and whether it is the kind git refuses over.
 * @module dsh-web-enhanced/tests/branch
 */

import { describe, expect, it } from 'vitest'
import { dirtySummary } from '../src/client/git/BranchStrip.tsx'
import { zh } from '../src/client/locales.ts'
import type { GitStatusEntry } from '../src/types.ts'

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
