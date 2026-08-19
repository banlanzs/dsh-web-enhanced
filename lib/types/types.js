/**
 * Wire and durable payload vocabulary of the web-enhanced host gateway, plus
 * the shared constants both halves need. The zod schemas live in
 * `./schemas.ts` and the gateway in `./gateway.ts`. Every payload here crosses
 * the Typert wire, so fields stay plain JSON values (brands are compile-time
 * only).
 * @module dsh-web-enhanced/src/types
 */
/** Settings namespace owning the user-editable global system prompt. */
export const GLOBAL_PROMPT_SETTINGS_NS = 'dsh-web-enhanced-global-prompt';
/** Upper bound on the global prompt text the settings page accepts. */
export const GLOBAL_PROMPT_MAX_CHARS = 100_000;
/** Settings namespace owning the memory feature switch. */
export const MEMORY_SETTINGS_NS = 'dsh-web-enhanced-memory';
