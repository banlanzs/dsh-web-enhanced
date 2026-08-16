/**
 * Session-cost arithmetic: token buckets × models.dev per-million prices.
 * @module dsh-web-enhanced/tests/cost
 */

import { describe, expect, it } from 'vitest'
import {
  formatCnyCost, formatUsdCost, sessionCostCnyOf, sessionCostOf,
} from '../src/client/balance/cost.ts'

const pricing = { input: 0.14, output: 0.28, cacheRead: 0.0028, cacheWrite: null }

describe('sessionCostOf', () => {
  it('bills uncached input at the input price and output at the output price', () => {
    expect(sessionCostOf(
      { uncachedInputTokens: 1_000_000, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 1_000_000 },
      pricing,
    )).toBeCloseTo(0.42)
  })

  it('bills cache reads at their own price and cache writes by falling back to input', () => {
    expect(sessionCostOf(
      { uncachedInputTokens: 0, cacheReadTokens: 1_000_000, cacheWriteTokens: 0, outputTokens: 0 },
      pricing,
    )).toBeCloseTo(0.0028)
    expect(sessionCostOf(
      { uncachedInputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 1_000_000, outputTokens: 0 },
      pricing,
    )).toBeCloseTo(0.14)
  })

  it('answers null until both a billed token and a price exist', () => {
    expect(sessionCostOf(undefined, pricing)).toBeNull()
    expect(sessionCostOf({ uncachedInputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0 }, pricing)).toBeNull()
    expect(sessionCostOf({ uncachedInputTokens: 10, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0 }, undefined)).toBeNull()
  })
})

describe('formatUsdCost', () => {
  it('keeps sub-cent estimates readable and settles to cents above one cent', () => {
    expect(formatUsdCost(0)).toBe('$0.00')
    expect(formatUsdCost(0.0042)).toBe('$0.0042')
    expect(formatUsdCost(0.123456)).toBe('$0.12')
  })
})

describe('sessionCostCnyOf', () => {
  const rate = { inputCacheHit: 0.1, inputCacheMiss: 3, output: 9 }

  it('bills the four token buckets at the active CNY window', () => {
    expect(sessionCostCnyOf(
      {
        uncachedInputTokens: 1_000_000,
        cacheReadTokens: 1_000_000,
        cacheWriteTokens: 1_000_000,
        outputTokens: 1_000_000,
      },
      rate,
    )).toBeCloseTo(3 + 0.1 + 3 + 9)
  })

  it('answers null without billed tokens or a DeepSeek rate', () => {
    expect(sessionCostCnyOf(
      { uncachedInputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0 },
      rate,
    )).toBeNull()
    expect(sessionCostCnyOf(
      { uncachedInputTokens: 10, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0 },
      null,
    )).toBeNull()
  })
})

describe('formatCnyCost', () => {
  it('keeps four decimals below one cent and settles to three above', () => {
    expect(formatCnyCost(0)).toBe('¥0.000')
    expect(formatCnyCost(0.0042)).toBe('¥0.0042')
    expect(formatCnyCost(0.123456)).toBe('¥0.123')
  })
})
