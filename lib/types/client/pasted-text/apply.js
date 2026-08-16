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
import { pastedTextClipboard, PASTED_TEXT_SOURCE } from "./store.js";
/** Pastes at least this many characters become a chip instead of draft text. */
export const PASTED_TEXT_THRESHOLD = 2_000;
/** Remove one pasted-text occurrence from the addressed session's draft. */
export function removePastedText(ctx, sessionId, span) {
    const sessions = ctx.sessions;
    const actx = sessions.scope(sessionId);
    if (typeof actx !== 'object' || actx === null)
        return;
    actx.bail(actx, 'slash/input-consume-token', {
        guard: { kind: 'span', span },
    });
}
/**
 * Register the pasted-text trigger source and the document-level paste
 * interception. Both ride the calling effect, so unloading the plugin restores
 * the native paste path.
 * @param ctx - client root context.
 * @param store - pasted-text content store shared with the dock/codec.
 * @param chipLabel - localized chip label, cached per occurrence at insert time.
 * @returns the effect disposer.
 */
export function applyPastedText(ctx, store, chipLabel) {
    const disposers = [];
    const inputTriggers = ctx.get('inputTriggers', false);
    if (inputTriggers !== undefined) {
        const unregister = inputTriggers.registerSource({
            trigger: '@',
            name: PASTED_TEXT_SOURCE,
            candidates: () => Promise.resolve([]),
            onPick: () => undefined,
            codec: {
                clipboardText: pastedTextClipboard,
                // The model gets the full stored text; an evicted entry degrades to a
                // marker rather than blocking the send with a serializer failure.
                serialize: async (ref) => store.get(ref)?.text ?? `[已粘贴文本 ${ref.slice(0, 8)} 已被清除]`,
            },
        });
        disposers.push(unregister);
    }
    const onPaste = (event) => {
        if (inputTriggers === undefined)
            return;
        const target = event.target;
        if (!(target instanceof HTMLTextAreaElement))
            return;
        if (target.closest('[data-composer-card]') === null)
            return;
        if (target.disabled || target.readOnly)
            return;
        const text = event.clipboardData?.getData('text/plain') ?? '';
        if (text.length < PASTED_TEXT_THRESHOLD)
            return;
        const sessions = ctx.sessions;
        const sessionId = sessions.list.getSnapshot().current;
        if (typeof sessionId !== 'string' || sessionId === '')
            return;
        const actx = sessions.scope(sessionId);
        if (typeof actx !== 'object' || actx === null)
            return;
        const conversation = ctx.get('conversation', false);
        if (conversation === undefined)
            return;
        // Everything below replaces the host's native paste, so stop it before
        // React's synthetic onPaste can run.
        event.preventDefault();
        event.stopImmediatePropagation();
        const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `paste-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        store.set(id, text);
        const input = conversation.input.for(actx);
        const snapshot = input.state.getSnapshot();
        const start = target.selectionStart ?? 0;
        const end = target.selectionEnd ?? start;
        const span = { start, end, draftRev: snapshot.draftRev };
        const reference = {
            source: PASTED_TEXT_SOURCE,
            ref: id,
            label: chipLabel(),
            clipboardText: pastedTextClipboard(id),
        };
        const inserted = actx.bail(actx, 'slash/input-insert-reference', { reference, span });
        if (inserted === true)
            return;
        // The trigger pipeline was absent or refused the span: fall back to a
        // short marker so the content is not lost and the chip row can still open
        // the stored text.
        try {
            const draft = snapshot.draft;
            const marker = `[已粘贴文本:${id.slice(0, 8)}] `;
            input.setDraft(`${draft.slice(0, start)}${marker}${draft.slice(end)}`);
        }
        catch {
            // Leave the paste cancelled; the stored entry is still reachable via the
            // dock only when an occurrence exists, so this is a true last resort.
        }
    };
    document.addEventListener('paste', onPaste, true);
    disposers.push(() => { document.removeEventListener('paste', onPaste, true); });
    return () => {
        for (const dispose of disposers.reverse())
            dispose();
    };
}
