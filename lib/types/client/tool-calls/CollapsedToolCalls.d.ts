/**
 * Tool-call collapse renderer.
 *
 * The host renders one `tool-call` chat node per ROOT tool invocation and
 * nests subcalls below it. That is already collapsed per row, but a long run
 * still fills the transcript with dozens of rows. This renderer shadows the
 * host `tool-call` entry at a lower priority and groups every root Tool call
 * that belongs to one agent step into a single disclosure row:
 *
 * - while the step is running the group stays expanded, so live Bash/Read/…
 *   rows keep streaming exactly as the host renders them (each root is still
 *   dispatched through the host's own `tool.call.toolview` slot);
 * - when every call in the step settles, the group auto-collapses to one
 *   `工具调用 · N 次` line, and the user can expand it again at any time.
 *
 * A loaded page therefore shows completed history compacted, while a live run
 * never hides its progress.
 * @module dsh-web-enhanced/src/client/tool-calls/CollapsedToolCalls
 */
import type { ReactNode } from 'react';
import type { ChatNodeViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client';
import type { PropsRenderSlots } from '@deepseek-ai/dsh-client-ui-slots';
import type { ChatSnapshot, ToolCallBlock, ToolResultNode } from '@deepseek-ai/dsh-client-runtime/client';
import type { Translate } from '../locale-keys.ts';
/** Full props of the shadowing tool-call renderer. */
export type CollapsedToolCallsProps = Omit<ChatNodeViewProps<'tool-call'>, 't'> & PropsRenderSlots<'tool.call.toolview'> & {
    readonly t: Translate;
};
/** One tool-call chat node (the keyed slot's owner currency). */
type ToolCallChatNode = ChatNodeViewProps<'tool-call'>['node'];
/** Narrow a block to its settled result form (rc.6 RunningToolCall has no kind tag). */
export declare function isSettled(block: ToolCallBlock): block is ToolResultNode;
/** Wire tool name of either lifecycle form. */
export declare function nameOf(block: ToolCallBlock): string;
/** Count one call plus every nested subcall recursively. */
export declare function countCalls(block: ToolCallBlock): number;
/** Flatten a settled result's text blocks into display text. */
export declare function resultText(block: ToolResultNode): string;
/** First line of a potentially multi-line string. */
export declare function firstLine(text: string): string;
/** Filter one step/turn key list down to tool-call seats, with self fallback. */
export declare function orderedToolKeys(nodeKey: string, keys: readonly string[], kindOf: (key: string) => string | undefined): readonly string[];
/** Step/turn keys one tool-call node belongs to, falling back to itself. */
export declare function keysOf(node: ToolCallChatNode, chat: ChatSnapshot): readonly string[];
/** The first tool-call node renders this group; sibling seats render null. */
export declare function ToolCallGroup({ blocks, renderSlot, selectedCallId, cwd, openFile, inspectCall, t }: {
    readonly blocks: readonly ToolCallBlock[];
    readonly renderSlot: CollapsedToolCallsProps['renderSlot'];
    readonly selectedCallId: string | undefined;
    readonly cwd: string | undefined;
    readonly openFile: (path: string) => void;
    readonly inspectCall: (callId: string) => void;
    readonly t: Translate;
}): ReactNode;
/** The tool-call node renderer registered at priority -1. */
export declare const CollapsedToolCalls: import("react").NamedExoticComponent<CollapsedToolCallsProps>;
export {};
