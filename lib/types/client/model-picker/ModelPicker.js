import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Composer model picker: a plugin-owned shadow of the host
 * `conversation.input.model` seat.
 *
 * The host ui-model-selection component is a small in-place menu with every
 * provider expanded at once. This registration wins the single slot at a lower
 * priority and renders a wider portaled menu instead: one row per provider
 * (collapsed by default) whose submenu lists that provider's models, plus the
 * current model's reasoning-effort choices. Data and writes still ride the
 * host's shared per-session ModelDirectory, so the /model command and this
 * seat stay one fact source.
 * @module dsh-web-enhanced/src/client/model-picker/ModelPicker
 */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, } from 'react';
import { IconChevronDownOutline14, IconWarningOutline16, Menu, Toast, } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './ModelPicker.module.css';
/** Stable empty snapshot for deployments where the directory never mounts. */
const EMPTY_STATE = {
    current: null, groups: [], failures: [], status: 'idle', error: null,
};
/** One selectable model id over the wire (provider/model may contain slashes). */
const modelId = (provider, model) => `model:${JSON.stringify({ provider, model })}`;
/** Decode a model menu id. */
function selectionOfId(id) {
    if (!id.startsWith('model:'))
        return null;
    try {
        const parsed = JSON.parse(id.slice('model:'.length));
        if (typeof parsed !== 'object' || parsed === null)
            return null;
        const { provider, model } = parsed;
        return typeof provider === 'string' && typeof model === 'string' ? { provider, model } : null;
    }
    catch {
        return null;
    }
}
/**
 * The composer model seat replacement.
 * @param props - locked, shared directory store, load/select verbs, locale.
 */
export function ModelPicker({ locked, available, directory, load, select, t }) {
    const state = useSyncExternalStore(callback => directory?.subscribe(callback) ?? (() => { }), () => directory?.getSnapshot() ?? EMPTY_STATE);
    const [open, setOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const toastSeq = useRef(0);
    const triggerRef = useRef(null);
    const currentGroup = state.current === null
        ? undefined
        : state.groups.find(group => group.id === state.current.provider);
    const currentModel = currentGroup?.models.find(model => model.id === state.current?.model);
    const reasoning = currentModel?.reasoning;
    const effectiveEffort = state.current?.reasoningEffort ?? reasoning?.defaultEffort;
    const modelLabel = currentModel?.name ?? (state.current === null ? t('modelPicker.select') : state.current.model);
    const effortLabel = reasoning === undefined
        ? undefined
        : effectiveEffort === undefined
            ? t('modelPicker.providerDefault')
            : reasoning.efforts.find(level => level.id === effectiveEffort)?.name ?? effectiveEffort;
    const show = () => {
        setOpen(true);
        load();
    };
    // Keep the directory fresh on mount, mirroring the host seat.
    useEffect(() => {
        if (available)
            load();
    }, [available, load]);
    const announceFailure = () => {
        const message = directory?.getSnapshot().error;
        if (message !== null && message !== '') {
            toastSeq.current += 1;
            setToast({ seq: toastSeq.current, text: t('modelPicker.error', { message }) });
        }
    };
    const choose = useCallback(async (selection) => {
        if (state.current?.provider === selection.provider
            && state.current.model === selection.model
            && state.current.reasoningEffort === selection.reasoningEffort) {
            setOpen(false);
            return;
        }
        const accepted = await select(selection);
        if (accepted) {
            setOpen(false);
            return;
        }
        announceFailure();
    }, [select, state.current]);
    const chooseEffort = useCallback(async (effort) => {
        if (state.current === null)
            return;
        if (effectiveEffort === effort) {
            setOpen(false);
            return;
        }
        const accepted = await select({
            provider: state.current.provider,
            model: state.current.model,
            ...effort === undefined ? {} : { reasoningEffort: effort },
        });
        if (accepted)
            setOpen(false);
        else
            announceFailure();
    }, [effectiveEffort, select, state.current]);
    if (!available || directory === null)
        return null;
    const busy = state.status === 'selecting';
    const entries = useMemo(() => {
        const rows = [];
        if (state.status === 'loading' && state.groups.length === 0) {
            rows.push({ type: 'label', id: 'loading', text: t('modelPicker.loading') });
            return rows;
        }
        if (state.error !== null && state.groups.length === 0) {
            rows.push({ type: 'label', id: 'error', text: t('modelPicker.error', { message: state.error }) });
            rows.push({ id: 'retry', label: t('modelPicker.retry'), disabled: busy });
            return rows;
        }
        for (const group of state.groups) {
            rows.push({
                id: `provider:${group.id}`,
                label: _jsxs("span", { className: css.providerRow, children: [group.name, _jsx("span", { className: css.count, children: group.models.length })] }),
                submenu: group.models.map(model => {
                    const selected = state.current?.provider === group.id && state.current.model === model.id;
                    return {
                        id: modelId(group.id, model.id),
                        label: (_jsxs("span", { className: css.modelRow, children: [_jsxs("span", { className: css.modelCopy, children: [_jsx("span", { className: css.modelName, children: model.name }), model.description !== undefined && _jsx("span", { className: css.description, children: model.description })] }), selected && _jsx("span", { className: css.selectedMark, children: "\u2713" })] })),
                    };
                }),
            });
        }
        for (const failure of state.failures) {
            rows.push({ type: 'label', id: `failure:${failure.id}`, text: `${failure.name}: ${failure.message}` });
        }
        if (reasoning !== undefined && state.current !== null) {
            rows.push({ type: 'separator', id: 'effort-separator' });
            rows.push({
                id: 'effort',
                label: (_jsxs("span", { className: css.providerRow, children: [t('modelPicker.effort'), _jsx("span", { className: css.count, children: effortLabel })] })),
                submenu: [
                    ...reasoning.defaultEffort === undefined
                        ? [{
                                id: 'effort:default',
                                label: (_jsxs("span", { className: css.modelRow, children: [_jsx("span", { className: css.modelName, children: t('modelPicker.providerDefault') }), effectiveEffort === undefined && _jsx("span", { className: css.selectedMark, children: "\u2713" })] })),
                            }]
                        : [],
                    ...reasoning.efforts.map(level => ({
                        id: `effort:${level.id}`,
                        label: (_jsxs("span", { className: css.modelRow, children: [_jsxs("span", { className: css.modelCopy, children: [_jsx("span", { className: css.modelName, children: level.name }), level.description !== undefined && _jsx("span", { className: css.description, children: level.description })] }), effectiveEffort === level.id && _jsx("span", { className: css.selectedMark, children: "\u2713" })] })),
                    })),
                ],
            });
        }
        return rows;
    }, [state, t, busy, reasoning, effortLabel, effectiveEffort]);
    const onSelect = useCallback((id) => {
        if (id === 'retry') {
            load();
            return;
        }
        if (id.startsWith('effort:')) {
            const effort = id === 'effort:default' ? undefined : id.slice('effort:'.length);
            void chooseEffort(effort);
            return;
        }
        const selection = selectionOfId(id);
        if (selection === null)
            return;
        const model = state.groups
            .find(group => group.id === selection.provider)
            ?.models.find(entry => entry.id === selection.model);
        void choose({
            ...selection,
            ...model?.reasoning?.defaultEffort === undefined ? {} : { reasoningEffort: model.reasoning.defaultEffort },
        });
    }, [choose, chooseEffort, load, state.groups]);
    const trigger = (_jsxs("button", { ref: triggerRef, type: "button", className: css.trigger, "aria-haspopup": "menu", "aria-expanded": open, disabled: locked || busy, title: `${modelLabel}${effortLabel === undefined ? '' : ` · ${effortLabel}`}`, onClick: () => { open ? setOpen(false) : show(); }, children: [_jsx("span", { className: css.triggerLabel, children: modelLabel }), effortLabel !== undefined && _jsx("span", { className: css.triggerEffort, children: effortLabel }), _jsx(IconChevronDownOutline14, { className: css.chevron })] }));
    return (_jsxs(_Fragment, { children: [_jsx(Menu, { className: css.menu, open: open, anchor: trigger, items: entries, onSelect: onSelect, onClose: () => { setOpen(false); }, portal: true, side: "bottom", align: "end", getAnchorRect: () => triggerRef.current?.getBoundingClientRect() ?? null, footer: state.status === 'loading' && state.groups.length > 0
                    ? [{ type: 'label', id: 'refreshing', text: t('modelPicker.loading') }]
                    : [] }), toast !== null && (_jsx(Toast, { text: toast.text, icon: _jsx(IconWarningOutline16, {}), anchor: triggerRef.current?.closest('[data-composer-card]') ?? null, onDone: () => { setToast(null); } }, toast.seq))] }));
}
