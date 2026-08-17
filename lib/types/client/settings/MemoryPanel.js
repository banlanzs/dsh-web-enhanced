import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Memory tab of the plugin's Settings page.
 *
 * Lists the durable memories the model saved through `save_memory`, lets the
 * user narrow them by classification, scope, and text, and delete any entry.
 * The feature switch lives here too. Reads and writes go through this
 * plugin's own Typert gateway (`memoryList` / `memoryDelete` /
 * `memoryConfigGet` / `memoryConfigSet`), not the host settings RPCs: the
 * memories live in the `web_enhanced` storage domain and the switch lives in
 * a plugin-owned settings namespace, which the generic browser settings RPCs
 * would never list.
 *
 * The list is NOT workspace-scoped: a workspace-scoped read would hide the
 * memories whose cwd no longer resolves to a registered workspace — the very
 * ones a user would want to clean up. The scope filter separates the global
 * (cross-project) pool from project-owned records client-side.
 * @module dsh-web-enhanced/src/client/settings/MemoryPanel
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import css from './MemoryPanel.module.css';
/** Body characters shown before the row offers to expand. */
const BODY_CLAMP_CHARS = 160;
/**
 * Format one record's kind as a locale key.
 * @param kind - the memory classification.
 * @param t - translate.
 * @returns the localized kind label.
 */
function kindLabel(kind, t) {
    switch (kind) {
        case 'user': return t('memory.kind.user');
        case 'feedback': return t('memory.kind.feedback');
        case 'project': return t('memory.kind.project');
        case 'reference': return t('memory.kind.reference');
    }
}
/** Format a timestamp as a locale-neutral date string. */
function formatTime(ms) {
    if (!Number.isFinite(ms))
        return '';
    try {
        return new Date(ms).toLocaleString();
    }
    catch {
        return String(ms);
    }
}
/**
 * Whether one record survives the three active filters.
 *
 * Exported for the unit tests: this package's tests run in the node
 * environment, so the panel's judgements are pinned as pure functions rather
 * than through a render.
 * @param record - the candidate row.
 * @param kind - the classification filter; `undefined` keeps every kind.
 * @param scope - which pool to keep.
 * @param needle - the lowercased search text; `''` keeps every row.
 * @returns whether the row is shown.
 */
export function matches(record, kind, scope, needle) {
    if (kind !== undefined && record.kind !== kind)
        return false;
    if (scope === 'global' && record.workspaceId !== null)
        return false;
    if (scope === 'workspace' && record.workspaceId === null)
        return false;
    if (needle === '')
        return true;
    return `${record.summary}\n${record.body}`.toLowerCase().includes(needle);
}
/** Memory management tab: switch, list, filters, delete with confirmation. */
export function MemoryPanel({ remote, t }) {
    const [list, setList] = useState({ phase: 'loading' });
    const [config, setConfig] = useState({ phase: 'loading' });
    const [save, setSave] = useState({ phase: 'idle' });
    const [kindFilter, setKindFilter] = useState(undefined);
    const [scope, setScope] = useState('all');
    const [query, setQuery] = useState('');
    const [expanded, setExpanded] = useState(new Set());
    const [pending, setPending] = useState(undefined);
    const [busy, setBusy] = useState(false);
    const [outcome, setOutcome] = useState(undefined);
    const live = useRef(true);
    useEffect(() => () => { live.current = false; }, []);
    const load = useCallback(async () => {
        setList({ phase: 'loading' });
        const result = await remote.memoryList({});
        if (!live.current)
            return;
        if ('error' in result) {
            setList({ phase: 'error', message: result.error.message });
            return;
        }
        setList({ phase: 'ready', records: result.memories });
    }, [remote]);
    const loadConfig = useCallback(async () => {
        setConfig({ phase: 'loading' });
        setSave({ phase: 'idle' });
        const result = await remote.memoryConfigGet();
        if (!live.current)
            return;
        if ('error' in result) {
            setConfig({
                phase: 'error',
                message: result.error.code === 'memory-settings-unmanaged'
                    ? t('memory.configMissing')
                    : result.error.message,
            });
            return;
        }
        setConfig({
            phase: 'ready',
            enabled: result.enabled,
            revision: result.revision,
            writable: result.writable,
        });
    }, [remote, t]);
    useEffect(() => { void load(); }, [load]);
    useEffect(() => { void loadConfig(); }, [loadConfig]);
    const toggle = useCallback(async (enabled) => {
        if (config.phase !== 'ready')
            return;
        setSave({ phase: 'saving' });
        // exactOptionalPropertyTypes: a null revision means the namespace reports
        // none, and the field must then be ABSENT rather than explicitly undefined.
        const request = config.revision === null
            ? { enabled }
            : { enabled, expectedRevision: config.revision };
        const result = await remote.memoryConfigSet(request);
        if (!live.current)
            return;
        if ('error' in result) {
            setSave({
                phase: 'error',
                message: result.error.code === 'memory-config-conflict'
                    ? t('memory.conflict')
                    : result.error.message,
            });
            return;
        }
        setConfig({ ...config, enabled, revision: result.revision });
        setSave({ phase: 'saved' });
    }, [config, remote, t]);
    const confirm = useCallback(async () => {
        if (pending === undefined)
            return;
        const { record } = pending;
        setPending(undefined);
        setBusy(true);
        setOutcome(undefined);
        const result = await remote.memoryDelete({ id: record.id });
        if (!live.current)
            return;
        setBusy(false);
        if ('error' in result) {
            setOutcome({ ok: false, text: t('memory.deleteError', { message: result.error.message }) });
            return;
        }
        setOutcome(result.removed
            ? { ok: true, text: t('memory.deleted') }
            : { ok: false, text: t('memory.deleteMissing') });
        // The list is stale in the row the user just removed; re-read it rather
        // than patching locally so the standing-prompt section stays in sync.
        await load();
    }, [pending, remote, t, load]);
    const records = list.phase === 'ready' ? list.records : [];
    const needle = query.trim().toLowerCase();
    const visible = useMemo(() => records.filter(record => matches(record, kindFilter, scope, needle)), [records, kindFilter, scope, needle]);
    const kinds = ['user', 'feedback', 'project', 'reference'];
    const scopes = [
        { id: 'all', label: t('memory.scope.all') },
        { id: 'workspace', label: t('memory.scope.workspace') },
        { id: 'global', label: t('memory.scope.global') },
    ];
    return (_jsxs("div", { className: css.root, children: [_jsxs("div", { className: css.head, children: [_jsxs("div", { className: css.headText, children: [_jsx("div", { className: css.title, children: t('memory.title') }), _jsx("div", { className: css.subtitle, children: t('memory.hint') })] }), _jsx("button", { type: "button", className: css.ghost, disabled: busy, onClick: () => { void load(); }, children: t('memory.reload') })] }), _jsxs("div", { className: css.switchRow, children: [_jsxs("label", { className: css.switchLabel, children: [_jsx("input", { type: "checkbox", checked: config.phase === 'ready' && config.enabled, disabled: config.phase !== 'ready' || !config.writable || save.phase === 'saving', onChange: (event) => { void toggle(event.target.checked); } }), _jsx("span", { children: t('memory.enabled') })] }), save.phase === 'saving' && _jsx("span", { className: css.saveState, children: t('memory.saving') }), save.phase === 'saved' && _jsx("span", { className: css.saveState, children: t('memory.saved') }), _jsx("div", { className: css.switchHint, children: t('memory.enabledHint') }), config.phase === 'ready' && !config.writable && (_jsx("p", { className: css.failure, children: t('memory.readonly') })), config.phase === 'error' && _jsx("p", { className: css.failure, children: config.message }), save.phase === 'error' && (_jsx("p", { className: css.failure, children: t('memory.saveError', { message: save.message }) }))] }), outcome !== undefined && (_jsx("div", { className: outcome.ok ? css.noteOk : css.noteBad, children: _jsx("div", { children: outcome.text }) })), list.phase === 'error' && (_jsxs(_Fragment, { children: [_jsx("p", { className: css.failure, children: t('memory.loadError', { message: list.message }) }), _jsx("button", { type: "button", className: css.ghost, onClick: () => { void load(); }, children: t('memory.reload') })] })), (list.phase === 'loading' || busy) && _jsx("p", { className: css.muted, children: t('memory.loading') }), list.phase === 'ready' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: css.filters, children: [_jsx("button", { type: "button", className: kindFilter === undefined ? css.filterActive : css.filter, onClick: () => { setKindFilter(undefined); }, children: t('memory.kind.all') }), kinds.map(kind => (_jsx("button", { type: "button", className: kindFilter === kind ? css.filterActive : css.filter, onClick: () => { setKindFilter(kind); }, children: kindLabel(kind, t) }, kind))), _jsx("span", { className: css.count, children: t('memory.count', { count: String(visible.length) }) })] }), _jsxs("div", { className: css.filters, children: [scopes.map(entry => (_jsx("button", { type: "button", className: scope === entry.id ? css.filterActive : css.filter, onClick: () => { setScope(entry.id); }, children: entry.label }, entry.id))), _jsx("input", { type: "search", className: css.search, value: query, placeholder: t('memory.searchPlaceholder'), "aria-label": t('memory.searchPlaceholder'), onChange: (event) => { setQuery(event.target.value); } })] }), visible.length === 0
                        ? (_jsx("p", { className: css.muted, children: needle === '' ? t('memory.empty') : t('memory.searchEmpty', { query: query.trim() }) }))
                        : (_jsx("ul", { className: css.rows, children: visible.map((record) => {
                                const open = expanded.has(record.id);
                                const clamped = record.body.length > BODY_CLAMP_CHARS;
                                return (_jsxs("li", { className: css.row, children: [_jsxs("div", { className: css.rowMain, children: [_jsxs("div", { className: css.rowTitle, children: [_jsx("span", { className: css.kindTag, children: kindLabel(record.kind, t) }), _jsx("span", { className: css.summary, children: record.summary })] }), record.body !== '' && (_jsx("div", { className: css.body, children: clamped && !open ? `${record.body.slice(0, BODY_CLAMP_CHARS)}…` : record.body })), clamped && (_jsx("button", { type: "button", className: css.more, onClick: () => {
                                                        setExpanded((current) => {
                                                            const next = new Set(current);
                                                            if (!next.delete(record.id))
                                                                next.add(record.id);
                                                            return next;
                                                        });
                                                    }, children: open ? t('memory.collapse') : t('memory.expand') })), _jsxs("div", { className: css.meta, children: [_jsx("span", { className: css.scope, children: record.workspaceId === null ? t('memory.scope.global') : t('memory.scope.workspace') }), _jsx("span", { className: css.time, children: formatTime(record.updatedAt) })] })] }), _jsx("div", { className: css.rowActions, children: _jsx("button", { type: "button", className: css.danger, disabled: busy, onClick: () => { setPending({ record }); }, children: t('memory.delete') }) })] }, record.id));
                            }) }))] })), pending !== undefined && (_jsxs("div", { className: css.confirm, role: "alertdialog", "aria-modal": "true", children: [_jsx("p", { className: css.confirmText, children: t('memory.deleteConfirm') }), _jsxs("div", { className: css.rowMain, children: [_jsxs("div", { className: css.rowTitle, children: [_jsx("span", { className: css.kindTag, children: kindLabel(pending.record.kind, t) }), _jsx("span", { className: css.summary, children: pending.record.summary })] }), pending.record.body !== '' && _jsx("div", { className: css.body, children: pending.record.body })] }), _jsxs("div", { className: css.confirmActions, children: [_jsx("button", { type: "button", className: css.ghost, onClick: () => { setPending(undefined); }, children: t('memory.cancel') }), _jsx("button", { type: "button", className: css.danger, onClick: () => { void confirm(); }, children: t('memory.delete') })] })] }))] }));
}
