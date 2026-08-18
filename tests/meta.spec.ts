/**
 * Build-time metadata pins.
 *
 * `WEB_ENHANCED_VERSION` is a hand-written duplicate of `package.json`'s
 * `version` (the browser bundle cannot read the manifest at runtime, and
 * importing it would drag the whole file into the bundle). A duplicate
 * maintained by convention alone WILL drift — 0.20.0 shipped with the About
 * tab still saying 0.19.0 — so the convention is pinned here, where
 * `pnpm check` runs before every release.
 * @module dsh-web-enhanced/tests/meta
 */

import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { WEB_ENHANCED_REPOSITORY, WEB_ENHANCED_VERSION } from '../src/client/meta.ts'

describe('build-time metadata', () => {
  it('keeps the About-tab version equal to the package version', async () => {
    const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as {
      version: string
    }
    expect(WEB_ENHANCED_VERSION).toBe(manifest.version)
  })

  it('points the project-home link at the published repository', async () => {
    const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as {
      repository?: { url?: string }
    }
    expect(manifest.repository?.url).toContain(WEB_ENHANCED_REPOSITORY.replace('https://github.com/', ''))
  })
})
