import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Preview pane: a tab strip over open files, a source/split/preview mode
 * switch, and inline editing with save-back for text-shaped formats.
 *
 * Rendered forms are built from parsed structures into React elements — never
 * `dangerouslySetInnerHTML` — so file content cannot inject markup. HTML is
 * the one format with no structural rendering, and it goes into a sandboxed
 * iframe with no scripts and no same-origin access.
 * @module dsh-web-enhanced/src/client/panel/PreviewPane
 */
import { useCallback, useRef, useState } from 'react';
import { dataUrlOf, extensionOf, hasRenderedForm, isEditable } from "../preview.js";
import { activeTabOf } from "../stores.js";
import { diffLineKind, parseDelimited, parseMarkdown } from "./markdown.js";
import css from './PreviewPane.module.css';
/** Mode buttons in display order. */
const MODES = [
    { mode: 'source', key: 'preview.mode.source' },
    { mode: 'split', key: 'preview.mode.split' },
    { mode: 'view', key: 'preview.mode.view' },
];
/** The preview pane. */
export function PreviewPane({ workspaceId, usePreview, remote, focusTab, closeTab, setMode, setDraft, commitDraft, t, }) {
    const tabs = usePreview(state => state.tabs);
    const active = usePreview(state => activeTabOf(state));
    const [saveError, setSaveError] = useState(null);
    const live = useRef(true);
    const save = useCallback(async (tab) => {
        if (tab.draft === undefined)
            return;
        const result = await remote.fsWrite({ workspaceId, path: tab.path, content: tab.draft });
        if (!live.current)
            return;
        if ('error' in result) {
            setSaveError(result.error.message);
            return;
        }
        setSaveError(null);
        commitDraft(tab.path);
    }, [commitDraft, remote, workspaceId]);
    if (tabs.length === 0 || active === undefined) {
        return _jsx("p", { className: css.empty, "data-testid": "preview-empty", children: t('preview.empty') });
    }
    const editable = isEditable(active.kind) && active.content !== undefined;
    const dirty = active.draft !== undefined && active.draft !== active.content;
    const body = active.draft ?? active.content ?? '';
    return (_jsxs("div", { className: css.pane, "data-testid": "preview-pane", children: [_jsx("div", { className: css.strip, role: "tablist", children: tabs.map(tab => (_jsxs("span", { className: css.stripItem, "data-active": tab.path === active.path || undefined, children: [_jsxs("button", { type: "button", role: "tab", className: css.stripName, "aria-selected": tab.path === active.path, title: tab.path, onClick: () => { focusTab(tab.path); }, children: [tab.name, tab.draft !== undefined && tab.draft !== tab.content && _jsx("span", { className: css.dirty, "aria-label": t('preview.dirty'), children: "\u2022" })] }), _jsx("button", { type: "button", className: css.stripClose, "aria-label": t('preview.close'), onClick: () => { closeTab(tab.path); }, children: "\u2715" })] }, tab.path))) }), _jsxs("div", { className: css.toolbar, children: [hasRenderedForm(active.kind) && MODES.map(entry => (_jsx("button", { type: "button", className: css.mode, "data-active": active.mode === entry.mode || undefined, "data-testid": `preview-mode-${entry.mode}`, onClick: () => { setMode(active.path, entry.mode); }, children: t(entry.key) }, entry.mode))), editable && (_jsx("button", { type: "button", className: css.save, disabled: !dirty, "data-testid": "preview-save", onClick: () => { void save(active); }, children: t('preview.save') })), active.truncated && _jsx("span", { className: css.notice, children: t('preview.truncated') })] }), active.error !== undefined && (_jsx("p", { className: css.error, "data-testid": "preview-error", children: t('preview.error', { message: active.error }) })), saveError !== null && _jsx("p", { className: css.error, children: t('preview.error', { message: saveError }) }), _jsxs("div", { className: css.body, "data-mode": active.mode, children: [(active.mode === 'source' || active.mode === 'split') && editable && (_jsx("textarea", { className: css.editor, value: body, spellCheck: false, "data-testid": "preview-editor", onChange: event => { setDraft(active.path, event.target.value); } })), (active.mode === 'source' || active.mode === 'split') && !editable && (_jsx("pre", { className: css.source, children: body })), (active.mode === 'view' || active.mode === 'split') && (_jsx("div", { className: css.view, "data-testid": "preview-view", children: _jsx(RenderedForm, { tab: active, text: body, unsupported: t('preview.unsupported') }) }))] })] }));
}
/** The rendered (non-source) form of one tab. */
function RenderedForm({ tab, text, unsupported }) {
    switch (tab.kind) {
        case 'markdown':
            return _jsx(MarkdownView, { source: text });
        case 'csv':
            return _jsx(TableView, { rows: parseDelimited(text, extensionOf(tab.path) === 'tsv' ? '\t' : ',') });
        case 'diff':
            return _jsx(DiffView, { source: text });
        case 'html':
            // No scripts, no same-origin: a previewed page cannot reach the app.
            return _jsx("iframe", { className: css.frame, sandbox: "", srcDoc: text, title: tab.name });
        case 'image': {
            const src = dataUrlOf(tab);
            return src === undefined ? _jsx("p", { className: css.empty, children: unsupported }) : _jsx("img", { className: css.image, src: src, alt: tab.name });
        }
        case 'pdf': {
            const src = dataUrlOf(tab);
            return src === undefined ? _jsx("p", { className: css.empty, children: unsupported }) : _jsx("object", { className: css.frame, data: src, type: "application/pdf", "aria-label": tab.name });
        }
        case 'office':
            return tab.office === undefined
                ? _jsx("p", { className: css.empty, children: unsupported })
                : _jsx(OfficeView, { blocks: tab.office.blocks });
        case 'code':
        case 'text':
            return _jsx("pre", { className: css.source, children: text });
    }
}
/** Inline spans as React elements. */
function Spans({ spans }) {
    return spans.map((span, index) => {
        switch (span.type) {
            case 'code': return _jsx("code", { className: css.inlineCode, children: span.text }, index);
            case 'strong': return _jsx("strong", { children: span.text }, index);
            case 'em': return _jsx("em", { children: span.text }, index);
            case 'del': return _jsx("del", { children: span.text }, index);
            case 'break': return _jsx("br", {}, index);
            // The source may be any workspace file, so an image reference is loaded
            // only when it already resolves on its own (an absolute URL or a data
            // URI). A workspace-relative path has no browser-resolvable origin here.
            case 'image': return _jsx("img", { className: css.inlineImage, src: span.href, alt: span.text }, index);
            // Previewed documents are untrusted: opening in a new context without
            // an opener keeps a link from reaching back into the app.
            case 'link': return _jsx("a", { href: span.href, target: "_blank", rel: "noreferrer noopener", children: span.text }, index);
            case 'text': return _jsx("span", { children: span.text }, index);
        }
    });
}
/** A parsed Markdown or HTML table, with its per-column alignment. */
function MarkdownTable({ block }) {
    return (_jsxs("table", { className: css.table, children: [block.header.length > 0 && (_jsx("thead", { children: _jsx("tr", { children: block.header.map((cell, index) => (_jsx("th", { style: block.align[index] === undefined ? undefined : { textAlign: block.align[index] }, children: _jsx(Spans, { spans: cell }) }, index))) }) })), _jsx("tbody", { children: block.rows.map((row, rowIndex) => (_jsx("tr", { children: row.map((cell, index) => (_jsx("td", { style: block.align[index] === undefined ? undefined : { textAlign: block.align[index] }, children: _jsx(Spans, { spans: cell }) }, index))) }, rowIndex))) })] }));
}
/** Structural Markdown rendering. */
function MarkdownView({ source }) {
    return (_jsx("div", { className: css.markdown, children: parseMarkdown(source).map((block, index) => {
            switch (block.type) {
                case 'heading': {
                    const Tag = `h${String(Math.min(block.level, 6))}`;
                    return _jsx(Tag, { children: _jsx(Spans, { spans: block.spans }) }, index);
                }
                case 'paragraph': return _jsx("p", { children: _jsx(Spans, { spans: block.spans }) }, index);
                case 'code': return _jsx("pre", { className: css.codeBlock, "data-lang": block.lang, children: _jsx("code", { children: block.code }) }, index);
                case 'quote': return _jsx("blockquote", { children: _jsx(Spans, { spans: block.spans }) }, index);
                case 'rule': return _jsx("hr", {}, index);
                case 'table': return _jsx(MarkdownTable, { block: block }, index);
                case 'list': {
                    const Tag = block.ordered ? 'ol' : 'ul';
                    return (_jsx(Tag, { children: block.items.map((item, itemIndex) => _jsx("li", { children: _jsx(Spans, { spans: item }) }, itemIndex)) }, index));
                }
            }
        }) }));
}
/** Delimited rows as a table; the first row is the header. */
function TableView({ rows }) {
    if (rows.length === 0)
        return null;
    const [header, ...body] = rows;
    return (_jsxs("table", { className: css.table, children: [_jsx("thead", { children: _jsx("tr", { children: header.map((cell, index) => _jsx("th", { children: cell }, index)) }) }), _jsx("tbody", { children: body.map((row, rowIndex) => (_jsx("tr", { children: row.map((cell, index) => _jsx("td", { children: cell }, index)) }, rowIndex))) })] }));
}
/** Unified diff with per-line classes. */
function DiffView({ source }) {
    return (_jsx("pre", { className: css.diff, children: source.split(/\r?\n/u).map((line, index) => (_jsx("span", { className: css.diffLine, "data-kind": diffLineKind(line), children: line === '' ? ' ' : line }, index))) }));
}
/** Office conversion blocks from the host. */
function OfficeView({ blocks }) {
    return (_jsx("div", { className: css.markdown, children: blocks.map((block, index) => {
            if (block.type === 'table') {
                return _jsx(TableView, { rows: block.rows }, index);
            }
            switch (block.type) {
                case 'h1': return _jsx("h1", { children: block.text }, index);
                case 'h2': return _jsx("h2", { children: block.text }, index);
                case 'h3': return _jsx("h3", { children: block.text }, index);
                case 'li': return _jsx("li", { children: block.text }, index);
                case 'p': return _jsx("p", { children: block.text }, index);
            }
        }) }));
}
