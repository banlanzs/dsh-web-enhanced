/**
 * Task execution engine: drives one task prompt through a freshly created
 * agent session to quiescence and summarizes the outcome. Mirrors the
 * headless runner's drive sequence so task runs behave like one-shot
 * `dsh --profile headless` runs inside the web host.
 * @module dsh-web-enhanced/src/run-task
 */
import type { Agent, AgentRegistry } from '@deepseek-ai/dsh-agent';
import type { AgentDefaultModelConfig } from '@deepseek-ai/dsh-agent-default-model';
import { SessionId } from '@deepseek-ai/dsh-session';
import type { SessionEvent, SessionStore } from '@deepseek-ai/dsh-session';
import type { TaskResult } from './types.ts';
/** The core services a task run needs (structural: the gateway resolves them). */
export interface RunDeps {
    /** Agent registry; `create` mints the run's session and scoped world. */
    readonly agents: AgentRegistry;
    /** Session store; `flush` settles durability of the run log. */
    readonly sessions: SessionStore;
    /** Deployment default model selection for runs without a task choice. */
    readonly agentDefaultModel: AgentDefaultModelConfig;
    /** Loader settle hook; undefined in unit harnesses. */
    readonly awaitLoader: (() => Promise<unknown>) | undefined;
}
/** Outcome of one settled run plus the session it used. */
export interface RunOutcome {
    readonly result: TaskResult;
    readonly sessionId: SessionId;
}
/**
 * Aggregate the last assistant text and turn outcome of one run interval.
 * @param events - session events of the run's session.
 * @param firstSeq - first event sequence belonging to the run.
 * @returns the structured result.
 */
export declare function summarize(events: readonly SessionEvent[], firstSeq: number): TaskResult;
/**
 * Create the run's agent session (settled loader, default model selection).
 * @param deps - core services.
 * @param cwd - run working directory.
 * @returns the live agent and its session id.
 */
export declare function createTaskAgent(deps: RunDeps, cwd: string): Promise<{
    agent: Agent;
    sessionId: SessionId;
}>;
/**
 * Drive the prepared agent to quiescence and summarize the run.
 * @param deps - core services.
 * @param agent - live agent from {@link createTaskAgent}.
 * @param prompt - task prompt.
 * @returns the run outcome.
 */
export declare function executeTaskAgent(deps: RunDeps, agent: Agent, prompt: string): Promise<RunOutcome>;
