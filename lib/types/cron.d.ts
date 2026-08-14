/**
 * Five-field cron parser and next-occurrence solver, local time. Supports
 * star, star/step, a-b ranges, a,b lists, and plain numbers; day-of-week 0
 * and 7 both mean Sunday. Pure module: no I/O, no state.
 * @module dsh-web-enhanced/src/cron
 */
/** Parsed cron expression: the accepted value set per field. */
export interface CronSpec {
    readonly minutes: ReadonlySet<number>;
    readonly hours: ReadonlySet<number>;
    readonly days: ReadonlySet<number>;
    readonly months: ReadonlySet<number>;
    readonly weekdays: ReadonlySet<number>;
    /**
     * Whether the day-of-month field was written as anything other than `*`.
     * The value set cannot answer this: an explicit `1-31` accepts every day
     * yet still restricts the field, which flips the day-of-month x day-of-week
     * rule in {@link dayMatches}.
     */
    readonly dayRestricted: boolean;
    /** Whether the day-of-week field was written as anything other than `*`. */
    readonly weekdayRestricted: boolean;
}
/** Search horizon: no occurrence beyond ~4 years is planned for. */
export declare const CRON_HORIZON_MS: number;
/**
 * Parse a five-field cron expression.
 * @param expr - the five fields: minute hour day-of-month month day-of-week.
 * @returns the accepted value sets.
 * @throws when the expression is malformed or a value is out of range.
 */
export declare function parseCron(expr: string): CronSpec;
/**
 * Compute the next occurrence strictly after the reference instant (local
 * time).
 * @param spec - parsed expression.
 * @param from - reference instant (ms epoch).
 * @returns the next matching instant, or null when none exists within the horizon.
 */
export declare function nextAfter(spec: CronSpec, from: number): number | null;
