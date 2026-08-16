import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Composer model picker: a plugin-owned shadow of the host
 * `conversation.input.model` seat.
 *
 * The host ui-model-selection component is a small in-place menu with every
 * provider expanded at once. This registration wins the single slot at a lower
 * priority and renders a centered floating dialog instead: one collapsible
 * section per provider (only the selected provider starts expanded), plus the
 * current model's reasoning-effort choices. Data and writes still ride the
 * host's shared per-session ModelDirectory, so the /model command and this
 * seat stay one fact source.
 * @module dsh-web-enhanced/src/client/model-picker/ModelPicker
 */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, } from 'react';
import { IconChevronDownOutline14, IconWarningOutline16, Modal, Toast, } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './ModelPicker.module.css';
/** Stable empty snapshot for deployments where the directory never mounts. */
const EMPTY_STATE = {
    current: null, groups: [], failures: [], status: 'idle', error: null,
};
/**
 * The composer model seat replacement: compact trigger + centered dialog.
 * @param props - locked, shared directory store, load/select verbs, locale.
 */
export function ModelPicker({ locked, available, directory, load, select, t }) {
    const state = useSyncExternalStore(callback => directory?.subscribe(callback) ?? (() => { }), () => directory?.getSnapshot() ?? EMPTY_STATE);
    const [open, setOpen] = useState(false);
    const [openProviders, setOpenProviders] = useState(new Set());
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
    const busy = state.status === 'selecting';
    const show = () => {
        setOpenProviders(state.current === null ? new Set() : new Set([state.current.provider]));
        setOpen(true);
        load();
    };
    const toggleProvider = useCallback((provider) => {
        setOpenProviders(current => {
            const next = new Set(current);
            if (next.has(provider))
                next.delete(provider);
            else
                next.add(provider);
            return next;
        });
    }, []);
    // Keep the directory fresh on mount, mirroring the host seat.
    useEffect(() => {
        if (available)
            load();
    }, [available, load]);
    // A load finishing after show() expands the newly reported selected provider.
    useEffect(() => {
        if (open && state.current !== null) {
            setOpenProviders(current => current.size === 0 ? new Set([state.current.provider]) : current);
        }
    }, [open, state.current]);
    const announceFailure = useCallback(() => {
        const message = directory?.getSnapshot().error;
        if (message !== null && message !== '') {
            toastSeq.current += 1;
            setToast({ seq: toastSeq.current, text: t('modelPicker.error', { message }) });
        }
    }, [directory, t]);
    const choose = useCallback(async (selection) => {
        if (state.current?.provider === selection.provider
            && state.current.model === selection.model
            && state.current.reasoningEffort === selection.reasoningEffort) {
            setOpen(false);
            return;
        }
        const accepted = await select(selection);
        if (accepted)
            setOpen(false);
        else
            announceFailure();
    }, [announceFailure, select, state.current]);
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
    }, [announceFailure, effectiveEffort, select, state.current]);
    const effortRows = useMemo(() => (reasoning === undefined
        ? []
        : [
            ...reasoning.defaultEffort === undefined
                ? [{ id: 'effort:default', name: t('modelPicker.providerDefault'), description: undefined }]
                : [],
            ...reasoning.efforts.map(level => ({
                id: `effort:${level.id}`, name: level.name, description: level.description,
            })),
        ]), [reasoning, t]);
    if (!available || directory === null)
        return null;
    const trigger = (_jsxs("button", { ref: triggerRef, type: "button", className: css.trigger, "aria-haspopup": "dialog", "aria-expanded": open, disabled: locked || busy, title: `${modelLabel}${effortLabel === undefined ? '' : ` · ${effortLabel}`}`, onClick: () => { open ? setOpen(false) : show(); }, children: [_jsx("span", { className: css.triggerLabel, children: modelLabel }), effortLabel !== undefined && _jsx("span", { className: css.triggerEffort, children: effortLabel }), _jsx(IconChevronDownOutline14, { className: css.chevron })] }));
    return (_jsxs(_Fragment, { children: [trigger, _jsxs(Modal, { open: open, onClose: () => { setOpen(false); }, title: t('modelPicker.title'), closeLabel: t('modelPicker.close'), description: t('modelPicker.hint'), className: css.modal, contentClassName: css.modalContent, footer: (_jsxs("div", { className: css.footer, children: [_jsxs("span", { className: css.footerCurrent, children: [modelLabel, effortLabel === undefined ? '' : ` · ${effortLabel}`] }), state.status === 'loading' && _jsx("span", { className: css.loading, children: t('modelPicker.loading') })] })), children: [state.error !== null && state.groups.length === 0 && (_jsxs("div", { className: css.error, children: [_jsx("span", { children: t('modelPicker.error', { message: state.error }) }), _jsx("button", { type: "button", className: css.retry, onClick: load, children: t('modelPicker.retry') })] })), state.failures.map(failure => (_jsxs("div", { className: css.warning, children: [failure.name, ": ", failure.message] }, failure.id))), _jsx("div", { className: css.groups, children: state.groups.map(group => {
                            const expanded = openProviders.has(group.id);
                            return (_jsxs("section", { className: css.group, children: [_jsxs("button", { type: "button", className: css.providerHeader, "aria-expanded": expanded, onClick: () => { toggleProvider(group.id); }, children: [_jsx(IconChevronDownOutline14, { className: expanded ? css.chevronOpen : css.chevronClosed }), _jsx("span", { className: css.providerName, children: group.name }), _jsx("span", { className: css.count, children: group.models.length })] }), expanded && (_jsx("div", { className: css.models, role: "group", children: group.models.map(model => {
                                            const selected = state.current?.provider === group.id && state.current.model === model.id;
                                            return (_jsxs("button", { type: "button", className: `${css.modelRow}${selected ? ` ${css.modelSelected}` : ''}`, disabled: busy, onClick: () => {
                                                    void choose({
                                                        provider: group.id,
                                                        model: model.id,
                                                        ...model.reasoning?.defaultEffort === undefined
                                                            ? {}
                                                            : { reasoningEffort: model.reasoning.defaultEffort },
                                                    });
                                                }, children: [_jsxs("span", { className: css.modelCopy, children: [_jsx("span", { className: css.modelName, children: model.name }), model.description !== undefined && (_jsx("span", { className: css.description, children: model.description }))] }), selected && _jsx("span", { className: css.selectedMark, children: "\u2713" })] }, model.id));
                                        }) }))] }, group.id));
                        }) }), effortRows.length > 0 && (_jsxs("section", { className: css.effortSection, children: [_jsx("h3", { className: css.effortTitle, children: t('modelPicker.effort') }), _jsx("div", { className: css.models, children: effortRows.map(level => {
                                    const selected = level.id === 'effort:default'
                                        ? effectiveEffort === undefined
                                        : effectiveEffort === level.id.slice('effort:'.length);
                                    return (_jsxs("button", { type: "button", className: `${css.modelRow}${selected ? ` ${css.modelSelected}` : ''}`, disabled: busy, onClick: () => {
                                            void chooseEffort(level.id === 'effort:default' ? undefined : level.id.slice('effort:'.length));
                                        }, children: [_jsxs("span", { className: css.modelCopy, children: [_jsx("span", { className: css.modelName, children: level.name }), level.description !== undefined && _jsx("span", { className: css.description, children: level.description })] }), selected && _jsx("span", { className: css.selectedMark, children: "\u2713" })] }, level.id));
                                }) })] }))] }), toast !== null && (_jsx(Toast, { text: toast.text, icon: _jsx(IconWarningOutline16, {}), anchor: triggerRef.current?.closest('[data-composer-card]') ?? null, onDone: () => { setToast(null); } }, toast.seq))] }));
}
