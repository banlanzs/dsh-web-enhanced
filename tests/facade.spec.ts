/**
 * Remote envelope adapter: a mounted namespace method resolves to
 * `RemoteResult<T>`, and every component reads this plugin's own
 * success-or-`{ error }` union instead.
 * @module dsh-web-enhanced/tests/facade
 */

import { describe, expect, it, vi } from 'vitest'
import { createRemoteFacade } from '../src/client/facade.ts'
import type { RawWebEnhancedNamespace } from '../src/client/facade.ts'

/** A raw namespace whose methods resolve to the supplied envelopes. */
function rawWith(overrides: Partial<RawWebEnhancedNamespace>): RawWebEnhancedNamespace {
  return overrides as RawWebEnhancedNamespace
}

/** The envelope a carrier failure produces (404, offline, unmounted method). */
const carrierFailure = {
  ok: false as const,
  error: { code: 'not-found', message: 'no such Remote method', details: {} },
}

describe('createRemoteFacade', () => {
  it('unwraps a successful envelope to the host payload', async () => {
    const taskList = vi.fn(async () => ({ ok: true as const, value: { tasks: [] } }))
    const facade = createRemoteFacade(rawWith({ taskList }))
    expect(await facade.taskList()).toEqual({ tasks: [] })
  })

  it('folds a carrier failure into the error branch components already narrow on', async () => {
    // Without this the component reads `{ ok: false, error }` as if it were
    // the payload and crashes on the first missing field.
    const facade = createRemoteFacade(rawWith({
      taskList: vi.fn(async () => carrierFailure),
      gitStatus: vi.fn(async () => carrierFailure),
      fsList: vi.fn(async () => carrierFailure),
      modelRouteDescribe: vi.fn(async () => carrierFailure),
      deepseekRateGet: vi.fn(async () => carrierFailure),
    }))
    expect(await facade.taskList()).toEqual({ error: { code: 'not-found', message: 'no such Remote method' } })
    expect(await facade.gitStatus({ workspaceId: 'w1' })).toEqual({ error: { code: 'not-found', message: 'no such Remote method' } })
    expect(await facade.fsList({ workspaceId: 'w1' })).toEqual({ error: { code: 'not-found', message: 'no such Remote method' } })
    expect(await facade.modelRouteDescribe({ provider: 'p', model: 'm' }))
      .toEqual({ error: { code: 'not-found', message: 'no such Remote method' } })
    expect(await facade.deepseekRateGet({ model: 'm' }))
      .toEqual({ error: { code: 'not-found', message: 'no such Remote method' } })
  })

  it('keeps a failed balance query a renderable, still-applicable BalanceView', async () => {
    // BalanceView is not a union — it carries its own optional error — so the
    // fallback must still satisfy the shape the line renders from. It stays
    // applicable: an unreachable host says nothing about which channel the
    // session runs on, and hiding on a transport blip would read as "this
    // model has no balance".
    const facade = createRemoteFacade(rawWith({ balanceGet: vi.fn(async () => carrierFailure) }), () => 1234)
    expect(await facade.balanceGet({ provider: 'deepseek-official' })).toEqual({
      applicable: true,
      isAvailable: false,
      infos: [],
      cachedAt: 1234,
      error: { code: 'not-found', message: 'no such Remote method' },
    })
  })

  it('keeps a failed OpenCode Go query a renderable usage view', async () => {
    const facade = createRemoteFacade(rawWith({ opencodeGoUsageGet: vi.fn(async () => carrierFailure) }), () => 1234)
    expect(await facade.opencodeGoUsageGet()).toEqual({
      provider: 'opencode-go',
      plan: 'OpenCode Go',
      windows: [],
      fetchedAt: null,
      error: { code: 'not-found', message: 'no such Remote method' },
    })
  })

  it('passes the request object through unchanged', async () => {
    const gitDiff = vi.fn(async () => ({ ok: true as const, value: { text: 'diff' } }))
    const facade = createRemoteFacade(rawWith({ gitDiff }))
    await facade.gitDiff({ workspaceId: 'w1', path: 'a.ts', staged: true })
    // One request object, matching the descriptor's single `request` parameter.
    expect(gitDiff).toHaveBeenCalledWith({ workspaceId: 'w1', path: 'a.ts', staged: true })
    expect(gitDiff.mock.calls[0]).toHaveLength(1)
  })
})
