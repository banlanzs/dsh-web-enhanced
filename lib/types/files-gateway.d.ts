/**
 * Files domain service: every fs remote of the web-enhanced gateway.
 *
 * The gateway delegates its fs* methods here; this module owns the limits
 * plumbing, the empty-query search cache the mention picker leans on, and
 * the files slice of the plugin config. Reads, writes, and previews stay
 * behind a workspace root — only `browse` reaches the wider host, and it
 * returns names, kinds, and sizes only.
 * @module dsh-web-enhanced/src/files-gateway
 */
import z from '@deepseek-ai/schemastery';
import type { WorkspaceFace } from './workspace-service.ts';
import type { FsBrowseRequest, FsBrowseResult, FsDeleteRequest, FsListRequest, FsListResult, FsOfficePreviewRequest, FsOfficePreviewResult, FsReadRequest, FsReadResult, FsSearchRequest, FsSearchResult, FsWriteRequest, FsWriteResult } from './types.ts';
/** The files slice of the plugin config (user input; defaults bind later). */
export interface FilesConfigInput {
    skipDirs?: string[];
    readMaxBytes?: number;
    writeMaxBytes?: number;
    binaryMaxBytes?: number;
    searchMaxDepth?: number;
    searchMaxEntries?: number;
    officeMaxBytes?: number;
    browseMaxEntries?: number;
}
/** The files config fragment, as the plugin schema assembles it. */
export declare const filesConfigFragment: z<Required<FilesConfigInput>>;
/** Field defaults applied when the files domain is assembled directly. */
export declare function resolveFilesConfig(config: Partial<FilesConfigInput>): Required<FilesConfigInput>;
/** The file capabilities, as the gateway consumes them. */
export interface FilesDomainFace {
    list(request: FsListRequest): Promise<FsListResult>;
    search(request: FsSearchRequest): Promise<FsSearchResult>;
    read(request: FsReadRequest): Promise<FsReadResult>;
    write(request: FsWriteRequest): Promise<FsWriteResult>;
    remove(request: FsDeleteRequest): Promise<FsWriteResult>;
    officePreview(request: FsOfficePreviewRequest): Promise<FsOfficePreviewResult>;
    browse(request: FsBrowseRequest): Promise<FsBrowseResult>;
    /** Line count of one workspace-relative file; the git domain's untracked rows. */
    countLines(root: string, path: string): Promise<number | null>;
}
/** What the files domain needs from the rest of the plugin. */
export interface FilesDomainDeps {
    readonly workspace: WorkspaceFace;
    readonly config: Required<FilesConfigInput>;
}
/**
 * Assemble the files domain.
 * @param deps - workspace resolution and the resolved limits.
 * @returns the file capabilities.
 */
export declare function createFilesDomain(deps: FilesDomainDeps): FilesDomainFace;
