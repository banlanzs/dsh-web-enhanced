/**
 * Balance channel applicability: whether the balance endpoint's account is the
 * one the session's model route bills.
 * @module dsh-web-enhanced/tests/channel
 */

import { describe, expect, it } from 'vitest'
import { balanceApplies } from '../src/channel.ts'

const base = {
  allowed: ['deepseek-official'],
  balanceBaseUrl: 'https://api.deepseek.com',
  providerBaseUrl: undefined,
} as const

describe('balanceApplies', () => {
  it('keeps the line while no route is named', () => {
    // The pre-selection frame is not a foreign channel; hiding here would
    // flicker the line off and on at every session mount.
    expect(balanceApplies({ ...base, provider: undefined })).toBe(true)
  })

  it('keeps the line for an allowed route on its adapter default endpoint', () => {
    expect(balanceApplies({ ...base, provider: 'deepseek-official' })).toBe(true)
  })

  it('hides the line for another vendor', () => {
    expect(balanceApplies({ ...base, provider: 'openai' })).toBe(false)
    expect(balanceApplies({ ...base, provider: 'anthropic' })).toBe(false)
  })

  it('hides the line when an allowed route is repointed at a private endpoint', () => {
    // The route bills whatever account that gateway fronts, not this one.
    expect(balanceApplies({
      ...base,
      provider: 'deepseek-official',
      providerBaseUrl: 'https://gateway.internal/v1',
    })).toBe(false)
  })

  it('accepts a configured endpoint that is the balance host, path and scheme aside', () => {
    expect(balanceApplies({
      ...base,
      provider: 'deepseek-official',
      providerBaseUrl: 'https://api.deepseek.com/v1',
    })).toBe(true)
    expect(balanceApplies({
      ...base,
      provider: 'deepseek-official',
      providerBaseUrl: 'https://API.DeepSeek.com',
    })).toBe(true)
  })

  it('treats an unparseable endpoint as no evidence of the same account', () => {
    expect(balanceApplies({
      ...base,
      provider: 'deepseek-official',
      providerBaseUrl: 'not a url',
    })).toBe(false)
  })

  it('honours a deployment-configured allow list', () => {
    expect(balanceApplies({ ...base, allowed: ['house-route'], provider: 'house-route' })).toBe(true)
    expect(balanceApplies({ ...base, allowed: [], provider: 'deepseek-official' })).toBe(false)
  })
})
