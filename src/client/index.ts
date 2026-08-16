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

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
// SlotMap merges of the slots these registrations target, declared by the
// owning UI packages.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { webEnhancedRemote } from './remote.ts'
import { en, zh } from './locales.ts'
// The LocaleNamespaceMap merge for 'webEnhanced' rides this import.
import type {} from './locale-keys.ts'
import type { WebEnhancedInject, WebEnhancedRemote } from './contract.ts'
import { createRemoteFacade } from './facade.ts'
import type { RawWebEnhancedNamespace } from './facade.ts'
import { createModelRoute } from './model-route.ts'
import { applyMention, mentionOptions } from './mention.ts'
import type { MentionDeps, MentionKind, MentionOption } from './mention.ts'
import { workspaceOfSessionId } from './workspace.ts'
import { createBrowse, createOverlay, createPanel, createPreview } from './stores.ts'
import { SkinLayer } from './skins/skin-layer.ts'
import { BrowseOverlay } from './browse/BrowseOverlay.tsx'
import { BranchStrip } from './git/BranchStrip.tsx'
import { WorkspaceView } from './panel/WorkspaceView.tsx'
import { SettingsSection } from './settings/SettingsSection.tsx'
import { BalanceLine } from './balance/BalanceLine.tsx'

/** Locale namespace owned by this plugin. */
const NS = 'webEnhanced'

/**
 * The two optional services the mention pickers need, structurally.
 *
 * Both are read uninjected: `commandUi` owns the composer's `+` menu and
 * `conversation` owns the draft, and a deployment composed without either must
 * still get the rest of this plugin rather than an entry that never starts.
 */
interface CommandUiFace {
  register(contribution: {
    readonly name: string
    readonly description: string
    available(session: { readonly sessionId: string }): boolean
    readonly ui: {
      readonly kind: 'popupSelect'
      options(session: { readonly sessionId: string }, signal: AbortSignal): Promise<readonly MentionOption[]>
      onSelect(option: MentionOption, session: { readonly sessionId: string }): void | Promise<void>
    }
  }): () => void
}

/** The per-session draft face (`ctx.conversation.input`), structurally. */
interface ConversationFace {
  readonly input: {
    for(actx: unknown): {
      setDraft(text: string): void
      readonly state: { getSnapshot(): { readonly draft: string } }
    }
  }
}

/**
 * Append one mention to a session's composer draft.
 *
 * `ctx.conversation` owns the per-session input machine and is read
 * uninjected, so a deployment composed without it degrades this one gesture
 * rather than the whole plugin.
 * @param ctx - client root context.
 * @param sessionId - the session whose draft receives the text.
 * @param text - the mention, trailing separator included.
 */
function appendMentionTo(ctx: ClientContext, sessionId: string, text: string): void {
  const conversation = ctx.get('conversation' as never) as unknown as ConversationFace | undefined
  // Same declaration-merge collision as `openSession`: this package's program
  // carries both the Web runtime's SessionRuntime (which has `scope`) and the
  // host's SessionStore (which does not), and the node one wins the lookup —
  // so the scope face is named explicitly rather than casting the whole
  // service away.
  const scopes = ctx.sessions as unknown as { scope(id: string): unknown }
  const actx = scopes.scope(sessionId)
  if (conversation === undefined || actx === undefined) return
  const input = conversation.input.for(actx)
  const draft = input.state.getSnapshot().draft
  // A separator only where one is missing: appending to an empty draft or to
  // text that already ends in whitespace must not add a stray space.
  input.setDraft(draft === '' || /\s$/u.test(draft) ? draft + text : `${draft} ${text}`)
}

/**
 * Register the file and folder mention pickers into the composer's `+` menu.
 *
 * A no-op disposer when the deployment composes no command menu — the rest of
 * this plugin does not depend on one.
 * @param ctx - client root context.
 * @param remote - the envelope-free host facade.
 * @param openBrowse - opener of the file-browser overlay (project root, a
 *   folder entered from the picker, or the host home for ungrouped sessions).
 * @returns the disposer.
 */
function registerMentionCommands(
  ctx: ClientContext,
  remote: WebEnhancedRemote,
  openBrowse: (kind: MentionKind, sessionId: string, startPath?: string) => void,
): () => void {
  const commandUi = ctx.get('commandUi' as never) as unknown as CommandUiFace | undefined
  if (commandUi === undefined) return () => {}
  const t = ctx.locale.bind(NS)
  const deps: MentionDeps = {
    remote,
    workspaceOf: (sessionId) => {
      const workspace = workspaceOfSessionId(sessionId, ctx.workspaces.list.getSnapshot())
      return workspace === undefined
        ? undefined
        : { workspaceId: String(workspace.workspaceId), path: workspace.path }
    },
    appendDraft: (sessionId, text) => { appendMentionTo(ctx, sessionId, text) },
    openBrowse,
    browseLabel: () => t('mention.browse'),
  }
  const picker = (kind: MentionKind, name: string, description: string): () => void =>
    commandUi.register({
      name,
      description,
      // Always available: a session with no project still gets the browse row,
      // because nothing about an ungrouped session forbids naming a path.
      available: () => true,
      ui: {
        kind: 'popupSelect',
        options: session => mentionOptions(deps, kind, String(session.sessionId)),
        onSelect: (option, session) => { applyMention(deps, kind, String(session.sessionId), option) },
      },
    })
  const disposers = [
    picker('file', 'mention-file', t('mention.fileDescription')),
    picker('dir', 'mention-folder', t('mention.folderDescription')),
  ]
  return () => { for (const dispose of disposers.reverse()) dispose() }
}

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
  const browse = createBrowse()
  const panel = createPanel()
  const preview = createPreview()
  // The skin layer owns its theme-service override through effects, so the
  // stock palette returns exactly when this plugin unloads.
  const skinLayer = new SkinLayer(ctx)
  const skin = {
    get available() { return skinLayer.available },
    get current() { return skinLayer.getSkin().id },
    get dark() { return skinLayer.isDark() },
    get background() { return skinLayer.getBackground() },
    setBackground: (dataUrl: string): void => { skinLayer.setBackground(dataUrl) },
    apply: (id: string): string => { skinLayer.setSkin(id); return skinLayer.getSkin().id },
    subscribe: (listener: (dark: boolean) => void): (() => void) => skinLayer.onChange(ctx, listener),
  }

  // Uninjected on purpose: ui-model-selection is optional, and its absence
  // must not keep this plugin's entry from starting.
  const modelRoute = createModelRoute({
    directories: () => ctx.get('modelDirectories' as never) as never,
  })

  ctx.effect(() => {
    const disposers: Array<() => void> = []

    void ctx.remote.$mount(webEnhancedRemote).then(
      (disposeMount) => {
        disposers.push(disposeMount)
        // Uninjected read of the namespace service mounted on the gateway fiber.
        const mounted = ctx.get('remote.webEnhanced' as never, false) as unknown as RawWebEnhancedNamespace | undefined
        if (mounted === undefined) {
          console.error('[web-enhanced] remote.webEnhanced unavailable after $mount')
          return
        }
        // Mounted methods resolve to the RemoteResult envelope, not to the
        // host payload; the facade opens it so components see one union.
        const remote = createRemoteFacade(mounted)

        const face = (): WebEnhancedInject => ({
          remote,
          modelRoute,
          appendMention: (sessionId, text) => { appendMentionTo(ctx, sessionId, text) },
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
          hooks: {
            overlay: overlay.cell,
            browse: browse.cell,
            panel: panel.cell,
            preview: preview.cell,
          },
          skin,
          ...overlay.actions,
          ...browse.actions,
          ...panel.actions,
          ...preview.actions,
        })

        disposers.push(
          ctx.slots.inject('shell.overlay', () => ctx.slots.register({
            name: 'shell.overlay',
            id: 'web-enhanced-browse-overlay',
            order: 30,
            locale: NS,
            inject: face,
          }, BrowseOverlay)),
          ctx.slots.inject('conversation.view', () => ctx.slots.register({
            name: 'conversation.view',
            id: 'web-enhanced-workspace',
            order: 30,
            locale: NS,
            // Thunked so the tab label follows a locale switch without
            // re-registering the view.
            label: () => ctx.locale.bind(NS)('view.workspace'),
            inject: face,
          }, WorkspaceView)),
          ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
            name: 'conversation.session.header.actions',
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
          // The settings shell projects this registration's id/order/label into
          // one nav row and renders only the selected section. `label` is
          // thunked so a locale switch retitles the row through the ledger tick
          // rather than needing a re-registration.
          ctx.slots.inject('settings.section', () => ctx.slots.register({
            name: 'settings.section',
            id: 'web-enhanced',
            order: 60,
            locale: NS,
            label: () => ctx.locale.bind(NS)('settings.nav'),
            inject: face,
          }, SettingsSection)),
          registerMentionCommands(ctx, remote, browse.actions.openBrowse),
        )
      },
      (error: unknown) => { console.error('[web-enhanced] remote mount failed:', error) },
    )

    return () => {
      for (const dispose of disposers.reverse()) dispose()
    }
  }, 'web-enhanced: remote mount + registrations')
}

export { createBrowse, createOverlay, createPanel, createPreview } from './stores.ts'
export type { WebEnhancedInject, WebEnhancedInjected } from './contract.ts'
export { workspaceOfSession } from './workspace.ts'
