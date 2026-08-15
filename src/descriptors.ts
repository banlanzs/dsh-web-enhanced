/**
 * The Typert invocation descriptors of this plugin — one authority shared by
 * both halves.
 *
 * The host half registers these through `ctx.typert.register()` and the client
 * half mounts the same list as its Remote contribution, so the two sides
 * cannot drift on parameter arity or result schemas.
 *
 * Registering explicitly is not optional here. The Gateway's other discovery
 * path (SRC mode) reads the `@Remote` markers out of dsh-typert-protocol's
 * PRIVATE MODULE STATE, which only works when the plugin and the host resolve
 * that package to the same file. A globally installed `dsh` CLI carries its
 * own copy under its own node_modules, while an installed plugin resolves to
 * the profile's copy — two instances, no shared markers, and the Gateway's
 * `claimsEndpoint` then refuses every endpoint, so each call falls through to
 * the SPA route and answers 404. Descriptors registered here live in the
 * `ctx.typert.local` registry instead: a Cordis service, reached through the
 * context, immune to how the module specifier resolved.
 *
 * Parameter arity is a wire contract: the Gateway maps `parameters`
 * positionally onto the host method (`Reflect.apply`) and both halves reject a
 * mismatched argument count, so a descriptor's parameter list IS the host
 * method's signature. Every method here declares exactly one `request`
 * parameter, matching the one request object each gateway method takes.
 * @module dsh-web-enhanced/src/descriptors
 */

import { z } from 'zod'
import type { InvocationDescriptor, TypertCodec } from '@deepseek-ai/dsh-typert-protocol'

/** Wire namespace and Cordis service key of the gateway. */
export const WEB_ENHANCED_NAMESPACE = 'webEnhanced'

/** Package identity carried by both contributions. */
export const WEB_ENHANCED_PACKAGE = 'dsh-web-enhanced'

/** Type symbol prefix of this plugin's payload module. */
const TYPES = 'dsh-web-enhanced/types#'

/** Strict codec whose schema accepts any plain JSON value (parameters). */
function jsonCodec(typeSymbol: string): TypertCodec {
  return { mode: 'strict', typeSymbol, schema: z.any() }
}

const apiErrorSchema = z.object({ code: z.string(), message: z.string() })

/** Union of one success payload and the ApiError branch. */
function okOrError(schema: z.ZodType): z.ZodType {
  return z.union([schema, z.object({ error: apiErrorSchema })])
}

const taskResultSchema = z.object({
  reasonKind: z.enum(['completed', 'error', 'interrupted']).optional(),
  summary: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
})

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
})

const gitBranchViewSchema = z.object({ name: z.string(), current: z.boolean() })

const gitCommitViewSchema = z.object({
  hash: z.string(),
  parents: z.array(z.string()),
  refs: z.array(z.string()),
  author: z.string(),
  date: z.number(),
  subject: z.string(),
})

const gitCommitDetailSchema = z.object({
  hash: z.string(),
  parents: z.array(z.string()),
  author: z.string(),
  email: z.string(),
  date: z.number(),
  subject: z.string(),
  body: z.string(),
  files: z.array(z.object({
    path: z.string(),
    added: z.number().nullable(),
    removed: z.number().nullable(),
  })),
})

const gitWorkingSchema = z.object({
  head: z.string(),
  files: z.array(z.object({
    path: z.string(),
    state: z.enum(['staged', 'unstaged', 'untracked']),
    added: z.number().nullable(),
    removed: z.number().nullable(),
  })),
  staged: z.number(),
  unstaged: z.number(),
  untracked: z.number(),
  truncated: z.boolean(),
})

const gitStatusEntrySchema = z.object({
  path: z.string(),
  origPath: z.string().optional(),
  staged: z.string(),
  unstaged: z.string(),
})

const gitOkSchema = z.object({ ok: z.boolean(), message: z.string().optional() })

const fsEntryViewSchema = z.object({
  name: z.string(),
  path: z.string(),
  kind: z.enum(['file', 'dir']),
  size: z.number().optional(),
})

const officeBlockSchema = z.union([
  z.object({ type: z.enum(['h1', 'h2', 'h3', 'p', 'li']), text: z.string() }),
  z.object({ type: z.literal('table'), rows: z.array(z.array(z.string())) }),
])

const officePreviewSchema = z.object({
  kind: z.enum(['docx', 'xlsx']),
  blocks: z.array(officeBlockSchema),
  truncated: z.boolean(),
})

const balanceInfoSchema = z.object({
  currency: z.string(),
  totalBalance: z.number(),
  grantedBalance: z.number(),
  toppedUpBalance: z.number(),
})

const balanceViewSchema = z.object({
  applicable: z.boolean(),
  isAvailable: z.boolean(),
  infos: z.array(balanceInfoSchema),
  cachedAt: z.number(),
  error: apiErrorSchema.optional(),
})

const pluginViewSchema = z.object({
  name: z.string(),
  spec: z.string(),
  version: z.string().nullable(),
  description: z.string().nullable(),
  bundle: z.boolean(),
  active: z.boolean(),
  self: z.boolean(),
})

const pluginListSchema = z.object({
  profileDir: z.string(),
  profileName: z.string(),
  plugins: z.array(pluginViewSchema),
  templateBundles: z.array(z.string()),
  busy: z.boolean(),
})

const pluginMutateSchema = z.object({
  ok: z.boolean(),
  added: z.array(z.string()),
  removed: z.array(z.string()),
  restartRequired: z.boolean(),
  output: z.string(),
})

/**
 * Build one direct-method descriptor taking a single `request` object.
 * @param method - gateway method name (also the wire method).
 * @param requestTypeSymbol - type symbol of the request payload.
 * @param resultTypeSymbol - type symbol of the result payload.
 * @param resultSchema - strict result validation schema.
 * @returns the descriptor.
 */
function unary(
  method: string,
  requestTypeSymbol: string,
  resultTypeSymbol: string,
  resultSchema: z.ZodType,
): InvocationDescriptor {
  return {
    id: `${WEB_ENHANCED_PACKAGE}#${WEB_ENHANCED_NAMESPACE}/${method}`,
    service: WEB_ENHANCED_NAMESPACE,
    namespace: WEB_ENHANCED_NAMESPACE,
    method,
    invocation: { kind: 'direct' },
    parameters: [{
      name: 'request',
      wire: 'request',
      source: 'json',
      codec: jsonCodec(TYPES + requestTypeSymbol),
    }],
    result: { mode: 'strict', typeSymbol: TYPES + resultTypeSymbol, schema: resultSchema },
  }
}

/**
 * Build one direct-method descriptor taking no parameters.
 * @param method - gateway method name (also the wire method).
 * @param resultTypeSymbol - type symbol of the result payload.
 * @param resultSchema - strict result validation schema.
 * @returns the descriptor.
 */
function nullary(
  method: string,
  resultTypeSymbol: string,
  resultSchema: z.ZodType,
): InvocationDescriptor {
  return {
    id: `${WEB_ENHANCED_PACKAGE}#${WEB_ENHANCED_NAMESPACE}/${method}`,
    service: WEB_ENHANCED_NAMESPACE,
    namespace: WEB_ENHANCED_NAMESPACE,
    method,
    invocation: { kind: 'direct' },
    parameters: [],
    result: { mode: 'strict', typeSymbol: TYPES + resultTypeSymbol, schema: resultSchema },
  }
}

/** Every invocation this plugin exposes, in gateway declaration order. */
export const WEB_ENHANCED_DESCRIPTORS: readonly InvocationDescriptor[] = [
  nullary('taskList', 'TaskListResult', okOrError(z.object({ tasks: z.array(taskRecordSchema) }))),
  unary('taskCreate', 'TaskCreateRequest', 'TaskCreateResult', okOrError(z.object({ task: taskRecordSchema }))),
  unary('taskUpdate', 'TaskUpdateRequest', 'TaskUpdateResult', okOrError(z.object({ task: taskRecordSchema }))),
  unary('taskRemove', 'TaskRemoveRequest', 'TaskRemoveResult', okOrError(z.object({ removed: z.boolean() }))),
  unary('taskRun', 'TaskRunRequest', 'TaskRunResult', okOrError(z.object({
    started: z.boolean(),
    sessionId: z.string().nullable(),
  }))),
  unary('balanceGet', 'BalanceGetRequest', 'BalanceView', balanceViewSchema),
  unary('gitBranches', 'GitBranchesRequest', 'GitBranchesResult', okOrError(z.object({ branches: z.array(gitBranchViewSchema) }))),
  unary('gitLog', 'GitLogRequest', 'GitLogResult', okOrError(z.object({ commits: z.array(gitCommitViewSchema) }))),
  unary('gitCommit', 'GitCommitRequest', 'GitCommitResult', okOrError(z.object({ commit: gitCommitDetailSchema }))),
  unary('gitWorking', 'GitWorkingRequest', 'GitWorkingResult', okOrError(z.object({ working: gitWorkingSchema }))),
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
  unary('fsBrowse', 'FsBrowseRequest', 'FsBrowseResult', okOrError(z.object({
    path: z.string(),
    parent: z.string().nullable(),
    home: z.string(),
    roots: z.array(z.string()),
    entries: z.array(z.object({
      name: z.string(),
      path: z.string(),
      kind: z.enum(['file', 'dir']),
      size: z.number().optional(),
    })),
    truncated: z.boolean(),
  }))),
  unary('pluginList', 'PluginListRequest', 'PluginListResult', okOrError(pluginListSchema)),
  unary('pluginRemove', 'PluginMutateRequest', 'PluginMutateResult', okOrError(pluginMutateSchema)),
  unary('pluginUpdate', 'PluginMutateRequest', 'PluginMutateResult', okOrError(pluginMutateSchema)),
]
