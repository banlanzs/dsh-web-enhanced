/**
 * Balance line under the composer: the DeepSeek account balance from the host
 * remote, with a refresh affordance and a muted error state. The host caches
 * the view, so mounting several sessions does not fan out to the endpoint.
 *
 * The line is tied to the session's model route. The endpoint serves ONE
 * account at one vendor, so a session switched to another channel gets no line
 * at all rather than a number about somebody else's account — the host makes
 * that call (it knows where each route points) and answers `applicable`.
 * @module dsh-web-enhanced/src/client/balance/BalanceLine
 */
import type { WebEnhancedProps } from '../contract.ts';
/** Full composed props of the balance line. */
export type BalanceLineProps = WebEnhancedProps<'conversation.composer.dock'>;
/** The balance line: one muted row under the composer. */
export declare function BalanceLine({ remote, modelRoute, sessionId, t }: BalanceLineProps): import("react").JSX.Element | null;
