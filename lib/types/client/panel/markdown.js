/**
 * Minimal Markdown and CSV parsing for the preview pane.
 *
 * Deliberately hand-rolled and small rather than a Markdown library: the
 * browser bundle is fetched eagerly per plugin, and the preview needs
 * headings, code, lists, quotes, and basic inline spans — not a CommonMark
 * implementation. Parsing to a block/span tree (never to an HTML string) is
 * also what keeps the renderer free of `dangerouslySetInnerHTML`, so
 * untrusted file content cannot inject markup.
 * @module dsh-web-enhanced/src/client/panel/markdown
 */
/**
 * Inline patterns, tried in order at each scan position.
 *
 * The emphasis patterns require the delimited run to start and end with a
 * non-space character, which is what keeps arithmetic like `2 * 3 * 4` from
 * reading as emphasis. Written without lookbehind so the bundle stays
 * portable across browser engines.
 */
const INLINE = [
    { type: 'code', re: /^`([^`]+)`/u },
    { type: 'strong', re: /^\*\*([^\s*](?:[^*]*[^\s*])?)\*\*/u },
    { type: 'em', re: /^\*([^\s*](?:[^*]*[^\s*])?)\*/u },
    { type: 'del', re: /^~~([^\s~](?:[^~]*[^\s~])?)~~/u },
];
/**
 * Inline HTML element names this preview can render, mapped to the span they
 * become.
 *
 * Documents mix HTML into Markdown constantly (`<br>`, `<kbd>`, `<img>`), and
 * printing the tag text verbatim is the wrong reading of the source. Rendering
 * arbitrary HTML is not on offer either: the whole preview is built as React
 * elements precisely so untrusted file content cannot inject markup. So a
 * known element becomes the matching span, and anything else has its tag
 * markup dropped while its content keeps rendering — the same shape a
 * sanitizer produces.
 */
const HTML_SPAN = {
    b: 'strong', strong: 'strong',
    i: 'em', em: 'em', var: 'em', cite: 'em',
    code: 'code', kbd: 'code', samp: 'code', tt: 'code',
    del: 'del', s: 'del', strike: 'del',
};
/** Elements whose CONTENT is markup, not prose: dropped whole. */
const HTML_VOIDED = new Set(['script', 'style']);
/** One opening/closing/self-closing HTML tag, or a comment. */
const HTML_TAG = /^<(\/)?([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/)?>/u;
const HTML_COMMENT = /^<!--[\s\S]*?-->/u;
/** Read one attribute out of a raw tag attribute string. */
function attributeOf(raw, name) {
    const found = new RegExp(`(?:^|\\s)${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'iu').exec(raw);
    if (found === null)
        return undefined;
    return found[2] ?? found[3] ?? found[4];
}
/** Link targets that may not be rendered as an anchor href. */
function safeHref(href) {
    const trimmed = href.trim();
    // `javascript:` and `data:` targets turn a rendered document into an
    // execution vector; anything else relative or http(s) is fine.
    if (/^(?:javascript|data|vbscript):/iu.test(trimmed))
        return undefined;
    return trimmed;
}
/**
 * Image sources the preview may load. Unlike a link target, an inline `data:`
 * image is the ordinary way a self-contained document embeds a picture, so it
 * stays — the element renders a bitmap, never markup or script.
 */
function safeSrc(src) {
    const trimmed = src.trim();
    if (/^(?:javascript|vbscript):/iu.test(trimmed))
        return undefined;
    if (/^data:/iu.test(trimmed) && !/^data:image\//iu.test(trimmed))
        return undefined;
    return trimmed;
}
/**
 * Whether an image href is browser-addressable on its own: any scheme (after
 * `safeSrc` has allowed it) or a protocol-relative URL. The browser resolves
 * these; a workspace-relative path cannot, and must be read through `fsRead`.
 */
export function browserImageHref(href) {
    const trimmed = href.trim();
    if (/^[a-z][a-z0-9+.-]*:/iu.test(trimmed) || trimmed.startsWith('//'))
        return trimmed;
    return undefined;
}
/**
 * Resolve a Markdown image href against its document to a workspace-relative
 * path. Returns undefined for browser-addressable URLs, absolute filesystem
 * paths, and `..` chains that would escape the workspace root.
 * @param markdownPath - workspace-relative path of the Markdown file.
 * @param href - the image reference from the document.
 */
export function workspaceImagePathOf(markdownPath, href) {
    const trimmed = href.trim();
    if (trimmed === '' || browserImageHref(trimmed) !== undefined)
        return undefined;
    if (/^[\\/]/u.test(trimmed) || /^[a-zA-Z]:/u.test(trimmed))
        return undefined;
    // A query or fragment is a browser concept; the file lives at the path part.
    const raw = trimmed.split(/[?#]/u, 1)[0];
    let decoded = raw;
    try {
        decoded = decodeURIComponent(raw);
    }
    catch {
        // An undecodable reference is not a file path we can read.
    }
    const normalized = decoded.replace(/\\/gu, '/');
    const base = markdownPath.includes('/')
        ? markdownPath.slice(0, markdownPath.lastIndexOf('/') + 1)
        : '';
    const parts = [];
    for (const segment of `${base}${normalized}`.split('/')) {
        if (segment === '' || segment === '.')
            continue;
        if (segment === '..') {
            if (parts.length === 0)
                return undefined;
            parts.pop();
            continue;
        }
        parts.push(segment);
    }
    return parts.length === 0 ? undefined : parts.join('/');
}
/** The five entities a Markdown document realistically writes by hand. */
const ENTITY = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ',
};
/** Decode one `&name;` or `&#NN;` reference; undefined when it is not one. */
function decodeEntity(source) {
    const named = /^&([a-zA-Z]+);/u.exec(source);
    if (named !== null) {
        const text = ENTITY[named[1].toLowerCase()];
        return text === undefined ? undefined : { text, length: named[0].length };
    }
    const numeric = /^&#(x[0-9a-fA-F]+|\d+);/u.exec(source);
    if (numeric === null)
        return undefined;
    const raw = numeric[1];
    const code = raw[0] === 'x' || raw[0] === 'X' ? Number.parseInt(raw.slice(1), 16) : Number.parseInt(raw, 10);
    if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff)
        return undefined;
    return { text: String.fromCodePoint(code), length: numeric[0].length };
}
/**
 * Parse inline Markdown into spans.
 * @param text - one block's raw text.
 * @returns the spans, with unmatched text preserved verbatim.
 */
export function parseInline(text) {
    const spans = [];
    let plain = '';
    let rest = text;
    // Text always merges into a preceding text span: a rejected link or an
    // unmatched marker contributes literal characters, and the caller should
    // see one run of text rather than a seam wherever a pattern was tried.
    const pushText = (value) => {
        if (value === '')
            return;
        const last = spans[spans.length - 1];
        if (last?.type === 'text') {
            spans[spans.length - 1] = { type: 'text', text: last.text + value };
            return;
        }
        spans.push({ type: 'text', text: value });
    };
    const flush = () => {
        pushText(plain);
        plain = '';
    };
    while (rest !== '') {
        const image = /^!\[([^\]]*)\]\(([^)\s]+)\)/u.exec(rest);
        if (image !== null) {
            const src = safeSrc(image[2]);
            flush();
            if (src === undefined)
                pushText(image[0]);
            else
                spans.push({ type: 'image', text: image[1], href: src });
            rest = rest.slice(image[0].length);
            continue;
        }
        const link = /^\[([^\]]*)\]\(([^)\s]+)\)/u.exec(rest);
        if (link !== null) {
            const href = safeHref(link[2]);
            flush();
            if (href === undefined)
                pushText(link[0]);
            else
                spans.push({ type: 'link', text: link[1], href });
            rest = rest.slice(link[0].length);
            continue;
        }
        if (rest[0] === '<') {
            const consumed = consumeHtml(rest, spans, flush, pushText);
            if (consumed > 0) {
                rest = rest.slice(consumed);
                continue;
            }
        }
        if (rest[0] === '&') {
            const entity = decodeEntity(rest);
            if (entity !== undefined) {
                plain += entity.text;
                rest = rest.slice(entity.length);
                continue;
            }
        }
        let matched = false;
        for (const pattern of INLINE) {
            const found = pattern.re.exec(rest);
            if (found === null)
                continue;
            flush();
            spans.push({ type: pattern.type, text: found[1] });
            rest = rest.slice(found[0].length);
            matched = true;
            break;
        }
        if (matched)
            continue;
        plain += rest[0];
        rest = rest.slice(1);
    }
    flush();
    return spans;
}
/**
 * Consume one inline HTML construct at the head of `rest`.
 *
 * A known element becomes its span (its text content read from the source up
 * to the closing tag); a comment and a voided element disappear with their
 * content; every other tag disappears while its content keeps rendering. A
 * lone `<` that opens nothing returns 0 so the caller keeps it as text.
 * @returns how many characters were consumed; 0 when this is not HTML.
 */
function consumeHtml(rest, spans, flush, pushText) {
    const comment = HTML_COMMENT.exec(rest);
    if (comment !== null)
        return comment[0].length;
    const tag = HTML_TAG.exec(rest);
    if (tag === null)
        return 0;
    const closing = tag[1] === '/';
    const name = tag[2].toLowerCase();
    const attributes = tag[3] ?? '';
    if (name === 'br') {
        flush();
        spans.push({ type: 'break' });
        return tag[0].length;
    }
    if (name === 'img' && !closing) {
        const src = safeSrc(attributeOf(attributes, 'src') ?? '');
        if (src !== undefined) {
            flush();
            spans.push({ type: 'image', text: attributeOf(attributes, 'alt') ?? '', href: src });
        }
        return tag[0].length;
    }
    if (closing)
        return tag[0].length;
    const end = closingIndexOf(rest, name, tag[0].length);
    if (name === 'a') {
        const href = safeHref(attributeOf(attributes, 'href') ?? '');
        const inner = end === undefined ? '' : rest.slice(tag[0].length, end.start);
        if (href === undefined) {
            pushText(stripTags(inner));
            return end === undefined ? tag[0].length : end.after;
        }
        flush();
        spans.push({ type: 'link', text: stripTags(inner), href });
        return end === undefined ? tag[0].length : end.after;
    }
    const mapped = HTML_SPAN[name];
    if (mapped !== undefined && end !== undefined) {
        flush();
        const inner = stripTags(rest.slice(tag[0].length, end.start));
        spans.push(mapped === 'code'
            ? { type: 'code', text: inner }
            : mapped === 'strong'
                ? { type: 'strong', text: inner }
                : mapped === 'del' ? { type: 'del', text: inner } : { type: 'em', text: inner });
        return end.after;
    }
    if (HTML_VOIDED.has(name))
        return end === undefined ? rest.length : end.after;
    // An unknown element: drop the tag, keep the content.
    return tag[0].length;
}
/** Locate one element's closing tag, honouring same-name nesting. */
function closingIndexOf(source, name, from) {
    const pattern = new RegExp(`<(/)?${name}(?![a-zA-Z0-9-])((?:"[^"]*"|'[^']*'|[^>"'])*?)(/)?>`, 'giu');
    pattern.lastIndex = from;
    let depth = 0;
    for (;;) {
        const found = pattern.exec(source);
        if (found === null)
            return undefined;
        if (found[1] === '/') {
            if (depth === 0)
                return { start: found.index, after: found.index + found[0].length };
            depth -= 1;
            continue;
        }
        if (found[3] !== '/')
            depth += 1;
    }
}
/** Flatten any residual markup inside an element's content to its text. */
function stripTags(source) {
    let text = '';
    let rest = source;
    while (rest !== '') {
        if (rest[0] === '<') {
            const comment = HTML_COMMENT.exec(rest);
            if (comment !== null) {
                rest = rest.slice(comment[0].length);
                continue;
            }
            const tag = HTML_TAG.exec(rest);
            if (tag !== null) {
                rest = rest.slice(tag[0].length);
                continue;
            }
        }
        if (rest[0] === '&') {
            const entity = decodeEntity(rest);
            if (entity !== undefined) {
                text += entity.text;
                rest = rest.slice(entity.length);
                continue;
            }
        }
        text += rest[0];
        rest = rest.slice(1);
    }
    return text;
}
/** Split one pipe-table row into its cells, honouring `\|` escapes. */
function tableCells(line) {
    const trimmed = line.trim().replace(/^\|/u, '').replace(/\|\s*$/u, '');
    const cells = [];
    let cell = '';
    for (let at = 0; at < trimmed.length; at += 1) {
        const char = trimmed[at];
        if (char === '\\' && trimmed[at + 1] === '|') {
            cell += '|';
            at += 1;
            continue;
        }
        if (char === '|') {
            cells.push(cell.trim());
            cell = '';
            continue;
        }
        cell += char;
    }
    cells.push(cell.trim());
    return cells;
}
/**
 * Read the alignment row of a GFM table (`---`, `:--`, `:-:`, `--:`).
 * @returns one entry per column, or undefined when the line is not one.
 */
function tableAlignment(line) {
    if (!line.includes('|'))
        return undefined;
    const cells = tableCells(line);
    const align = [];
    for (const cell of cells) {
        if (!/^:?-{1,}:?$/u.test(cell))
            return undefined;
        const left = cell.startsWith(':');
        const right = cell.endsWith(':');
        align.push(left && right ? 'center' : right ? 'right' : left ? 'left' : undefined);
    }
    return align.length === 0 ? undefined : align;
}
/** Leading indentation width of a line, counting tabs as one column. */
function indentOf(line) {
    return line.length - line.trimStart().length;
}
/** Read a list marker at the head of a line, or undefined when there is none. */
function listMarkerOf(line) {
    const found = /^([ \t]*)([-*+]|\d+[.)])\s+(.*)$/u.exec(line);
    if (found === null)
        return undefined;
    const number = /^(\d+)[.)]$/u.exec(found[2]);
    return {
        indent: found[1].length,
        ordered: number !== null,
        ...(number === null ? {} : { start: Number(number[1]) }),
        text: found[3],
    };
}
/**
 * Read a GFM task marker from the head of list-item text.
 * @returns the task state and the text after the marker.
 */
function taskMarkerOf(text) {
    const found = /^\[([ xX])\]\s*(.*)$/u.exec(text);
    if (found === null)
        return { task: false, checked: false, text };
    return { task: true, checked: found[1].toLowerCase() === 'x', text: found[2] };
}
/**
 * Parse Markdown into blocks.
 * @param source - the document text.
 * @returns the block list; an unterminated fence still yields its code block.
 */
export function parseMarkdown(source) {
    const blocks = [];
    const lines = source.split(/\r?\n/u);
    let index = 0;
    /**
     * Consume one list block at `baseIndent`, including task state and nested
     * child lists. Items keep a shared marker style: every unordered marker
     * belongs to the same list, while an ordered marker starts a new one.
     */
    const takeList = (baseIndent, ordered, start) => {
        const items = [];
        while (index < lines.length) {
            const marker = listMarkerOf(lines[index]);
            if (marker === undefined || marker.indent !== baseIndent || marker.ordered !== ordered)
                break;
            index += 1;
            // Numbered TODO items are often written `1. - [x] text`; the leading
            // bullet is the item's marker, so consume it instead of rendering it.
            let text = ordered && /^[-*+]\s+/u.test(marker.text)
                ? marker.text.replace(/^[-*+]\s+/u, '')
                : marker.text;
            const task = taskMarkerOf(text);
            const parts = task.text === '' ? [] : [task.text];
            const children = [];
            while (index < lines.length) {
                const line = lines[index];
                if (line.trim() === '')
                    break;
                const nested = listMarkerOf(line);
                if (nested !== undefined) {
                    // A marker at or left of this item starts the next item or block;
                    // one further right is a nested list under this item.
                    if (nested.indent <= baseIndent)
                        break;
                    children.push(takeList(nested.indent, nested.ordered, nested.start));
                    continue;
                }
                // Indented prose continues the item; anything at or left of the item
                // marker belongs to the next block.
                if (indentOf(line) <= baseIndent)
                    break;
                parts.push(line.trim());
                index += 1;
            }
            items.push({
                spans: parts.length === 0 ? [] : parseInline(parts.join(' ')),
                ...(task.task ? { task: true, checked: task.checked } : {}),
                children,
            });
        }
        return { type: 'list', ordered, ...(start === undefined ? {} : { start }), items };
    };
    /**
     * Consume a GFM pipe table starting at the header row, which the caller has
     * already paired with its alignment row. Body rows are padded or clipped to
     * the header width so a ragged row cannot shift the columns.
     */
    const takeTable = (align) => {
        const header = tableCells(lines[index]).map(cell => parseInline(cell));
        index += 2;
        const width = header.length;
        const rows = [];
        while (index < lines.length) {
            const line = lines[index];
            if (line.trim() === '' || !line.includes('|'))
                break;
            const cells = tableCells(line);
            rows.push(Array.from({ length: width }, (_unused, at) => parseInline(cells[at] ?? '')));
            index += 1;
        }
        return {
            type: 'table',
            header,
            align: Array.from({ length: width }, (_unused, at) => align[at]),
            rows,
        };
    };
    while (index < lines.length) {
        const line = lines[index];
        if (line.trim() === '') {
            index += 1;
            continue;
        }
        const fence = /^\s*```\s*(\S*)\s*$/u.exec(line);
        if (fence !== null) {
            index += 1;
            const body = [];
            while (index < lines.length && !/^\s*```\s*$/u.test(lines[index])) {
                body.push(lines[index]);
                index += 1;
            }
            // Skip the closing fence when there is one; EOF closes it otherwise.
            if (index < lines.length)
                index += 1;
            blocks.push({ type: 'code', lang: fence[1] ?? '', code: body.join('\n') });
            continue;
        }
        const heading = /^(#{1,6})\s+(.*)$/u.exec(line);
        if (heading !== null) {
            blocks.push({ type: 'heading', level: heading[1].length, spans: parseInline(heading[2]) });
            index += 1;
            continue;
        }
        if (/^\s*(?:[-*_]\s*){3,}$/u.test(line)) {
            blocks.push({ type: 'rule' });
            index += 1;
            continue;
        }
        // A table is claimed by its header/alignment PAIR, so a lone pipe line
        // stays a paragraph and `--- ` under it stays a rule.
        if (line.includes('|') && index + 1 < lines.length) {
            const align = tableAlignment(lines[index + 1]);
            if (align !== undefined && align.length === tableCells(line).length) {
                blocks.push(takeTable(align));
                continue;
            }
        }
        const quote = /^\s*>\s?(.*)$/u.exec(line);
        if (quote !== null) {
            const body = [quote[1]];
            index += 1;
            while (index < lines.length) {
                const next = /^\s*>\s?(.*)$/u.exec(lines[index]);
                if (next === null)
                    break;
                body.push(next[1]);
                index += 1;
            }
            blocks.push({ type: 'quote', spans: parseInline(body.join(' ')) });
            continue;
        }
        // An HTML table is the one block-level element worth reading structurally:
        // documents reach for it whenever a pipe table cannot express the cell, and
        // flattening it inline would run every cell together into one paragraph.
        if (/^\s*<table[\s>]/iu.test(line)) {
            const start = index;
            while (index < lines.length && !/<\/table\s*>/iu.test(lines[index]))
                index += 1;
            if (index < lines.length)
                index += 1;
            const table = parseHtmlTable(lines.slice(start, index).join('\n'));
            if (table !== undefined) {
                blocks.push(table);
                continue;
            }
            blocks.push({
                type: 'paragraph',
                spans: parseInline(lines.slice(start, index).map(part => part.trim()).join(' ')),
            });
            continue;
        }
        const list = listMarkerOf(line);
        if (list !== undefined) {
            blocks.push(takeList(list.indent, list.ordered, list.start));
            continue;
        }
        // A paragraph runs to the next blank line or block-level marker.
        const body = [];
        while (index < lines.length) {
            const current = lines[index];
            if (current.trim() === '')
                break;
            if (/^\s*(?:```|#{1,6}\s|>|[-*+]\s|\d+[.)]\s|<table[\s>])/iu.test(current))
                break;
            // A table header claims the line before its alignment row, so a
            // paragraph must release it rather than swallow the whole table.
            if (body.length > 0 && current.includes('|') && index + 1 < lines.length
                && tableAlignment(lines[index + 1])?.length === tableCells(current).length)
                break;
            body.push(current.trim());
            index += 1;
        }
        blocks.push({ type: 'paragraph', spans: parseInline(body.join(' ')) });
    }
    return blocks;
}
/**
 * Read one `<table>` element into a table block.
 *
 * Cells keep their inline content (so `<br>`, `<b>`, and Markdown inside a
 * cell still render); a `<th>` anywhere in the first row makes it the header,
 * and a table with no rows is not a table.
 * @param html - the element's source, opening tag through closing tag.
 * @returns the block, or undefined when nothing row-shaped was found.
 */
export function parseHtmlTable(html) {
    const rows = [];
    const rowPattern = /<tr(?:\s(?:"[^"]*"|'[^']*'|[^>"'])*)?>([\s\S]*?)<\/tr\s*>/giu;
    for (;;) {
        const row = rowPattern.exec(html);
        if (row === null)
            break;
        const cells = [];
        let head = false;
        const cellPattern = /<(th|td)(?:\s(?:"[^"]*"|'[^']*'|[^>"'])*)?>([\s\S]*?)<\/\1\s*>/giu;
        for (;;) {
            const cell = cellPattern.exec(row[1]);
            if (cell === null)
                break;
            if (cell[1].toLowerCase() === 'th')
                head = true;
            cells.push(parseInline(cell[2].trim()));
        }
        if (cells.length > 0)
            rows.push({ head, cells });
    }
    if (rows.length === 0)
        return undefined;
    const first = rows[0];
    const body = first.head ? rows.slice(1) : rows;
    const width = Math.max(...rows.map(row => row.cells.length));
    const pad = (cells) => Array.from({ length: width }, (_unused, at) => cells[at] ?? []);
    return {
        type: 'table',
        header: first.head ? pad(first.cells) : [],
        align: Array.from({ length: width }, () => undefined),
        rows: body.map(row => pad(row.cells)),
    };
}
/**
 * Parse delimiter-separated text into rows, honouring quoted fields.
 *
 * Follows the usual CSV quoting rules: a field may be wrapped in double
 * quotes, a doubled quote inside one is a literal quote, and delimiters and
 * newlines lose their meaning inside quotes.
 * @param source - the file text.
 * @param delimiter - field separator; tab for `.tsv`.
 * @returns rows of fields; a trailing newline adds no empty row.
 */
export function parseDelimited(source, delimiter) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    let index = 0;
    while (index < source.length) {
        const char = source[index];
        if (quoted) {
            if (char === '"') {
                if (source[index + 1] === '"') {
                    field += '"';
                    index += 2;
                    continue;
                }
                quoted = false;
                index += 1;
                continue;
            }
            field += char;
            index += 1;
            continue;
        }
        if (char === '"') {
            quoted = true;
            index += 1;
            continue;
        }
        if (char === delimiter) {
            row.push(field);
            field = '';
            index += 1;
            continue;
        }
        if (char === '\n' || char === '\r') {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
            // Consume the LF of a CRLF pair so it does not open an empty row.
            index += char === '\r' && source[index + 1] === '\n' ? 2 : 1;
            continue;
        }
        field += char;
        index += 1;
    }
    if (field !== '' || row.length > 0) {
        row.push(field);
        rows.push(row);
    }
    return rows;
}
/**
 * Classify one unified-diff line.
 * @param line - the raw line.
 * @returns its display class.
 */
export function diffLineKind(line) {
    if (line.startsWith('+++') || line.startsWith('---'))
        return 'meta';
    if (line.startsWith('@@'))
        return 'hunk';
    if (line.startsWith('diff ') || line.startsWith('index '))
        return 'meta';
    if (line.startsWith('+'))
        return 'added';
    if (line.startsWith('-'))
        return 'removed';
    return 'context';
}
