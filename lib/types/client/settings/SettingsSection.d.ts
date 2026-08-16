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
 * The page carries its own tabs because it hosts five unrelated things:
 * managing what the profile has installed, general settings (model-request
 * retry), configuring image understanding, switching the interface skin, and
 * describing what this plugin is. None deserves a separate nav row.
 * @module dsh-web-enhanced/src/client/settings/SettingsSection
 */
import type { WebEnhancedProps } from '../contract.ts';
/** Full composed props of the settings section. */
export type SettingsSectionProps = WebEnhancedProps<'settings.section'>;
/** The web-enhanced settings page. */
export declare function SettingsSection({ remote, t, skin }: SettingsSectionProps): import("react").JSX.Element;
