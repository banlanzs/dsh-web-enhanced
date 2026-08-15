/**
 * The About tab of the plugin's Settings section.
 *
 * Deliberately static: identity, what the plugin does, where it lives, and
 * where its configuration lives. The version is a build-time constant
 * (`./meta.ts`) because the browser half cannot read its own package manifest.
 * @module dsh-web-enhanced/src/client/settings/AboutPanel
 */
import type { Translate } from '../locale-keys.ts';
/** Props of the About pane (a plain child, not a slot registration). */
export interface AboutPanelProps {
    readonly t: Translate;
}
/** The About tab. */
export declare function AboutPanel({ t }: AboutPanelProps): import("react").JSX.Element;
