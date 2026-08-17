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
 * After `next()`, when the model is about to enter the step, the hook reads
 * the latest user-role text query out of the claimed inbox messages, searches
 * the memory store for matches, drops whatever the standing section already
 * carries, and appends the survivors to THIS step's messages as a
 * `notice`-form plugin context, which the transcript renders as one collapsed
 * row naming the hit count.
 * @module dsh-web-enhanced/src/memory
 */
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import z from '@deepseek-ai/schemastery';
import { openSharedDomain } from "./board.js";
import { MemoryStore } from "./memory-store.js";
import { MEMORY_SETTINGS_NS } from "./types.js";
/**
 * Settings namespace owning the memory feature switch. Declared in `types.ts`
 * so the gateway can name it without importing this module's runtime.
 */
export { MEMORY_SETTINGS_NS };
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
/** How many sessions the recall de-duplication table remembers. */
const INJECTED_CACHE_CAP = 64;
/** Schema of the `dsh-web-enhanced-memory` settings namespace. */
export const MemorySettingsSchema = z.object({
    enabled: z.boolean().default(true),
});
/** Module state: standing prompt text, store, settings scope, registry. */
let standingText = '';
/** Ids already carried by the standing section; the recall skips them. */
let standingIds = new Set();
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
 * Normalize one filesystem path for prefix comparison.
 *
 * Windows paths mix separators and case, and a workspace root and a session
 * cwd may be recorded by different producers; without normalization the two
 * spellings of the same directory compare unequal.
 * @param value - a raw filesystem path.
 * @returns the path with forward slashes, no trailing slash, lowercased on Windows.
 */
function normalizePath(value) {
    const forward = value.replace(/\\/gu, '/').replace(/\/+$/u, '');
    return process.platform === 'win32' ? forward.toLowerCase() : forward;
}
/**
 * Resolve the workspace id that owns the cwd of a session, when one is
 * registered; otherwise return `null` so saves land in the global pool.
 *
 * A session opened in a SUBDIRECTORY of a registered workspace belongs to
 * that workspace: an exact-path match dropped every such session into the
 * global pool, where its memories mixed with genuinely cross-project ones.
 * The longest matching root wins, so a workspace nested inside another one
 * still claims its own sessions.
 * @param registry - workspace registry face; `undefined` skips resolution.
 * @param cwd - session working directory; `null` skips resolution.
 * @returns the matching workspace id, or `null` when none matches.
 */
function resolveWorkspaceId(registry, cwd) {
    if (registry === undefined || cwd === null)
        return null;
    const target = normalizePath(cwd);
    if (target === '')
        return null;
    let bestId;
    let bestLength = -1;
    try {
        for (const workspace of registry.list()) {
            const root = normalizePath(workspace.path);
            if (root === '')
                continue;
            if (target !== root && !target.startsWith(`${root}/`))
                continue;
            if (root.length <= bestLength)
                continue;
            bestId = workspace.id;
            bestLength = root.length;
        }
    }
    catch {
        return null;
    }
    return bestId ?? null;
}
/**
 * Flatten one message content value into queryable text.
 *
 * The wire message shape carries content as an array of blocks
 * (`[{ type: 'text', text: … }, …]`), not a raw string; only text blocks
 * contribute. A raw string is accepted for tests and minimal harnesses.
 * @param content - the message's content field.
 * @returns joined text, or `''`.
 */
export function textOfMessageContent(content) {
    if (typeof content === 'string')
        return content;
    if (!Array.isArray(content))
        return '';
    const parts = [];
    for (const block of content) {
        if (typeof block !== 'object' || block === null)
            continue;
        const record = block;
        if (record.type !== 'text')
            continue;
        if (typeof record.text === 'string' && record.text !== '')
            parts.push(record.text);
    }
    return parts.join(' ');
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
    return lastUserText(messages);
}
/**
 * Reverse-scan a message list for the latest user-role text.
 *
 * The pre-step waterfall receives the inbox messages CLAIMED for this step —
 * that is the user's actual query. The session-derived list is only a
 * fallback (it may still contain plugin context, reminders, or skill
 * catalogs that were appended after the real question).
 * @param messages - message list to scan.
 * @returns the latest user-role text trimmed to 500 characters, or `''`.
 */
export function lastUserText(messages) {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
        const message = messages[index];
        if (typeof message !== 'object' || message === null)
            continue;
        const record = message;
        if (record.role !== 'user')
            continue;
        const text = textOfMessageContent(record.content);
        if (text !== '')
            return text.slice(0, 500);
    }
    return '';
}
/**
 * Refresh the standing prompt text from the latest memories visible to one
 * workspace (its own plus the global pool).
 *
 * The ids that made it into the section are recorded so the recall hook can
 * skip them: a memory already standing in the system prompt does not need to
 * be injected a second time as turn context.
 * On error the standing text is cleared so a broken store cannot leave stale
 * instructions in the prompt.
 * @param workspaceId - workspace to list for; `null` lists the global pool.
 */
async function updateStanding(workspaceId) {
    if (store === undefined)
        return;
    try {
        const records = await store.visibleTo(workspaceId);
        const lines = [];
        const ids = new Set();
        for (const record of records) {
            if (lines.length >= STANDING_MEMORY_CAP)
                break;
            lines.push(`[记忆 ${record.kind}] ${record.summary}：${record.body}`);
            ids.add(String(record.id));
        }
        standingText = lines.join('\n');
        standingIds = ids;
    }
    catch {
        standingText = '';
        standingIds = new Set();
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
    // Module state is process-wide; a remount must not inherit the previous
    // mount's standing text or its id set.
    standingText = '';
    standingIds = new Set();
    store = new MemoryStore(ctx, domain ?? openSharedDomain(ctx));
    registry = ctx.get('workspaceRegistry', false);
    const settings = ctx.get('settings', false);
    // Cleared first: a remount into a deployment WITHOUT the settings service
    // must not keep resolving the previous mount's scope, which would leave the
    // feature switch reading a dead namespace.
    settingsScope = undefined;
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
        // Awaited, not fire-and-forget: the recall below skips whatever the
        // standing section already carries, so it must read a settled id set.
        await updateStanding(workspaceId);
        // The claimed inbox messages are the authoritative latest user query;
        // the derived-history scan only catches harnesses with no claimed list.
        const query = lastUserText(payload.messages ?? []) || lastUserQuery(session);
        if (query === '')
            return decision;
        const found = await store.search(workspaceId, query);
        // A memory already standing in the system prompt is in front of the model
        // either way; injecting it again would spend tokens to say it twice.
        const hits = found.filter(hit => !standingIds.has(String(hit.id)));
        if (hits.length === 0)
            return decision;
        const content = '[回忆] 基于你正在处理的工作，以下是项目记忆中可能相关的内容：\n'
            + hits.map(hit => `[${hit.kind}] ${hit.summary}：${hit.body}`).join('\n');
        if (injectedContent.get(sessionKey) === content)
            return decision;
        injectedContent.set(sessionKey, content);
        // Bounded: one entry per live session would otherwise outlive every
        // session the process ever ran. Map iteration is insertion-ordered, so
        // the oldest key is the first one.
        while (injectedContent.size > INJECTED_CACHE_CAP) {
            const oldest = injectedContent.keys().next();
            if (oldest.done === true)
                break;
            injectedContent.delete(oldest.value);
        }
        // Append the notice to THIS step's messages instead of `agent.inject()`.
        // `agent.inject` queues a next-step message, which splits one user turn
        // into two model steps and renders the recall as an ordinary user
        // message. Same-step appending keeps the reply contiguous.
        //
        // `form: 'notice'` with a `summary` is what the host's context disclosure
        // renders as a collapsed row carrying that one-line account — the reader
        // sees the hit count without expanding. The durable `recall` form is NOT
        // this: it means material lifted out of another SESSION's log and requires
        // a `references` list, so declaring it here degrades to the opaque body.
        const recall = createUserMessage({
            content: [{ type: 'text', text: content }],
            source: {
                kind: 'plugin',
                plugin: 'dsh-web-enhanced',
                form: 'notice',
                summary: `记忆召回 · 命中 ${String(hits.length)} 条`,
            },
        });
        return {
            ...decision,
            messages: [...(decision.messages ?? []), recall],
        };
    }));
}
