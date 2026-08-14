import { afterEach, describe, expect, it, vi } from 'vitest'
import { BalanceClient } from '../src/balance.ts'
import type { BalanceConfig } from '../src/balance.ts'

const config: BalanceConfig = { apiKeyEnv: 'WEB_ENHANCED_TEST_KEY', cacheTtlMs: 60_000, baseUrl: 'https://example.test' }

let fetchMock: ReturnType<typeof vi.fn>

function mount(body: unknown, ok = true): BalanceClient {
  fetchMock = vi.fn(async () => ({
    ok,
    status: ok ? 200 : 403,
    json: async () => body,
  }))
  vi.stubGlobal('fetch', fetchMock)
  return new BalanceClient(config)
}

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.WEB_ENHANCED_TEST_KEY
})

describe('BalanceClient', () => {
  it('returns a no-api-key view without fetching', async () => {
    const client = mount({})
    const view = await client.get()
    expect(view).toMatchObject({ isAvailable: false, error: { code: 'no-api-key' } })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches with the bearer key and parses the payload', async () => {
    process.env.WEB_ENHANCED_TEST_KEY = 'sk-test'
    const client = mount({
      is_available: true,
      balance_infos: [{ currency: 'CNY', total_balance: '10.5', granted_balance: 2, topped_up_balance: '8.5' }],
    })
    const view = await client.get()
    expect(view).toMatchObject({
      isAvailable: true,
      cachedAt: expect.any(Number),
      infos: [{ currency: 'CNY', totalBalance: 10.5, grantedBalance: 2, toppedUpBalance: 8.5 }],
    })
    expect('error' in view).toBe(false)
    expect(fetchMock).toHaveBeenCalledWith('https://example.test/user/balance', {
      headers: { Accept: 'application/json', Authorization: 'Bearer sk-test' },
    })
  })

  it('caches within the TTL and refetches after it', async () => {
    process.env.WEB_ENHANCED_TEST_KEY = 'sk-test'
    const client = mount({ is_available: false, balance_infos: [] })
    await client.get()
    await client.get()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 120_000)
    await client.get()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('clear drops the cached view', async () => {
    process.env.WEB_ENHANCED_TEST_KEY = 'sk-test'
    const client = mount({ is_available: false, balance_infos: [] })
    await client.get()
    client.clear()
    await client.get()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('maps network failure and non-2xx responses to error views', async () => {
    process.env.WEB_ENHANCED_TEST_KEY = 'sk-test'
    fetchMock = vi.fn(async () => { throw new Error('ECONNREFUSED') })
    vi.stubGlobal('fetch', fetchMock)
    const unreachable = new BalanceClient(config)
    expect((await unreachable.get()).error?.code).toBe('balance-unreachable')

    const http = mount({}, false)
    expect((await http.get()).error?.code).toBe('balance-http')
  })

  it('maps invalid JSON and malformed payloads to error views', async () => {
    process.env.WEB_ENHANCED_TEST_KEY = 'sk-test'
    fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => { throw new Error('bad json') },
    }))
    vi.stubGlobal('fetch', fetchMock)
    expect((await new BalanceClient(config).get()).error?.code).toBe('balance-invalid')

    const notObject = mount('nope')
    expect((await notObject.get()).error?.code).toBe('balance-invalid')
  })

  it('drops malformed info lines and tolerates missing numeric fields', async () => {
    process.env.WEB_ENHANCED_TEST_KEY = 'sk-test'
    const client = mount({
      is_available: false,
      balance_infos: [
        null,
        { currency: 5 },
        { currency: 'USD' },
        { currency: 'EUR', total_balance: 'not-a-number', granted_balance: Infinity, topped_up_balance: 3 },
        { currency: 'JPY', total_balance: '   ', granted_balance: 'abc', topped_up_balance: 1.5 },
      ],
    })
    const view = await client.get()
    expect(view.infos).toEqual([
      { currency: 'USD', totalBalance: 0, grantedBalance: 0, toppedUpBalance: 0 },
      { currency: 'EUR', totalBalance: 0, grantedBalance: 0, toppedUpBalance: 3 },
      { currency: 'JPY', totalBalance: 0, grantedBalance: 0, toppedUpBalance: 1.5 },
    ])
    expect(view.isAvailable).toBe(false)
  })

  it('treats a non-array balance_infos payload as empty', async () => {
    process.env.WEB_ENHANCED_TEST_KEY = 'sk-test'
    const client = mount({ is_available: true, balance_infos: 'nope' })
    const view = await client.get()
    expect(view).toMatchObject({ isAvailable: true, infos: [] })
  })
})
