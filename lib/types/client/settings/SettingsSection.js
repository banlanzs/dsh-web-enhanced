import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The plugin's own Settings page.
 *
 * Registered into `settings.section`, the root list slot the settings shell
 * projects into its nav list: each registration's `id`, `order`, and `label`
 * become one nav row, and the shell renders only the selected section's
 * component. That is the whole contribution contract — the icon comes from the
 * shell's own id allowlist (an unknown id gets the generic one) and nothing
 * else about the nav is ours to decide.
 *
 * The page carries its own tabs because it hosts two unrelated things: managing
 * what the profile has installed, and describing what this plugin is. Neither
 * deserves a separate nav row.
 * @module dsh-web-enhanced/src/client/settings/SettingsSection
 */
import { useState } from 'react';
import { PluginManager } from "./PluginManager.js";
import css from './SettingsSection.module.css';
/** The web-enhanced settings page. */
export function SettingsSection({ remote, t }) {
    const [tab, setTab] = useState('plugins');
    return (_jsxs("div", { className: css.root, children: [_jsxs("div", { className: css.tabs, role: "tablist", children: [_jsx("button", { type: "button", role: "tab", "aria-selected": tab === 'plugins', className: tab === 'plugins' ? css.tabActive : css.tab, onClick: () => { setTab('plugins'); }, children: t('settings.tab.plugins') }), _jsx("button", { type: "button", role: "tab", "aria-selected": tab === 'about', className: tab === 'about' ? css.tabActive : css.tab, onClick: () => { setTab('about'); }, children: t('settings.tab.about') })] }), _jsx("div", { className: css.body, children: tab === 'plugins'
                    ? _jsx(PluginManager, { remote: remote, t: t })
                    : _jsx("p", { className: css.about, children: t('about.body') }) })] }));
}
