/**
 * Lane layout of the git graph: the pure placement pass that decides which
 * column each commit sits on and which rails pass it by.
 * @module dsh-web-enhanced/tests/lanes
 */

import { describe, expect, it } from 'vitest'
import { laneColor, layoutLanes, placeWorking, shortHash } from '../src/client/git/lanes.ts'
import type { GitCommitView } from '../src/types.ts'

/** One commit; `parents` drives every layout decision. */
function commit(hash: string, parents: string[] = []): GitCommitView {
  return { hash, parents, refs: [], author: 'a', date: 1, subject: hash }
}

describe('layoutLanes', () => {
  it('places a linear history on one lane', () => {
    const layout = layoutLanes([commit('c', ['b']), commit('b', ['a']), commit('a')])
    expect(layout.width).toBe(1)
    expect(layout.rows.map(row => row.lane)).toEqual([0, 0, 0])
    // The root ends its lane, so nothing passes below the last row.
    expect(layout.rows[2]!.through).toEqual([])
    expect(layout.rows[2]!.parentLanes).toEqual([])
  })

  it('opens a second lane for a diverged tip and reuses it after the merge', () => {
    // m merges feature into main; both sides go back to base.
    const layout = layoutLanes([
      commit('m', ['main1', 'feat1']),
      commit('main1', ['base']),
      commit('feat1', ['base']),
      commit('base'),
    ])
    expect(layout.width).toBe(2)
    expect(layout.rows[0]!.lane).toBe(0)
    // The merge's two parents occupy distinct lanes.
    expect(new Set(layout.rows[0]!.parentLanes).size).toBe(2)
    expect(layout.rows[1]!.lane).toBe(0)
    expect(layout.rows[2]!.lane).toBe(1)
    // Both sides converge on base, so it renders once on a single lane.
    expect(layout.rows[3]!.lane).toBe(0)
  })

  it('folds duplicate expectations so a merged commit renders one dot', () => {
    const layout = layoutLanes([
      commit('m', ['a', 'a']),
      commit('a'),
    ])
    const rowA = layout.rows[1]!
    expect(rowA.lane).toBe(0)
    // No second rail is left waiting on the same hash.
    expect(rowA.through).toEqual([])
  })

  it('reuses an idle lane rather than growing a column per tip', () => {
    // Two independent roots: the second tip takes the freed lane 0.
    const layout = layoutLanes([commit('x'), commit('y')])
    expect(layout.rows.map(row => row.lane)).toEqual([0, 0])
    expect(layout.width).toBe(1)
  })

  it('reports no columns for an empty history', () => {
    expect(layoutLanes([])).toEqual({ rows: [], width: 0 })
  })
})

describe('placeWorking', () => {
  it('sits above HEAD on HEAD lane, with the lanes that pass it by', () => {
    // Two tips: `x` is newer, but HEAD is `c` on the second lane.
    const layout = layoutLanes([commit('x', ['a']), commit('c', ['b']), commit('b'), commit('a')])
    const head = layout.rows.find(row => row.commit.hash === 'c')!
    const placement = placeWorking(layout.rows, 'c')
    expect(placement.index).toBe(1)
    expect(placement.lane).toBe(head.lane)
    // HEAD's own lane is excluded: the dashed stub draws it, and drawing both
    // would put a solid rail under a row that has no commit.
    expect(placement.through).not.toContain(head.lane)
    expect(placement.through).toEqual(layout.rows[0]!.through.filter(lane => lane !== head.lane))
  })

  it('goes to the top with nothing to connect to when HEAD is not drawn', () => {
    const layout = layoutLanes([commit('b', ['a']), commit('a')])
    // Filtered to a branch HEAD is not on, or HEAD fell past the row cap: the
    // changes are still real, so the row stays.
    expect(placeWorking(layout.rows, 'elsewhere')).toEqual({ index: 0, lane: 0, through: [] })
    expect(placeWorking([], 'anything')).toEqual({ index: 0, lane: 0, through: [] })
  })

  it('has no rails above it when HEAD is the first row', () => {
    const layout = layoutLanes([commit('b', ['a']), commit('a')])
    expect(placeWorking(layout.rows, 'b')).toEqual({ index: 0, lane: 0, through: [] })
  })
})

describe('laneColor', () => {
  it('wraps around the palette and tolerates an empty one', () => {
    expect(laneColor(0, 6)).toBe(0)
    expect(laneColor(7, 6)).toBe(1)
    expect(laneColor(3, 0)).toBe(0)
  })
})

describe('shortHash', () => {
  it('keeps the first seven characters', () => {
    expect(shortHash('0123456789abcdef')).toBe('0123456')
    expect(shortHash('abc')).toBe('abc')
  })
})
