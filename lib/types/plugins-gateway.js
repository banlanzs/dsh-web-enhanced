/**
 * Plugins domain service: the profile's plugin inventory and its mutations.
 *
 * The gateway delegates its plugin* methods here; this module owns the
 * profile-directory resolution cache, the lazy pnpm runner, and the plugins
 * slice of the plugin config. A deployment loaded from outside a profile
 * answers `no-profile` rather than an empty list — those are different facts,
 * and an empty list would invite a removal that cannot work.
 * @module dsh-web-enhanced/src/plugins-gateway
 */
import z from '@deepseek-ai/schemastery';
import { errorOf } from "./error.js";
import { PnpmRunner, pnpmFailureCode } from "./pnpm.js";
import { findProfileDir, readInventory } from "./profile.js";
/** The plugins config fragment, as the plugin schema assembles it. */
export const pluginsConfigFragment = z.object({
    pluginOpTimeoutMs: z.number().default(300_000),
    profileDir: z.string().default(''),
});
/** Field defaults applied when the plugins domain is assembled directly. */
export function resolvePluginsConfig(config) {
    return {
        pluginOpTimeoutMs: config.pluginOpTimeoutMs ?? 300_000,
        profileDir: config.profileDir ?? '',
    };
}
/** The error returned when this deployment sits outside any profile. */
function noProfile() {
    return {
        code: 'no-profile',
        message: 'this deployment does not load the plugin from a dsh profile, so there is nothing to manage',
    };
}
/**
 * Assemble the plugins domain.
 * @param deps - context, config, and the shared output cap.
 * @returns the plugin-management capabilities.
 */
export function createPluginsDomain(deps) {
    /** Resolved lazily: the walk is filesystem work no other capability needs. */
    let profileDirCache;
    /** Built on first mutation, so a deployment outside a profile never makes one. */
    let pnpm;
    /**
     * The profile directory, resolved once and cached.
     *
     * A profile cannot move under a running host, so a repeated walk would only
     * repeat the same filesystem reads. The promise itself is cached so
     * concurrent first callers share one walk. A configured path wins outright:
     * the walk is a heuristic over where the module happens to sit.
     */
    const profileDir = () => {
        if (deps.config.profileDir !== '')
            return Promise.resolve(deps.config.profileDir);
        profileDirCache ??= findProfileDir();
        return profileDirCache;
    };
    /**
     * Run one plugin mutation, guarding what pnpm itself would not.
     *
     * The refusal here is for a name pnpm cannot act on: a template bundle is in
     * the layer list precisely because nothing depends on it, so `pnpm remove`
     * would report success having done nothing. Removing the row that IS this
     * plugin is NOT refused — that is a legitimate thing to want, and the
     * `self` flag exists so the surface can confirm it rather than have the
     * domain decide on the user's behalf.
     * @param name - package name from the request.
     * @param operation - the runner call to perform.
     * @returns the mutation result.
     */
    const mutate = async (name, operation) => {
        try {
            const dir = await profileDir();
            if (dir === undefined)
                return { error: noProfile() };
            const inventory = await readInventory(dir);
            const row = inventory.plugins.find(plugin => plugin.name === name);
            if (row === undefined) {
                const template = inventory.templateBundles.includes(name);
                return {
                    error: {
                        code: template ? 'plugin-not-removable' : 'plugin-not-found',
                        message: template
                            ? `'${name}' is a profile template layer, not a dependency — it cannot be removed or updated by pnpm`
                            : `'${name}' is not a dependency of profile '${inventory.name}'`,
                    },
                };
            }
            pnpm ??= new PnpmRunner(deps.ctx.subprocess, dir, {
                timeoutMs: deps.config.pluginOpTimeoutMs,
                outputMaxBytes: deps.outputMaxBytes,
            });
            const { run, added, removed } = await operation(pnpm);
            const output = `${run.stdout}\n${run.stderr}`.trim();
            const failure = pnpmFailureCode(run);
            if (failure !== undefined) {
                return { ok: false, added, removed, restartRequired: false, output: output || failure };
            }
            // Always true on success: Cordis composed the layer stack at boot, so
            // what changed on disk describes the next start, not this process.
            return { ok: true, added, removed, restartRequired: true, output };
        }
        catch (error) {
            return { error: errorOf(error, 'plugin-operation') };
        }
    };
    return {
        profileDir,
        async list(_request) {
            try {
                const dir = await profileDir();
                if (dir === undefined)
                    return { error: noProfile() };
                const inventory = await readInventory(dir);
                return {
                    profileDir: inventory.dir,
                    profileName: inventory.name,
                    plugins: inventory.plugins,
                    templateBundles: inventory.templateBundles,
                    busy: pnpm?.running ?? false,
                };
            }
            catch (error) {
                return { error: errorOf(error, 'plugin-list') };
            }
        },
        remove: request => mutate(request.name, runner => runner.remove(request.name)),
        update: request => mutate(request.name, runner => runner.update(request.name)),
    };
}
