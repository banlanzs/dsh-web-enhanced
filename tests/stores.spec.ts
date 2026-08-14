/**
 * Shared client state: the persisted cell, per-workspace panel geometry, and
 * the preview tab set.
 *
 * Runs under jsdom: the panel cell mirrors its geometry to localStorage, and
 * persistence across instances is part of the behaviour under test.
 * @vitest-environment jsdom
 * @module dsh-web-enhanced/tests/stores
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PANEL_DEFAULT_WIDTH, PANEL_MAX_WIDTH, PANEL_MIN_WIDTH, activeTabOf, clampPanelWidth, createCell,
  createOverlay, createPanel, createPreview, panelCollapsedOf, panelWidthOf,
} from '../src/client/stores.ts'
import type { PreviewTab } from '../src/client/contract.ts'

/** One preview tab. */
function tab(path: string, content = 'body'): PreviewTab {
  return { path, name: path, kind: 'text', mode: 'source', content, truncated: false, size: content.length }
}

beforeEach(() => {
  localStorage.clear()
})

describe('createCell', () => {
  it('notifies subscribers only when the value actually changed', () => {
    const cell = createCell({ n: 0 })
    const seen = vi.fn()
    cell.subscribe(seen)
    cell.update(current => current)
    expect(seen).not.toHaveBeenCalled()
    cell.update(() => ({ n: 1 }))
    expect(seen).toHaveBeenCalledTimes(1)
    expect(cell.getSnapshot()).toEqual({ n: 1 })
  })

  it('keeps a stable snapshot reference between writes', () => {
    const cell = createCell({ n: 0 })
    expect(cell.getSnapshot()).toBe(cell.getSnapshot())
  })

  it('stops notifying an unsubscribed listener', () => {
    const cell = createCell({ n: 0 })
    const seen = vi.fn()
    cell.subscribe(seen)()
    cell.update(() => ({ n: 1 }))
    expect(seen).not.toHaveBeenCalled()
  })

  it('restores persisted state and writes changes back', () => {
    const revive = (raw: unknown): { n: number } | undefined =>
      typeof raw === 'object' && raw !== null && typeof (raw as { n?: unknown }).n === 'number'
        ? { n: (raw as { n: number }).n }
        : undefined
    createCell({ n: 0 }, { key: 'k', revive }).update(() => ({ n: 7 }))
    expect(createCell({ n: 0 }, { key: 'k', revive }).getSnapshot()).toEqual({ n: 7 })
  })

  it('falls back to the initial value when storage is unparseable or rejected', () => {
    const revive = (): undefined => undefined
    localStorage.setItem('bad', '{ not json')
    expect(createCell({ n: 1 }, { key: 'bad', revive }).getSnapshot()).toEqual({ n: 1 })
    localStorage.setItem('rejected', '{"n":2}')
    expect(createCell({ n: 1 }, { key: 'rejected', revive }).getSnapshot()).toEqual({ n: 1 })
  })
})

describe('overlay', () => {
  it('opens one overlay at a time and closes idempotently', () => {
    const { cell, actions } = createOverlay()
    expect(cell.getSnapshot().open).toBeNull()
    actions.openOverlay('board')
    expect(cell.getSnapshot().open).toBe('board')
    actions.openOverlay('graph')
    expect(cell.getSnapshot().open).toBe('graph')
    actions.closeOverlay()
    const closed = cell.getSnapshot()
    actions.closeOverlay()
    expect(cell.getSnapshot()).toBe(closed)
  })
})

describe('panel geometry', () => {
  it('clamps a requested width into the supported range', () => {
    expect(clampPanelWidth(10)).toBe(PANEL_MIN_WIDTH)
    expect(clampPanelWidth(99999)).toBe(PANEL_MAX_WIDTH)
    expect(clampPanelWidth(Number.NaN)).toBe(PANEL_DEFAULT_WIDTH)
    expect(clampPanelWidth(400.4)).toBe(400)
  })

  it('keeps width and collapse per workspace', () => {
    const { cell, actions } = createPanel()
    actions.setWidth('w1', 500)
    actions.setCollapsed('w2', true)
    const state = cell.getSnapshot()
    expect(panelWidthOf(state, 'w1')).toBe(500)
    expect(panelWidthOf(state, 'w2')).toBe(PANEL_DEFAULT_WIDTH)
    expect(panelCollapsedOf(state, 'w2')).toBe(true)
    expect(panelCollapsedOf(state, 'w1')).toBe(false)
    expect(panelWidthOf(state, undefined)).toBe(PANEL_DEFAULT_WIDTH)
  })

  it('restores the default width on reset', () => {
    const { cell, actions } = createPanel()
    actions.setWidth('w1', 700)
    actions.resetWidth('w1')
    expect(panelWidthOf(cell.getSnapshot(), 'w1')).toBe(PANEL_DEFAULT_WIDTH)
  })

  it('toggles directory expansion per workspace', () => {
    const { cell, actions } = createPanel()
    actions.toggleExpanded('w1', 'src')
    expect(cell.getSnapshot().expanded['w1']).toEqual(['src'])
    actions.toggleExpanded('w1', 'src')
    expect(cell.getSnapshot().expanded['w1']).toEqual([])
  })

  it('persists geometry across instances but starts the filter empty', () => {
    const first = createPanel()
    first.actions.setWidth('w1', 512)
    first.actions.setCollapsed('w1', true)
    first.actions.toggleExpanded('w1', 'src')
    first.actions.selectTab('scm')
    first.actions.setQuery('needle')

    const restored = createPanel().cell.getSnapshot()
    expect(restored.width['w1']).toBe(512)
    expect(restored.collapsed['w1']).toBe(true)
    expect(restored.expanded['w1']).toEqual(['src'])
    expect(restored.tab).toBe('scm')
    // The filter is a live gesture, not geometry.
    expect(restored.query).toBe('')
  })

  it('drops persisted values that are not the stored shape', () => {
    localStorage.setItem('dsh.webEnhanced.panel.v1', JSON.stringify({
      tab: 'nope', collapsed: { w1: 'yes' }, width: { w1: 'wide', w2: 99999 }, expanded: { w1: [1, 'src'] },
    }))
    const state = createPanel().cell.getSnapshot()
    expect(state.tab).toBe('files')
    expect(state.collapsed).toEqual({})
    // A stale out-of-range number is clamped rather than discarded.
    expect(state.width).toEqual({ w2: PANEL_MAX_WIDTH })
    expect(state.expanded['w1']).toEqual(['src'])
  })
})

describe('preview tabs', () => {
  it('opens, focuses, and replaces by path', () => {
    const { cell, actions } = createPreview()
    actions.openTab(tab('a.ts'))
    actions.openTab(tab('b.ts'))
    expect(cell.getSnapshot().active).toBe('b.ts')
    actions.focusTab('a.ts')
    expect(cell.getSnapshot().active).toBe('a.ts')
    actions.openTab(tab('a.ts', 'fresh'))
    expect(cell.getSnapshot().tabs).toHaveLength(2)
    expect(activeTabOf(cell.getSnapshot())?.content).toBe('fresh')
  })

  it('activates the left neighbour when the active tab closes', () => {
    const { cell, actions } = createPreview()
    actions.openTab(tab('a.ts'))
    actions.openTab(tab('b.ts'))
    actions.openTab(tab('c.ts'))
    actions.focusTab('b.ts')
    actions.closeTab('b.ts')
    expect(cell.getSnapshot().active).toBe('a.ts')
    // Closing the leftmost falls to the new first tab.
    actions.closeTab('a.ts')
    expect(cell.getSnapshot().active).toBe('c.ts')
    actions.closeTab('c.ts')
    expect(cell.getSnapshot().active).toBeNull()
  })

  it('leaves the selection alone when a background tab closes', () => {
    const { cell, actions } = createPreview()
    actions.openTab(tab('a.ts'))
    actions.openTab(tab('b.ts'))
    actions.closeTab('a.ts')
    expect(cell.getSnapshot().active).toBe('b.ts')
  })

  it('tracks a draft and commits it into the content', () => {
    const { cell, actions } = createPreview()
    actions.openTab(tab('a.ts', 'old'))
    actions.setDraft('a.ts', 'new')
    expect(activeTabOf(cell.getSnapshot())?.draft).toBe('new')
    actions.commitDraft('a.ts')
    const saved = activeTabOf(cell.getSnapshot())!
    expect(saved.content).toBe('new')
    expect(saved.draft).toBeUndefined()
  })

  it('ignores mutations addressed to a closed tab', () => {
    const { cell, actions } = createPreview()
    const before = cell.getSnapshot()
    actions.setDraft('ghost.ts', 'x')
    actions.setMode('ghost.ts', 'view')
    actions.focusTab('ghost.ts')
    expect(cell.getSnapshot()).toBe(before)
  })

  it('clears every tab when the workspace changes', () => {
    const { cell, actions } = createPreview()
    actions.openTab(tab('a.ts'))
    actions.clearTabs()
    expect(cell.getSnapshot()).toEqual({ tabs: [], active: null })
  })
})
