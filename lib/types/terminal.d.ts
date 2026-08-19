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
import type { Context } from '@deepseek-ai/cordis';
import type { SubprocessRuntime } from '@deepseek-ai/dsh-subprocess';
import type { TerminalSignalName, TerminalView } from './types.ts';
/** Bounds one terminal registry. */
export interface TerminalLimits {
    /** Retained scrollback per session, in bytes, replayed on attach. */
    readonly scrollbackMaxBytes: number;
    /** TERM-to-KILL grace handed to the subprocess seam for the session tree. */
    readonly graceMs: number;
    /** Shell executable; empty selects the platform default. */
    readonly shell: string;
}
/**
 * One attached browser view of a session. Implemented by the WebSocket layer;
 * kept abstract so the registry is testable without a socket.
 */
export interface TerminalSink {
    /**
     * Deliver one chunk of raw terminal output.
     * @param data - decoded UTF-8 terminal bytes.
     */
    send(data: string): void;
    /**
     * Report that the shell exited. No further `send` follows.
     * @param exitCode - process exit code, or null when signalled.
     * @param signal - terminating signal name, or null.
     */
    exit(exitCode: number | null, signal: string | null): void;
}
/**
 * Pick the interactive shell for this platform.
 *
 * No `--norc`/`--noprofile`: the point of this terminal is the person's own
 * environment, aliases and prompt included.
 * @param configured - configured shell path; empty selects the default.
 * @returns the executable to spawn.
 */
export declare function resolveShell(configured: string): string;
/**
 * Live terminal sessions of one plugin instance.
 *
 * Every session is terminated when the registry is disposed, so unloading the
 * plugin never leaves an orphan shell behind.
 */
export declare class TerminalRegistry {
    private readonly subprocess;
    private readonly limits;
    private readonly records;
    private nextId;
    private disposed;
    /**
     * @param subprocess - resolves the process substrate that allocates PTYs.
     * Read per spawn rather than captured: the seam is an injected service, and
     * resolving it while the gateway is still being constructed would require it
     * of every deployment, including those that never open a terminal.
     * @param limits - retention, grace, and shell selection.
     */
    constructor(subprocess: () => SubprocessRuntime, limits: TerminalLimits);
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
    spawn(workspaceId: string, cwd: string, cols: number, rows: number): Promise<TerminalView>;
    /**
     * Attach one sink, replaying the retained scrollback first.
     * @param terminalId - session to attach to.
     * @param sink - receiver of replay and subsequent output.
     * @returns a detach function, or undefined when the id is unknown.
     */
    attach(terminalId: string, sink: TerminalSink): (() => void) | undefined;
    /**
     * Forward input to a session's PTY.
     * @param terminalId - target session.
     * @param data - text to write without implicit newline conversion.
     * @returns true when the session existed and was running.
     */
    write(terminalId: string, data: string): Promise<boolean>;
    /**
     * Deliver a signal to a session's foreground process group.
     * @param terminalId - target session.
     * @param signal - permitted terminal signal.
     * @returns true when the signal reached a foreground group.
     */
    signal(terminalId: string, signal: TerminalSignalName): Promise<boolean>;
    /**
     * Terminate one session's process tree and forget it.
     * @param terminalId - target session.
     * @returns true when a record was removed.
     */
    close(terminalId: string): Promise<boolean>;
    /**
     * Sessions of one workspace, oldest first.
     * @param workspaceId - workspace to list.
     * @returns the matching session views.
     */
    list(workspaceId: string): TerminalView[];
    /** Terminate every session; the registry refuses further spawns afterwards. */
    disposeAll(): Promise<void>;
    /** Mark a session dead once and tell everyone watching. */
    private settle;
    private viewOf;
}
/**
 * Install a terminal registry whose sessions end with the owning context.
 * @param ctx - context whose disposal terminates every session.
 * @param subprocess - resolves the process substrate that allocates PTYs.
 * @param limits - retention, grace, and shell selection.
 * @returns the registry.
 */
export declare function createTerminalRegistry(ctx: Context, subprocess: () => SubprocessRuntime, limits: TerminalLimits): TerminalRegistry;
