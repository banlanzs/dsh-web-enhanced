import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The workspace's Terminal tab: a web front for the host's native PTY
 * registry. Sessions are owned by this conversation's live agent (cleanup
 * rides the agent), the initial working directory is the workspace root, and
 * every send returns the backend's settled viewport plus why control came
 * back (`stdin_read`, `inferred_idle`, `timeout`, `session_exit`) — the same
 * contract the model-facing terminal tools consume.
 *
 * The buffer is append-only: motd on open, each send's viewport, and the
 * newest scrollback page on reattach. Output rendering is plain text in a
 * `<pre>`; the backend has already rendered control sequences away.
 * @module dsh-web-enhanced/src/client/panel/TerminalPane
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import css from './TerminalPane.module.css';
/** The terminal pane. */
export function TerminalPane({ sessionId, workspaceId, remote, t }) {
    const [terminals, setTerminals] = useState([]);
    const [activeId, setActiveId] = useState(undefined);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const live = useRef(true);
    const endRef = useRef(null);
    useEffect(() => () => { live.current = false; }, []);
    // Reattach: list this conversation's live sessions and pull the newest
    // scrollback page for each, so a reopened tab shows real history.
    useEffect(() => {
        void (async () => {
            const result = await remote.terminalList({ ownerSessionId: sessionId });
            if (!live.current)
                return;
            if ('error' in result) {
                setError(result.error.message);
                return;
            }
            const states = [];
            for (const session of result.sessions) {
                const page = await remote.terminalRead({ ownerSessionId: sessionId, sessionId: session.sessionId });
                if (!live.current)
                    return;
                states.push({
                    id: session.sessionId,
                    ...session.name !== undefined ? { name: session.name } : {},
                    buffer: 'error' in page ? '' : page.text,
                    status: session.status,
                });
            }
            setTerminals(states);
            setActiveId(states[0]?.id);
        })();
    }, [remote, sessionId]);
    const active = terminals.find(entry => entry.id === activeId);
    // Keep the newest output in view.
    useEffect(() => {
        endRef.current?.scrollIntoView({ block: 'end' });
    }, [active?.buffer]);
    const patch = useCallback((id, update) => {
        setTerminals(current => current.map(entry => entry.id === id ? update(entry) : entry));
    }, []);
    const open = useCallback(async () => {
        setBusy(true);
        setError(null);
        const result = await remote.terminalOpen({ ownerSessionId: sessionId, workspaceId: workspaceId });
        if (!live.current)
            return;
        setBusy(false);
        if ('error' in result) {
            setError(result.error.message);
            return;
        }
        const { session, motd } = result;
        setTerminals(current => [...current, {
                id: session.sessionId,
                ...session.name !== undefined ? { name: session.name } : {},
                buffer: motd,
                status: session.status,
            }]);
        setActiveId(session.sessionId);
    }, [remote, sessionId, workspaceId]);
    const send = useCallback(async (text, submit) => {
        if (active === undefined || text === '')
            return;
        setBusy(true);
        const result = await remote.terminalSend({ ownerSessionId: sessionId, sessionId: active.id, text, submit });
        if (!live.current)
            return;
        setBusy(false);
        if ('error' in result) {
            setError(result.error.message);
            return;
        }
        setError(null);
        patch(active.id, entry => ({
            ...entry,
            buffer: entry.buffer + (submit ? `\n${text}\n` : text) + result.viewport,
            waitReason: result.waitReason,
            status: result.sessionStatus,
        }));
    }, [active, patch, remote, sessionId]);
    const interrupt = useCallback(async () => {
        if (active === undefined)
            return;
        const result = await remote.terminalSignal({ ownerSessionId: sessionId, sessionId: active.id, signal: 'SIGINT' });
        if (!live.current)
            return;
        if ('error' in result)
            setError(result.error.message);
    }, [active, remote, sessionId]);
    const close = useCallback(async (id) => {
        const result = await remote.terminalClose({ ownerSessionId: sessionId, sessionId: id });
        if (!live.current)
            return;
        if ('error' in result) {
            setError(result.error.message);
            return;
        }
        setTerminals(current => {
            const next = current.filter(entry => entry.id !== id);
            setActiveId(currentId => currentId === id ? next[0]?.id : currentId);
            return next;
        });
    }, [remote, sessionId]);
    return (_jsxs("div", { className: css.pane, "data-testid": "terminal-pane", children: [_jsxs("div", { className: css.toolbar, children: [_jsx("button", { type: "button", className: css.action, onClick: () => { void open(); }, disabled: busy, children: t('terminal.open') }), terminals.length > 1 && (_jsx("select", { className: css.select, value: activeId, "aria-label": t('terminal.select'), "data-testid": "terminal-select", onChange: event => { setActiveId(event.target.value); }, children: terminals.map(entry => (_jsx("option", { value: entry.id, children: entry.name ?? entry.id }, entry.id))) })), active !== undefined && (_jsxs(_Fragment, { children: [_jsx("span", { className: css.status, "data-testid": "terminal-status", "data-status": active.status.kind, children: active.status.kind === 'exited'
                                    ? t('terminal.exited', { code: String(active.status.exitCode ?? '?') })
                                    : t('terminal.running') }), _jsx("button", { type: "button", className: css.action, onClick: () => { void interrupt(); }, children: t('terminal.interrupt') }), _jsx("button", { type: "button", className: css.action, onClick: () => { void close(active.id); }, children: t('terminal.close') })] }))] }), error !== null && _jsx("p", { className: css.error, "data-testid": "terminal-error", children: error }), _jsxs("div", { className: css.body, children: [active === undefined
                        ? _jsx("p", { className: css.empty, children: t('terminal.empty') })
                        : (_jsxs("pre", { className: css.output, "data-testid": "terminal-output", children: [active.buffer, active.waitReason !== undefined && active.waitReason !== 'session_exit' && (_jsx("span", { className: css.wait, title: t(`terminal.wait.${active.waitReason}`), children: " \u23CE" }))] })), _jsx("div", { ref: endRef })] }), active !== undefined && (_jsxs("form", { className: css.inputRow, onSubmit: (event) => {
                    event.preventDefault();
                    const text = input;
                    setInput('');
                    void send(text, true);
                }, children: [_jsx("span", { className: css.prompt, "aria-hidden": "true", children: "$" }), _jsx("input", { className: css.input, value: input, placeholder: t('terminal.input'), "data-testid": "terminal-input", disabled: active.status.kind === 'exited' || busy, onChange: event => { setInput(event.target.value); } })] }))] }));
}
