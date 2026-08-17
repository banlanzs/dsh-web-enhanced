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
import type { PastedTextEntry, PastedTextStore } from './store.ts'

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

/** One occurrence the machine publishes, narrowed to what the watcher reads. */
interface InputOccurrenceFace {
  readonly source?: string
}

/** One published input-machine snapshot, narrowed to the watcher's fields. */
interface InputStateFace {
  readonly draft: string
  readonly draftRev: number
  readonly occurrences?: readonly InputOccurrenceFace[]
}

/** The conversation input face (see the mention pipeline for the same shape). */
interface ConversationInputFace {
  input: {
    for(actx: unknown): {
      setDraft(text: string): void
      state: {
        getSnapshot(): InputStateFace
        subscribe(listener: () => void): () => void
      }
    }
  }
}

/** One stored entry found verbatim inside a restored draft. */
export interface PastedTextDraftHit {
  readonly entry: PastedTextEntry
  /** Inclusive start offset of the full text inside the draft. */
  readonly start: number
  /** Exclusive end offset. */
  readonly end: number
}

/**
 * Find a stored pasted-text entry whose full text appears verbatim in a
 * draft. The longest match wins so a longer entry is preferred over a
 * shorter one it contains.
 * @param store - pasted-text content store.
 * @param draft - the draft to scan.
 * @returns the match, or undefined when none of the stored texts appear.
 */
export function pastedTextHitOfDraft(
  store: PastedTextStore,
  draft: string,
): PastedTextDraftHit | undefined {
  if (draft === '') return undefined
  let best: PastedTextDraftHit | undefined
  for (const entry of store.list()) {
    // The host restores the SERIALIZED prompt on a failed send, and the
    // serialized form is `draft.trim()` — so a stored entry whose trailing
    // whitespace was trimmed no longer matches verbatim. Try the exact text
    // first, then its trimmed projection.
    const candidates = entry.text === '' ? [] : [entry.text, entry.text.trim()].filter((value, index, all) => value !== '' && all.indexOf(value) === index)
    for (const candidate of candidates) {
      const start = draft.indexOf(candidate)
      if (start < 0) continue
      const hit: PastedTextDraftHit = { entry, start, end: start + candidate.length }
      if (best === undefined || candidate.length > best.entry.text.length || (candidate.length === best.entry.text.length && best.end - best.start < hit.end - hit.start)) {
        best = hit
      }
    }
  }
  return best
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
  const draftWatchers = new Map<string, () => void>()
  const inputTriggers = ctx.get('inputTriggers' as never, false) as unknown as InputTriggerRegistryFace | undefined

  /**
   * Watch one session's input machine and re-mount a chip when the FULL text
   * comes back into the draft (the host restores the serialized prompt on a
   * failed send). The watcher is idle while any pasted-text occurrence is
   * already present, so the chip-only draft and the sent message never loop.
   */
  const watchDraft = (
    sessionId: string,
    actx: unknown,
    conversation: ConversationInputFace,
  ): void => {
    if (draftWatchers.has(sessionId)) return
    const input = conversation.input.for(actx)
    const stop = input.state.subscribe(() => {
      const snapshot = input.state.getSnapshot()
      if ((snapshot.occurrences ?? []).some(occurrence => occurrence.source === PASTED_TEXT_SOURCE)) return
      const hit = pastedTextHitOfDraft(store, snapshot.draft)
      if (hit === undefined) return
      const inserted = (actx as ScopedInputFace).bail(
        actx,
        'slash/input-insert-reference',
        {
          reference: {
            source: PASTED_TEXT_SOURCE,
            ref: hit.entry.id,
            label: chipLabel(),
            clipboardText: pastedTextClipboard(hit.entry.id),
          },
          span: {
            start: hit.start,
            end: hit.end,
            draftRev: snapshot.draftRev,
          },
        },
      )
      if (inserted !== true) return
      // Keep the watcher for future failed sends of the same session.
    })
    draftWatchers.set(sessionId, stop)
  }
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
    if (inserted === true) {
      watchDraft(sessionId, actx, conversation)
      return
    }
    // The trigger pipeline was absent or refused the span: fall back to a
    // short marker so the content is not lost and the chip row can still open
    // the stored text.
    try {
      const draft = snapshot.draft
      const marker = `[已粘贴文本:${id.slice(0, 8)}] `
      input.setDraft(`${draft.slice(0, start)}${marker}${draft.slice(end)}`)
      watchDraft(sessionId, actx, conversation)
    } catch {
      // Leave the paste cancelled; the stored entry is still reachable via the
      // dock only when an occurrence exists, so this is a true last resort.
    }
  }
  document.addEventListener('paste', onPaste, true)
  disposers.push(() => { document.removeEventListener('paste', onPaste, true) })
  return () => {
    for (const stop of [...draftWatchers.values()]) stop()
    draftWatchers.clear()
    for (const dispose of disposers.reverse()) dispose()
  }
}
