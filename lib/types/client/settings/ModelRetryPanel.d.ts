/**
 * Model-request retry settings: edits every enabled provider route's
 * bounded retry count through the host settings service. The value lives in
 * the owning adapter's settings namespace — `llm-deepseek` at its section
 * root, each pi-ai route at `providers.<route>.retryPolicy` — so saving here
 * is a settings write, not a web-enhanced config, and the provider
 * re-registers its route immediately, applying the new policy to the next
 * request.
 * @module dsh-web-enhanced/src/client/settings/ModelRetryPanel
 */
import type { WebEnhancedProps } from '../contract.ts';
/** The settings section props this panel actually uses. */
export type ModelRetryPanelProps = Pick<WebEnhancedProps<'settings.plugins.tab'>, 'remote' | 't'>;
/** Per-provider retry settings, one editable row per enabled route. */
export declare function ModelRetryPanel({ remote, t }: ModelRetryPanelProps): import("react").JSX.Element;
