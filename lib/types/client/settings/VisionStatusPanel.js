import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The Vision tab: live configuration form + status.
 *
 * Configuration is a settings namespace (`dsh-web-enhanced-vision`) owned by
 * this plugin; saves go through the plugin gateway (`visionConfigGet` /
 * `visionConfigSet`) and the host-side interceptor watches the commit, so
 * changes apply immediately without a restart. The DSH provider/model selects
 * read the same directory the model picker renders, filtered to models that
 * declare image input. The dedicated API section is only used for image
 * transcription — it never registers into DSH's model channels.
 * @module dsh-web-enhanced/src/client/settings/VisionStatusPanel
 */
import { useCallback, useEffect, useState } from 'react';
import css from './VisionStatusPanel.module.css';
function draftOf(value) {
    return {
        enabled: value.enabled,
        patchAdmission: value.patchAdmission,
        provider: value.provider,
        model: value.model,
        prompt: value.prompt,
        marker: value.marker,
        baseUrl: value.baseUrl,
        apiKeyInput: '',
        endpointModel: value.endpointModel,
        anonymous: value.anonymous,
        timeoutMs: String(value.timeoutMs),
        maxTokens: String(value.maxTokens),
        autoLocalOllama: value.autoLocalOllama,
        localOllamaModel: value.localOllamaModel,
        localOllamaUrl: value.localOllamaUrl,
        revision: value.revision,
    };
}
/** One key/value row in the status card. */
function Row({ label, children }) {
    return (_jsxs("div", { className: css.row, children: [_jsx("div", { className: css.label, children: label }), _jsx("div", { className: css.value, children: children })] }));
}
/** One labelled form field. */
function Field({ label, hint, children }) {
    return (_jsxs("div", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: label }), children, hint !== undefined && _jsx("span", { className: css.fieldHint, children: hint })] }));
}
/** Locale key of one apiKeySource value. */
function keySourceKey(source) {
    switch (source) {
        case 'config': return 'vision.key.config';
        case 'env': return 'vision.key.env';
        case 'none-needed': return 'vision.key.none-needed';
        default: return 'vision.key.unset';
    }
}
/** The Vision tab: configuration form above, live status below. */
export function VisionStatusPanel({ remote, t }) {
    const [loading, setLoading] = useState(true);
    const [configError, setConfigError] = useState(null);
    const [view, setView] = useState(null);
    const [status, setStatus] = useState(null);
    const [draft, setDraft] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const load = useCallback(async () => {
        setLoading(true);
        setConfigError(null);
        const [configResult, statusResult] = await Promise.all([
            remote.visionConfigGet(),
            remote.visionStatus(),
        ]);
        if ('error' in statusResult)
            setStatus(null);
        else
            setStatus(statusResult);
        if ('error' in configResult) {
            setConfigError(configResult.error.message);
            setView(null);
            setDraft(null);
        }
        else {
            setView(configResult);
            setDraft(draftOf(configResult));
        }
        setLoading(false);
    }, [remote]);
    useEffect(() => {
        void load();
    }, [load]);
    /** Providers that offer at least one image-capable model (picker source). */
    const visionProviders = (view?.providers ?? [])
        .filter(provider => provider.models.some(model => model.supportsImage));
    const save = useCallback(async (patch) => {
        if (draft === null)
            return;
        setSaving(true);
        setSaved(false);
        setSaveError(null);
        const request = {
            patch,
            ...(draft.revision === null ? {} : { expectedRevision: draft.revision }),
        };
        const result = await remote.visionConfigSet(request);
        if ('error' in result) {
            if (result.error.code === 'vision-config-conflict') {
                await load();
                setSaveError(t('vision.form.conflict'));
            }
            else {
                setSaveError(result.error.message);
            }
        }
        else {
            setDraft(current => current === null ? current : { ...current, revision: result.revision, apiKeyInput: '' });
            await load();
            setSaved(true);
        }
        setSaving(false);
    }, [draft, load, remote, t]);
    const submit = () => {
        if (draft === null)
            return;
        const timeoutMs = Number(draft.timeoutMs);
        const maxTokens = Number(draft.maxTokens);
        if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || !Number.isFinite(maxTokens) || maxTokens <= 0) {
            setSaveError(t('vision.form.invalidNumber'));
            return;
        }
        const patch = {
            enabled: draft.enabled,
            patchAdmission: draft.patchAdmission,
            provider: draft.provider,
            model: draft.provider === '' ? '' : draft.model,
            prompt: draft.prompt,
            marker: draft.marker,
            baseUrl: draft.baseUrl.trim(),
            endpointModel: draft.endpointModel.trim(),
            anonymous: draft.anonymous,
            timeoutMs,
            maxTokens,
            autoLocalOllama: draft.autoLocalOllama,
            localOllamaModel: draft.localOllamaModel.trim(),
            localOllamaUrl: draft.localOllamaUrl.trim(),
        };
        if (draft.apiKeyInput.trim() !== '')
            patch.apiKey = draft.apiKeyInput.trim();
        void save(patch);
    };
    if (loading && status === null && draft === null)
        return _jsx("p", { className: css.note, children: t('vision.loading') });
    return (_jsxs("div", { className: css.root, children: [configError !== null && _jsx("p", { className: css.warn, children: t('vision.form.unavailable', { message: configError }) }), draft !== null && (_jsxs("div", { className: css.form, children: [_jsxs("section", { className: css.section, children: [_jsx("h3", { className: css.sectionTitle, children: t('vision.form.switchesTitle') }), _jsxs("div", { className: css.checks, children: [_jsx(Field, { label: t('vision.form.enabled'), hint: t('vision.form.enabledHint'), children: _jsx("input", { type: "checkbox", checked: draft.enabled, onChange: event => { setDraft({ ...draft, enabled: event.target.checked }); } }) }), _jsx(Field, { label: t('vision.form.patchAdmission'), hint: t('vision.form.patchAdmissionHint'), children: _jsx("input", { type: "checkbox", checked: draft.patchAdmission, onChange: event => { setDraft({ ...draft, patchAdmission: event.target.checked }); } }) })] })] }), _jsxs("section", { className: css.section, children: [_jsx("h3", { className: css.sectionTitle, children: t('vision.form.harnessTitle') }), _jsx("p", { className: css.sectionHint, children: t('vision.form.harnessHint') }), _jsx(Field, { label: t('vision.form.provider'), children: _jsxs("select", { className: css.input, value: draft.provider, onChange: event => {
                                        const provider = event.target.value;
                                        setDraft(current => current === null ? current : { ...current, provider, model: '' });
                                    }, children: [_jsx("option", { value: "", children: t('vision.form.providerAuto') }), visionProviders.map(provider => (_jsx("option", { value: provider.provider, children: provider.name }, provider.provider))), draft.provider !== '' && !visionProviders.some(provider => provider.provider === draft.provider) && (_jsx("option", { value: draft.provider, children: view?.providers.find(provider => provider.provider === draft.provider)?.name ?? draft.provider }))] }) }), visionProviders.length === 0 && _jsx("p", { className: css.sectionHint, children: t('vision.form.noImageModels') }), draft.provider !== '' && (_jsx(Field, { label: t('vision.form.model'), hint: t('vision.form.modelHint'), children: _jsxs("select", { className: css.input, value: draft.model, onChange: event => { setDraft({ ...draft, model: event.target.value }); }, children: [visionProviders
                                            .find(provider => provider.provider === draft.provider)
                                            ?.models.filter(model => model.supportsImage)
                                            .map(model => _jsx("option", { value: model.id, children: model.name }, model.id)), draft.model !== '' && !visionProviders.some(provider => provider.provider === draft.provider
                                            && provider.models.some(model => model.id === draft.model && model.supportsImage)) && (_jsx("option", { value: draft.model, children: draft.model }))] }) }))] }), _jsxs("section", { className: css.section, children: [_jsx("h3", { className: css.sectionTitle, children: t('vision.form.endpointTitle') }), _jsx("p", { className: css.sectionHint, children: t('vision.form.endpointHint') }), _jsxs("div", { className: css.grid, children: [_jsx(Field, { label: t('vision.form.baseUrl'), children: _jsx("input", { className: css.input, value: draft.baseUrl, placeholder: "https://dashscope.aliyuncs.com/compatible-mode/v1", onChange: event => { setDraft({ ...draft, baseUrl: event.target.value }); } }) }), _jsx(Field, { label: t('vision.form.endpointModel'), children: _jsx("input", { className: css.input, value: draft.endpointModel, placeholder: "qwen3.7-flash", onChange: event => { setDraft({ ...draft, endpointModel: event.target.value }); } }) }), _jsx(Field, { label: t('vision.form.apiKey'), hint: t('vision.form.apiKeyHint'), children: _jsxs("div", { className: css.keyRow, children: [_jsx("input", { className: css.input, type: "password", value: draft.apiKeyInput, placeholder: t('vision.form.apiKeyPlaceholder'), onChange: event => { setDraft({ ...draft, apiKeyInput: event.target.value }); } }), _jsx("button", { type: "button", className: css.minorButton, onClick: () => {
                                                        setSaveError(null);
                                                        setDraft(current => current === null ? current : { ...current, apiKeyInput: '' });
                                                        void save({ apiKey: '' });
                                                    }, children: t('vision.form.apiKeyClear') })] }) }), _jsx(Field, { label: t('vision.form.anonymous'), children: _jsx("input", { type: "checkbox", checked: draft.anonymous, onChange: event => { setDraft({ ...draft, anonymous: event.target.checked }); } }) }), _jsx(Field, { label: t('vision.form.timeout'), children: _jsx("input", { className: css.input, inputMode: "numeric", value: draft.timeoutMs, onChange: event => { setDraft({ ...draft, timeoutMs: event.target.value }); } }) }), _jsx(Field, { label: t('vision.form.maxTokens'), children: _jsx("input", { className: css.input, inputMode: "numeric", value: draft.maxTokens, onChange: event => { setDraft({ ...draft, maxTokens: event.target.value }); } }) })] })] }), _jsxs("section", { className: css.section, children: [_jsx("h3", { className: css.sectionTitle, children: t('vision.form.ollamaTitle') }), _jsxs("div", { className: css.grid, children: [_jsx(Field, { label: t('vision.form.autoLocalOllama'), children: _jsx("input", { type: "checkbox", checked: draft.autoLocalOllama, onChange: event => { setDraft({ ...draft, autoLocalOllama: event.target.checked }); } }) }), _jsx(Field, { label: t('vision.form.localOllamaUrl'), children: _jsx("input", { className: css.input, value: draft.localOllamaUrl, onChange: event => { setDraft({ ...draft, localOllamaUrl: event.target.value }); } }) }), _jsx(Field, { label: t('vision.form.localOllamaModel'), hint: t('vision.form.localOllamaModelHint'), children: _jsx("input", { className: css.input, value: draft.localOllamaModel, onChange: event => { setDraft({ ...draft, localOllamaModel: event.target.value }); } }) })] })] }), _jsxs("section", { className: css.section, children: [_jsx("h3", { className: css.sectionTitle, children: t('vision.form.promptTitle') }), _jsx(Field, { label: t('vision.form.prompt'), children: _jsx("textarea", { className: css.textarea, value: draft.prompt, onChange: event => { setDraft({ ...draft, prompt: event.target.value }); } }) }), _jsx(Field, { label: t('vision.form.marker'), children: _jsx("input", { className: css.input, value: draft.marker, onChange: event => { setDraft({ ...draft, marker: event.target.value }); } }) })] }), _jsxs("div", { className: css.actions, children: [_jsx("button", { type: "button", className: css.save, disabled: saving, onClick: submit, children: saving ? t('vision.form.saving') : t('vision.form.save') }), saved && _jsx("span", { className: css.saved, children: t('vision.form.saved') }), saveError !== null && _jsx("span", { className: css.failure, children: t('vision.form.saveError', { message: saveError }) })] })] })), _jsx("h3", { className: css.sectionTitle, children: t('vision.statusTitle') }), status === null
                ? _jsx("p", { className: css.note, children: t('vision.loading') })
                : _jsxs("div", { className: css.card, children: [!status.mounted && _jsx("p", { className: css.warn, children: t('vision.notMounted') }), _jsx(Row, { label: t('vision.enabled'), children: _jsx("span", { className: status.enabled ? css.badgeOk : css.badgeMuted, children: status.enabled ? t('vision.on') : t('vision.off') }) }), _jsx(Row, { label: t('vision.admission'), children: _jsx("span", { className: status.admissionActive ? css.badgeOk : css.badgeMuted, children: status.admissionActive ? t('vision.patched') : t('vision.notPatched') }) }), _jsx(Row, { label: t('vision.harnessTitle'), children: status.harnessModels.length === 0
                                ? _jsx("span", { className: css.muted, children: t('vision.harnessNone') })
                                : _jsx("span", { className: css.list, children: status.harnessModels.map(model => (_jsxs("code", { className: css.code, children: [model.provider, "/", model.model] }, `${model.provider}/${model.model}`))) }) }), _jsx(Row, { label: t('vision.endpointTitle'), children: status.endpointConfigured
                                ? _jsx("code", { className: css.code, children: status.endpointModel })
                                : _jsx("span", { className: css.muted, children: t('vision.endpointNone') }) }), _jsx(Row, { label: t('vision.keySource'), children: _jsx("span", { className: css.muted, children: t(keySourceKey(status.apiKeySource)) }) }), _jsx(Row, { label: t('vision.ollama'), children: status.ollamaDetected
                                ? _jsx("span", { className: css.badgeOk, children: t('vision.ollamaModel', { model: status.ollamaModel ?? '' }) })
                                : _jsx("span", { className: css.muted, children: t('vision.ollamaNone') }) }), _jsx(Row, { label: t('vision.cache'), children: _jsx("span", { className: css.muted, children: t('vision.cacheEntries', { count: String(status.cacheSize) }) }) }), _jsx(Row, { label: t('vision.lastError'), children: status.lastError === null
                                ? _jsx("span", { className: css.muted, children: t('vision.lastErrorNone') })
                                : _jsx("span", { className: css.failure, children: status.lastError }) })] }), _jsx("p", { className: css.hint, children: t('vision.hint') })] }));
}
