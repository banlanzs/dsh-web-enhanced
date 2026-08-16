/**
 * Background budgeting behavior: plan ordering, byte estimation, and the
 * budget test. Canvas encoding itself is browser-only and stays untested here.
 * @module dsh-web-enhanced/tests/background
 */

import { describe, expect, it } from 'vitest'
import { approxBytesOf, BACKGROUND_MAX_CHARS, compressionPlan, fitsBudget } from '../src/client/skins/background.ts'

describe('background compression plan', () => {
  it('descends by edge before quality and never drops below the floor', () => {
    const plan = compressionPlan()
    expect(plan.length).toBeGreaterThan(1)
    for (let i = 1; i < plan.length; i++) {
      const prev = plan[i - 1]
      const step = plan[i]
      const coarser = step.maxEdge < prev.maxEdge
        || (step.maxEdge === prev.maxEdge && step.quality < prev.quality)
      expect(coarser, `${i}: ${JSON.stringify(step)} must be coarser than ${JSON.stringify(prev)}`).toBe(true)
    }
    for (const step of plan) {
      expect(step.maxEdge).toBeGreaterThanOrEqual(800)
      expect(step.quality).toBeGreaterThan(0)
      expect(step.quality).toBeLessThanOrEqual(1)
    }
  })

  it('hands out independent copies', () => {
    const plan = compressionPlan()
    plan[0] = { maxEdge: 1, quality: 0.1 }
    expect(compressionPlan()[0].maxEdge).not.toBe(1)
  })
})

describe('background budget', () => {
  it('approximates payload bytes from base64 padding', () => {
    // 'AA==': 4 payload chars, 2 padding → 1 byte.
    expect(approxBytesOf('data:image/png;base64,AA==')).toBe(1)
    // 'AAA': 3 chars, no padding → 2 bytes (floor of 2.25).
    expect(approxBytesOf('data:image/png;base64,AAA')).toBe(2)
    // No comma: the whole string is payload.
    expect(approxBytesOf('QUJD')).toBe(3)
  })

  it('accepts values within and rejects values over the character budget', () => {
    expect(fitsBudget('x'.repeat(BACKGROUND_MAX_CHARS))).toBe(true)
    expect(fitsBudget('x'.repeat(BACKGROUND_MAX_CHARS + 1))).toBe(false)
  })
})
