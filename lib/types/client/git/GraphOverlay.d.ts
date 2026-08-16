/**
 * Git graph: branch lanes and commit history for one workspace. Two surfaces
 * share the same panel — the full-frame overlay and the workspace view's「Git
 * 图谱」tab — so the data/logic lives in {@link GraphPanel} and the wrappers
 * own only their chrome.
 *
 * The branch selector here is the GRAPH's own filter: it decides which
 * history the lanes are drawn from and changes nothing in the repository.
 * The composer's branch strip is the other operation — it checks a branch
 * out. Two controls because they are two different questions.
 * @module dsh-web-enhanced/src/client/git/GraphOverlay
 */
import type { PanelTab, PreviewTab, WebEnhancedProps, WebEnhancedRemote } from '../contract.ts';
/** Full composed props of the graph overlay. */
export type GraphOverlayProps = WebEnhancedProps<'shell.overlay'>;
/** What the chrome-free panel needs from its host surface. */
export interface GraphPanelProps {
    /** Workspace whose repository is drawn; undefined renders the empty state. */
    readonly workspaceId: string | undefined;
    readonly remote: WebEnhancedRemote;
    readonly t: WebEnhancedProps<'shell.overlay'>['t'];
    /** Open one diff as an explorer preview tab. */
    readonly openTab: (tab: PreviewTab) => void;
    /** Switch to the explorer so the opened diff is visible. */
    readonly selectTab: (tab: PanelTab) => void;
}
/** The chrome-free graph: filter, refresh, and the laid-out commit list. */
export declare function GraphPanel({ workspaceId, remote, t, openTab, selectTab }: GraphPanelProps): import("react").JSX.Element;
/** The git graph overlay: the same panel under the full-frame chrome. */
export declare function GraphOverlay({ useOverlay, useSessions, useWorkspaces, remote, closeOverlay, t, openTab, selectTab, }: GraphOverlayProps): import("react").JSX.Element | null;
