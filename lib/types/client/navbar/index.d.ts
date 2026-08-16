/**
 * Conversation node navbar: an equidistant node strip on the chat flow's
 * right edge — one node per user message. The active pill follows the
 * reading position, hover/focus shows a glass preview card (6-line clamp),
 * a click smooth-jumps to that message, >11 nodes slide a window around the
 * active one, and pinned turns (gold pills, from the assistant action bar)
 * stay visible and jump straight to the curated reply.
 *
 * Zero data-channel dependency: everything reads the host's own DOM anchors
 * (`data-time-hover-root` rows, the `data-chat-flow` column, `data-turn-tail`
 * turn numbers). All listeners, observers, and nodes are created through one
 * disposer, so unloading the plugin retracts the strip exactly.
 *
 * Ported from the reference dsh-navbar plugin (v0.3.0), attribute namespace
 * renamed to this plugin's (`data-dsh-we-navbar` / `data-we-nav-*`).
 * @module dsh-web-enhanced/src/client/navbar
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/**
 * Mount the navbar for this page.
 * @param ctx - client root context (slots for the pin action).
 * @returns the disposer removing every node, listener, and observer.
 */
export declare function applyNavbar(ctx: ClientContext): () => void;
