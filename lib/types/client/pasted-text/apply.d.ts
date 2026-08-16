/**
 * Long-paste interception for the composer.
 *
 * A plain-text paste above the threshold is stopped before the host InputBar
 * sees it, stored by {@link PastedTextStore}, and replayed into the draft as
 * one reference occurrence — the host input machine renders the U+FFFC as a
 * chip, and the source codec below serializes it back to the full text when
 * the message is submitted. The draft therefore stays one line instead of a
 * thousand.
 * @module dsh-web-enhanced/src/client/pasted-text/apply
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import type { PastedTextStore } from './store.ts';
/** Pastes at least this many characters become a chip instead of draft text. */
export declare const PASTED_TEXT_THRESHOLD = 2000;
/** Remove one pasted-text occurrence from the addressed session's draft. */
export declare function removePastedText(ctx: ClientContext, sessionId: string, span: {
    readonly start: number;
    readonly end: number;
}): void;
/**
 * Register the pasted-text trigger source and the document-level paste
 * interception. Both ride the calling effect, so unloading the plugin restores
 * the native paste path.
 * @param ctx - client root context.
 * @param store - pasted-text content store shared with the dock/codec.
 * @param chipLabel - localized chip label, cached per occurrence at insert time.
 * @returns the effect disposer.
 */
export declare function applyPastedText(ctx: ClientContext, store: PastedTextStore, chipLabel: () => string): () => void;
