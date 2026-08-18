/**
 * Tool-call group collapse — DOM layer.
 *
 * The host renders one flow row per ROOT tool invocation and one `assistant-step`
 * (Think) row per model step. A long turn therefore alternates Think/Bash rows
 * for a screenful. This module groups every RUN of adjacent Think/tool rows
 * behind one disclosure header and hides the run once the turn is over, keeping
 * the FINAL assistant step visible because it is the user's answer.
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
/** Runs of adjacent Think/tool-call flow items, in flow order. */
export declare function activityRuns(items: readonly HTMLElement[]): HTMLElement[][];
/**
 * Members of one run that a collapse hides. The FINAL assistant-step stays
 * visible: in this host it is the user's answer, and folding it away would
 * leave the reply itself hidden. A run that ends on a tool call has no such
 * answer, so every member folds.
 */
export declare function collapseTargets(run: readonly HTMLElement[]): HTMLElement[];
/**
 * Mount the tool-call group collapse for this page.
 * @param ctx - client root context (locale for the header, sessions for state scoping).
 * @returns the disposer removing every header, attribute, and observer.
 */
export declare function applyToolCallCollapse(ctx: ClientContext): () => void;
