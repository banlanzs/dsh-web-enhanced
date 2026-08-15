/**
 * Plugin-manager decisions that are not React.
 *
 * The panel itself is not rendered here — this package's tests run in the node
 * environment and its UI is guarded by the type checker — so the judgements
 * worth pinning are extracted as pure functions and tested as such. Both of
 * these decide what a user is told before an irreversible operation.
 * @module dsh-web-enhanced/tests/plugin-manager
 */

import { describe, expect, it } from 'vitest'
import { confirmKeyOf, layerTag } from '../src/client/settings/PluginManager.tsx'
import type { PluginView } from '../src/types.ts'
import { zh } from '../src/client/locales.ts'
import type { Translate } from '../src/client/locale-keys.ts'

const row = (overrides: Partial<PluginView> = {}): PluginView => ({
  name: 'plugin-a',
  spec: 'github:o/a',
  version: '1.0.0',
  description: null,
  bundle: true,
  active: true,
  self: false,
  ...overrides,
})

/** Translate stub returning the key, so the branch taken is the assertion. */
const t = ((key: string) => key) as unknown as Translate

describe('layerTag', () => {
  it('separates a plain dependency from a bundle that is not yet a layer', () => {
    // Three states, not two: an installed package may declare no bundle at all,
    // and one that declares it can still be missing from a hand-edited list.
    expect(layerTag(row({ bundle: false, active: false }), t)).toBe('plugins.plain')
    expect(layerTag(row({ bundle: true, active: false }), t)).toBe('plugins.layerInactive')
    expect(layerTag(row({ bundle: true, active: true }), t)).toBe('plugins.layerActive')
  })

  it('calls a bundle-less dependency plain even if the list names it', () => {
    // What the package IS decides the tag; a stale list entry does not make it
    // a layer, and reconciliation will drop that entry on the next operation.
    expect(layerTag(row({ bundle: false, active: true }), t)).toBe('plugins.plain')
  })
})

describe('confirmKeyOf', () => {
  it('warns differently when the row being removed is this plugin', () => {
    expect(confirmKeyOf('remove', row())).toBe('plugins.confirmRemove')
    expect(confirmKeyOf('remove', row({ self: true }))).toBe('plugins.confirmRemoveSelf')
  })

  it('uses the ordinary update wording even for this plugin', () => {
    // Updating self is routine — it is how the plugin ships fixes. Only
    // removal is the one-way door.
    expect(confirmKeyOf('update', row({ self: true }))).toBe('plugins.confirmUpdate')
  })

  it('names keys the dictionary actually carries', () => {
    // A missing key would render as the raw key at runtime rather than fail.
    for (const key of ['plugins.confirmRemove', 'plugins.confirmRemoveSelf', 'plugins.confirmUpdate'] as const) {
      expect(zh, key).toHaveProperty(key)
    }
  })

  it('tells the user what removing this plugin costs', () => {
    // The self branch exists for this sentence; wording drift that drops the
    // restart consequence would make the confirmation misleading.
    expect(zh['plugins.confirmRemoveSelf']).toContain('重启')
    expect(zh['plugins.confirmRemove']).toContain('下次启动')
  })
})
