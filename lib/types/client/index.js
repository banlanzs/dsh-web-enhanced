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
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-web-react';
import { webEnhancedRemote } from "./remote.js";
import { en, zh } from "./locales.js";
import { createRemoteFacade } from "./facade.js";
import { createModelRoute } from "./model-route.js";
import { applyMention, mentionOptions } from "./mention.js";
import { workspaceOfSessionId } from "./workspace.js";
import { createBrowse, createCell, createOverlay, createPanel, createPreview } from "./stores.js";
import { applyCompletionNotify, COMPLETION_NOTIFY_SETTINGS_KEY, DEFAULT_COMPLETION_NOTIFY_SETTINGS, reviveCompletionNotifySettings, } from "./notify/completion-notify.js";
import { SkinLayer } from "./skins/skin-layer.js";
import { applyNavbar } from "./navbar/index.js";
import { ModelPicker } from "./model-picker/ModelPicker.js";
import { BrowseOverlay } from "./browse/BrowseOverlay.js";
import { BranchStrip } from "./git/BranchStrip.js";
import { WorkspaceView } from "./panel/WorkspaceView.js";
import { SettingsSection } from "./settings/SettingsSection.js";
import { ModelCapabilitiesSection } from "./model-capabilities/ModelCapabilities.js";
import { CapabilitiesStore, refreshIfLoaded } from "./model-capabilities/store.js";
import { PastedTextDock } from "./pasted-text/PastedTextDock.js";
import { PastedTextUserNodeView } from "./pasted-text/PastedTextUserNodeView.js";
import { CollapsedToolCalls } from "./tool-calls/CollapsedToolCalls.js";
import { applyPastedText, removePastedText } from "./pasted-text/apply.js";
import { PastedTextStore } from "./pasted-text/store.js";
import { BalanceLine } from "./balance/BalanceLine.js";
/** Locale namespace owned by this plugin. */
const NS = 'webEnhanced';
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
function appendMentionTo(ctx, sessionId, text) {
    const conversation = ctx.get('conversation');
    // Same declaration-merge collision as `openSession`: this package's program
    // carries both the Web runtime's SessionRuntime (which has `scope`) and the
    // host's SessionStore (which does not), and the node one wins the lookup —
    // so the scope face is named explicitly rather than casting the whole
    // service away.
    const scopes = ctx.sessions;
    const actx = scopes.scope(sessionId);
    if (conversation === undefined || actx === undefined)
        return;
    const input = conversation.input.for(actx);
    const draft = input.state.getSnapshot().draft;
    // A separator only where one is missing: appending to an empty draft or to
    // text that already ends in whitespace must not add a stray space.
    input.setDraft(draft === '' || /\s$/u.test(draft) ? draft + text : `${draft} ${text}`);
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
function registerMentionCommands(ctx, remote, openBrowse) {
    const commandUi = ctx.get('commandUi');
    if (commandUi === undefined)
        return () => { };
    const t = ctx.locale.bind(NS);
    const deps = {
        remote,
        workspaceOf: (sessionId) => {
            const workspace = workspaceOfSessionId(sessionId, ctx.workspaces.list.getSnapshot());
            return workspace === undefined
                ? undefined
                : { workspaceId: String(workspace.workspaceId), path: workspace.path };
        },
        appendDraft: (sessionId, text) => { appendMentionTo(ctx, sessionId, text); },
        openBrowse,
        browseLabel: () => t('mention.browse'),
    };
    const picker = (kind, name, description) => commandUi.register({
        name,
        description,
        // Always available: a session with no project still gets the browse row,
        // because nothing about an ungrouped session forbids naming a path.
        available: () => true,
        ui: {
            kind: 'popupSelect',
            options: session => mentionOptions(deps, kind, String(session.sessionId)),
            onSelect: (option, session) => { applyMention(deps, kind, String(session.sessionId), option); },
        },
    });
    const disposers = [
        picker('file', 'mention-file', t('mention.fileDescription')),
        picker('dir', 'mention-folder', t('mention.folderDescription')),
    ];
    return () => { for (const dispose of disposers.reverse())
        dispose(); };
}
/**
 * Services this client plugin requires.
 *
 * Deliberately no `remote.webEnhanced`: that namespace is mounted by this
 * plugin's own apply through `ctx.remote.$mount`, so declaring it here would
 * deadlock the entry waiting for a service only its own apply can create.
 */
export const inject = ['slots', 'locale', 'connection', 'remote', 'sessions', 'workspaces'];
/**
 * Mount the web-enhanced registrations.
 *
 * Registrations start only after the remote mount settles: the namespace
 * service lives on the api-gateway fiber, never on this plugin's inject
 * chain, so it is read through the untyped store accessor — a direct
 * `ctx.remote.webEnhanced` access would trip Cordis' inject check.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'web-enhanced: dictionaries');
    // Completion alerts: a chime and/or OS popup when a watched session's
    // running bit flips true → false. Preferences are browser-local; the
    // settings face travels with the Web Enhanced section below.
    const notifications = applyCompletionNotify(ctx, createCell(DEFAULT_COMPLETION_NOTIFY_SETTINGS, {
        key: COMPLETION_NOTIFY_SETTINGS_KEY,
        revive: reviveCompletionNotifySettings,
    }), ctx.locale.bind(NS));
    // The Model Capabilities page joins the same three wire facts as the host
    // Models page but edits only what that page leaves out: input modalities
    // and reasoning efforts. It is a separate settings section on purpose —
    // the settings shell projects raw ledger rows, so shadowing the host
    // 'models' cell would draw a duplicate nav row instead of replacing it.
    const connection = ctx.get('connection');
    const capabilities = new CapabilitiesStore(connection.api);
    const useCapabilities = bindSnapshotSelector(capabilities.store);
    const capabilitiesInjected = () => ({
        controller: capabilities,
        useSnapshot: useCapabilities,
        api: connection.api,
    });
    ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'model-capabilities',
        order: 11,
        locale: NS,
        label: () => ctx.locale.bind(NS)('modelCapabilities.nav'),
        inject: capabilitiesInjected,
    }, ModelCapabilitiesSection));
    ctx.effect(() => {
        const refresh = () => { refreshIfLoaded(capabilities); };
        const disposers = [
            ctx.remote.$on('settings/document-updated', refresh),
            ctx.remote.$on('llm/adapters-updated', refresh),
            ctx.on('connection/reset', refresh),
        ];
        return () => { for (const dispose of disposers)
            dispose(); };
    }, 'web-enhanced: model capabilities invalidations');
    // Long plain-text pastes become reference chips ("已粘贴文本") inside the
    // composer, editable through a dock row above the card.
    const pastedText = new PastedTextStore();
    ctx.effect(() => applyPastedText(ctx, pastedText, () => ctx.locale.bind(NS)('pastedText.label')), 'web-enhanced: pasted text');
    ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
        name: 'conversation.input.dock',
        id: 'web-enhanced-pasted-text',
        order: 10,
        locale: NS,
        inject: (sessionId) => ({
            store: pastedText,
            remove: (span) => { removePastedText(ctx, String(sessionId), span); },
        }),
    }, PastedTextDock));
    // Transcript side: the host stores the SERIALIZED full text in the sent
    // user message, so shadow the host `user` chat renderer at a lower priority
    // and keep stored pasted-text spans collapsed as chips in the record too.
    ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
        name: 'conversation.chat.node',
        key: 'user',
        priority: -1,
        locale: NS,
        inject: () => ({ store: pastedText }),
    }, PastedTextUserNodeView));
    // Tool-call side: one disclosure row per agent step. While the step runs it
    // stays expanded through the host's own keyed atomic tool views; when every
    // call settles it auto-collapses to `工具调用 · N 次`.
    ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
        name: 'conversation.chat.node',
        key: 'tool-call',
        priority: -1,
        locale: NS,
        children: { 'tool.call.toolview': { kind: 'keyed', scope: 'session' } },
    }, CollapsedToolCalls));
    const overlay = createOverlay();
    const browse = createBrowse();
    const panel = createPanel();
    const preview = createPreview();
    // The conversation node navbar: DOM-anchored, fully retracted on unload.
    ctx.effect(() => applyNavbar(ctx), 'web-enhanced: navbar');
    // Shadow the host composer model seat at a lower priority with the wider,
    // provider-collapsed picker. Reuses the host's per-session directory, so
    // /model and this seat still share one selection fact.
    ctx.effect(() => {
        const directories = () => ctx.get('modelDirectories');
        const sessions = ctx.sessions;
        return ctx.slots.inject('conversation.input.model', () => ctx.slots.register({
            name: 'conversation.input.model',
            locale: NS,
            priority: -1,
            inject: (sessionId) => {
                const directory = directories()?.directoryFor(sessionId);
                const available = sessions.subagentAddress(sessionId) === undefined;
                return {
                    available,
                    directory: directory?.store ?? null,
                    load: () => {
                        if (available && directory !== undefined)
                            directory.load().catch(() => { });
                    },
                    select: async (selection) => {
                        if (!available || directory === undefined)
                            return false;
                        try {
                            await directory.select(selection);
                            return true;
                        }
                        catch {
                            return false;
                        }
                    },
                };
            },
        }, ModelPicker));
    }, 'web-enhanced: model picker');
    // The skin layer owns its theme-service override through effects, so the
    // stock palette returns exactly when this plugin unloads.
    const skinLayer = new SkinLayer(ctx);
    const skin = {
        get available() { return skinLayer.available; },
        get current() { return skinLayer.getSkin().id; },
        get dark() { return skinLayer.isDark(); },
        get background() { return skinLayer.getBackground(); },
        setBackground: (dataUrl) => { skinLayer.setBackground(dataUrl); },
        apply: (id) => { skinLayer.setSkin(id); return skinLayer.getSkin().id; },
        subscribe: (listener) => skinLayer.onChange(ctx, listener),
    };
    // Uninjected on purpose: ui-model-selection is optional, and its absence
    // must not keep this plugin's entry from starting.
    const modelRoute = createModelRoute({
        directories: () => ctx.get('modelDirectories'),
    });
    ctx.effect(() => {
        const disposers = [];
        void ctx.remote.$mount(webEnhancedRemote).then((disposeMount) => {
            disposers.push(disposeMount);
            // Uninjected read of the namespace service mounted on the gateway fiber.
            const mounted = ctx.get('remote.webEnhanced', false);
            if (mounted === undefined) {
                console.error('[web-enhanced] remote.webEnhanced unavailable after $mount');
                return;
            }
            // Mounted methods resolve to the RemoteResult envelope, not to the
            // host payload; the facade opens it so components see one union.
            const remote = createRemoteFacade(mounted);
            const face = () => ({
                remote,
                modelRoute,
                appendMention: (sessionId, text) => { appendMentionTo(ctx, sessionId, text); },
                openSession: (sessionId) => {
                    // `Context.sessions` carries two declaration merges in this
                    // package's program: the Web runtime's SessionsService (which has
                    // `open`) and, pulled in by the node half's payload types, the
                    // host's SessionStore (which does not). The node one wins the
                    // lookup here, so the navigation face is named explicitly rather
                    // than casting the whole service away. The id itself is an opaque
                    // brand over the string the host minted and task records carry it
                    // as a plain wire field, hence the second narrowing.
                    const navigation = ctx.sessions;
                    navigation.open(sessionId);
                },
                hooks: {
                    overlay: overlay.cell,
                    browse: browse.cell,
                    panel: panel.cell,
                    preview: preview.cell,
                },
                skin,
                notifications,
                ...overlay.actions,
                ...browse.actions,
                ...panel.actions,
                ...preview.actions,
            });
            disposers.push(ctx.slots.inject('shell.overlay', () => ctx.slots.register({
                name: 'shell.overlay',
                id: 'web-enhanced-browse-overlay',
                order: 30,
                locale: NS,
                inject: face,
            }, BrowseOverlay)), ctx.slots.inject('conversation.view', () => ctx.slots.register({
                name: 'conversation.view',
                id: 'web-enhanced-workspace',
                order: 30,
                locale: NS,
                // Thunked so the tab label follows a locale switch without
                // re-registering the view.
                label: () => ctx.locale.bind(NS)('view.workspace'),
                inject: face,
            }, WorkspaceView)), ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
                name: 'conversation.session.header.actions',
                id: 'web-enhanced-branch',
                order: 10,
                locale: NS,
                inject: face,
            }, BranchStrip)), ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
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
            }, SettingsSection)), registerMentionCommands(ctx, remote, browse.actions.openBrowse));
        }, (error) => { console.error('[web-enhanced] remote mount failed:', error); });
        return () => {
            for (const dispose of disposers.reverse())
                dispose();
        };
    }, 'web-enhanced: remote mount + registrations');
}
export { createBrowse, createOverlay, createPanel, createPreview } from "./stores.js";
export { workspaceOfSession } from "./workspace.js";
