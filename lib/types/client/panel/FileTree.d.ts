/**
 * Workspace file tree sidebar: lazily expanded directories, whole-row click
 * to expand, and a file-name filter that switches the tree into a flat match
 * list. Clicking a file opens it in the explorer's preview side, which the
 * combined layout keeps visible beside the tree.
 *
 * Directory contents are fetched on first expansion and cached for the life
 * of the mount: a tree that re-listed on every render would hammer the host
 * on each keystroke of the filter.
 * @module dsh-web-enhanced/src/client/panel/FileTree
 */
import type { WebEnhancedProps } from '../contract.ts';
/** Props of the file tree: the panel's composed props plus the resolved workspace. */
export type FileTreeProps = WebEnhancedProps<'conversation.view'> & {
    readonly workspaceId: string;
    /** When present, the tree renders a collapse control beside its search box. */
    readonly onCollapse?: () => void;
    readonly collapseLabel?: string;
};
/** The file tree. */
export declare function FileTree({ workspaceId, usePanel, remote, toggleExpanded, setQuery, openTab, t, onCollapse, collapseLabel, }: FileTreeProps): import("react").JSX.Element;
