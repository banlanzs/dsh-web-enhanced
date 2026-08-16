/**
 * The Settings page's Skins tab: one card per catalog skin with a dual-mode
 * swatch preview (light and dark halves side by side — the halves are the
 * literal palette of the skin, so they do not ride the alias tokens), plus a
 * custom background image section. Clicking a card applies the skin
 * immediately through {@link SkinFace}; the swatch's active half follows the
 * resolved Appearance scheme.
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

/** Accepted background image formats (picker filter + validation). */
const BACKGROUND_ACCEPT = '.png,.jpg,.jpeg,.webp,.gif,.avif,.bmp,.ico,.svg,image/*'

/** Upper bound on the stored data URL, bytes (localStorage holds ~5 MiB). */
const BACKGROUND_MAX_BYTES = 4 * 1024 * 1024

/** The skins tab body. */
export function SkinPanel({ skin, t }: SkinPanelProps) {
  const [current, setCurrent] = useState(skin.current)
  const [dark, setDark] = useState(skin.dark)
  const [background, setBackground] = useState(skin.background)
  const [backgroundError, setBackgroundError] = useState<string | null>(null)

  useEffect(() => skin.subscribe(setDark), [skin])

  const onBackgroundPicked = (file: File | undefined): void => {
    if (file === undefined) return
    if (!file.type.startsWith('image/') && !/\.(png|jpe?g|webp|gif|avif|bmp|ico|svg)$/iu.test(file.name)) {
      setBackgroundError(t('skins.bg.badType'))
      return
    }
    if (file.size > BACKGROUND_MAX_BYTES) {
      setBackgroundError(t('skins.bg.tooLarge'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : ''
      if (dataUrl === '') {
        setBackgroundError(t('skins.bg.badType'))
        return
      }
      setBackgroundError(null)
      skin.setBackground(dataUrl)
      setBackground(dataUrl)
    }
    reader.onerror = () => { setBackgroundError(t('skins.bg.badType')) }
    reader.readAsDataURL(file)
  }

  const clearBackground = (): void => {
    skin.setBackground('')
    setBackground('')
    setBackgroundError(null)
  }

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

      <section className={css.bgSection}>
        <h4 className={css.bgTitle}>{t('skins.bg.title')}</h4>
        <p className={css.bgHint}>{t('skins.bg.hint')}</p>
        <div className={css.bgRow}>
          {background !== ''
            ? <img className={css.bgThumb} src={background} alt={t('skins.bg.title')} data-testid="skin-bg-thumb" />
            : <span className={css.bgEmpty} data-testid="skin-bg-empty">{t('skins.bg.none')}</span>}
          <div className={css.bgActions}>
            <label className={css.bgPick}>
              {t('skins.bg.pick')}
              <input
                type="file"
                accept={BACKGROUND_ACCEPT}
                data-testid="skin-bg-input"
                onChange={event => {
                  onBackgroundPicked(event.target.files?.[0])
                  // Reset so picking the same file again re-fires onChange.
                  event.target.value = ''
                }}
              />
            </label>
            {background !== '' && (
              <button
                type="button"
                className={css.bgClear}
                data-testid="skin-bg-clear"
                onClick={clearBackground}
              >
                {t('skins.bg.clear')}
              </button>
            )}
          </div>
        </div>
        {backgroundError !== null && <p className={css.bgError} data-testid="skin-bg-error">{backgroundError}</p>}
      </section>
    </div>
  )
}
