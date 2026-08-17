import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Global Prompt tab of the plugin's Settings page.
 *
 * The namespace is owned and schema-registered by the host half
 * (`src/global-prompt.ts`); this tab only reads the redacted user layer and
 * writes the two top-level keys through the standard `settings.mutate` CAS
 * RPC. The host section's text provider re-reads the resolved value on every
 * prompt assembly, so a successful save reaches the next model request
 * without a restart.
 * @module dsh-web-enhanced/src/client/global-prompt/GlobalPromptPanel
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { GLOBAL_PROMPT_MAX_CHARS, GLOBAL_PROMPT_SETTINGS_NS } from "../../types.js";
import { applyDraft, messageOf, recordOf, } from "../model-capabilities/settings-draft.js";
import { globalPromptDraftOf, globalPromptRecordOf, validateGlobalPromptDraft, } from "./draft.js";
import css from './GlobalPromptPanel.module.css';
/** The Global Prompt tab: one switch, one text block, CAS save. */
export function GlobalPromptPanel({ api, t }) {
    const [phase, setPhase] = useState('loading');
    const [loadError, setLoadError] = useState('');
    const [writable, setWritable] = useState(false);
    const [revision, setRevision] = useState(null);
    const [base, setBase] = useState({ enabled: false, text: '' });
    const [draft, setDraft] = useState({ enabled: false, text: '' });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState('');
    const generation = useRef(0);
    /** Read the namespace view and anchor the draft on its current user layer. */
    const load = useCallback(async () => {
        const current = ++generation.current;
        setPhase('loading');
        setLoadError('');
        setSaved(false);
        try {
            const response = await api.settings.describe({});
            if (!response.result.ok)
                throw new Error(response.result.error.message);
            const view = response.result.value.namespaces.find(entry => entry.ns === GLOBAL_PROMPT_SETTINGS_NS);
            if (view === undefined)
                throw new Error(t('globalPrompt.namespaceMissing'));
            const next = globalPromptDraftOf(recordOf(view.user));
            if (current !== generation.current)
                return;
            setWritable(response.result.value.writable);
            setRevision(view.revision);
            setBase(next);
            setDraft(next);
            setPhase('ready');
        }
        catch (error) {
            if (current !== generation.current)
                return;
            setLoadError(messageOf(error));
            setPhase('error');
        }
    }, [api, t]);
    useEffect(() => {
        void load();
    }, [load]);
    const dirty = JSON.stringify(base) !== JSON.stringify(draft);
    const tooLong = draft.text.length > GLOBAL_PROMPT_MAX_CHARS;
    const saveDisabled = saving || !dirty || tooLong || revision === null || !writable;
    const save = async () => {
        if (revision === null)
            return;
        setSaving(true);
        setSaved(false);
        setSaveError('');
        const failure = validateGlobalPromptDraft(draft, GLOBAL_PROMPT_MAX_CHARS);
        if (failure !== undefined) {
            setSaveError(t('globalPrompt.tooLong', { max: String(GLOBAL_PROMPT_MAX_CHARS) }));
            setSaving(false);
            return;
        }
        const result = await applyDraft({
            api,
            ns: GLOBAL_PROMPT_SETTINGS_NS,
            path: [],
            before: globalPromptRecordOf(base),
            after: globalPromptRecordOf(draft),
            expectedRevision: revision,
            conflictText: t('globalPrompt.conflict'),
        });
        if (result.ok) {
            const committed = globalPromptDraftOf(recordOf(result.committed));
            setBase(committed);
            setDraft(committed);
            setRevision(result.revision);
            setSaved(true);
        }
        else {
            setSaveError(result.failure);
        }
        setSaving(false);
    };
    if (phase === 'error') {
        return (_jsxs("div", { className: css.root, children: [_jsx("p", { className: css.failure, children: t('globalPrompt.loadFailed', { message: loadError }) }), _jsx("button", { type: "button", className: css.minorButton, onClick: () => { void load(); }, children: t('globalPrompt.reload') })] }));
    }
    return (_jsx("div", { className: css.root, children: _jsxs("section", { className: css.section, children: [_jsx("h3", { className: css.sectionTitle, children: t('globalPrompt.title') }), _jsx("p", { className: css.hint, children: t('globalPrompt.hint') }), _jsxs("label", { className: css.switchRow, children: [_jsx("input", { type: "checkbox", checked: draft.enabled, disabled: phase !== 'ready' || !writable, onChange: (event) => {
                                setDraft(previous => ({ ...previous, enabled: event.target.checked }));
                                setSaved(false);
                            } }), _jsx("span", { children: t('globalPrompt.enabled') })] }), _jsxs("div", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('globalPrompt.text') }), _jsx("textarea", { className: css.textarea, value: draft.text, disabled: phase !== 'ready' || !writable, placeholder: t('globalPrompt.placeholder'), onChange: (event) => {
                                setDraft(previous => ({ ...previous, text: event.target.value }));
                                setSaved(false);
                            } }), _jsx("span", { className: css.fieldHint, children: t('globalPrompt.count', {
                                used: String(draft.text.length),
                                max: String(GLOBAL_PROMPT_MAX_CHARS),
                            }) })] }), _jsxs("div", { className: css.actions, children: [_jsx("button", { type: "button", className: css.save, disabled: saveDisabled || phase !== 'ready', onClick: () => { void save(); }, children: saving ? t('globalPrompt.saving') : t('globalPrompt.save') }), _jsx("button", { type: "button", className: css.minorButton, disabled: saving || phase !== 'ready', onClick: () => { void load(); }, children: t('globalPrompt.reload') }), saved && _jsx("span", { className: css.saved, children: t('globalPrompt.saved') })] }), tooLong && _jsx("p", { className: css.failure, children: t('globalPrompt.tooLong', { max: String(GLOBAL_PROMPT_MAX_CHARS) }) }), saveError !== '' && _jsx("p", { className: css.failure, children: t('globalPrompt.saveError', { message: saveError }) })] }) }));
}
