/** Shared scripted subprocess seam for web-enhanced tests. */
import { PassThrough } from 'node:stream'
import { vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { SubprocessRuntime } from '@deepseek-ai/dsh-subprocess'
import type {
  SubprocessHandle, SubprocessOutcome, SubprocessOutputReader, SubprocessSpawnSpec,
  SubprocessTerminalForeground, SubprocessTerminalHandle, SubprocessTerminalSignal,
  SubprocessTerminalSpawnSpec,
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

  /** Every terminal this runtime handed out, in spawn order. */
  readonly terminals: FakeTerminalHandle[] = []

  spawnTerminal(spec: SubprocessTerminalSpawnSpec): Promise<SubprocessTerminalHandle> {
    const handle = new FakeTerminalHandle(spec)
    this.terminals.push(handle)
    return Promise.resolve(handle)
  }
}

/**
 * A PTY the test drives directly: output is pushed with {@link emit}, the
 * shell's death with {@link exit}, and everything written to it is recorded.
 */
export class FakeTerminalHandle implements SubprocessTerminalHandle {
  readonly pid = 4321
  readonly output = new PassThrough()
  readonly writes: string[] = []
  readonly signals: SubprocessTerminalSignal[] = []
  terminated = false
  private settle!: (outcome: SubprocessOutcome) => void
  readonly done = new Promise<SubprocessOutcome>((resolve) => { this.settle = resolve })

  constructor(readonly spec: SubprocessTerminalSpawnSpec) {}

  /**
   * Deliver output as the terminal driver would.
   * @param text - bytes to push onto the output stream.
   */
  emit(text: string): void {
    this.output.write(text)
  }

  /**
   * Settle the top-level shell's exit.
   * @param exitCode - exit code, or null when signalled.
   * @param signal - terminating signal, or null.
   */
  exit(exitCode: number | null, signal: NodeJS.Signals | null = null): void {
    this.settle({ exitCode, signal })
  }

  write(data: string): Promise<void> {
    this.writes.push(data)
    return Promise.resolve()
  }

  inspectForeground(): Promise<SubprocessTerminalForeground | undefined> {
    return Promise.resolve({ processGroupId: this.pid, inputWaiting: true })
  }

  signalForeground(signal: SubprocessTerminalSignal): Promise<number> {
    this.signals.push(signal)
    return Promise.resolve(this.pid)
  }

  terminate(): Promise<void> {
    this.terminated = true
    return Promise.resolve()
  }
}
