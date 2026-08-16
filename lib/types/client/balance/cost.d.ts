/**
 * Session-cost arithmetic for the balance line.
 *
 * The token-usage projection bills in four buckets (uncached input, cache
 * read, cache write, output) and models.dev prices are USD per one million
 * tokens. The readout is an estimate by design: projections are the host's
 * durable accounting, but a price can lag a vendor's repricing.
 * @module dsh-web-enhanced/src/client/balance/cost
 */
import type { DeepSeekRateWindow, ModelPricingView } from '../contract.ts';
/** The four token buckets the host's token-usage projection carries. */
export interface TokenUsage {
    readonly uncachedInputTokens: number;
    readonly cacheReadTokens: number;
    readonly cacheWriteTokens: number;
    readonly outputTokens: number;
}
/**
 * Cost of one session's billed tokens under one model's prices.
 * @param usage - the session's token-usage projection.
 * @param pricing - per-million-token prices from models.dev.
 * @returns USD cost (rounded to the floating-point value), or null when no token was billed.
 */
export declare function sessionCostOf(usage: TokenUsage | undefined, pricing: ModelPricingView | undefined): number | null;
/**
 * Format a USD estimate: four decimals while it is under one cent, then two.
 * @param cost - USD amount.
 * @returns the prefixed display string.
 */
export declare function formatUsdCost(cost: number): string;
/**
 * Cost of one session's billed tokens under the active DeepSeek CNY window
 * (the 2026-08-17 peak/off-peak billing table).
 * @param usage - the session's token-usage projection.
 * @param rate - the active DeepSeek price window (null outside the table).
 * @returns CNY cost, or null when no tokens were billed or no rate exists.
 */
export declare function sessionCostCnyOf(usage: TokenUsage | undefined, rate: DeepSeekRateWindow | null | undefined): number | null;
/**
 * Format a CNY estimate: four decimals while it is under one cent, then three.
 * @param cost - CNY amount.
 * @returns the prefixed display string.
 */
export declare function formatCnyCost(cost: number): string;
