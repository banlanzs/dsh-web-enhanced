import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The plugin's own Settings page.
 *
 * Registered into `settings.plugins.tab`, the Plugins settings page's tab
 * list. The page carries a second tab list for the Web Enhanced feature areas.
 *
 * The page carries its own tabs because it hosts several unrelated things:
 * managing what the profile has installed, general settings (model-request
 * retry), the global system prompt, configuring image understanding,
 * model capabilities, completion notifications, switching the interface skin,
 * and describing what this plugin is. None deserves a separate Plugins tab.
 * @module dsh-web-enhanced/src/client/settings/SettingsSection
 */
import { useState } from 'react';
import { ModelCapabilitiesSection } from "../model-capabilities/ModelCapabilities.js";
import { SkinPanel } from "../skins/SkinPanel.js";
import { AboutPanel } from "./AboutPanel.js";
import { GeneralSettingsPanel } from "./GeneralSettingsPanel.js";
import { MemoryPanel } from "./MemoryPanel.js";
import { PluginManager } from "./PluginManager.js";
import { VisionStatusPanel } from "./VisionStatusPanel.js";
import { GlobalPromptPanel } from "../global-prompt/GlobalPromptPanel.js";
import { NotificationPanel } from "./NotificationPanel.js";
import css from './SettingsSection.module.css';
import { SETTINGS_TAB_IDS } from "./navigation.js";
/** The web-enhanced settings page. */
export function SettingsSection({ remote, t, skin, notifications, controller, useSnapshot, api, }) {
    const [tab, setTab] = useState('plugins');
    const tabs = SETTINGS_TAB_IDS.map(id => ({
        id,
        label: t(`settings.tab.${id}`),
    }));
    return (_jsxs("div", { className: css.root, children: [_jsx("div", { className: css.tabs, role: "tablist", "aria-orientation": "vertical", children: tabs.map(entry => (_jsx("button", { type: "button", role: "tab", "aria-selected": tab === entry.id, className: tab === entry.id ? css.tabActive : css.tab, onClick: () => { setTab(entry.id); }, children: entry.label }, entry.id))) }), _jsxs("div", { className: css.body, children: [tab === 'plugins' && _jsx(PluginManager, { remote: remote, t: t }), tab === 'general' && _jsx(GeneralSettingsPanel, { remote: remote, t: t }), tab === 'globalPrompt' && _jsx(GlobalPromptPanel, { remote: remote, t: t }), tab === 'memory' && _jsx(MemoryPanel, { remote: remote, t: t }), tab === 'modelCapabilities'
                    ? _jsx(ModelCapabilitiesSection, { controller: controller, useSnapshot: useSnapshot, api: api, t: t })
                    : null, tab === 'vision' && _jsx(VisionStatusPanel, { remote: remote, t: t }), tab === 'notify' && _jsx(NotificationPanel, { notifications: notifications, t: t }), tab === 'skins' && _jsx(SkinPanel, { skin: skin, t: t }), tab === 'about' && _jsx(AboutPanel, { t: t })] })] }));
}
