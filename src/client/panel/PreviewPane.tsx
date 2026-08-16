/**
 * Preview pane: a tab strip over open files, a source/split/preview mode
 * switch, and inline editing with save-back for text-shaped formats.
 *
 * Rendered forms are built from parsed structures into React elements — never
 * `dangerouslySetInnerHTML` — so file content cannot inject markup. HTML is
 * the one format with no structural rendering, and it goes into a sandboxed
 * iframe with no scripts and no same-origin access.
 * @module dsh-web-enhanced/src/client/panel/PreviewPane
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type { OfficeBlock, PreviewMode, PreviewTab, WebEnhancedProps, WebEnhancedRemote } from '../contract.ts'
import { dataUrlOf, extensionOf, hasRenderedForm, isEditable, mimeOfImagePath } from '../preview.ts'
import { activeTabOf } from '../stores.ts'
import { browserImageHref, diffLineKind, parseDelimited, parseMarkdown, workspaceImagePathOf } from './markdown.ts'
import type { MdBlock, MdSpan } from './markdown.ts'
import css from './PreviewPane.module.css'

/** Props of the preview pane. */
export type PreviewPaneProps = WebEnhancedProps<'conversation.view'> & { readonly workspaceId: string }

/** Mode buttons in display order. */
const MODES: ReadonlyArray<{ mode: PreviewMode; key: 'preview.mode.source' | 'preview.mode.split' | 'preview.mode.view' }> = [
  { mode: 'source', key: 'preview.mode.source' },
  { mode: 'split', key: 'preview.mode.split' },
  { mode: 'view', key: 'preview.mode.view' },
]

/** What Markdown image rendering needs to resolve workspace-relative sources. */
interface MarkdownImageContext {
  readonly tabPath: string
  readonly workspaceId: string
  readonly remote: WebEnhancedRemote
}

/** The preview pane. */
export function PreviewPane({
  workspaceId, usePreview, remote, focusTab, closeTab, setMode, setDraft, commitDraft, t,
}: PreviewPaneProps) {
  const tabs = usePreview(state => state.tabs)
  const active = usePreview(state => activeTabOf(state))
  const [saveError, setSaveError] = useState<string | null>(null)
  const live = useRef(true)

  const save = useCallback(async (tab: PreviewTab): Promise<void> => {
    if (tab.draft === undefined) return
    const result = await remote.fsWrite({ workspaceId, path: tab.path, content: tab.draft })
    if (!live.current) return
    if ('error' in result) {
      setSaveError(result.error.message)
      return
    }
    setSaveError(null)
    commitDraft(tab.path)
  }, [commitDraft, remote, workspaceId])

  if (tabs.length === 0 || active === undefined) {
    return <p className={css.empty} data-testid="preview-empty">{t('preview.empty')}</p>
  }

  const editable = isEditable(active.kind) && active.content !== undefined
  const dirty = active.draft !== undefined && active.draft !== active.content
  const body = active.draft ?? active.content ?? ''

  return (
    <div className={css.pane} data-testid="preview-pane">
      <div className={css.strip} role="tablist">
        {tabs.map(tab => (
          <span className={css.stripItem} key={tab.path} data-active={tab.path === active.path || undefined}>
            <button
              type="button"
              role="tab"
              className={css.stripName}
              aria-selected={tab.path === active.path}
              title={tab.path}
              onClick={() => { focusTab(tab.path) }}
            >
              {tab.name}
              {tab.draft !== undefined && tab.draft !== tab.content && <span className={css.dirty} aria-label={t('preview.dirty')}>•</span>}
            </button>
            <button
              type="button"
              className={css.stripClose}
              aria-label={t('preview.close')}
              onClick={() => { closeTab(tab.path) }}
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      <div className={css.toolbar}>
        {hasRenderedForm(active.kind) && MODES.map(entry => (
          <button
            key={entry.mode}
            type="button"
            className={css.mode}
            data-active={active.mode === entry.mode || undefined}
            data-testid={`preview-mode-${entry.mode}`}
            onClick={() => { setMode(active.path, entry.mode) }}
          >
            {t(entry.key)}
          </button>
        ))}
        {editable && (
          <button
            type="button"
            className={css.save}
            disabled={!dirty}
            data-testid="preview-save"
            onClick={() => { void save(active) }}
          >
            {t('preview.save')}
          </button>
        )}
        {active.truncated && <span className={css.notice}>{t('preview.truncated')}</span>}
      </div>

      {active.error !== undefined && (
        <p className={css.error} data-testid="preview-error">{t('preview.error', { message: active.error })}</p>
      )}
      {saveError !== null && <p className={css.error}>{t('preview.error', { message: saveError })}</p>}

      <div className={css.body} data-mode={active.mode}>
        {(active.mode === 'source' || active.mode === 'split') && editable && (
          <textarea
            className={css.editor}
            value={body}
            spellCheck={false}
            data-testid="preview-editor"
            onChange={event => { setDraft(active.path, event.target.value) }}
          />
        )}
        {(active.mode === 'source' || active.mode === 'split') && !editable && (
          <pre className={css.source}>{body}</pre>
        )}
        {(active.mode === 'view' || active.mode === 'split') && (
          <div className={css.view} data-testid="preview-view">
            <RenderedForm
              tab={active}
              text={body}
              unsupported={t('preview.unsupported')}
              image={{ tabPath: active.path, workspaceId, remote }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/** The rendered (non-source) form of one tab. */
function RenderedForm({
  tab, text, unsupported, image,
}: { tab: PreviewTab; text: string; unsupported: string; image: MarkdownImageContext }) {
  switch (tab.kind) {
    case 'markdown':
      return <MarkdownView source={text} image={image} />
    case 'csv':
      return <TableView rows={parseDelimited(text, extensionOf(tab.path) === 'tsv' ? '\t' : ',')} />
    case 'diff':
      return <DiffView source={text} />
    case 'html':
      // No scripts, no same-origin: a previewed page cannot reach the app.
      return <iframe className={css.frame} sandbox="" srcDoc={text} title={tab.name} />
    case 'image': {
      const src = dataUrlOf(tab)
      return src === undefined ? <p className={css.empty}>{unsupported}</p> : <img className={css.image} src={src} alt={tab.name} />
    }
    case 'pdf': {
      const src = dataUrlOf(tab)
      return src === undefined ? <p className={css.empty}>{unsupported}</p> : <object className={css.frame} data={src} type="application/pdf" aria-label={tab.name} />
    }
    case 'office':
      return tab.office === undefined
        ? <p className={css.empty}>{unsupported}</p>
        : <OfficeView blocks={tab.office.blocks} />
    case 'code':
    case 'text':
      return <pre className={css.source}>{text}</pre>
  }
}

/**
 * A workspace-relative Markdown image, read through the plugin's own `fsRead`
 * and rendered as a data URL. The host's read stays workspace-scoped, so this
 * loads exactly the same file an IDE resolves — and nothing outside the root.
 */
function WorkspaceImage({
  path, alt, workspaceId, remote,
}: { path: string; alt: string; workspaceId: string; remote: WebEnhancedRemote }) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    setUrl(null)
    setFailed(false)
    void remote.fsRead({ workspaceId, path }).then(result => {
      if (!live) return
      if ('error' in result) {
        setFailed(true)
        return
      }
      if (result.kind === 'binary') {
        if (result.content === '') {
          setFailed(true)
          return
        }
        setUrl(`data:${mimeOfImagePath(path)};base64,${result.content}`)
        return
      }
      // SVGs are text on disk even though they render as images.
      if (result.kind === 'text' && mimeOfImagePath(path) === 'image/svg+xml') {
        setUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(result.content)}`)
        return
      }
      setFailed(true)
    }, () => {
      if (live) setFailed(true)
    })
    return () => { live = false }
  }, [path, workspaceId, remote])

  if (failed) return <span className={css.inlineImageFallback}>{alt === '' ? path : alt}</span>
  if (url === null) return null
  return <img className={css.inlineImage} src={url} alt={alt} />
}

/** Inline spans as React elements. */
function Spans({ spans, image }: { spans: readonly MdSpan[]; image: MarkdownImageContext }): ReactNode {
  return spans.map((span, index) => {
    switch (span.type) {
      case 'code': return <code className={css.inlineCode} key={index}>{span.text}</code>
      case 'strong': return <strong key={index}>{span.text}</strong>
      case 'em': return <em key={index}>{span.text}</em>
      case 'del': return <del key={index}>{span.text}</del>
      case 'break': return <br key={index} />
      case 'image': {
        const external = browserImageHref(span.href)
        if (external !== undefined) {
          return <img className={css.inlineImage} key={index} src={external} alt={span.text} />
        }
        const path = workspaceImagePathOf(image.tabPath, span.href)
        if (path === undefined) {
          return <span className={css.inlineImageFallback} key={index}>{span.text}</span>
        }
        return (
          <WorkspaceImage
            key={index}
            path={path}
            alt={span.text}
            workspaceId={image.workspaceId}
            remote={image.remote}
          />
        )
      }
      // Previewed documents are untrusted: opening in a new context without
      // an opener keeps a link from reaching back into the app.
      case 'link': return <a key={index} href={span.href} target="_blank" rel="noreferrer noopener">{span.text}</a>
      case 'text': return <span key={index}>{span.text}</span>
    }
  })
}

/** A parsed Markdown or HTML table, with its per-column alignment. */
function MarkdownTable({
  block, image,
}: { block: Extract<MdBlock, { type: 'table' }>; image: MarkdownImageContext }) {
  return (
    <table className={css.table}>
      {block.header.length > 0 && (
        <thead>
          <tr>
            {block.header.map((cell, index) => (
              <th key={index} style={block.align[index] === undefined ? undefined : { textAlign: block.align[index] }}>
                <Spans spans={cell} image={image} />
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {block.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, index) => (
              <td key={index} style={block.align[index] === undefined ? undefined : { textAlign: block.align[index] }}>
                <Spans spans={cell} image={image} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Rendered Markdown blocks, shared by documents and nested list children. */
function Blocks({ blocks, image }: { blocks: readonly MdBlock[]; image: MarkdownImageContext }) {
  return blocks.map((block, index) => {
    switch (block.type) {
      case 'heading': {
        const Tag = `h${String(Math.min(block.level, 6))}` as 'h1'
        return <Tag key={index}><Spans spans={block.spans} image={image} /></Tag>
      }
      case 'paragraph': return <p key={index}><Spans spans={block.spans} image={image} /></p>
      case 'code': return <pre className={css.codeBlock} key={index} data-lang={block.lang}><code>{block.code}</code></pre>
      case 'quote': return <blockquote key={index}><Spans spans={block.spans} image={image} /></blockquote>
      case 'rule': return <hr key={index} />
      case 'table': return <MarkdownTable block={block} image={image} key={index} />
      case 'list': {
        const Tag = block.ordered ? 'ol' : 'ul'
        return (
          <Tag key={index} data-ordered={block.ordered ? 'true' : 'false'} start={block.ordered ? block.start : undefined}>
            {block.items.map((item, itemIndex) => (
              <li
                key={itemIndex}
                data-task={item.task === true ? 'true' : undefined}
                data-checked={item.task === true && item.checked ? 'true' : undefined}
              >
                {item.task === true
                  ? (
                    <label className={css.task}>
                      <input className={css.taskBox} type="checkbox" disabled checked={item.checked} />
                      <span className={css.taskText}><Spans spans={item.spans} image={image} /></span>
                    </label>
                  )
                  : <Spans spans={item.spans} image={image} />}
                {item.children.length > 0 && <Blocks blocks={item.children} image={image} />}
              </li>
            ))}
          </Tag>
        )
      }
    }
  })
}

/** Structural Markdown rendering. */
function MarkdownView({ source, image }: { source: string; image: MarkdownImageContext }) {
  return (
    <div className={css.markdown}>
      <Blocks blocks={parseMarkdown(source)} image={image} />
    </div>
  )
}

/** Delimited rows as a table; the first row is the header. */
function TableView({ rows }: { rows: readonly (readonly string[])[] }) {
  if (rows.length === 0) return null
  const [header, ...body] = rows
  return (
    <table className={css.table}>
      <thead>
        <tr>{header!.map((cell, index) => <th key={index}>{cell}</th>)}</tr>
      </thead>
      <tbody>
        {body.map((row, rowIndex) => (
          <tr key={rowIndex}>{row.map((cell, index) => <td key={index}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  )
}

/** Unified diff with per-line classes. */
function DiffView({ source }: { source: string }) {
  return (
    <pre className={css.diff}>
      {source.split(/\r?\n/u).map((line, index) => (
        <span className={css.diffLine} data-kind={diffLineKind(line)} key={index}>{line === '' ? ' ' : line}</span>
      ))}
    </pre>
  )
}

/** Office conversion blocks from the host. */
function OfficeView({ blocks }: { blocks: readonly OfficeBlock[] }) {
  return (
    <div className={css.markdown}>
      {blocks.map((block, index) => {
        if (block.type === 'table') {
          return <TableView key={index} rows={block.rows} />
        }
        switch (block.type) {
          case 'h1': return <h1 key={index}>{block.text}</h1>
          case 'h2': return <h2 key={index}>{block.text}</h2>
          case 'h3': return <h3 key={index}>{block.text}</h3>
          case 'li': return <li key={index}>{block.text}</li>
          case 'p': return <p key={index}>{block.text}</p>
        }
      })}
    </div>
  )
}
