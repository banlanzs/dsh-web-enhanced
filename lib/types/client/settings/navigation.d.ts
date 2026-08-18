/** Stable navigation identities shared by the Web Enhanced settings page. */
export declare const WEB_ENHANCED_PLUGIN_TAB: {
    readonly id: "web-enhanced";
    readonly order: 20;
};
export declare const SETTINGS_TAB_IDS: readonly ["plugins", "general", "globalPrompt", "memory", "modelCapabilities", "vision", "notify", "skins", "about"];
export type SettingsTab = (typeof SETTINGS_TAB_IDS)[number];
