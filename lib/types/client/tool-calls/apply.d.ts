/**
 * Tool-call group collapse — DOM layer.
 *
 * The host renders one `tool-call` chat node per ROOT invocation, each already
 * collapsed to a row. A long agent step still stacks a dozen of those rows, so
 * this module groups every RUN of adjacent tool-call rows behind one disclosure
 * header and hides the run once the step is over.
 *
 * Why DOM and not a slot: reaching the same UX from `conversation.chat.node`
 * would mean shadowing the host `tool-call` entry and re-dispatching each root
 * through `tool.call.toolview` — but that child slot is declared by the host's
 * OWN entry, `SlotCore.register` pins a child slot to a single declaration, and
 * `renderSlot` only honours the calling entry's children table. A shadow wins
 * the render, never the declaration, so re-declaring it fails the plugin boot.
 * Wrapping from the outside keeps every host tool view (Bash argv, Edit diff,
 * Read preview) exactly as the host draws it.
 *
 * Running vs finished is read from POSITION, not from the host's tool-view
 * internals: only the run that sits at the very END of the flow can still be
 * live. As soon as anything else follows it — an assistant message, the turn
 * tail — that step is over and its run auto-collapses. Nothing here depends on
 * the markup inside a host tool row.
 * @module dsh-web-enhanced/src/client/tool-calls/apply
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/** Runs of adjacent tool-call flow items, in flow order. */
export declare function toolRuns(items: readonly HTMLElement[]): HTMLElement[][];
/**
 * Mount the tool-call group collapse for this page.
 * @param ctx - client root context (locale for the header, sessions for state scoping).
 * @returns the disposer removing every header, attribute, and observer.
 */
export declare function applyToolCallCollapse(ctx: ClientContext): () => void;
