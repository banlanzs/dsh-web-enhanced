/**
 * DeepSeek peak/off-peak clock: the Beijing boundary mapping and the rate
 * view per model. Times are epoch-ms in UTC; the assertions pick instants
 * whose Beijing wall clock is unambiguous.
 * @module dsh-web-enhanced/tests/deepseek-rate
 */

import { describe, expect, it } from 'vitest'
import {
  currentDeepSeekPeriod, deepseekRateFor, nextDeepSeekSwitchAt, nextDeepSeekSwitchLabel,
} from '../src/deepseek-rate.ts'

/** `2026-08-17T01:30:00Z` = Beijing 09:30 (peak). */
const PEAK = Date.UTC(2026, 7, 17, 1, 30)
/** `2026-08-17T00:30:00Z` = Beijing 08:30 (off-peak). */
const OFFPEAK = Date.UTC(2026, 7, 17, 0, 30)
/** `2026-08-17T10:30:00Z` = Beijing 18:30 (past the last bound). */
const EVENING = Date.UTC(2026, 7, 17, 10, 30)

describe('currentDeepSeekPeriod', () => {
  it('treats 09:00–12:00 and 14:00–18:00 Beijing as peak', () => {
    expect(currentDeepSeekPeriod(PEAK)).toBe('peak')
    expect(currentDeepSeekPeriod(Date.UTC(2026, 7, 17, 6, 30))).toBe('peak') // 14:30 Beijing
  })

  it('treats the rest of the Beijing day as off-peak', () => {
    expect(currentDeepSeekPeriod(OFFPEAK)).toBe('offpeak')
    expect(currentDeepSeekPeriod(Date.UTC(2026, 7, 17, 4, 30))).toBe('offpeak') // 12:30 Beijing
    expect(currentDeepSeekPeriod(EVENING)).toBe('offpeak')
  })
})

describe('nextDeepSeekSwitchAt', () => {
  it('advances to the next boundary inside the same Beijing day', () => {
    expect(nextDeepSeekSwitchAt(OFFPEAK)).toBe(Date.UTC(2026, 7, 17, 1, 0)) // 09:00 Beijing
    expect(nextDeepSeekSwitchAt(PEAK)).toBe(Date.UTC(2026, 7, 17, 4, 0)) // 12:00 Beijing
  })

  it('rolls over to tomorrow 09:00 after the 18:00 bound', () => {
    expect(nextDeepSeekSwitchAt(EVENING)).toBe(Date.UTC(2026, 7, 18, 1, 0))
  })

  it('spells the switch in Beijing HH:MM', () => {
    expect(nextDeepSeekSwitchLabel(OFFPEAK)).toBe('09:00')
  })
})

describe('deepseekRateFor', () => {
  it('selects peak and off-peak prices for the V4 models', () => {
    expect(deepseekRateFor('deepseek-v4-flash', PEAK)).toMatchObject({
      mode: 'peak-valley',
      period: 'peak',
      prices: { inputCacheHit: 0.10, inputCacheMiss: 3.0, output: 9.0 },
      nextIsPeak: false,
      nextSwitchLabel: '12:00',
    })
    expect(deepseekRateFor('deepseek-v4-flash', OFFPEAK)).toMatchObject({
      mode: 'peak-valley',
      period: 'offpeak',
      prices: { inputCacheHit: 0.05, inputCacheMiss: 1.5, output: 4.5 },
      nextIsPeak: true,
      nextSwitchLabel: '09:00',
    })
  })

  it('serves the legacy chat model as a flat rate without a switch', () => {
    expect(deepseekRateFor('deepseek-chat', PEAK)).toMatchObject({
      mode: 'flat',
      period: 'flat',
      prices: { inputCacheMiss: 2.0, output: 8.0 },
      nextSwitchAt: null,
      nextSwitchLabel: null,
    })
  })

  it('marks unknown models so the UI hides the period group', () => {
    expect(deepseekRateFor('some-other-model', PEAK)).toMatchObject({
      mode: 'unknown',
      prices: null,
      nextSwitchAt: null,
    })
  })
})
