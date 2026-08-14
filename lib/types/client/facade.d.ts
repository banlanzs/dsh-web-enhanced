/**
 * Remote envelope adapter.
 *
 * A mounted Typert namespace method does NOT resolve to the host's business
 * payload — it resolves to `RemoteResult<T>`, the `{ ok: true, value }` /
 * `{ ok: false, error }` envelope. The Remote face folds carrier failures
 * (offline, an unmounted host method, a rejected payload) into that error
 * branch rather than rejecting, so a component that reads the resolved value
 * as if it were the payload sees `undefined` fields instead of a failure.
 *
 * This adapter is the one place that opens the envelope. Every method comes
 * back as this plugin's own success-or-`{ error }` union, which is what the
 * components already narrow on, so a transport failure renders exactly like a
 * business failure instead of crashing the slot entry.
 * @module dsh-web-enhanced/src/client/facade
 */
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol';
import type { WebEnhancedRemote } from './contract.ts';
/**
 * The raw mounted namespace: the same method names, each resolving to the
 * envelope around the payload this plugin's facade exposes.
 */
export type RawWebEnhancedNamespace = {
    [Method in keyof WebEnhancedRemote]: (...args: Parameters<WebEnhancedRemote[Method]>) => Promise<RemoteResult<Awaited<ReturnType<WebEnhancedRemote[Method]>>>>;
};
/**
 * Wrap a mounted namespace into the facade components call.
 * @param raw - the mounted `remote.webEnhanced` namespace.
 * @param now - clock for the balance fallback's `cachedAt`.
 * @returns the envelope-free facade.
 */
export declare function createRemoteFacade(raw: RawWebEnhancedNamespace, now?: () => number): WebEnhancedRemote;
