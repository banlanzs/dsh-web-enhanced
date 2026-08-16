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
import { createElement, useEffect, useRef, useState } from 'react';
import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives';
import { pinStore } from "./pin-store.js";
import { NAV_HALF_WINDOW, NAV_WINDOW, navWindow } from "./window.js";
/**
 * Mount the navbar for this page.
 * @param ctx - client root context (slots for the pin action).
 * @returns the disposer removing every node, listener, and observer.
 */
export function applyNavbar(ctx) {
    if (typeof document === 'undefined')
        return () => { };
    const body = document.body;
    if (body === null)
        return () => { };
    const STYLE_ID = 'dsh-web-enhanced-navbar-style';
    if (document.getElementById(STYLE_ID) === null) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
[data-dsh-we-navbar] {
  position: fixed; top: 50%; transform: translateY(-50%); z-index: 900;
  display: flex; flex-direction: column; gap: 10px; padding: 8px;
  border-radius: 12px; font-family: system-ui;
  max-height: calc(100vh - 32px); overflow-y: auto;
  scrollbar-width: none;
  background: transparent; border: 1px solid transparent;
  transition: background .18s ease, border-color .18s ease;
}
[data-dsh-we-navbar]::-webkit-scrollbar { display: none; }
[data-we-nav-dot] {
  width: 7px; height: 7px; border-radius: 999px; padding: 0; border: none;
  background: rgba(128, 128, 140, .45); cursor: pointer; flex: none; position: relative;
  transition: background .22s ease, transform .22s ease;
}
/* Hit area: the visual pill stays 7px; ::after widens it to a 13px target. */
[data-we-nav-dot]::after {
  content: ''; position: absolute; inset: -3px; border-radius: 999px;
}
[data-we-nav-dot]:hover { }
[data-we-nav-dot].active, [data-we-nav-dot].hover, [data-we-nav-dot].pinned {
  transition: width .22s ease, height .22s ease, background .22s ease, transform .22s ease;
}
[data-we-nav-dot].active {
  width: 22px; border-radius: 999px;
  background: var(--dsw-alias-text-accent, #4c9aff);
}
[data-we-nav-dot].hover {
  width: 22px; border-radius: 999px; transform: none;
  background: rgba(128, 128, 140, .8);
}
[data-we-nav-dot].active.hover { background: var(--dsw-alias-text-accent, #4c9aff); }
[data-we-nav-preview] {
  position: fixed; z-index: 910; width: 244px; box-sizing: border-box;
  padding: 12px 16px; border-radius: 12px; font-size: 12px; line-height: 1.55;
  color: var(--dsw-alias-text-1, #eee);
  background: var(--dsw-hovercard-bg, #2C2C2E);
  box-shadow: var(--dsw-shadow-lv3);
  overflow: hidden; white-space: pre-wrap; word-break: break-word;
  display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical;
  pointer-events: none;
}
[data-we-nav-more] { width: 3px; height: 3px; border-radius: 999px; background: rgba(128,128,140,.5); flex: none; }
[data-we-nav-dot].pinned {
  width: 14px; height: 8px; border-radius: 999px; background: #f0b429;
}
[data-we-nav-dot].pinned.hover {
  width: 22px; height: 8px; background: #f0b429;
}
[data-we-nav-dot].active.pinned {
  width: 22px; height: 8px; border-radius: 999px;
  background: #f0b429; filter: none;
}
[data-we-nav-pin-button] {
  width: 28px; height: 28px; padding: 6px; border: none; border-radius: 28px;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--dsw-alias-label-tertiary); background: transparent; cursor: pointer;
  transition: background .18s ease, color .18s ease;
}
[data-we-nav-pin-button]:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-secondary); }
[data-we-nav-pin-button][data-active] { color: #f0b429; }
@media (prefers-reduced-motion: reduce) {
  [data-dsh-we-navbar], [data-we-nav-dot], [data-we-nav-dot].active {
    transition: none; animation: none;
  }
}
`;
        document.head.appendChild(style);
    }
    // ── nodes ────────────────────────────────────────────────────────────────
    const bar = document.createElement('nav');
    bar.setAttribute('data-dsh-we-navbar', '');
    bar.setAttribute('aria-label', '用户消息导航');
    body.appendChild(bar);
    const preview = document.createElement('div');
    preview.setAttribute('data-we-nav-preview', '');
    preview.style.display = 'none';
    body.appendChild(preview);
    // ── host anchors ─────────────────────────────────────────────────────────
    const flowOf = () => document.querySelector('[data-chat-flow=""]');
    const scrollerOf = () => {
        let node = flowOf()?.parentElement ?? null;
        while (node !== null) {
            const style = getComputedStyle(node);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll')
                return node;
            node = node.parentElement;
        }
        return null;
    };
    /** All message rows, excluding pending steering. */
    const allRows = () => [...document.querySelectorAll('[data-time-hover-root]')]
        .filter(row => !row.hasAttribute('data-pending-steering'));
    /**
     * User rows: a message row with a bubble that is not a turn-tail row. The
     * tail check is what keeps host tooltips (whose class contains "bubble")
     * mounted inside tail rows from counting as user messages.
     */
    const userRows = () => allRows().filter(row => !row.hasAttribute('data-turn-tail')
        && row.querySelector('[class*="bubble"]') !== null);
    // ── positioning ──────────────────────────────────────────────────────────
    const position = () => {
        const flow = flowOf();
        if (flow === null)
            return;
        const right = flow.getBoundingClientRect().right;
        const next = Math.round(Math.min(right + 12, window.innerWidth - bar.offsetWidth - 8));
        const nextLeft = `${Math.max(8, next)}px`;
        if (bar.style.left !== nextLeft)
            bar.style.left = nextLeft;
    };
    let posScheduled = false;
    const requestPosition = () => {
        if (posScheduled)
            return;
        posScheduled = true;
        requestAnimationFrame(() => { posScheduled = false; position(); });
    };
    // ── active tracking ──────────────────────────────────────────────────────
    let activeIndex = -1;
    /** Active = the topmost user message inside the viewport (the reading head). */
    const computeActive = () => {
        const rows = userRows();
        if (rows.length === 0)
            return -1;
        let best = 0;
        let found = false;
        let bestTop = Number.POSITIVE_INFINITY;
        for (let i = 0; i < rows.length; i++) {
            const top = rows[i]?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
            if (top >= 0 && top < bestTop) {
                bestTop = top;
                best = i;
                found = true;
            }
        }
        return found ? best : rows.length - 1;
    };
    // ── pins (rows carry the projection; storage is the source of truth) ─────
    let currentSessionId = null;
    const syncSessionId = () => {
        const button = document.querySelector('[data-we-nav-pin-button][data-session-id]');
        if (button !== null)
            currentSessionId = button.getAttribute('data-session-id') ?? currentSessionId;
    };
    /** The pinned row inside user row i's turn, when that turn is curated. */
    const pinnedRowOf = (all, rows, i, turns) => {
        const row = rows[i];
        if (row === undefined)
            return null;
        const start = all.indexOf(row);
        if (start < 0)
            return null;
        const end = i + 1 < rows.length ? all.indexOf(rows[i + 1] ?? row) : all.length;
        if (end < 0)
            return null;
        for (let k = start; k < end; k++) {
            const row = all[k];
            if (row === undefined)
                continue;
            if (row.hasAttribute('data-we-nav-pinned')) {
                return { row, text: row.getAttribute('data-we-nav-pin-text') ?? '' };
            }
            const turn = Number(row.getAttribute('data-turn-tail') ?? NaN);
            if (Number.isFinite(turn) && currentSessionId !== null && turns.has(turn)) {
                const stored = pinStore.textOfTurn(currentSessionId, turn);
                return { row, text: stored ?? '' };
            }
        }
        return null;
    };
    // ── preview card ─────────────────────────────────────────────────────────
    const positionPreview = (anchor) => {
        const rect = anchor.getBoundingClientRect();
        preview.style.right = `${window.innerWidth - rect.left + 14}px`;
        preview.style.top = `${Math.min(window.innerHeight - 120, rect.top - 12)}px`;
    };
    const showPreview = (row, anchor, pinned) => {
        let text;
        if (pinned !== null) {
            text = pinned.text.trim();
            if (text === '') {
                text = ((row.querySelector('[class*="bubble"]') ?? row).textContent ?? '').trim();
            }
        }
        else {
            const bubble = row.querySelector('[class*="bubble"]');
            text = ((bubble ?? row).textContent ?? '').trim();
        }
        if (text === '')
            return;
        preview.textContent = text;
        preview.style.display = 'block';
        positionPreview(anchor);
    };
    const hidePreview = () => { preview.style.display = 'none'; };
    // ── rendering ────────────────────────────────────────────────────────────
    let lo = 0;
    let builtRows = [];
    const jumpToRow = (row) => {
        const scroller = scrollerOf();
        if (scroller === null)
            return;
        // The host's follow logic counts a programmatic scrollTop write as reader
        // input; the wheel dispatch stays as a baseline for the older origin rule.
        scroller.dispatchEvent(new WheelEvent('wheel', { deltaY: -1, bubbles: true, cancelable: true }));
        const target = scroller.scrollTop + row.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
        scroller.scrollTop = target;
    };
    const dotsOf = () => [...bar.querySelectorAll('[data-we-nav-dot]')];
    const updateActiveClass = (active) => {
        dotsOf().forEach((dot, i) => {
            if (i + lo === active)
                dot.classList.add('active');
            else
                dot.classList.remove('active');
        });
    };
    const render = () => {
        position();
        const rows = userRows();
        // Only on the chat surface, and only once there is something to navigate.
        if (flowOf() === null || rows.length < 2) {
            bar.style.display = 'none';
            return;
        }
        bar.style.display = 'flex';
        const active = computeActive();
        activeIndex = active;
        const all = allRows();
        syncSessionId();
        const pinnedTurns = currentSessionId !== null ? pinStore.turnsOf(currentSessionId) : new Set();
        const pinnedOf = (i) => pinnedRowOf(all, rows, i, pinnedTurns);
        const pinnedIndexes = [];
        for (let i = 0; i < rows.length; i++)
            if (pinnedOf(i) !== null)
                pinnedIndexes.push(i);
        const range = navWindow(rows.length, active, pinnedIndexes, NAV_WINDOW, NAV_HALF_WINDOW);
        lo = range.lo;
        const hi = range.hi;
        // Rebuild only when row identity or structure changed; scrolling moves
        // the active class alone.
        const expectedCount = hi - lo + 1 + (lo > 0 ? 1 : 0) + (hi < rows.length - 1 ? 1 : 0);
        const sameRows = rows.length === builtRows.length && rows.every((row, i) => row === builtRows[i]);
        if (sameRows && bar.childElementCount === expectedCount) {
            updateActiveClass(active);
            dotsOf().forEach((dot, i) => {
                const pinned = pinnedOf(i + lo);
                if (pinned !== null)
                    dot.classList.add('pinned');
                else
                    dot.classList.remove('pinned');
            });
            return;
        }
        bar.textContent = '';
        const appendMore = () => {
            const more = document.createElement('span');
            more.setAttribute('data-we-nav-more', '');
            bar.appendChild(more);
        };
        if (lo > 0)
            appendMore();
        for (let i = lo; i <= hi; i++) {
            const index = i;
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.setAttribute('data-we-nav-dot', '');
            const pinned = pinnedOf(index);
            dot.setAttribute('aria-label', `user #${index + 1}${pinned !== null ? '（已精选）' : ''}（点击跳转）`);
            const slot = index - lo;
            dot.addEventListener('focus', () => {
                const row = userRows()[lo + slot];
                if (row !== undefined)
                    showPreview(row, dot, pinnedOf(lo + slot));
            });
            dot.addEventListener('blur', hidePreview);
            dot.addEventListener('click', () => {
                const row = userRows()[lo + slot];
                if (row === undefined)
                    return;
                jumpToRow(pinnedOf(lo + slot)?.row ?? row);
            });
            if (index === active)
                dot.classList.add('active');
            if (pinned !== null)
                dot.classList.add('pinned');
            bar.appendChild(dot);
        }
        if (hi < rows.length - 1)
            appendMore();
        builtRows = rows;
    };
    // ── observers ────────────────────────────────────────────────────────────
    let flow = null;
    let sizeObserver = null;
    const bindFlow = () => {
        const next = flowOf();
        if (next === flow)
            return false;
        flow = next;
        sizeObserver?.disconnect();
        sizeObserver = null;
        if (flow !== null) {
            sizeObserver = new ResizeObserver(() => { requestPosition(); });
            // Observe the ancestor chain too: sidebar collapse animates grid tracks
            // whose movement never resizes the flow itself.
            let el = flow;
            while (el !== null && el !== body) {
                sizeObserver.observe(el);
                el = el.parentElement;
            }
        }
        position();
        return true;
    };
    bindFlow();
    window.addEventListener('resize', requestPosition);
    let scrollScheduled = false;
    const updateActive = () => {
        scrollScheduled = false;
        const next = computeActive();
        if (next === activeIndex)
            return;
        activeIndex = next;
        render();
    };
    const scheduleActive = () => {
        if (scrollScheduled)
            return;
        scrollScheduled = true;
        requestAnimationFrame(updateActive);
    };
    let intersection = null;
    const bindIntersection = () => {
        intersection?.disconnect();
        const root = scrollerOf();
        if (root === null)
            return;
        intersection = new IntersectionObserver(scheduleActive, {
            root,
            rootMargin: '0px 0px -15% 0px',
            threshold: [0, 0.25, 0.5, 0.75, 1],
        });
        for (const row of userRows())
            intersection.observe(row);
    };
    bindIntersection();
    render();
    let renderScheduled = false;
    const scheduleRender = () => {
        if (renderScheduled)
            return;
        renderScheduled = true;
        requestAnimationFrame(() => { renderScheduled = false; render(); });
    };
    const observer = new MutationObserver((mutations) => {
        if (bindFlow()) {
            bindIntersection();
            scheduleRender();
            return;
        }
        bindIntersection();
        for (const mutation of mutations) {
            if (mutation.target === bar || bar.contains(mutation.target))
                continue;
            if (mutation.target === preview || preview.contains(mutation.target))
                continue;
            if (flow !== null && (mutation.target === flow || flow.contains(mutation.target))) {
                scheduleRender();
                return;
            }
        }
    });
    observer.observe(body, { childList: true, subtree: true });
    // ── hover: nearest pill by pointer Y (no dead zones between pills) ───────
    const nearestDot = (y) => {
        const dots = dotsOf();
        if (dots.length === 0)
            return null;
        let best = null;
        let bestDist = Number.POSITIVE_INFINITY;
        for (const dot of dots) {
            const rect = dot.getBoundingClientRect();
            const distance = Math.abs(rect.top + rect.height / 2 - y);
            if (distance < bestDist) {
                bestDist = distance;
                best = dot;
            }
        }
        if (best === null)
            return null;
        const slot = dots.indexOf(best);
        const row = userRows()[lo + slot];
        if (row === undefined)
            return null;
        return { dot: best, row, slot };
    };
    const hoverableDot = (y) => {
        const dots = dotsOf();
        if (dots.length === 0)
            return null;
        const first = dots[0]?.getBoundingClientRect();
        const last = dots[dots.length - 1]?.getBoundingClientRect();
        if (first === undefined || last === undefined)
            return null;
        if (y < first.top - 1 || y > last.bottom + 1)
            return null;
        return nearestDot(y);
    };
    let hoverScheduled = false;
    let hoverRow = null;
    let hoverAnchor = null;
    let hoverDot = null;
    let lastHoverY = null;
    const setHoverDot = (dot) => {
        if (hoverDot === dot)
            return;
        hoverDot?.classList.remove('hover');
        hoverDot = dot;
        dot?.classList.add('hover');
    };
    const applyHover = (y) => {
        const hit = hoverableDot(y);
        setHoverDot(hit?.dot ?? null);
        if (hit === null) {
            hoverRow = null;
            hoverAnchor = null;
            hidePreview();
            return;
        }
        if (hoverRow === hit.row && hoverAnchor === hit.dot)
            return;
        hoverRow = hit.row;
        hoverAnchor = hit.dot;
        const turns = currentSessionId !== null ? pinStore.turnsOf(currentSessionId) : new Set();
        const pinned = pinnedRowOf(allRows(), userRows(), lo + hit.slot, turns);
        showPreview(hit.row, hit.dot, pinned);
    };
    const onBarMove = (event) => {
        lastHoverY = event.clientY;
        if (hoverScheduled)
            return;
        hoverScheduled = true;
        requestAnimationFrame(() => {
            hoverScheduled = false;
            if (lastHoverY !== null)
                applyHover(lastHoverY);
        });
    };
    const onBarLeave = () => {
        lastHoverY = null;
        setHoverDot(null);
        hoverRow = null;
        hoverAnchor = null;
        hidePreview();
    };
    bar.addEventListener('mousemove', onBarMove);
    bar.addEventListener('mouseleave', onBarLeave);
    // Whole-strip click: jump to the nearest pill (no precise aiming needed).
    bar.addEventListener('click', (event) => {
        const target = event.target;
        if (target !== null && target.closest('[data-we-nav-dot]') !== null)
            return;
        const hit = nearestDot(event.clientY);
        if (hit === null)
            return;
        const turns = currentSessionId !== null ? pinStore.turnsOf(currentSessionId) : new Set();
        const pinned = pinnedRowOf(allRows(), userRows(), lo + hit.slot, turns);
        if (pinned !== null)
            jumpToRow(pinned.row);
        else
            jumpToRow(hit.row);
    });
    // Wheel over the strip: one node per gesture (120ms throttle).
    let lastWheelAt = 0;
    bar.addEventListener('wheel', (event) => {
        event.preventDefault();
        const now = performance.now();
        if (now - lastWheelAt < 120)
            return;
        lastWheelAt = now;
        const rows = userRows();
        if (rows.length < 2)
            return;
        const base = activeIndex >= 0 ? activeIndex : computeActive();
        if (base < 0)
            return;
        const next = Math.min(rows.length - 1, Math.max(0, base + (event.deltaY > 0 ? 1 : -1)));
        const row = rows[next];
        if (next === base || row === undefined)
            return;
        jumpToRow(row);
    }, { passive: false });
    // ── pin action (assistant message toolbar) ───────────────────────────────
    /** Context text of a pin: the turn's user message, truncated. */
    const pinRowText = (button) => {
        let el = button?.closest('[data-time-hover-root]') ?? null;
        while (el !== null) {
            const bubble = el.querySelector('[class*="bubble"]');
            if (el.hasAttribute('data-time-hover-root') && bubble !== null) {
                const text = ((bubble ?? el).textContent ?? '').trim();
                return text.length > 160 ? `${text.slice(0, 160)}…` : text;
            }
            el = el.previousElementSibling;
        }
        return '';
    };
    /** Project pin state onto the row and wake the strip (attributes bypass MO). */
    const syncPinRow = (button, isPinned, text) => {
        const row = button?.closest('[data-time-hover-root]');
        if (!(row instanceof HTMLElement))
            return;
        if (isPinned) {
            row.setAttribute('data-we-nav-pinned', '');
            row.setAttribute('data-we-nav-pin-text', text ?? '');
        }
        else {
            row.removeAttribute('data-we-nav-pinned');
            row.removeAttribute('data-we-nav-pin-text');
        }
        scheduleRender();
    };
    function PinAction({ messageId, sessionId, t }) {
        const [active, setActive] = useState(() => (messageId !== undefined && pinStore.isPinned(sessionId, messageId)));
        const ref = useRef(null);
        useEffect(() => {
            if (messageId === undefined)
                return;
            syncPinRow(ref.current, pinStore.isPinned(sessionId, messageId), pinStore.textOf(sessionId, messageId));
        }, [messageId, sessionId]);
        const label = active ? t('navbar.unpin') : t('navbar.pin');
        const button = createElement('button', {
            type: 'button',
            ref,
            'data-we-nav-pin-button': '',
            'data-session-id': sessionId,
            'data-active': active || undefined,
            'aria-pressed': active,
            'aria-label': label,
            onClick: () => {
                if (messageId === undefined)
                    return;
                const text = pinRowText(ref.current);
                const row = ref.current?.closest('[data-time-hover-root]');
                const turn = Number(row?.getAttribute('data-turn-tail') ?? NaN);
                const next = pinStore.toggle(sessionId, messageId, text, Number.isFinite(turn) ? turn : undefined);
                setActive(next);
                syncPinRow(ref.current, next, text);
            },
        }, createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true }, createElement('path', { d: 'M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z' })));
        return createElement(Tooltip, { label, side: 'bottom', children: button });
    }
    const disposePin = ctx.effect(() => ctx.slots.inject('conversation.chat.assistant-actions', () => {
        const dispose = ctx.slots.register({
            name: 'conversation.chat.assistant-actions',
            id: 'web-enhanced-navbar-pin',
            order: 5,
            locale: 'webEnhanced',
            inject: (sessionId) => ({ sessionId }),
        }, PinAction);
        return () => { dispose(); };
    }), 'web-enhanced: navbar pin action');
    return () => {
        disposePin();
        observer.disconnect();
        sizeObserver?.disconnect();
        intersection?.disconnect();
        window.removeEventListener('resize', requestPosition);
        bar.remove();
        preview.remove();
        document.getElementById(STYLE_ID)?.remove();
    };
}
