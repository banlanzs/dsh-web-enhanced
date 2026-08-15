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

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { BalanceView, ModelRouteFace, PricingView, WebEnhancedProps } from '../contract.ts'
import { formatUsdCost, sessionCostOf } from './cost.ts'
import type { TokenUsage } from './cost.ts'
import css from './BalanceLine.module.css'

/** Full composed props of the balance line. */
export type BalanceLineProps = WebEnhancedProps<'conversation.composer.dock'>

/** Format one balance line as `CNY 12.34`. */
function summaryOf(view: BalanceView): string {
  return view.infos.map(info => `${info.currency} ${info.totalBalance.toFixed(2)}`).join(' · ')
}

/** One primitive of the session's live route, re-read on selection changes. */
function useRouteField(
  modelRoute: ModelRouteFace,
  sessionId: string,
  read: (route: ModelRouteFace, sessionId: string) => string | undefined,
): string | undefined {
  const subscribe = useMemo(
    () => (listener: () => void) => modelRoute.subscribe(sessionId, listener),
    [modelRoute, sessionId],
  )
  const snapshot = useCallback(() => read(modelRoute, sessionId), [modelRoute, read, sessionId])
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}

/** The balance line: one muted row under the composer. */
export function BalanceLine({ remote, modelRoute, sessionId, useProjection, t }: BalanceLineProps) {
  const [view, setView] = useState<BalanceView | null>(null)
  const [pricing, setPricing] = useState<PricingView | null>(null)
  const [busy, setBusy] = useState(false)
  const provider = useRouteField(modelRoute, String(sessionId), (route, id) => route.provider(id))
  const model = useRouteField(modelRoute, String(sessionId), (route, id) => route.model(id))
  const usage = useProjection('tokenUsage' as never) as unknown as TokenUsage | undefined
  // Unmounting mid-request must not set state on a dead component; the ref is
  // the only thing the resolved promise is allowed to read.
  const live = useRef(true)
  useEffect(() => () => { live.current = false }, [])

  const refresh = useCallback(async (): Promise<void> => {
    setBusy(true)
    try {
      const [next, nextPricing] = await Promise.all([
        remote.balanceGet(provider === undefined ? {} : { provider }),
        provider !== undefined && model !== undefined
          ? remote.pricingGet({ provider, model }).then(result => ('error' in result ? null : result))
          : Promise.resolve(null),
      ])
      if (!live.current) return
      setView(next)
      setPricing(nextPricing)
    } finally {
      if (live.current) setBusy(false)
    }
  }, [model, provider, remote])

  useEffect(() => { void refresh() }, [refresh])

  if (view === null || !view.applicable) return null
  const summary = summaryOf(view)
  const cost = sessionCostOf(usage, pricing?.pricing)
  return (
    <div className={css.line} data-testid="balance-line">
      <span className={css.label}>{t('balance.title')}</span>
      {view.error === undefined
        ? <span className={css.value} data-testid="balance-value">{summary === '' ? '—' : summary}</span>
        : <span className={css.error} data-testid="balance-error">{t('balance.error', { message: view.error.message })}</span>}
      {cost !== null && (
        <span className={css.value} data-testid="balance-cost">
          {t('balance.cost', { cost: formatUsdCost(cost) })}
        </span>
      )}
      <button
        type="button"
        className={css.refresh}
        disabled={busy}
        onClick={() => { void refresh() }}
      >
        {t('balance.refresh')}
      </button>
    </div>
  )
}
