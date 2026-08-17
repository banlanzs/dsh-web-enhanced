/**
 * Memory orchestrator: settings-namespace registration, the standing
 * `systemPrompt` section, the `save_memory` tool, and the recall hook that
 * injects matching memories as user-role context ahead of each step.
 *
 * All host services are read structurally (`ctx.get('...' as never, false)`).
 * A deployment that composes neither the settings service, the system-prompt
 * registry, the workspace registry, nor the tool registry still mounts the
 * plugin and the feature simply stays inert.
 *
 * The pre-step listener is a Cordis waterfall: it MUST call `next()` first
 * and return its resolved decision, otherwise downstream listeners never run.
 * After `next()`, when the model is about to enter the step, the hook walks
 * the session's derived messages, locates the latest user-role text query,
 * searches the memory store for matches, and injects a user message carrying
 * the hits so the model can recall them without a tool call.
 * @module dsh-web-enhanced/src/memory
 */
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import z from '@deepseek-ai/schemastery';
import { openSharedDomain } from "./board.js";
import { MemoryStore } from "./memory-store.js";
/** Settings namespace owning the memory feature switch. */
export const MEMORY_SETTINGS_NS = 'dsh-web-enhanced-memory';
/** Standing prompt section name, unique across every prompt registration. */
export const MEMORY_SECTION = 'web-enhanced:memory';
/**
 * Render order of the section: after the deployment persona (`0`) and the
 * global prompt (`50`), before tool guidance (`100`–`199`), so it reads as
 * project standing instructions.
 */
export const MEMORY_ORDER = 60;
/** How many recent memories the standing prompt section lists. */
const STANDING_MEMORY_CAP = 10;
/** Schema of the `dsh-web-enhanced-memory` settings namespace. */
export const MemorySettingsSchema = z.object({
    enabled: z.boolean().default(true),
});
/** Module state: standing prompt text, store, settings scope, registry. */
let standingText = '';
let store;
let settingsScope;
let registry;
/**
 * Resolve the memory feature switch.
 *
 * Returns `true` when no settings service is composed: the feature is on by
 * default in deployments without a settings namespace. When a scope exists,
 * the explicit `enabled === true` check is the only path that opts in.
 * @returns whether memory injection and the standing prompt section are live.
 */
function memoryEnabled() {
    if (settingsScope === undefined)
        return true;
    const value = settingsScope.get();
    if (value === null || value === undefined || typeof value !== 'object')
        return false;
    return value.enabled === true;
}
/**
 * Resolve the workspace id that owns the cwd of a session, when one is
 * registered; otherwise return `null` so saves land in the global pool.
 * @param registry - workspace registry face; `undefined` skips resolution.
 * @param cwd - session working directory; `null` skips resolution.
 * @returns the matching workspace id, or `null` when none matches.
 */
function resolveWorkspaceId(registry, cwd) {
    if (registry === undefined || cwd === null)
        return null;
    try {
        const workspaces = registry.list();
        for (const workspace of workspaces) {
            if (workspace.path === cwd)
                return workspace.id;
        }
    }
    catch {
        return null;
    }
    return null;
}
/**
 * Reverse-scan the session's derived messages for the latest user-role text.
 * @param session - session face with optional `deriveMessages`.
 * @returns the latest user message text trimmed to 500 characters, or `''`.
 */
function lastUserQuery(session) {
    const messages = session.deriveMessages?.();
    if (messages === undefined)
        return '';
    for (let index = messages.length - 1; index >= 0; index -= 1) {
        const message = messages[index];
        if (message === undefined)
            continue;
        if (message.role !== 'user')
            continue;
        const content = message.content;
        if (typeof content === 'string')
            return content.slice(0, 500);
    }
    return '';
}
/**
 * Refresh the standing prompt text from the latest memories of one workspace.
 * On error the standing text is cleared so a broken store cannot leave stale
 * instructions in the prompt.
 * @param workspaceId - workspace to list; `null` lists the global pool.
 */
async function updateStanding(workspaceId) {
    if (store === undefined)
        return;
    try {
        const records = await store.byWorkspace(workspaceId);
        const lines = [];
        for (const record of records) {
            if (lines.length >= STANDING_MEMORY_CAP)
                break;
            lines.push(`[记忆 ${record.kind}] ${record.summary}：${record.body}`);
        }
        standingText = lines.join('\n');
    }
    catch {
        standingText = '';
    }
}
/**
 * The save-memory tool definition.
 *
 * `parameters` is the FULL JSON Schema object the registry sends to the
 * model (`{ type: 'object', properties, required }`), not the per-field
 * shorthand accepted by `@deepseek-ai/dsh-tools`' `defineTool` — this
 * plugin does not depend on that package, so the literal is written in the
 * registry-ready shape directly.
 */
const memoryToolDefinition = {
    name: 'save_memory',
    description: 'Save a durable long-term memory for the current project so future sessions can recall it. Use for user preferences, project conventions, important decisions, and non-obvious fixes. Memories are recalled automatically in future sessions.',
    parameters: {
        type: 'object',
        properties: {
            kind: {
                type: 'string',
                enum: ['user', 'feedback', 'project', 'reference'],
                description: 'Memory classification: user = who the user is and what they prefer; feedback = guidance on how work should be done; project = project conventions and constraints; reference = pointers to external resources.',
            },
            summary: {
                type: 'string',
                description: 'One-sentence summary, at most 120 characters.',
            },
            body: {
                type: 'string',
                description: 'The complete memory content.',
            },
        },
        required: ['kind', 'summary', 'body'],
        additionalProperties: false,
    },
    output: {
        schema: {
            type: 'object',
            properties: {
                ok: { type: 'boolean' },
                id: { type: 'string' },
                deduplicated: { type: 'boolean' },
            },
            required: ['ok', 'id', 'deduplicated'],
            additionalProperties: false,
        },
        render(_args, value) {
            return [{
                    type: 'text',
                    text: value.deduplicated === true
                        ? `更新了已有记忆 ${String(value.id)}。`
                        : `已保存记忆 ${String(value.id)}。`,
                }];
        },
    },
    async execute(args, exec) {
        const session = exec.agent.session;
        const cwd = typeof session?.header?.cwd === 'string' ? session.header.cwd : null;
        const workspaceId = resolveWorkspaceId(registry, cwd);
        const sourceSessionId = session?.id === undefined ? null : String(session.id);
        const result = await store.save({
            workspaceId,
            kind: args.kind,
            summary: args.summary,
            body: args.body,
            sourceSessionId,
        });
        return { ok: result.ok, id: String(result.id), deduplicated: result.deduplicated };
    },
};
/**
 * Mount the memory orchestrator: open the store, register the settings
 * namespace, install the standing prompt section, register the `save_memory`
 * tool, and wire the recall hook.
 * @param ctx - the plugin's host context.
 * @param domain - optional pre-opened web-enhanced storage domain.
 */
export function applyMemory(ctx, domain) {
    store = new MemoryStore(ctx, domain ?? openSharedDomain(ctx));
    registry = ctx.get('workspaceRegistry', false);
    const settings = ctx.get('settings', false);
    if (settings !== undefined && typeof settings.register === 'function') {
        try {
            settingsScope = settings.register(MEMORY_SETTINGS_NS, MemorySettingsSchema, {
                base: {},
                applies: 'live',
            });
        }
        catch {
            settingsScope = undefined;
        }
    }
    const systemPrompt = ctx.get('systemPrompt', false);
    if (systemPrompt !== undefined && typeof systemPrompt.section === 'function') {
        ctx.effect(() => systemPrompt.section({
            name: MEMORY_SECTION,
            order: MEMORY_ORDER,
            text: () => memoryEnabled() ? standingText : '',
        }), 'dsh-web-enhanced: memory prompt section');
    }
    const tools = ctx.get('tools', false);
    if (tools !== undefined && typeof tools.register === 'function') {
        ctx.effect(() => tools.register(memoryToolDefinition), 'dsh-web-enhanced: save_memory tool');
    }
    const injectedContent = new Map();
    ctx.on('agent/pre-step', (async (payload, next) => {
        const decision = await next();
        if (decision === null || decision === undefined)
            return decision;
        if (decision.kind !== 'enter')
            return decision;
        if (!memoryEnabled())
            return decision;
        const agent = payload.agent;
        const session = agent?.session;
        if (session === undefined || store === undefined)
            return decision;
        const sessionKey = session.id === undefined ? '' : String(session.id);
        const cwd = typeof session.header?.cwd === 'string' ? session.header.cwd : null;
        const workspaceId = resolveWorkspaceId(registry, cwd);
        void updateStanding(workspaceId);
        const query = lastUserQuery(session);
        if (query === '')
            return decision;
        const hits = await store.search(workspaceId, query);
        if (hits.length === 0)
            return decision;
        const content = '[回忆] 基于你正在处理的工作，以下是项目记忆中可能相关的内容：\n'
            + hits.map(hit => `[${hit.kind}] ${hit.summary}：${hit.body}`).join('\n');
        if (injectedContent.get(sessionKey) === content)
            return decision;
        injectedContent.set(sessionKey, content);
        if (typeof agent?.inject === 'function') {
            try {
                agent.inject(createUserMessage({
                    content: [{ type: 'text', text: content }],
                    source: { kind: 'user' },
                }));
            }
            catch (error) {
                ctx.logger.warn(`dsh-web-enhanced memory: agent context injection failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return decision;
    }));
}
