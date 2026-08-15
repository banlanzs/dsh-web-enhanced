/**
 * Task execution engine: drives one task prompt through a freshly created
 * agent session to quiescence and summarizes the outcome. Mirrors the
 * headless runner's drive sequence so task runs behave like one-shot
 * `dsh --profile headless` runs inside the web host.
 * @module dsh-web-enhanced/src/run-task
 */
import { randomUUID } from 'node:crypto';
import { installModelSelection } from '@deepseek-ai/dsh-agent';
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import { SessionId } from '@deepseek-ai/dsh-session';
/**
 * Aggregate the last assistant text and turn outcome of one run interval.
 * @param events - session events of the run's session.
 * @param firstSeq - first event sequence belonging to the run.
 * @returns the structured result.
 */
export function summarize(events, firstSeq) {
    let started = false;
    let text = '';
    let reasonKind = undefined;
    let errorCode;
    let errorMessage;
    for (const event of events) {
        if (event.seq < firstSeq)
            continue;
        if (event.type === 'turn/start') {
            started = true;
            continue;
        }
        if (!started)
            continue;
        if (event.type === 'assistant/message') {
            const joined = event.data.message.content
                .filter(block => block.type === 'text')
                .map(block => block.text)
                .join('');
            if (joined !== '')
                text = joined;
        }
        if (event.type === 'turn/end') {
            reasonKind = event.data.reason.kind === 'completed'
                ? 'completed'
                : event.data.reason.kind === 'error' ? 'error' : 'interrupted';
            if (event.data.reason.kind === 'error') {
                errorCode = event.data.reason.error.code;
                errorMessage = event.data.reason.error.message;
            }
        }
    }
    return {
        ...(reasonKind === undefined ? {} : { reasonKind }),
        ...(text === '' ? {} : { summary: text }),
        ...(errorCode === undefined ? {} : { errorCode }),
        ...(errorMessage === undefined ? {} : { errorMessage }),
    };
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
export async function createTaskAgent(deps, target) {
    if (deps.awaitLoader !== undefined)
        await deps.awaitLoader();
    const selection = deps.agentDefaultModel.currentSelection();
    const sessionId = SessionId(`task-${randomUUID()}`);
    const presets = deps.presets();
    const agentPreset = presets === undefined ? undefined : (await presets.resolve()).id;
    const { agent } = await deps.agents.create({
        sessionId,
        meta: {
            cwd: target.cwd,
            ...agentPreset === undefined ? {} : { agentPreset },
        },
        agentOptions: { provider: selection.provider, model: selection.model },
        setup: async (agentCtx) => {
            const selected = { current: selection, assembled: undefined };
            installModelSelection(agentCtx, selected);
            if (presets !== undefined)
                await presets.mount(agentCtx, agentPreset);
        },
    });
    // Membership after creation, like the host's own create path: the registry
    // validates the session's header cwd against the workspace path, so the
    // session must exist first.
    if (target.workspaceId !== null && deps.attachWorkspaceSession !== undefined) {
        await deps.attachWorkspaceSession(target.workspaceId, sessionId);
    }
    await agent.whenIdle();
    return { agent, sessionId };
}
/**
 * Drive the prepared agent to quiescence and summarize the run.
 * @param deps - core services.
 * @param agent - live agent from {@link createTaskAgent}.
 * @param prompt - task prompt.
 * @returns the run outcome.
 */
export async function executeTaskAgent(deps, agent, prompt) {
    const firstSeq = agent.session.seq;
    agent.followup(createUserMessage({
        content: [{ type: 'text', text: prompt }],
        source: { kind: 'user' },
    }));
    await agent.whenIdle();
    await deps.sessions.flush(agent.session);
    return {
        result: summarize(agent.session.events, firstSeq),
        sessionId: SessionId(agent.session.id),
    };
}
