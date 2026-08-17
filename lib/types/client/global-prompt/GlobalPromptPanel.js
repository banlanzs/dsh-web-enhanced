import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Global Prompt tab of the plugin's Settings page.
 *
 * The namespace is owned and schema-registered by the host half
 * (`src/global-prompt.ts`). Reads and writes go through this plugin's own
 * Typert gateway (`globalPromptGet` / `globalPromptSet`), not the host
 * `settings.describe` RPCs: a plugin-owned namespace is not on the
 * api-proxy settings allowlist, so the generic browser settings RPCs would
 * never list it. The host section's text provider re-reads the resolved
 * value on every prompt assembly, so a successful save reaches the next
 * model request without a restart.
 * @module dsh-web-enhanced/src/client/global-prompt/GlobalPromptPanel
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { GLOBAL_PROMPT_MAX_CHARS } from "../../types.js";
import { validateGlobalPromptDraft } from "./draft.js";
import css from './GlobalPromptPanel.module.css';
/** The Global Prompt tab: one switch, one text block, CAS save. */
export function GlobalPromptPanel({ remote, t }) {
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
    /** Read the gateway's view of the namespace and anchor the draft on it. */
    const load = useCallback(async () => {
        const current = ++generation.current;
        setPhase('loading');
        setLoadError('');
        setSaved(false);
        try {
            const result = await remote.globalPromptGet();
            if ('error' in result)
                throw new Error(result.error.message);
            const next = { enabled: result.enabled, text: result.text };
            if (current !== generation.current)
                return;
            setWritable(result.writable);
            setRevision(result.revision);
            setBase(next);
            setDraft(next);
            setPhase('ready');
        }
        catch (error) {
            if (current !== generation.current)
                return;
            setLoadError(error instanceof Error ? error.message : String(error));
            setPhase('error');
        }
    }, [remote]);
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
        const result = await remote.globalPromptSet({
            enabled: draft.enabled,
            text: draft.text,
            expectedRevision: revision,
        });
        if ('error' in result) {
            setSaveError(result.error.code === 'global-prompt-config-conflict'
                ? t('globalPrompt.conflict')
                : result.error.message);
        }
        else {
            setBase(draft);
            setDraft(draft);
            setRevision(result.revision);
            setSaved(true);
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
