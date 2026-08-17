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

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { ChatNodeViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import { ImageGallery } from '@deepseek-ai/dsh-client-ui-attachment'
import type { ImageGalleryLabelsFace } from '@deepseek-ai/dsh-client-ui-attachment'
import {
  Button, IconCheckOutline16, IconCopyOutline16, Modal, Tooltip, writeClipboard,
} from '@deepseek-ai/dsh-client-ui-primitives'
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

/** Host-style image group: the same attachment gallery the original user bubble used. */
function imageLabels(t: Translate): ImageGalleryLabelsFace {
  return {
    image: t('pastedText.image'),
    open: t('pastedText.imageOpen'),
    openNamed: label => label || t('pastedText.image'),
    loading: t('pastedText.imageLoading'),
    loadFailed: t('pastedText.imageLoadFailed'),
    lightbox: { dialog: t('pastedText.lightboxDialog'), close: t('pastedText.lightboxClose') },
  }
}

/** Host-style copy action: outline icon with the same success-check swap. */
function CopyButton({ text, t }: { text: string; t: Translate }) {
  const [copied, setCopied] = useState(false)
  const pending = useRef(false)
  const timer = useRef<number | null>(null)
  const epoch = useRef(0)
  useEffect(() => () => {
    epoch.current += 1
    pending.current = false
    if (timer.current !== null) clearTimeout(timer.current)
  }, [])
  const onCopy = useCallback(() => {
    if (copied || pending.current) return
    const current = epoch.current
    pending.current = true
    void writeClipboard(text).then((ok) => {
      if (current !== epoch.current) return
      pending.current = false
      if (!ok) return
      setCopied(true)
      timer.current = window.setTimeout(() => {
        timer.current = null
        setCopied(false)
      }, 1000)
    })
  }, [copied, text])
  return (
    <Tooltip label={copied ? t('pastedText.copied') : t('pastedText.copy')} side="bottom">
      <button type="button" className={css.copyAction} aria-label={copied ? t('pastedText.copied') : t('pastedText.copy')} onClick={onCopy}>
        {copied ? <IconCheckOutline16 /> : <IconCopyOutline16 />}
      </button>
    </Tooltip>
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

/** Text/image/other projection shared by the two transcript presentations. */
function contentParts(content: readonly unknown[]): {
  text: string
  images: readonly { attachment: unknown }[]
  rest: readonly unknown[]
} {
  let text = ''
  const images: { attachment: unknown }[] = []
  const rest: unknown[] = []
  for (const raw of content) {
    const block = raw as ContentBlockFace
    if (block.type === 'text' && typeof block.text === 'string') text += block.text
    else if (block.type === 'image' && block.attachment !== undefined) images.push({ attachment: block.attachment })
    else rest.push(raw)
  }
  return { text, images, rest }
}

/** Plain fallback bubble for user messages that contain no pasted-text span. */
function PlainUserBubble({ content, loadImage, t }: {
  content: readonly unknown[]
  loadImage: ChatNodeViewProps<'user'>['loadImage']
  t: Translate
}): ReactNode {
  const { text, images, rest } = contentParts(content)
  return (
    <div className={css.userRow} data-time-hover-root>
      <div className={css.userStack}>
        <ImageGallery images={images} load={loadImage as never} align="end" labels={imageLabels(t)} />
        {text !== '' && <div className={css.bubble}>{text}</div>}
        {rest.map((block, index) => <pre key={index} className={css.extraBlock}>{JSON.stringify(block, null, 2)}</pre>)}
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
  const { text, images, rest } = contentParts(content)
  const hit = pastedTextHitOfDraft(store, text)
  if (hit === undefined) {
    return <PlainUserBubble content={content} loadImage={loadImage} t={t} />
  }
  return (
    <div className={css.userRow} data-time-hover-root>
      <div className={css.userStack}>
        <ImageGallery images={images} load={loadImage as never} align="end" labels={imageLabels(t)} />
        {text !== '' && (
          <div className={css.bubble}>
            {hit.start > 0 ? <span>{text.slice(0, hit.start)}</span> : null}
            <PastedTextChip hit={hit} store={store} t={t} />
            {hit.end < text.length ? <span>{text.slice(hit.end)}</span> : null}
          </div>
        )}
        {rest.map((block, index) => <pre key={index} className={css.extraBlock}>{JSON.stringify(block, null, 2)}</pre>)}
      </div>
      <CopyButton text={text} t={t} />
    </div>
  )
})
