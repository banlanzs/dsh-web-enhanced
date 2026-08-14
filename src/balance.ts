/**
 * DeepSeek balance query: resolves the API key the same way the model
 * provider does (an environment variable, by default `DEEPSEEK_API_KEY`),
 * calls `/user/balance`, and caches the view. Failures are result fields.
 * @module dsh-web-enhanced/src/balance
 */

import type { BalanceInfo, BalanceView } from './types.ts'

/** Balance client configuration (deployment config, not tunables). */
export interface BalanceConfig {
  readonly apiKeyEnv: string
  readonly cacheTtlMs: number
  readonly baseUrl: string
}

/** Balance query client with a short-lived view cache. */
export class BalanceClient {
  private cache: { readonly at: number; readonly value: BalanceView } | null = null

  /**
   * @param config - key source, cache TTL, and endpoint base.
   */
  constructor(private readonly config: BalanceConfig) {}

  /** Cached or freshly fetched balance view. */
  async get(): Promise<BalanceView> {
    const now = Date.now()
    if (this.cache !== null && now - this.cache.at < this.config.cacheTtlMs) return this.cache.value
    const view = await this.fetchBalance(now)
    this.cache = { at: now, value: view }
    return view
  }

  /** Drop the cached view (the settings plane can force a refresh). */
  clear(): void {
    this.cache = null
  }

  private async fetchBalance(now: number): Promise<BalanceView> {
    const key = process.env[this.config.apiKeyEnv]
    if (key === undefined || key.trim() === '') {
      return {
        isAvailable: false, infos: [], cachedAt: now,
        error: { code: 'no-api-key', message: `environment variable ${this.config.apiKeyEnv} is not set` },
      }
    }
    let response: Response
    try {
      response = await fetch(`${this.config.baseUrl}/user/balance`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${key}` },
      })
    } catch {
      return {
        isAvailable: false, infos: [], cachedAt: now,
        error: { code: 'balance-unreachable', message: 'the balance endpoint could not be reached' },
      }
    }
    if (!response.ok) {
      return {
        isAvailable: false, infos: [], cachedAt: now,
        error: { code: 'balance-http', message: `balance endpoint answered ${response.status}` },
      }
    }
    let body: unknown
    try {
      body = await response.json()
    } catch {
      return {
        isAvailable: false, infos: [], cachedAt: now,
        error: { code: 'balance-invalid', message: 'the balance response was not JSON' },
      }
    }
    return parseBalanceBody(body, now)
  }
}

/** Validate and project the endpoint payload; malformed lines are dropped. */
function parseBalanceBody(body: unknown, now: number): BalanceView {
  if (typeof body !== 'object' || body === null) {
    return {
      isAvailable: false, infos: [], cachedAt: now,
      error: { code: 'balance-invalid', message: 'unexpected balance payload' },
    }
  }
  const record = body as Record<string, unknown>
  const rawInfos = Array.isArray(record['balance_infos']) ? record['balance_infos'] : []
  const infos: BalanceInfo[] = []
  for (const raw of rawInfos) {
    if (typeof raw !== 'object' || raw === null) continue
    const info = raw as Record<string, unknown>
    if (typeof info['currency'] !== 'string') continue
    infos.push({
      currency: info['currency'],
      totalBalance: toNumber(info['total_balance']),
      grantedBalance: toNumber(info['granted_balance']),
      toppedUpBalance: toNumber(info['topped_up_balance']),
    })
  }
  return { isAvailable: record['is_available'] === true, infos, cachedAt: now }
}

/** Numeric projection tolerant of JSON numbers and numeric strings. */
function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}
