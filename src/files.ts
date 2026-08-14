/**
 * Workspace file operations behind the web-enhanced gateway: bounded listing,
 * name search, read (size-capped, binary-sniffed), write, and delete. Every
 * path resolves against the workspace root and is rejected when it escapes it.
 * @module dsh-web-enhanced/src/files
 */

import { open, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { basename, join, resolve, sep } from 'node:path'
import type { FsEntryView, FsReadResult } from './types.ts'

/** Bounds shared by every file method (deployment config, not tunables). */
export interface FsLimits {
  readonly skipDirs: readonly string[]
  readonly readMaxBytes: number
  readonly writeMaxBytes: number
  readonly binaryMaxBytes: number
  readonly searchMaxDepth: number
  readonly searchMaxEntries: number
}

/**
 * Resolve a workspace-relative path and assert it stays inside the root.
 * @param root - canonical workspace root.
 * @param rel - forward-slash relative path; empty means the root itself.
 * @returns the resolved absolute path.
 * @throws when the path is absolute or traverses upward.
 */
export function resolveWithin(root: string, rel: string): string {
  if (rel.includes('\\')) throw new Error(`path '${rel}' must use forward slashes`)
  if (rel === '') return root
  if (rel.startsWith('/') || /^[A-Za-z]:[\\/]/u.test(rel)) throw new Error(`path '${rel}' must be relative`)
  const segments = rel.split('/')
  if (segments.some(segment => segment === '..' || segment === '.')) {
    throw new Error(`path '${rel}' must not contain '.' or '..' segments`)
  }
  const resolved = resolve(join(root, ...segments))
  /* v8 ignore next -- defensive: the segment check above already rejects traversal */
  if (resolved !== root && !resolved.startsWith(root + sep)) {
    throw new Error(`path '${rel}' escapes the workspace root`)
  }
  return resolved
}

/** Display form: workspace-relative with forward slashes. */
function displayPath(root: string, full: string): string {
  /* v8 ignore next -- callers always pass a path strictly inside the root */
  return full === root ? '' : full.slice(root.length + 1).split(sep).join('/')
}

/**
 * Directory-first, then name-ascending order. Pure: names are unique within
 * one directory, so the comparator never answers 0.
 * @param left - first entry.
 * @param right - second entry.
 * @returns -1 when left sorts first, 1 otherwise.
 */
export function compareFsEntries(left: FsEntryView, right: FsEntryView): number {
  if (left.kind !== right.kind) return left.kind === 'dir' ? -1 : 1
  return left.name < right.name ? -1 : 1
}

/** One directory listing, skipping `.git` and the configured skip dirs. */
export async function listDirectory(root: string, rel: string, limits: FsLimits): Promise<FsEntryView[]> {
  const dir = resolveWithin(root, rel)
  const entries = await readdir(dir, { withFileTypes: true })
  const out: FsEntryView[] = []
  for (const entry of entries) {
    if (entry.isDirectory() && (entry.name === '.git' || limits.skipDirs.includes(entry.name))) continue
    const full = join(dir, entry.name)
    const kind = entry.isDirectory() ? 'dir' : 'file'
    let size: number | undefined
    if (kind === 'file') {
      try {
        size = (await stat(full)).size
      } catch {
        // A vanished or unreadable entry still lists; size stays unknown.
      }
    }
    out.push({
      name: entry.name,
      path: displayPath(root, full),
      kind,
      ...(size === undefined ? {} : { size }),
    })
  }
  out.sort(compareFsEntries)
  return out
}

/** Recursive basename search with bounded depth and result count. */
export async function searchFiles(root: string, rel: string, query: string, limits: FsLimits): Promise<FsEntryView[]> {
  const needle = query.trim().toLowerCase()
  const out: FsEntryView[] = []
  const walk = async (dir: string, depth: number): Promise<void> => {
    if (depth > limits.searchMaxDepth || out.length >= limits.searchMaxEntries) return
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (out.length >= limits.searchMaxEntries) return
      if (entry.name === '.git') continue
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (limits.skipDirs.includes(entry.name)) continue
        if (needle === '' || entry.name.toLowerCase().includes(needle)) {
          out.push({ name: entry.name, path: displayPath(root, full), kind: 'dir' })
        }
        await walk(full, depth + 1)
      } else if (needle === '' || entry.name.toLowerCase().includes(needle)) {
        let size: number | undefined
        try {
          size = (await stat(full)).size
        } catch {
          // Vanished entries still match; size stays unknown.
        }
        /* v8 ignore next -- the vanished-entry stat failure above is the only way size stays undefined */
        out.push({
          name: entry.name,
          path: displayPath(root, full),
          kind: 'file',
          ...(size === undefined ? {} : { size }),
        })
      }
    }
  }
  await walk(resolveWithin(root, rel), 0)
  return out
}

/**
 * Read one file: text (capped, truncated flag) or binary (base64 when small
 * enough for preview). Binary detection sniffs the first 8 KiB for a NUL.
 */
export async function readFileView(root: string, rel: string, limits: FsLimits): Promise<FsReadResult> {
  const full = resolveWithin(root, rel)
  const info = await stat(full)
  if (info.isDirectory()) return { error: { code: 'is-directory', message: `path '${rel}' is a directory` } }
  const handle = await open(full, 'r')
  try {
    const sniff = Buffer.alloc(8192)
    const sniffed = await handle.read(sniff, 0, 8192, 0)
    const binary = sniffed.bytesRead > 0 && sniff.subarray(0, sniffed.bytesRead).includes(0)
    if (binary) {
      if (info.size > limits.binaryMaxBytes) {
        return { kind: 'binary', content: '', truncated: true, size: info.size }
      }
      const whole = Buffer.alloc(info.size)
      await handle.read(whole, 0, info.size, 0)
      return { kind: 'binary', content: whole.toString('base64'), truncated: false, size: info.size }
    }
    const max = Math.min(info.size, limits.readMaxBytes)
    const buf = Buffer.alloc(max)
    await handle.read(buf, 0, max, 0)
    return { kind: 'text', content: buf.toString('utf8'), truncated: max < info.size, size: info.size }
  } finally {
    await handle.close()
  }
}

/** Write one UTF-8 text file (capped). */
export async function writeFileView(root: string, rel: string, content: string, limits: FsLimits): Promise<void> {
  const full = resolveWithin(root, rel)
  const bytes = Buffer.byteLength(content, 'utf8')
  if (bytes > limits.writeMaxBytes) {
    throw new Error(`content is ${bytes} bytes, over the ${limits.writeMaxBytes} byte cap`)
  }
  await writeFile(full, content, 'utf8')
}

/** Delete one file (never a directory). */
export async function deleteFileView(root: string, rel: string): Promise<void> {
  const full = resolveWithin(root, rel)
  const info = await stat(full)
  if (info.isDirectory()) throw new Error(`path '${rel}' is a directory`)
  await rm(full)
}

/** Basename of a workspace-relative path (client display helper). */
export function entryName(rel: string): string {
  return rel === '' ? '' : basename(rel.replaceAll('\\', '/'))
}
