import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Transcript renderer for sent user messages that originated from a
 * pasted-text chip.
 *
 * The composer keeps the long text behind a chip, but the HOST stores the
 * serialized full text in the sent user message, so the transcript would
 * re-expand it. This renderer shadows the host `conversation.chat.node`
 * entry for the `user` kind at a lower priority: a message whose text
 * contains a stored pasted-text entry renders that span as a collapsed
 * `已粘贴文本` chip (click to preview/edit), while every other user message
 * falls back to a plain right-aligned bubble with the same host anchors the
 * navbar reads (`data-time-hover-root` + a bubble class).
 * @module dsh-web-enhanced/src/client/pasted-text/PastedTextUserNodeView
 */
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Button, IconCheckOutline16, IconCopyOutline16, Modal, Tooltip, writeClipboard, } from '@deepseek-ai/dsh-client-ui-primitives';
import { pastedTextHitOfDraft } from "./apply.js";
import { pastedTextPreview } from "./store.js";
import css from './PastedTextUserNodeView.module.css';
/** Host-style copy action: outline icon with the same success-check swap. */
function CopyButton({ text, t }) {
    const [copied, setCopied] = useState(false);
    const pending = useRef(false);
    const timer = useRef(null);
    const epoch = useRef(0);
    useEffect(() => () => {
        epoch.current += 1;
        pending.current = false;
        if (timer.current !== null)
            clearTimeout(timer.current);
    }, []);
    const onCopy = useCallback(() => {
        if (copied || pending.current)
            return;
        const current = epoch.current;
        pending.current = true;
        void writeClipboard(text).then((ok) => {
            if (current !== epoch.current)
                return;
            pending.current = false;
            if (!ok)
                return;
            setCopied(true);
            timer.current = window.setTimeout(() => {
                timer.current = null;
                setCopied(false);
            }, 1000);
        });
    }, [copied, text]);
    return (_jsx(Tooltip, { label: copied ? t('pastedText.copied') : t('pastedText.copy'), side: "bottom", children: _jsx("button", { type: "button", className: css.copyAction, "aria-label": copied ? t('pastedText.copied') : t('pastedText.copy'), onClick: onCopy, children: copied ? _jsx(IconCheckOutline16, {}) : _jsx(IconCopyOutline16, {}) }) }));
}
/** One collapsed pasted-text chip in the transcript, with a preview/edit modal. */
function PastedTextChip({ hit, store, t }) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState('');
    const [, setTick] = useState(0);
    const openEditor = () => {
        setDraft(store.get(hit.entry.id)?.text ?? hit.entry.text);
        setOpen(true);
    };
    const save = () => {
        if (draft.trim() !== '')
            store.set(hit.entry.id, draft);
        setTick(current => current + 1);
        setOpen(false);
    };
    return (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: css.transcriptChip, title: t('pastedText.chipHint'), onClick: openEditor, children: [_jsx("span", { className: css.icon, "aria-hidden": "true", children: "\uD83D\uDCC4" }), _jsx("span", { className: css.label, children: t('pastedText.label') }), _jsx("span", { className: css.preview, children: pastedTextPreview(store.get(hit.entry.id)?.text ?? hit.entry.text) })] }), _jsx(Modal, { open: open, onClose: () => { setOpen(false); }, title: t('pastedText.title'), closeLabel: t('pastedText.close'), description: t('pastedText.description'), className: css.dialog, contentClassName: css.dialogContent, footer: (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: () => { setOpen(false); }, children: t('pastedText.cancel') }), _jsx(Button, { onClick: save, disabled: draft.trim() === '', children: t('pastedText.save') })] })), children: _jsx("textarea", { className: css.editor, value: draft, "aria-label": t('pastedText.title'), spellCheck: false, onChange: event => { setDraft(event.target.value); } }) })] }));
}
/** Text/image/other projection shared by the two transcript presentations. */
function contentParts(content) {
    let text = '';
    const images = [];
    const rest = [];
    for (const raw of content) {
        const block = raw;
        if (block.type === 'text' && typeof block.text === 'string')
            text += block.text;
        else if (block.type === 'image' && block.attachment !== undefined)
            images.push({ attachment: block.attachment });
        else
            rest.push(raw);
    }
    return { text, images, rest };
}
/** Plain fallback bubble for user messages that contain no pasted-text span. */
function PlainUserBubble({ content, renderMessageImages, t }) {
    const { text, images, rest } = contentParts(content);
    return (_jsxs("div", { className: css.userRow, "data-time-hover-root": true, children: [_jsxs("div", { className: css.userStack, children: [renderMessageImages({ images: images, align: 'end' }), text !== '' && _jsx("div", { className: css.bubble, children: text }), rest.map((block, index) => _jsx("pre", { className: css.extraBlock, children: JSON.stringify(block, null, 2) }, index))] }), _jsx(CopyButton, { text: text, t: t })] }));
}
/** The user-node renderer registered at priority -1. */
export const PastedTextUserNodeView = memo(function PastedTextUserNodeView({ node, renderMessageImages, store, t, }) {
    const content = node.data.content;
    const { text, images, rest } = contentParts(content);
    const hit = pastedTextHitOfDraft(store, text);
    if (hit === undefined) {
        return _jsx(PlainUserBubble, { content: content, renderMessageImages: renderMessageImages, t: t });
    }
    return (_jsxs("div", { className: css.userRow, "data-time-hover-root": true, children: [_jsxs("div", { className: css.userStack, children: [renderMessageImages({ images: images, align: 'end' }), text !== '' && (_jsxs("div", { className: css.bubble, children: [hit.start > 0 ? _jsx("span", { children: text.slice(0, hit.start) }) : null, _jsx(PastedTextChip, { hit: hit, store: store, t: t }), hit.end < text.length ? _jsx("span", { children: text.slice(hit.end) }) : null] })), rest.map((block, index) => _jsx("pre", { className: css.extraBlock, children: JSON.stringify(block, null, 2) }, index))] }), _jsx(CopyButton, { text: text, t: t })] }));
});
