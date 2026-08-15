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
import { readFile, realpath, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
/** Package name of this plugin, used to recognize its own inventory row. */
export const SELF_PACKAGE = 'dsh-web-enhanced';
/**
 * Read and parse a JSON file, or undefined when it is absent or malformed.
 * @param path - absolute file path.
 * @returns the parsed value, or undefined.
 */
async function readJson(path) {
    try {
        const parsed = JSON.parse(await readFile(path, 'utf8'));
        return typeof parsed === 'object' && parsed !== null ? parsed : undefined;
    }
    catch {
        return undefined;
    }
}
/**
 * Whether a manifest declares a profile bundle list.
 * @param manifest - a parsed package.json.
 * @returns true when `dsh.profile` is present.
 */
function isProfileManifest(manifest) {
    const dsh = manifest['dsh'];
    return typeof dsh === 'object' && dsh !== null && 'profile' in dsh;
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
export async function findProfileDir(from) {
    let dir = from ?? dirname(fileURLToPath(import.meta.url));
    // Bounded rather than while(true): a symlink cycle would otherwise spin.
    for (let depth = 0; depth < 40; depth += 1) {
        const manifest = await readJson(join(dir, 'package.json'));
        if (manifest !== undefined && isProfileManifest(manifest))
            return dir;
        const parent = dirname(dir);
        if (parent === dir)
            return undefined;
        dir = parent;
    }
    return undefined;
}
/**
 * Read a profile's manifest.
 * @param profileDir - absolute profile directory.
 * @returns the manifest.
 * @throws when the manifest is missing or unreadable.
 */
export async function readProfileManifest(profileDir) {
    const manifest = await readJson(join(profileDir, 'package.json'));
    if (manifest === undefined)
        throw new Error(`profile manifest unreadable at ${profileDir}`);
    return manifest;
}
/**
 * Write a profile's manifest back, preserving npm's two-space formatting.
 * @param profileDir - absolute profile directory.
 * @param manifest - the manifest to serialize.
 */
export async function writeProfileManifest(profileDir, manifest) {
    await writeFile(join(profileDir, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}
/**
 * Read one installed dependency's manifest from the profile's `node_modules`.
 *
 * The direct path is used rather than `require.resolve`: pnpm links every
 * direct dependency at `<profile>/node_modules/<name>`, while many packages'
 * `exports` maps refuse to expose `package.json` at all.
 * @param profileDir - absolute profile directory.
 * @param packageName - the dependency name.
 * @returns the installed manifest, or undefined when not materialized.
 */
async function readInstalled(profileDir, packageName) {
    return readJson(join(profileDir, 'node_modules', ...packageName.split('/'), 'package.json'));
}
/**
 * Whether an installed dependency exports a profile patch, i.e. is a bundle.
 *
 * Mirrors the CLI's own test, and for the same reason: the layer list follows
 * INSTALLED state, so a package that only gained its `dsh.bundle` declaration
 * in a newer version joins the stack on update.
 * @param manifest - the installed package manifest, when materialized.
 * @returns true when it declares `dsh.bundle.patch`.
 */
function declaresBundle(manifest) {
    if (manifest === undefined)
        return false;
    const dsh = manifest['dsh'];
    if (typeof dsh !== 'object' || dsh === null)
        return false;
    const bundle = dsh['bundle'];
    if (typeof bundle !== 'object' || bundle === null)
        return false;
    return bundle['patch'] !== undefined;
}
/**
 * Resolve the directory of the package this module belongs to, canonicalized.
 *
 * Used to recognize this plugin's own inventory row by IDENTITY rather than by
 * name, so an alias install (`pnpm add mine@github:…`) is still recognized as
 * self and does not offer a silent self-removal.
 * @returns the canonical package directory, or undefined when unresolvable.
 */
async function selfPackageDir() {
    let dir = dirname(fileURLToPath(import.meta.url));
    for (let depth = 0; depth < 10; depth += 1) {
        const manifest = await readJson(join(dir, 'package.json'));
        if (manifest !== undefined && typeof manifest['name'] === 'string') {
            try {
                return await realpath(dir);
            }
            catch {
                return dir;
            }
        }
        const parent = dirname(dir);
        if (parent === dir)
            return undefined;
        dir = parent;
    }
    return undefined;
}
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
export async function readInventory(profileDir) {
    const manifest = await readProfileManifest(profileDir);
    const dependencies = manifest.dependencies ?? {};
    const bundles = manifest.dsh?.profile?.bundles ?? [];
    const selfDir = await selfPackageDir();
    const names = Object.keys(dependencies);
    const plugins = await Promise.all(names.map(async (name) => {
        const installed = await readInstalled(profileDir, name);
        let self = false;
        if (selfDir !== undefined) {
            try {
                self = await realpath(join(profileDir, 'node_modules', ...name.split('/'))) === selfDir;
            }
            catch {
                self = false;
            }
        }
        const description = installed?.['description'];
        const version = installed?.['version'];
        return {
            name,
            spec: dependencies[name] ?? '',
            version: typeof version === 'string' ? version : null,
            description: typeof description === 'string' ? description : null,
            bundle: declaresBundle(installed),
            active: bundles.includes(name),
            self,
        };
    }));
    return {
        dir: profileDir,
        name: profileDir.split(/[/\\]/u).filter(segment => segment !== '').pop() ?? profileDir,
        plugins,
        templateBundles: bundles.filter(name => !(name in dependencies)),
    };
}
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
export async function reconcileBundles(profileDir, beforeDependencies) {
    const manifest = await readProfileManifest(profileDir);
    const dependencies = Object.keys(manifest.dependencies ?? {});
    const dependencySet = new Set(dependencies);
    const beforeSet = new Set(beforeDependencies);
    const bundles = [...manifest.dsh?.profile?.bundles ?? []];
    const added = [];
    const removed = [];
    const isBundle = new Map();
    await Promise.all(dependencies.map(async (name) => {
        isBundle.set(name, declaresBundle(await readInstalled(profileDir, name)));
    }));
    for (const name of dependencies) {
        if (isBundle.get(name) === true && !bundles.includes(name)) {
            bundles.push(name);
            added.push(name);
        }
    }
    for (const name of [...bundles]) {
        // Only dependency-managed entries are removable; a template bundle is in
        // the list precisely because nothing depends on it.
        const wasDependency = beforeSet.has(name) || dependencySet.has(name);
        const stillBundle = dependencySet.has(name) && isBundle.get(name) === true;
        if (wasDependency && !stillBundle) {
            bundles.splice(bundles.indexOf(name), 1);
            removed.push(name);
        }
    }
    if (added.length === 0 && removed.length === 0)
        return { added, removed };
    manifest.dsh = { ...manifest.dsh, profile: { ...manifest.dsh?.profile, bundles } };
    await writeProfileManifest(profileDir, manifest);
    return { added, removed };
}
/**
 * Validate a package name before it becomes a pnpm argument.
 *
 * The name reaches a spawned process as one argv entry, so it can never become
 * two — but it could still become an OPTION, or address a package the caller
 * did not name. Only what npm itself accepts as a name passes.
 * @param name - the candidate package name.
 * @throws when the name is not a plain npm package name.
 */
export function assertPackageName(name) {
    if (name === '')
        throw new Error('package name must not be empty');
    if (name.length > 214)
        throw new Error('package name is too long');
    if (!/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/u.test(name)) {
        throw new Error(`'${name}' is not a plain npm package name`);
    }
}
/**
 * Resolve a path under a profile the caller already located.
 * @param profileDir - absolute profile directory.
 * @param segments - path segments.
 * @returns the joined absolute path.
 */
export function profilePath(profileDir, ...segments) {
    return resolve(profileDir, ...segments);
}
