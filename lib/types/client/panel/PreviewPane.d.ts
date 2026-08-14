/**
 * Preview pane: a tab strip over open files, a source/split/preview mode
 * switch, and inline editing with save-back for text-shaped formats.
 *
 * Rendered forms are built from parsed structures into React elements — never
 * `dangerouslySetInnerHTML` — so file content cannot inject markup. HTML is
 * the one format with no structural rendering, and it goes into a sandboxed
 * iframe with no scripts and no same-origin access.
 * @module dsh-web-enhanced/src/client/panel/PreviewPane
 */
import type { WebEnhancedProps } from '../contract.ts';
/** Props of the preview pane. */
export type PreviewPaneProps = WebEnhancedProps<'shell.overlay'> & {
    readonly workspaceId: string;
};
/** The preview pane. */
export declare function PreviewPane({ workspaceId, usePreview, remote, focusTab, closeTab, setMode, setDraft, commitDraft, t, }: PreviewPaneProps): import("react").JSX.Element;
