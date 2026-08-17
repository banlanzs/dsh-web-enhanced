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

import { memo, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { ChatNodeViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace } from '@deepseek-ai/dsh-client-ui-slots'
import type { Translate } from '../locale-keys.ts'
import { pastedTextHitOfDraft } from './apply.ts'
import type { PastedTextDraftHit } from './apply.ts'
import { pastedTextPreview } from './store.ts'
import type { PastedTextEntry, PastedTextStore } from './store.ts'
import css from './PastedTextUserNodeView.module.css'

/** Injected business face of the transcript renderer. */
export interface PastedTextUserNodeInjected {
  readonly store: PastedTextStore
}

/** Content blocks this renderer understands, structurally. */
interface ContentBlockFace {
  readonly type?: unknown
  readonly text?: unknown
  readonly attachment?: unknown
}

/** Full props of the shadowing user-node renderer. */
export type PastedTextUserNodeProps =
  Omit<ChatNodeViewProps<'user'>, 't'>
  & InjectFace<PastedTextUserNodeInjected>
  & { readonly t: Translate }

/** Image block with an async loader, rendered as a small thumbnail. */
function TranscriptImage({ attachment, loadImage }: {
  attachment: unknown
  loadImage: ChatNodeViewProps<'user'>['loadImage']
}) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    void loadImage(attachment as never).then(next => { if (live) setSrc(next) })
    return () => { live = false }
  }, [attachment, loadImage])
  if (src === null) return null
  // Anchor the loaded source so the image stays clickable/openable exactly
  // like the host gallery, without re-importing the host's private renderer.
  return (
    <a className={css.imageLink} href={src} target="_blank" rel="noreferrer">
      <img className={css.image} src={src} alt="" />
    </a>
  )
}

/** Small copy action replacing the host MessageIconActions copy button. */
function CopyButton({ text, t }: { text: string; t: Translate }) {
  const [copied, setCopied] = useState(false)
  const copy = (): void => {
    if (text === '') return
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      window.setTimeout(() => { setCopied(false) }, 1500)
    })
  }
  return (
    <button type="button" className={css.copy} title={t('pastedText.copy')} onClick={copy}>
      {copied ? t('pastedText.copied') : t('pastedText.copy')}
    </button>
  )
}

/** One collapsed pasted-text chip in the transcript, with a preview/edit modal. */
function PastedTextChip({ hit, store, t }: {
  hit: PastedTextDraftHit
  store: PastedTextStore
  t: Translate
}): ReactNode {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [, setTick] = useState(0)
  const openEditor = (): void => {
    setDraft(store.get(hit.entry.id)?.text ?? hit.entry.text)
    setOpen(true)
  }
  const save = (): void => {
    if (draft.trim() !== '') store.set(hit.entry.id, draft)
    setTick(current => current + 1)
    setOpen(false)
  }
  return (
    <>
      <button
        type="button"
        className={css.transcriptChip}
        title={t('pastedText.chipHint')}
        onClick={openEditor}
      >
        <span className={css.icon} aria-hidden="true">📄</span>
        <span className={css.label}>{t('pastedText.label')}</span>
        <span className={css.preview}>{pastedTextPreview(store.get(hit.entry.id)?.text ?? hit.entry.text)}</span>
      </button>
      <Modal
        open={open}
        onClose={() => { setOpen(false) }}
        title={t('pastedText.title')}
        closeLabel={t('pastedText.close')}
        description={t('pastedText.description')}
        className={css.dialog}
        contentClassName={css.dialogContent}
        footer={(
          <>
            <Button variant="outline" onClick={() => { setOpen(false) }}>{t('pastedText.cancel')}</Button>
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
    </>
  )
}

/** Text/block projection shared by the two transcript presentations. */
function contentOf(content: readonly unknown[]): { text: string; blocks: readonly unknown[] } {
  let text = ''
  const blocks: unknown[] = []
  for (const raw of content) {
    const block = raw as ContentBlockFace
    if (block.type === 'text' && typeof block.text === 'string') text += block.text
    else blocks.push(raw)
  }
  return { text, blocks }
}

/** Plain fallback bubble for user messages that contain no pasted-text span. */
function PlainUserBubble({ content, loadImage, t }: {
  content: readonly unknown[]
  loadImage: ChatNodeViewProps<'user'>['loadImage']
  t: Translate
}): ReactNode {
  const { text, blocks } = contentOf(content)
  return (
    <div className={css.userRow} data-time-hover-root>
      <div className={css.userStack}>
        {blocks.map((block, index) => {
          const face = block as { type?: unknown; attachment?: unknown }
          return face.type === 'image'
            ? <TranscriptImage key={index} attachment={face.attachment} loadImage={loadImage} />
            : <pre key={index} className={css.extraBlock}>{JSON.stringify(block, null, 2)}</pre>
        })}
        {text !== '' && <div className={css.bubble}>{text}</div>}
      </div>
      <CopyButton text={text} t={t} />
    </div>
  )
}

/** The user-node renderer registered at priority -1. */
export const PastedTextUserNodeView = memo(function PastedTextUserNodeView({
  node, loadImage, store, t,
}: PastedTextUserNodeProps): ReactNode {
  const content = node.data.content as readonly unknown[]
  const { text, blocks } = contentOf(content)
  const hit = pastedTextHitOfDraft(store, text)
  if (hit === undefined) {
    return <PlainUserBubble content={content} loadImage={loadImage} t={t} />
  }
  return (
    <div className={css.userRow} data-time-hover-root>
      <div className={css.userStack}>
        {blocks.map((block, index) => {
          const face = block as { type?: unknown; attachment?: unknown }
          return face.type === 'image'
            ? <TranscriptImage key={index} attachment={face.attachment} loadImage={loadImage} />
            : <pre key={index} className={css.extraBlock}>{JSON.stringify(block, null, 2)}</pre>
        })}
        {text !== '' && (
          <div className={css.bubble}>
            {hit.start > 0 ? <span>{text.slice(0, hit.start)}</span> : null}
            <PastedTextChip hit={hit} store={store} t={t} />
            {hit.end < text.length ? <span>{text.slice(hit.end)}</span> : null}
          </div>
        )}
      </div>
      <CopyButton text={text} t={t} />
    </div>
  )
})
