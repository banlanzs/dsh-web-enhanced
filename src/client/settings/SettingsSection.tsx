/**
 * The plugin's own Settings page.
 *
 * Registered into `settings.plugins.tab`, the Plugins settings page's tab
 * list. The page carries a second tab list for the Web Enhanced feature areas.
 *
 * The page carries its own tabs because it hosts several unrelated things:
 * managing what the profile has installed, general settings (model-request
 * retry), the global system prompt, configuring image understanding,
 * model capabilities, completion notifications, switching the interface skin,
 * and describing what this plugin is. None deserves a separate Plugins tab.
 * @module dsh-web-enhanced/src/client/settings/SettingsSection
 */

import { useState } from 'react'
import type { InjectFace } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { WebEnhancedProps } from '../contract.ts'
import type { ModelCapabilitiesInjected } from '../model-capabilities/ModelCapabilities.tsx'
import { ModelCapabilitiesSection } from '../model-capabilities/ModelCapabilities.tsx'
import { SkinPanel } from '../skins/SkinPanel.tsx'
import type { SkinFace } from '../skins/skin-layer.ts'
import { AboutPanel } from './AboutPanel.tsx'
import { GeneralSettingsPanel } from './GeneralSettingsPanel.tsx'
import { MemoryPanel } from './MemoryPanel.tsx'
import { PluginManager } from './PluginManager.tsx'
import { VisionStatusPanel } from './VisionStatusPanel.tsx'
import { GlobalPromptPanel } from '../global-prompt/GlobalPromptPanel.tsx'
import { NotificationPanel } from './NotificationPanel.tsx'
import css from './SettingsSection.module.css'
import { SETTINGS_TAB_IDS, type SettingsTab } from './navigation.ts'

/** Full composed props of the settings section. */
export type SettingsSectionProps = WebEnhancedProps<'settings.plugins.tab'> & InjectFace<ModelCapabilitiesInjected>

/** The web-enhanced settings page. */
export function SettingsSection({
  remote, t, skin, notifications, controller, useSnapshot, api,
}: SettingsSectionProps) {
  const [tab, setTab] = useState<SettingsTab>('plugins')
  const tabs: ReadonlyArray<{ id: SettingsTab; label: string }> = SETTINGS_TAB_IDS.map(id => ({
    id,
    label: t(`settings.tab.${id}`),
  }))
  return (
    <div className={css.root}>
      <div className={css.tabs} role="tablist" aria-orientation="vertical">
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
        {tab === 'modelCapabilities'
          ? <ModelCapabilitiesSection controller={controller} useSnapshot={useSnapshot} api={api} t={t} />
          : null}
        {tab === 'vision' && <VisionStatusPanel remote={remote} t={t} />}
        {tab === 'notify' && <NotificationPanel notifications={notifications} t={t} />}
        {tab === 'skins' && <SkinPanel skin={skin} t={t} />}
        {tab === 'about' && <AboutPanel t={t} />}
      </div>
    </div>
  )
}
