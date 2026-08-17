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
import { memo, useEffect, useState } from 'react';
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives';
import { pastedTextHitOfDraft } from "./apply.js";
import { pastedTextPreview } from "./store.js";
import css from './PastedTextUserNodeView.module.css';
/** Image block with an async loader, rendered as a small thumbnail. */
function TranscriptImage({ attachment, loadImage }) {
    const [src, setSrc] = useState(null);
    useEffect(() => {
        let live = true;
        void loadImage(attachment).then(next => { if (live)
            setSrc(next); });
        return () => { live = false; };
    }, [attachment, loadImage]);
    if (src === null)
        return null;
    // Anchor the loaded source so the image stays clickable/openable exactly
    // like the host gallery, without re-importing the host's private renderer.
    return (_jsx("a", { className: css.imageLink, href: src, target: "_blank", rel: "noreferrer", children: _jsx("img", { className: css.image, src: src, alt: "" }) }));
}
/** Small copy action replacing the host MessageIconActions copy button. */
function CopyButton({ text, t }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        if (text === '')
            return;
        void navigator.clipboard?.writeText(text).then(() => {
            setCopied(true);
            window.setTimeout(() => { setCopied(false); }, 1500);
        });
    };
    return (_jsx("button", { type: "button", className: css.copy, title: t('pastedText.copy'), onClick: copy, children: copied ? t('pastedText.copied') : t('pastedText.copy') }));
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
/** Text/block projection shared by the two transcript presentations. */
function contentOf(content) {
    let text = '';
    const blocks = [];
    for (const raw of content) {
        const block = raw;
        if (block.type === 'text' && typeof block.text === 'string')
            text += block.text;
        else
            blocks.push(raw);
    }
    return { text, blocks };
}
/** Plain fallback bubble for user messages that contain no pasted-text span. */
function PlainUserBubble({ content, loadImage, t }) {
    const { text, blocks } = contentOf(content);
    return (_jsxs("div", { className: css.userRow, "data-time-hover-root": true, children: [_jsxs("div", { className: css.userStack, children: [blocks.map((block, index) => {
                        const face = block;
                        return face.type === 'image'
                            ? _jsx(TranscriptImage, { attachment: face.attachment, loadImage: loadImage }, index)
                            : _jsx("pre", { className: css.extraBlock, children: JSON.stringify(block, null, 2) }, index);
                    }), text !== '' && _jsx("div", { className: css.bubble, children: text })] }), _jsx(CopyButton, { text: text, t: t })] }));
}
/** The user-node renderer registered at priority -1. */
export const PastedTextUserNodeView = memo(function PastedTextUserNodeView({ node, loadImage, store, t, }) {
    const content = node.data.content;
    const { text, blocks } = contentOf(content);
    const hit = pastedTextHitOfDraft(store, text);
    if (hit === undefined) {
        return _jsx(PlainUserBubble, { content: content, loadImage: loadImage, t: t });
    }
    return (_jsxs("div", { className: css.userRow, "data-time-hover-root": true, children: [_jsxs("div", { className: css.userStack, children: [blocks.map((block, index) => {
                        const face = block;
                        return face.type === 'image'
                            ? _jsx(TranscriptImage, { attachment: face.attachment, loadImage: loadImage }, index)
                            : _jsx("pre", { className: css.extraBlock, children: JSON.stringify(block, null, 2) }, index);
                    }), text !== '' && (_jsxs("div", { className: css.bubble, children: [hit.start > 0 ? _jsx("span", { children: text.slice(0, hit.start) }) : null, _jsx(PastedTextChip, { hit: hit, store: store, t: t }), hit.end < text.length ? _jsx("span", { children: text.slice(hit.end) }) : null] }))] }), _jsx(CopyButton, { text: text, t: t })] }));
});
