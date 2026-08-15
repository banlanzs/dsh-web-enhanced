/**
 * Running pnpm against the profile directory — the executing half of plugin
 * management.
 *
 * `dsh plugin` is a pnpm forwarder, so removing or updating a plugin from the
 * running host means the same two steps: run pnpm in the profile, then
 * reconcile the layer list against the installed state. What this module adds
 * over the CLI is what a long-lived server needs and a one-shot command does
 * not — a single-flight lock, a deadline, and bounded output.
 *
 * None of it takes effect in the running process. Cordis composes the layer
 * stack at boot; rewriting `node_modules` underneath a live tree changes what
 * the NEXT start loads, nothing more. Every result therefore says so.
 * @module dsh-web-enhanced/src/pnpm
 */

import type { SubprocessRuntime } from '@deepseek-ai/dsh-subprocess'
import { assertPackageName, readProfileManifest, reconcileBundles } from './profile.ts'

/** Bounds for one pnpm invocation. */
export interface PnpmLimits {
  /** Wall-clock deadline; a git-hosted install is slow, so this is generous. */
  readonly timeoutMs: number
  /** Per-stream collected output cap. */
  readonly outputMaxBytes: number
}

/** One settled pnpm invocation. */
export interface PnpmRun {
  readonly exitCode: number | null
  readonly stdout: string
  readonly stderr: string
  /** True when the deadline fired rather than the process finishing. */
  readonly timedOut: boolean
}

/**
 * Build the argv that reaches the subprocess seam.
 *
 * The seam never shell-interprets, which is right for it and inconvenient
 * here: on Windows `pnpm` is a `.cmd` shim that CreateProcess cannot execute,
 * so the command interpreter has to be named explicitly. `/d` suppresses any
 * AutoRun command the registry would otherwise inject into that interpreter.
 *
 * Joining the arguments with spaces is safe ONLY because every one of them is
 * either a literal this module wrote or a package name that passed
 * {@link assertPackageName} — no whitespace, quotes, or cmd metacharacters can
 * be present. Do not extend this to user-supplied strings without quoting.
 * @param args - pnpm arguments.
 * @returns argv for the spawn seam.
 */
export function pnpmArgv(args: readonly string[]): readonly string[] {
  if (process.platform !== 'win32') return ['pnpm', ...args]
  return ['cmd.exe', '/d', '/s', '/c', ['pnpm', ...args].join(' ')]
}

/**
 * Classify a pnpm failure into a stable code the client can branch on.
 * @param run - the settled invocation.
 * @returns a machine code, or undefined when the run succeeded.
 */
export function pnpmFailureCode(run: PnpmRun): string | undefined {
  if (run.timedOut) return 'pnpm-timeout'
  if (run.exitCode === 0) return undefined
  const combined = `${run.stdout}\n${run.stderr}`
  // The shim is missing rather than failing: on POSIX the seam reports ENOENT,
  // while cmd.exe answers 9009 with its own wording.
  if (run.exitCode === 9009 || /ENOENT|not recognized|command not found/iu.test(combined)) {
    return 'pnpm-not-found'
  }
  return 'pnpm-failed'
}

/**
 * Serialized pnpm access to one profile directory.
 *
 * Single-flight rather than queued: these operations take seconds to minutes
 * and rewrite the same `node_modules`, so a second caller is told to wait
 * instead of silently joining a queue whose head it cannot see.
 */
export class PnpmRunner {
  private busy = false

  /**
   * @param subprocess - subprocess seam.
   * @param profileDir - absolute profile directory; the cwd of every run.
   * @param limits - deadline and output bounds.
   */
  constructor(
    private readonly subprocess: SubprocessRuntime,
    private readonly profileDir: string,
    private readonly limits: PnpmLimits,
  ) {}

  /** Whether an operation is currently in flight. */
  get running(): boolean {
    return this.busy
  }

  /**
   * Run one pnpm invocation in the profile directory.
   * @param args - pnpm arguments, already validated.
   * @returns the settled run.
   */
  private async run(args: readonly string[]): Promise<PnpmRun> {
    const abort = new AbortController()
    const timer = setTimeout(() => { abort.abort() }, this.limits.timeoutMs)
    try {
      const handle = this.subprocess.spawn({
        argv: pnpmArgv(args),
        cwd: this.profileDir,
        stdio: {
          stdin: 'ignore',
          stdout: { maxBytes: this.limits.outputMaxBytes },
          stderr: { maxBytes: this.limits.outputMaxBytes },
        },
        graceMs: 5_000,
        signal: abort.signal,
      })
      const outcome = await handle.done
      return {
        exitCode: outcome.exitCode,
        stdout: handle.collected.stdout?.readFrom(0).text ?? '',
        stderr: handle.collected.stderr?.readFrom(0).text ?? '',
        timedOut: abort.signal.aborted,
      }
    } catch (error) {
      // A spawn that never started (no pnpm on PATH) settles here, not in `done`.
      return {
        exitCode: null,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        timedOut: abort.signal.aborted,
      }
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * Run one pnpm operation and reconcile the layer list afterwards.
   *
   * The dependency names are captured BEFORE pnpm runs because reconciliation
   * distinguishes a layer that a dependency stopped providing (remove it) from
   * a template bundle that was never a dependency (leave it) — a distinction
   * only the before-state carries.
   * @param args - pnpm arguments.
   * @returns the run plus the reconciliation outcome.
   */
  private async operate(args: readonly string[]): Promise<{
    readonly run: PnpmRun
    readonly added: readonly string[]
    readonly removed: readonly string[]
  }> {
    const before = Object.keys((await readProfileManifest(this.profileDir)).dependencies ?? {})
    const run = await this.run(args)
    if (run.exitCode !== 0) return { run, added: [], removed: [] }
    const { added, removed } = await reconcileBundles(this.profileDir, before)
    return { run, added, removed }
  }

  /**
   * Take the single-flight lock for one operation.
   * @param args - pnpm arguments.
   * @returns the operation outcome.
   * @throws when another operation holds the lock.
   */
  async exclusive(args: readonly string[]): Promise<{
    readonly run: PnpmRun
    readonly added: readonly string[]
    readonly removed: readonly string[]
  }> {
    if (this.busy) throw new Error('another plugin operation is already running')
    this.busy = true
    try {
      return await this.operate(args)
    } finally {
      this.busy = false
    }
  }

  /**
   * Remove one plugin from the profile.
   * @param name - package name.
   * @returns the operation outcome.
   */
  async remove(name: string): Promise<Awaited<ReturnType<PnpmRunner['exclusive']>>> {
    assertPackageName(name)
    return this.exclusive(['remove', name])
  }

  /**
   * Update one plugin to the head of whatever its spec tracks.
   *
   * `update`, not `install`: a ref-less git spec tracks a branch, but pnpm
   * pins the commit it resolved into the profile's lockfile, and `install`
   * honours that pin. Only `update` re-resolves the branch head.
   * @param name - package name.
   * @returns the operation outcome.
   */
  async update(name: string): Promise<Awaited<ReturnType<PnpmRunner['exclusive']>>> {
    assertPackageName(name)
    return this.exclusive(['update', name])
  }
}
