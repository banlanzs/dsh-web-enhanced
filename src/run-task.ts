/**
 * Task execution engine: drives one task prompt through a freshly created
 * agent session to quiescence and summarizes the outcome. Mirrors the
 * headless runner's drive sequence so task runs behave like one-shot
 * `dsh --profile headless` runs inside the web host.
 * @module dsh-web-enhanced/src/run-task
 */

import { randomUUID } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import { installModelSelection } from '@deepseek-ai/dsh-agent'
import type { Agent, AgentRegistry, ModelSelectionRef } from '@deepseek-ai/dsh-agent'
import type { AgentDefaultModelConfig } from '@deepseek-ai/dsh-agent-default-model'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { SessionId } from '@deepseek-ai/dsh-session'
import type { SessionEvent, SessionStore } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/cordis-plugin-loader'
import type { TaskResult, WorkspaceId } from './types.ts'

/**
 * The preset roster face a run needs, structurally.
 *
 * Declared here rather than imported: `agent-presets` is the host's own
 * dependency, and a deployment without a roster must still run tasks — it just
 * composes nothing, which is the behaviour the host itself falls back to.
 */
export interface PresetRoster {
  resolve(id?: string): Promise<{ readonly id: string }>
  mount(agentCtx: Context, id?: string): Promise<unknown>
}

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
  /**
   * Resolve the deployment's agent preset roster, or `undefined` when none is
   * composed.
   *
   * A thunk rather than a value: the roster is a service that may mount after
   * this gateway does, and `BoardDeps` spreads these fields.
   *
   * Without a roster a run's session gets only what the host mounted globally
   * — no `bash`, no `read_file`, no `write_file` — because those tools are
   * registered by the plugins a PRESET composes, not by the host root.
   */
  readonly presets: () => PresetRoster | undefined
  /**
   * Record the run's session on its workspace, so the session shows up under
   * that project and every workspace-derived surface resolves it. Never
   * rejects — a refused membership is reported by the implementation, not
   * raised at the run. `undefined` in unit harnesses.
   */
  readonly attachWorkspaceSession:
    | ((workspaceId: WorkspaceId, sessionId: SessionId) => Promise<void>)
    | undefined
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

/** Where one run happens: the directory it works in and the project it belongs to. */
export interface RunTarget {
  /** Working directory of the run (the workspace root, or the host cwd). */
  readonly cwd: string
  /** Workspace the run belongs to; `null` for an unbound task. */
  readonly workspaceId: WorkspaceId | null
}

/**
 * Create the run's agent session: settled loader, default model selection,
 * the deployment's agent preset, and workspace membership.
 *
 * The preset is what carries the tools. A session composed without one runs on
 * whatever the host mounted globally, which is why an unbound run could see
 * only the root-registered tools and none of `bash`, `read_file`, or
 * `write_file`. The id is resolved BEFORE creation because the session
 * boundary snapshots `meta` before setup begins, and mounting happens INSIDE
 * setup so a failing composition rolls the whole creation back.
 * @param deps - core services.
 * @param target - run directory and workspace membership.
 * @returns the live agent and its session id.
 */
export async function createTaskAgent(deps: RunDeps, target: RunTarget): Promise<{ agent: Agent; sessionId: SessionId }> {
  if (deps.awaitLoader !== undefined) await deps.awaitLoader()
  const selection = deps.agentDefaultModel.currentSelection()
  const sessionId = SessionId(`task-${randomUUID()}`)
  const presets = deps.presets()
  const agentPreset = presets === undefined ? undefined : (await presets.resolve()).id
  const { agent } = await deps.agents.create({
    sessionId,
    meta: {
      cwd: target.cwd,
      ...agentPreset === undefined ? {} : { agentPreset },
    },
    agentOptions: { provider: selection.provider, model: selection.model },
    setup: async (agentCtx) => {
      const selected: ModelSelectionRef = { current: selection, assembled: undefined }
      installModelSelection(agentCtx, selected)
      if (presets !== undefined) await presets.mount(agentCtx, agentPreset)
    },
  })
  // Membership after creation, like the host's own create path: the registry
  // validates the session's header cwd against the workspace path, so the
  // session must exist first.
  if (target.workspaceId !== null && deps.attachWorkspaceSession !== undefined) {
    await deps.attachWorkspaceSession(target.workspaceId, sessionId)
  }
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
