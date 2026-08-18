import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Balance line under the composer.
 *
 * Two modes, mutually exclusive by model route:
 * - DeepSeek balance mode (the default for an applicable route): provider and
 *   model display names, the account balance in the currency the endpoint
 *   reports (CNY/USD/EUR), grant/top-up detail, a low threshold warning, the
 *   Beijing peak/off-peak price period with a countdown, and the current
 *   conversation's estimated cost at models.dev USD prices. Failures keep the
 *   last good snapshot and mark it stale instead of blinking the row away.
 * - OpenCode Go subscription mode for the `opencode-go` / `opencode` routes:
 *   three quota windows (5h / weekly / monthly) with remaining percentages
 *   and the tightest reset countdown, read from the OpenCode Go usage API.
 *   The quota lives in the opencode CLI, so it is shown independently of DSH
 *   conversation accounting.
 *
 * Everything auto-refreshes once a minute; the session's model route is
 * observed through the injected route face, so switching models swaps the
 * row immediately.
 * @module dsh-web-enhanced/src/client/balance/BalanceLine
 */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { formatCnyCost, formatUsdCost, sessionCostCnyOf, sessionCostOf } from "./cost.js";
import css from './BalanceLine.module.css';
/** Providers whose billing line is the OpenCode Go subscription. */
export function isOpencodeGoProvider(provider) {
    return provider === 'opencode-go' || provider === 'opencode';
}
/** The balance line shown, preferring the account's CNY line when present. */
export function balanceInfoOf(view) {
    if (view === null)
        return undefined;
    return view.infos.find(info => info.currency === 'CNY') ?? view.infos[0];
}
/** Currency symbol or prefix used to spell one balance currency. */
export function currencySymbolOf(currency) {
    if (currency === 'CNY')
        return '¥';
    if (currency === 'USD')
        return '$';
    if (currency === 'EUR')
        return '€';
    return `${currency} `;
}
/** One balance amount, prefixed with the symbol the API currency names. */
export function formatBalanceAmount(currency, value) {
    return `${currencySymbolOf(currency)}${value.toFixed(2)}`;
}
/** Unwrap this plugin's success-or-error union into null on failure. */
function okOf(result) {
    // The discriminant read is widened on purpose: a success payload may itself
    // carry an optional `error` field, so `'error' in result` alone would keep
    // the union unsplit under exact optional properties.
    return result.error === undefined ? result : null;
}
/** Format `HH:MM`-style countdown for the price switch (h/min/s). */
function formatCountdown(ms) {
    if (ms <= 0)
        return '00:00';
    const total = Math.floor(ms / 1000);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const pad = (value) => String(value).padStart(2, '0');
    return hours > 0 ? `${hours}h${pad(minutes)}m` : `${pad(minutes)}:${pad(seconds)}`;
}
/** Format a subscription reset countdown with a day-sized top unit. */
function formatResetCountdown(ms) {
    if (ms <= 0)
        return '00:00';
    const total = Math.floor(ms / 1000);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    if (days > 0)
        return `${days}d ${hours}h`;
    if (hours > 0)
        return `${hours}h ${String(minutes).padStart(2, '0')}m`;
    return `${String(minutes).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
/** Local wall-clock spelling for a hover title. */
function formatDateTime(ms) {
    const date = new Date(ms);
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
/** One primitive of the session's live route, re-read on selection changes. */
function useRouteField(modelRoute, sessionId, read) {
    const subscribe = useMemo(() => (listener) => modelRoute.subscribe(sessionId, listener), [modelRoute, sessionId]);
    const snapshot = useCallback(() => read(modelRoute, sessionId), [modelRoute, read, sessionId]);
    return useSyncExternalStore(subscribe, snapshot, snapshot);
}
const EMPTY_DATA = {
    loading: true,
    fatal: null,
    view: null,
    pricing: null,
    rate: null,
    names: null,
    opencode: null,
};
/** The balance line: one muted row under the composer. */
export function BalanceLine({ remote, modelRoute, sessionId, useProjection, t }) {
    const [data, setData] = useState(EMPTY_DATA);
    const [busy, setBusy] = useState(false);
    const [now, setNow] = useState(() => Date.now());
    const provider = useRouteField(modelRoute, String(sessionId), (route, id) => route.provider(id));
    const model = useRouteField(modelRoute, String(sessionId), (route, id) => route.model(id));
    const usage = useProjection('tokenUsage');
    // Unmounting mid-request must not set state on a dead component; the ref is
    // the only thing the resolved promise is allowed to read.
    const live = useRef(true);
    useEffect(() => () => { live.current = false; }, []);
    const refresh = useCallback(async () => {
        setBusy(true);
        try {
            if (isOpencodeGoProvider(provider)) {
                const [names, opencode] = await Promise.all([
                    provider !== undefined && model !== undefined
                        ? remote.modelRouteDescribe({ provider, model }).then((result) => okOf(result))
                        : Promise.resolve(null),
                    remote.opencodeGoUsageGet(),
                ]);
                if (!live.current)
                    return;
                setData({ loading: false, fatal: null, view: null, pricing: null, rate: null, names, opencode });
            }
            else {
                const [view, pricing, rate, names] = await Promise.all([
                    remote.balanceGet(provider === undefined ? {} : { provider }),
                    provider !== undefined && model !== undefined
                        ? remote.pricingGet({ provider, model }).then((result) => okOf(result))
                        : Promise.resolve(null),
                    model !== undefined
                        ? remote.deepseekRateGet({ model }).then((result) => okOf(result))
                        : Promise.resolve(null),
                    provider !== undefined && model !== undefined
                        ? remote.modelRouteDescribe({ provider, model }).then((result) => okOf(result))
                        : Promise.resolve(null),
                ]);
                if (!live.current)
                    return;
                setData({ loading: false, fatal: null, view, pricing, rate, names, opencode: null });
            }
        }
        catch (error) {
            if (!live.current)
                return;
            setData(previous => ({
                ...previous,
                loading: false,
                fatal: error instanceof Error ? error.message : String(error),
            }));
        }
        finally {
            if (live.current)
                setBusy(false);
        }
    }, [model, provider, remote]);
    useEffect(() => { void refresh(); }, [refresh]);
    useEffect(() => {
        const id = window.setInterval(() => { void refresh(); }, 60_000);
        return () => { window.clearInterval(id); };
    }, [refresh]);
    useEffect(() => {
        const id = window.setInterval(() => { setNow(Date.now()); }, 1000);
        return () => { window.clearInterval(id); };
    }, []);
    if (isOpencodeGoProvider(provider)) {
        return (_jsx(OpencodeGoLine, { names: data.names, model: model, view: data.opencode, loading: data.loading, fatal: data.fatal, busy: busy, now: now, t: t, onRefresh: () => { void refresh(); } }));
    }
    if (data.view === null || !data.view.applicable)
        return null;
    return (_jsx(DeepSeekLine, { view: data.view, pricing: data.pricing, rate: data.rate, names: data.names, provider: provider, model: model, usage: usage, busy: busy, now: now, fatal: data.fatal, t: t, onRefresh: () => { void refresh(); } }));
}
function LineShell({ busy, t, onRefresh, children }) {
    return (_jsxs("div", { className: css.line, "data-testid": "balance-line", children: [children, _jsx("button", { type: "button", className: css.refresh, disabled: busy, onClick: onRefresh, children: t('balance.refresh') })] }));
}
/** The provider/model group, deduping a provider name already in the model name. */
function ProviderGroup({ names, provider, model, t, }) {
    const providerName = names?.providerName ?? provider ?? 'DeepSeek';
    const modelName = names?.modelName ?? model ?? t('balance.unknownModel');
    const redundant = providerName.length > 1
        && modelName.toLowerCase().startsWith(providerName.toLowerCase());
    const title = t('balance.providerTitle', { provider: providerName, model: modelName });
    return (_jsx("span", { className: css.group, title: title, children: redundant
            ? _jsx("strong", { children: modelName })
            : (_jsxs(_Fragment, { children: [_jsx("strong", { children: providerName }), ' · ', modelName] })) }));
}
/** DeepSeek balance mode. */
function DeepSeekLine({ view, pricing, rate, names, provider, model, usage, busy, now, fatal, t, onRefresh, }) {
    const info = balanceInfoOf(view);
    const stale = view.error !== undefined && info !== undefined;
    const lowThreshold = 20;
    const prices = pricing?.pricing;
    // The 2026-08-17 DeepSeek peak/off-peak table wins for its models; models
    // outside the table fall back to the models.dev USD estimate.
    const cnyRate = rate?.mode === 'unknown' ? null : rate?.prices ?? null;
    const cnyCost = sessionCostCnyOf(usage, cnyRate);
    const usdCost = sessionCostOf(usage, prices);
    const costText = cnyRate !== null
        ? t('balance.costCny', {
            cost: cnyCost === null ? '0.000' : formatCnyCost(cnyCost).slice(1),
        })
        : usdCost !== null
            ? t('balance.cost', { cost: formatUsdCost(usdCost) })
            : null;
    const groups = [];
    groups.push(_jsx(ProviderGroup, { names: names, provider: provider, model: model, t: t }, "route"));
    if (fatal !== null) {
        groups.push(_jsx("span", { className: css.error, "data-testid": "balance-error", children: t('balance.error', { message: fatal }) }, "fatal"));
    }
    else if (info === undefined && view.error !== undefined) {
        if (view.error.code === 'no-api-key') {
            groups.push(_jsx("span", { className: css.error, "data-testid": "balance-error", children: t('balance.noKey') }, "nokey"));
        }
        else {
            groups.push(_jsx("span", { className: css.error, "data-testid": "balance-error", children: t('balance.error', { message: view.error.message }) }, "berr"));
        }
    }
    else if (info !== undefined) {
        const low = info.totalBalance < lowThreshold;
        const title = t('balance.balanceTitle', {
            total: formatBalanceAmount(info.currency, info.totalBalance),
            granted: formatBalanceAmount(info.currency, info.grantedBalance),
            toppedUp: formatBalanceAmount(info.currency, info.toppedUpBalance),
        });
        groups.push(_jsxs("span", { className: css.group, title: title, "data-testid": "balance-value", children: [t('balance.title'), ' ', _jsx("b", { className: css.num, children: formatBalanceAmount(info.currency, info.totalBalance) }), low
                    ? _jsx("span", { className: css.warn, title: t('balance.low', { threshold: formatBalanceAmount(info.currency, lowThreshold) }), children: " \u26A0" })
                    : null] }, "bal"));
        if (stale) {
            groups.push(_jsx("span", { className: css.stale, title: view.error?.message, children: t('balance.stale') }, "stale"));
        }
    }
    if (rate !== null && rate.mode === 'peak-valley' && rate.prices !== null) {
        const peakNow = rate.period === 'peak';
        const periodLabel = peakNow ? t('balance.peak') : t('balance.offpeak');
        // Prices are the 2026-08-17 peak/off-peak table, the same numbers the
        // cost figure uses.
        const title = t('balance.priceTitle', {
            period: periodLabel,
            miss: rate.prices.inputCacheMiss.toFixed(2),
            hit: rate.prices.inputCacheHit.toFixed(2),
            output: rate.prices.output.toFixed(2),
        });
        groups.push(_jsx("span", { className: peakNow ? css.peak : css.offpeak, title: title, children: periodLabel }, "period"));
        if (rate.nextSwitchAt !== null) {
            const nextLabel = rate.nextIsPeak ? t('balance.peak') : t('balance.offpeak');
            const switchTitle = t('balance.switchTitle', {
                next: nextLabel,
                time: rate.nextSwitchLabel ?? '',
            });
            groups.push(_jsxs("span", { className: css.group, title: switchTitle, children: [peakNow ? t('balance.countdownToOffpeak') : t('balance.countdownToPeak'), ' ', _jsx("b", { className: css.num, children: formatCountdown(rate.nextSwitchAt - now) })] }, "switch"));
        }
    }
    if (costText !== null) {
        groups.push(_jsx("span", { className: css.group, title: costText, children: costText }, "cost"));
    }
    return (_jsx(LineShell, { busy: busy, t: t, onRefresh: onRefresh, children: groups }));
}
/** OpenCode Go subscription mode. */
function OpencodeGoLine({ names, model, view, loading, fatal, busy, now, t, onRefresh, }) {
    const groups = [
        _jsxs("span", { className: css.group, title: t('balance.opencodeGoTitle'), children: [_jsx("strong", { children: "OpenCode Go" }), ' · ', names?.modelName ?? model ?? t('balance.unknownModel')] }, "route"),
    ];
    if (fatal !== null) {
        groups.push(_jsx("span", { className: css.error, "data-testid": "balance-error", children: t('balance.opencodeGoError', { message: fatal }) }, "fatal"));
    }
    else if (view === null || loading) {
        groups.push(_jsx("span", { className: css.group, children: t('balance.opencodeGoLoading') }, "loading"));
    }
    else if (view.error !== undefined && view.windows.length === 0) {
        groups.push(view.error.code === 'opencode-go-no-key'
            ? _jsx("span", { className: css.error, "data-testid": "balance-error", children: t('balance.opencodeGoNoKey') }, "nokey")
            : _jsx("span", { className: css.error, "data-testid": "balance-error", children: t('balance.opencodeGoError', { message: view.error.message }) }, "subberr"));
    }
    else {
        const windows = view.windows;
        const remainingOf = (window) => Math.max(0, 100 - window.usedPercent);
        const labelOf = (key) => key === 'five_hour'
            ? t('balance.opencodeGoWindow5h')
            : key === 'seven_day' ? t('balance.opencodeGoWindowWeek') : t('balance.opencodeGoWindowMonth');
        const alarmWindows = windows.filter(window => remainingOf(window) <= 20);
        const titleLines = [t('balance.opencodeGoTitle')].concat(windows.map((window) => {
            const label = labelOf(window.key);
            return t('balance.opencodeGoWindowTitle', {
                label,
                remaining: String(remainingOf(window)),
                used: String(window.usedPercent),
                reset: window.resetsAt === null ? '—' : formatDateTime(window.resetsAt),
                countdown: window.resetsAt === null ? '—' : formatResetCountdown(window.resetsAt - now),
            });
        }));
        if (alarmWindows.length > 0) {
            titleLines.push(t('balance.opencodeGoAlarm', {
                windows: alarmWindows.map(window => labelOf(window.key)).join('、'),
            }));
        }
        groups.push(_jsxs("span", { className: css.group, title: titleLines.join('\n'), "data-testid": "balance-value", children: [windows.map((window, index) => {
                    const remaining = remainingOf(window);
                    return (_jsxs("span", { children: [index > 0 ? ' · ' : '', labelOf(window.key), ' ', _jsx("b", { className: `${css.num} ${remaining <= 20 ? css.peak : css.offpeak}`, children: `${remaining}%` })] }, window.key));
                }), alarmWindows.length > 0 ? _jsx("span", { className: css.warn, children: " \u26A0" }) : null] }, "windows"));
        const priority = { five_hour: 0, seven_day: 1, monthly: 2 };
        const resettable = windows.filter(window => window.resetsAt !== null)
            .sort((left, right) => priority[left.key] - priority[right.key]);
        const next = resettable[0];
        if (next !== undefined && next.resetsAt !== null) {
            groups.push(_jsxs("span", { className: css.group, children: [t('balance.opencodeGoReset'), ' ', _jsx("b", { className: css.num, children: formatResetCountdown(next.resetsAt - now) })] }, "reset"));
        }
        if (view.error !== undefined) {
            groups.push(_jsx("span", { className: css.stale, children: t('balance.opencodeGoStale') }, "stale"));
        }
    }
    return (_jsx(LineShell, { busy: busy, t: t, onRefresh: onRefresh, children: groups }));
}
