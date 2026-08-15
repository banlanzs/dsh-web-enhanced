import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Task board overlay: the five status columns, the create form, and the
 * refresh cadence. Registered into `shell.overlay`; the sidebar entry only
 * flips the shared overlay state.
 *
 * A running task settles on the host (the agent session finishes and the
 * record is written back), so the board polls WHILE it shows a running task
 * and stops as soon as none is left — the status change has no push channel
 * to this plugin, and a permanent timer would poll an idle board forever.
 * @module dsh-web-enhanced/src/client/board/BoardOverlay
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessageOf } from "../result.js";
import { OverlayShell } from "../shell/OverlayShell.js";
import { TaskCard } from "./TaskCard.js";
import css from './BoardOverlay.module.css';
/** Poll interval while at least one task is running, in milliseconds. */
const RUNNING_POLL_MS = 2_000;
/** The five columns, left to right, with their dictionary keys. */
const COLUMNS = [
    { status: 'planned', key: 'board.column.planned' },
    { status: 'todo', key: 'board.column.todo' },
    { status: 'running', key: 'board.column.running' },
    { status: 'done', key: 'board.column.done' },
    { status: 'failed', key: 'board.column.failed' },
];
/** The task board overlay. */
export function BoardOverlay({ useOverlay, useWorkspaces, remote, openSession, closeOverlay, t, }) {
    const open = useOverlay(state => state.open === 'board');
    const workspaces = useWorkspaces(state => state.items);
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState(null);
    const [creating, setCreating] = useState(false);
    const live = useRef(true);
    useEffect(() => () => { live.current = false; }, []);
    const reload = useCallback(async () => {
        const result = await remote.taskList();
        if (!live.current)
            return;
        if ('error' in result) {
            setError(result.error.message);
            return;
        }
        setError(null);
        setTasks(result.tasks);
    }, [remote]);
    useEffect(() => {
        if (open)
            void reload();
    }, [open, reload]);
    const anyRunning = tasks.some(task => task.status === 'running');
    useEffect(() => {
        if (!open || !anyRunning)
            return;
        const timer = setInterval(() => { void reload(); }, RUNNING_POLL_MS);
        return () => { clearInterval(timer); };
    }, [anyRunning, open, reload]);
    /** Run one host mutation and refresh; failures land in the banner. */
    const mutate = useCallback(async (call) => {
        const result = await call;
        if (!live.current)
            return;
        const message = errorMessageOf(result);
        if (message !== undefined) {
            setError(message);
            return;
        }
        await reload();
    }, [reload]);
    if (!open)
        return null;
    return (_jsxs(OverlayShell, { title: t('board.title'), closeLabel: t('board.close'), onClose: closeOverlay, testId: "board-overlay", fill: true, actions: (_jsx("button", { type: "button", className: css.action, "data-testid": "board-create-toggle", onClick: () => { setCreating(value => !value); }, children: t('board.create') })), children: [error !== null && _jsx("p", { className: css.error, "data-testid": "board-error", children: t('board.error', { message: error }) }), creating && (_jsx(CreateForm, { workspaces: workspaces, t: t, onCancel: () => { setCreating(false); }, onCreate: (request) => {
                    setCreating(false);
                    void mutate(remote.taskCreate(request));
                } })), _jsx("div", { className: css.columns, "data-testid": "board-columns", children: COLUMNS.map((column) => {
                    const items = tasks.filter(task => task.status === column.status);
                    return (_jsxs("section", { className: css.column, "data-column": column.status, children: [_jsxs("h3", { className: css.columnTitle, children: [t(column.key), _jsx("span", { className: css.count, children: items.length })] }), items.length === 0
                                ? _jsx("p", { className: css.empty, children: t('board.empty') })
                                : (_jsx("ul", { className: css.cards, children: items.map(task => (_jsx(TaskCard, { task: task, workspaces: workspaces, t: t, onRun: (target) => { void mutate(remote.taskRun({ id: target.id })); }, onOpen: openSession, onRemove: (target) => { void mutate(remote.taskRemove({ id: target.id })); }, onUpdate: (request) => { void mutate(remote.taskUpdate(request)); } }, task.id))) }))] }, column.status));
                }) })] }));
}
/** Inline create form: title, prompt, optional cron, optional project. */
function CreateForm({ workspaces, t, onCancel, onCreate }) {
    const [title, setTitle] = useState('');
    const [prompt, setPrompt] = useState('');
    const [cron, setCron] = useState('');
    const [workspaceId, setWorkspaceId] = useState('');
    const ready = title.trim() !== '' && prompt.trim() !== '';
    return (_jsxs("form", { className: css.form, "data-testid": "board-create-form", onSubmit: (event) => {
            event.preventDefault();
            if (!ready)
                return;
            const trimmedCron = cron.trim();
            onCreate({
                title,
                prompt,
                ...(trimmedCron === '' ? {} : { cron: trimmedCron }),
                ...(workspaceId === '' ? {} : { workspaceId }),
            });
        }, children: [_jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('board.form.title') }), _jsx("input", { className: css.input, value: title, placeholder: t('board.form.titlePlaceholder'), "data-testid": "board-form-title", onChange: event => { setTitle(event.target.value); } })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('board.form.prompt') }), _jsx("textarea", { className: css.textarea, value: prompt, rows: 3, placeholder: t('board.form.promptPlaceholder'), "data-testid": "board-form-prompt", onChange: event => { setPrompt(event.target.value); } })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('board.form.cron') }), _jsx("input", { className: css.input, value: cron, placeholder: t('board.form.cronPlaceholder'), "data-testid": "board-form-cron", onChange: event => { setCron(event.target.value); } }), _jsx("span", { className: css.hint, children: t('board.form.cronHint') })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('board.form.workspace') }), _jsxs("select", { className: css.input, value: workspaceId, onChange: event => { setWorkspaceId(event.target.value); }, children: [_jsx("option", { value: "", children: t('board.form.workspaceNone') }), workspaces.map(workspace => (_jsx("option", { value: workspace.workspaceId, children: workspace.title }, workspace.workspaceId)))] })] }), _jsxs("div", { className: css.formActions, children: [_jsx("button", { type: "submit", className: css.primary, disabled: !ready, "data-testid": "board-form-submit", children: t('board.form.submit') }), _jsx("button", { type: "button", className: css.action, onClick: onCancel, children: t('board.form.cancel') })] })] }));
}
