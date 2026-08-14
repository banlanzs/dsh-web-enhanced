/**
 * Web-enhanced client plugin: the slot assembly.
 *
 * Where each surface lands and why:
 * - `sidebar.footer.action` — the task-board and git-graph ENTRY buttons only.
 * - `shell.overlay` — the board, the graph, and the right panel themselves.
 *   It is the frame-wide floating layer: above every column, outside their
 *   scroll containers, additive (a list slot), and click-through until an
 *   entry opts into pointer events. The alternative, `details`, is a `single`
 *   slot already occupied by ui-conversation's DetailsPanel — registering
 *   there would REPLACE the tool-details column rather than add to it.
 * - `conversation.input.dock` — the branch strip (above the composer).
 * - `conversation.composer.dock` — the balance line (below the composer).
 *
 * Shared state lives in `apply` as plain observables and reaches components
 * through each registration's inject `hooks` compartment; a slot store handle
 * could not, because these surfaces span the `root` and `session` scopes.
 * @module dsh-web-enhanced/src/client
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
// SlotMap merges of the slots these registrations target, declared by the
// owning UI packages.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { webEnhancedRemote } from './remote.ts'
import { en, zh } from './locales.ts'
// The LocaleNamespaceMap merge for 'webEnhanced' rides this import.
import type {} from './locale-keys.ts'
import type { WebEnhancedInject, WebEnhancedRemote } from './contract.ts'
import { createOverlay, createPanel, createPreview } from './stores.ts'
import { BoardSidebarEntry, GraphSidebarEntry } from './board/SidebarEntry.tsx'
import { BoardOverlay } from './board/BoardOverlay.tsx'
import { BranchStrip } from './git/BranchStrip.tsx'
import { GraphOverlay } from './git/GraphOverlay.tsx'
import { RightPanel } from './panel/RightPanel.tsx'
import { BalanceLine } from './balance/BalanceLine.tsx'

/** Locale namespace owned by this plugin. */
const NS = 'webEnhanced'

/**
 * Services this client plugin requires.
 *
 * Deliberately no `remote.webEnhanced`: that namespace is mounted by this
 * plugin's own apply through `ctx.remote.$mount`, so declaring it here would
 * deadlock the entry waiting for a service only its own apply can create.
 */
export const inject = ['slots', 'locale', 'remote', 'sessions', 'workspaces']

/**
 * Mount the web-enhanced registrations.
 *
 * Registrations start only after the remote mount settles: the namespace
 * service lives on the api-gateway fiber, never on this plugin's inject
 * chain, so it is read through the untyped store accessor — a direct
 * `ctx.remote.webEnhanced` access would trip Cordis' inject check.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'web-enhanced: dictionaries')

  const overlay = createOverlay()
  const panel = createPanel()
  const preview = createPreview()

  ctx.effect(() => {
    const disposers: Array<() => void> = []

    void ctx.remote.$mount(webEnhancedRemote).then(
      (disposeMount) => {
        disposers.push(disposeMount)
        // Uninjected read of the namespace service mounted on the gateway fiber.
        const remote = ctx.get('remote.webEnhanced' as never, false) as unknown as WebEnhancedRemote | undefined
        if (remote === undefined) {
          console.error('[web-enhanced] remote.webEnhanced unavailable after $mount')
          return
        }

        const face = (): WebEnhancedInject => ({
          remote,
          openSession: (sessionId) => {
            // `Context.sessions` carries two declaration merges in this
            // package's program: the Web runtime's SessionsService (which has
            // `open`) and, pulled in by the node half's payload types, the
            // host's SessionStore (which does not). The node one wins the
            // lookup here, so the navigation face is named explicitly rather
            // than casting the whole service away. The id itself is an opaque
            // brand over the string the host minted and task records carry it
            // as a plain wire field, hence the second narrowing.
            const navigation = ctx.sessions as unknown as { open(id: never): void }
            navigation.open(sessionId as never)
          },
          hooks: { overlay: overlay.cell, panel: panel.cell, preview: preview.cell },
          ...overlay.actions,
          ...panel.actions,
          ...preview.actions,
        })

        disposers.push(
          ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
            name: 'sidebar.footer.action',
            id: 'web-enhanced-board',
            order: 10,
            locale: NS,
            inject: face,
          }, BoardSidebarEntry)),
          ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
            name: 'sidebar.footer.action',
            id: 'web-enhanced-graph',
            order: 20,
            locale: NS,
            inject: face,
          }, GraphSidebarEntry)),
          ctx.slots.inject('shell.overlay', () => ctx.slots.register({
            name: 'shell.overlay',
            id: 'web-enhanced-board-overlay',
            order: 10,
            locale: NS,
            inject: face,
          }, BoardOverlay)),
          ctx.slots.inject('shell.overlay', () => ctx.slots.register({
            name: 'shell.overlay',
            id: 'web-enhanced-graph-overlay',
            order: 20,
            locale: NS,
            inject: face,
          }, GraphOverlay)),
          ctx.slots.inject('shell.overlay', () => ctx.slots.register({
            name: 'shell.overlay',
            id: 'web-enhanced-panel',
            order: 30,
            locale: NS,
            inject: face,
          }, RightPanel)),
          ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
            name: 'conversation.input.dock',
            id: 'web-enhanced-branch',
            order: 10,
            locale: NS,
            inject: face,
          }, BranchStrip)),
          ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
            name: 'conversation.composer.dock',
            id: 'web-enhanced-balance',
            order: 10,
            locale: NS,
            inject: face,
          }, BalanceLine)),
        )
      },
      (error: unknown) => { console.error('[web-enhanced] remote mount failed:', error) },
    )

    return () => {
      for (const dispose of disposers.reverse()) dispose()
    }
  }, 'web-enhanced: remote mount + registrations')
}

export { createOverlay, createPanel, createPreview } from './stores.ts'
export type { WebEnhancedInject, WebEnhancedInjected } from './contract.ts'
export { workspaceOfSession } from './workspace.ts'
