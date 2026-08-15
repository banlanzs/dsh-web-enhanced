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
import type { WebEnhancedProps } from '../contract.ts';
/** Full composed props of the balance line. */
export type BalanceLineProps = WebEnhancedProps<'conversation.composer.dock'>;
/** The balance line: one muted row under the composer. */
export declare function BalanceLine({ remote, modelRoute, sessionId, useProjection, t }: BalanceLineProps): import("react").JSX.Element | null;
