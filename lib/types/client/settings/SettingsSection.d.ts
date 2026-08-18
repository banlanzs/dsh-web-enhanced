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
import type { InjectFace } from '@deepseek-ai/dsh-client-ui-slots';
import type { WebEnhancedProps } from '../contract.ts';
import type { ModelCapabilitiesInjected } from '../model-capabilities/ModelCapabilities.tsx';
/** Full composed props of the settings section. */
export type SettingsSectionProps = WebEnhancedProps<'settings.plugins.tab'> & InjectFace<ModelCapabilitiesInjected>;
/** The web-enhanced settings page. */
export declare function SettingsSection({ remote, t, skin, notifications, controller, useSnapshot, api, }: SettingsSectionProps): import("react").JSX.Element;
