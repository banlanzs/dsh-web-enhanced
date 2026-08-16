/**
 * OpenCode Go subscription-usage query.
 *
 * OpenCode Go is a subscription plan consumed inside the opencode CLI, not
 * billed against the DeepSeek account. Its official-but-unpublished usage
 * endpoint reports three windows (rolling 5h / weekly / monthly) as used
 * percentages plus reset timestamps. This client mirrors the balance client:
 * the key resolves through DSH credentials first, then the opencode CLI
 * login file; failures are result fields, the last good snapshot is kept, and
 * a short cache prevents the browser's polling from hammering the endpoint.
 * @module dsh-web-enhanced/src/opencode-go
 */
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
/**
 * Normalize one reset timestamp: numbers are seconds below 1e12 and
 * milliseconds above; strings parse as ISO dates. Anything else is null.
 */
export function normalizeOpencodeGoResetAt(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value < 1e12 ? value * 1000 : value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
}
/** API key spellings the opencode CLI auth.json uses for one provider entry. */
function entryKey(entry) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry))
        return undefined;
    const record = entry;
    for (const field of ['key', 'apiKey', 'accessToken']) {
        const value = record[field];
        if (typeof value === 'string' && value.trim() !== '')
            return value;
    }
    return undefined;
}
/**
 * Read one OpenCode Go key out of an auth.json document. The `opencode-go`
 * entry wins; the older `opencode` entry is a fallback.
 * @param raw - parsed auth.json value, already unknown-shaped.
 * @returns the key, or undefined when the document has none.
 */
export function opencodeGoKeyFromAuth(raw) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
        return undefined;
    const record = raw;
    for (const name of ['opencode-go', 'opencode']) {
        const key = entryKey(record[name]);
        if (key !== undefined)
            return key;
    }
    return undefined;
}
/** Map one API window key to the wire window key shared with the client. */
function windowKeyOf(apiKey) {
    if (apiKey === 'rolling')
        return 'five_hour';
    if (apiKey === 'weekly')
        return 'seven_day';
    if (apiKey === 'monthly')
        return 'monthly';
    return null;
}
/** Clamp an API percent to a displayable 0–100 integer. */
function percentOf(value) {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return null;
    return Math.min(100, Math.max(0, Math.round(value)));
}
/**
 * Parse the `GET /zen/go/v1/usage` payload into the three display windows.
 * Windows whose status is not `ok` or whose percent is missing are skipped,
 * exactly like the reference implementation: a missing window is absence, not
 * an error. A structurally unrecognizable body returns null.
 */
export function parseOpencodeGoUsage(body) {
    if (typeof body !== 'object' || body === null)
        return null;
    const usage = body['usage'];
    if (typeof usage !== 'object' || usage === null || Array.isArray(usage))
        return null;
    const windows = [];
    for (const apiKey of ['rolling', 'weekly', 'monthly']) {
        const window = usage[apiKey];
        if (typeof window !== 'object' || window === null)
            continue;
        if (window['status'] !== 'ok')
            continue;
        const percent = percentOf(window['percent']);
        if (percent === null)
            continue;
        const key = windowKeyOf(apiKey);
        if (key === null)
            continue;
        windows.push({
            key,
            usedPercent: percent,
            resetsAt: normalizeOpencodeGoResetAt(window['resetsAt']),
        });
    }
    return windows;
}
/**
 * Cached, single-flight OpenCode Go usage client with a last-good snapshot.
 *
 * Failures return the previous windows with an `error` field, so the balance
 * line degrades to "stale snapshot" instead of blinking away on a network
 * blip. A missing key is its own error kind, which the client renders as a
 * configuration hint rather than a failure.
 */
export class OpencodeGoUsageClient {
    config;
    resolveCredential;
    cached = null;
    cachedAt = 0;
    pending = null;
    /**
     * @param config - endpoint, key reference, cache TTL, and auth-file override.
     * @param resolveCredential - credential-seam lookup; omitted falls back to the environment.
     */
    constructor(config, resolveCredential) {
        this.config = config;
        this.resolveCredential = resolveCredential;
    }
    /** Cached or freshly fetched usage view. */
    async get() {
        const now = Date.now();
        if (this.cached !== null && now - this.cachedAt < this.config.cacheTtlMs)
            return this.cached;
        this.pending ??= this.fetch();
        try {
            const view = await this.pending;
            this.cached = view;
            this.cachedAt = now;
            return view;
        }
        finally {
            this.pending = null;
        }
    }
    /** Drop the cached view (a settings-plane refresh keeps the UI honest). */
    clear() {
        this.cached = null;
        this.cachedAt = 0;
    }
    /** The best previously fetched snapshot, for error-branch merging. */
    lastGood() {
        const view = this.cached;
        if (view === null || view.fetchedAt === null || view.windows.length === 0)
            return null;
        return { windows: view.windows, fetchedAt: view.fetchedAt };
    }
    /** Project one failure onto a view that still carries the last good data. */
    failure(code, message, previous) {
        return {
            provider: 'opencode-go',
            plan: 'OpenCode Go',
            windows: previous?.windows ?? [],
            fetchedAt: previous?.fetchedAt ?? null,
            error: { code, message },
        };
    }
    async apiKey() {
        if (this.resolveCredential !== undefined) {
            const resolved = await this.resolveCredential(this.config.apiKeyEnv);
            if (resolved !== undefined && resolved.trim() !== '')
                return resolved;
        }
        const ambient = process.env[this.config.apiKeyEnv];
        if (ambient !== undefined && ambient.trim() !== '')
            return ambient;
        const authFile = this.config.authFile ?? join(homedir(), '.local', 'share', 'opencode', 'auth.json');
        try {
            return opencodeGoKeyFromAuth(JSON.parse(await readFile(authFile, 'utf8')));
        }
        catch {
            return undefined;
        }
    }
    async fetch() {
        const previous = this.lastGood();
        const key = await this.apiKey();
        if (key === undefined) {
            return this.failure('opencode-go-no-key', 'OPENCODE_GO_API_KEY is not configured and the opencode CLI has no opencode-go login', previous);
        }
        let response;
        try {
            response = await fetch(this.config.usageUrl, {
                headers: { Accept: 'application/json', Authorization: `Bearer ${key}` },
                signal: AbortSignal.timeout(this.config.timeoutMs),
            });
        }
        catch {
            return this.failure('opencode-go-unreachable', 'the OpenCode Go usage endpoint could not be reached', previous);
        }
        if (!response.ok) {
            return this.failure('opencode-go-http', `the OpenCode Go usage endpoint answered ${response.status}`, previous);
        }
        let body;
        try {
            body = await response.json();
        }
        catch {
            return this.failure('opencode-go-invalid', 'the OpenCode Go usage response was not JSON', previous);
        }
        const windows = parseOpencodeGoUsage(body);
        if (windows === null) {
            return this.failure('opencode-go-invalid', 'unexpected OpenCode Go usage payload', previous);
        }
        return { provider: 'opencode-go', plan: 'OpenCode Go', windows, fetchedAt: Date.now() };
    }
}
