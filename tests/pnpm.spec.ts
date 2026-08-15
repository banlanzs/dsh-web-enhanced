/**
 * The pnpm executor: argv shaping, failure classification, and the
 * single-flight lock.
 *
 * pnpm itself is not spawned here — a test that installed packages for real
 * would depend on the network and on a registry. What IS pinned is everything
 * this module decides before and after that spawn, which is where its bugs
 * would live.
 * @module dsh-web-enhanced/tests/pnpm
 */

import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PnpmRunner, pnpmArgv, pnpmFailureCode } from '../src/pnpm.ts'
import { readProfileManifest } from '../src/profile.ts'

const windows = process.platform === 'win32'
const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

describe('pnpmArgv', () => {
  it.runIf(!windows)('names pnpm directly on POSIX', () => {
    expect(pnpmArgv(['remove', 'x'])).toEqual(['pnpm', 'remove', 'x'])
  })

  it.runIf(windows)('routes through the command interpreter on Windows', () => {
    // pnpm is a .cmd shim there, which CreateProcess cannot execute, and the
    // subprocess seam never shell-interprets. `/d` suppresses registry AutoRun.
    expect(pnpmArgv(['remove', 'x'])).toEqual(['cmd.exe', '/d', '/s', '/c', 'pnpm remove x'])
  })
})

describe('pnpmFailureCode', () => {
  const base = { stdout: '', stderr: '', timedOut: false }

  it('reports no failure for a clean exit', () => {
    expect(pnpmFailureCode({ ...base, exitCode: 0 })).toBeUndefined()
  })

  it('reports a timeout ahead of the exit code', () => {
    // An aborted process exits non-zero too; the deadline is the real cause
    // and the one the user can act on.
    expect(pnpmFailureCode({ ...base, exitCode: 1, timedOut: true })).toBe('pnpm-timeout')
  })

  it('recognizes a missing pnpm on both platforms', () => {
    expect(pnpmFailureCode({ ...base, exitCode: 9009 })).toBe('pnpm-not-found')
    expect(pnpmFailureCode({ ...base, exitCode: 1, stderr: 'spawn pnpm ENOENT' })).toBe('pnpm-not-found')
    expect(pnpmFailureCode({ ...base, exitCode: 1, stderr: "'pnpm' is not recognized" })).toBe('pnpm-not-found')
  })

  it('falls back to a generic failure', () => {
    expect(pnpmFailureCode({ ...base, exitCode: 1, stderr: 'ERR_PNPM_NO_MATCHING_VERSION' })).toBe('pnpm-failed')
  })
})

/** A subprocess seam that records its spawn and settles with fixed output. */
function fakeSubprocess(outcome: { exitCode: number; stdout?: string; stderr?: string }) {
  const spawns: { argv: readonly string[]; cwd: string }[] = []
  const collected = (text: string) => ({ readFrom: () => ({ text }) })
  return {
    spawns,
    seam: {
      spawn: vi.fn((spec: { argv: readonly string[]; cwd: string }) => {
        spawns.push({ argv: spec.argv, cwd: spec.cwd })
        return {
          pid: 1,
          stdin: undefined,
          stdout: Readable.from([]),
          stderr: Readable.from([]),
          collected: {
            stdout: collected(outcome.stdout ?? ''),
            stderr: collected(outcome.stderr ?? ''),
          },
          done: Promise.resolve({ exitCode: outcome.exitCode, signal: null }),
          terminate: () => {},
          waitForExit: async () => true,
        }
      }),
    },
  }
}

/** A profile fixture with one bundle dependency already installed. */
async function profileFixture(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'web-enhanced-pnpm-'))
  roots.push(dir)
  await writeFile(join(dir, 'package.json'), JSON.stringify({
    name: 'dsh-profile-test',
    dependencies: { 'plugin-a': 'github:o/a' },
    dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', 'plugin-a'] } },
  }, null, 2))
  return dir
}

const limits = { timeoutMs: 5_000, outputMaxBytes: 4096 }

describe('PnpmRunner', () => {
  it('runs in the profile directory and reconciles the layer list on success', async () => {
    const dir = await profileFixture()
    const { seam, spawns } = fakeSubprocess({ exitCode: 0, stdout: 'done' })
    const runner = new PnpmRunner(seam as never, dir, limits)
    // The fake does not actually remove anything, but the manifest still lists
    // `plugin-a` as a layer whose package is not materialized — which is
    // exactly the post-removal state reconciliation must clean up.
    const outcome = await runner.remove('plugin-a')
    expect(spawns[0]?.cwd).toBe(dir)
    expect(spawns[0]?.argv.join(' ')).toContain('remove plugin-a')
    expect(outcome.run.exitCode).toBe(0)
    expect(outcome.removed).toEqual(['plugin-a'])
    expect((await readProfileManifest(dir)).dsh?.profile?.bundles).toEqual(['@deepseek-ai/dsh-base'])
  })

  it('leaves the layer list alone when pnpm failed', async () => {
    const dir = await profileFixture()
    const { seam } = fakeSubprocess({ exitCode: 1, stderr: 'ERR_PNPM_FETCH_404' })
    const runner = new PnpmRunner(seam as never, dir, limits)
    const outcome = await runner.update('plugin-a')
    expect(outcome.run.exitCode).toBe(1)
    expect(outcome.added).toEqual([])
    expect(outcome.removed).toEqual([])
    // A failed install must not renumber the deployment's layers.
    expect((await readProfileManifest(dir)).dsh?.profile?.bundles)
      .toEqual(['@deepseek-ai/dsh-base', 'plugin-a'])
  })

  it('uses update, not install, so a tracked branch re-resolves', async () => {
    const dir = await profileFixture()
    const { seam, spawns } = fakeSubprocess({ exitCode: 0 })
    await new PnpmRunner(seam as never, dir, limits).update('plugin-a')
    expect(spawns[0]?.argv.join(' ')).toContain('update plugin-a')
    expect(spawns[0]?.argv.join(' ')).not.toContain('install')
  })

  it('refuses a second operation while one is in flight', async () => {
    const dir = await profileFixture()
    let release = (): void => {}
    const gate = new Promise<void>((resolve) => { release = resolve })
    const seam = {
      spawn: () => ({
        pid: 1,
        stdin: undefined,
        stdout: undefined,
        stderr: undefined,
        collected: { stdout: undefined, stderr: undefined },
        done: gate.then(() => ({ exitCode: 0, signal: null })),
        terminate: () => {},
        waitForExit: async () => true,
      }),
    }
    const runner = new PnpmRunner(seam as never, dir, limits)
    const first = runner.remove('plugin-a')
    expect(runner.running).toBe(true)
    // Not queued: these take minutes and rewrite the same node_modules, so a
    // second caller is told rather than silently joining a queue it cannot see.
    await expect(runner.update('plugin-a')).rejects.toThrow(/already running/u)
    release()
    await first
    expect(runner.running).toBe(false)
  })

  it('releases the lock after a failed operation', async () => {
    const dir = await profileFixture()
    const seam = { spawn: () => { throw new Error('spawn pnpm ENOENT') } }
    const runner = new PnpmRunner(seam as never, dir, limits)
    const outcome = await runner.remove('plugin-a')
    expect(pnpmFailureCode(outcome.run)).toBe('pnpm-not-found')
    expect(runner.running).toBe(false)
  })

  it('refuses a package name that is not a plain npm name', async () => {
    const dir = await profileFixture()
    const { seam, spawns } = fakeSubprocess({ exitCode: 0 })
    const runner = new PnpmRunner(seam as never, dir, limits)
    await expect(runner.remove('--force')).rejects.toThrow()
    // The guard runs BEFORE the spawn, so nothing reached pnpm.
    expect(spawns).toHaveLength(0)
  })
})
