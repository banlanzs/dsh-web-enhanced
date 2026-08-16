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
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { binaryObjectUrl, contentKey, workspaceImageUrl } from "../media.js";
import { extensionOf, hasRenderedForm, isEditable, mimeOfImagePath } from "../preview.js";
import { activeTabOf } from "../stores.js";
import { browserImageHref, diffLineKind, parseDelimited, parseMarkdown, workspaceImagePathOf } from "./markdown.js";
import css from './PreviewPane.module.css';
/** Scroll depth past which the back-to-top button appears, px. */
const TOP_THRESHOLD_PX = 240;
/** Shared empty row set for the non-CSV kinds (stable reference for useMemo). */
const EMPTY_ROWS = [];
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
    // Reference-stable markdown image context: memoized children (RenderedForm)
    // only skip re-render when this keeps its identity across pane renders.
    const activePath = active?.path;
    const markdownImage = useMemo(() => ({ tabPath: activePath ?? '', workspaceId, remote }), [activePath, workspaceId, remote]);
    const [saveError, setSaveError] = useState(null);
    // Back-to-top: whichever scroll region is live (editor, source, diff, view)
    // reports through one shared ref; the button appears once it leaves the top.
    const scroller = useRef(null);
    const [showTop, setShowTop] = useState(false);
    const live = useRef(true);
    /** Bind the active scroll region to the back-to-top button. */
    const bindScroller = (element) => {
        scroller.current = element;
        setShowTop(element !== null && element.scrollTop > TOP_THRESHOLD_PX);
    };
    const trackScroll = (event) => {
        setShowTop(event.currentTarget.scrollTop > TOP_THRESHOLD_PX);
    };
    const backToTop = () => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        scroller.current?.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    };
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
    return (_jsxs("div", { className: css.pane, "data-testid": "preview-pane", children: [_jsx("div", { className: css.strip, role: "tablist", children: tabs.map(tab => (_jsxs("span", { className: css.stripItem, "data-active": tab.path === active.path || undefined, children: [_jsxs("button", { type: "button", role: "tab", className: css.stripName, "aria-selected": tab.path === active.path, title: tab.path, onClick: () => { focusTab(tab.path); }, children: [tab.name, tab.draft !== undefined && tab.draft !== tab.content && _jsx("span", { className: css.dirty, "aria-label": t('preview.dirty'), children: "\u2022" })] }), _jsx("button", { type: "button", className: css.stripClose, "aria-label": t('preview.close'), onClick: () => { closeTab(tab.path); }, children: "\u2715" })] }, tab.path))) }), _jsxs("div", { className: css.toolbar, children: [hasRenderedForm(active.kind) && MODES.map(entry => (_jsx("button", { type: "button", className: css.mode, "data-active": active.mode === entry.mode || undefined, "data-testid": `preview-mode-${entry.mode}`, onClick: () => { setMode(active.path, entry.mode); }, children: t(entry.key) }, entry.mode))), editable && (_jsx("button", { type: "button", className: css.save, disabled: !dirty, "data-testid": "preview-save", onClick: () => { void save(active); }, children: t('preview.save') })), active.truncated && _jsx("span", { className: css.notice, children: t('preview.truncated') })] }), active.error !== undefined && (_jsx("p", { className: css.error, "data-testid": "preview-error", children: t('preview.error', { message: active.error }) })), saveError !== null && _jsx("p", { className: css.error, children: t('preview.error', { message: saveError }) }), _jsxs("div", { className: css.body, "data-mode": active.mode, children: [(active.mode === 'source' || active.mode === 'split') && editable && (_jsx("textarea", { ref: bindScroller, className: css.editor, value: body, spellCheck: false, "data-testid": "preview-editor", onChange: event => { setDraft(active.path, event.target.value); }, onScroll: trackScroll })), (active.mode === 'source' || active.mode === 'split') && !editable && (_jsx("pre", { className: css.source, ref: bindScroller, onScroll: trackScroll, children: body })), (active.mode === 'view' || active.mode === 'split') && (_jsx("div", { className: css.view, "data-testid": "preview-view", ref: bindScroller, onScroll: trackScroll, children: _jsx(RenderedForm, { tab: active, text: body, unsupported: t('preview.unsupported'), image: markdownImage }) }))] }), showTop && (_jsx("button", { type: "button", className: css.backToTop, "aria-label": t('preview.backToTop'), "data-testid": "preview-back-to-top", onClick: backToTop, children: _jsx("span", { "aria-hidden": "true", children: "\u2191" }) }))] }));
}
/**
 * The rendered (non-source) form of one tab. Memoized with the heavy parse
 * and data-URL work hoisted into `useMemo`: the pane re-renders on
 * scroll-position flips and save errors, and re-parsing the document or
 * re-concatenating a multi-megabyte base64 string for those would be pure
 * waste.
 */
const RenderedForm = memo(function RenderedForm({ tab, text, unsupported, image, }) {
    const csvRows = useMemo(() => tab.kind === 'csv'
        ? parseDelimited(text, extensionOf(tab.path) === 'tsv' ? '\t' : ',')
        : EMPTY_ROWS, [tab, text]);
    const dataSrc = useMemo(() => {
        if (tab.binary === undefined || tab.binary === '')
            return undefined;
        const mime = tab.kind === 'pdf' ? 'application/pdf' : mimeOfImagePath(tab.path);
        return binaryObjectUrl(contentKey('preview', tab.binary), tab.binary, mime);
    }, [tab]);
    switch (tab.kind) {
        case 'markdown':
            return _jsx(MarkdownView, { source: text, image: image });
        case 'csv':
            return _jsx(TableView, { rows: csvRows });
        case 'diff':
            return _jsx(DiffView, { source: text });
        case 'html':
            // No scripts, no same-origin: a previewed page cannot reach the app.
            return _jsx("iframe", { className: css.frame, sandbox: "", srcDoc: text, title: tab.name });
        case 'image':
            return dataSrc === undefined ? _jsx("p", { className: css.empty, children: unsupported }) : _jsx("img", { className: css.image, src: dataSrc, alt: tab.name });
        case 'pdf':
            return dataSrc === undefined ? _jsx("p", { className: css.empty, children: unsupported }) : _jsx("object", { className: css.frame, data: dataSrc, type: "application/pdf", "aria-label": tab.name });
        case 'office':
            return tab.office === undefined
                ? _jsx("p", { className: css.empty, children: unsupported })
                : _jsx(OfficeView, { blocks: tab.office.blocks });
        case 'code':
        case 'text':
            return _jsx("pre", { className: css.source, children: text });
    }
});
/**
 * A workspace-relative Markdown image, read through the plugin's own `fsRead`
 * and rendered as a data URL. The host's read stays workspace-scoped, so this
 * loads exactly the same file an IDE resolves — and nothing outside the root.
 */
function WorkspaceImage({ path, alt, workspaceId, remote, }) {
    const [url, setUrl] = useState(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        let live = true;
        setUrl(null);
        setFailed(false);
        // One shared read + one shared object URL per image: N references in one
        // document (or N mounted components) no longer mean N reads and N base64
        // copies. Failures drop out of the cache; the next mount retries.
        void workspaceImageUrl(remote, workspaceId, path, mimeOfImagePath).then((next) => { if (live)
            setUrl(next); }, () => { if (live)
            setFailed(true); });
        return () => { live = false; };
    }, [path, workspaceId, remote]);
    if (failed)
        return _jsx("span", { className: css.inlineImageFallback, children: alt === '' ? path : alt });
    if (url === null)
        return null;
    return _jsx("img", { className: css.inlineImage, src: url, alt: alt });
}
/** Inline spans as React elements. */
function Spans({ spans, image }) {
    return spans.map((span, index) => {
        switch (span.type) {
            case 'code': return _jsx("code", { className: css.inlineCode, children: span.text }, index);
            case 'strong': return _jsx("strong", { children: span.text }, index);
            case 'em': return _jsx("em", { children: span.text }, index);
            case 'del': return _jsx("del", { children: span.text }, index);
            case 'break': return _jsx("br", {}, index);
            case 'image': {
                const external = browserImageHref(span.href);
                if (external !== undefined) {
                    return _jsx("img", { className: css.inlineImage, src: external, alt: span.text }, index);
                }
                const path = workspaceImagePathOf(image.tabPath, span.href);
                if (path === undefined) {
                    return _jsx("span", { className: css.inlineImageFallback, children: span.text }, index);
                }
                return (_jsx(WorkspaceImage, { path: path, alt: span.text, workspaceId: image.workspaceId, remote: image.remote }, index));
            }
            // Previewed documents are untrusted: opening in a new context without
            // an opener keeps a link from reaching back into the app.
            case 'link': return _jsx("a", { href: span.href, target: "_blank", rel: "noreferrer noopener", children: span.text }, index);
            case 'text': return _jsx("span", { children: span.text }, index);
        }
    });
}
/** A parsed Markdown or HTML table, with its per-column alignment. */
function MarkdownTable({ block, image, }) {
    return (_jsxs("table", { className: css.table, children: [block.header.length > 0 && (_jsx("thead", { children: _jsx("tr", { children: block.header.map((cell, index) => (_jsx("th", { style: block.align[index] === undefined ? undefined : { textAlign: block.align[index] }, children: _jsx(Spans, { spans: cell, image: image }) }, index))) }) })), _jsx("tbody", { children: block.rows.map((row, rowIndex) => (_jsx("tr", { children: row.map((cell, index) => (_jsx("td", { style: block.align[index] === undefined ? undefined : { textAlign: block.align[index] }, children: _jsx(Spans, { spans: cell, image: image }) }, index))) }, rowIndex))) })] }));
}
/** Rendered Markdown blocks, shared by documents and nested list children. */
function Blocks({ blocks, image }) {
    return blocks.map((block, index) => {
        switch (block.type) {
            case 'heading': {
                const Tag = `h${String(Math.min(block.level, 6))}`;
                return _jsx(Tag, { children: _jsx(Spans, { spans: block.spans, image: image }) }, index);
            }
            case 'paragraph': return _jsx("p", { children: _jsx(Spans, { spans: block.spans, image: image }) }, index);
            case 'code': return _jsx("pre", { className: css.codeBlock, "data-lang": block.lang, children: _jsx("code", { children: block.code }) }, index);
            case 'quote': return _jsx("blockquote", { children: _jsx(Spans, { spans: block.spans, image: image }) }, index);
            case 'rule': return _jsx("hr", {}, index);
            case 'table': return _jsx(MarkdownTable, { block: block, image: image }, index);
            case 'list': {
                const Tag = block.ordered ? 'ol' : 'ul';
                return (_jsx(Tag, { "data-ordered": block.ordered ? 'true' : 'false', start: block.ordered ? block.start : undefined, children: block.items.map((item, itemIndex) => (_jsxs("li", { "data-task": item.task === true ? 'true' : undefined, "data-checked": item.task === true && item.checked ? 'true' : undefined, children: [item.task === true
                                ? (_jsxs("label", { className: css.task, children: [_jsx("input", { className: css.taskBox, type: "checkbox", disabled: true, checked: item.checked }), _jsx("span", { className: css.taskText, children: _jsx(Spans, { spans: item.spans, image: image }) })] }))
                                : _jsx(Spans, { spans: item.spans, image: image }), item.children.length > 0 && _jsx(Blocks, { blocks: item.children, image: image })] }, itemIndex))) }, index));
            }
        }
    });
}
/** Structural Markdown rendering. */
function MarkdownView({ source, image }) {
    // Parsing is O(document); memoized so parent re-renders (and split-mode
    // keystrokes on the editor half) do not re-walk the text.
    const blocks = useMemo(() => parseMarkdown(source), [source]);
    return (_jsx("div", { className: css.markdown, children: _jsx(Blocks, { blocks: blocks, image: image }) }));
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
    const lines = useMemo(() => source.split(/\r?\n/u), [source]);
    return (_jsx("pre", { className: css.diff, children: lines.map((line, index) => (_jsx("span", { className: css.diffLine, "data-kind": diffLineKind(line), children: line === '' ? ' ' : line }, index))) }));
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
