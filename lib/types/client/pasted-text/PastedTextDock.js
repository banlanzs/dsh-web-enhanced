import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * The composer's pasted-text chips: one row above the input card, exactly
 * where the conversation dock sits. Each chip is a reference occurrence the
 * paste interceptor inserted; clicking opens a modal editor, removing drops
 * the occurrence (and therefore the U+FFFC placeholder) from the draft.
 * @module dsh-web-enhanced/src/client/pasted-text/PastedTextDock
 */
import { useState } from 'react';
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives';
import { pastedTextPreview, PASTED_TEXT_SOURCE } from "./store.js";
import css from './PastedTextDock.module.css';
/** The pasted-text chips; renders nothing while the draft holds none. */
export function PastedTextDock({ input, store, remove, t }) {
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState('');
    const [, setTick] = useState(0);
    const chips = (input?.occurrences ?? []).filter(occurrence => occurrence.source === PASTED_TEXT_SOURCE && occurrence.invalid !== true);
    if (chips.length === 0)
        return null;
    const openEditor = (occurrence) => {
        setDraft(store.get(occurrence.ref)?.text ?? '');
        setEditing(occurrence);
    };
    const closeEditor = () => { setEditing(null); };
    const save = () => {
        if (editing === null)
            return;
        if (draft.trim() !== '')
            store.set(editing.ref, draft);
        setTick(current => current + 1);
        setEditing(null);
    };
    const removeChip = (occurrence) => {
        store.remove(occurrence.ref);
        remove({ start: occurrence.offset, end: occurrence.offset + 1, draftRev: input.draftRev });
        if (editing?.occurrenceId === occurrence.occurrenceId)
            setEditing(null);
    };
    return (_jsxs("div", { className: css.rail, "data-testid": "pasted-text-rail", children: [chips.map((occurrence, index) => {
                const entry = store.get(occurrence.ref);
                return (_jsxs("span", { className: css.chip, children: [_jsxs("button", { type: "button", className: css.open, "data-testid": `pasted-text-chip-${index}`, title: t('pastedText.chipHint'), onClick: () => { openEditor(occurrence); }, children: [_jsx("span", { className: css.icon, "aria-hidden": "true", children: "\uD83D\uDCC4" }), _jsx("span", { className: css.label, children: occurrence.label }), entry !== undefined ? _jsx("span", { className: css.preview, children: pastedTextPreview(entry.text) }) : null] }), _jsx("button", { type: "button", className: css.remove, "aria-label": t('pastedText.remove'), "data-testid": `pasted-text-remove-${index}`, onClick: () => { removeChip(occurrence); }, children: "\u00D7" })] }, occurrence.occurrenceId));
            }), _jsx(Modal, { open: editing !== null, onClose: closeEditor, title: t('pastedText.title'), closeLabel: t('pastedText.close'), description: t('pastedText.description'), className: css.dialog, contentClassName: css.dialogContent, footer: (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: closeEditor, children: t('pastedText.cancel') }), _jsx(Button, { variant: "outline", onClick: () => { removeChip(editing); }, className: css.danger, disabled: editing === null, children: t('pastedText.removeChip') }), _jsx(Button, { onClick: save, disabled: draft.trim() === '', children: t('pastedText.save') })] })), children: _jsx("textarea", { className: css.editor, value: draft, "aria-label": t('pastedText.title'), spellCheck: false, onChange: event => { setDraft(event.target.value); } }) })] }));
}
