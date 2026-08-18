import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * The Model Capabilities settings page inside Web Enhanced. It edits exactly
 * what the host Models editor deliberately leaves out:
 *
 * - llm-deepseek (whole section): `thinking` and `reasoningEffort`.
 * - llm-pi-ai provider profiles: `defaultInput` / `reasoning`, plus every
 *   model's `input` and `reasoningEfforts` — through `models` rows when the
 *   profile already owns the list, through minimal `modelOverrides` entries
 *   for catalog routes otherwise.
 *
 * Every card applies path-addressed settings ops against the user layer it
 * cloned, so fields edited by the host Models page survive untouched.
 * @module dsh-web-enhanced/src/client/model-capabilities/ModelCapabilities
 */
import { useEffect, useMemo, useState } from 'react';
import { deletePath, getPath, hasPath, setPath, } from '@deepseek-ai/dsh-client-schema-form';
import { applyDraft, cloneRecord, DEEPSEEK_NS, draftAt, isRecord, MODALITIES, normalizePiAiDraft, PI_AI_NS, recordOf, THINKING_LEVELS, validateDeepSeekDraft, validatePiAiDraft, } from "./settings-draft.js";
import { modelOptionsOf } from "./store.js";
import css from './ModelCapabilities.module.css';
const LEVEL_KEYS = {
    off: 'modelCapabilities.reasoningLevelOff',
    minimal: 'modelCapabilities.reasoningLevelMinimal',
    low: 'modelCapabilities.reasoningLevelLow',
    medium: 'modelCapabilities.reasoningLevelMedium',
    high: 'modelCapabilities.reasoningLevelHigh',
    xhigh: 'modelCapabilities.reasoningLevelXHigh',
    max: 'modelCapabilities.reasoningLevelMax',
};
/** Render the settings section content column. */
export function ModelCapabilitiesSection(props) {
    return _jsx(Loaded, { ...props });
}
function Loaded({ controller, useSnapshot, api, t }) {
    const state = useSnapshot(snapshot => snapshot);
    // Revisions successfully written by one card are shared with every other
    // mounted card of the same namespace: they all edit one settings section,
    // so the first save invalidates the revision every sibling captured.
    // External changes are deliberately NOT shared — those must keep surfacing
    // the settings-conflict error instead of silently rebasing a stale draft.
    const [coordinatedRevisions, setCoordinatedRevisions] = useState(() => new Map());
    const noteApplied = (ns, revision) => {
        setCoordinatedRevisions((previous) => {
            const next = new Map(previous);
            next.set(ns, revision);
            return next;
        });
    };
    const reload = async (ns) => {
        await controller.load();
        // A reload after a conflict is the user re-anchoring on the CURRENT
        // revision; any older revision this page itself wrote must stop being
        // pushed into the remounted card.
        setCoordinatedRevisions((previous) => {
            if (!previous.has(ns))
                return previous;
            const next = new Map(previous);
            next.delete(ns);
            return next;
        });
    };
    if (state.status === 'idle')
        void controller.load();
    if (state.status === 'error') {
        const errorText = state.error ?? '';
        return (_jsxs("div", { className: css.root, children: [_jsx("p", { className: css.error, children: `${t('modelCapabilities.loadFailed')}: ${errorText}` }), _jsx("button", { type: "button", className: css.button, onClick: () => { void controller.load(); }, children: t('modelCapabilities.retry') })] }));
    }
    const deepseek = state.providers.find(entry => entry.settingsNs === DEEPSEEK_NS);
    const piAi = state.providers.filter(entry => entry.settingsNs === PI_AI_NS);
    const deepseekNamespace = deepseek === undefined
        ? undefined
        : state.namespaces.get(DEEPSEEK_NS);
    return (_jsxs("div", { className: css.root, children: [_jsx("h2", { className: css.title, children: t('modelCapabilities.title') }), _jsx("p", { className: css.intro, children: t('modelCapabilities.intro') }), !state.writable && state.status === 'ready'
                ? _jsx("p", { className: css.notice, children: t('modelCapabilities.readOnly') })
                : null, state.modelFailures.map(failure => (_jsx("p", { className: css.notice, children: t('modelCapabilities.catalogError').replace('{message}', failure.message) }, failure.id))), state.status === 'loading' && deepseek === undefined && piAi.length === 0
                ? _jsx("p", { className: css.notice, children: t('modelCapabilities.loading') })
                : null, deepseek !== undefined && deepseekNamespace !== undefined
                ? (_jsx(DeepSeekCapabilitiesCard, { entry: deepseek, namespace: deepseekNamespace, api: api, t: t, readOnly: !state.writable, coordinatedRevision: coordinatedRevisions.get(DEEPSEEK_NS), onApplied: noteApplied, reload: reload }))
                : null, piAi.map((entry) => {
                const namespace = state.namespaces.get(PI_AI_NS);
                /* v8 ignore next -- the join only shows rows whose namespace resolved */
                if (namespace === undefined)
                    return null;
                return (_jsx(PiAiCapabilitiesCard, { entry: entry, namespace: namespace, catalog: state.modelsByProvider.get(entry.provider) ?? [], api: api, t: t, readOnly: !state.writable, coordinatedRevision: coordinatedRevisions.get(PI_AI_NS), onApplied: noteApplied, reload: reload }, entry.provider));
            }), deepseek === undefined && piAi.length === 0 && state.status === 'ready'
                ? _jsx("p", { className: css.notice, children: t('modelCapabilities.noProviders') })
                : null] }));
}
function CardActions({ busy, disabled, saved, failure, conflicted, t, onReload, onReset, onApply }) {
    return (_jsxs(_Fragment, { children: [saved && failure === undefined
                ? _jsx("p", { className: css.saved, role: "status", children: t('modelCapabilities.saved') })
                : null, failure !== undefined ? _jsx("p", { className: css.error, children: failure }) : null, _jsxs("div", { className: css.actions, children: [conflicted
                        ? (_jsx("button", { type: "button", className: css.button, disabled: busy, onClick: onReload, children: t('modelCapabilities.reload') }))
                        : null, _jsx("button", { type: "button", className: css.button, disabled: disabled, onClick: onReset, children: t('modelCapabilities.reset') }), _jsx("button", { type: "button", className: css.buttonPrimary, disabled: disabled, onClick: onApply, children: busy ? t('modelCapabilities.applying') : t('modelCapabilities.apply') })] })] }));
}
function InputEditor({ value, onChange, disabled, required = false, t }) {
    const list = Array.isArray(value) ? value : [];
    const has = (modality) => list.includes(modality);
    const toggle = (modality) => {
        const next = has(modality)
            ? list.filter(existing => existing !== modality)
            : [...list, modality];
        onChange(next.length === 0 && !required ? undefined : next);
    };
    return (_jsxs("div", { className: css.checkRow, children: [value === undefined ? _jsx("span", { className: css.inheritBadge, children: t('modelCapabilities.inputInherit') }) : null, MODALITIES.map(modality => (_jsxs("label", { className: css.check, children: [_jsx("input", { type: "checkbox", checked: has(modality), disabled: disabled, onChange: () => { toggle(modality); } }), _jsx("span", { children: modality === 'text' ? t('modelCapabilities.inputText') : t('modelCapabilities.inputImage') })] }, modality)))] }));
}
/** Read the reasoning-efforts field as one of the editor's three states. */
function reasoningModeOf(value) {
    if (value === false)
        return 'none';
    return isRecord(value) ? 'custom' : 'inherit';
}
/** The fixed custom-effort rows, initialized with the common levels. */
const CUSTOM_REASONING_DEFAULT = { off: null, high: 'high' };
function ReasoningEditor({ value, onChange, disabled, t }) {
    const mode = reasoningModeOf(value);
    const dict = mode === 'custom' && isRecord(value) ? value : {};
    const setMode = (next) => {
        if (next === 'inherit')
            onChange(undefined);
        else if (next === 'none')
            onChange(false);
        else
            onChange(cloneRecord(isRecord(value) ? value : CUSTOM_REASONING_DEFAULT));
    };
    const toggleLevel = (level) => {
        const next = { ...dict };
        if (level in next)
            delete next[level];
        else
            next[level] = level === 'off' ? null : level;
        onChange(next);
    };
    const setWire = (level, text) => {
        const next = { ...dict };
        if (level === 'off')
            next[level] = text.trim().length === 0 ? null : text;
        else
            next[level] = text;
        onChange(next);
    };
    const wireText = (level) => {
        const wire = dict[level];
        return wire === null ? '' : typeof wire === 'string' ? wire : '';
    };
    return (_jsxs("div", { className: css.reasoningEditor, children: [_jsxs("select", { className: css.select, value: mode, disabled: disabled, "aria-label": t('modelCapabilities.reasoning'), onChange: (event) => { setMode(event.target.value); }, children: [_jsx("option", { value: "inherit", children: t('modelCapabilities.reasoningInherit') }), _jsx("option", { value: "none", children: t('modelCapabilities.reasoningNone') }), _jsx("option", { value: "custom", children: t('modelCapabilities.reasoningCustom') })] }), mode === 'custom'
                ? (_jsxs("div", { className: css.reasoningCustom, children: [_jsx("p", { className: css.fieldHint, children: t('modelCapabilities.reasoningCustomHint') }), THINKING_LEVELS.map(level => (_jsxs("div", { className: css.reasoningLevelRow, children: [_jsxs("label", { className: css.check, children: [_jsx("input", { type: "checkbox", checked: level in dict, disabled: disabled, onChange: () => { toggleLevel(level); } }), _jsx("span", { children: t(LEVEL_KEYS[level]) })] }), level in dict
                                    ? (_jsx("input", { className: css.input, type: "text", value: wireText(level), placeholder: level === 'off'
                                            ? t('modelCapabilities.reasoningWireOffPlaceholder')
                                            : t('modelCapabilities.reasoningWirePlaceholder'), "aria-label": `${t('modelCapabilities.reasoningWire')} ${t(LEVEL_KEYS[level])}`, disabled: disabled, onChange: (event) => { setWire(level, event.target.value); } }))
                                    : null] }, level)))] }))
                : null] }));
}
/** What inheriting reasoning means for one exact model, read from llm.models. */
function InheritedReasoningHint({ model, t }) {
    const reasoning = model?.reasoning;
    if (reasoning === undefined || reasoning.efforts.length === 0) {
        return _jsx("p", { className: css.fieldHint, children: t('modelCapabilities.reasoningInheritedNone') });
    }
    const levels = reasoning.efforts.map(effort => effort.name).join(' / ');
    const defaultName = reasoning.efforts.find(effort => effort.id === reasoning.defaultEffort)?.name ?? '—';
    return (_jsx("p", { className: css.fieldHint, children: t('modelCapabilities.reasoningInherited')
            .replace('{levels}', levels)
            .replace('{default}', defaultName) }));
}
function DeepSeekCapabilitiesCard(props) {
    const [epoch, setEpoch] = useState(0);
    const requestReload = () => {
        void props.reload(props.namespace.ns).then(() => { setEpoch(current => current + 1); });
    };
    return _jsx(DeepSeekCapabilitiesCardBody, { ...props, onReloadRequested: requestReload }, epoch);
}
function DeepSeekCapabilitiesCardBody({ namespace, api, t, readOnly, coordinatedRevision, onApplied, onReloadRequested, }) {
    const [draft, setDraft] = useState(() => draftAt(namespace, []));
    const [committedOriginal, setCommittedOriginal] = useState(() => getPath(namespace.user, []));
    const [expectedRevision, setExpectedRevision] = useState(() => namespace.revision);
    const [busy, setBusy] = useState(false);
    const [failure, setFailure] = useState(undefined);
    const [conflicted, setConflicted] = useState(false);
    const [saved, setSaved] = useState(false);
    const disabled = readOnly || busy;
    // Only this page's own successful writes advance a sibling card's revision;
    // external settings changes deliberately keep the conflict path.
    useEffect(() => {
        if (coordinatedRevision !== undefined)
            setExpectedRevision(coordinatedRevision);
    }, [coordinatedRevision]);
    const stringAt = (key) => {
        const value = draft[key];
        return typeof value === 'string' && value.length > 0 ? value : undefined;
    };
    const setField = (key, next) => {
        setSaved(false);
        setFailure(undefined);
        setConflicted(false);
        setDraft(current => next === undefined
            ? deletePath(current, [key])
            : setPath(current, [key], next));
    };
    const reset = () => {
        setFailure(undefined);
        setConflicted(false);
        setSaved(false);
        setDraft(cloneRecord(committedOriginal));
    };
    const apply = async () => {
        setBusy(true);
        setFailure(undefined);
        setConflicted(false);
        setSaved(false);
        const validation = validateDeepSeekDraft(draft);
        if (validation !== undefined) {
            setFailure(t(`modelCapabilities.${validation}`));
            setBusy(false);
            return;
        }
        const result = await applyDraft({
            api,
            ns: namespace.ns,
            path: [],
            before: committedOriginal,
            after: draft,
            expectedRevision,
            conflictText: t('modelCapabilities.conflict'),
        });
        if (!result.ok) {
            setFailure(t('modelCapabilities.saveError').replace('{message}', result.failure));
            setConflicted(result.conflicted);
            setBusy(false);
            return;
        }
        setCommittedOriginal(result.committed);
        setExpectedRevision(result.revision);
        setDraft(cloneRecord(result.committed));
        setSaved(true);
        setBusy(false);
        onApplied(namespace.ns, result.revision);
    };
    return (_jsxs("details", { className: css.card, open: true, children: [_jsxs("summary", { className: css.summary, children: [_jsx("span", { className: css.cardTitle, children: "DeepSeek" }), _jsx("span", { className: css.cardRoute, children: "deepseek-official" })] }), _jsxs("div", { className: css.cardBody, children: [_jsx("p", { className: css.fieldHint, children: t('modelCapabilities.deepseekHint') }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('modelCapabilities.thinking') }), _jsxs("select", { className: css.select, value: stringAt('thinking') ?? '', disabled: disabled, onChange: (event) => { setField('thinking', event.target.value === '' ? undefined : event.target.value); }, children: [_jsx("option", { value: "", children: t('modelCapabilities.thinkingInherit') }), _jsx("option", { value: "enabled", children: t('modelCapabilities.thinkingEnabled') }), _jsx("option", { value: "disabled", children: t('modelCapabilities.thinkingDisabled') })] })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('modelCapabilities.reasoningEffort') }), _jsxs("select", { className: css.select, value: stringAt('reasoningEffort') ?? '', disabled: disabled, onChange: (event) => { setField('reasoningEffort', event.target.value === '' ? undefined : event.target.value); }, children: [_jsx("option", { value: "", children: t('modelCapabilities.reasoningEffortInherit') }), _jsx("option", { value: "off", children: "off" }), _jsx("option", { value: "high", children: "high" }), _jsx("option", { value: "max", children: "max" })] })] }), _jsx(CardActions, { busy: busy, disabled: disabled, saved: saved, failure: failure, conflicted: conflicted, t: t, onReload: onReloadRequested, onReset: reset, onApply: () => { void apply(); } })] })] }));
}
function PiAiCapabilitiesCard(props) {
    const [epoch, setEpoch] = useState(0);
    const requestReload = () => {
        void props.reload(props.namespace.ns).then(() => { setEpoch(current => current + 1); });
    };
    return _jsx(PiAiCapabilitiesCardBody, { ...props, onReloadRequested: requestReload }, epoch);
}
function PiAiCapabilitiesCardBody({ entry, namespace, catalog, api, t, readOnly, coordinatedRevision, onApplied, onReloadRequested, }) {
    const path = entry.settingsPath;
    const [draft, setDraft] = useState(() => draftAt(namespace, path));
    const [committedOriginal, setCommittedOriginal] = useState(() => getPath(namespace.user, path));
    const [expectedRevision, setExpectedRevision] = useState(() => namespace.revision);
    const [busy, setBusy] = useState(false);
    const [failure, setFailure] = useState(undefined);
    const [conflicted, setConflicted] = useState(false);
    const [saved, setSaved] = useState(false);
    const [addingId, setAddingId] = useState('');
    const disabled = readOnly || busy;
    const configured = getPath(namespace.user, path) !== undefined;
    const catalogById = useMemo(() => new Map(catalog.map(model => [model.id, model])), [catalog]);
    // Only this page's own successful writes advance a sibling card's revision;
    // external settings changes deliberately keep the conflict path.
    useEffect(() => {
        if (coordinatedRevision !== undefined)
            setExpectedRevision(coordinatedRevision);
    }, [coordinatedRevision]);
    const stringAt = (key) => {
        const value = draft[key];
        return typeof value === 'string' && value.length > 0 ? value : undefined;
    };
    const setField = (key, next) => {
        setSaved(false);
        setFailure(undefined);
        setConflicted(false);
        setDraft(current => next === undefined
            ? deletePath(current, [key])
            : setPath(current, [key], next));
    };
    const patchListEntry = (index, key, value) => {
        setSaved(false);
        setFailure(undefined);
        setConflicted(false);
        setDraft((current) => {
            const models = Array.isArray(current['models']) ? [...current['models']] : [];
            const previous = recordOf(models[index]);
            const next = { ...previous };
            if (value === undefined)
                delete next[key];
            else
                next[key] = value;
            models[index] = next;
            return setPath(current, ['models'], models);
        });
    };
    const patchOverride = (id, key, value) => {
        setSaved(false);
        setFailure(undefined);
        setConflicted(false);
        setDraft((current) => {
            const overrides = recordOf(current['modelOverrides']);
            const previous = recordOf(overrides[id]);
            const next = { ...previous };
            if (value === undefined)
                delete next[key];
            else
                next[key] = value;
            return setPath(current, ['modelOverrides', id], next);
        });
    };
    const removeOverride = (id) => {
        setSaved(false);
        setFailure(undefined);
        setConflicted(false);
        setDraft((current) => {
            const overrides = recordOf(current['modelOverrides']);
            const next = { ...overrides };
            delete next[id];
            return Object.keys(next).length === 0
                ? deletePath(current, ['modelOverrides'])
                : setPath(current, ['modelOverrides'], next);
        });
    };
    const addOverride = () => {
        const id = addingId;
        if (id.length === 0)
            return;
        setAddingId('');
        setSaved(false);
        setFailure(undefined);
        setConflicted(false);
        setDraft(current => setPath(current, ['modelOverrides', id], { input: ['text'] }));
    };
    const reset = () => {
        setFailure(undefined);
        setConflicted(false);
        setSaved(false);
        setDraft(cloneRecord(committedOriginal));
    };
    const apply = async () => {
        setBusy(true);
        setFailure(undefined);
        setConflicted(false);
        setSaved(false);
        const normalized = normalizePiAiDraft(draft);
        const validation = validatePiAiDraft(normalized);
        if (validation !== undefined) {
            setFailure(t(`modelCapabilities.${validation}`));
            setBusy(false);
            return;
        }
        const result = await applyDraft({
            api,
            ns: namespace.ns,
            path,
            before: committedOriginal,
            after: normalized,
            expectedRevision,
            conflictText: t('modelCapabilities.conflict'),
        });
        if (!result.ok) {
            setFailure(t('modelCapabilities.saveError').replace('{message}', result.failure));
            setConflicted(result.conflicted);
            setBusy(false);
            return;
        }
        setCommittedOriginal(result.committed);
        setExpectedRevision(result.revision);
        setDraft(cloneRecord(result.committed));
        setSaved(true);
        setBusy(false);
        onApplied(namespace.ns, result.revision);
    };
    const listMode = hasPath(draft, ['models']);
    const models = Array.isArray(draft['models']) ? draft['models'] : [];
    const overrides = recordOf(draft['modelOverrides']);
    const overrideIds = new Set(Object.keys(overrides));
    const options = modelOptionsOf(namespace, path, catalog);
    const candidates = options.filter(option => !overrideIds.has(option.id));
    return (_jsxs("details", { className: css.card, open: configured || entry.active, children: [_jsxs("summary", { className: css.summary, children: [_jsx("span", { className: css.cardTitle, children: entry.displayName }), _jsx("span", { className: css.cardRoute, children: entry.provider })] }), _jsxs("div", { className: css.cardBody, children: [_jsxs("section", { className: css.section, "aria-label": t('modelCapabilities.routeSection'), children: [_jsx("h3", { className: css.sectionTitle, children: t('modelCapabilities.routeSection') }), _jsxs("div", { className: css.field, children: [_jsxs("div", { className: css.fieldHead, children: [_jsx("span", { className: css.fieldLabel, children: t('modelCapabilities.defaultInput') }), _jsx("span", { className: css.fieldHint, children: t('modelCapabilities.defaultInputHint') })] }), _jsx(InputEditor, { value: draft['defaultInput'], onChange: (value) => { setField('defaultInput', value); }, disabled: disabled, required: true, t: t })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('modelCapabilities.routeReasoning') }), _jsxs("select", { className: css.select, value: stringAt('reasoning') ?? '', disabled: disabled, onChange: (event) => { setField('reasoning', event.target.value === '' ? undefined : event.target.value); }, children: [_jsx("option", { value: "", children: t('modelCapabilities.routeReasoningInherit') }), THINKING_LEVELS.map(level => (_jsx("option", { value: level, children: t(LEVEL_KEYS[level]) }, level)))] }), _jsx("p", { className: css.fieldHint, children: t('modelCapabilities.routeReasoningHint') })] })] }), _jsxs("section", { className: css.section, "aria-label": t('modelCapabilities.modelSection'), children: [_jsxs("div", { className: css.modelHead, children: [_jsx("h3", { className: css.sectionTitle, children: t('modelCapabilities.modelSection') }), _jsx("span", { className: css.fieldHint, children: listMode
                                            ? t('modelCapabilities.modelsListModeHint')
                                            : t('modelCapabilities.overridesModeHint') })] }), listMode
                                ? (_jsx("div", { className: css.modelList, children: models.map((model, index) => {
                                        const entry = recordOf(model);
                                        const id = typeof entry['id'] === 'string' ? entry['id'] : '';
                                        return (_jsxs("div", { className: css.modelRow, children: [_jsxs("div", { className: css.modelHead, children: [_jsx("span", { className: css.modelId, children: id }), typeof entry['name'] === 'string' && entry['name'].length > 0
                                                            ? _jsx("span", { className: css.modelName, children: entry['name'] })
                                                            : null] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('modelCapabilities.modelInput') }), _jsx(InputEditor, { value: entry['input'], onChange: (value) => { patchListEntry(index, 'input', value); }, disabled: disabled, t: t })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('modelCapabilities.reasoning') }), _jsx(ReasoningEditor, { value: entry['reasoningEfforts'], onChange: (value) => { patchListEntry(index, 'reasoningEfforts', value); }, disabled: disabled, t: t }), reasoningModeOf(entry['reasoningEfforts']) === 'inherit'
                                                            ? _jsx(InheritedReasoningHint, { model: catalogById.get(id), t: t })
                                                            : null] })] }, index));
                                    }) }))
                                : (_jsxs(_Fragment, { children: [_jsxs("div", { className: css.addOverrideRow, children: [_jsxs("select", { className: css.select, value: addingId, disabled: disabled || candidates.length === 0, onChange: (event) => { setAddingId(event.target.value); }, children: [_jsx("option", { value: "", children: t('modelCapabilities.addOverridePlaceholder') }), candidates.map(option => (_jsx("option", { value: option.id, children: option.name === undefined ? option.id : `${option.name} (${option.id})` }, option.id)))] }), _jsx("button", { type: "button", className: css.button, disabled: disabled || addingId.length === 0, onClick: addOverride, children: t('modelCapabilities.addOverride') })] }), Object.keys(overrides).length === 0
                                            ? _jsx("p", { className: css.notice, children: t('modelCapabilities.emptyOverrides') })
                                            : (_jsx("div", { className: css.modelList, children: Object.entries(overrides).map(([id, override]) => {
                                                    const entry = recordOf(override);
                                                    return (_jsxs("div", { className: css.modelRow, children: [_jsxs("div", { className: css.modelHead, children: [_jsx("span", { className: css.modelId, children: id }), _jsx("button", { type: "button", className: css.linkButton, disabled: disabled, "aria-label": t('modelCapabilities.removeOverride'), onClick: () => { removeOverride(id); }, children: t('modelCapabilities.removeOverride') })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('modelCapabilities.modelInput') }), _jsx(InputEditor, { value: entry['input'], onChange: (value) => { patchOverride(id, 'input', value); }, disabled: disabled, t: t })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('modelCapabilities.reasoning') }), _jsx(ReasoningEditor, { value: entry['reasoningEfforts'], onChange: (value) => { patchOverride(id, 'reasoningEfforts', value); }, disabled: disabled, t: t }), reasoningModeOf(entry['reasoningEfforts']) === 'inherit'
                                                                        ? _jsx(InheritedReasoningHint, { model: catalogById.get(id), t: t })
                                                                        : null] })] }, id));
                                                }) }))] }))] }), _jsx(CardActions, { busy: busy, disabled: disabled, saved: saved, failure: failure, conflicted: conflicted, t: t, onReload: onReloadRequested, onReset: reset, onApply: () => { void apply(); } })] })] }));
}
