/**
 * OpenCode Go usage client: response normalization, auth.json key reading,
 * and the last-good snapshot behavior the balance line relies on.
 * @module dsh-web-enhanced/tests/opencode-go
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  normalizeOpencodeGoResetAt, opencodeGoKeyFromAuth, OpencodeGoUsageClient,
  parseOpencodeGoUsage,
} from '../src/opencode-go.ts'

afterEach(() => { vi.unstubAllGlobals() })

const CONFIG = {
  apiKeyEnv: 'OPENCODE_GO_API_KEY',
  usageUrl: 'https://opencode.ai/zen/go/v1/usage',
  cacheTtlMs: 0,
  timeoutMs: 5_000,
  authFile: '/nonexistent/opencode/auth.json',
}

const USAGE_BODY = {
  usage: {
    rolling: { status: 'ok', percent: 9, resetsAt: 1756000000 },
    weekly: { status: 'ok', percent: 12, resetsAt: '2026-08-24T00:00:00Z' },
    monthly: { status: 'degraded', percent: 6, resetsAt: 1757000000 },
  },
}

describe('parseOpencodeGoUsage', () => {
  it('maps rolling/weekly to window keys and normalizes reset timestamps', () => {
    expect(parseOpencodeGoUsage(USAGE_BODY)).toEqual([
      { key: 'five_hour', usedPercent: 9, resetsAt: 1756000000000 },
      { key: 'seven_day', usedPercent: 12, resetsAt: Date.parse('2026-08-24T00:00:00Z') },
    ])
  })

  it('skips windows whose status is not ok or whose percent is missing', () => {
    expect(parseOpencodeGoUsage({ usage: { rolling: { status: 'nope', percent: 1 } } })).toEqual([])
    expect(parseOpencodeGoUsage({ usage: { rolling: { status: 'ok' } } })).toEqual([])
  })

  it('rejects structurally foreign payloads', () => {
    expect(parseOpencodeGoUsage(null)).toBeNull()
    expect(parseOpencodeGoUsage({})).toBeNull()
    expect(parseOpencodeGoUsage({ usage: [] })).toBeNull()
  })
})

describe('normalizeOpencodeGoResetAt', () => {
  it('accepts seconds, milliseconds, and ISO strings', () => {
    expect(normalizeOpencodeGoResetAt(1756000000)).toBe(1756000000000)
    expect(normalizeOpencodeGoResetAt(1756000000000)).toBe(1756000000000)
    expect(normalizeOpencodeGoResetAt('2026-08-24T00:00:00Z')).toBe(Date.parse('2026-08-24T00:00:00Z'))
  })

  it('returns null for unreadable values', () => {
    expect(normalizeOpencodeGoResetAt(null)).toBeNull()
    expect(normalizeOpencodeGoResetAt('not a date')).toBeNull()
    expect(normalizeOpencodeGoResetAt(Number.NaN)).toBeNull()
  })
})

describe('opencodeGoKeyFromAuth', () => {
  it('prefers the opencode-go entry and falls back to opencode', () => {
    expect(opencodeGoKeyFromAuth({ 'opencode-go': { key: 'sk-go' } })).toBe('sk-go')
    expect(opencodeGoKeyFromAuth({ opencode: { apiKey: 'sk-open' } })).toBe('sk-open')
    expect(opencodeGoKeyFromAuth({ 'opencode-go': {}, opencode: { accessToken: 'sk-token' } })).toBe('sk-token')
  })

  it('returns undefined for missing, blank, or malformed entries', () => {
    expect(opencodeGoKeyFromAuth(undefined)).toBeUndefined()
    expect(opencodeGoKeyFromAuth({ 'opencode-go': { key: ' ' } })).toBeUndefined()
    expect(opencodeGoKeyFromAuth('not json')).toBeUndefined()
  })
})

describe('OpencodeGoUsageClient', () => {
  it('returns a no-key view without touching the network', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const client = new OpencodeGoUsageClient(CONFIG, async () => undefined)
    const view = await client.get()
    expect(view.error?.code).toBe('opencode-go-no-key')
    expect(view.windows).toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('fetches with the resolved bearer key and parses the windows', async () => {
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify(USAGE_BODY), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchSpy)
    const client = new OpencodeGoUsageClient(CONFIG, async () => 'sk-test')
    const view = await client.get()
    expect(view.fetchedAt).not.toBeNull()
    expect(view.windows).toHaveLength(2)
    expect(fetchSpy).toHaveBeenCalledWith(CONFIG.usageUrl, expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer sk-test' }),
    }))
  })

  it('keeps the last good windows on a later failure and reports the error', async () => {
    const fetchSpy = vi.fn()
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify(USAGE_BODY), { status: 200 }))
    fetchSpy.mockResolvedValueOnce(new Response('gone', { status: 503 }))
    vi.stubGlobal('fetch', fetchSpy)
    const client = new OpencodeGoUsageClient(CONFIG, async () => 'sk-test')
    const first = await client.get()
    expect(first.error).toBeUndefined()
    // TTL 0 forces a refetch; the stale branch must still carry the windows.
    const second = await client.get()
    expect(second.error?.code).toBe('opencode-go-http')
    expect(second.windows).toEqual(first.windows)
    expect(second.fetchedAt).toBe(first.fetchedAt)
  })
})
