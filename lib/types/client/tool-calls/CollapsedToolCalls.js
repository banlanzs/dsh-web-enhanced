import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Tool-call collapse renderer.
 *
 * The host renders one `tool-call` chat node per ROOT tool invocation and
 * nests subcalls below it. That is already collapsed per row, but a long run
 * still fills the transcript with dozens of rows. This renderer shadows the
 * host `tool-call` entry at a lower priority and groups every root Tool call
 * that belongs to one agent step into a single disclosure row:
 *
 * - while the step is running the group stays expanded, so live Bash/Read/…
 *   rows keep streaming exactly as the host renders them (each root is still
 *   dispatched through the host's own `tool.call.toolview` slot);
 * - when every call in the step settles, the group auto-collapses to one
 *   `工具调用 · N 次` line, and the user can expand it again at any time.
 *
 * A loaded page therefore shows completed history compacted, while a live run
 * never hides its progress.
 * @module dsh-web-enhanced/src/client/tool-calls/CollapsedToolCalls
 */
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { DisclosureRow, IconSparkle16 } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './CollapsedToolCalls.module.css';
/** Narrow a block to its settled result form (rc.6 RunningToolCall has no kind tag). */
export function isSettled(block) {
    return 'call' in block;
}
/** Wire tool name of either lifecycle form. */
export function nameOf(block) {
    return isSettled(block) ? block.call?.name ?? '' : block.name;
}
/** Count one call plus every nested subcall recursively. */
export function countCalls(block) {
    return 1 + block.subCalls.reduce((sum, child) => sum + countCalls(child), 0);
}
/** Flatten a settled result's text blocks into display text. */
export function resultText(block) {
    const parts = [];
    for (const item of block.content) {
        if (typeof item === 'object' && item !== null && 'type' in item && item.type === 'text' && typeof item.text === 'string') {
            parts.push(item.text);
        }
        else {
            try {
                parts.push(JSON.stringify(item, null, 2));
            }
            catch {
                parts.push(String(item));
            }
        }
    }
    if (parts.length === 0 && block.error !== undefined)
        parts.push(`${block.error.name}: ${block.error.code}`);
    return parts.join('\n');
}
/** First line of a potentially multi-line string. */
export function firstLine(text) {
    const end = text.indexOf('\n');
    return end === -1 ? text : text.slice(0, end);
}
/** Filter one step/turn key list down to tool-call seats, with self fallback. */
export function orderedToolKeys(nodeKey, keys, kindOf) {
    const toolKeys = keys.filter(key => kindOf(key) === 'tool-call');
    return toolKeys.length > 0 ? toolKeys : [nodeKey];
}
/** Step/turn keys one tool-call node belongs to, falling back to itself. */
export function keysOf(node, chat) {
    const location = node.location;
    if (location.kind === 'step') {
        const keys = chat.locations.getStep(location.turn.turn, location.step.step);
        if (keys.length > 0)
            return keys;
    }
    if (location.kind === 'turn') {
        const keys = chat.locations.getTurn(location.turn.turn);
        if (keys.length > 0)
            return keys;
    }
    return [node.key];
}
/** Minimal fallback for tool names the host composition does not own. */
function FallbackToolRow({ toolName, block, t }) {
    const [open, setOpen] = useState(false);
    const running = !isSettled(block);
    const body = running ? block.argsRaw : resultText(block);
    const summary = running ? t('toolCalls.running') : body === '' ? t('toolCalls.noOutput') : firstLine(body);
    const title = toolName === 'think' ? t('toolCalls.think') : toolName === '' ? t('toolCalls.unknown') : toolName;
    return (_jsx(DisclosureRow, { icon: _jsx(IconSparkle16, {}), title: title, open: open, expandable: body !== '', onToggle: () => { setOpen(value => !value); }, expandOnRowClick: true, collapsedContent: _jsx("span", { className: css.fallbackSummary, children: summary }), children: body === '' ? null : _jsx("pre", { className: css.fallbackBody, children: body }), className: css.fallbackRow }));
}
/** One root call rendered through the host's keyed atomic tool views. */
function HostToolBranch({ renderSlot, block, selectedCallId, cwd, openFile, inspectCall, t }) {
    const toolName = nameOf(block);
    const owner = useMemo(() => ({
        callId: block.callId,
        toolName,
        block,
        openFile,
        cwd,
        inspect: () => { inspectCall(block.callId); },
    }), [block, cwd, openFile, inspectCall, toolName]);
    return (_jsxs("div", { className: css.callRow, "data-chat-anchor-key": `call:${block.callId}`, "data-chat-call-id": block.callId, "data-selected": block.callId === selectedCallId || undefined, children: [renderSlot('tool.call.toolview', owner, {
                entryKey: toolName,
                fallback: _jsx(FallbackToolRow, { toolName: toolName, block: block, t: t }),
            }), block.subCalls.length > 0 && (_jsx("div", { className: css.subCalls, "data-subcalls": true, children: block.subCalls.map(child => (_jsx(HostToolBranch, { renderSlot: renderSlot, block: child, selectedCallId: selectedCallId, cwd: cwd, openFile: openFile, inspectCall: inspectCall, t: t }, child.callId))) }))] }));
}
/** The first tool-call node renders this group; sibling seats render null. */
export function ToolCallGroup({ blocks, renderSlot, selectedCallId, cwd, openFile, inspectCall, t }) {
    const count = blocks.reduce((sum, block) => sum + countCalls(block), 0);
    const settled = blocks.every(isSettled);
    const [expanded, setExpanded] = useState(() => !settled);
    const wasSettled = useRef(settled);
    useEffect(() => {
        if (settled && !wasSettled.current)
            setExpanded(false);
        wasSettled.current = settled;
    }, [settled]);
    const summary = settled
        ? t('toolCalls.groupCountSettled', { count })
        : t('toolCalls.groupCountRunning', { count });
    return (_jsx("div", { className: css.group, "data-state": settled ? 'ok' : 'running', children: _jsx(DisclosureRow, { icon: _jsx(IconSparkle16, {}), title: t('toolCalls.groupTitle'), open: expanded, expandable: true, onToggle: () => { setExpanded(value => !value); }, expandOnRowClick: true, previewChevron: true, keepContentWhenOpen: true, collapsedContent: _jsx("span", { className: css.groupSummary, children: summary }), children: expanded ? (_jsx("div", { className: css.calls, children: blocks.map(block => (_jsx(HostToolBranch, { renderSlot: renderSlot, block: block, selectedCallId: selectedCallId, cwd: cwd, openFile: openFile, inspectCall: inspectCall, t: t }, block.callId))) })) : null, className: css.disclosure, rowClassName: css.disclosureRow }) }));
}
/** The tool-call node renderer registered at priority -1. */
export const CollapsedToolCalls = memo(function CollapsedToolCalls({ node, selectedCallId, cwd, openFile, inspectCall, useSession, renderSlot, t, }) {
    const chat = useSession(snapshot => snapshot.chat);
    // The location index can retain hidden/replaced seats; group only the keys
    // the chat flow actually renders this window.
    const visible = keysOf(node, chat).filter(key => chat.order.includes(key));
    const ordered = orderedToolKeys(node.key, visible, key => chat.nodes.get(key)?.kind);
    if (ordered[0] !== node.key)
        return null;
    const blocks = ordered.map(key => {
        const candidate = chat.nodes.get(key);
        return candidate !== undefined && candidate.kind === 'tool-call'
            ? candidate.data.root
            : node.data.root;
    });
    return (_jsx(ToolCallGroup, { blocks: blocks, renderSlot: renderSlot, selectedCallId: selectedCallId, cwd: cwd, openFile: openFile, inspectCall: inspectCall, t: t }));
});
