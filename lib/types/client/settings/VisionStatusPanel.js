import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Read-only status page of the image-understanding integration.
 *
 * The configuration itself is static plugin config (`cordis.patch.yml`, keys
 * prefixed `vision*`) because this plugin's other host settings are static
 * too; what this tab adds is evidence — whether the admission patch is live,
 * which transcription sources are usable right now, and the last failure.
 * @module dsh-web-enhanced/src/client/settings/VisionStatusPanel
 */
import { useCallback, useEffect, useState } from 'react';
import css from './VisionStatusPanel.module.css';
/** One key/value row. */
function Row({ label, children }) {
    return (_jsxs("div", { className: css.row, children: [_jsx("div", { className: css.label, children: label }), _jsx("div", { className: css.value, children: children })] }));
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
/** The image-understanding status pane. */
export function VisionStatusPanel({ remote, t }) {
    const [state, setState] = useState({ phase: 'loading' });
    const load = useCallback(async () => {
        setState({ phase: 'loading' });
        const result = await remote.visionStatus();
        if ('error' in result)
            setState({ phase: 'error', message: result.error.message });
        else
            setState({ phase: 'ready', value: result });
    }, [remote]);
    useEffect(() => {
        void load();
    }, [load]);
    const value = state.phase === 'ready' ? state.value : null;
    return (_jsxs("div", { className: css.root, children: [_jsx("div", { className: css.toolbar, children: _jsx("button", { type: "button", className: css.refresh, onClick: () => { void load(); }, children: t('vision.refresh') }) }), state.phase === 'loading' && _jsx("p", { className: css.note, children: t('vision.loading') }), state.phase === 'error' && _jsx("p", { className: css.error, children: t('vision.error', { message: state.message }) }), value !== null && (_jsxs("div", { className: css.card, children: [!value.mounted && _jsx("p", { className: css.warn, children: t('vision.notMounted') }), _jsx(Row, { label: t('vision.enabled'), children: _jsx("span", { className: value.enabled ? css.badgeOk : css.badgeMuted, children: value.enabled ? t('vision.on') : t('vision.off') }) }), _jsx(Row, { label: t('vision.admission'), children: _jsx("span", { className: value.admissionActive ? css.badgeOk : css.badgeMuted, children: value.admissionActive ? t('vision.patched') : t('vision.notPatched') }) }), _jsx(Row, { label: t('vision.harnessTitle'), children: value.harnessModels.length === 0
                            ? _jsx("span", { className: css.muted, children: t('vision.harnessNone') })
                            : _jsx("span", { className: css.list, children: value.harnessModels.map(model => (_jsxs("code", { className: css.code, children: [model.provider, "/", model.model] }, `${model.provider}/${model.model}`))) }) }), _jsx(Row, { label: t('vision.endpointTitle'), children: value.endpointConfigured
                            ? _jsx("code", { className: css.code, children: value.endpointModel })
                            : _jsx("span", { className: css.muted, children: t('vision.endpointNone') }) }), _jsx(Row, { label: t('vision.keySource'), children: _jsx("span", { className: css.muted, children: t(keySourceKey(value.apiKeySource)) }) }), _jsx(Row, { label: t('vision.ollama'), children: value.ollamaDetected
                            ? _jsx("span", { className: css.badgeOk, children: t('vision.ollamaModel', { model: value.ollamaModel ?? '' }) })
                            : _jsx("span", { className: css.muted, children: t('vision.ollamaNone') }) }), _jsx(Row, { label: t('vision.cache'), children: _jsx("span", { className: css.muted, children: t('vision.cacheEntries', { count: String(value.cacheSize) }) }) }), _jsx(Row, { label: t('vision.lastError'), children: value.lastError === null
                            ? _jsx("span", { className: css.muted, children: t('vision.lastErrorNone') })
                            : _jsx("span", { className: css.failure, children: value.lastError }) })] })), _jsx("p", { className: css.hint, children: t('vision.hint') })] }));
}
