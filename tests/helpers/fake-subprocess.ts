/** Shared scripted subprocess seam for web-enhanced tests. */
import { vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { SubprocessRuntime } from '@deepseek-ai/dsh-subprocess'
import type {
  SubprocessHandle, SubprocessOutcome, SubprocessOutputReader, SubprocessSpawnSpec,
} from '@deepseek-ai/dsh-subprocess'

/** One scripted invocation result. */
export interface ScriptedResult {
  readonly exitCode?: number | null
  readonly stdout?: string
  readonly stderr?: string
}

/**
 * SubprocessRuntime stub: every spawn consumes the next queued result and
 * records its spec, so git argument building is asserted call by call.
 */
export class FakeSubprocess extends SubprocessRuntime {
  readonly calls: SubprocessSpawnSpec[] = []
  private queue: ScriptedResult[] = []
  /** When true, collected readers are omitted so consumers exercise their fallbacks. */
  omitCollected = false

  constructor(ctx: Context) {
    super(ctx)
  }

  /** Queue the next spawn result. */
  enqueue(result: ScriptedResult): void {
    this.queue.push({ exitCode: result.exitCode ?? 0, stdout: result.stdout ?? '', stderr: result.stderr ?? '' })
  }

  resolveExecutable(): Promise<string> {
    return Promise.resolve('git')
  }

  spawn(spec: SubprocessSpawnSpec): SubprocessHandle {
    this.calls.push(spec)
    const result = this.queue.shift() ?? { exitCode: 0, stdout: '', stderr: '' }
    const stdoutReader: SubprocessOutputReader = {
      readFrom() { return { text: result.stdout, nextOffset: result.stdout.length, lossy: false } },
    }
    const stderrReader: SubprocessOutputReader = {
      readFrom() { return { text: result.stderr, nextOffset: result.stderr.length, lossy: false } },
    }
    return {
      pid: 1,
      stdin: undefined,
      stdout: undefined,
      stderr: undefined,
      collected: this.omitCollected ? {} : { stdout: stdoutReader, stderr: stderrReader },
      done: Promise.resolve({ exitCode: result.exitCode, signal: null } satisfies SubprocessOutcome),
      terminate: vi.fn(),
      waitForExit: () => Promise.resolve(true),
    }
  }

  spawnTerminal(): never {
    throw new Error('unused')
  }
}
