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
 * The page carries its own tabs because it hosts two unrelated things: managing
 * what the profile has installed, and describing what this plugin is. Neither
 * deserves a separate nav row.
 * @module dsh-web-enhanced/src/client/settings/SettingsSection
 */

import { useState } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { WebEnhancedProps } from '../contract.ts'
import { PluginManager } from './PluginManager.tsx'
import css from './SettingsSection.module.css'

/** Full composed props of the settings section. */
export type SettingsSectionProps = WebEnhancedProps<'settings.section'>

/** Which page of the section is showing. */
type Tab = 'plugins' | 'about'

/** The web-enhanced settings page. */
export function SettingsSection({ remote, t }: SettingsSectionProps) {
  const [tab, setTab] = useState<Tab>('plugins')
  return (
    <div className={css.root}>
      <div className={css.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'plugins'}
          className={tab === 'plugins' ? css.tabActive : css.tab}
          onClick={() => { setTab('plugins') }}
        >
          {t('settings.tab.plugins')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'about'}
          className={tab === 'about' ? css.tabActive : css.tab}
          onClick={() => { setTab('about') }}
        >
          {t('settings.tab.about')}
        </button>
      </div>
      <div className={css.body}>
        {tab === 'plugins'
          ? <PluginManager remote={remote} t={t} />
          : <p className={css.about}>{t('about.body')}</p>}
      </div>
    </div>
  )
}
