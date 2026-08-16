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

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { pastedTextClipboard, PASTED_TEXT_SOURCE } from './store.ts'
import type { PastedTextStore } from './store.ts'

/** Pastes at least this many characters become a chip instead of draft text. */
export const PASTED_TEXT_THRESHOLD = 2_000

/** The session-list/scope face the interceptor reads. */
interface SessionsFace {
  list: { getSnapshot(): { readonly current?: unknown } }
  scope(id: string): unknown
}

/** One span in the input machine's CAS currency (start/end + draftRev). */
export interface PastedTextSpan {
  readonly start: number
  readonly end: number
  readonly draftRev: number
}

/** The conversation input face (see the mention pipeline for the same shape). */
interface ConversationInputFace {
  input: {
    for(actx: unknown): {
      setDraft(text: string): void
      state: { getSnapshot(): { readonly draft: string; readonly draftRev: number } }
    }
  }
}

/** One session-scope context with the scoped input bail dispatcher. */
interface ScopedInputFace {
  bail(subject: unknown, event: string, payload: unknown): unknown
}

/** The minimal `ctx.inputTriggers` contract this feature needs. */
interface InputTriggerRegistryFace {
  registerSource(source: PastedTextTriggerSource): () => void
}

/** The local shape of the source we register (ui-input-trigger contract). */
interface PastedTextTriggerSource {
  readonly trigger: '@'
  readonly name: string
  readonly candidates: () => Promise<readonly { readonly name: string }[]>
  readonly onPick: () => undefined
  readonly codec: {
    readonly clipboardText: (ref: string) => string
    readonly serialize: (ref: string) => Promise<string>
  }
}

/** Remove one pasted-text occurrence from the addressed session's draft. */
export function removePastedText(
  ctx: ClientContext,
  sessionId: string,
  span: PastedTextSpan,
): void {
  const sessions = ctx.sessions as unknown as SessionsFace
  const actx = sessions.scope(sessionId)
  if (typeof actx !== 'object' || actx === null) return
  ;(actx as ScopedInputFace).bail(actx, 'slash/input-consume-token', {
    guard: { kind: 'span', span },
  })
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
export function applyPastedText(
  ctx: ClientContext,
  store: PastedTextStore,
  chipLabel: () => string,
): () => void {
  const disposers: Array<() => void> = []
  const inputTriggers = ctx.get('inputTriggers' as never, false) as unknown as InputTriggerRegistryFace | undefined
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
        serialize: async ref => store.get(ref)?.text ?? `[已粘贴文本 ${ref.slice(0, 8)} 已被清除]`,
      },
    })
    disposers.push(unregister)
  }

  const onPaste = (event: ClipboardEvent): void => {
    if (inputTriggers === undefined) return
    const target = event.target
    if (!(target instanceof HTMLTextAreaElement)) return
    if (target.closest('[data-composer-card]') === null) return
    if (target.disabled || target.readOnly) return
    const text = event.clipboardData?.getData('text/plain') ?? ''
    if (text.length < PASTED_TEXT_THRESHOLD) return
    const sessions = ctx.sessions as unknown as SessionsFace
    const sessionId = sessions.list.getSnapshot().current
    if (typeof sessionId !== 'string' || sessionId === '') return
    const actx = sessions.scope(sessionId)
    if (typeof actx !== 'object' || actx === null) return
    const conversation = ctx.get('conversation' as never, false) as unknown as ConversationInputFace | undefined
    if (conversation === undefined) return
    // Everything below replaces the host's native paste, so stop it before
    // React's synthetic onPaste can run.
    event.preventDefault()
    event.stopImmediatePropagation()

    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `paste-${Date.now()}-${Math.random().toString(36).slice(2)}`
    store.set(id, text)
    const input = conversation.input.for(actx)
    const snapshot = input.state.getSnapshot()
    const start = target.selectionStart ?? 0
    const end = target.selectionEnd ?? start
    const span: PastedTextSpan = { start, end, draftRev: snapshot.draftRev }
    const reference = {
      source: PASTED_TEXT_SOURCE,
      ref: id,
      label: chipLabel(),
      clipboardText: pastedTextClipboard(id),
    }
    const inserted = (actx as ScopedInputFace).bail(
      actx,
      'slash/input-insert-reference',
      { reference, span },
    )
    if (inserted === true) return
    // The trigger pipeline was absent or refused the span: fall back to a
    // short marker so the content is not lost and the chip row can still open
    // the stored text.
    try {
      const draft = snapshot.draft
      const marker = `[已粘贴文本:${id.slice(0, 8)}] `
      input.setDraft(`${draft.slice(0, start)}${marker}${draft.slice(end)}`)
    } catch {
      // Leave the paste cancelled; the stored entry is still reachable via the
      // dock only when an occurrence exists, so this is a true last resort.
    }
  }
  document.addEventListener('paste', onPaste, true)
  disposers.push(() => { document.removeEventListener('paste', onPaste, true) })
  return () => {
    for (const dispose of disposers.reverse()) dispose()
  }
}
