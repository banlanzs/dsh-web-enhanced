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
 * The page carries its own tabs because it hosts six unrelated things:
 * managing what the profile has installed, general settings (model-request
 * retry), the global system prompt, configuring image understanding,
 * switching the interface skin, and describing what this plugin is. None
 * deserves a separate nav row.
 * @module dsh-web-enhanced/src/client/settings/SettingsSection
 */
import { useState } from 'react';
import { SkinPanel } from "../skins/SkinPanel.js";
import { AboutPanel } from "./AboutPanel.js";
import { GeneralSettingsPanel } from "./GeneralSettingsPanel.js";
import { MemoryPanel } from "./MemoryPanel.js";
import { PluginManager } from "./PluginManager.js";
import { VisionStatusPanel } from "./VisionStatusPanel.js";
import { GlobalPromptPanel } from "../global-prompt/GlobalPromptPanel.js";
import css from './SettingsSection.module.css';
/** The web-enhanced settings page. */
export function SettingsSection({ remote, t, skin }) {
    const [tab, setTab] = useState('plugins');
    const tabs = [
        { id: 'plugins', label: t('settings.tab.plugins') },
        { id: 'general', label: t('settings.tab.general') },
        { id: 'globalPrompt', label: t('settings.tab.globalPrompt') },
        { id: 'memory', label: t('settings.tab.memory') },
        { id: 'vision', label: t('settings.tab.vision') },
        { id: 'skins', label: t('settings.tab.skins') },
        { id: 'about', label: t('settings.tab.about') },
    ];
    return (_jsxs("div", { className: css.root, children: [_jsx("div", { className: css.tabs, role: "tablist", children: tabs.map(entry => (_jsx("button", { type: "button", role: "tab", "aria-selected": tab === entry.id, className: tab === entry.id ? css.tabActive : css.tab, onClick: () => { setTab(entry.id); }, children: entry.label }, entry.id))) }), _jsxs("div", { className: css.body, children: [tab === 'plugins' && _jsx(PluginManager, { remote: remote, t: t }), tab === 'general' && _jsx(GeneralSettingsPanel, { remote: remote, t: t }), tab === 'globalPrompt' && _jsx(GlobalPromptPanel, { remote: remote, t: t }), tab === 'memory' && _jsx(MemoryPanel, { remote: remote, t: t }), tab === 'vision' && _jsx(VisionStatusPanel, { remote: remote, t: t }), tab === 'skins' && _jsx(SkinPanel, { skin: skin, t: t }), tab === 'about' && _jsx(AboutPanel, { t: t })] })] }));
}
