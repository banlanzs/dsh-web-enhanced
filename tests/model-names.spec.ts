/**
 * Model-route display names: directory cache precedence, fallback naming,
 * and per-provider model lookup with one in-flight fetch.
 * @module dsh-web-enhanced/tests/model-names
 */

import { describe, expect, it, vi } from 'vitest'
import { ModelRouteNames } from '../src/model-names.ts'
import type { LlmNamesFace } from '../src/model-names.ts'

function face(overrides: Partial<LlmNamesFace> = {}): LlmNamesFace {
  return {
    listProviders: () => [
      { id: 'deepseek-official', name: 'DeepSeek' },
      { id: 'opencode-go', name: 'OpenCode Go' },
    ],
    listModels: async () => [
      { id: 'deepseek-v4-flash', name: 'DeepSeek-V4-Flash' },
      { id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro' },
    ],
    ...overrides,
  }
}

describe('ModelRouteNames', () => {
  it('uses directory names for provider and model, matching the picker', async () => {
    const resolver = new ModelRouteNames(face())
    await expect(resolver.describe('deepseek-official', 'deepseek-v4-flash')).resolves.toEqual({
      provider: 'deepseek-official',
      model: 'deepseek-v4-flash',
      providerName: 'DeepSeek',
      modelName: 'DeepSeek-V4-Flash',
    })
  })

  it('falls back per field without failing the whole describe', async () => {
    const resolver = new ModelRouteNames(face({
      listProviders: () => [],
      listModels: async () => [],
    }))
    await expect(resolver.describe('deepseek-official', 'unknown-model')).resolves.toEqual({
      provider: 'deepseek-official',
      model: 'unknown-model',
      providerName: 'DeepSeek',
      modelName: 'unknown-model',
    })
    await expect(resolver.describe('foreign-route', 'm')).resolves.toMatchObject({
      providerName: 'Foreign-route',
      modelName: 'm',
    })
  })

  it('degrades to raw ids when the llm service is absent or its reads fail', async () => {
    const absent = new ModelRouteNames(undefined)
    await expect(absent.describe('p', 'm')).resolves.toEqual({
      provider: 'p', model: 'm', providerName: 'P', modelName: 'm',
    })
    const failing = new ModelRouteNames(face({
      listProviders: () => { throw new Error('boom') },
      listModels: async () => { throw new Error('boom') },
    }))
    await expect(failing.describe('p', 'm')).resolves.toMatchObject({ providerName: 'P', modelName: 'm' })
  })

  it('shares one in-flight model fetch per provider', async () => {
    const listModels = vi.fn(async () => [{ id: 'm', name: 'M' }])
    const resolver = new ModelRouteNames(face({ listModels }))
    await Promise.all([
      resolver.describe('deepseek-official', 'm'),
      resolver.describe('deepseek-official', 'm'),
    ])
    expect(listModels).toHaveBeenCalledTimes(1)
  })
})
