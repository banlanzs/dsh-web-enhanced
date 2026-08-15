/**
 * Installed-plugin management: list, update, remove.
 *
 * The host's own `pluginInventory` service lists the LOADER TREE and states
 * plainly that it cannot mutate anything. This surface answers a different
 * question — what the profile has INSTALLED — because that is the set `pnpm`
 * can act on. The two do not coincide: one npm package can contribute several
 * loader rows, and the profile template's bundles are loader rows that no
 * dependency provides at all.
 *
 * Every mutation is confirmed before it runs, and every success says the same
 * thing: it takes effect on the next start. Nothing here can change the running
 * tree, because Cordis composed that tree at boot.
 * @module dsh-web-enhanced/src/client/settings/PluginManager
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PluginListView, PluginView, WebEnhancedRemote } from '../contract.ts'
import type { Translate } from '../locale-keys.ts'
import css from './PluginManager.module.css'

/** Load state of the inventory. */
type Inventory =
  | { readonly phase: 'loading' }
  | { readonly phase: 'ready'; readonly value: PluginListView }
  | { readonly phase: 'error'; readonly code: string; readonly message: string }

/** A mutation awaiting the user's confirmation. */
interface Pending {
  readonly action: 'remove' | 'update'
  readonly plugin: PluginView
}

/** Outcome of the last completed mutation. */
interface Outcome {
  readonly ok: boolean
  readonly text: string
  readonly output: string
}

/** Props of the manager (a plain child, not a slot registration). */
export interface PluginManagerProps {
  readonly remote: WebEnhancedRemote
  readonly t: Translate
}

/**
 * Describe what a row is in the layer stack.
 *
 * Three distinct states, not two: a package can be installed without declaring
 * `dsh.bundle` (a plain library), and one that declares it can still be absent
 * from the list if the manifest was edited by hand.
 * @param plugin - the row.
 * @param t - translate.
 * @returns the tag text.
 */
export function layerTag(plugin: PluginView, t: Translate): string {
  if (!plugin.bundle) return t('plugins.plain')
  return plugin.active ? t('plugins.layerActive') : t('plugins.layerInactive')
}

/**
 * Which confirmation a pending mutation asks for.
 *
 * Removing the row that IS this plugin is its own branch, not a wording
 * variation: the consequence — no settings page, no board, no graph after the
 * next start, and no way back except the command line — is not something the
 * ordinary removal sentence conveys.
 * @param action - the pending action.
 * @param plugin - the row it targets.
 * @returns the locale key of the confirmation text.
 */
export function confirmKeyOf(
  action: 'remove' | 'update',
  plugin: PluginView,
): 'plugins.confirmUpdate' | 'plugins.confirmRemove' | 'plugins.confirmRemoveSelf' {
  if (action === 'update') return 'plugins.confirmUpdate'
  return plugin.self ? 'plugins.confirmRemoveSelf' : 'plugins.confirmRemove'
}

/** Installed-plugin management. */
export function PluginManager({ remote, t }: PluginManagerProps) {
  const [inventory, setInventory] = useState<Inventory>({ phase: 'loading' })
  const [pending, setPending] = useState<Pending | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | undefined>(undefined)
  const live = useRef(true)
  useEffect(() => () => { live.current = false }, [])

  const load = useCallback(async (): Promise<void> => {
    setInventory({ phase: 'loading' })
    const result = await remote.pluginList({})
    if (!live.current) return
    if ('error' in result) {
      setInventory({ phase: 'error', code: result.error.code, message: result.error.message })
      return
    }
    setInventory({ phase: 'ready', value: result })
  }, [remote])

  useEffect(() => { void load() }, [load])

  const confirm = useCallback(async (): Promise<void> => {
    if (pending === undefined) return
    const { action, plugin } = pending
    setPending(undefined)
    setBusy(true)
    setOutcome(undefined)
    const result = action === 'remove'
      ? await remote.pluginRemove({ name: plugin.name })
      : await remote.pluginUpdate({ name: plugin.name })
    if (!live.current) return
    setBusy(false)
    if ('error' in result) {
      setOutcome({ ok: false, text: result.error.message, output: '' })
      return
    }
    if (!result.ok) {
      setOutcome({ ok: false, text: t('plugins.failed'), output: result.output })
      return
    }
    const changes = [
      ...result.added.map(name => t('plugins.added', { name })),
      ...result.removed.map(name => t('plugins.removed', { name })),
    ].join('  ')
    setOutcome({
      ok: true,
      text: changes === '' ? t('plugins.restart') : `${t('plugins.changed', { changes })} — ${t('plugins.restart')}`,
      output: result.output,
    })
    // The list is now stale in exactly the way the user just caused, so it is
    // re-read rather than patched: pnpm may have changed more than the one row
    // (a bundle-less dependency gaining its declaration joins the layer stack).
    await load()
  }, [pending, remote, t, load])

  if (inventory.phase === 'loading') return <p className={css.muted}>{t('plugins.loading')}</p>
  if (inventory.phase === 'error') {
    // A deployment outside a profile is a STATE, not a failure — a source
    // checkout has nothing to manage and should not read as broken.
    const text = inventory.code === 'no-profile'
      ? t('plugins.noProfile')
      : t('plugins.error', { message: inventory.message })
    return <p className={css.muted}>{text}</p>
  }

  const view = inventory.value
  return (
    <div className={css.root}>
      <div className={css.head}>
        <div className={css.headText}>
          <div className={css.title}>{t('plugins.title')}</div>
          <div className={css.subtitle}>
            {t('plugins.subtitle', { profile: view.profileName, dir: view.profileDir })}
          </div>
        </div>
        <button type="button" className={css.ghost} disabled={busy} onClick={() => { void load() }}>
          {t('plugins.reload')}
        </button>
      </div>

      {outcome !== undefined && (
        <div className={outcome.ok ? css.noteOk : css.noteBad}>
          <div>{outcome.text}</div>
          {outcome.output !== '' && (
            <details className={css.output}>
              <summary>{t('plugins.output')}</summary>
              <pre>{outcome.output}</pre>
            </details>
          )}
        </div>
      )}

      {busy && <p className={css.muted}>{t('plugins.busy')}</p>}

      {view.plugins.length === 0
        ? <p className={css.muted}>{t('plugins.empty')}</p>
        : (
          <ul className={css.rows}>
            {view.plugins.map(plugin => (
              <li key={plugin.name} className={css.row}>
                <div className={css.rowMain}>
                  <div className={css.rowTitle}>
                    <span className={css.name}>{plugin.name}</span>
                    <span className={css.version}>
                      {plugin.version === null
                        ? t('plugins.versionUnknown')
                        : t('plugins.version', { version: plugin.version })}
                    </span>
                    {plugin.self && <span className={css.selfTag}>{t('plugins.self')}</span>}
                  </div>
                  {plugin.description !== null && <div className={css.desc}>{plugin.description}</div>}
                  <div className={css.meta}>
                    <span className={plugin.active ? css.tagOn : css.tag}>{layerTag(plugin, t)}</span>
                    <code className={css.spec}>{plugin.spec}</code>
                  </div>
                </div>
                <div className={css.rowActions}>
                  <button
                    type="button"
                    className={css.ghost}
                    disabled={busy}
                    onClick={() => { setPending({ action: 'update', plugin }) }}
                  >
                    {t('plugins.update')}
                  </button>
                  <button
                    type="button"
                    className={css.danger}
                    disabled={busy}
                    onClick={() => { setPending({ action: 'remove', plugin }) }}
                  >
                    {t('plugins.remove')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

      {view.templateBundles.length > 0 && (
        <div className={css.template}>
          <div className={css.templateTitle}>{t('plugins.templateTitle')}</div>
          <div className={css.templateHint}>{t('plugins.templateHint')}</div>
          <div className={css.templateList}>
            {view.templateBundles.map(name => <code key={name} className={css.spec}>{name}</code>)}
          </div>
        </div>
      )}

      {pending !== undefined && (
        <div className={css.confirm} role="alertdialog" aria-modal="true">
          <p className={css.confirmText}>
            {t(confirmKeyOf(pending.action, pending.plugin), { name: pending.plugin.name })}
          </p>
          <div className={css.confirmActions}>
            <button type="button" className={css.ghost} onClick={() => { setPending(undefined) }}>
              {t('plugins.cancel')}
            </button>
            <button
              type="button"
              className={pending.action === 'remove' ? css.danger : css.primary}
              onClick={() => { void confirm() }}
            >
              {t('plugins.confirm')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
