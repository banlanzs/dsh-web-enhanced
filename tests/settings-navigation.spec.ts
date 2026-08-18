import { describe, expect, it } from 'vitest'
import {
  SETTINGS_TAB_IDS,
  WEB_ENHANCED_PLUGIN_TAB,
} from '../src/client/settings/navigation.ts'

describe('settings navigation', () => {
  it('keeps model capabilities inside the Web Enhanced page tabs', () => {
    expect(SETTINGS_TAB_IDS).toContain('modelCapabilities')
  })

  it('registers Web Enhanced as a Plugins settings tab', () => {
    expect(WEB_ENHANCED_PLUGIN_TAB).toEqual({ id: 'web-enhanced', order: 20 })
  })
})
