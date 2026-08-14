/**
 * Preview loading: which rendered form a path maps to, and how one preview
 * tab is assembled from the host's file reads. Kind selection is a pure
 * function of the path so the panel can label a tab before its bytes arrive;
 * the loader is the only place that decides between the text, binary, and
 * Office read paths.
 * @module dsh-web-enhanced/src/client/preview
 */
import type { PreviewKind, PreviewMode, PreviewTab, WebEnhancedRemote } from './contract.ts';
/**
 * Lowercase extension of a path, without the dot.
 * @param path - workspace-relative path.
 * @returns the extension, or '' when the basename carries none.
 */
export declare function extensionOf(path: string): string;
/**
 * Basename of a workspace-relative path.
 * @param path - workspace-relative path.
 * @returns the last segment.
 */
export declare function baseNameOf(path: string): string;
/**
 * The rendered form a path maps to, decided from the path alone.
 * @param path - workspace-relative path.
 * @returns the preview kind; unknown extensions read as plain text.
 */
export declare function previewKindOf(path: string): PreviewKind;
/**
 * Whether a kind has a rendered form distinct from its source text. Kinds
 * without one stay on `source` and hide the mode switch.
 * @param kind - the preview kind.
 * @returns true when `view` and `split` are meaningful.
 */
export declare function hasRenderedForm(kind: PreviewKind): boolean;
/**
 * Whether a kind's bytes are editable text the panel may save back.
 * @param kind - the preview kind.
 * @returns true for text-shaped kinds.
 */
export declare function isEditable(kind: PreviewKind): boolean;
/** Initial render mode of a freshly opened tab. */
export declare function initialModeOf(kind: PreviewKind): PreviewMode;
/** Base64 payload of a binary read, as a data URL for `img`/`object`. */
export declare function dataUrlOf(tab: PreviewTab): string | undefined;
/**
 * Load one file into a preview tab. Host failures land in the tab's `error`
 * field so the panel renders them in place instead of losing the tab.
 * @param remote - the web-enhanced remote facade.
 * @param workspaceId - owning workspace.
 * @param path - workspace-relative path.
 * @returns the assembled tab.
 */
export declare function loadPreviewTab(remote: WebEnhancedRemote, workspaceId: string, path: string): Promise<PreviewTab>;
