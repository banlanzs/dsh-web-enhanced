/**
 * TerminalHost behavior: delegation onto the host's PTY registry with the
 * owner gate, backend preference, and the degraded-error paths.
 * @module dsh-web-enhanced/tests/terminal
 */

import { describe, expect, it } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { TerminalHost } from '../src/terminal.ts'

/** Fake PTY session snapshot shape the host service returns. */
interface FakeSnapshot {
  sessionId: string
  name?: string
  type: string
  pid?: number
  status: { kind: 'running' } | { kind: 'exited'; exitCode: number | null; signal: string | null }
}

/** Scriptable terminals service double. */
function fakeTerminals(options: { backends?: string[]; snapshots?: FakeSnapshot[] } = {}) {
  const spawned: Array<{ type: string; cwd?: string; name?: string }> = []
  const sends: Array<{ id: string; text: string; submit: boolean }> = []
  const reads: Array<{ id: string; offset?: number; count?: number }> = []
  const signals: Array<{ id: string; signal: string }> = []
  const kills: Array<{ id: string; reason?: string }> = []
  const service = {
    listBackends: () => options.backends ?? ['shell'],
    spawn: async (owner: object, request: { type: string; name?: string; cwd?: string }) => {
      spawned.push({ type: request.type, ...request.cwd !== undefined ? { cwd: request.cwd } : {}, ...request.name !== undefined ? { name: request.name } : {} })
      if (request.type === 'explode') throw new Error('backend boom')
      return {
        sessionId: 'pty-1',
        ...request.name !== undefined ? { name: request.name } : {},
        type: request.type,
        pid: 4242,
        status: { kind: 'running' as const },
        motd: 'welcome\n',
        owner,
      }
    },
    startSend: (owner: object, id: string, request: { text: string; submit: boolean }) => {
      sends.push({ id, text: request.text, submit: request.submit })
      return {
        done: Promise.resolve({
          viewport: `ran:${request.text}`,
          waitReason: 'inferred_idle' as const,
          sessionStatus: { kind: 'exited' as const, exitCode: 3, signal: null },
          truncated: false,
        }),
      }
    },
    read: (owner: object, id: string, request: { offset?: number; count?: number }) => {
      reads.push({ id, ...request })
      return { text: 'history\n', totalLines: 10, lineBegin: 5, lineEnd: 10, truncated: false }
    },
    signal: async (owner: object, id: string, signal: string) => {
      signals.push({ id, signal })
      return { delivered: true as const, targetPgid: 7 }
    },
    kill: async (owner: object, id: string, reason?: string) => {
      kills.push({ id, ...reason !== undefined ? { reason } : {} })
      return true
    },
    list: (owner: object) => options.snapshots ?? [],
  }
  return { service, spawned, sends, reads, signals, kills }
}

/** Context double answering the two uninjected service reads. */
function fakeCtx(terminals?: object, agents?: object): Context {
  return {
    get: (name: string) => name === 'terminals' ? terminals : name === 'agents' ? agents : undefined,
  } as unknown as Context
}

const agent = { id: 's1' }
const agents = { get: (id: string & object) => String(id) === 's1' ? agent : undefined }

describe('TerminalHost', () => {
  it('open prefers the shell backend, roots in the workspace, and maps the snapshot', async () => {
    const fake = fakeTerminals()
    const host = new TerminalHost(fakeCtx(fake.service, agents))
    const result = await host.open({ ownerSessionId: 's1', workspaceId: 'w1' as never, name: 'main' }, '/ws/root')
    expect(result).toEqual({
      session: { sessionId: 'pty-1', name: 'main', type: 'shell', pid: 4242, status: { kind: 'running' } },
      motd: 'welcome\n',
    })
    expect(fake.spawned).toEqual([{ type: 'shell', cwd: '/ws/root', name: 'main' }])
  })

  it('open falls back to the first registered backend when no shell exists', async () => {
    const fake = fakeTerminals({ backends: ['pwsh'] })
    const host = new TerminalHost(fakeCtx(fake.service, agents))
    await host.open({ ownerSessionId: 's1', workspaceId: 'w1' as never }, '/r')
    expect(fake.spawned[0].type).toBe('pwsh')
  })

  it('open degrades to typed errors: no service, dead owner, empty registry, backend failure', async () => {
    const host = new TerminalHost(fakeCtx())
    expect(await host.open({ ownerSessionId: 's1', workspaceId: 'w1' as never }, '/r'))
      .toEqual({ error: { code: 'terminal-unavailable', message: expect.stringContaining('dsh-terminal') } })

    const noOwner = new TerminalHost(fakeCtx(fakeTerminals().service, agents))
    expect(await noOwner.open({ ownerSessionId: 'gone', workspaceId: 'w1' as never }, '/r'))
      .toEqual({ error: { code: 'owner-not-live', message: expect.any(String) } })

    const noBackend = new TerminalHost(fakeCtx(fakeTerminals({ backends: [] }).service, agents))
    expect(await noBackend.open({ ownerSessionId: 's1', workspaceId: 'w1' as never }, '/r'))
      .toEqual({ error: { code: 'terminal-no-backend', message: expect.stringContaining('backend') } })

    const exploding = new TerminalHost(fakeCtx(fakeTerminals({ backends: ['explode'] }).service, agents))
    expect(await exploding.open({ ownerSessionId: 's1', workspaceId: 'w1' as never }, '/r'))
      .toEqual({ error: { code: 'terminal-open', message: 'backend boom' } })
  })

  it('send delegates to the owner-scoped session and maps the settled result', async () => {
    const fake = fakeTerminals()
    const host = new TerminalHost(fakeCtx(fake.service, agents))
    const result = await host.send({ ownerSessionId: 's1', sessionId: 'pty-1', text: 'ls', submit: true })
    expect(result).toEqual({
      viewport: 'ran:ls',
      waitReason: 'inferred_idle',
      sessionStatus: { kind: 'exited', exitCode: 3, signal: null },
      truncated: false,
    })
    expect(fake.sends).toEqual([{ id: 'pty-1', text: 'ls', submit: true }])
  })

  it('read pages retained scrollback and signal/close reach the same session', async () => {
    const fake = fakeTerminals()
    const host = new TerminalHost(fakeCtx(fake.service, agents))
    expect(await host.read({ ownerSessionId: 's1', sessionId: 'pty-1', offset: 0, count: 5 }))
      .toEqual({ text: 'history\n', totalLines: 10, lineBegin: 5, lineEnd: 10, truncated: false })
    expect(fake.reads).toEqual([{ id: 'pty-1', offset: 0, count: 5 }])

    expect(await host.signal({ ownerSessionId: 's1', sessionId: 'pty-1', signal: 'SIGINT' }))
      .toEqual({ delivered: true, targetPgid: 7 })
    expect(fake.signals).toEqual([{ id: 'pty-1', signal: 'SIGINT' }])

    expect(await host.close({ ownerSessionId: 's1', sessionId: 'pty-1' })).toEqual({ closed: true })
    expect(fake.kills).toEqual([{ id: 'pty-1', reason: 'web terminal closed' }])
  })

  it('signal rejects signals outside the permitted set before touching the service', async () => {
    const fake = fakeTerminals()
    const host = new TerminalHost(fakeCtx(fake.service, agents))
    expect(await host.signal({ ownerSessionId: 's1', sessionId: 'pty-1', signal: 'SIGUSR1' as never }))
      .toEqual({ error: { code: 'terminal-signal', message: expect.stringContaining('SIGUSR1') } })
    expect(fake.signals).toEqual([])
  })

  it('list maps the owner agent\'s live sessions', async () => {
    const fake = fakeTerminals({
      snapshots: [{ sessionId: 'pty-9', type: 'shell', pid: 1, status: { kind: 'running' } }],
    })
    const host = new TerminalHost(fakeCtx(fake.service, agents))
    expect(await host.list('s1')).toEqual({
      sessions: [{ sessionId: 'pty-9', type: 'shell', pid: 1, status: { kind: 'running' } }],
    })
    expect(await host.list('gone')).toEqual({ error: { code: 'owner-not-live', message: expect.any(String) } })
  })

  it('operations on a session of a foreign owner never reach the service', async () => {
    const fake = fakeTerminals()
    const host = new TerminalHost(fakeCtx(fake.service, agents))
    const result = await host.send({ ownerSessionId: 'gone', sessionId: 'pty-1', text: 'ls', submit: true })
    expect('error' in result && result.error.code).toBe('owner-not-live')
    expect(fake.sends).toEqual([])
  })
})
