/**
 * General settings group: the home for settings that do not deserve their own
 * tab. Model-request retry is the first member; future general preferences
 * slot in beside it.
 * @module dsh-web-enhanced/src/client/settings/GeneralSettingsPanel
 */
import type { WebEnhancedProps } from '../contract.ts';
/** The settings section props the general group uses. */
export type GeneralSettingsPanelProps = Pick<WebEnhancedProps<'settings.section'>, 'remote' | 't'>;
/** General settings: currently the model-request retry policy. */
export declare function GeneralSettingsPanel({ remote, t }: GeneralSettingsPanelProps): import("react").JSX.Element;
