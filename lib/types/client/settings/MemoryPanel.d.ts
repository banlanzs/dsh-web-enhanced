/**
 * Memory tab of the plugin's Settings page.
 *
 * Lists the durable memories the model saved through `save_memory`, lets the
 * user narrow them by classification, scope, and text, and delete any entry.
 * The feature switch lives here too. Reads and writes go through this
 * plugin's own Typert gateway (`memoryList` / `memoryDelete` /
 * `memoryConfigGet` / `memoryConfigSet`), not the host settings RPCs: the
 * memories live in the `web_enhanced` storage domain and the switch lives in
 * a plugin-owned settings namespace, which the generic browser settings RPCs
 * would never list.
 *
 * The list is NOT workspace-scoped: a workspace-scoped read would hide the
 * memories whose cwd no longer resolves to a registered workspace — the very
 * ones a user would want to clean up. The scope filter separates the global
 * (cross-project) pool from project-owned records client-side.
 * @module dsh-web-enhanced/src/client/settings/MemoryPanel
 */
import type { MemoryKind, MemoryRecord, WebEnhancedRemote } from '../contract.ts';
import type { Translate } from '../locale-keys.ts';
/** The kind filter; `undefined` means all kinds. */
export type KindFilter = MemoryKind | undefined;
/** Which pool a row belongs to; `all` disables the filter. */
export type Scope = 'all' | 'workspace' | 'global';
/** Props of the tab (a plain child, not a slot registration). */
export interface MemoryPanelProps {
    readonly remote: WebEnhancedRemote;
    readonly t: Translate;
}
/**
 * Whether one record survives the three active filters.
 *
 * Exported for the unit tests: this package's tests run in the node
 * environment, so the panel's judgements are pinned as pure functions rather
 * than through a render.
 * @param record - the candidate row.
 * @param kind - the classification filter; `undefined` keeps every kind.
 * @param scope - which pool to keep.
 * @param needle - the lowercased search text; `''` keeps every row.
 * @returns whether the row is shown.
 */
export declare function matches(record: MemoryRecord, kind: KindFilter, scope: Scope, needle: string): boolean;
/** Memory management tab: switch, list, filters, delete with confirmation. */
export declare function MemoryPanel({ remote, t }: MemoryPanelProps): import("react").JSX.Element;
