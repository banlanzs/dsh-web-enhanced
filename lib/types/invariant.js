/** Package-owned invariant companion. @module dsh-web-enhanced/src/invariant */
const PACKAGE_NAME = 'dsh-web-enhanced';
/** Cordis companion plugin name. */
export const name = 'web-enhanced-invariant';
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants'];
/**
 * No runtime invariant: every task transition is a storage-domain record
 * write validated by the zod schema at the durable boundary, and the
 * running-with-session pairing is asserted by the gateway's unit tests and
 * the restart-recovery path; there is no separate authoritative stream to
 * check a relationship against.
 */
const install = () => { };
/** Register this package's invariant companion. */
export const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
