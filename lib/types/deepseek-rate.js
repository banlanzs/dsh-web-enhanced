/**
 * DeepSeek peak/off-peak billing clock and the 2026-08-17 price table the
 * balance line uses for its cost estimate. DeepSeek's official billing has
 * two peak windows per Beijing day (09:00–12:00 and 14:00–18:00); the V4
 * Flash/Pro catalog models publish peak and off-peak prices, while the legacy
 * chat model is flat. Models outside the table are `unknown` so the UI hides
 * the period group and falls back to models.dev for the cost.
 * @module dsh-web-enhanced/src/deepseek-rate
 */
/** DeepSeek official 2026-08-17 peak-valley billing table. */
export const DEEPSEEK_RATES = {
    'deepseek-v4-flash': {
        mode: 'peak-valley',
        peak: { inputCacheHit: 0.10, inputCacheMiss: 3.0, output: 9.0 },
        offpeak: { inputCacheHit: 0.05, inputCacheMiss: 1.5, output: 4.5 },
    },
    'deepseek-v4-pro': {
        mode: 'peak-valley',
        peak: { inputCacheHit: 0.30, inputCacheMiss: 9.0, output: 27.0 },
        offpeak: { inputCacheHit: 0.15, inputCacheMiss: 4.5, output: 13.5 },
    },
    'deepseek-chat': {
        mode: 'flat',
        price: { inputCacheHit: 0.5, inputCacheMiss: 2.0, output: 8.0 },
    },
};
/** Beijing wall-clock minute of one instant. */
export function beijingMinutes(nowMs) {
    return new Date(nowMs + 8 * 3600 * 1000).getUTCHours() * 60
        + new Date(nowMs + 8 * 3600 * 1000).getUTCMinutes();
}
/** Whether `nowMs` falls in a Beijing peak window. */
export function currentDeepSeekPeriod(nowMs) {
    const minutes = beijingMinutes(nowMs);
    return (minutes >= 9 * 60 && minutes < 12 * 60) || (minutes >= 14 * 60 && minutes < 18 * 60)
        ? 'peak'
        : 'offpeak';
}
/**
 * Next peak-window boundary as an epoch-ms timestamp. The four daily bounds
 * are 09:00 / 12:00 / 14:00 / 18:00 Beijing; past 18:00 the next boundary is
 * tomorrow 09:00.
 */
export function nextDeepSeekSwitchAt(nowMs) {
    const beijing = new Date(nowMs + 8 * 3600 * 1000);
    const minutes = beijing.getUTCHours() * 60 + beijing.getUTCMinutes();
    const bounds = [9 * 60, 12 * 60, 14 * 60, 18 * 60];
    for (const bound of bounds) {
        if (bound > minutes) {
            return Date.UTC(beijing.getUTCFullYear(), beijing.getUTCMonth(), beijing.getUTCDate(), Math.floor(bound / 60), 0, 0)
                - 8 * 3600 * 1000;
        }
    }
    return Date.UTC(beijing.getUTCFullYear(), beijing.getUTCMonth(), beijing.getUTCDate() + 1, 9, 0, 0)
        - 8 * 3600 * 1000;
}
/** `HH:MM` Beijing label of the next switch. */
export function nextDeepSeekSwitchLabel(nowMs) {
    const at = nextDeepSeekSwitchAt(nowMs);
    const beijing = new Date(at + 8 * 3600 * 1000);
    return `${String(beijing.getUTCHours()).padStart(2, '0')}:${String(beijing.getUTCMinutes()).padStart(2, '0')}`;
}
/**
 * The display facts of one model's DeepSeek billing. Unknown models keep a
 * neutral `unknown` shape: the client hides the group and falls back to its
 * models.dev estimate for session cost.
 * @param model - model id selected on a DeepSeek route.
 * @param nowMs - clock to describe.
 * @returns the rate view for the current instant.
 */
export function deepseekRateFor(model, nowMs = Date.now()) {
    const entry = DEEPSEEK_RATES[model];
    if (entry === undefined) {
        return {
            model,
            mode: 'unknown',
            period: 'flat',
            currency: 'CNY',
            prices: null,
            nextSwitchAt: null,
            nextSwitchLabel: null,
            nextIsPeak: false,
            now: nowMs,
        };
    }
    if (entry.mode === 'flat') {
        return {
            model,
            mode: 'flat',
            period: 'flat',
            currency: 'CNY',
            prices: entry.price ?? null,
            nextSwitchAt: null,
            nextSwitchLabel: null,
            nextIsPeak: false,
            now: nowMs,
        };
    }
    const period = currentDeepSeekPeriod(nowMs);
    const nextSwitchAt = nextDeepSeekSwitchAt(nowMs);
    return {
        model,
        mode: 'peak-valley',
        period,
        currency: 'CNY',
        prices: period === 'peak' ? entry.peak ?? null : entry.offpeak ?? null,
        nextSwitchAt,
        nextSwitchLabel: nextDeepSeekSwitchLabel(nowMs),
        nextIsPeak: currentDeepSeekPeriod(nextSwitchAt) === 'peak',
        now: nowMs,
    };
}
