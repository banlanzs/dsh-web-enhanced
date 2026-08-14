/**
 * dsh-web-enhanced plugin entry: mounts the web-enhanced gateway (task
 * board with cron scheduling, git, files, Office preview, and balance) as
 * one Typert namespace consumed by the browser half.
 * @module dsh-web-enhanced
 */
import type { Context } from '@deepseek-ai/cordis';
import { WebEnhancedGateway, Config } from './gateway.ts';
export { WebEnhancedGateway, Config };
/** Cordis plugin name (the loader row references the package, this is the entry name). */
export declare const name = "web-enhanced";
/** Core services the gateway and its scheduler require. */
export declare const inject: string[];
/** Mount the gateway and its scheduler. */
export declare function apply(ctx: Context, config?: Config): void;
