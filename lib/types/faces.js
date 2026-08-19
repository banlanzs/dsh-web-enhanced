/**
 * Structural service faces shared by the gateway and every domain service.
 *
 * The host services these describe are the host's own dependencies, not this
 * plugin's: each face is declared structurally here (rather than imported)
 * and read through the untyped store accessor, so a deployment composed
 * without one still mounts the rest of the plugin.
 * @module dsh-web-enhanced/src/faces
 */
/**
 * The settings provider the config remotes read and write.
 *
 * Read uninjected: a deployment that composes no settings service still gets
 * a working gateway that reports `*-settings-unavailable` per remote.
 * @param ctx - the owning context.
 * @returns the settings service, or undefined when not composed.
 */
export function settingsFace(ctx) {
    return ctx.get('settings', false);
}
