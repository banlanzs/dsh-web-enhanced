/**
 * DeepSeek peak/off-peak billing clock and the rate table the balance line
 * annotates. DeepSeek's official billing has two peak windows per Beijing
 * day (09:00–12:00 and 14:00–18:00); the V4 Flash/Pro catalog models publish
 * peak and off-peak prices, while the legacy chat model is flat. Models
 * outside the table are `unknown` so the UI hides the period group rather
 * than guessing.
 * @module dsh-web-enhanced/src/deepseek-rate
 */
import type { DeepSeekRateView, DeepSeekRateWindow } from './types.ts';
/** One model's CNY prices, per one million tokens. */
export interface DeepSeekRateEntry {
    readonly mode: 'peak-valley' | 'flat';
    readonly peak?: DeepSeekRateWindow;
    readonly offpeak?: DeepSeekRateWindow;
    readonly price?: DeepSeekRateWindow;
}
/** DeepSeek official rates used by the display (reference project table). */
export declare const DEEPSEEK_RATES: Readonly<Record<string, DeepSeekRateEntry>>;
/** Beijing wall-clock minute of one instant. */
export declare function beijingMinutes(nowMs: number): number;
/** Whether `nowMs` falls in a Beijing peak window. */
export declare function currentDeepSeekPeriod(nowMs: number): 'peak' | 'offpeak';
/**
 * Next peak-window boundary as an epoch-ms timestamp. The four daily bounds
 * are 09:00 / 12:00 / 14:00 / 18:00 Beijing; past 18:00 the next boundary is
 * tomorrow 09:00.
 */
export declare function nextDeepSeekSwitchAt(nowMs: number): number;
/** `HH:MM` Beijing label of the next switch. */
export declare function nextDeepSeekSwitchLabel(nowMs: number): string;
/**
 * The display facts of one model's DeepSeek billing. Unknown models keep a
 * neutral `unknown` shape: the client hides the group and falls back to its
 * models.dev estimate for session cost.
 * @param model - model id selected on a DeepSeek route.
 * @param nowMs - clock to describe.
 * @returns the rate view for the current instant.
 */
export declare function deepseekRateFor(model: string, nowMs?: number): DeepSeekRateView;
