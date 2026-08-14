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
/** One inline span of Markdown text. */
export type MdSpan = {
    readonly type: 'text';
    readonly text: string;
} | {
    readonly type: 'code';
    readonly text: string;
} | {
    readonly type: 'strong';
    readonly text: string;
} | {
    readonly type: 'em';
    readonly text: string;
} | {
    readonly type: 'link';
    readonly text: string;
    readonly href: string;
};
/** One block-level Markdown element. */
export type MdBlock = {
    readonly type: 'heading';
    readonly level: number;
    readonly spans: readonly MdSpan[];
} | {
    readonly type: 'paragraph';
    readonly spans: readonly MdSpan[];
} | {
    readonly type: 'code';
    readonly lang: string;
    readonly code: string;
} | {
    readonly type: 'list';
    readonly ordered: boolean;
    readonly items: readonly (readonly MdSpan[])[];
} | {
    readonly type: 'quote';
    readonly spans: readonly MdSpan[];
} | {
    readonly type: 'rule';
};
/**
 * Parse inline Markdown into spans.
 * @param text - one block's raw text.
 * @returns the spans, with unmatched text preserved verbatim.
 */
export declare function parseInline(text: string): MdSpan[];
/**
 * Parse Markdown into blocks.
 * @param source - the document text.
 * @returns the block list; an unterminated fence still yields its code block.
 */
export declare function parseMarkdown(source: string): MdBlock[];
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
export declare function parseDelimited(source: string, delimiter: string): string[][];
/** Line class of a unified-diff line, for colouring. */
export type DiffLineKind = 'added' | 'removed' | 'meta' | 'hunk' | 'context';
/**
 * Classify one unified-diff line.
 * @param line - the raw line.
 * @returns its display class.
 */
export declare function diffLineKind(line: string): DiffLineKind;
