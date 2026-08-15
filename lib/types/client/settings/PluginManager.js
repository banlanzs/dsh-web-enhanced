import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { useCallback, useEffect, useRef, useState } from 'react';
import css from './PluginManager.module.css';
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
export function layerTag(plugin, t) {
    if (!plugin.bundle)
        return t('plugins.plain');
    return plugin.active ? t('plugins.layerActive') : t('plugins.layerInactive');
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
export function confirmKeyOf(action, plugin) {
    if (action === 'update')
        return 'plugins.confirmUpdate';
    return plugin.self ? 'plugins.confirmRemoveSelf' : 'plugins.confirmRemove';
}
/** Installed-plugin management. */
export function PluginManager({ remote, t }) {
    const [inventory, setInventory] = useState({ phase: 'loading' });
    const [pending, setPending] = useState(undefined);
    const [busy, setBusy] = useState(false);
    const [outcome, setOutcome] = useState(undefined);
    const live = useRef(true);
    useEffect(() => () => { live.current = false; }, []);
    const load = useCallback(async () => {
        setInventory({ phase: 'loading' });
        const result = await remote.pluginList({});
        if (!live.current)
            return;
        if ('error' in result) {
            setInventory({ phase: 'error', code: result.error.code, message: result.error.message });
            return;
        }
        setInventory({ phase: 'ready', value: result });
    }, [remote]);
    useEffect(() => { void load(); }, [load]);
    const confirm = useCallback(async () => {
        if (pending === undefined)
            return;
        const { action, plugin } = pending;
        setPending(undefined);
        setBusy(true);
        setOutcome(undefined);
        const result = action === 'remove'
            ? await remote.pluginRemove({ name: plugin.name })
            : await remote.pluginUpdate({ name: plugin.name });
        if (!live.current)
            return;
        setBusy(false);
        if ('error' in result) {
            setOutcome({ ok: false, text: result.error.message, output: '' });
            return;
        }
        if (!result.ok) {
            setOutcome({ ok: false, text: t('plugins.failed'), output: result.output });
            return;
        }
        const changes = [
            ...result.added.map(name => t('plugins.added', { name })),
            ...result.removed.map(name => t('plugins.removed', { name })),
        ].join('  ');
        setOutcome({
            ok: true,
            text: changes === '' ? t('plugins.restart') : `${t('plugins.changed', { changes })} — ${t('plugins.restart')}`,
            output: result.output,
        });
        // The list is now stale in exactly the way the user just caused, so it is
        // re-read rather than patched: pnpm may have changed more than the one row
        // (a bundle-less dependency gaining its declaration joins the layer stack).
        await load();
    }, [pending, remote, t, load]);
    if (inventory.phase === 'loading')
        return _jsx("p", { className: css.muted, children: t('plugins.loading') });
    if (inventory.phase === 'error') {
        // A deployment outside a profile is a STATE, not a failure — a source
        // checkout has nothing to manage and should not read as broken.
        const text = inventory.code === 'no-profile'
            ? t('plugins.noProfile')
            : t('plugins.error', { message: inventory.message });
        return _jsx("p", { className: css.muted, children: text });
    }
    const view = inventory.value;
    return (_jsxs("div", { className: css.root, children: [_jsxs("div", { className: css.head, children: [_jsxs("div", { className: css.headText, children: [_jsx("div", { className: css.title, children: t('plugins.title') }), _jsx("div", { className: css.subtitle, children: t('plugins.subtitle', { profile: view.profileName, dir: view.profileDir }) })] }), _jsx("button", { type: "button", className: css.ghost, disabled: busy, onClick: () => { void load(); }, children: t('plugins.reload') })] }), outcome !== undefined && (_jsxs("div", { className: outcome.ok ? css.noteOk : css.noteBad, children: [_jsx("div", { children: outcome.text }), outcome.output !== '' && (_jsxs("details", { className: css.output, children: [_jsx("summary", { children: t('plugins.output') }), _jsx("pre", { children: outcome.output })] }))] })), busy && _jsx("p", { className: css.muted, children: t('plugins.busy') }), view.plugins.length === 0
                ? _jsx("p", { className: css.muted, children: t('plugins.empty') })
                : (_jsx("ul", { className: css.rows, children: view.plugins.map(plugin => (_jsxs("li", { className: css.row, children: [_jsxs("div", { className: css.rowMain, children: [_jsxs("div", { className: css.rowTitle, children: [_jsx("span", { className: css.name, children: plugin.name }), _jsx("span", { className: css.version, children: plugin.version === null
                                                    ? t('plugins.versionUnknown')
                                                    : t('plugins.version', { version: plugin.version }) }), plugin.self && _jsx("span", { className: css.selfTag, children: t('plugins.self') })] }), plugin.description !== null && _jsx("div", { className: css.desc, children: plugin.description }), _jsxs("div", { className: css.meta, children: [_jsx("span", { className: plugin.active ? css.tagOn : css.tag, children: layerTag(plugin, t) }), _jsx("code", { className: css.spec, children: plugin.spec })] })] }), _jsxs("div", { className: css.rowActions, children: [_jsx("button", { type: "button", className: css.ghost, disabled: busy, onClick: () => { setPending({ action: 'update', plugin }); }, children: t('plugins.update') }), _jsx("button", { type: "button", className: css.danger, disabled: busy, onClick: () => { setPending({ action: 'remove', plugin }); }, children: t('plugins.remove') })] })] }, plugin.name))) })), view.templateBundles.length > 0 && (_jsxs("div", { className: css.template, children: [_jsx("div", { className: css.templateTitle, children: t('plugins.templateTitle') }), _jsx("div", { className: css.templateHint, children: t('plugins.templateHint') }), _jsx("div", { className: css.templateList, children: view.templateBundles.map(name => _jsx("code", { className: css.spec, children: name }, name)) })] })), pending !== undefined && (_jsxs("div", { className: css.confirm, role: "alertdialog", "aria-modal": "true", children: [_jsx("p", { className: css.confirmText, children: t(confirmKeyOf(pending.action, pending.plugin), { name: pending.plugin.name }) }), _jsxs("div", { className: css.confirmActions, children: [_jsx("button", { type: "button", className: css.ghost, onClick: () => { setPending(undefined); }, children: t('plugins.cancel') }), _jsx("button", { type: "button", className: pending.action === 'remove' ? css.danger : css.primary, onClick: () => { void confirm(); }, children: t('plugins.confirm') })] })] }))] }));
}
