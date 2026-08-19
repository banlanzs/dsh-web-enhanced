import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Model-request retry settings: edits every enabled provider route's
 * bounded retry count through the host settings service. The value lives in
 * the owning adapter's settings namespace — `llm-deepseek` at its section
 * root, each pi-ai route at `providers.<route>.retryPolicy` — so saving here
 * is a settings write, not a web-enhanced config, and the provider
 * re-registers its route immediately, applying the new policy to the next
 * request.
 * @module dsh-web-enhanced/src/client/settings/ModelRetryPanel
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import css from './ModelRetryPanel.module.css';
/** Per-provider retry settings, one editable row per enabled route. */
export function ModelRetryPanel({ remote, t }) {
    const [state, setState] = useState({ phase: 'loading' });
    const [saving, setSaving] = useState(null);
    const [saved, setSaved] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const live = useRef(true);
    useEffect(() => () => { live.current = false; }, []);
    const load = useCallback(async () => {
        setState({ phase: 'loading' });
        const result = await remote.modelRetryGet();
        if (!live.current)
            return;
        if ('error' in result) {
            setState({ phase: 'error', message: result.error.message });
            return;
        }
        const drafts = {};
        for (const config of result.configs) {
            drafts[config.provider] = config.maxRetries === null ? '' : String(config.maxRetries);
        }
        setState({ phase: 'ready', configs: result.configs, drafts });
    }, [remote]);
    useEffect(() => { void load(); }, [load]);
    const setDraft = (provider, text) => {
        if (state.phase !== 'ready')
            return;
        setSaved(null);
        setSaveError(null);
        setState({ ...state, drafts: { ...state.drafts, [provider]: text } });
    };
    const save = useCallback(async (config) => {
        if (state.phase !== 'ready')
            return;
        const draft = state.drafts[config.provider] ?? '';
        const maxRetries = Number(draft);
        if (!Number.isSafeInteger(maxRetries) || maxRetries < 0)
            return;
        setSaving(config.provider);
        setSaved(null);
        setSaveError(null);
        const result = await remote.modelRetrySet({
            provider: config.provider,
            maxRetries,
            ...(config.revision === null ? {} : { expectedRevision: config.revision }),
        });
        if (!live.current)
            return;
        setSaving(null);
        if ('error' in result) {
            setSaveError(result.error.message);
            return;
        }
        setSaved(config.provider);
        // Reload: the namespace revision advanced and every sibling route shares it.
        void load();
    }, [load, remote, state]);
    if (state.phase === 'loading')
        return _jsx("p", { className: css.note, children: t('modelRetry.loading') });
    if (state.phase === 'error')
        return _jsx("p", { className: css.error, children: t('modelRetry.error', { message: state.message }) });
    if (state.configs.length === 0)
        return _jsx("p", { className: css.note, children: t('modelRetry.empty') });
    return (_jsxs("section", { className: css.panel, "data-testid": "model-retry-panel", children: [_jsx("h3", { className: css.title, children: t('modelRetry.title') }), _jsx("p", { className: css.hint, children: t('modelRetry.hint') }), _jsx("div", { className: css.providers, children: state.configs.map(config => {
                    const draft = state.drafts[config.provider] ?? '';
                    const valid = draft !== '' && Number.isSafeInteger(Number(draft)) && Number(draft) >= 0;
                    const unchanged = config.maxRetries !== null && draft === String(config.maxRetries);
                    const busy = saving === config.provider;
                    const label = config.displayName ?? (config.provider === 'deepseek-official' ? t('modelRetry.providerName') : config.provider);
                    return (_jsxs("div", { className: css.providerCard, children: [_jsxs("div", { className: css.providerHead, children: [_jsx("span", { className: css.providerName, title: config.provider, children: label }), !config.managed && _jsx("span", { className: css.unmanaged, children: t('modelRetry.unmanaged') }), _jsx("span", { className: css.providerCurrent, children: config.mode === 'always' ? t('modelRetry.unlimited') : String(config.maxRetries) })] }), _jsxs("div", { className: css.providerRow, children: [_jsxs("label", { className: css.field, children: [_jsx("span", { className: css.label, children: t('modelRetry.maxLabel') }), _jsx("input", { className: css.input, type: "number", min: 0, step: 1, value: draft, placeholder: t('modelRetry.placeholder'), "data-testid": `model-retry-input-${config.provider}`, onChange: event => { setDraft(config.provider, event.target.value); } })] }), _jsx("button", { type: "button", className: css.save, disabled: busy || !config.writable || !valid || unchanged, "data-testid": `model-retry-save-${config.provider}`, onClick: () => { void save(config); }, children: t('modelRetry.save') })] }), !valid && draft !== '' && _jsx("p", { className: css.error, children: t('modelRetry.invalid') }), saved === config.provider && _jsx("p", { className: css.saved, children: t('modelRetry.saved') }), _jsxs("details", { className: css.backoff, children: [_jsx("summary", { className: css.backoffSummary, children: t('modelRetry.backoffTitle') }), _jsxs("dl", { className: css.facts, children: [_jsx("dt", { children: t('modelRetry.initialDelay') }), _jsxs("dd", { children: [config.initialDelayMs, "ms"] }), _jsx("dt", { children: t('modelRetry.maxDelay') }), _jsxs("dd", { children: [config.maxDelayMs, "ms"] }), _jsx("dt", { children: t('modelRetry.jitter') }), _jsx("dd", { children: config.jitterRatio })] })] })] }, config.provider));
                }) }), saveError !== null && _jsx("p", { className: css.error, children: t('modelRetry.saveError', { message: saveError }) })] }));
}
