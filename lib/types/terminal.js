/**
 * Interactive terminal sessions for the workspace drawer: one registry of live
 * PTYs owned by this plugin, each fed to zero or more attached browser sinks.
 *
 * The sessions sit on `ctx.subprocess.spawnTerminal` rather than the host's
 * `ctx.terminals` registry for three reasons: that registry sanitizes CSI/OSC
 * out of its output (which would strip color and break every full-screen
 * program), it scopes every session to an exact live `Agent` (these belong to
 * the person at the browser, not to a model turn), and its packages are not in
 * the web profile's default bundle. The subprocess seam delivers raw terminal
 * bytes and leaves session lifetime to its caller, which is what a terminal
 * emulator needs.
 *
 * Sessions outlive their sockets: a reload re-attaches by id and replays the
 * retained scrollback, so a `cd` or a running dev server survives it. They do
 * not outlive the process — nothing is persisted to disk.
 * @module dsh-web-enhanced/src/terminal
 */
/**
 * Newest-bounded terminal scrollback.
 *
 * Chunks are dropped whole from the front once the byte bound is exceeded, so
 * a replay can begin mid-escape-sequence; terminal emulators discard an
 * incomplete sequence, which is the same thing a real scrollback does.
 */
class Scrollback {
    maxBytes;
    chunks = [];
    bytes = 0;
    constructor(maxBytes) {
        this.maxBytes = maxBytes;
    }
    /**
     * Append one chunk, dropping oldest chunks past the bound.
     * @param text - decoded output chunk.
     */
    append(text) {
        this.chunks.push(text);
        this.bytes += Buffer.byteLength(text);
        // Keep the newest chunk even when it alone exceeds the bound: dropping it
        // would replay an empty terminal for one oversized write.
        while (this.bytes > this.maxBytes && this.chunks.length > 1) {
            this.bytes -= Buffer.byteLength(this.chunks.shift());
        }
    }
    /**
     * The retained text in chronological order.
     * @returns everything currently retained.
     */
    read() {
        return this.chunks.join('');
    }
}
/**
 * Pick the interactive shell for this platform.
 *
 * No `--norc`/`--noprofile`: the point of this terminal is the person's own
 * environment, aliases and prompt included.
 * @param configured - configured shell path; empty selects the default.
 * @returns the executable to spawn.
 */
export function resolveShell(configured) {
    if (configured !== '')
        return configured;
    if (process.platform === 'win32')
        return process.env['COMSPEC'] ?? 'powershell.exe';
    return process.env['SHELL'] ?? '/bin/bash';
}
/**
 * Live terminal sessions of one plugin instance.
 *
 * Every session is terminated when the registry is disposed, so unloading the
 * plugin never leaves an orphan shell behind.
 */
export class TerminalRegistry {
    subprocess;
    limits;
    records = new Map();
    nextId = 0;
    disposed = false;
    /**
     * @param subprocess - resolves the process substrate that allocates PTYs.
     * Read per spawn rather than captured: the seam is an injected service, and
     * resolving it while the gateway is still being constructed would require it
     * of every deployment, including those that never open a terminal.
     * @param limits - retention, grace, and shell selection.
     */
    constructor(subprocess, limits) {
        this.subprocess = subprocess;
        this.limits = limits;
    }
    /**
     * Allocate one PTY rooted at a workspace directory.
     *
     * `cols`/`rows` are fixed for the session's life: the subprocess seam
     * allocates the terminal at spawn and exposes no resize.
     * @param workspaceId - owning workspace, echoed back in listings.
     * @param cwd - absolute directory to start the shell in.
     * @param cols - initial terminal column count.
     * @param rows - initial terminal row count.
     * @returns the created session's view.
     * @throws when the registry is disposed or the substrate refuses the spawn.
     */
    async spawn(workspaceId, cwd, cols, rows) {
        if (this.disposed)
            throw new Error('terminal registry is disposed');
        const shell = resolveShell(this.limits.shell);
        const handle = await this.subprocess().spawnTerminal({
            argv: [shell],
            cwd,
            // xterm.js renders 256 colors and true color; without this the shell
            // sees whatever the host process inherited, often nothing or `dumb`.
            env: { TERM: 'xterm-256color', COLORTERM: 'truecolor' },
            rows,
            cols,
            graceMs: this.limits.graceMs,
        });
        const id = `term-${++this.nextId}`;
        const record = {
            id,
            workspaceId,
            title: shell.split(/[/\\]/u).pop() ?? shell,
            handle,
            scrollback: new Scrollback(this.limits.scrollbackMaxBytes),
            sinks: new Set(),
            createdAt: Date.now(),
            cols,
            rows,
            running: true,
            exit: undefined,
        };
        // Decoding here rather than per sink keeps one multi-byte carry for the
        // stream: a UTF-8 character split across two PTY writes must not be split
        // again per attached browser.
        handle.output.setEncoding('utf8');
        handle.output.on('data', (chunk) => {
            record.scrollback.append(chunk);
            for (const sink of record.sinks)
                sink.send(chunk);
        });
        void handle.done.then(outcome => { this.settle(record, outcome.exitCode, outcome.signal); }, () => { this.settle(record, null, null); });
        this.records.set(id, record);
        return this.viewOf(record);
    }
    /**
     * Attach one sink, replaying the retained scrollback first.
     * @param terminalId - session to attach to.
     * @param sink - receiver of replay and subsequent output.
     * @returns a detach function, or undefined when the id is unknown.
     */
    attach(terminalId, sink) {
        const record = this.records.get(terminalId);
        if (record === undefined)
            return undefined;
        const replay = record.scrollback.read();
        if (replay !== '')
            sink.send(replay);
        if (!record.running) {
            sink.exit(record.exit?.exitCode ?? null, record.exit?.signal ?? null);
            return () => { };
        }
        record.sinks.add(sink);
        return () => { record.sinks.delete(sink); };
    }
    /**
     * Forward input to a session's PTY.
     * @param terminalId - target session.
     * @param data - text to write without implicit newline conversion.
     * @returns true when the session existed and was running.
     */
    async write(terminalId, data) {
        const record = this.records.get(terminalId);
        if (record === undefined || !record.running)
            return false;
        await record.handle.write(data);
        return true;
    }
    /**
     * Deliver a signal to a session's foreground process group.
     * @param terminalId - target session.
     * @param signal - permitted terminal signal.
     * @returns true when the signal reached a foreground group.
     */
    async signal(terminalId, signal) {
        const record = this.records.get(terminalId);
        if (record === undefined || !record.running)
            return false;
        await record.handle.signalForeground(signal);
        return true;
    }
    /**
     * Terminate one session's process tree and forget it.
     * @param terminalId - target session.
     * @returns true when a record was removed.
     */
    async close(terminalId) {
        const record = this.records.get(terminalId);
        if (record === undefined)
            return false;
        this.records.delete(terminalId);
        await record.handle.terminate();
        this.settle(record, record.exit?.exitCode ?? null, record.exit?.signal ?? null);
        return true;
    }
    /**
     * Sessions of one workspace, oldest first.
     * @param workspaceId - workspace to list.
     * @returns the matching session views.
     */
    list(workspaceId) {
        return [...this.records.values()]
            .filter(record => record.workspaceId === workspaceId)
            .map(record => this.viewOf(record));
    }
    /** Terminate every session; the registry refuses further spawns afterwards. */
    async disposeAll() {
        this.disposed = true;
        const records = [...this.records.values()];
        this.records.clear();
        await Promise.all(records.map(async (record) => {
            // One failed teardown must not strand the rest; the substrate already
            // logs its own transport faults.
            try {
                await record.handle.terminate();
            }
            catch {
                // Terminating an already-dead tree is the expected race here.
            }
            this.settle(record, record.exit?.exitCode ?? null, record.exit?.signal ?? null);
        }));
    }
    /** Mark a session dead once and tell everyone watching. */
    settle(record, exitCode, signal) {
        if (!record.running)
            return;
        record.running = false;
        record.exit = { exitCode, signal };
        for (const sink of record.sinks)
            sink.exit(exitCode, signal);
        record.sinks.clear();
    }
    viewOf(record) {
        return {
            id: record.id,
            workspaceId: record.workspaceId,
            title: record.title,
            pid: record.handle.pid,
            running: record.running,
            createdAt: record.createdAt,
            cols: record.cols,
            rows: record.rows,
        };
    }
}
/**
 * Install a terminal registry whose sessions end with the owning context.
 * @param ctx - context whose disposal terminates every session.
 * @param subprocess - resolves the process substrate that allocates PTYs.
 * @param limits - retention, grace, and shell selection.
 * @returns the registry.
 */
export function createTerminalRegistry(ctx, subprocess, limits) {
    const registry = new TerminalRegistry(subprocess, limits);
    ctx.effect(() => () => { void registry.disposeAll(); }, 'web-enhanced: terminal sessions');
    return registry;
}
