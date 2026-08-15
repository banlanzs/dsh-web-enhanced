import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  compareFsEntries, countTextLines, deleteFileView, entryName, listDirectory, readFileView, resolveWithin, searchFiles, writeFileView,
} from '../src/files.ts'
import type { FsLimits } from '../src/files.ts'

const limits: FsLimits = {
  skipDirs: ['node_modules'],
  readMaxBytes: 16,
  writeMaxBytes: 64,
  binaryMaxBytes: 32,
  searchMaxDepth: 3,
  searchMaxEntries: 10,
}

const roots: string[] = []
async function tempRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'web-enhanced-fs-'))
  roots.push(root)
  return root
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

describe('resolveWithin', () => {
  it('resolves the root and nested relative paths', () => {
    const root = join('C:', 'ws')
    expect(resolveWithin(root, '')).toBe(root)
    expect(resolveWithin(root, 'a/b.txt')).toBe(join(root, 'a', 'b.txt'))
  })

  it('rejects backslashes, absolute paths, and dot segments', () => {
    const root = join('C:', 'ws')
    expect(() => resolveWithin(root, 'a\\b')).toThrow(/forward slashes/)
    expect(() => resolveWithin(root, '/abs')).toThrow(/must be relative/)
    expect(() => resolveWithin(root, 'C:/abs')).toThrow(/must be relative/)
    expect(() => resolveWithin(root, 'a/../b')).toThrow(/must not contain/)
    expect(() => resolveWithin(root, './a')).toThrow(/must not contain/)
  })

  it('rejects traversal paths at the segment check', () => {
    expect(() => resolveWithin(join('C:', 'ws'), 'a/../../other')).toThrow(/must not contain/)
  })
})

describe('listDirectory', () => {
  it('lists files and dirs with sizes, skipping .git and configured skip dirs, sorted dirs-first', async () => {
    const root = await tempRoot()
    await mkdir(join(root, 'zdir'))
    await mkdir(join(root, '.git'))
    await mkdir(join(root, 'node_modules'))
    await writeFile(join(root, 'b.txt'), 'b')
    await writeFile(join(root, 'a.txt'), 'hello')
    await writeFile(join(root, 'zdir', 'c.txt'), 'x')
    const entries = await listDirectory(root, '', limits)
    expect(entries.map(entry => entry.name)).toEqual(['zdir', 'a.txt', 'b.txt'])
    expect(entries[0]).toMatchObject({ path: 'zdir', kind: 'dir' })
    expect(entries[1]).toMatchObject({ path: 'a.txt', kind: 'file', size: 5 })
    expect(entries[2]).toMatchObject({ path: 'b.txt', kind: 'file', size: 1 })
  })

  it('compares entries directory-first and name-ascending in both directions', () => {
    const dirA = { name: 'a-dir', path: 'a-dir', kind: 'dir' as const }
    const dirB = { name: 'b-dir', path: 'b-dir', kind: 'dir' as const }
    const fileA = { name: 'a.txt', path: 'a.txt', kind: 'file' as const, size: 1 }
    const fileB = { name: 'b.txt', path: 'b.txt', kind: 'file' as const, size: 1 }
    expect(compareFsEntries(dirA, fileA)).toBe(-1)
    expect(compareFsEntries(fileA, dirA)).toBe(1)
    expect(compareFsEntries(fileA, fileB)).toBe(-1)
    expect(compareFsEntries(fileB, fileA)).toBe(1)
    expect(compareFsEntries(dirA, dirB)).toBe(-1)
  })
})

describe('searchFiles', () => {
  it('finds basename matches case-insensitively, skipping .git and skip dirs', async () => {
    const root = await tempRoot()
    await mkdir(join(root, 'src'))
    await mkdir(join(root, 'node_modules'))
    await mkdir(join(root, '.git'))
    await writeFile(join(root, 'src', 'DemoFile.ts'), 'x')
    await writeFile(join(root, 'src', 'other.txt'), 'x')
    await writeFile(join(root, 'node_modules', 'demo.txt'), 'x')
    const entries = await searchFiles(root, '', 'DEMO', limits)
    expect(entries.map(entry => entry.path)).toEqual(['src/DemoFile.ts'])
  })

  it('lists a level’s files before descending, so root documents survive the entry cap', async () => {
    // The old DFS order let the first subdirectory consume the whole cap, so
    // a root TODO.md / README beyond seat 200 was unreachable in the mention
    // picker. Files first (name-sorted) makes those entries deterministic.
    const root = await tempRoot()
    await mkdir(join(root, 'z-dir', 'nested'), { recursive: true })
    await writeFile(join(root, 'z-dir', 'nested', 'deep.txt'), 'x')
    await writeFile(join(root, 'a.txt'), 'x')
    await writeFile(join(root, 'todo.md'), 'x')
    const capped = await searchFiles(root, '', '', { ...limits, searchMaxEntries: 2 })
    expect(capped.map(entry => entry.path)).toEqual(['a.txt', 'todo.md'])
  })

  it('walks subdirectories and matches directory names', async () => {
    const root = await tempRoot()
    await mkdir(join(root, 'docs', 'guide'), { recursive: true })
    await writeFile(join(root, 'docs', 'guide', 'README.md'), 'x')
    const entries = await searchFiles(root, '', '', limits)
    expect(entries.some(entry => entry.path === 'docs')).toBe(true)
    expect(entries.some(entry => entry.path === 'docs/guide/README.md')).toBe(true)
  })

  it('bounded by depth and entry count', async () => {
    const root = await tempRoot()
    await mkdir(join(root, 'a', 'b', 'c', 'd', 'e'), { recursive: true })
    await writeFile(join(root, 'a', 'b', 'c', 'd', 'e', 'deep.txt'), 'x')
    const shallow = await searchFiles(root, '', 'deep', limits)
    expect(shallow.length).toBe(0)
    for (let index = 0; index < 12; index++) await writeFile(join(root, `f${index}.txt`), 'x')
    const capped = await searchFiles(root, '', 'f', limits)
    expect(capped.length).toBe(10)
  })
})

describe('readFileView', () => {
  it('reads text files and truncates over the cap', async () => {
    const root = await tempRoot()
    await writeFile(join(root, 't.txt'), 'a'.repeat(20))
    const full = await readFileView(root, 't.txt', { ...limits, readMaxBytes: 64 })
    expect(full).toMatchObject({ kind: 'text', truncated: false, size: 20 })
    const capped = await readFileView(root, 't.txt', limits)
    expect(capped).toMatchObject({ kind: 'text', truncated: true, size: 20 })
    if (capped.kind === 'text') expect(capped.content.length).toBe(16)
  })

  it('returns binary content as base64 when small enough and empty when oversized', async () => {
    const root = await tempRoot()
    await writeFile(join(root, 'b.bin'), Buffer.from([1, 0, 2, 3]))
    const small = await readFileView(root, 'b.bin', { ...limits, binaryMaxBytes: 64 })
    expect(small).toMatchObject({ kind: 'binary', truncated: false, size: 4 })
    if (small.kind === 'binary') expect(Buffer.from(small.content, 'base64')[1]).toBe(0)
    await writeFile(join(root, 'big.bin'), Buffer.from([1, 0, ...Array(40).fill(2)]))
    const big = await readFileView(root, 'big.bin', limits)
    expect(big).toMatchObject({ kind: 'binary', truncated: true, size: 42 })
    if (big.kind === 'binary') expect(big.content).toBe('')
  })

  it('rejects directories and surfaces missing files as errors', async () => {
    const root = await tempRoot()
    await mkdir(join(root, 'dir'))
    expect(await readFileView(root, 'dir', limits)).toEqual({
      error: { code: 'is-directory', message: "path 'dir' is a directory" },
    })
    await expect(readFileView(root, 'missing.txt', limits)).rejects.toMatchObject({ code: 'ENOENT' })
  })
})

describe('writeFileView / deleteFileView', () => {
  it('writes UTF-8 content and rejects oversized content', async () => {
    const root = await tempRoot()
    await writeFileView(root, 'out.txt', 'hello', limits)
    await expect(writeFileView(root, 'big.txt', 'x'.repeat(65), limits)).rejects.toThrow(/cap/)
  })

  it('deletes files but never directories', async () => {
    const root = await tempRoot()
    await writeFile(join(root, 'gone.txt'), 'x')
    await deleteFileView(root, 'gone.txt')
    await mkdir(join(root, 'dir'))
    await expect(deleteFileView(root, 'dir')).rejects.toThrow(/directory/)
  })
})

describe('countTextLines', () => {
  it('counts the way git does and answers null when the number would be a guess', async () => {
    const root = await tempRoot()
    await writeFile(join(root, 'trailing.txt'), 'a\nb\n')
    await writeFile(join(root, 'no-trailing.txt'), 'a\nb')
    await writeFile(join(root, 'empty.txt'), '')
    await writeFile(join(root, 'binary.bin'), Buffer.from([0x61, 0x00, 0x62]))
    // Over readMaxBytes (16 here): a partial read would undercount, so the
    // count is withheld rather than reported wrong.
    await writeFile(join(root, 'big.txt'), 'x\n'.repeat(40))
    await mkdir(join(root, 'dir'))

    expect(await countTextLines(root, 'trailing.txt', limits)).toBe(2)
    expect(await countTextLines(root, 'no-trailing.txt', limits)).toBe(2)
    expect(await countTextLines(root, 'empty.txt', limits)).toBe(0)
    expect(await countTextLines(root, 'binary.bin', limits)).toBeNull()
    expect(await countTextLines(root, 'big.txt', limits)).toBeNull()
    expect(await countTextLines(root, 'dir', limits)).toBeNull()
    expect(await countTextLines(root, 'missing.txt', limits)).toBeNull()
    expect(await countTextLines(root, '../escape.txt', limits)).toBeNull()
  })
})

describe('entryName', () => {
  it('returns the basename and the empty root label', () => {
    expect(entryName('a/b/c.txt')).toBe('c.txt')
    expect(entryName('')).toBe('')
  })
})
