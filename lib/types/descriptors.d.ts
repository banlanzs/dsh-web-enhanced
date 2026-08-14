/**
 * The Typert invocation descriptors of this plugin — one authority shared by
 * both halves.
 *
 * The host half registers these through `ctx.typert.register()` and the client
 * half mounts the same list as its Remote contribution, so the two sides
 * cannot drift on parameter arity or result schemas.
 *
 * Registering explicitly is not optional here. The Gateway's other discovery
 * path (SRC mode) reads the `@Remote` markers out of dsh-typert-protocol's
 * PRIVATE MODULE STATE, which only works when the plugin and the host resolve
 * that package to the same file. A globally installed `dsh` CLI carries its
 * own copy under its own node_modules, while an installed plugin resolves to
 * the profile's copy — two instances, no shared markers, and the Gateway's
 * `claimsEndpoint` then refuses every endpoint, so each call falls through to
 * the SPA route and answers 404. Descriptors registered here live in the
 * `ctx.typert.local` registry instead: a Cordis service, reached through the
 * context, immune to how the module specifier resolved.
 *
 * Parameter arity is a wire contract: the Gateway maps `parameters`
 * positionally onto the host method (`Reflect.apply`) and both halves reject a
 * mismatched argument count, so a descriptor's parameter list IS the host
 * method's signature. Every method here declares exactly one `request`
 * parameter, matching the one request object each gateway method takes.
 * @module dsh-web-enhanced/src/descriptors
 */
import type { InvocationDescriptor } from '@deepseek-ai/dsh-typert-protocol';
/** Wire namespace and Cordis service key of the gateway. */
export declare const WEB_ENHANCED_NAMESPACE = "webEnhanced";
/** Package identity carried by both contributions. */
export declare const WEB_ENHANCED_PACKAGE = "dsh-web-enhanced";
/** Every invocation this plugin exposes, in gateway declaration order. */
export declare const WEB_ENHANCED_DESCRIPTORS: readonly InvocationDescriptor[];
