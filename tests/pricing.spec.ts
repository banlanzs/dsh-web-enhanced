/**
 * models.dev pricing index: parsing, provider mapping, caching, and retry.
 * @module dsh-web-enhanced/tests/pricing
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { ModelsDevPricing, parseModelsDev } from '../src/pricing.ts'

const blob = {
  deepseek: {
    models: {
      'deepseek-chat': { cost: { input: 0.14, output: 0.28, cache_read: 0.0028 } },
      'deepseek-reasoner': { cost: { input: 0.55, output: 2.19, cache_read: 0.11, cache_write: 0.55 } },
      'no-price': { name: 'missing' },
    },
  },
  other: {
    models: {
      'deepseek-chat': { cost: { input: 9, output: 9 } },
    },
  },
}

function fakeFetch(impl: (url: string, init?: RequestInit) => Promise<Response> = async () =>
  new Response(JSON.stringify(blob), { status: 200, headers: { 'content-type': 'application/json' } })) {
  return vi.fn(impl) as unknown as typeof fetch
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('parseModelsDev', () => {
  it('indexes provider/model entries and skips models without usable prices', () => {
    const index = parseModelsDev(blob)
    expect(index.get('deepseek/deepseek-chat')).toEqual({
      input: 0.14, output: 0.28, cacheRead: 0.0028, cacheWrite: null,
    })
    expect(index.get('other/deepseek-chat')).toEqual({
      input: 9, output: 9, cacheRead: null, cacheWrite: null,
    })
    expect(index.has('deepseek/no-price')).toBe(false)
  })

  it('returns an empty index for non-object payloads', () => {
    expect(parseModelsDev(null).size).toBe(0)
    expect(parseModelsDev([]).size).toBe(0)
  })
})

describe('ModelsDevPricing', () => {
  function client(ttlMs = 60_000, fetchImpl = fakeFetch()) {
    return new ModelsDevPricing({
      url: 'https://models.dev/api.json',
      ttlMs,
      timeoutMs: 1000,
      providerMap: { 'deepseek-official': 'deepseek' },
      fetchImpl,
    })
  }

  it('maps the route provider and returns the model price', async () => {
    await expect(client().pricingFor('deepseek-official', 'deepseek-chat')).resolves.toEqual({
      input: 0.14, output: 0.28, cacheRead: 0.0028, cacheWrite: null,
    })
  })

  it('falls back to the bare model id and answers undefined for unknown entries', async () => {
    const c = client()
    await expect(c.pricingFor('unknown-route', 'deepseek-reasoner')).resolves.toMatchObject({ output: 2.19 })
    await expect(c.pricingFor('unknown-route', 'missing')).resolves.toBeUndefined()
  })

  it('fetches once per TTL and shares one in-flight request', async () => {
    const fetchImpl = fakeFetch()
    const c = client(10_000, fetchImpl)
    await Promise.all([
      c.pricingFor('deepseek-official', 'deepseek-chat'),
      c.pricingFor('deepseek-official', 'deepseek-reasoner'),
    ])
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    await c.pricingFor('deepseek-official', 'deepseek-chat')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('retries after a failed fetch instead of replaying the dead rejection', async () => {
    const fetchImpl = fakeFetch(async () => { throw new Error('offline') })
    const c = client(10_000, fetchImpl)
    await expect(c.pricingFor('deepseek-official', 'deepseek-chat')).rejects.toThrow('offline')
    fetchImpl.mockImplementation(async () => new Response(JSON.stringify(blob), { status: 200 }))
    await expect(c.pricingFor('deepseek-official', 'deepseek-chat')).resolves.toMatchObject({ input: 0.14 })
  })
})
