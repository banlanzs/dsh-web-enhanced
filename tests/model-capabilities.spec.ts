/**
 * Pure decisions behind the Model Capabilities page: settings-path diffs,
 * pi-ai / DeepSeek capability validation, override normalization, and the
 * provider/model joins the page renders. The browser-runtime store is left to
 * the type checker; these node-env tests pin every branch a UI can take.
 * @module dsh-web-enhanced/tests/model-capabilities
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ConfigurableProviderView, IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import {
  modelOptionsOf, visibleCapabilityProvider,
} from '../src/client/model-capabilities/capability-join.ts'
import {
  applyDraft, draftAt, normalizePiAiDraft, pathOps, validateDeepSeekDraft,
  validatePiAiDraft,
} from '../src/client/model-capabilities/settings-draft.ts'

const provider = (overrides: Partial<ConfigurableProviderView> = {}): ConfigurableProviderView => ({
  provider: 'acme',
  displayName: 'Acme',
  settingsNs: 'llm-pi-ai',
  settingsPath: ['providers', 'acme'],
  active: false,
  ...overrides,
})

const namespace = (user: unknown = undefined): Parameters<typeof modelOptionsOf>[0] => ({
  ns: 'llm-pi-ai',
  schema: {},
  value: {},
  ...user === undefined ? {} : { user },
  revision: 1,
  applies: 'live',
  secrets: [],
})

const mutate = vi.fn()

const api = {
  settings: { mutate },
} as unknown as Pick<IApiClient, 'settings'>

beforeEach(() => { mutate.mockReset() })

describe('pathOps', () => {
  it('names only changed keys and unsets removed ones at the subtree base', () => {
    const ops = pathOps(
      ['providers', 'acme'],
      { defaultInput: ['text'], reasoning: 'high', keep: { deep: true } },
      { defaultInput: ['text', 'image'], keep: { deep: true } },
    )
    expect(ops).toEqual([
      { op: 'set', path: ['providers', 'acme', 'defaultInput'], value: ['text', 'image'] },
      { op: 'unset', path: ['providers', 'acme', 'reasoning'] },
    ])
  })

  it('returns nothing for an unchanged draft, even against an absent subtree', () => {
    expect(pathOps(['x'], undefined, {})).toEqual([])
  })
})

describe('validatePiAiDraft', () => {
  it('refuses an empty provider defaultInput', () => {
    expect(validatePiAiDraft({ defaultInput: [] })).toBe('defaultInputEmpty')
    expect(validatePiAiDraft({ defaultInput: ['audio'] })).toBe('defaultInputEmpty')
  })

  it('accepts a provider defaultInput naming supported modalities', () => {
    expect(validatePiAiDraft({ defaultInput: ['text', 'image'] })).toBeUndefined()
  })

  it('validates per-model input and reasoning efforts in both models and overrides', () => {
    expect(validatePiAiDraft({ models: [{ id: 'm', input: ['audio'] }] })).toBe('modelInputInvalid')
    expect(validatePiAiDraft({
      models: [{ id: 'm', reasoningEfforts: { off: null } }],
    })).toBe('reasoningNeedLevel')
    expect(validatePiAiDraft({
      models: [{ id: 'm', reasoningEfforts: { high: '' } }],
    })).toBe('reasoningWireRequired')
    expect(validatePiAiDraft({
      models: [{ id: 'm', input: ['text', 'image'], reasoningEfforts: { off: null, high: 'high' } }],
    })).toBeUndefined()
    expect(validatePiAiDraft({ modelOverrides: { m: { reasoningEfforts: false } } })).toBeUndefined()
    expect(validatePiAiDraft({ modelOverrides: { '': { input: ['text'] } } }))
      .toBe('modelOverrideEmptyId')
  })
})

describe('normalizePiAiDraft', () => {
  it('drops empty override entries and the emptied dict so fields return to inheritance', () => {
    expect(normalizePiAiDraft({
      defaultInput: ['text'],
      modelOverrides: { empty: {}, kept: { input: ['image'] } },
    })).toEqual({
      defaultInput: ['text'],
      modelOverrides: { kept: { input: ['image'] } },
    })
    expect(normalizePiAiDraft({ modelOverrides: { empty: {} } })).toEqual({})
  })
})

describe('validateDeepSeekDraft', () => {
  it('accepts the two fields independently', () => {
    expect(validateDeepSeekDraft({ thinking: 'enabled', reasoningEffort: 'max' })).toBeUndefined()
    expect(validateDeepSeekDraft({ thinking: 'disabled', reasoningEffort: 'off' })).toBeUndefined()
  })

  it('rejects unknown values and a disabled/eager effort pair', () => {
    expect(validateDeepSeekDraft({ thinking: 'auto' })).toBe('thinkingInvalid')
    expect(validateDeepSeekDraft({ reasoningEffort: 'ultra' })).toBe('reasoningEffortInvalid')
    expect(validateDeepSeekDraft({ thinking: 'disabled', reasoningEffort: 'high' }))
      .toBe('reasoningDisabledConflict')
  })
})

describe('applyDraft', () => {
  it('sends the computed ops and adopts the response revision and subtree', async () => {
    mutate.mockResolvedValue({
      result: { ok: true, value: { user: { providers: { acme: { input: ['image'] } } }, revision: 5 } },
    })
    const result = await applyDraft({
      api,
      ns: 'llm-pi-ai',
      path: ['providers', 'acme'],
      before: undefined,
      after: { input: ['image'] },
      expectedRevision: 4,
      conflictText: 'conflict',
    })
    expect(result).toEqual({ ok: true, committed: { input: ['image'] }, revision: 5 })
    expect(mutate).toHaveBeenCalledWith({
      ns: 'llm-pi-ai',
      ops: [{ op: 'set', path: ['providers', 'acme', 'input'], value: ['image'] }],
      expectedRevision: 4,
    })
  })

  it('maps a settings conflict to the localized conflict text', async () => {
    mutate.mockResolvedValue({
      result: { ok: false, error: { code: 'settings-conflict', message: 'stale' } },
    })
    await expect(applyDraft({
      api,
      ns: 'llm-pi-ai',
      path: ['providers', 'acme'],
      before: {},
      after: { input: ['text'] },
      expectedRevision: 1,
      conflictText: 'changed elsewhere',
    })).resolves.toEqual({ ok: false, failure: 'changed elsewhere' })
  })
})

describe('draftAt', () => {
  it('clones an object subtree and defaults absent user layers to an empty draft', () => {
    const view = namespace({ providers: { acme: { defaultInput: ['text'] } } })
    expect(draftAt(view, ['providers', 'acme'])).toEqual({ defaultInput: ['text'] })
    expect(draftAt(view, ['providers', 'other'])).toEqual({})
  })
})

describe('visibleCapabilityProvider', () => {
  it('always shows DeepSeek and hides foreign namespaces', () => {
    expect(visibleCapabilityProvider(provider({ settingsNs: 'llm-deepseek', settingsPath: [] }), undefined))
      .toBe(true)
    expect(visibleCapabilityProvider(provider({ settingsNs: 'llm-other' }), undefined)).toBe(false)
  })

  it('shows pi-ai routes that are active, declared, or user-configured', () => {
    expect(visibleCapabilityProvider(provider({ active: true }), undefined)).toBe(true)
    expect(visibleCapabilityProvider(provider({ declared: true }), undefined)).toBe(true)
    expect(visibleCapabilityProvider(provider(), namespace({ providers: { acme: {} } }))).toBe(true)
    expect(visibleCapabilityProvider(provider(), namespace())).toBe(false)
  })
})

describe('modelOptionsOf', () => {
  it('prefers the live catalog and deduplicates settings-layer fallbacks', () => {
    const view = {
      ...namespace(),
      value: {
        providers: {
          acme: {
            models: [{ id: 'from-settings', name: 'Settings model' }, { id: 'catalog-b' }],
            modelOverrides: { 'override-c': {} },
          },
        },
      },
    }
    const options = modelOptionsOf(view, ['providers', 'acme'], [
      { id: 'catalog-b', name: 'Catalog B' },
      { id: 'catalog-only', name: 'Catalog only' },
    ])
    expect(options.map(option => option.id)).toEqual([
      'catalog-b', 'catalog-only', 'from-settings', 'override-c',
    ])
    expect(options[0]!.name).toBe('Catalog B')
  })
})
