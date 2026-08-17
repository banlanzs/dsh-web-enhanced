/**
 * Global prompt tests: the effective-text derivation, the settings-namespace
 * registration, and the global systemPrompt section wiring. The browser tab's
 * pure draft decisions are covered in the same node-env suite.
 * @module dsh-web-enhanced/tests/global-prompt
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import {
  GLOBAL_PROMPT_ORDER, GLOBAL_PROMPT_SECTION, GlobalPromptSettingsSchema,
  applyGlobalPrompt, globalPromptTextOf,
} from '../src/global-prompt.ts'
import type { GlobalPromptSettingsValue } from '../src/global-prompt.ts'
import { GLOBAL_PROMPT_SETTINGS_NS } from '../src/types.ts'
import {
  globalPromptDraftOf, globalPromptRecordOf, validateGlobalPromptDraft,
} from '../src/client/global-prompt/draft.ts'

const contexts: Context[] = []

afterEach(async () => {
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
})

/** One mutable resolved settings value the fake scope returns. */
function scopeWith(initial: GlobalPromptSettingsValue) {
  let current: unknown = initial
  return {
    get: () => current,
    set: (next: unknown) => { current = next },
  }
}

/** Mount applyGlobalPrompt against fake settings and prompt registries. */
function mount(options: {
  readonly settings?: unknown
  readonly systemPrompt?: { section: ReturnType<typeof vi.fn> }
}): {
  readonly ctx: Context
  readonly register: ReturnType<typeof vi.fn>
  readonly section: ReturnType<typeof vi.fn>
  readonly scope: ReturnType<typeof scopeWith>
} {
  const ctx = new Context()
  contexts.push(ctx)
  const scope = scopeWith({ enabled: false, text: '' })
  const register = vi.fn(() => scope)
  const section = vi.fn(() => () => {})
  if (options.settings !== undefined) ctx.provide('settings' as never, options.settings as never)
  else ctx.provide('settings' as never, { register } as never)
  if (options.systemPrompt !== undefined) {
    ctx.provide('systemPrompt' as never, options.systemPrompt as never)
  } else {
    ctx.provide('systemPrompt' as never, { section } as never)
  }
  applyGlobalPrompt(ctx)
  return { ctx, register, section, scope }
}

describe('globalPromptTextOf', () => {
  it('renders the configured text only when enabled and non-whitespace', () => {
    expect(globalPromptTextOf(undefined)).toBe('')
    expect(globalPromptTextOf(null)).toBe('')
    expect(globalPromptTextOf({ enabled: false, text: 'hidden' })).toBe('')
    expect(globalPromptTextOf({ enabled: true, text: '  \n ' })).toBe('')
    expect(globalPromptTextOf({ enabled: true, text: 'Be a project engineer.' })).toBe('Be a project engineer.')
  })
})

describe('applyGlobalPrompt', () => {
  it('registers the settings namespace and a live global prompt section', () => {
    const { register, section, scope } = mount({})
    expect(register).toHaveBeenCalledWith(
      GLOBAL_PROMPT_SETTINGS_NS,
      GlobalPromptSettingsSchema,
      { base: {}, applies: 'live' },
    )
    expect(section).toHaveBeenCalledWith(expect.objectContaining({
      name: GLOBAL_PROMPT_SECTION,
      order: GLOBAL_PROMPT_ORDER,
    }))
    const contribution = section.mock.calls[0]![0] as { text: () => string }
    expect(contribution.text()).toBe('')
    scope.set({ enabled: true, text: 'Project rules.' })
    expect(contribution.text()).toBe('Project rules.')
    scope.set({ enabled: false, text: 'Project rules.' })
    expect(contribution.text()).toBe('')
  })

  it('stays inert when the settings service is absent', () => {
    const section = vi.fn(() => () => {})
    mount({ settings: {}, systemPrompt: { section } })
    expect(section).not.toHaveBeenCalled()
  })

  it('registers the namespace even when no prompt registry exists', () => {
    const { register, section } = mount({ systemPrompt: {} })
    expect(register).toHaveBeenCalledTimes(1)
    expect(section).not.toHaveBeenCalled()
  })

  it('does not fail the plugin when namespace registration throws', () => {
    const register = vi.fn(() => { throw new Error('namespace taken') })
    expect(() => mount({ settings: { register } })).not.toThrow()
    expect(register).toHaveBeenCalledTimes(1)
  })
})

describe('global prompt settings draft', () => {
  it('reads malformed or absent user layers as the off default', () => {
    expect(globalPromptDraftOf(undefined)).toEqual({ enabled: false, text: '' })
    expect(globalPromptDraftOf({ enabled: 'yes', text: 7 })).toEqual({ enabled: false, text: '' })
    expect(globalPromptDraftOf({ enabled: true, text: 'x' })).toEqual({ enabled: true, text: 'x' })
  })

  it('serializes the draft as exactly the two owned keys', () => {
    expect(globalPromptRecordOf({ enabled: true, text: 'x' })).toEqual({ enabled: true, text: 'x' })
  })

  it('rejects text over the configured cap', () => {
    expect(validateGlobalPromptDraft({ enabled: true, text: 'abc' }, 2)).toBe('textTooLong')
    expect(validateGlobalPromptDraft({ enabled: true, text: 'abc' }, 3)).toBeUndefined()
  })
})
