/**
 * Preview loading: which rendered form a path maps to, and how one preview
 * tab is assembled from the host's file reads. Kind selection is a pure
 * function of the path so the panel can label a tab before its bytes arrive;
 * the loader is the only place that decides between the text, binary, and
 * Office read paths.
 * @module dsh-web-enhanced/src/client/preview
 */

import type { PreviewKind, PreviewMode, PreviewTab, WebEnhancedRemote } from './contract.ts'

/** Extensions rendered as Markdown. */
const MARKDOWN = new Set(['md', 'markdown', 'mdx'])

/** Extensions rendered as sanitized HTML. */
const HTML = new Set(['html', 'htm'])

/** Extensions rendered as a unified diff. */
const DIFF = new Set(['diff', 'patch'])

/** Extensions rendered as a table. */
const CSV = new Set(['csv', 'tsv'])

/** Extensions rendered as an image. */
const IMAGE = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'])

/** Extensions converted by the host's Office reader. */
const OFFICE = new Set(['docx', 'xlsx'])

/** Extensions rendered with code affordances (syntax-shaped, monospace). */
const CODE = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'json', 'jsonc', 'yaml', 'yml', 'toml', 'ini',
  'css', 'scss', 'less', 'py', 'rs', 'go', 'java', 'kt', 'c', 'h', 'cc', 'cpp', 'hpp',
  'cs', 'rb', 'php', 'swift', 'sh', 'bash', 'zsh', 'fish', 'ps1', 'sql', 'graphql', 'vue',
  'svelte', 'xml', 'gradle', 'dockerfile', 'makefile',
])

/**
 * Lowercase extension of a path, without the dot.
 * @param path - workspace-relative path.
 * @returns the extension, or '' when the basename carries none.
 */
export function extensionOf(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1)
  const dot = name.lastIndexOf('.')
  // A leading dot is the whole name of a dotfile, not an extension separator.
  if (dot <= 0) return ''
  return name.slice(dot + 1).toLowerCase()
}

/**
 * Basename of a workspace-relative path.
 * @param path - workspace-relative path.
 * @returns the last segment.
 */
export function baseNameOf(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1)
}

/**
 * The rendered form a path maps to, decided from the path alone.
 * @param path - workspace-relative path.
 * @returns the preview kind; unknown extensions read as plain text.
 */
export function previewKindOf(path: string): PreviewKind {
  const name = baseNameOf(path).toLowerCase()
  const ext = extensionOf(path)
  if (MARKDOWN.has(ext)) return 'markdown'
  if (HTML.has(ext)) return 'html'
  if (DIFF.has(ext)) return 'diff'
  if (CSV.has(ext)) return 'csv'
  if (IMAGE.has(ext)) return 'image'
  if (OFFICE.has(ext)) return 'office'
  if (ext === 'pdf') return 'pdf'
  if (CODE.has(ext)) return 'code'
  // Extensionless build files are code by convention, not plain text.
  if (ext === '' && (name === 'dockerfile' || name === 'makefile')) return 'code'
  return 'text'
}

/**
 * Whether a kind has a rendered form distinct from its source text. Kinds
 * without one stay on `source` and hide the mode switch.
 * @param kind - the preview kind.
 * @returns true when `view` and `split` are meaningful.
 */
export function hasRenderedForm(kind: PreviewKind): boolean {
  return kind === 'markdown' || kind === 'html' || kind === 'csv' || kind === 'diff'
}

/**
 * Whether a kind's bytes are editable text the panel may save back.
 * @param kind - the preview kind.
 * @returns true for text-shaped kinds.
 */
export function isEditable(kind: PreviewKind): boolean {
  return kind !== 'image' && kind !== 'pdf' && kind !== 'office'
}

/** Initial render mode of a freshly opened tab. */
export function initialModeOf(kind: PreviewKind): PreviewMode {
  return hasRenderedForm(kind) ? 'view' : 'source'
}

/** MIME type used for an image path, from its extension. */
export function mimeOfImagePath(path: string): string {
  const ext = extensionOf(path)
  if (ext === 'svg') return 'image/svg+xml'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  return `image/${ext === '' ? 'png' : ext}`
}

/** Base64 payload of a binary read, as a data URL for `img`/`object`. */
export function dataUrlOf(tab: PreviewTab): string | undefined {
  if (tab.binary === undefined || tab.binary === '') return undefined
  const mime = tab.kind === 'pdf' ? 'application/pdf' : mimeOfImagePath(tab.path)
  return `data:${mime};base64,${tab.binary}`
}

/**
 * Load one file into a preview tab. Host failures land in the tab's `error`
 * field so the panel renders them in place instead of losing the tab.
 * @param remote - the web-enhanced remote facade.
 * @param workspaceId - owning workspace.
 * @param path - workspace-relative path.
 * @returns the assembled tab.
 */
export async function loadPreviewTab(
  remote: WebEnhancedRemote,
  workspaceId: string,
  path: string,
): Promise<PreviewTab> {
  const kind = previewKindOf(path)
  const base = { path, name: baseNameOf(path), kind, mode: initialModeOf(kind) } as const

  if (kind === 'office') {
    const preview = await remote.fsOfficePreview({ workspaceId, path })
    if ('error' in preview) {
      return { ...base, mode: 'source', error: preview.error.message, truncated: false, size: 0 }
    }
    return {
      ...base,
      mode: 'view',
      office: { kind: preview.kind, blocks: preview.blocks, truncated: preview.truncated },
      truncated: preview.truncated,
      size: 0,
    }
  }

  const read = await remote.fsRead({ workspaceId, path })
  if ('error' in read) {
    return { ...base, mode: 'source', error: read.error.message, truncated: false, size: 0 }
  }
  if (read.kind === 'binary') {
    return { ...base, mode: 'view', binary: read.content, truncated: read.truncated, size: read.size }
  }
  return { ...base, content: read.content, truncated: read.truncated, size: read.size }
}
