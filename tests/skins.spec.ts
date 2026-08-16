/**
 * Skin system behavior: catalog integrity, layer application, persistence
 * (skin id in localStorage, background blob in the injected store), legacy
 * background migration, and the no-theme-service degradation.
 * @module dsh-web-enhanced/tests/skins
 */

import { describe, expect, it, vi } from 'vitest'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client'
import { SkinLayer, SKIN_BACKGROUND_KEY, SKIN_STORAGE_KEY } from '../src/client/skins/skin-layer.ts'
import {
  backgroundStore,
  dataUrlToBlob,
  indexedDbAvailable,
  type BackgroundStore,
} from '../src/client/skins/background-store.ts'
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
    removeItem: (key: string) => { store.delete(key) },
  })
  return { store }
}

/** In-memory BackgroundStore double (the node test environment has no IndexedDB). */
function fakeBlobStore(initial?: Blob): { store: BackgroundStore; blob(): Blob | undefined } {
  let stored = initial
  return {
    store: {
      get: async () => stored,
      put: async (blob: Blob) => { stored = blob },
      remove: async () => { stored = undefined },
    },
    blob: () => stored,
  }
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

describe('background blob helpers', () => {
  it('without IndexedDB the default store reads empty and writes are no-ops', async () => {
    expect(indexedDbAvailable()).toBe(false)
    expect(await backgroundStore.get()).toBeUndefined()
    await expect(backgroundStore.put(new Blob([]))).resolves.toBeUndefined()
    await expect(backgroundStore.remove()).resolves.toBeUndefined()
  })

  it('decodes a data URL into a typed Blob', () => {
    const blob = dataUrlToBlob('data:image/webp;base64,AAEC')
    expect(blob.type).toBe('image/webp')
    expect(blob.size).toBe(3)
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

  it('a stored background blob loads asynchronously and paints the base transparent', async () => {
    vi.unstubAllGlobals()
    stubStorage()
    const blobs = fakeBlobStore(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }))
    const ctx = fakeContext({})
    const layer = new SkinLayer(ctx, blobs.store)
    // Before the load settles the layer stacks pure skin tokens (no flash of
    // a transparent base on a page without a background).
    expect(ctx.__calls).toHaveLength(1)
    expect(ctx.__calls[0].tokens).toBe(skinOf('none').tokens)

    await layer.ready()
    expect(layer.getBackground()).toMatch(/^blob:/u)
    const applied = ctx.__calls.at(-1)?.tokens
    expect(applied?.['--dsw-alias-bg-base']).toEqual({ light: 'transparent', dark: 'transparent' })
    expect(Object.keys(applied ?? {}).length).toBe(Object.keys(skinOf('none').tokens).length + 1)
  })

  it('setBackground stores a blob, re-stacks with a transparent base, and clear restores', async () => {
    vi.unstubAllGlobals()
    stubStorage()
    const blobs = fakeBlobStore()
    const ctx = fakeContext({})
    const layer = new SkinLayer(ctx, blobs.store)
    layer.setBackground('data:image/webp;base64,QkJC')
    await layer.ready()
    const stored = blobs.blob()
    expect(stored?.type).toBe('image/webp')
    expect(new Uint8Array(await stored?.arrayBuffer() ?? new ArrayBuffer(0))).toEqual(new Uint8Array([66, 66, 66]))
    expect(layer.getBackground()).toMatch(/^blob:/u)
    expect(ctx.__calls.at(-1)?.tokens['--dsw-alias-bg-base']).toEqual({ light: 'transparent', dark: 'transparent' })

    layer.setSkin('ocean')
    const oceanCall = ctx.__calls.at(-1)
    expect(oceanCall?.tokens['--dsw-alias-bg-base']).toEqual({ light: 'transparent', dark: 'transparent' })
    expect(oceanCall?.tokens['--dsw-alias-bg-layer-1']).toBe(skinOf('ocean').tokens['--dsw-alias-bg-layer-1'])

    layer.setBackground('')
    expect(blobs.blob()).toBeUndefined()
    const cleared = ctx.__calls.at(-1)?.tokens
    expect(cleared).toBe(skinOf('ocean').tokens)

    // A repeat clear does not re-stack.
    const count = ctx.__calls.length
    layer.setBackground('')
    expect(ctx.__calls).toHaveLength(count)
  })

  it('a legacy localStorage background migrates into the blob store and clears the key', async () => {
    vi.unstubAllGlobals()
    const { store: strings } = stubStorage()
    localStorage.setItem(SKIN_BACKGROUND_KEY, 'data:image/png;base64,AAA')
    const blobs = fakeBlobStore()
    const ctx = fakeContext({})
    const layer = new SkinLayer(ctx, blobs.store)
    await layer.ready()
    const migrated = blobs.blob()
    expect(migrated?.type).toBe('image/png')
    expect(new Uint8Array(await migrated?.arrayBuffer() ?? new ArrayBuffer(0))).toEqual(new Uint8Array([0, 0]))
    expect(strings.has(SKIN_BACKGROUND_KEY)).toBe(false)
    expect(layer.getBackground()).toMatch(/^blob:/u)
    expect(ctx.__calls.at(-1)?.tokens['--dsw-alias-bg-base']).toEqual({ light: 'transparent', dark: 'transparent' })
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
