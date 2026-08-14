import { describe, expect, it } from 'vitest'
import { nextAfter, parseCron } from '../src/cron.ts'

describe('parseCron', () => {
  it('parses stars, steps, ranges, lists, and plain numbers', () => {
    const spec = parseCron('*/15 9-17 1,15 2,4 0-6')
    expect([...spec.minutes]).toEqual([0, 15, 30, 45])
    expect([...spec.hours]).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17])
    expect([...spec.days]).toEqual([1, 15])
    expect([...spec.months]).toEqual([2, 4])
    expect([...spec.weekdays]).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('maps day-of-week 7 to Sunday', () => {
    const spec = parseCron('0 0 * * 7')
    expect(spec.weekdays.has(0)).toBe(true)
    expect(spec.weekdays.has(7)).toBe(false)
  })

  it('rejects a wrong field count', () => {
    expect(() => parseCron('* * * *')).toThrow(/expected 5 fields/)
  })

  it('rejects empty list items', () => {
    expect(() => parseCron('1,,2 * * * *')).toThrow(/empty list item/)
  })

  it('rejects a bare step', () => {
    expect(() => parseCron('/5 * * * *')).toThrow(/step requires a base/)
  })

  it('rejects a non-numeric or zero step', () => {
    expect(() => parseCron('*/x * * * *')).toThrow(/invalid step/)
    expect(() => parseCron('*/0 * * * *')).toThrow(/positive integer/)
  })

  it('rejects non-numeric values and ranges', () => {
    expect(() => parseCron('x * * * *')).toThrow(/invalid value/)
    expect(() => parseCron('1-x * * * *')).toThrow(/invalid range/)
    expect(() => parseCron('1- * * * *')).toThrow(/invalid range/)
  })

  it('rejects out-of-range and reversed ranges', () => {
    expect(() => parseCron('60 * * * *')).toThrow(/outside/)
    expect(() => parseCron('* 24 * * *')).toThrow(/outside/)
    expect(() => parseCron('* * 0 * *')).toThrow(/outside/)
    expect(() => parseCron('* * * 13 *')).toThrow(/outside/)
    expect(() => parseCron('* * * * 8')).toThrow(/outside/)
    expect(() => parseCron('5-1 * * * *')).toThrow(/outside/)
  })
})

describe('nextAfter', () => {
  it('finds the next minute for a wildcard expression', () => {
    const spec = parseCron('* * * * *')
    const from = new Date(2026, 7, 15, 12, 30, 45).getTime()
    expect(nextAfter(spec, from)).toBe(from + 15_000)
  })

  it('finds the daily 23:00 strictly after the reference', () => {
    const spec = parseCron('0 23 * * *')
    const from = new Date(2026, 7, 15, 12, 0, 0).getTime()
    expect(nextAfter(spec, from)).toBe(new Date(2026, 7, 15, 23, 0, 0).getTime())
  })

  it('skips a same-hour past minute and rolls to the next matching day', () => {
    const spec = parseCron('0 23 * * *')
    const from = new Date(2026, 7, 15, 23, 1, 0).getTime()
    expect(nextAfter(spec, from)).toBe(new Date(2026, 7, 16, 23, 0, 0).getTime())
  })

  it('honours the restricted-field rule when both dom and dow are set', () => {
    const both = parseCron('0 12 13 * 0')
    const from = new Date(2026, 7, 10, 0, 0, 0).getTime()
    const next = nextAfter(both, from)!
    const date = new Date(next)
    expect(date.getDate() === 13 || date.getDay() === 0).toBe(true)
  })

  it('honours dom-only when dow is wild and dow-only when dom is wild', () => {
    const domOnly = parseCron('0 12 13 * *')
    const from = new Date(2026, 7, 1, 0, 0, 0).getTime()
    expect(new Date(nextAfter(domOnly, from)!).getDate()).toBe(13)
    const dowOnly = parseCron('0 12 * * 1')
    const monday = nextAfter(dowOnly, from)!
    expect(new Date(monday).getDay()).toBe(1)
  })

  it('treats an explicit all-days field as restricted, not as a wildcard', () => {
    // `1-31` accepts every day but still RESTRICTS day-of-month, so the
    // dom-or-dow rule applies and the job fires daily. Deriving wildness from
    // the value-set size instead would read this as "dow only" and fire on
    // Mondays alone.
    const spec = parseCron('0 9 1-31 * 1')
    // 2026-08-11 is a Tuesday; the next occurrence is the very next morning.
    const from = new Date(2026, 7, 11, 12, 0, 0).getTime()
    expect(nextAfter(spec, from)).toBe(new Date(2026, 7, 12, 9, 0, 0).getTime())
  })

  it('respects the month field', () => {
    const spec = parseCron('0 0 1 2 *')
    const from = new Date(2026, 0, 1, 0, 0, 0).getTime()
    const next = nextAfter(spec, from)!
    expect(new Date(next).getMonth()).toBe(1)
  })

  it('returns null for a date that never occurs (Feb 30)', () => {
    const spec = parseCron('0 0 30 2 *')
    const from = new Date(2026, 0, 1, 0, 0, 0).getTime()
    expect(nextAfter(spec, from)).toBeNull()
  })

  it('returns null when the candidate start cannot be computed', () => {
    const spec = parseCron('* * * * *')
    expect(nextAfter(spec, 8.64e15)).toBeNull()
  })
})
