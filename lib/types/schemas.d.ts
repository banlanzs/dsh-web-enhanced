/**
 * Zod record schema for the web-enhanced task domain. Lives outside
 * `types.ts` (which is types-only) so the storage-domain spec can project
 * the same schema to the durable boundary.
 * @module dsh-web-enhanced/src/schemas
 */
import { z } from 'zod';
/** Durable task record schema; validates every stored record at load and write. */
export declare const taskRecordSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    prompt: z.ZodString;
    status: z.ZodEnum<{
        planned: "planned";
        todo: "todo";
        running: "running";
        done: "done";
        failed: "failed";
    }>;
    cron: z.ZodNullable<z.ZodString>;
    nextRunAt: z.ZodNullable<z.ZodNumber>;
    workspaceId: z.ZodNullable<z.ZodString>;
    sessionId: z.ZodNullable<z.ZodString>;
    result: z.ZodNullable<z.ZodObject<{
        reasonKind: z.ZodOptional<z.ZodEnum<{
            completed: "completed";
            error: "error";
            interrupted: "interrupted";
        }>>;
        summary: z.ZodOptional<z.ZodString>;
        errorCode: z.ZodOptional<z.ZodString>;
        errorMessage: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
    lastRunAt: z.ZodNullable<z.ZodNumber>;
}, z.core.$strip>;
/** Durable memory record schema; validates every stored record at load and write. */
export declare const memoryRecordSchema: z.ZodObject<{
    id: z.ZodString;
    workspaceId: z.ZodNullable<z.ZodString>;
    kind: z.ZodEnum<{
        user: "user";
        feedback: "feedback";
        project: "project";
        reference: "reference";
    }>;
    summary: z.ZodString;
    body: z.ZodString;
    sourceSessionId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
}, z.core.$strip>;
