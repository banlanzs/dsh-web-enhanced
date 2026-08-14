/**
 * Balance line under the composer: the DeepSeek account balance from the host
 * remote, with a refresh affordance and a muted error state. The host caches
 * the view, so mounting several sessions does not fan out to the endpoint.
 * @module dsh-web-enhanced/src/client/balance/BalanceLine
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { BalanceView, WebEnhancedProps } from '../contract.ts'
import css from './BalanceLine.module.css'

/** Full composed props of the balance line. */
export type BalanceLineProps = WebEnhancedProps<'conversation.composer.dock'>

/** Format one balance line as `CNY 12.34`. */
function summaryOf(view: BalanceView): string {
  return view.infos.map(info => `${info.currency} ${info.totalBalance.toFixed(2)}`).join(' · ')
}

/** The balance line: one muted row under the composer. */
export function BalanceLine({ remote, t }: BalanceLineProps) {
  const [view, setView] = useState<BalanceView | null>(null)
  const [busy, setBusy] = useState(false)
  // Unmounting mid-request must not set state on a dead component; the ref is
  // the only thing the resolved promise is allowed to read.
  const live = useRef(true)
  useEffect(() => () => { live.current = false }, [])

  const refresh = useCallback(async (): Promise<void> => {
    setBusy(true)
    try {
      const next = await remote.balanceGet()
      if (live.current) setView(next)
    } finally {
      if (live.current) setBusy(false)
    }
  }, [remote])

  useEffect(() => { void refresh() }, [refresh])

  if (view === null) return null
  const summary = summaryOf(view)
  return (
    <div className={css.line} data-testid="balance-line">
      <span className={css.label}>{t('balance.title')}</span>
      {view.error === undefined
        ? <span className={css.value} data-testid="balance-value">{summary === '' ? '—' : summary}</span>
        : <span className={css.error} data-testid="balance-error">{t('balance.error', { message: view.error.message })}</span>}
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
