/**
 * Workspace file operations behind the web-enhanced gateway: bounded listing,
 * name search, read (size-capped, binary-sniffed), write, and delete. Every
 * path resolves against the workspace root and is rejected when it escapes it.
 * @module dsh-web-enhanced/src/files
 */
import type { FsEntryView, FsReadResult } from './types.ts';
/** Bounds shared by every file method (deployment config, not tunables). */
export interface FsLimits {
    readonly skipDirs: readonly string[];
    readonly readMaxBytes: number;
    readonly writeMaxBytes: number;
    readonly binaryMaxBytes: number;
    readonly searchMaxDepth: number;
    readonly searchMaxEntries: number;
}
/**
 * Resolve a workspace-relative path and assert it stays inside the root.
 * @param root - canonical workspace root.
 * @param rel - forward-slash relative path; empty means the root itself.
 * @returns the resolved absolute path.
 * @throws when the path is absolute or traverses upward.
 */
export declare function resolveWithin(root: string, rel: string): string;
/**
 * Directory-first, then name-ascending order. Pure: names are unique within
 * one directory, so the comparator never answers 0.
 * @param left - first entry.
 * @param right - second entry.
 * @returns -1 when left sorts first, 1 otherwise.
 */
export declare function compareFsEntries(left: FsEntryView, right: FsEntryView): number;
/** One directory listing, skipping `.git` and the configured skip dirs. */
export declare function listDirectory(root: string, rel: string, limits: FsLimits): Promise<FsEntryView[]>;
/** Recursive basename search with bounded depth and result count. */
export declare function searchFiles(root: string, rel: string, query: string, limits: FsLimits): Promise<FsEntryView[]>;
/**
 * Read one file: text (capped, truncated flag) or binary (base64 when small
 * enough for preview). Binary detection sniffs the first 8 KiB for a NUL.
 */
export declare function readFileView(root: string, rel: string, limits: FsLimits): Promise<FsReadResult>;
/**
 * Count the lines of one text file, for an untracked file's added-line count.
 *
 * `null` rather than a number whenever the answer would be a guess: a binary
 * file (git reports `-` for those), a file over the read cap (a partial read
 * would undercount), or one that cannot be read at all — an untracked entry can
 * vanish between `git ls-files` and this read, and that is not worth an error.
 *
 * Counts the way git does: newlines, plus one for a final line without its own
 * terminator.
 * @param root - canonical workspace root.
 * @param rel - workspace-relative path.
 * @param limits - the read caps.
 * @returns the line count, or null when it is not knowable.
 */
export declare function countTextLines(root: string, rel: string, limits: FsLimits): Promise<number | null>;
/** Write one UTF-8 text file (capped). */
export declare function writeFileView(root: string, rel: string, content: string, limits: FsLimits): Promise<void>;
/** Delete one file (never a directory). */
export declare function deleteFileView(root: string, rel: string): Promise<void>;
/** Basename of a workspace-relative path (client display helper). */
export declare function entryName(rel: string): string;
