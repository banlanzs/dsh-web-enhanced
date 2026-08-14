/**
 * SCM pane: the real git working-tree status, split into staged and unstaged
 * groups, with stage / unstage / discard per entry and a diff preview on
 * click. Discarding is irreversible, so it asks first.
 * @module dsh-web-enhanced/src/client/panel/ScmPane
 */
import type { WebEnhancedProps } from '../contract.ts';
/** Props of the SCM pane. */
export type ScmPaneProps = WebEnhancedProps<'conversation.view'> & {
    readonly workspaceId: string;
};
/** The SCM pane. */
export declare function ScmPane({ workspaceId, remote, openTab, selectTab, t }: ScmPaneProps): import("react").JSX.Element;
