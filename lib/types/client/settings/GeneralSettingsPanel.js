import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ModelRetryPanel } from "./ModelRetryPanel.js";
import css from './GeneralSettingsPanel.module.css';
/** General settings: currently the model-request retry policy. */
export function GeneralSettingsPanel({ remote, t }) {
    return (_jsxs("section", { className: css.general, "data-testid": "general-settings", children: [_jsx("h2", { className: css.title, children: t('settings.general.title') }), _jsx("p", { className: css.hint, children: t('settings.general.hint') }), _jsx(ModelRetryPanel, { remote: remote, t: t })] }));
}
