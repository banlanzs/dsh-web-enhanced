/**
 * The web-enhanced Typert contribution, hand-declared for the client
 * assembly: the host gateway discovers the same methods through the SRC
 * fallback (the `@Remote` decorators on `WebEnhancedGateway`), so this plugin
 * ships no generated typert artifacts.
 *
 * Parameter arity is the contract that matters here. The Gateway invokes a
 * host method as `Reflect.apply(method, receiver, args)` with `args` built by
 * mapping `descriptor.parameters` in order, and the client half refuses a call
 * whose argument count differs from `descriptor.parameters.length`. So a
 * descriptor's parameter list IS the host method's positional signature:
 * every method here declares exactly ONE `request` parameter and every gateway
 * method takes exactly one request object. Splitting a request object into
 * per-field parameters would compile fine and fail at runtime on both sides.
 *
 * Parameter codecs stay permissive (the host validates its own request types);
 * result codecs are strict and mirror `../types.ts`.
 * @module dsh-web-enhanced/src/client/remote
 */
import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol';
import type { WebEnhancedRemote } from './contract.ts';
/** The contribution mounted by the client half. */
export declare const webEnhancedRemote: TypertRemoteContribution;
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespaceMap {
        /** Web-enhanced host capabilities (hand-declared strict contribution). */
        webEnhanced: WebEnhancedRemote;
    }
}
