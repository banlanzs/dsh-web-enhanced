/**
 * Host-wide directory browsing: the listing behind the mention browser.
 *
 * Deliberately NOT workspace-scoped — a mention names a path, and the path may
 * sit anywhere — so these tests pin what it returns and what it refuses.
 * @module dsh-web-enhanced/tests/browse
 */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { browseDirectory } from '../src/browse.ts'

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

async function fixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'web-enhanced-browse-'))
  roots.push(root)
  await mkdir(join(root, 'zeta'))
  await mkdir(join(root, 'alpha'))
  await writeFile(join(root, 'b.txt'), 'bb')
  await writeFile(join(root, 'a.txt'), 'a')
  return root
}

describe('browseDirectory', () => {
  it('lists directories first, then files, each name-sorted, with absolute paths', async () => {
    const root = await fixture()
    const view = await browseDirectory(root, { maxEntries: 100 })
    expect(view.entries.map(entry => [entry.kind, entry.name])).toEqual([
      ['dir', 'alpha'], ['dir', 'zeta'], ['file', 'a.txt'], ['file', 'b.txt'],
    ])
    // The client never joins path segments itself.
    expect(view.entries[0]!.path).toBe(join(root, 'alpha'))
    expect(view.entries.find(entry => entry.name === 'b.txt')?.size).toBe(2)
    expect(view.path).toBe(root)
    expect(view.parent).toBe(dirname(root))
    expect(view.truncated).toBe(false)
  })

  it('starts at the host home when no path is given', async () => {
    const view = await browseDirectory(undefined, { maxEntries: 5 })
    expect(view.path).toBe(homedir())
    expect(view.home).toBe(homedir())
    const blank = await browseDirectory('   ', { maxEntries: 5 })
    expect(blank.path).toBe(homedir())
  })

  it('reports truncation at the entry cap instead of silently cutting', async () => {
    const root = await fixture()
    const view = await browseDirectory(root, { maxEntries: 2 })
    expect(view.entries).toHaveLength(2)
    expect(view.truncated).toBe(true)
  })

  it('refuses a file and a path that does not exist', async () => {
    const root = await fixture()
    await expect(browseDirectory(join(root, 'a.txt'), { maxEntries: 5 }))
      .rejects.toThrow('is not a directory')
    await expect(browseDirectory(join(root, 'nope'), { maxEntries: 5 })).rejects.toThrow()
  })
})
