/**
 * The plugin's own Settings page.
 *
 * Registered into `settings.section`, the root list slot the settings shell
 * projects into its nav list: each registration's `id`, `order`, and `label`
 * become one nav row, and the shell renders only the selected section's
 * component. That is the whole contribution contract — the icon comes from the
 * shell's own id allowlist (an unknown id gets the generic one) and nothing
 * else about the nav is ours to decide.
 *
 * The page carries its own tabs because it hosts six unrelated things:
 * managing what the profile has installed, general settings (model-request
 * retry), the global system prompt, configuring image understanding,
 * switching the interface skin, and describing what this plugin is. None
 * deserves a separate nav row.
 * @module dsh-web-enhanced/src/client/settings/SettingsSection
 */

import { useState } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { WebEnhancedProps } from '../contract.ts'
import { SkinPanel } from '../skins/SkinPanel.tsx'
import type { SkinFace } from '../skins/skin-layer.ts'
import { AboutPanel } from './AboutPanel.tsx'
import { GeneralSettingsPanel } from './GeneralSettingsPanel.tsx'
import { MemoryPanel } from './MemoryPanel.tsx'
import { PluginManager } from './PluginManager.tsx'
import { VisionStatusPanel } from './VisionStatusPanel.tsx'
import { GlobalPromptPanel } from '../global-prompt/GlobalPromptPanel.tsx'
import css from './SettingsSection.module.css'

/** Full composed props of the settings section. */
export type SettingsSectionProps = WebEnhancedProps<'settings.section'>

/** Which page of the section is showing. */
type Tab = 'plugins' | 'general' | 'globalPrompt' | 'memory' | 'vision' | 'skins' | 'about'

/** The web-enhanced settings page. */
export function SettingsSection({ remote, t, skin }: SettingsSectionProps) {
  const [tab, setTab] = useState<Tab>('plugins')
  const tabs: ReadonlyArray<{ id: Tab; label: string }> = [
    { id: 'plugins', label: t('settings.tab.plugins') },
    { id: 'general', label: t('settings.tab.general') },
    { id: 'globalPrompt', label: t('settings.tab.globalPrompt') },
    { id: 'memory', label: t('settings.tab.memory') },
    { id: 'vision', label: t('settings.tab.vision') },
    { id: 'skins', label: t('settings.tab.skins') },
    { id: 'about', label: t('settings.tab.about') },
  ]
  return (
    <div className={css.root}>
      <div className={css.tabs} role="tablist">
        {tabs.map(entry => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            className={tab === entry.id ? css.tabActive : css.tab}
            onClick={() => { setTab(entry.id) }}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <div className={css.body}>
        {tab === 'plugins' && <PluginManager remote={remote} t={t} />}
        {tab === 'general' && <GeneralSettingsPanel remote={remote} t={t} />}
        {tab === 'globalPrompt' && <GlobalPromptPanel remote={remote} t={t} />}
        {tab === 'memory' && <MemoryPanel remote={remote} t={t} />}
        {tab === 'vision' && <VisionStatusPanel remote={remote} t={t} />}
        {tab === 'skins' && <SkinPanel skin={skin} t={t} />}
        {tab === 'about' && <AboutPanel t={t} />}
      </div>
    </div>
  )
}
