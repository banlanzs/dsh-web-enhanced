import { describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { SessionId } from '@deepseek-ai/dsh-session'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import { createTaskAgent, executeTaskAgent, summarize } from '../src/run-task.ts'
import type { RunDeps } from '../src/run-task.ts'
import type { TaskResult } from '../src/types.ts'

function event(seq: number, type: string, data: unknown): SessionEvent {
  return { seq, time: seq, type, data } as unknown as SessionEvent
}

function fakeAgent(events: SessionEvent[], seq = 10): Agent {
  return {
    whenIdle: vi.fn(async () => {}),
    followup: vi.fn(),
    session: { seq, events, id: 's-run' },
  } as unknown as Agent
}

function fakeDeps(agent: Agent): RunDeps {
  return {
    agents: { create: vi.fn(async () => ({ agent, dispose: async () => {} })) } as never,
    sessions: { flush: vi.fn(async () => true) } as never,
    agentDefaultModel: { currentSelection: () => ({ provider: 'deepseek', model: 'deepseek-chat' }) } as never,
    awaitLoader: vi.fn(async () => {}),
  }
}

describe('summarize', () => {
  it('collects the last assistant text and the completed reason', () => {
    const events = [
      event(9, 'user/message', {}),
      event(10, 'turn/start', { turn: 1 }),
      event(11, 'assistant/message', { message: { content: [{ type: 'text', text: 'first' }, { type: 'tool_use', id: 'x' }] } }),
      event(12, 'assistant/message', { message: { content: [{ type: 'text', text: 'final' }] } }),
      event(13, 'turn/end', { turn: 1, reason: { kind: 'completed' } }),
    ]
    expect(summarize(events, 10)).toEqual({ reasonKind: 'completed', summary: 'final' })
  })

  it('records the structured error of a failed turn', () => {
    const events = [
      event(10, 'turn/start', { turn: 1 }),
      event(11, 'turn/end', { turn: 1, reason: { kind: 'error', error: { code: 'LLM_TIMEOUT', message: 'boom' } } }),
    ]
    expect(summarize(events, 10)).toEqual({
      reasonKind: 'error',
      errorCode: 'LLM_TIMEOUT',
      errorMessage: 'boom',
    })
  })

  it('classifies non-error non-completed endings as interrupted', () => {
    const events = [
      event(10, 'turn/start', { turn: 1 }),
      event(11, 'turn/end', { turn: 1, reason: { kind: 'max-tokens' } }),
    ]
    expect(summarize(events, 10)).toEqual({ reasonKind: 'interrupted' })
  })

  it('ignores events outside the run interval and turns without text', () => {
    const events = [event(9, 'turn/end', { turn: 1, reason: { kind: 'completed' } })]
    expect(summarize(events, 10)).toEqual({})
  })

  it('skips messages before the turn and empty assistant text', () => {
    const events = [
      event(10, 'user/message', {}),
      event(11, 'turn/start', { turn: 1 }),
      event(12, 'assistant/message', { message: { content: [{ type: 'tool_use', id: 'x' }] } }),
      event(13, 'turn/end', { turn: 1, reason: { kind: 'completed' } }),
    ]
    expect(summarize(events, 10)).toEqual({ reasonKind: 'completed' })
  })
})

describe('createTaskAgent', () => {
  it('awaits the loader, creates the agent with the default selection, and waits for idle', async () => {
    const agent = fakeAgent([])
    const deps = fakeDeps(agent)
    const { agent: created, sessionId } = await createTaskAgent(deps, 'C:\\ws')
    expect(created).toBe(agent)
    expect(String(sessionId)).toMatch(/^task-/u)
    expect(deps.awaitLoader).toHaveBeenCalledTimes(1)
    const create = deps.agents.create as ReturnType<typeof vi.fn>
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      sessionId,
      meta: { cwd: 'C:\\ws' },
      agentOptions: { provider: 'deepseek', model: 'deepseek-chat' },
    }))
    const options = create.mock.calls[0]![0]
    await options.setup(new Context())
    expect(agent.whenIdle).toHaveBeenCalled()
  })

  it('skips the loader wait when no loader is present', async () => {
    const agent = fakeAgent([])
    const deps = { ...fakeDeps(agent), awaitLoader: undefined }
    await createTaskAgent(deps, 'C:\\ws')
    expect(agent.whenIdle).toHaveBeenCalled()
  })
})

describe('executeTaskAgent', () => {
  it('follows up with the prompt, waits for idle, flushes, and summarizes', async () => {
    const events = [
      event(10, 'turn/start', { turn: 1 }),
      event(11, 'assistant/message', { message: { content: [{ type: 'text', text: 'done' }] } }),
      event(12, 'turn/end', { turn: 1, reason: { kind: 'completed' } }),
    ]
    const agent = fakeAgent(events)
    const deps = fakeDeps(agent)
    const outcome = await executeTaskAgent(deps, agent, 'run the tests')
    expect(agent.followup).toHaveBeenCalledWith(expect.objectContaining({
      role: 'user',
      content: [{ type: 'text', text: 'run the tests' }],
      source: { kind: 'user' },
    }))
    expect(deps.sessions.flush).toHaveBeenCalledWith(agent.session)
    expect(outcome.sessionId).toBe(SessionId('s-run'))
    expect(outcome.result).toEqual<TaskResult>({ reasonKind: 'completed', summary: 'done' })
  })
})
