import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Model-request retry settings: edits the DeepSeek provider's bounded retry
 * count through the host settings service. The value lives in the
 * `llm-deepseek` namespace (owned by the provider plugin), so saving here is
 * a settings write, not a web-enhanced config — and the provider re-registers
 * its route immediately, applying the new policy to the next request.
 * @module dsh-web-enhanced/src/client/settings/ModelRetryPanel
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import css from './ModelRetryPanel.module.css';
/** The DeepSeek retry settings panel. */
export function ModelRetryPanel({ remote, t }) {
    const [state, setState] = useState({ phase: 'loading' });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const live = useRef(true);
    useEffect(() => () => { live.current = false; }, []);
    useEffect(() => {
        setState({ phase: 'loading' });
        void (async () => {
            const result = await remote.modelRetryGet();
            if (!live.current)
                return;
            setState('error' in result
                ? { phase: 'error', message: result.error.message }
                : {
                    phase: 'ready',
                    config: result.config,
                    draft: result.config.maxRetries === null ? '' : String(result.config.maxRetries),
                });
        })();
    }, [remote]);
    const save = useCallback(async () => {
        if (state.phase !== 'ready')
            return;
        const maxRetries = Number(state.draft);
        if (!Number.isSafeInteger(maxRetries) || maxRetries < 0)
            return;
        setSaving(true);
        setSaved(false);
        setSaveError(null);
        const result = await remote.modelRetrySet({
            maxRetries,
            ...(state.config.revision === null ? {} : { expectedRevision: state.config.revision }),
        });
        if (!live.current)
            return;
        setSaving(false);
        if ('error' in result) {
            setSaveError(result.error.message);
            return;
        }
        setState({
            phase: 'ready',
            config: { ...state.config, mode: 'normal', maxRetries, revision: result.revision },
            draft: String(maxRetries),
        });
        setSaved(true);
    }, [remote, state]);
    if (state.phase === 'loading')
        return _jsx("p", { className: css.note, children: t('modelRetry.loading') });
    if (state.phase === 'error')
        return _jsx("p", { className: css.error, children: t('modelRetry.error', { message: state.message }) });
    const valid = state.draft !== '' && Number.isSafeInteger(Number(state.draft)) && Number(state.draft) >= 0;
    const unchanged = state.config.maxRetries !== null && state.draft === String(state.config.maxRetries);
    return (_jsxs("section", { className: css.panel, "data-testid": "model-retry-panel", children: [_jsx("h3", { className: css.title, children: t('modelRetry.title') }), _jsxs("dl", { className: css.facts, children: [_jsx("dt", { children: t('modelRetry.provider') }), _jsx("dd", { children: t('modelRetry.providerName') }), _jsx("dt", { children: t('modelRetry.current') }), _jsx("dd", { children: state.config.maxRetries === null ? t('modelRetry.unlimited') : String(state.config.maxRetries) })] }), _jsx("p", { className: css.hint, children: t('modelRetry.hint') }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.label, children: t('modelRetry.maxLabel') }), _jsx("input", { className: css.input, type: "number", min: 0, step: 1, value: state.draft, placeholder: t('modelRetry.placeholder'), "data-testid": "model-retry-input", onChange: event => {
                            setSaved(false);
                            setSaveError(null);
                            setState({ ...state, draft: event.target.value });
                        } })] }), !valid && state.draft !== '' && _jsx("p", { className: css.error, children: t('modelRetry.invalid') }), _jsx("button", { type: "button", className: css.save, disabled: saving || !valid || unchanged, "data-testid": "model-retry-save", onClick: () => { void save(); }, children: t('modelRetry.save') }), saved && _jsx("p", { className: css.saved, children: t('modelRetry.saved') }), saveError !== null && _jsx("p", { className: css.error, children: t('modelRetry.saveError', { message: saveError }) }), _jsx("h4", { className: css.subtitle, children: t('modelRetry.backoffTitle') }), _jsxs("dl", { className: css.facts, children: [_jsx("dt", { children: t('modelRetry.initialDelay') }), _jsxs("dd", { children: [state.config.initialDelayMs, "ms"] }), _jsx("dt", { children: t('modelRetry.maxDelay') }), _jsxs("dd", { children: [state.config.maxDelayMs, "ms"] }), _jsx("dt", { children: t('modelRetry.jitter') }), _jsx("dd", { children: state.config.jitterRatio })] })] }));
}
