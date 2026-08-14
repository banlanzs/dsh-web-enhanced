/**
 * Task execution engine: drives one task prompt through a freshly created
 * agent session to quiescence and summarizes the outcome. Mirrors the
 * headless runner's drive sequence so task runs behave like one-shot
 * `dsh --profile headless` runs inside the web host.
 * @module dsh-web-enhanced/src/run-task
 */

import { randomUUID } from 'node:crypto'
import { installModelSelection } from '@deepseek-ai/dsh-agent'
import type { Agent, AgentRegistry, ModelSelectionRef } from '@deepseek-ai/dsh-agent'
import type { AgentDefaultModelConfig } from '@deepseek-ai/dsh-agent-default-model'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { SessionId } from '@deepseek-ai/dsh-session'
import type { SessionEvent, SessionStore } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/cordis-plugin-loader'
import type { TaskResult } from './types.ts'

/** The core services a task run needs (structural: the gateway resolves them). */
export interface RunDeps {
  /** Agent registry; `create` mints the run's session and scoped world. */
  readonly agents: AgentRegistry
  /** Session store; `flush` settles durability of the run log. */
  readonly sessions: SessionStore
  /** Deployment default model selection for runs without a task choice. */
  readonly agentDefaultModel: AgentDefaultModelConfig
  /** Loader settle hook; undefined in unit harnesses. */
  readonly awaitLoader: (() => Promise<unknown>) | undefined
}

/** Outcome of one settled run plus the session it used. */
export interface RunOutcome {
  readonly result: TaskResult
  readonly sessionId: SessionId
}

/**
 * Aggregate the last assistant text and turn outcome of one run interval.
 * @param events - session events of the run's session.
 * @param firstSeq - first event sequence belonging to the run.
 * @returns the structured result.
 */
export function summarize(events: readonly SessionEvent[], firstSeq: number): TaskResult {
  let started = false
  let text = ''
  let reasonKind: TaskResult['reasonKind'] = undefined
  let errorCode: string | undefined
  let errorMessage: string | undefined
  for (const event of events) {
    if (event.seq < firstSeq) continue
    if (event.type === 'turn/start') {
      started = true
      continue
    }
    if (!started) continue
    if (event.type === 'assistant/message') {
      const joined = event.data.message.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('')
      if (joined !== '') text = joined
    }
    if (event.type === 'turn/end') {
      reasonKind = event.data.reason.kind === 'completed'
        ? 'completed'
        : event.data.reason.kind === 'error' ? 'error' : 'interrupted'
      if (event.data.reason.kind === 'error') {
        errorCode = event.data.reason.error.code
        errorMessage = event.data.reason.error.message
      }
    }
  }
  return {
    ...(reasonKind === undefined ? {} : { reasonKind }),
    ...(text === '' ? {} : { summary: text }),
    ...(errorCode === undefined ? {} : { errorCode }),
    ...(errorMessage === undefined ? {} : { errorMessage }),
  }
}

/**
 * Create the run's agent session (settled loader, default model selection).
 * @param deps - core services.
 * @param cwd - run working directory.
 * @returns the live agent and its session id.
 */
export async function createTaskAgent(deps: RunDeps, cwd: string): Promise<{ agent: Agent; sessionId: SessionId }> {
  if (deps.awaitLoader !== undefined) await deps.awaitLoader()
  const selection = deps.agentDefaultModel.currentSelection()
  const sessionId = SessionId(`task-${randomUUID()}`)
  const { agent } = await deps.agents.create({
    sessionId,
    meta: { cwd },
    agentOptions: { provider: selection.provider, model: selection.model },
    setup: (agentCtx) => {
      const selected: ModelSelectionRef = { current: selection, assembled: undefined }
      installModelSelection(agentCtx, selected)
    },
  })
  await agent.whenIdle()
  return { agent, sessionId }
}

/**
 * Drive the prepared agent to quiescence and summarize the run.
 * @param deps - core services.
 * @param agent - live agent from {@link createTaskAgent}.
 * @param prompt - task prompt.
 * @returns the run outcome.
 */
export async function executeTaskAgent(deps: RunDeps, agent: Agent, prompt: string): Promise<RunOutcome> {
  const firstSeq = agent.session.seq
  agent.followup(createUserMessage({
    content: [{ type: 'text', text: prompt }],
    source: { kind: 'user' },
  }))
  await agent.whenIdle()
  await deps.sessions.flush(agent.session)
  return {
    result: summarize(agent.session.events, firstSeq),
    sessionId: SessionId(agent.session.id),
  }
}
