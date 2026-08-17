/**
 * Global Prompt tab of the plugin's Settings page.
 *
 * The namespace is owned and schema-registered by the host half
 * (`src/global-prompt.ts`). Reads and writes go through this plugin's own
 * Typert gateway (`globalPromptGet` / `globalPromptSet`), not the host
 * `settings.describe` RPCs: a plugin-owned namespace is not on the
 * api-proxy settings allowlist, so the generic browser settings RPCs would
 * never list it. The host section's text provider re-reads the resolved
 * value on every prompt assembly, so a successful save reaches the next
 * model request without a restart.
 * @module dsh-web-enhanced/src/client/global-prompt/GlobalPromptPanel
 */
import type { WebEnhancedRemote } from '../contract.ts';
import type { Translate } from '../locale-keys.ts';
/** Props of the tab (a plain child of the plugin's Settings section). */
export interface GlobalPromptPanelProps {
    readonly remote: WebEnhancedRemote;
    readonly t: Translate;
}
/** The Global Prompt tab: one switch, one text block, CAS save. */
export declare function GlobalPromptPanel({ remote, t }: GlobalPromptPanelProps): import("react").JSX.Element;
