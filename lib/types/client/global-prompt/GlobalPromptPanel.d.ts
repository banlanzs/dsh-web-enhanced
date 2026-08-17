/**
 * Global Prompt tab of the plugin's Settings page.
 *
 * The namespace is owned and schema-registered by the host half
 * (`src/global-prompt.ts`); this tab only reads the redacted user layer and
 * writes the two top-level keys through the standard `settings.mutate` CAS
 * RPC. The host section's text provider re-reads the resolved value on every
 * prompt assembly, so a successful save reaches the next model request
 * without a restart.
 * @module dsh-web-enhanced/src/client/global-prompt/GlobalPromptPanel
 */
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client';
import type { Translate } from '../locale-keys.ts';
/** Props of the tab (a plain child of the plugin's Settings section). */
export interface GlobalPromptPanelProps {
    readonly api: Pick<IApiClient, 'settings'>;
    readonly t: Translate;
}
/** The Global Prompt tab: one switch, one text block, CAS save. */
export declare function GlobalPromptPanel({ api, t }: GlobalPromptPanelProps): import("react").JSX.Element;
