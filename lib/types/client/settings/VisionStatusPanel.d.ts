/**
 * The Vision tab: live configuration form + status.
 *
 * Configuration is a settings namespace (`dsh-web-enhanced-vision`) owned by
 * this plugin; saves go through the plugin gateway (`visionConfigGet` /
 * `visionConfigSet`) and the host-side interceptor watches the commit, so
 * changes apply immediately without a restart. The DSH provider/model selects
 * read the same directory the model picker renders, filtered to models that
 * declare image input. The dedicated API section is only used for image
 * transcription — it never registers into DSH's model channels.
 * @module dsh-web-enhanced/src/client/settings/VisionStatusPanel
 */
import type { WebEnhancedRemote } from '../contract.ts';
import type { Translate } from '../locale-keys.ts';
/** Props of the pane (a plain child, not a slot registration). */
export interface VisionStatusPanelProps {
    readonly remote: WebEnhancedRemote;
    readonly t: Translate;
}
/** The Vision tab: configuration form above, live status below. */
export declare function VisionStatusPanel({ remote, t }: VisionStatusPanelProps): import("react").JSX.Element;
