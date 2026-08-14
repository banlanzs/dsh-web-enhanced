/**
 * The web-enhanced Typert contribution, hand-declared for the client
 * assembly: the host gateway discovers the same methods through the SRC
 * fallback (the `@Remote` decorators on `WebEnhancedGateway`), so this plugin
 * ships no generated typert artifacts.
 *
 * Parameter arity is the contract that matters here. The Gateway invokes a
 * host method as `Reflect.apply(method, receiver, args)` with `args` built by
 * mapping `descriptor.parameters` in order, and the client half refuses a call
 * whose argument count differs from `descriptor.parameters.length`. So a
 * descriptor's parameter list IS the host method's positional signature:
 * every method here declares exactly ONE `request` parameter and every gateway
 * method takes exactly one request object. Splitting a request object into
 * per-field parameters would compile fine and fail at runtime on both sides.
 *
 * Parameter codecs stay permissive (the host validates its own request types);
 * result codecs are strict and mirror `../types.ts`.
 * @module dsh-web-enhanced/src/client/remote
 */
import { z } from 'zod';
/** Type symbol prefix of this plugin's payload module. */
const TYPES = 'dsh-web-enhanced/types#';
/** Strict codec whose schema accepts any plain JSON value (parameters). */
function jsonCodec(typeSymbol) {
    return { mode: 'strict', typeSymbol, schema: z.any() };
}
const apiErrorSchema = z.object({ code: z.string(), message: z.string() });
/** Union of one success payload and the ApiError branch. */
function okOrError(schema) {
    return z.union([schema, z.object({ error: apiErrorSchema })]);
}
const taskResultSchema = z.object({
    reasonKind: z.enum(['completed', 'error', 'interrupted']).optional(),
    summary: z.string().optional(),
    errorCode: z.string().optional(),
    errorMessage: z.string().optional(),
});
const taskRecordSchema = z.object({
    id: z.string(),
    title: z.string(),
    prompt: z.string(),
    status: z.enum(['planned', 'todo', 'running', 'done', 'failed']),
    cron: z.string().nullable(),
    nextRunAt: z.number().nullable(),
    workspaceId: z.string().nullable(),
    sessionId: z.string().nullable(),
    result: taskResultSchema.nullable(),
    createdAt: z.number(),
    updatedAt: z.number(),
    lastRunAt: z.number().nullable(),
});
const gitBranchViewSchema = z.object({ name: z.string(), current: z.boolean() });
const gitCommitViewSchema = z.object({
    hash: z.string(),
    parents: z.array(z.string()),
    refs: z.array(z.string()),
    author: z.string(),
    date: z.number(),
    subject: z.string(),
});
const gitStatusEntrySchema = z.object({
    path: z.string(),
    origPath: z.string().optional(),
    staged: z.string(),
    unstaged: z.string(),
});
const gitOkSchema = z.object({ ok: z.boolean(), message: z.string().optional() });
const fsEntryViewSchema = z.object({
    name: z.string(),
    path: z.string(),
    kind: z.enum(['file', 'dir']),
    size: z.number().optional(),
});
const officeBlockSchema = z.union([
    z.object({ type: z.enum(['h1', 'h2', 'h3', 'p', 'li']), text: z.string() }),
    z.object({ type: z.literal('table'), rows: z.array(z.array(z.string())) }),
]);
const officePreviewSchema = z.object({
    kind: z.enum(['docx', 'xlsx']),
    blocks: z.array(officeBlockSchema),
    truncated: z.boolean(),
});
const balanceInfoSchema = z.object({
    currency: z.string(),
    totalBalance: z.number(),
    grantedBalance: z.number(),
    toppedUpBalance: z.number(),
});
const balanceViewSchema = z.object({
    isAvailable: z.boolean(),
    infos: z.array(balanceInfoSchema),
    cachedAt: z.number(),
    error: apiErrorSchema.optional(),
});
/**
 * Build one direct-method descriptor taking a single `request` object.
 * @param method - gateway method name (also the wire method).
 * @param requestTypeSymbol - type symbol of the request payload.
 * @param resultTypeSymbol - type symbol of the result payload.
 * @param resultSchema - strict result validation schema.
 * @returns the descriptor.
 */
function unary(method, requestTypeSymbol, resultTypeSymbol, resultSchema) {
    return {
        id: `dsh-web-enhanced#webEnhanced/${method}`,
        service: 'webEnhanced',
        namespace: 'webEnhanced',
        method,
        invocation: { kind: 'direct' },
        parameters: [{
                name: 'request',
                wire: 'request',
                source: 'json',
                codec: jsonCodec(TYPES + requestTypeSymbol),
            }],
        result: { mode: 'strict', typeSymbol: TYPES + resultTypeSymbol, schema: resultSchema },
    };
}
/**
 * Build one direct-method descriptor taking no parameters.
 * @param method - gateway method name (also the wire method).
 * @param resultTypeSymbol - type symbol of the result payload.
 * @param resultSchema - strict result validation schema.
 * @returns the descriptor.
 */
function nullary(method, resultTypeSymbol, resultSchema) {
    return {
        id: `dsh-web-enhanced#webEnhanced/${method}`,
        service: 'webEnhanced',
        namespace: 'webEnhanced',
        method,
        invocation: { kind: 'direct' },
        parameters: [],
        result: { mode: 'strict', typeSymbol: TYPES + resultTypeSymbol, schema: resultSchema },
    };
}
/** The contribution mounted by the client half. */
export const webEnhancedRemote = {
    package: 'dsh-web-enhanced',
    descriptors: [
        nullary('taskList', 'TaskListResult', okOrError(z.object({ tasks: z.array(taskRecordSchema) }))),
        unary('taskCreate', 'TaskCreateRequest', 'TaskCreateResult', okOrError(z.object({ task: taskRecordSchema }))),
        unary('taskUpdate', 'TaskUpdateRequest', 'TaskUpdateResult', okOrError(z.object({ task: taskRecordSchema }))),
        unary('taskRemove', 'TaskRemoveRequest', 'TaskRemoveResult', okOrError(z.object({ removed: z.boolean() }))),
        unary('taskRun', 'TaskRunRequest', 'TaskRunResult', okOrError(z.object({
            started: z.boolean(),
            sessionId: z.string().nullable(),
        }))),
        nullary('balanceGet', 'BalanceView', balanceViewSchema),
        unary('gitBranches', 'GitBranchesRequest', 'GitBranchesResult', okOrError(z.object({ branches: z.array(gitBranchViewSchema) }))),
        unary('gitLog', 'GitLogRequest', 'GitLogResult', okOrError(z.object({ commits: z.array(gitCommitViewSchema) }))),
        unary('gitCheckout', 'GitCheckoutRequest', 'GitCheckoutResult', okOrError(gitOkSchema)),
        unary('gitStatus', 'GitStatusRequest', 'GitStatusResult', okOrError(z.object({ entries: z.array(gitStatusEntrySchema) }))),
        unary('gitDiff', 'GitDiffRequest', 'GitDiffResult', okOrError(z.object({ text: z.string() }))),
        unary('gitStage', 'GitMutateRequest', 'GitMutateResult', okOrError(gitOkSchema)),
        unary('gitUnstage', 'GitMutateRequest', 'GitMutateResult', okOrError(gitOkSchema)),
        unary('gitDiscard', 'GitMutateRequest', 'GitMutateResult', okOrError(gitOkSchema)),
        unary('fsList', 'FsListRequest', 'FsListResult', okOrError(z.object({ entries: z.array(fsEntryViewSchema) }))),
        unary('fsSearch', 'FsSearchRequest', 'FsSearchResult', okOrError(z.object({ entries: z.array(fsEntryViewSchema) }))),
        unary('fsRead', 'FsReadRequest', 'FsReadResult', z.union([
            z.object({
                kind: z.enum(['text', 'binary']),
                content: z.string(),
                truncated: z.boolean(),
                size: z.number(),
            }),
            z.object({ error: apiErrorSchema }),
        ])),
        unary('fsWrite', 'FsWriteRequest', 'FsWriteResult', okOrError(z.object({ ok: z.boolean() }))),
        unary('fsDelete', 'FsDeleteRequest', 'FsWriteResult', okOrError(z.object({ ok: z.boolean() }))),
        unary('fsOfficePreview', 'FsOfficePreviewRequest', 'FsOfficePreviewResult', okOrError(officePreviewSchema)),
    ],
};
