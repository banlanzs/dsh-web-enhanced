import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Balance line under the composer: the DeepSeek account balance from the host
 * remote, with a refresh affordance and a muted error state. The host caches
 * the view, so mounting several sessions does not fan out to the endpoint.
 * @module dsh-web-enhanced/src/client/balance/BalanceLine
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import css from './BalanceLine.module.css';
/** Format one balance line as `CNY 12.34`. */
function summaryOf(view) {
    return view.infos.map(info => `${info.currency} ${info.totalBalance.toFixed(2)}`).join(' · ');
}
/** The balance line: one muted row under the composer. */
export function BalanceLine({ remote, t }) {
    const [view, setView] = useState(null);
    const [busy, setBusy] = useState(false);
    // Unmounting mid-request must not set state on a dead component; the ref is
    // the only thing the resolved promise is allowed to read.
    const live = useRef(true);
    useEffect(() => () => { live.current = false; }, []);
    const refresh = useCallback(async () => {
        setBusy(true);
        try {
            const next = await remote.balanceGet();
            if (live.current)
                setView(next);
        }
        finally {
            if (live.current)
                setBusy(false);
        }
    }, [remote]);
    useEffect(() => { void refresh(); }, [refresh]);
    if (view === null)
        return null;
    const summary = summaryOf(view);
    return (_jsxs("div", { className: css.line, "data-testid": "balance-line", children: [_jsx("span", { className: css.label, children: t('balance.title') }), view.error === undefined
                ? _jsx("span", { className: css.value, "data-testid": "balance-value", children: summary === '' ? '—' : summary })
                : _jsx("span", { className: css.error, "data-testid": "balance-error", children: t('balance.error', { message: view.error.message }) }), _jsx("button", { type: "button", className: css.refresh, disabled: busy, onClick: () => { void refresh(); }, children: t('balance.refresh') })] }));
}
