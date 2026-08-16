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
import type { BalanceInfo, BalanceView, WebEnhancedProps } from '../contract.ts';
/** Full composed props of the balance line. */
export type BalanceLineProps = WebEnhancedProps<'conversation.composer.dock'>;
/** Providers whose billing line is the OpenCode Go subscription. */
export declare function isOpencodeGoProvider(provider: string | undefined): boolean;
/** The CNY balance line if present, preferring the account's main currency. */
export declare function balanceInfoOf(view: BalanceView | null): BalanceInfo | undefined;
/** The balance line: one muted row under the composer. */
export declare function BalanceLine({ remote, modelRoute, sessionId, useProjection, t }: BalanceLineProps): import("react").JSX.Element | null;
