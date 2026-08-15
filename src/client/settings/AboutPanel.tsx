/**
 * The About tab of the plugin's Settings section.
 *
 * Deliberately static: identity, what the plugin does, where it lives, and
 * where its configuration lives. The version is a build-time constant
 * (`./meta.ts`) because the browser half cannot read its own package manifest.
 * @module dsh-web-enhanced/src/client/settings/AboutPanel
 */

import type { Translate } from '../locale-keys.ts'
import { WEB_ENHANCED_REPOSITORY, WEB_ENHANCED_VERSION } from '../meta.ts'
import css from './AboutPanel.module.css'

/** Props of the About pane (a plain child, not a slot registration). */
export interface AboutPanelProps {
  readonly t: Translate
}

/** Feature list rendered as chips (kept in display order here). */
const FEATURE_KEYS = [
  'about.feature.board',
  'about.feature.graph',
  'about.feature.workspace',
  'about.feature.mention',
  'about.feature.balance',
  'about.feature.vision',
  'about.feature.plugins',
] as const

/** The About tab. */
export function AboutPanel({ t }: AboutPanelProps) {
  return (
    <div className={css.root}>
      <header className={css.header}>
        <h3 className={css.title}>{t('about.title')}</h3>
        <div className={css.meta}>
          <span className={css.version}>{t('about.version', { version: WEB_ENHANCED_VERSION })}</span>
          <span className={css.dot} aria-hidden="true">·</span>
          <span className={css.license}>{t('about.license')}</span>
        </div>
      </header>

      <p className={css.description}>{t('about.description')}</p>

      <section className={css.section}>
        <h4 className={css.sectionTitle}>{t('about.featuresTitle')}</h4>
        <ul className={css.features}>
          {FEATURE_KEYS.map(key => (
            <li key={key} className={css.feature}>{t(key)}</li>
          ))}
        </ul>
      </section>

      <section className={css.section}>
        <h4 className={css.sectionTitle}>{t('about.configTitle')}</h4>
        <p className={css.note}>{t('about.configHint')}</p>
      </section>

      <footer className={css.footer}>
        <a className={css.link} href={WEB_ENHANCED_REPOSITORY} target="_blank" rel="noreferrer">
          {t('about.repo')}
        </a>
      </footer>
    </div>
  )
}
