/**
 * Web-enhanced client plugin: the slot assembly.
 *
 * Where each surface lands and why:
 * - `conversation.view` — the Workspace tab whose internal tablist carries
 *   Files / Preview / Changes / Task Board / Git Graph.
 * - `shell.overlay` — the mention file browser (the frame-wide floating
 *   layer). The alternative, `details`, is a `single` slot already occupied
 *   by ui-conversation's DetailsPanel — registering there would REPLACE the
 *   tool-details column rather than add to it.
 * - `conversation.session.header.actions` — the branch strip, beside the
 *   session title (titleCluster).
 * - `conversation.composer.dock` — the balance + session-cost line (below
 *   the composer).
 *
 * Shared state lives in `apply` as plain observables and reaches components
 * through each registration's inject `hooks` compartment; a slot store handle
 * could not, because these surfaces span the `root` and `session` scopes.
 * @module dsh-web-enhanced/src/client
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/**
 * Services this client plugin requires.
 *
 * Deliberately no `remote.webEnhanced`: that namespace is mounted by this
 * plugin's own apply through `ctx.remote.$mount`, so declaring it here would
 * deadlock the entry waiting for a service only its own apply can create.
 */
export declare const inject: string[];
/**
 * Mount the web-enhanced registrations.
 *
 * Registrations start only after the remote mount settles: the namespace
 * service lives on the api-gateway fiber, never on this plugin's inject
 * chain, so it is read through the untyped store accessor — a direct
 * `ctx.remote.webEnhanced` access would trip Cordis' inject check.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
export { createBrowse, createOverlay, createPanel, createPreview } from './stores.ts';
export type { WebEnhancedInject, WebEnhancedInjected } from './contract.ts';
export { workspaceOfSession } from './workspace.ts';
