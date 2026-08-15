/**
 * Filesystem browsing outside the workspace.
 *
 * Every other fs capability of this plugin is workspace-scoped and refuses
 * absolute paths — that guard is what keeps file READS inside the project. A
 * mention is a different need: the path the user wants may sit anywhere on the
 * host, and what the composer receives is a STRING, not the bytes. So this
 * module lists directories anywhere and returns nothing but names, kinds, and
 * sizes; reading, writing, and previewing stay behind the workspace root.
 * @module dsh-web-enhanced/src/browse
 */
import { readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
/**
 * List one absolute directory: subdirectories first, then files, each
 * name-sorted.
 * @param path - absolute directory; omitted or blank lists the host home.
 * @param limits - entry cap.
 * @returns the level, its parent, and the host home for rooting.
 * @throws when the path does not exist or is not a directory.
 */
export async function browseDirectory(path, limits) {
    const home = homedir();
    const target = path === undefined || path.trim() === '' ? home : resolve(path);
    if (!(await stat(target)).isDirectory()) {
        throw new Error(`'${target}' is not a directory`);
    }
    const dirents = await readdir(target, { withFileTypes: true });
    const dirs = [];
    const files = [];
    let truncated = false;
    for (const dirent of dirents) {
        if (dirs.length + files.length >= limits.maxEntries) {
            truncated = true;
            break;
        }
        const full = join(target, dirent.name);
        if (dirent.isDirectory()) {
            dirs.push({ name: dirent.name, path: full, kind: 'dir' });
            continue;
        }
        // A symlink reports neither directory nor file until it is followed; an
        // unreadable or dangling one is simply skipped rather than failing the level.
        if (!dirent.isFile() && !dirent.isSymbolicLink())
            continue;
        let size;
        try {
            const stats = await stat(full);
            if (stats.isDirectory()) {
                dirs.push({ name: dirent.name, path: full, kind: 'dir' });
                continue;
            }
            size = stats.size;
        }
        catch {
            // A vanished or unreadable entry still exists as a name to mention.
        }
        files.push({ name: dirent.name, path: full, kind: 'file', ...size === undefined ? {} : { size } });
    }
    const byName = (left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0;
    dirs.sort(byName);
    files.sort(byName);
    const parent = dirname(target);
    return {
        path: target,
        // At a filesystem root `dirname` returns the path itself, which would
        // render an "up" affordance that goes nowhere.
        parent: parent === target ? null : parent,
        home,
        entries: [...dirs, ...files],
        truncated,
    };
}
