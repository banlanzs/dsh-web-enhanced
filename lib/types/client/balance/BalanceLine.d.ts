/**
 * Balance line under the composer: the DeepSeek account balance from the host
 * remote, with a refresh affordance and a muted error state. The host caches
 * the view, so mounting several sessions does not fan out to the endpoint.
 * @module dsh-web-enhanced/src/client/balance/BalanceLine
 */
import type { WebEnhancedProps } from '../contract.ts';
/** Full composed props of the balance line. */
export type BalanceLineProps = WebEnhancedProps<'conversation.composer.dock'>;
/** The balance line: one muted row under the composer. */
export declare function BalanceLine({ remote, t }: BalanceLineProps): import("react").JSX.Element | null;
