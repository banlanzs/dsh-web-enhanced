/**
 * Filesystem browsing outside the workspace.
 *
 * Every other fs capability of this plugin is workspace-scoped and refuses
 * absolute paths — that guard is what keeps file READS inside the project. A
 * mention is a different need: the path the user wants may sit anywhere on the
 * host, and what the composer receives is a STRING, not the bytes. So this
 * module lists directories anywhere and returns nothing but names, kinds, and
 * sizes; reading, writing, and previewing stay behind the workspace root.
 * @module dsh-web-enhanced/src/browse
 */

import { readdir, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import type { FsBrowseEntry, FsBrowseView } from './types.ts'

/** Listing bound for one browse level (deployment config, not a tunable). */
export interface BrowseLimits {
  readonly maxEntries: number
}

/**
 * The filesystem roots a browser may jump to.
 *
 * POSIX has exactly one and walking up reaches it, so the list is empty
 * there — an affordance that only ever offers `/` is noise. Windows has one
 * root PER DRIVE with no common ancestor above them, so walking up from
 * `C:\Users\me` dead-ends at `C:\` and no other drive is reachable by
 * navigation at all. These jump targets are the only way across.
 *
 * The drives are probed rather than enumerated: Node exposes no drive list
 * without a native binding. The 26 probes run concurrently, so the cost is
 * the slowest one — which for a disconnected network letter can still be a
 * second or two.
 * @returns the roots, or an empty list on POSIX.
 */
export async function filesystemRoots(): Promise<string[]> {
  if (process.platform !== 'win32') return []
  const letters = Array.from({ length: 26 }, (_unused, index) => String.fromCharCode(65 + index))
  const probed = await Promise.all(letters.map(async (letter) => {
    const root = `${letter}:\\`
    try {
      return (await stat(root)).isDirectory() ? root : undefined
    } catch {
      return undefined
    }
  }))
  return probed.filter((root): root is string => root !== undefined)
}

/**
 * List one absolute directory: subdirectories first, then files, each
 * name-sorted.
 * @param path - absolute directory; omitted or blank lists the host home.
 * @param limits - entry cap.
 * @returns the level, its parent, the host home, and the filesystem roots.
 * @throws when the path does not exist or is not a directory.
 */
export async function browseDirectory(
  path: string | undefined,
  limits: BrowseLimits,
): Promise<FsBrowseView> {
  const home = homedir()
  const target = path === undefined || path.trim() === '' ? home : resolve(path)
  if (!(await stat(target)).isDirectory()) {
    throw new Error(`'${target}' is not a directory`)
  }
  const [dirents, roots] = await Promise.all([
    readdir(target, { withFileTypes: true }),
    filesystemRoots(),
  ])
  const dirs: FsBrowseEntry[] = []
  const files: FsBrowseEntry[] = []
  let truncated = false
  for (const dirent of dirents) {
    if (dirs.length + files.length >= limits.maxEntries) {
      truncated = true
      break
    }
    const full = join(target, dirent.name)
    if (dirent.isDirectory()) {
      dirs.push({ name: dirent.name, path: full, kind: 'dir' })
      continue
    }
    // A symlink reports neither directory nor file until it is followed; an
    // unreadable or dangling one is simply skipped rather than failing the level.
    if (!dirent.isFile() && !dirent.isSymbolicLink()) continue
    let size: number | undefined
    try {
      const stats = await stat(full)
      if (stats.isDirectory()) {
        dirs.push({ name: dirent.name, path: full, kind: 'dir' })
        continue
      }
      size = stats.size
    } catch {
      // A vanished or unreadable entry still exists as a name to mention.
    }
    files.push({ name: dirent.name, path: full, kind: 'file', ...size === undefined ? {} : { size } })
  }
  const byName = (left: FsBrowseEntry, right: FsBrowseEntry): number =>
    left.name < right.name ? -1 : left.name > right.name ? 1 : 0
  dirs.sort(byName)
  files.sort(byName)
  const parent = dirname(target)
  return {
    path: target,
    // At a filesystem root `dirname` returns the path itself, which would
    // render an "up" affordance that goes nowhere.
    parent: parent === target ? null : parent,
    home,
    roots,
    entries: [...dirs, ...files],
    truncated,
  }
}
