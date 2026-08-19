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
import { boardConfigFragment, resolveBoardConfig } from "./board.js";
import { filesConfigFragment, resolveFilesConfig } from "./files-gateway.js";
import { gitConfigFragment, resolveGitConfig } from "./git-gateway.js";
import { modelConfigFragment, resolveModelConfig } from "./model-gateway.js";
import { pluginsConfigFragment, resolvePluginsConfig } from "./plugins-gateway.js";
import { visionConfigFragment, resolveVisionConfig } from "./vision-gateway.js";
/**
 * The plugin schema.
 *
 * Fragment order is the field order the Settings form renders. It follows the
 * pre-split declaration order domain by domain; the only difference is that
 * the three git caps now sit together after the files caps instead of between
 * them, because each domain owns one contiguous slice.
 */
export const Config = z.object({
    ...boardConfigFragment.dict,
    ...modelConfigFragment.dict,
    ...filesConfigFragment.dict,
    ...gitConfigFragment.dict,
    ...pluginsConfigFragment.dict,
    ...visionConfigFragment.dict,
});
/** Field defaults applied when the gateway is constructed directly. */
export function resolveConfig(config) {
    return {
        ...resolveBoardConfig(config),
        ...resolveModelConfig(config),
        ...resolveFilesConfig(config),
        ...resolveGitConfig(config),
        ...resolvePluginsConfig(config),
        ...resolveVisionConfig(config),
    };
}
