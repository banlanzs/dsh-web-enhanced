/**
 * Session-cost arithmetic for the balance line.
 *
 * The token-usage projection bills in four buckets (uncached input, cache
 * read, cache write, output) and models.dev prices are USD per one million
 * tokens. The readout is an estimate by design: projections are the host's
 * durable accounting, but a price can lag a vendor's repricing.
 * @module dsh-web-enhanced/src/client/balance/cost
 */

import type { DeepSeekRateWindow, ModelPricingView } from '../contract.ts'

/** The four token buckets the host's token-usage projection carries. */
export interface TokenUsage {
  readonly uncachedInputTokens: number
  readonly cacheReadTokens: number
  readonly cacheWriteTokens: number
  readonly outputTokens: number
}

/**
 * Cost of one session's billed tokens under one model's prices.
 * @param usage - the session's token-usage projection.
 * @param pricing - per-million-token prices from models.dev.
 * @returns USD cost (rounded to the floating-point value), or null when no token was billed.
 */
export function sessionCostOf(usage: TokenUsage | undefined, pricing: ModelPricingView | undefined): number | null {
  if (usage === undefined || pricing === undefined) return null
  const billed = usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens + usage.outputTokens
  if (billed <= 0) return null
  const cacheRead = pricing.cacheRead ?? pricing.input
  const cacheWrite = pricing.cacheWrite ?? pricing.input
  const cost = (
    usage.uncachedInputTokens * pricing.input
    + usage.cacheReadTokens * cacheRead
    + usage.cacheWriteTokens * cacheWrite
    + usage.outputTokens * pricing.output
  ) / 1_000_000
  return Math.max(0, cost)
}

/**
 * Format a USD estimate: four decimals while it is under one cent, then two.
 * @param cost - USD amount.
 * @returns the prefixed display string.
 */
export function formatUsdCost(cost: number): string {
  if (cost === 0) return '$0.00'
  return cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(2)}`
}

/**
 * Cost of one session's billed tokens under the active DeepSeek CNY rate.
 * @param usage - the session's token-usage projection.
 * @param rate - the active DeepSeek price window (null outside the table).
 * @returns CNY cost, or null when no tokens were billed or no rate exists.
 */
export function sessionCostCnyOf(usage: TokenUsage | undefined, rate: DeepSeekRateWindow | null | undefined): number | null {
  if (usage === undefined || rate === null || rate === undefined) return null
  const billed = usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens + usage.outputTokens
  if (billed <= 0) return null
  const cost = (
    usage.uncachedInputTokens * rate.inputCacheMiss
    + usage.cacheReadTokens * rate.inputCacheHit
    + usage.cacheWriteTokens * rate.inputCacheMiss
    + usage.outputTokens * rate.output
  ) / 1_000_000
  return Math.max(0, cost)
}

/**
 * Format a CNY estimate: four decimals while it is under one cent, then two.
 * @param cost - CNY amount.
 * @returns the prefixed display string.
 */
export function formatCnyCost(cost: number): string {
  if (cost === 0) return '¥0.000'
  return cost < 0.01 ? `¥${cost.toFixed(4)}` : `¥${cost.toFixed(3)}`
}
