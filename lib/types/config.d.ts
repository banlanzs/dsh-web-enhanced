/**
 * The plugin config, assembled from the per-domain config fragments.
 *
 * Each domain module owns the fields it consumes and exports its fragment
 * (type + zod piece + resolve piece) together, so adding one option touches
 * one module instead of the three mirrored copies that used to live in the
 * gateway. This module only sums them up; the defaults are identical to the
 * former single-site definitions.
 * @module dsh-web-enhanced/src/config
 */
import z from '@deepseek-ai/schemastery';
import type { BoardConfigInput } from './board.ts';
import type { FilesConfigInput } from './files-gateway.ts';
import type { GitConfigInput } from './git-gateway.ts';
import type { ModelConfigInput } from './model-gateway.ts';
import type { PluginsConfigInput } from './plugins-gateway.ts';
import type { VisionConfigInput } from './vision-gateway.ts';
/** Plugin config; every bound defaults when unset. */
export interface Config extends BoardConfigInput, ModelConfigInput, FilesConfigInput, GitConfigInput, PluginsConfigInput, VisionConfigInput {
}
/**
 * The plugin schema.
 *
 * Fragment order is the field order the Settings form renders. It follows the
 * pre-split declaration order domain by domain; the only difference is that
 * the three git caps now sit together after the files caps instead of between
 * them, because each domain owns one contiguous slice.
 */
export declare const Config: z<Config>;
/** Field defaults applied when the gateway is constructed directly. */
export declare function resolveConfig(config: Config): Required<Config>;
