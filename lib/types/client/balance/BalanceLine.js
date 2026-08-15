import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Balance line under the composer: the DeepSeek account balance plus an
 * estimated cost of the current session's billed tokens. Both ride the host's
 * caches — the balance view is cached server-side, and models.dev pricing is
 * cached once per gateway TTL — so mounting several sessions does not fan out.
 *
 * The line is tied to the session's model route. The balance endpoint serves
 * ONE account at one vendor, so a session switched to another channel gets no
 * balance part at all; pricing is shown only when models.dev has an entry for
 * the exact provider/model selection.
 * @module dsh-web-enhanced/src/client/balance/BalanceLine
 */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { formatUsdCost, sessionCostOf } from "./cost.js";
import css from './BalanceLine.module.css';
/** Format one balance line as `CNY 12.34`. */
function summaryOf(view) {
    return view.infos.map(info => `${info.currency} ${info.totalBalance.toFixed(2)}`).join(' · ');
}
/** One primitive of the session's live route, re-read on selection changes. */
function useRouteField(modelRoute, sessionId, read) {
    const subscribe = useMemo(() => (listener) => modelRoute.subscribe(sessionId, listener), [modelRoute, sessionId]);
    const snapshot = useCallback(() => read(modelRoute, sessionId), [modelRoute, read, sessionId]);
    return useSyncExternalStore(subscribe, snapshot, snapshot);
}
/** The balance line: one muted row under the composer. */
export function BalanceLine({ remote, modelRoute, sessionId, useProjection, t }) {
    const [view, setView] = useState(null);
    const [pricing, setPricing] = useState(null);
    const [busy, setBusy] = useState(false);
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
            const [next, nextPricing] = await Promise.all([
                remote.balanceGet(provider === undefined ? {} : { provider }),
                provider !== undefined && model !== undefined
                    ? remote.pricingGet({ provider, model }).then(result => ('error' in result ? null : result))
                    : Promise.resolve(null),
            ]);
            if (!live.current)
                return;
            setView(next);
            setPricing(nextPricing);
        }
        finally {
            if (live.current)
                setBusy(false);
        }
    }, [model, provider, remote]);
    useEffect(() => { void refresh(); }, [refresh]);
    if (view === null || !view.applicable)
        return null;
    const summary = summaryOf(view);
    const cost = sessionCostOf(usage, pricing?.pricing);
    return (_jsxs("div", { className: css.line, "data-testid": "balance-line", children: [_jsx("span", { className: css.label, children: t('balance.title') }), view.error === undefined
                ? _jsx("span", { className: css.value, "data-testid": "balance-value", children: summary === '' ? '—' : summary })
                : _jsx("span", { className: css.error, "data-testid": "balance-error", children: t('balance.error', { message: view.error.message }) }), cost !== null && (_jsx("span", { className: css.value, "data-testid": "balance-cost", children: t('balance.cost', { cost: formatUsdCost(cost) }) })), _jsx("button", { type: "button", className: css.refresh, disabled: busy, onClick: () => { void refresh(); }, children: t('balance.refresh') })] }));
}
