/**
 * Zod record schema for the web-enhanced task domain. Lives outside
 * `types.ts` (which is types-only) so the storage-domain spec can project
 * the same schema to the durable boundary.
 * @module dsh-web-enhanced/src/schemas
 */
import { z } from 'zod';
/** Durable task record schema; validates every stored record at load and write. */
export const taskRecordSchema = z.object({
    id: z.string(),
    title: z.string().min(1),
    prompt: z.string().min(1),
    status: z.enum(['planned', 'todo', 'running', 'done', 'failed']),
    cron: z.string().nullable(),
    nextRunAt: z.number().nullable(),
    workspaceId: z.string().nullable(),
    sessionId: z.string().nullable(),
    result: z.object({
        reasonKind: z.enum(['completed', 'error', 'interrupted']).optional(),
        summary: z.string().optional(),
        errorCode: z.string().optional(),
        errorMessage: z.string().optional(),
    }).nullable(),
    createdAt: z.number(),
    updatedAt: z.number(),
    lastRunAt: z.number().nullable(),
});
