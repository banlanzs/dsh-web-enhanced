/**
 * Office preview conversion: docx/xlsx are ZIP containers, so the host
 * unpacks them with fflate and projects the document into a bounded list of
 * structural blocks (headings, paragraphs, list items, tables). Blocks are
 * never raw HTML — the client renders a whitelisted React tree, so there is
 * no markup-injection surface. Styling beyond structure (bold, italics,
 * colors) is intentionally dropped.
 * @module dsh-web-enhanced/src/office
 */
import type { FsOfficePreviewResult, OfficeKind } from './types.ts';
/** Scale bounds of one conversion (pathological-document guards, not tunables). */
export interface OfficeLimits {
    /** File size cap; larger files are rejected instead of parsed. */
    readonly maxBytes: number;
}
/** Bounded structural output: hard caps with truncation, never unbounded. */
export declare const OFFICE_MAX_BLOCKS = 2000;
export declare const OFFICE_MAX_TABLE_ROWS = 200;
export declare const OFFICE_MAX_TABLE_COLS = 50;
/** Whether the file name targets a supported Office format. */
export declare function isOfficeName(name: string): boolean;
/** The converter kind for one file name, or null for unsupported formats. */
export declare function officeKindOf(name: string): OfficeKind | null;
/**
 * Read one Office file inside the workspace and convert it to preview
 * blocks. Legacy binary formats (.doc/.xls) answer a dedicated error.
 * @param root - canonical workspace root.
 * @param rel - workspace-relative path.
 * @param limits - conversion bounds.
 * @returns the preview result; errors are result fields, never throws.
 */
export declare function officePreviewView(root: string, rel: string, limits: OfficeLimits): Promise<FsOfficePreviewResult>;
