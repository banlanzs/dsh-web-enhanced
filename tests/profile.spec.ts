/**
 * Profile inventory and layer-list reconciliation.
 *
 * These routines decide what the plugin manager offers and what it writes back
 * to a real profile manifest, so the tests build actual directories rather than
 * mocking the filesystem — the on-disk shape IS the contract with `dsh plugin`.
 * @module dsh-web-enhanced/tests/profile
 */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  assertPackageName, findProfileDir, readInventory, readProfileManifest, reconcileBundles,
} from '../src/profile.ts'

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

/** One installed package inside a fixture profile. */
interface Installed {
  readonly name: string
  readonly version?: string
  readonly description?: string
  /** Whether the installed manifest declares `dsh.bundle.patch`. */
  readonly bundle?: boolean
}

/**
 * Build a profile directory with a manifest and materialized dependencies.
 * @param manifest - dependencies and the layer list.
 * @param installed - packages to write into `node_modules`.
 * @returns the profile directory.
 */
async function profile(
  manifest: { dependencies?: Record<string, string>; bundles?: string[] },
  installed: readonly Installed[] = [],
): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'web-enhanced-profile-'))
  roots.push(dir)
  await writeFile(join(dir, 'package.json'), JSON.stringify({
    name: 'dsh-profile-test',
    private: true,
    dependencies: manifest.dependencies ?? {},
    dsh: { profile: { bundles: manifest.bundles ?? [] } },
  }, null, 2))
  for (const entry of installed) {
    const packageDir = join(dir, 'node_modules', ...entry.name.split('/'))
    await mkdir(packageDir, { recursive: true })
    await writeFile(join(packageDir, 'package.json'), JSON.stringify({
      name: entry.name,
      version: entry.version ?? '1.0.0',
      ...entry.description === undefined ? {} : { description: entry.description },
      ...entry.bundle === true ? { dsh: { bundle: { patch: './cordis.patch.yml' } } } : {},
    }))
  }
  return dir
}

describe('findProfileDir', () => {
  it('walks up to the directory whose manifest declares dsh.profile', async () => {
    const dir = await profile({})
    const deep = join(dir, 'node_modules', 'x', 'lib')
    await mkdir(deep, { recursive: true })
    expect(await findProfileDir(deep)).toBe(dir)
  })

  it('answers undefined when no ancestor is a profile', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'web-enhanced-plain-'))
    roots.push(dir)
    // A package.json WITHOUT dsh.profile must not be mistaken for one: every
    // installed package has one, so the walk would stop immediately.
    await writeFile(join(dir, 'package.json'), JSON.stringify({ name: 'plain' }))
    expect(await findProfileDir(dir)).toBeUndefined()
  })
})

describe('readInventory', () => {
  it('lists dependencies with their installed version, bundle, and layer state', async () => {
    const dir = await profile(
      {
        dependencies: { 'plugin-a': 'github:o/a', 'plain-lib': '^2.0.0' },
        bundles: ['@deepseek-ai/dsh-base', 'plugin-a'],
      },
      [
        { name: 'plugin-a', version: '0.3.1', description: 'does things', bundle: true },
        { name: 'plain-lib', version: '2.4.0' },
      ],
    )
    const inventory = await readInventory(dir)
    expect(inventory.plugins).toEqual([
      {
        name: 'plugin-a',
        spec: 'github:o/a',
        version: '0.3.1',
        description: 'does things',
        bundle: true,
        active: true,
        self: false,
      },
      {
        name: 'plain-lib',
        spec: '^2.0.0',
        version: '2.4.0',
        description: null,
        bundle: false,
        active: false,
        self: false,
      },
    ])
  })

  it('reports a layer that no dependency provides as a template bundle', async () => {
    const dir = await profile({
      dependencies: { 'plugin-a': 'github:o/a' },
      bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', 'plugin-a'],
    }, [{ name: 'plugin-a', bundle: true }])
    const inventory = await readInventory(dir)
    // These cannot be removed by pnpm — nothing depends on them — so the
    // surface must not offer it.
    expect(inventory.templateBundles).toEqual(['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app'])
    expect(inventory.plugins.map(p => p.name)).toEqual(['plugin-a'])
  })

  it('reports a dependency that was never materialized as version null', async () => {
    const dir = await profile({ dependencies: { ghost: '^1.0.0' } })
    const inventory = await readInventory(dir)
    expect(inventory.plugins[0]).toMatchObject({ name: 'ghost', version: null, bundle: false })
  })

  it('handles a scoped package name as a nested directory', async () => {
    const dir = await profile(
      { dependencies: { '@scope/thing': '^1.0.0' }, bundles: [] },
      [{ name: '@scope/thing', version: '1.2.3', bundle: true }],
    )
    const inventory = await readInventory(dir)
    expect(inventory.plugins[0]).toMatchObject({ name: '@scope/thing', version: '1.2.3', bundle: true })
  })
})

describe('reconcileBundles', () => {
  it('appends a dependency that declares dsh.bundle', async () => {
    const dir = await profile(
      { dependencies: { 'plugin-a': 'github:o/a' }, bundles: ['@deepseek-ai/dsh-base'] },
      [{ name: 'plugin-a', bundle: true }],
    )
    const outcome = await reconcileBundles(dir, [])
    expect(outcome).toEqual({ added: ['plugin-a'], removed: [] })
    expect((await readProfileManifest(dir)).dsh?.profile?.bundles)
      .toEqual(['@deepseek-ai/dsh-base', 'plugin-a'])
  })

  it('drops a layer whose dependency is gone', async () => {
    // pnpm has already removed the dependency; the before-state is what marks
    // the name as dependency-managed rather than a template layer.
    const dir = await profile({ dependencies: {}, bundles: ['@deepseek-ai/dsh-base', 'plugin-a'] })
    const outcome = await reconcileBundles(dir, ['plugin-a'])
    expect(outcome).toEqual({ added: [], removed: ['plugin-a'] })
    expect((await readProfileManifest(dir)).dsh?.profile?.bundles).toEqual(['@deepseek-ai/dsh-base'])
  })

  it('never removes a template layer, even though nothing depends on it', async () => {
    const dir = await profile({ dependencies: {}, bundles: ['@deepseek-ai/dsh-base'] })
    const outcome = await reconcileBundles(dir, [])
    expect(outcome).toEqual({ added: [], removed: [] })
    expect((await readProfileManifest(dir)).dsh?.profile?.bundles).toEqual(['@deepseek-ai/dsh-base'])
  })

  it('activates a dependency that only gained its declaration on update', async () => {
    // The reason reconciliation follows INSTALLED state and not a dependency
    // diff: the dependency did not change, only what it resolves to did.
    const dir = await profile(
      { dependencies: { 'plugin-a': 'github:o/a' }, bundles: [] },
      [{ name: 'plugin-a', version: '2.0.0', bundle: true }],
    )
    const outcome = await reconcileBundles(dir, ['plugin-a'])
    expect(outcome).toEqual({ added: ['plugin-a'], removed: [] })
  })

  it('drops a layer whose new version stopped declaring dsh.bundle', async () => {
    const dir = await profile(
      { dependencies: { 'plugin-a': 'github:o/a' }, bundles: ['plugin-a'] },
      [{ name: 'plugin-a', version: '3.0.0' }],
    )
    const outcome = await reconcileBundles(dir, ['plugin-a'])
    expect(outcome).toEqual({ added: [], removed: ['plugin-a'] })
  })

  it('leaves the manifest untouched when nothing changed', async () => {
    const dir = await profile(
      { dependencies: { 'plugin-a': 'github:o/a' }, bundles: ['plugin-a'] },
      [{ name: 'plugin-a', bundle: true }],
    )
    const before = await readProfileManifest(dir)
    const outcome = await reconcileBundles(dir, ['plugin-a'])
    expect(outcome).toEqual({ added: [], removed: [] })
    expect(await readProfileManifest(dir)).toEqual(before)
  })
})

describe('assertPackageName', () => {
  it('accepts plain and scoped npm names', () => {
    for (const name of ['dsh-web-enhanced', '@deepseek-ai/dsh-base', 'a', 'x.y_z-1']) {
      expect(() => { assertPackageName(name) }, name).not.toThrow()
    }
  })

  it('refuses anything that could become an option or a second argument', () => {
    // The name reaches a spawned process and, on Windows, a command
    // interpreter — so an option-looking name or one carrying a separator is
    // refused before it can be either.
    for (const name of ['', '-rf', '--force', 'a b', 'a;b', 'a&b', 'a|b', 'a"b', '../x', 'UPPER', 'a/b/c']) {
      expect(() => { assertPackageName(name) }, JSON.stringify(name)).toThrow()
    }
  })
})
