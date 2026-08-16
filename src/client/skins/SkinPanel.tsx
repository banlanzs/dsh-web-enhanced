/**
 * The Settings page's Skins tab: one card per catalog skin with a dual-mode
 * swatch preview (light and dark halves side by side — the halves are the
 * literal palette of the skin, so they do not ride the alias tokens). Clicking
 * a card applies the skin immediately through {@link SkinFace}; the swatch's
 * active half follows the resolved Appearance scheme.
 * @module dsh-web-enhanced/src/client/skins/SkinPanel
 */

import { useEffect, useState } from 'react'
import type { Translate } from '../locale-keys.ts'
import { SKINS } from './themes.ts'
import type { SkinFace } from './skin-layer.ts'
import css from './SkinPanel.module.css'

/** Props of the skins panel. */
export interface SkinPanelProps {
  /** The client entry's skin face. */
  readonly skin: SkinFace
  /** Translate seat of the webEnhanced namespace. */
  readonly t: Translate
}

/** The skins tab body. */
export function SkinPanel({ skin, t }: SkinPanelProps) {
  const [current, setCurrent] = useState(skin.current)
  const [dark, setDark] = useState(skin.dark)

  useEffect(() => skin.subscribe(setDark), [skin])

  if (!skin.available) {
    return <p className={css.unavailable}>{t('skins.unavailable')}</p>
  }

  return (
    <div className={css.root}>
      <p className={css.hint}>{t('skins.hint')}</p>
      <div className={css.grid} role="radiogroup" aria-label={t('skins.title')}>
        {SKINS.map(entry => {
          const active = entry.id === current
          return (
            <button
              key={entry.id}
              type="button"
              role="radio"
              aria-checked={active}
              className={active ? css.cardActive : css.card}
              data-testid={`skin-${entry.id}`}
              onClick={() => { setCurrent(skin.apply(entry.id)) }}
            >
              <span className={css.swatch}>
                <span className={css.swatchHalf} style={{ background: entry.lightSwatch[0] }}>
                  <span className={css.chipLayer} style={{ background: entry.lightSwatch[1] }} />
                  <span className={css.chipAccent} style={{ background: entry.lightSwatch[2] }} />
                </span>
                <span className={css.swatchHalf} style={{ background: entry.darkSwatch[0] }}>
                  <span className={css.chipLayer} style={{ background: entry.darkSwatch[1] }} />
                  <span className={css.chipAccent} style={{ background: entry.darkSwatch[2] }} />
                </span>
                <span
                  className={dark ? css.markerDark : css.markerLight}
                  aria-hidden="true"
                />
              </span>
              <span className={css.cardBody}>
                <span className={css.cardTitle}>{t(entry.nameKey)}</span>
                <span className={css.cardDesc}>{t(entry.descKey)}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
