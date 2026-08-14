/**
 * Five-field cron parser and next-occurrence solver, local time. Supports
 * star, star/step, a-b ranges, a,b lists, and plain numbers; day-of-week 0
 * and 7 both mean Sunday. Pure module: no I/O, no state.
 * @module dsh-web-enhanced/src/cron
 */
/** Field name and legal range of each of the five cron fields. */
const FIELDS = [
    ['minute', 0, 59],
    ['hour', 0, 23],
    ['day of month', 1, 31],
    ['month', 1, 12],
    ['day of week', 0, 7],
];
/** Search horizon: no occurrence beyond ~4 years is planned for. */
export const CRON_HORIZON_MS = 4 * 366 * 24 * 60 * 60 * 1000;
/**
 * Parse one comma-separated field into its accepted value set.
 * @param raw - the field text (e.g. `0/15`, `1-5`, `3,7`).
 * @param field - field name for error messages.
 * @param min - inclusive lower bound.
 * @param max - inclusive upper bound.
 * @returns the accepted values.
 * @throws when the field is malformed or out of range.
 */
function parseField(raw, field, min, max) {
    const values = new Set();
    for (const token of raw.split(',')) {
        if (token === '')
            throw new Error(`cron: empty list item in ${field}`);
        let step = 1;
        let range = token;
        const slash = token.indexOf('/');
        if (slash !== -1) {
            if (slash === 0)
                throw new Error(`cron: ${field} step requires a base`);
            range = token.slice(0, slash);
            const stepRaw = token.slice(slash + 1);
            if (!/^\d+$/u.test(stepRaw))
                throw new Error(`cron: invalid step '${stepRaw}' in ${field}`);
            step = Number(stepRaw);
            if (step < 1)
                throw new Error(`cron: ${field} step must be a positive integer`);
        }
        let lo;
        let hi;
        if (range === '*') {
            lo = min;
            hi = max;
        }
        else {
            const dash = range.indexOf('-');
            if (dash === -1) {
                if (!/^\d+$/u.test(range))
                    throw new Error(`cron: invalid value '${range}' in ${field}`);
                lo = Number(range);
                hi = lo;
            }
            else {
                const loRaw = range.slice(0, dash);
                const hiRaw = range.slice(dash + 1);
                if (!/^\d+$/u.test(loRaw) || !/^\d+$/u.test(hiRaw)) {
                    throw new Error(`cron: invalid range '${range}' in ${field}`);
                }
                lo = Number(loRaw);
                hi = Number(hiRaw);
            }
        }
        if (lo < min || hi > max || lo > hi) {
            throw new Error(`cron: ${field} range ${lo}-${hi} outside ${min}-${max}`);
        }
        for (let value = lo; value <= hi; value += step)
            values.add(value);
    }
    return values;
}
/**
 * Parse a five-field cron expression.
 * @param expr - the five fields: minute hour day-of-month month day-of-week.
 * @returns the accepted value sets.
 * @throws when the expression is malformed or a value is out of range.
 */
export function parseCron(expr) {
    const parts = expr.trim().split(/\s+/u);
    if (parts.length !== 5) {
        throw new Error(`cron '${expr}': expected 5 fields (minute hour day-of-month month day-of-week)`);
    }
    const minutes = parseField(parts[0], FIELDS[0][0], FIELDS[0][1], FIELDS[0][2]);
    const hours = parseField(parts[1], FIELDS[1][0], FIELDS[1][1], FIELDS[1][2]);
    const days = parseField(parts[2], FIELDS[2][0], FIELDS[2][1], FIELDS[2][2]);
    const months = parseField(parts[3], FIELDS[3][0], FIELDS[3][1], FIELDS[3][2]);
    const weekdays = new Set();
    for (const value of parseField(parts[4], FIELDS[4][0], FIELDS[4][1], FIELDS[4][2])) {
        weekdays.add(value === 7 ? 0 : value);
    }
    return {
        minutes, hours, days, months, weekdays,
        dayRestricted: parts[2] !== '*',
        weekdayRestricted: parts[4] !== '*',
    };
}
/**
 * Day-of-month × day-of-week semantics: when both fields are restricted,
 * either matching day fires; when one is unrestricted, only the restricted
 * field decides.
 */
function dayMatches(spec, date) {
    if (!spec.dayRestricted && !spec.weekdayRestricted)
        return true;
    const dom = spec.days.has(date.getDate());
    const dow = spec.weekdays.has(date.getDay());
    if (!spec.dayRestricted)
        return dow;
    if (!spec.weekdayRestricted)
        return dom;
    return dom || dow;
}
/**
 * Compute the next occurrence strictly after the reference instant (local
 * time).
 * @param spec - parsed expression.
 * @param from - reference instant (ms epoch).
 * @returns the next matching instant, or null when none exists within the horizon.
 */
export function nextAfter(spec, from) {
    const horizon = from + CRON_HORIZON_MS;
    const start = new Date(from);
    start.setMinutes(start.getMinutes() + 1, 0, 0);
    const first = start.getTime();
    /* v8 ignore next -- the horizon is always at least a minute ahead of the first candidate */
    if (first > horizon) {
        return null;
    }
    for (let day = new Date(start); day.getTime() <= horizon; day.setDate(day.getDate() + 1)) {
        if (!spec.months.has(day.getMonth() + 1))
            continue;
        if (!dayMatches(spec, day))
            continue;
        const firstHour = day.getTime() === first ? day.getHours() : 0;
        const firstMinute = day.getTime() === first ? day.getMinutes() : 0;
        for (let hour = firstHour; hour < 24; hour++) {
            if (!spec.hours.has(hour))
                continue;
            // The first-minute offset applies only to the first scanned hour.
            const minuteStart = hour === firstHour ? firstMinute : 0;
            for (let minute = minuteStart; minute < 60; minute++) {
                if (!spec.minutes.has(minute))
                    continue;
                const candidate = new Date(day);
                candidate.setHours(hour, minute, 0, 0);
                /* v8 ignore next -- candidates start at the next minute, so they are always after the reference */
                if (candidate.getTime() > from)
                    return candidate.getTime();
            }
        }
    }
    return null;
}
