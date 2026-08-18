/**
 * Tool-call group collapse — DOM layer.
 *
 * The host renders one flow row per ROOT tool invocation and one `assistant-step`
 * (Think) row per model step. A long turn therefore alternates Think/Bash rows
 * for a screenful. This module groups every RUN of adjacent Think/tool rows
 * behind one disclosure header and hides the run once the turn is over, keeping
 * every assistant step that carries answer content visible — the user-facing
 * reply may sit in the middle of a run, not only at its tail.
 *
 * Why DOM and not a slot: reaching the same UX from `conversation.chat.node`
 * would mean shadowing the host `tool-call` entry and re-dispatching each root
 * through `tool.call.toolview` — but that child slot is declared by the host's
 * OWN entry, `SlotCore.register` pins a child slot to a single declaration, and
 * `renderSlot` only honours the calling entry's children table. A shadow wins
 * the render, never the declaration, so re-declaring it fails the plugin boot.
 * Wrapping from the outside keeps every host tool view (Bash argv, Edit diff,
 * Read preview) exactly as the host draws it.
 *
 * Running vs finished is read from POSITION, not from the host's tool-view
 * internals: only the run that sits at the very END of the flow can still be
 * live. As soon as anything else follows it — an assistant message, the turn
 * tail — that step is over and its run auto-collapses. Nothing here depends on
 * the markup inside a host tool row.
 * @module dsh-web-enhanced/src/client/tool-calls/apply
 */
const STYLE_ID = 'dsh-web-enhanced-tool-calls-style';
/** Marks one inserted group header. */
const HEADER = 'data-we-tool-group';
/** Marks a host flow item this module hides. */
const HIDDEN = 'data-we-tool-hidden';
/** Carries the header's collapse-state key across renders. */
const STATE = 'data-we-tool-state';
/** Present on an expanded header. */
const EXPANDED = 'data-we-tool-expanded';
/** Shortest run worth a header: collapsing must actually save rows. */
const MIN_HIDDEN = 2;
/** A host flow item, i.e. one rendered chat node (not an inserted header). */
function isFlowItem(el) {
    return el.hasAttribute('data-chat-flow-key');
}
/** Flow-item kinds that make up one agent execution process. */
const ACTIVITY_KINDS = new Set(['tool-call', 'assistant-step']);
/**
 * Whether an assistant-step row carries plain answer content (markdown text,
 * images, …) in addition to or instead of Think blocks.
 *
 * The host renders one `assistant-step` per model step; its `blocks` may
 * mix `reasoning` (→ ReasoningRow, `data-variant="think"`) and `text`
 * (→ MarkdownText). Tool-call blocks are rendered in separate flow rows, so
 * an assistant-step row only ever contains Think/answer blocks. A row whose
 * visible content is all inside `[data-variant="think"]` is pure reasoning
 * and may fold; a row with anything else carries the user-facing answer and
 * must stay visible.
 */
function hasAnswerContent(el) {
    // No Think blocks at all → whatever renders (or nothing at all) is not
    // pure reasoning; keep the row visible to avoid hiding a potential answer
    // or an empty placeholder the host may still be streaming into.
    if (el.querySelector('[data-variant="think"]') === null)
        return true;
    return hasContentOutsideThink(el);
}
/**
 * Recursively inspect a subtree for visible content that is NOT inside a
 * Think disclosure (`[data-variant="think"]`). Non-whitespace text or an
 * image counts as answer content; a Think subtree is skipped wholesale.
 */
function hasContentOutsideThink(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        return (node.textContent ?? '').trim() !== '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE)
        return false;
    const el = node;
    if (el.getAttribute('data-variant') === 'think')
        return false;
    if (el.tagName === 'IMG')
        return true;
    for (const child of el.childNodes) {
        if (hasContentOutsideThink(child))
            return true;
    }
    return false;
}
/** Runs of adjacent Think/tool-call flow items, in flow order. */
export function activityRuns(items) {
    const runs = [];
    let run = [];
    for (const el of items) {
        const kind = el.getAttribute('data-chat-flow-kind');
        if (kind !== null && ACTIVITY_KINDS.has(kind)) {
            run.push(el);
            continue;
        }
        if (run.length > 0) {
            runs.push(run);
            run = [];
        }
    }
    if (run.length > 0)
        runs.push(run);
    return runs;
}
/**
 * Members of one run that a collapse hides.
 *
 * A run is the agent's execution process: alternating Think rows and tool
 * calls. Only the rows that are pure activity may fold. An `assistant-step`
 * row that carries answer content (markdown text, images) is the user-facing
 * reply even when it sits in the MIDDLE of the run — a model may talk between
 * tool calls — so folding it would hide part of the answer. Rows ending the
 * run are handled by the same rule: a trailing pure-Think step folds, a
 * trailing answer-carrying step stays.
 */
export function collapseTargets(run) {
    return run.filter((el) => {
        const kind = el.getAttribute('data-chat-flow-kind');
        if (kind === 'assistant-step')
            return !hasAnswerContent(el);
        if (kind === 'tool-call')
            return true;
        return false;
    });
}
/** Write an attribute only when it actually changes (keeps render idempotent). */
function setAttr(el, name, value) {
    if (value === null) {
        if (el.hasAttribute(name))
            el.removeAttribute(name);
        return;
    }
    if (el.getAttribute(name) !== value)
        el.setAttribute(name, value);
}
/**
 * Mount the tool-call group collapse for this page.
 * @param ctx - client root context (locale for the header, sessions for state scoping).
 * @returns the disposer removing every header, attribute, and observer.
 */
export function applyToolCallCollapse(ctx) {
    if (typeof document === 'undefined')
        return () => { };
    const body = document.body;
    if (body === null)
        return () => { };
    const t = ctx.locale.bind('webEnhanced');
    const sessions = ctx.sessions;
    if (document.getElementById(STYLE_ID) === null) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
[${HIDDEN}] { display: none !important; }
[${HEADER}] { display: flex; margin: 2px 0 6px; }
[${HEADER}] > button {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 10px 3px 6px; border-radius: 999px;
  border: 1px solid transparent; cursor: pointer;
  font: inherit; font-size: 12px; line-height: 1.5;
  color: var(--dsw-alias-text-secondary, rgba(128, 128, 140, .95));
  background: var(--dsw-alias-bg-secondary, rgba(128, 128, 140, .1));
  transition: background .18s ease, border-color .18s ease, color .18s ease;
}
[${HEADER}] > button:hover {
  color: var(--dsw-alias-text-primary, inherit);
  border-color: var(--dsw-alias-border-secondary, rgba(128, 128, 140, .3));
}
[${HEADER}] [data-we-tool-chevron] {
  flex: none; width: 14px; height: 14px;
  transition: transform .18s ease;
}
[${HEADER}][${EXPANDED}] [data-we-tool-chevron] { transform: rotate(90deg); }
[${HEADER}] [data-we-tool-count] { opacity: .75; }
`;
        document.head.appendChild(style);
    }
    /** Expanded overrides, keyed by session id + the run's leading node key. */
    const overrides = new Map();
    const flowOf = () => document.querySelector('[data-chat-flow=""]');
    const sessionKey = () => {
        const current = sessions.list.getSnapshot().current;
        return typeof current === 'string' ? current : '';
    };
    let scheduleRender = () => { };
    /** Build one header (listener attached once; later renders reuse the node). */
    const makeHeader = () => {
        const header = document.createElement('div');
        header.setAttribute(HEADER, '');
        const button = document.createElement('button');
        button.type = 'button';
        const chevron = document.createElement('span');
        chevron.setAttribute('data-we-tool-chevron', '');
        chevron.textContent = '›';
        const title = document.createElement('span');
        title.setAttribute('data-we-tool-title', '');
        const count = document.createElement('span');
        count.setAttribute('data-we-tool-count', '');
        button.append(chevron, title, count);
        header.appendChild(button);
        button.addEventListener('click', () => {
            const key = header.getAttribute(STATE);
            if (key === null || key === '')
                return;
            overrides.set(key, !header.hasAttribute(EXPANDED));
            scheduleRender();
        });
        return header;
    };
    const render = () => {
        const flow = flowOf();
        if (flow === null)
            return;
        const items = [...flow.children].filter(isFlowItem);
        const last = items.at(-1);
        const sid = sessionKey();
        const kept = new Set();
        for (const run of activityRuns(items)) {
            const lead = run[0];
            if (lead === undefined)
                continue;
            if (!run.some(el => el.getAttribute('data-chat-flow-kind') === 'tool-call'))
                continue;
            const targets = collapseTargets(run);
            if (targets.length < MIN_HIDDEN)
                continue;
            const nodeKey = lead.getAttribute('data-chat-flow-key') ?? '';
            if (nodeKey === '')
                continue;
            // Only the run closing the flow can still be running; anything after it
            // (a user message, the turn tail) means that turn already finished.
            const running = run.at(-1) === last;
            const stateKey = `${sid}|${nodeKey}`;
            const expanded = overrides.get(stateKey) ?? running;
            const previous = lead.previousElementSibling;
            const header = previous !== null && previous.hasAttribute(HEADER)
                ? previous
                : flow.insertBefore(makeHeader(), lead);
            kept.add(header);
            setAttr(header, STATE, stateKey);
            setAttr(header, EXPANDED, expanded ? '' : null);
            const button = header.firstElementChild;
            if (button !== null)
                setAttr(button, 'aria-expanded', String(expanded));
            const title = header.querySelector('[data-we-tool-title]');
            const label = t('toolCalls.groupTitle');
            if (title !== null && title.textContent !== label)
                title.textContent = label;
            const count = header.querySelector('[data-we-tool-count]');
            const summary = running
                ? t('toolCalls.groupCountRunning', { count: run.length })
                : t('toolCalls.groupCountSettled', { count: targets.length });
            if (count !== null && count.textContent !== summary)
                count.textContent = summary;
            const hidden = new Set(expanded ? [] : targets);
            for (const el of run)
                setAttr(el, HIDDEN, hidden.has(el) ? '' : null);
        }
        // Drop headers whose run is gone (virtualized away, or session switched).
        for (const stale of flow.querySelectorAll(`:scope > [${HEADER}]`)) {
            if (!kept.has(stale))
                stale.remove();
        }
    };
    let scheduled = false;
    scheduleRender = () => {
        if (scheduled)
            return;
        scheduled = true;
        requestAnimationFrame(() => { scheduled = false; render(); });
    };
    // Render is idempotent — a pass that changes nothing emits no mutations — so
    // the header this module inserts settles after one extra pass instead of
    // looping. Attributes are not observed, so the hide/expand writes are silent.
    const observer = new MutationObserver(() => { scheduleRender(); });
    observer.observe(body, { childList: true, subtree: true });
    render();
    return () => {
        observer.disconnect();
        const flow = flowOf();
        if (flow !== null) {
            for (const header of flow.querySelectorAll(`:scope > [${HEADER}]`))
                header.remove();
            for (const el of flow.querySelectorAll(`[${HIDDEN}]`))
                el.removeAttribute(HIDDEN);
        }
        document.getElementById(STYLE_ID)?.remove();
    };
}
