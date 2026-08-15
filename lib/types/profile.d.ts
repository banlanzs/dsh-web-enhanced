/**
 * The profile this plugin is installed into: locating it, reading its plugin
 * inventory, and reconciling its bundle layer list.
 *
 * A dsh profile is an ordinary npm package directory under `$DSH_HOME/profiles/`
 * whose `package.json` carries a `dsh.profile.bundles` list. `dsh plugin` is a
 * thin pnpm forwarder over that directory, so managing plugins from inside the
 * running host is the same two steps the CLI performs: run pnpm there, then
 * rewrite the layer list from the INSTALLED state.
 *
 * Nothing here imports `@deepseek-ai/dsh-app-boot`, which owns these routines
 * for the CLI. That package is a dependency of the dsh installation, not of the
 * profile — a plugin peer-depending on it would fail to resolve in exactly the
 * deployment this code runs in. The manifest shape is a stable on-disk contract,
 * so it is read directly instead.
 * @module dsh-web-enhanced/src/profile
 */
/** Package name of this plugin, used to recognize its own inventory row. */
export declare const SELF_PACKAGE = "dsh-web-enhanced";
/** A profile manifest, in the fields this plugin reads and writes. */
export interface ProfileManifest {
    name?: string;
    dependencies?: Record<string, string>;
    dsh?: {
        profile?: {
            bundles?: string[];
        };
        bundle?: {
            patch?: string;
        };
    };
    [key: string]: unknown;
}
/** One installed plugin as the management surface sees it. */
export interface PluginRow {
    /** Package name — the key in `dependencies`, and what pnpm is given. */
    readonly name: string;
    /** The dependency spec as written (`github:owner/repo`, `^1.2.3`, …). */
    readonly spec: string;
    /** Installed version, or null when the package is not materialized. */
    readonly version: string | null;
    /** Short description from the installed manifest, when it carries one. */
    readonly description: string | null;
    /** Whether the installed package declares `dsh.bundle` (i.e. is a layer). */
    readonly bundle: boolean;
    /** Whether the layer list currently carries it. */
    readonly active: boolean;
    /** True for the row that is this very plugin — removing it unloads this UI. */
    readonly self: boolean;
}
/** The profile's plugin inventory. */
export interface ProfileInventory {
    /** Absolute profile directory. */
    readonly dir: string;
    /** Profile name (its directory basename). */
    readonly name: string;
    /** Dependency-managed plugins, in manifest order. */
    readonly plugins: readonly PluginRow[];
    /**
     * Layers that are not dependencies — the profile template's own bundles
     * (`@deepseek-ai/dsh-base` and friends). They cannot be removed by pnpm
     * because nothing depends on them; they are reported for orientation only.
     */
    readonly templateBundles: readonly string[];
}
/**
 * Locate the profile directory containing this module.
 *
 * The search walks up from the module's own location rather than consulting
 * `$DSH_HOME`: a plugin is loaded FROM the profile that installed it, so its
 * path is the authority on which profile it belongs to, and a host launched
 * with a non-default home or an unusual profile name still resolves correctly.
 * A deployment that loads this plugin from outside any profile (a source
 * checkout, a test) simply has no profile, and the management surface degrades.
 * @param from - starting directory; defaults to this module's directory.
 * @returns the profile directory, or undefined when none is above it.
 */
export declare function findProfileDir(from?: string): Promise<string | undefined>;
/**
 * Read a profile's manifest.
 * @param profileDir - absolute profile directory.
 * @returns the manifest.
 * @throws when the manifest is missing or unreadable.
 */
export declare function readProfileManifest(profileDir: string): Promise<ProfileManifest>;
/**
 * Write a profile's manifest back, preserving npm's two-space formatting.
 * @param profileDir - absolute profile directory.
 * @param manifest - the manifest to serialize.
 */
export declare function writeProfileManifest(profileDir: string, manifest: ProfileManifest): Promise<void>;
/**
 * Project a profile's manifest and installed state into the plugin inventory.
 *
 * Only `dependencies` are listed: those are what `dsh plugin add` writes and
 * what pnpm can remove. Template bundles appear in the layer list without being
 * dependencies, so they are reported separately and never offered for removal.
 * @param profileDir - absolute profile directory.
 * @returns the inventory.
 * @throws when the profile manifest cannot be read.
 */
export declare function readInventory(profileDir: string): Promise<ProfileInventory>;
/**
 * Reconcile `dsh.profile.bundles` against the installed state.
 *
 * This is the half of `dsh plugin` that is not pnpm, reimplemented to the same
 * rule: a dependency resolving to a `dsh.bundle`-declaring package joins the
 * layer stack; a dependency-managed name that no longer resolves to one leaves
 * it. Template bundles are not dependencies and are never touched — removing
 * `@deepseek-ai/dsh-base` from the list would unmount the deployment.
 * @param profileDir - absolute profile directory.
 * @param beforeDependencies - dependency names as they were BEFORE pnpm ran.
 * @returns the layer names added and removed.
 */
export declare function reconcileBundles(profileDir: string, beforeDependencies: readonly string[]): Promise<{
    readonly added: readonly string[];
    readonly removed: readonly string[];
}>;
/**
 * Validate a package name before it becomes a pnpm argument.
 *
 * The name reaches a spawned process as one argv entry, so it can never become
 * two — but it could still become an OPTION, or address a package the caller
 * did not name. Only what npm itself accepts as a name passes.
 * @param name - the candidate package name.
 * @throws when the name is not a plain npm package name.
 */
export declare function assertPackageName(name: string): void;
/**
 * Resolve a path under a profile the caller already located.
 * @param profileDir - absolute profile directory.
 * @param segments - path segments.
 * @returns the joined absolute path.
 */
export declare function profilePath(profileDir: string, ...segments: string[]): string;
