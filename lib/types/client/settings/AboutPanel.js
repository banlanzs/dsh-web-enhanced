import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { WEB_ENHANCED_REPOSITORY, WEB_ENHANCED_VERSION } from "../meta.js";
import css from './AboutPanel.module.css';
/** Feature list rendered as chips (kept in display order here). */
const FEATURE_KEYS = [
    'about.feature.board',
    'about.feature.graph',
    'about.feature.workspace',
    'about.feature.mention',
    'about.feature.balance',
    'about.feature.vision',
    'about.feature.plugins',
];
/** The About tab. */
export function AboutPanel({ t }) {
    return (_jsxs("div", { className: css.root, children: [_jsxs("header", { className: css.header, children: [_jsx("h3", { className: css.title, children: t('about.title') }), _jsxs("div", { className: css.meta, children: [_jsx("span", { className: css.version, children: t('about.version', { version: WEB_ENHANCED_VERSION }) }), _jsx("span", { className: css.dot, "aria-hidden": "true", children: "\u00B7" }), _jsx("span", { className: css.license, children: t('about.license') })] })] }), _jsx("p", { className: css.description, children: t('about.description') }), _jsxs("section", { className: css.section, children: [_jsx("h4", { className: css.sectionTitle, children: t('about.featuresTitle') }), _jsx("ul", { className: css.features, children: FEATURE_KEYS.map(key => (_jsx("li", { className: css.feature, children: t(key) }, key))) })] }), _jsxs("section", { className: css.section, children: [_jsx("h4", { className: css.sectionTitle, children: t('about.configTitle') }), _jsx("p", { className: css.note, children: t('about.configHint') })] }), _jsx("footer", { className: css.footer, children: _jsx("a", { className: css.link, href: WEB_ENHANCED_REPOSITORY, target: "_blank", rel: "noreferrer", children: t('about.repo') }) })] }));
}
