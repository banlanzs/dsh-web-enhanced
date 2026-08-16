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
import type { OpencodeGoUsageView, OpencodeGoWindow } from './types.ts';
/** Resolve one credential reference to its value (the balance client's seam). */
export type ResolveCredential = (ref: string) => Promise<string | undefined>;
/** Behaviour of one OpenCode Go usage client. */
export interface OpencodeGoUsageConfig {
    /** Credential reference tried before the CLI login file. */
    readonly apiKeyEnv: string;
    /** Endpoint returning `usage.rolling/weekly/monthly`. */
    readonly usageUrl: string;
    /** How long one fetched snapshot stays fresh. */
    readonly cacheTtlMs: number;
    /** Request timeout. */
    readonly timeoutMs: number;
    /**
     * opencode CLI auth.json path; absent uses the platform default under the
     * home directory. Tests override this to isolate from a real login.
     */
    readonly authFile?: string;
}
/** One cached good snapshot. */
export interface OpencodeGoSnapshot {
    readonly windows: readonly OpencodeGoWindow[];
    readonly fetchedAt: number;
}
/**
 * Normalize one reset timestamp: numbers are seconds below 1e12 and
 * milliseconds above; strings parse as ISO dates. Anything else is null.
 */
export declare function normalizeOpencodeGoResetAt(value: unknown): number | null;
/**
 * Read one OpenCode Go key out of an auth.json document. The `opencode-go`
 * entry wins; the older `opencode` entry is a fallback.
 * @param raw - parsed auth.json value, already unknown-shaped.
 * @returns the key, or undefined when the document has none.
 */
export declare function opencodeGoKeyFromAuth(raw: unknown): string | undefined;
/**
 * Parse the `GET /zen/go/v1/usage` payload into the three display windows.
 * Windows whose status is not `ok` or whose percent is missing are skipped,
 * exactly like the reference implementation: a missing window is absence, not
 * an error. A structurally unrecognizable body returns null.
 */
export declare function parseOpencodeGoUsage(body: unknown): readonly OpencodeGoWindow[] | null;
/**
 * Cached, single-flight OpenCode Go usage client with a last-good snapshot.
 *
 * Failures return the previous windows with an `error` field, so the balance
 * line degrades to "stale snapshot" instead of blinking away on a network
 * blip. A missing key is its own error kind, which the client renders as a
 * configuration hint rather than a failure.
 */
export declare class OpencodeGoUsageClient {
    private readonly config;
    private readonly resolveCredential?;
    private cached;
    private cachedAt;
    private pending;
    /**
     * @param config - endpoint, key reference, cache TTL, and auth-file override.
     * @param resolveCredential - credential-seam lookup; omitted falls back to the environment.
     */
    constructor(config: OpencodeGoUsageConfig, resolveCredential?: ResolveCredential | undefined);
    /** Cached or freshly fetched usage view. */
    get(): Promise<OpencodeGoUsageView>;
    /** Drop the cached view (a settings-plane refresh keeps the UI honest). */
    clear(): void;
    /** The best previously fetched snapshot, for error-branch merging. */
    private lastGood;
    /** Project one failure onto a view that still carries the last good data. */
    private failure;
    private apiKey;
    private fetch;
}
