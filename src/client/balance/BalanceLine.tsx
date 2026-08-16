/**
 * Balance line under the composer.
 *
 * Two modes, mutually exclusive by model route:
 * - DeepSeek balance mode (the default for an applicable route): provider and
 *   model display names, the CNY balance with grant/top-up detail, a low
 *   threshold warning, the Beijing peak/off-peak price period with a
 *   countdown, and the current conversation's estimated cost (CNY rates for
 *   DeepSeek models, models.dev USD elsewhere). Failures keep the last good
 *   snapshot and mark it stale instead of blinking the row away.
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

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {
  ApiError, BalanceInfo, BalanceView, DeepSeekRateView, ModelPricingView, ModelRouteDescribeView,
  ModelRouteFace, OpencodeGoUsageView, OpencodeGoWindow, PricingView, WebEnhancedProps,
} from '../contract.ts'
import { formatCnyCost, formatUsdCost, sessionCostCnyOf, sessionCostOf } from './cost.ts'
import type { TokenUsage } from './cost.ts'
import css from './BalanceLine.module.css'

/** Full composed props of the balance line. */
export type BalanceLineProps = WebEnhancedProps<'conversation.composer.dock'>

/** Providers whose billing line is the OpenCode Go subscription. */
export function isOpencodeGoProvider(provider: string | undefined): boolean {
  return provider === 'opencode-go' || provider === 'opencode'
}

/** The CNY balance line if present, preferring the account's main currency. */
export function balanceInfoOf(view: BalanceView | null): BalanceInfo | undefined {
  if (view === null) return undefined
  return view.infos.find(info => info.currency === 'CNY') ?? view.infos[0]
}

/** Unwrap this plugin's success-or-error union into null on failure. */
function okOf<T extends object>(result: T | { error: ApiError }): T | null {
  // The discriminant read is widened on purpose: a success payload may itself
  // carry an optional `error` field, so `'error' in result` alone would keep
  // the union unsplit under exact optional properties.
  return (result as { error?: ApiError }).error === undefined ? result as T : null
}

/** Format `HH:MM`-style countdown for the price switch (h/min/s). */
function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00'
  const total = Math.floor(ms / 1000)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const pad = (value: number): string => String(value).padStart(2, '0')
  return hours > 0 ? `${hours}h${pad(minutes)}m` : `${pad(minutes)}:${pad(seconds)}`
}

/** Format a subscription reset countdown with a day-sized top unit. */
function formatResetCountdown(ms: number): string {
  if (ms <= 0) return '00:00'
  const total = Math.floor(ms / 1000)
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`
  return `${String(minutes).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** Local wall-clock spelling for a hover title. */
function formatDateTime(ms: number): string {
  const date = new Date(ms)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
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

/** Everything one refresh cycle learns from the host. */
interface LineData {
  loading: boolean
  fatal: string | null
  view: BalanceView | null
  pricing: PricingView | null
  rate: DeepSeekRateView | null
  names: ModelRouteDescribeView | null
  opencode: OpencodeGoUsageView | null
}

const EMPTY_DATA: LineData = {
  loading: true,
  fatal: null,
  view: null,
  pricing: null,
  rate: null,
  names: null,
  opencode: null,
}

/** The balance line: one muted row under the composer. */
export function BalanceLine({ remote, modelRoute, sessionId, useProjection, t }: BalanceLineProps) {
  const [data, setData] = useState<LineData>(EMPTY_DATA)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => Date.now())
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
      if (isOpencodeGoProvider(provider)) {
        const [names, opencode] = await Promise.all([
          provider !== undefined && model !== undefined
            ? remote.modelRouteDescribe({ provider, model }).then(
              (result): ModelRouteDescribeView | null => okOf<ModelRouteDescribeView>(result),
            )
            : Promise.resolve(null),
          remote.opencodeGoUsageGet(),
        ])
        if (!live.current) return
        setData({ loading: false, fatal: null, view: null, pricing: null, rate: null, names, opencode })
      } else {
        const [view, pricing, rate, names] = await Promise.all([
          remote.balanceGet(provider === undefined ? {} : { provider }),
          provider !== undefined && model !== undefined
            ? remote.pricingGet({ provider, model }).then(
              (result): PricingView | null => okOf<PricingView>(result),
            )
            : Promise.resolve(null),
          model !== undefined
            ? remote.deepseekRateGet({ model }).then(
              (result): DeepSeekRateView | null => okOf<DeepSeekRateView>(result),
            )
            : Promise.resolve(null),
          provider !== undefined && model !== undefined
            ? remote.modelRouteDescribe({ provider, model }).then(
              (result): ModelRouteDescribeView | null => okOf<ModelRouteDescribeView>(result),
            )
            : Promise.resolve(null),
        ])
        if (!live.current) return
        setData({ loading: false, fatal: null, view, pricing, rate, names, opencode: null })
      }
    } catch (error) {
      if (!live.current) return
      setData(previous => ({
        ...previous,
        loading: false,
        fatal: error instanceof Error ? error.message : String(error),
      }))
    } finally {
      if (live.current) setBusy(false)
    }
  }, [model, provider, remote])

  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => {
    const id = window.setInterval(() => { void refresh() }, 60_000)
    return () => { window.clearInterval(id) }
  }, [refresh])
  useEffect(() => {
    const id = window.setInterval(() => { setNow(Date.now()) }, 1000)
    return () => { window.clearInterval(id) }
  }, [])

  if (isOpencodeGoProvider(provider)) {
    return (
      <OpencodeGoLine
        names={data.names}
        model={model}
        view={data.opencode}
        loading={data.loading}
        fatal={data.fatal}
        busy={busy}
        now={now}
        t={t}
        onRefresh={() => { void refresh() }}
      />
    )
  }
  if (data.view === null || !data.view.applicable) return null
  return (
    <DeepSeekLine
      view={data.view}
      pricing={data.pricing}
      rate={data.rate}
      names={data.names}
      provider={provider}
      model={model}
      usage={usage}
      busy={busy}
      now={now}
      fatal={data.fatal}
      t={t}
      onRefresh={() => { void refresh() }}
    />
  )
}

/** Shared chrome and action seat of both line variants. */
interface LineShellProps {
  busy: boolean
  t: BalanceLineProps['t']
  onRefresh: () => void
  children: ReactNode
}

function LineShell({ busy, t, onRefresh, children }: LineShellProps): ReactNode {
  return (
    <div className={css.line} data-testid="balance-line">
      {children}
      <button
        type="button"
        className={css.refresh}
        disabled={busy}
        onClick={onRefresh}
      >
        {t('balance.refresh')}
      </button>
    </div>
  )
}

/** The provider/model group, deduping a provider name already in the model name. */
function ProviderGroup({
  names,
  provider,
  model,
  t,
}: {
  names: ModelRouteDescribeView | null
  provider: string | undefined
  model: string | undefined
  t: BalanceLineProps['t']
}): ReactNode {
  const providerName = names?.providerName ?? provider ?? 'DeepSeek'
  const modelName = names?.modelName ?? model ?? t('balance.unknownModel')
  const redundant = providerName.length > 1
    && modelName.toLowerCase().startsWith(providerName.toLowerCase())
  const title = t('balance.providerTitle', { provider: providerName, model: modelName })
  return (
    <span className={css.group} title={title}>
      {redundant
        ? <strong>{modelName}</strong>
        : (<><strong>{providerName}</strong>{' · '}{modelName}</>)}
    </span>
  )
}

/** DeepSeek balance mode. */
function DeepSeekLine({
  view, pricing, rate, names, provider, model, usage, busy, now, fatal, t, onRefresh,
}: {
  view: BalanceView
  pricing: PricingView | null
  rate: DeepSeekRateView | null
  names: ModelRouteDescribeView | null
  provider: string | undefined
  model: string | undefined
  usage: TokenUsage | undefined
  busy: boolean
  now: number
  fatal: string | null
  t: BalanceLineProps['t']
  onRefresh: () => void
}): ReactNode {
  const info = balanceInfoOf(view)
  const stale = view.error !== undefined && info !== undefined
  const lowThreshold = 20
  const prices: ModelPricingView | undefined = pricing?.pricing
  const cnyRate = rate?.mode === 'unknown' ? null : rate?.prices ?? null
  const cnyCost = sessionCostCnyOf(usage, cnyRate)
  const usdCost = sessionCostOf(usage, prices)
  const costText = cnyRate !== null
    ? (cnyCost === null ? t('balance.costCny', { cost: '0.000' }) : t('balance.costCny', { cost: formatCnyCost(cnyCost).slice(1) }))
    : prices !== undefined && usdCost !== null
      ? t('balance.cost', { cost: formatUsdCost(usdCost) })
      : null

  const groups: ReactNode[] = []
  groups.push(<ProviderGroup key="route" names={names} provider={provider} model={model} t={t} />)
  if (fatal !== null) {
    groups.push(<span key="fatal" className={css.error}>{t('balance.error', { message: fatal })}</span>)
  } else if (info === undefined && view.error !== undefined) {
    if (view.error.code === 'no-api-key') {
      groups.push(<span key="nokey" className={css.error}>{t('balance.noKey')}</span>)
    } else {
      groups.push(<span key="berr" className={css.error}>{t('balance.error', { message: view.error.message })}</span>)
    }
  } else if (info !== undefined) {
    const low = info.totalBalance < lowThreshold
    const title = t('balance.balanceTitle', {
      total: info.totalBalance.toFixed(2),
      granted: info.grantedBalance.toFixed(2),
      toppedUp: info.toppedUpBalance.toFixed(2),
    })
    groups.push(
      <span key="bal" className={css.group} title={title}>
        {t('balance.title')}{' '}
        <b className={css.num}>{`¥${info.totalBalance.toFixed(2)}`}</b>
        {low
          ? <span className={css.warn} title={t('balance.low', { threshold: String(lowThreshold) })}> ⚠</span>
          : null}
      </span>,
    )
    if (stale) {
      groups.push(<span key="stale" className={css.stale} title={view.error?.message}>{t('balance.stale')}</span>)
    }
  }

  if (rate !== null && rate.mode === 'peak-valley' && rate.prices !== null) {
    const peakNow = rate.period === 'peak'
    const periodLabel = peakNow ? t('balance.peak') : t('balance.offpeak')
    const title = t('balance.priceTitle', {
      period: periodLabel,
      miss: rate.prices.inputCacheMiss.toFixed(2),
      hit: rate.prices.inputCacheHit.toFixed(2),
      output: rate.prices.output.toFixed(2),
    })
    groups.push(
      <span key="period" className={peakNow ? css.peak : css.offpeak} title={title}>{periodLabel}</span>,
    )
    if (rate.nextSwitchAt !== null) {
      const nextLabel = rate.nextIsPeak ? t('balance.peak') : t('balance.offpeak')
      const switchTitle = t('balance.switchTitle', {
        next: nextLabel,
        time: rate.nextSwitchLabel ?? '',
      })
      groups.push(
        <span key="switch" className={css.group} title={switchTitle}>
          {peakNow ? t('balance.countdownToOffpeak') : t('balance.countdownToPeak')}{' '}
          <b className={css.num}>{formatCountdown(rate.nextSwitchAt - now)}</b>
        </span>,
      )
    }
  }

  if (costText !== null) {
    groups.push(<span key="cost" className={css.group} title={costText}>{costText}</span>)
  }

  return (
    <LineShell busy={busy} t={t} onRefresh={onRefresh}>
      {groups}
    </LineShell>
  )
}

/** OpenCode Go subscription mode. */
function OpencodeGoLine({
  names, model, view, loading, fatal, busy, now, t, onRefresh,
}: {
  names: ModelRouteDescribeView | null
  model: string | undefined
  view: OpencodeGoUsageView | null
  loading: boolean
  fatal: string | null
  busy: boolean
  now: number
  t: BalanceLineProps['t']
  onRefresh: () => void
}): ReactNode {
  const groups: ReactNode[] = [
    <span key="route" className={css.group} title={t('balance.opencodeGoTitle')}>
      <strong>OpenCode Go</strong>{' · '}{names?.modelName ?? model ?? t('balance.unknownModel')}
    </span>,
  ]

  if (fatal !== null) {
    groups.push(<span key="fatal" className={css.error}>{t('balance.opencodeGoError', { message: fatal })}</span>)
  } else if (view === null || loading) {
    groups.push(<span key="loading" className={css.group}>{t('balance.opencodeGoLoading')}</span>)
  } else if (view.error !== undefined && view.windows.length === 0) {
    groups.push(view.error.code === 'opencode-go-no-key'
      ? <span key="nokey" className={css.error}>{t('balance.opencodeGoNoKey')}</span>
      : <span key="subberr" className={css.error}>{t('balance.opencodeGoError', { message: view.error.message })}</span>)
  } else {
    const windows = view.windows
    const remainingOf = (window: OpencodeGoWindow): number => Math.max(0, 100 - window.usedPercent)
    const labelOf = (key: OpencodeGoWindow['key']): string =>
      key === 'five_hour'
        ? t('balance.opencodeGoWindow5h')
        : key === 'seven_day' ? t('balance.opencodeGoWindowWeek') : t('balance.opencodeGoWindowMonth')
    const alarmWindows = windows.filter(window => remainingOf(window) <= 20)
    const titleLines = [t('balance.opencodeGoTitle')].concat(windows.map((window) => {
      const label = labelOf(window.key)
      return t('balance.opencodeGoWindowTitle', {
        label,
        remaining: String(remainingOf(window)),
        used: String(window.usedPercent),
        reset: window.resetsAt === null ? '—' : formatDateTime(window.resetsAt),
        countdown: window.resetsAt === null ? '—' : formatResetCountdown(window.resetsAt - now),
      })
    }))
    if (alarmWindows.length > 0) {
      titleLines.push(t('balance.opencodeGoAlarm', {
        windows: alarmWindows.map(window => labelOf(window.key)).join('、'),
      }))
    }
    groups.push(
      <span key="windows" className={css.group} title={titleLines.join('\n')}>
        {windows.map((window, index) => {
          const remaining = remainingOf(window)
          return (
            <span key={window.key}>
              {index > 0 ? ' · ' : ''}
              {labelOf(window.key)}{' '}
              <b className={`${css.num} ${remaining <= 20 ? css.peak : css.offpeak}`}>{`${remaining}%`}</b>
            </span>
          )
        })}
        {alarmWindows.length > 0 ? <span className={css.warn}> ⚠</span> : null}
      </span>,
    )
    const priority: Record<OpencodeGoWindow['key'], number> = { five_hour: 0, seven_day: 1, monthly: 2 }
    const resettable = windows.filter(window => window.resetsAt !== null)
      .sort((left, right) => priority[left.key] - priority[right.key])
    const next = resettable[0]
    if (next !== undefined && next.resetsAt !== null) {
      groups.push(
        <span key="reset" className={css.group}>
          {t('balance.opencodeGoReset')}{' '}
          <b className={css.num}>{formatResetCountdown(next.resetsAt - now)}</b>
        </span>,
      )
    }
    if (view.error !== undefined) {
      groups.push(<span key="stale" className={css.stale}>{t('balance.opencodeGoStale')}</span>)
    }
  }

  return (
    <LineShell busy={busy} t={t} onRefresh={onRefresh}>
      {groups}
    </LineShell>
  )
}
