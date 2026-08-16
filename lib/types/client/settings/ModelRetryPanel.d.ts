/**
 * Model-request retry settings: edits the DeepSeek provider's bounded retry
 * count through the host settings service. The value lives in the
 * `llm-deepseek` namespace (owned by the provider plugin), so saving here is
 * a settings write, not a web-enhanced config — and the provider re-registers
 * its route immediately, applying the new policy to the next request.
 * @module dsh-web-enhanced/src/client/settings/ModelRetryPanel
 */
import type { WebEnhancedProps } from '../contract.ts';
/** The settings section props this panel actually uses. */
export type ModelRetryPanelProps = Pick<WebEnhancedProps<'settings.section'>, 'remote' | 't'>;
/** The DeepSeek retry settings panel. */
export declare function ModelRetryPanel({ remote, t }: ModelRetryPanelProps): import("react").JSX.Element;
