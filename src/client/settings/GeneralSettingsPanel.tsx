/**
 * General settings group: the home for settings that do not deserve their own
 * tab. Model-request retry is the first member; future general preferences
 * slot in beside it.
 * @module dsh-web-enhanced/src/client/settings/GeneralSettingsPanel
 */

import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { WebEnhancedProps } from '../contract.ts'
import { ModelRetryPanel } from './ModelRetryPanel.tsx'
import css from './GeneralSettingsPanel.module.css'

/** The settings section props the general group uses. */
export type GeneralSettingsPanelProps = Pick<WebEnhancedProps<'settings.plugins.tab'>, 'remote' | 't'>

/** General settings: currently the model-request retry policy. */
export function GeneralSettingsPanel({ remote, t }: GeneralSettingsPanelProps) {
  return (
    <section className={css.general} data-testid="general-settings">
      <h2 className={css.title}>{t('settings.general.title')}</h2>
      <p className={css.hint}>{t('settings.general.hint')}</p>
      <ModelRetryPanel remote={remote} t={t} />
    </section>
  )
}
