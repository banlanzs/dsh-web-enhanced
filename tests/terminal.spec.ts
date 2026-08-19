/**
 * Terminal registry and socket-trust behavior: session lifetime, scrollback
 * replay on re-attach, and the two fences that stand between a web page and
 * the user's shell.
 */
import { describe, expect, it, vi } from 'vitest'
import type { IncomingMessage } from 'node:http'
import { Context } from '@deepseek-ai/cordis'
import { TerminalRegistry, resolveShell } from '../src/terminal.ts'
import type { TerminalSink } from '../src/terminal.ts'
import { isTrustedTerminalUpgrade } from '../src/terminal-socket.ts'
import { FakeSubprocess } from './helpers/fake-subprocess.ts'

/** A registry over a scripted subprocess seam. */
function harness(scrollbackMaxBytes = 65_536) {
  const subprocess = new FakeSubprocess(new Context())
  const registry = new TerminalRegistry(() => subprocess, {
    scrollbackMaxBytes,
    graceMs: 5_000,
    shell: '/bin/bash',
  })
  return { subprocess, registry }
}

/** A sink that records everything it is handed. */
function recorder(): TerminalSink & { readonly chunks: string[]; exits: unknown[] } {
  const chunks: string[] = []
  const exits: unknown[] = []
  return {
    chunks,
    exits,
    send(data) { chunks.push(data) },
    exit(exitCode, signal) { exits.push({ exitCode, signal }) },
  }
}

/** Let the output stream's 'data' listeners run. */
const flush = () => new Promise(resolve => { setImmediate(resolve) })

describe('TerminalRegistry', () => {
  it('spawns a PTY in the workspace root at the measured geometry', async () => {
    const { subprocess, registry } = harness()
    const view = await registry.spawn('w1', '/repo', 120, 30)

    expect(subprocess.terminals).toHaveLength(1)
    expect(subprocess.terminals[0]?.spec).toMatchObject({
      argv: ['/bin/bash'],
      cwd: '/repo',
      cols: 120,
      rows: 30,
      graceMs: 5_000,
    })
    // xterm.js renders color only when the shell believes it has a color TERM.
    expect(subprocess.terminals[0]?.spec.env).toMatchObject({ TERM: 'xterm-256color' })
    expect(view).toMatchObject({ workspaceId: 'w1', running: true, cols: 120, rows: 30, pid: 4321 })
  })

  it('fans output out to every attached sink', async () => {
    const { subprocess, registry } = harness()
    const view = await registry.spawn('w1', '/repo', 80, 24)
    const first = recorder()
    const second = recorder()
    registry.attach(view.id, first)
    registry.attach(view.id, second)

    subprocess.terminals[0]?.emit('hello\r\n')
    await flush()

    expect(first.chunks).toEqual(['hello\r\n'])
    expect(second.chunks).toEqual(['hello\r\n'])
  })

  it('replays retained scrollback to a sink that attaches later', async () => {
    const { subprocess, registry } = harness()
    const view = await registry.spawn('w1', '/repo', 80, 24)
    subprocess.terminals[0]?.emit('first\r\n')
    subprocess.terminals[0]?.emit('second\r\n')
    await flush()

    const late = recorder()
    registry.attach(view.id, late)

    // One replay frame, in order: a reload must not lose what already scrolled.
    expect(late.chunks).toEqual(['first\r\nsecond\r\n'])
  })

  it('drops the oldest output once the scrollback bound is exceeded', async () => {
    const { subprocess, registry } = harness(8)
    const view = await registry.spawn('w1', '/repo', 80, 24)
    subprocess.terminals[0]?.emit('aaaa')
    subprocess.terminals[0]?.emit('bbbb')
    subprocess.terminals[0]?.emit('cccc')
    await flush()

    const late = recorder()
    registry.attach(view.id, late)

    expect(late.chunks).toEqual(['bbbbcccc'])
  })

  it('detaching stops delivery without killing the session', async () => {
    const { subprocess, registry } = harness()
    const view = await registry.spawn('w1', '/repo', 80, 24)
    const sink = recorder()
    const detach = registry.attach(view.id, sink)
    detach?.()

    subprocess.terminals[0]?.emit('after detach')
    await flush()

    expect(sink.chunks).toEqual([])
    expect(subprocess.terminals[0]?.terminated).toBe(false)
    expect(registry.list('w1')).toHaveLength(1)
  })

  it('forwards input verbatim and refuses it after the shell exits', async () => {
    const { subprocess, registry } = harness()
    const view = await registry.spawn('w1', '/repo', 80, 24)

    expect(await registry.write(view.id, 'ls -la\r')).toBe(true)
    expect(subprocess.terminals[0]?.writes).toEqual(['ls -la\r'])

    subprocess.terminals[0]?.exit(0)
    await flush()

    expect(await registry.write(view.id, 'ignored')).toBe(false)
    expect(subprocess.terminals[0]?.writes).toEqual(['ls -la\r'])
  })

  it('tells attached sinks once when the shell exits', async () => {
    const { subprocess, registry } = harness()
    const view = await registry.spawn('w1', '/repo', 80, 24)
    const sink = recorder()
    registry.attach(view.id, sink)

    subprocess.terminals[0]?.exit(3, null)
    await flush()

    expect(sink.exits).toEqual([{ exitCode: 3, signal: null }])
    expect(registry.list('w1')[0]?.running).toBe(false)
  })

  it('reports the exit immediately to a sink attaching after the shell died', async () => {
    const { subprocess, registry } = harness()
    const view = await registry.spawn('w1', '/repo', 80, 24)
    subprocess.terminals[0]?.emit('bye\r\n')
    subprocess.terminals[0]?.exit(0)
    await flush()

    const late = recorder()
    const detach = registry.attach(view.id, late)

    expect(late.chunks).toEqual(['bye\r\n'])
    expect(late.exits).toEqual([{ exitCode: 0, signal: null }])
    expect(detach).toBeTypeOf('function')
  })

  it('lists only the requested workspace, and forgets a closed session', async () => {
    const { registry } = harness()
    const one = await registry.spawn('w1', '/one', 80, 24)
    await registry.spawn('w2', '/two', 80, 24)

    expect(registry.list('w1').map(view => view.id)).toEqual([one.id])
    expect(registry.list('w2')).toHaveLength(1)

    expect(await registry.close(one.id)).toBe(true)
    expect(registry.list('w1')).toHaveLength(0)
    // Closing twice is not an error; the id is simply gone.
    expect(await registry.close(one.id)).toBe(false)
  })

  it('delivers signals to the foreground group', async () => {
    const { subprocess, registry } = harness()
    const view = await registry.spawn('w1', '/repo', 80, 24)

    expect(await registry.signal(view.id, 'SIGINT')).toBe(true)
    expect(subprocess.terminals[0]?.signals).toEqual(['SIGINT'])
    expect(await registry.signal('term-nope', 'SIGINT')).toBe(false)
  })

  it('refuses unknown ids rather than throwing', async () => {
    const { registry } = harness()
    expect(registry.attach('term-nope', recorder())).toBeUndefined()
    expect(await registry.write('term-nope', 'x')).toBe(false)
  })

  it('terminates every session on disposal and refuses later spawns', async () => {
    const { subprocess, registry } = harness()
    await registry.spawn('w1', '/repo', 80, 24)
    await registry.spawn('w1', '/repo', 80, 24)

    await registry.disposeAll()

    expect(subprocess.terminals.every(handle => handle.terminated)).toBe(true)
    expect(registry.list('w1')).toHaveLength(0)
    await expect(registry.spawn('w1', '/repo', 80, 24)).rejects.toThrow(/disposed/u)
  })

  it('ends every session when the owning context is disposed', async () => {
    const ctx = new Context()
    const subprocess = new FakeSubprocess(ctx)
    const { createTerminalRegistry } = await import('../src/terminal.ts')
    const registry = createTerminalRegistry(ctx, () => subprocess, {
      scrollbackMaxBytes: 4_096,
      graceMs: 5_000,
      shell: '/bin/bash',
    })
    await registry.spawn('w1', '/repo', 80, 24)

    await ctx.fiber.dispose()
    await flush()

    expect(subprocess.terminals[0]?.terminated).toBe(true)
  })
})

describe('resolveShell', () => {
  it('prefers the configured shell over the environment', () => {
    expect(resolveShell('/usr/bin/fish')).toBe('/usr/bin/fish')
  })

  it('falls back to the user environment when unconfigured', () => {
    vi.stubEnv('SHELL', '/usr/bin/zsh')
    try {
      expect(resolveShell('')).toBe('/usr/bin/zsh')
    } finally {
      vi.unstubAllEnvs()
    }
  })
})

describe('isTrustedTerminalUpgrade', () => {
  /** One upgrade request with the given headers. */
  const request = (headers: Record<string, string>) => ({ headers }) as unknown as IncomingMessage

  it('accepts a loopback page opening its own terminal', () => {
    expect(isTrustedTerminalUpgrade(
      request({ host: '127.0.0.1:3190', origin: 'http://127.0.0.1:3190' }),
      [],
    )).toBe(true)
    expect(isTrustedTerminalUpgrade(
      request({ host: 'localhost:3190', origin: 'http://localhost:3190' }),
      [],
    )).toBe(true)
    expect(isTrustedTerminalUpgrade(
      request({ host: '[::1]:3190', origin: 'http://[::1]:3190' }),
      [],
    )).toBe(true)
  })

  it('refuses a cross-site page reaching for the loopback shell', () => {
    // WebSocket bypasses CORS entirely, so this fence is the only thing
    // between any page on the internet and the user's shell.
    expect(isTrustedTerminalUpgrade(
      request({ host: '127.0.0.1:3190', origin: 'https://evil.example' }),
      [],
    )).toBe(false)
  })

  it('refuses a request with no Origin at all', () => {
    // Browsers always send Origin for WebSocket; its absence is not a browser
    // this deployment serves.
    expect(isTrustedTerminalUpgrade(request({ host: '127.0.0.1:3190' }), [])).toBe(false)
  })

  it('refuses a rebound DNS name that is not configured as trusted', () => {
    expect(isTrustedTerminalUpgrade(
      request({ host: 'attacker.example', origin: 'http://attacker.example' }),
      [],
    )).toBe(false)
  })

  it('accepts a configured non-loopback authority', () => {
    expect(isTrustedTerminalUpgrade(
      request({ host: 'dev.box:3190', origin: 'http://dev.box:3190' }),
      ['dev.box:3190'],
    )).toBe(true)
  })

  it('refuses a malformed Host or Origin', () => {
    expect(isTrustedTerminalUpgrade(request({ host: '', origin: 'http://x' }), [])).toBe(false)
    expect(isTrustedTerminalUpgrade(
      request({ host: '127.0.0.1:3190', origin: 'not a url' }),
      [],
    )).toBe(false)
  })
})
