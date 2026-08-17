/**
 * Transcript renderer for sent user messages that originated from a
 * pasted-text chip.
 *
 * The composer keeps the long text behind a chip, but the HOST stores the
 * serialized full text in the sent user message, so the transcript would
 * re-expand it. This renderer shadows the host `conversation.chat.node`
 * entry for the `user` kind at a lower priority: a message whose text
 * contains a stored pasted-text entry renders that span as a collapsed
 * `已粘贴文本` chip (click to preview/edit), while every other user message
 * falls back to a plain right-aligned bubble with the same host anchors the
 * navbar reads (`data-time-hover-root` + a bubble class).
 * @module dsh-web-enhanced/src/client/pasted-text/PastedTextUserNodeView
 */
import type { ChatNodeViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client';
import type { InjectFace } from '@deepseek-ai/dsh-client-ui-slots';
import type { Translate } from '../locale-keys.ts';
import type { PastedTextStore } from './store.ts';
/** Injected business face of the transcript renderer. */
export interface PastedTextUserNodeInjected {
    readonly store: PastedTextStore;
}
/** Full props of the shadowing user-node renderer. */
export type PastedTextUserNodeProps = Omit<ChatNodeViewProps<'user'>, 't'> & InjectFace<PastedTextUserNodeInjected> & {
    readonly t: Translate;
};
/** The user-node renderer registered at priority -1. */
export declare const PastedTextUserNodeView: import("react").NamedExoticComponent<PastedTextUserNodeProps>;
