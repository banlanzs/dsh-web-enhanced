/**
 * DeepSeek balance query.
 *
 * The API key is resolved exactly the way the model adapter resolves it: the
 * credential seam first, the ambient environment only as the fallback for a
 * deployment without that seam. Reading `process.env` alone would miss a key
 * configured through settings or a `.env` layer — which is the normal case, and
 * would report "not set" for an account whose model requests are working.
 * Failures are result fields.
 * @module dsh-web-enhanced/src/balance
 */
/** Balance query client with a short-lived view cache. */
export class BalanceClient {
    config;
    resolveCredential;
    cache = null;
    /**
     * @param config - key reference, cache TTL, and endpoint base.
     * @param resolveCredential - credential-seam lookup; omitted falls back to the environment.
     */
    constructor(config, resolveCredential) {
        this.config = config;
        this.resolveCredential = resolveCredential;
    }
    /** Cached or freshly fetched balance view. */
    async get() {
        const now = Date.now();
        if (this.cache !== null && now - this.cache.at < this.config.cacheTtlMs)
            return this.cache.value;
        const view = await this.fetchBalance(now);
        this.cache = { at: now, value: view };
        return view;
    }
    /** Drop the cached view (the settings plane can force a refresh). */
    clear() {
        this.cache = null;
    }
    /**
     * The API key, resolved per query so a rotated credential reaches the very
     * next refresh — the same per-operation contract the adapters follow.
     */
    async apiKey() {
        if (this.resolveCredential !== undefined) {
            const resolved = await this.resolveCredential(this.config.apiKeyEnv);
            if (resolved !== undefined && resolved.trim() !== '')
                return resolved;
        }
        const ambient = process.env[this.config.apiKeyEnv];
        return ambient === undefined || ambient.trim() === '' ? undefined : ambient;
    }
    async fetchBalance(now) {
        const key = await this.apiKey();
        if (key === undefined) {
            return {
                isAvailable: false, infos: [], cachedAt: now,
                error: {
                    code: 'no-api-key',
                    message: `credential ${this.config.apiKeyEnv} is not configured (checked the credential store and the environment)`,
                },
            };
        }
        let response;
        try {
            response = await fetch(`${this.config.baseUrl}/user/balance`, {
                headers: { Accept: 'application/json', Authorization: `Bearer ${key}` },
            });
        }
        catch {
            return {
                isAvailable: false, infos: [], cachedAt: now,
                error: { code: 'balance-unreachable', message: 'the balance endpoint could not be reached' },
            };
        }
        if (!response.ok) {
            return {
                isAvailable: false, infos: [], cachedAt: now,
                error: { code: 'balance-http', message: `balance endpoint answered ${response.status}` },
            };
        }
        let body;
        try {
            body = await response.json();
        }
        catch {
            return {
                isAvailable: false, infos: [], cachedAt: now,
                error: { code: 'balance-invalid', message: 'the balance response was not JSON' },
            };
        }
        return parseBalanceBody(body, now);
    }
}
/** Validate and project the endpoint payload; malformed lines are dropped. */
function parseBalanceBody(body, now) {
    if (typeof body !== 'object' || body === null) {
        return {
            isAvailable: false, infos: [], cachedAt: now,
            error: { code: 'balance-invalid', message: 'unexpected balance payload' },
        };
    }
    const record = body;
    const rawInfos = Array.isArray(record['balance_infos']) ? record['balance_infos'] : [];
    const infos = [];
    for (const raw of rawInfos) {
        if (typeof raw !== 'object' || raw === null)
            continue;
        const info = raw;
        if (typeof info['currency'] !== 'string')
            continue;
        infos.push({
            currency: info['currency'],
            totalBalance: toNumber(info['total_balance']),
            grantedBalance: toNumber(info['granted_balance']),
            toppedUpBalance: toNumber(info['topped_up_balance']),
        });
    }
    return { isAvailable: record['is_available'] === true, infos, cachedAt: now };
}
/** Numeric projection tolerant of JSON numbers and numeric strings. */
function toNumber(value) {
    if (typeof value === 'number')
        return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}
