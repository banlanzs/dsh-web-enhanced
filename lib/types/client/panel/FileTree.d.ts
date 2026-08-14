/**
 * Workspace file tree: lazily expanded directories, whole-row click to
 * expand, and a file-name filter that switches the tree into a flat match
 * list. Clicking a file opens it in the preview tab.
 *
 * Directory contents are fetched on first expansion and cached for the life
 * of the mount: a tree that re-listed on every render would hammer the host
 * on each keystroke of the filter.
 * @module dsh-web-enhanced/src/client/panel/FileTree
 */
import type { WebEnhancedProps } from '../contract.ts';
/** Props of the file tree: the panel's composed props plus the resolved workspace. */
export type FileTreeProps = WebEnhancedProps<'shell.overlay'> & {
    readonly workspaceId: string;
};
/** The file tree. */
export declare function FileTree({ workspaceId, usePanel, remote, toggleExpanded, setQuery, selectTab, openTab, t, }: FileTreeProps): import("react").JSX.Element;
