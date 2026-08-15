/**
 * Read-only status page of the image-understanding integration.
 *
 * The configuration itself is static plugin config (`cordis.patch.yml`, keys
 * prefixed `vision*`) because this plugin's other host settings are static
 * too; what this tab adds is evidence — whether the admission patch is live,
 * which transcription sources are usable right now, and the last failure.
 * @module dsh-web-enhanced/src/client/settings/VisionStatusPanel
 */
import type { WebEnhancedRemote } from '../contract.ts';
import type { Translate } from '../locale-keys.ts';
/** Props of the status pane (a plain child, not a slot registration). */
export interface VisionStatusPanelProps {
    readonly remote: WebEnhancedRemote;
    readonly t: Translate;
}
/** The image-understanding status pane. */
export declare function VisionStatusPanel({ remote, t }: VisionStatusPanelProps): import("react").JSX.Element;
