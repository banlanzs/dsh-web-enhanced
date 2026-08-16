/**
 * Skin system behavior: catalog integrity, layer application, persistence,
 * and the no-theme-service degradation.
 * @module dsh-web-enhanced/tests/skins
 */

import { describe, expect, it, vi } from 'vitest'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client'
import { SkinLayer, SKIN_STORAGE_KEY } from '../src/client/skins/skin-layer.ts'
import { SKINS, skinOf } from '../src/client/skins/themes.ts'

/** Recorded override-layer call. */
interface LayerCall {
  source: string
  tokens: ThemeTokenOverrides
}

/**
 * Minimal client-context double: `get` answers the fake theme service,
 * `effect`/`on` run the callback and return its disposer untouched.
 */
function fakeContext(theme?: object): ClientContext & { __calls: LayerCall[] } {
  const calls: LayerCall[] = []
  const themeFace = theme === undefined ? undefined : {
    overrideTokens: (source: string, tokens: ThemeTokenOverrides): (() => void) => {
      calls.push({ source, tokens })
      return () => {}
    },
    getTheme: () => ({ active: { colorScheme: 'dark' as const } }),
  }
  const ctx = {
    get: () => themeFace,
    effect: (fn: () => () => void) => fn(),
    on: () => () => {},
  }
  return Object.assign(ctx, { __calls: calls }) as unknown as ClientContext & { __calls: LayerCall[] }
}

/** localStorage stub (the node test environment has none). */
function stubStorage(initial?: string): { store: Map<string, string> } {
  const store = new Map<string, string>(initial === undefined ? [] : [[SKIN_STORAGE_KEY, initial]])
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value) },
  })
  return { store }
}

describe('skin catalog', () => {
  it('every skin token carries non-empty light and dark values', () => {
    for (const skin of SKINS) {
      for (const [name, modes] of Object.entries(skin.tokens)) {
        expect(modes.light, `${skin.id} ${name}.light`).toMatch(/.+/u)
        expect(modes.dark, `${skin.id} ${name}.dark`).toMatch(/.+/u)
      }
    }
  })

  it('every skin carries three-swatch previews for both modes', () => {
    for (const skin of SKINS) {
      expect(skin.lightSwatch).toHaveLength(3)
      expect(skin.darkSwatch).toHaveLength(3)
    }
  })

  it('unknown or absent ids resolve to the stock skin', () => {
    expect(skinOf('does-not-exist').id).toBe('none')
    expect(skinOf('violet').id).toBe('violet')
  })
})

describe('SkinLayer', () => {
  it('stacks the stored skin on construction and re-stacks on switch', () => {
    vi.unstubAllGlobals()
    stubStorage('ocean')
    const ctx = fakeContext({})
    const layer = new SkinLayer(ctx)
    const calls = ctx.__calls
    expect(calls).toHaveLength(1)
    expect(calls[0].tokens).toBe(skinOf('ocean').tokens)

    layer.setSkin('forest')
    expect(calls).toHaveLength(2)
    expect(calls[1].tokens).toBe(skinOf('forest').tokens)
    expect(layer.getSkin().id).toBe('forest')
  })

  it('persists the choice and reloads it', () => {
    const { store } = stubStorage()
    new SkinLayer(fakeContext({})).setSkin('amber')
    expect(store.get(SKIN_STORAGE_KEY)).toBe('amber')
    expect(skinOf(store.get(SKIN_STORAGE_KEY) ?? '').id).toBe('amber')
  })

  it('a repeated switch to the active skin does not re-stack', () => {
    stubStorage()
    const ctx = fakeContext({})
    const layer = new SkinLayer(ctx)
    const calls = ctx.__calls
    layer.setSkin('amber')
    layer.setSkin('amber')
    expect(calls).toHaveLength(2)
  })

  it('without the theme service the layer is unavailable and switches are inert', () => {
    stubStorage()
    const layer = new SkinLayer(fakeContext())
    expect(layer.available).toBe(false)
    expect(() => layer.setSkin('violet')).not.toThrow()
    expect(layer.isDark()).toBe(false)
    expect(layer.onChange(fakeContext(), () => {})()).toBeUndefined()
  })
})
