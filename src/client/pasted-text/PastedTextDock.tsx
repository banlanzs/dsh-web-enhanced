/**
 * The composer's pasted-text chips: one row above the input card, exactly
 * where the conversation dock sits. Each chip is a reference occurrence the
 * paste interceptor inserted; clicking opens a modal editor, removing drops
 * the occurrence (and therefore the U+FFFC placeholder) from the draft.
 * @module dsh-web-enhanced/src/client/pasted-text/PastedTextDock
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the conversation.input.dock SlotMap merge into this program.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { pastedTextPreview, PASTED_TEXT_SOURCE } from './store.ts'
import type { PastedTextStore } from './store.ts'
import type { PastedTextSpan } from './apply.ts'
import css from './PastedTextDock.module.css'

/** One reference occurrence, narrowed to the fields the dock reads. */
export interface PastedTextOccurrence {
  readonly occurrenceId: number
  readonly source: string
  readonly ref: string
  readonly offset: number
  readonly label: string
  readonly clipboardText: string
  readonly invalid?: boolean
}

/** Injected face of the pasted-text dock registration. */
export interface PastedTextDockInjected {
  readonly store: PastedTextStore
  /** Remove one reference occurrence from the draft (a U+FFFC span, CAS'd). */
  readonly remove: (span: PastedTextSpan) => void
}

/** Full composed props of the pasted-text dock. */
export type PastedTextDockProps =
  PropsRuntime<'conversation.input.dock'>
  & InjectFace<PastedTextDockInjected>
  & PropsLocale<'webEnhanced'>

/** The pasted-text chips; renders nothing while the draft holds none. */
export function PastedTextDock({ input, store, remove, t }: PastedTextDockProps): ReactNode {
  const [editing, setEditing] = useState<PastedTextOccurrence | null>(null)
  const [draft, setDraft] = useState('')
  const [, setTick] = useState(0)
  const chips = (input?.occurrences ?? []).filter(
    occurrence => occurrence.source === PASTED_TEXT_SOURCE && occurrence.invalid !== true,
  )
  if (chips.length === 0) return null

  const openEditor = (occurrence: PastedTextOccurrence): void => {
    setDraft(store.get(occurrence.ref)?.text ?? '')
    setEditing(occurrence)
  }
  const closeEditor = (): void => { setEditing(null) }
  const save = (): void => {
    if (editing === null) return
    if (draft.trim() !== '') store.set(editing.ref, draft)
    setTick(current => current + 1)
    setEditing(null)
  }
  const removeChip = (occurrence: PastedTextOccurrence): void => {
    store.remove(occurrence.ref)
    remove({ start: occurrence.offset, end: occurrence.offset + 1, draftRev: input.draftRev })
    if (editing?.occurrenceId === occurrence.occurrenceId) setEditing(null)
  }

  return (
    <div className={css.rail} data-testid="pasted-text-rail">
      {chips.map((occurrence, index) => {
        const entry = store.get(occurrence.ref)
        return (
          <span className={css.chip} key={occurrence.occurrenceId}>
            <button
              type="button"
              className={css.open}
              data-testid={`pasted-text-chip-${index}`}
              title={t('pastedText.chipHint')}
              onClick={() => { openEditor(occurrence) }}
            >
              <span className={css.icon} aria-hidden="true">📄</span>
              <span className={css.label}>{occurrence.label}</span>
              {entry !== undefined ? <span className={css.preview}>{pastedTextPreview(entry.text)}</span> : null}
            </button>
            <button
              type="button"
              className={css.remove}
              aria-label={t('pastedText.remove')}
              data-testid={`pasted-text-remove-${index}`}
              onClick={() => { removeChip(occurrence) }}
            >
              ×
            </button>
          </span>
        )
      })}
      <Modal
        open={editing !== null}
        onClose={closeEditor}
        title={t('pastedText.title')}
        closeLabel={t('pastedText.close')}
        description={t('pastedText.description')}
        className={css.dialog}
        contentClassName={css.dialogContent}
        footer={(
          <>
            <Button variant="outline" onClick={closeEditor}>{t('pastedText.cancel')}</Button>
            <Button
              variant="outline"
              onClick={() => { removeChip(editing as PastedTextOccurrence) }}
              className={css.danger}
              disabled={editing === null}
            >
              {t('pastedText.removeChip')}
            </Button>
            <Button onClick={save} disabled={draft.trim() === ''}>{t('pastedText.save')}</Button>
          </>
        )}
      >
        <textarea
          className={css.editor}
          value={draft}
          aria-label={t('pastedText.title')}
          spellCheck={false}
          onChange={event => { setDraft(event.target.value) }}
        />
      </Modal>
    </div>
  )
}
