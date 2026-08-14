import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * One task card on the board. Owns its own edit form, so opening an editor on
 * one card cannot disturb the others, and reports every mutation upward — the
 * board owns the task list and the refresh cadence.
 * @module dsh-web-enhanced/src/client/board/TaskCard
 */
import { useState } from 'react';
import css from './TaskCard.module.css';
/** Local timestamp text, or an em dash when the instant is absent. */
function timeOf(at) {
    return at === null ? '—' : new Date(at).toLocaleString();
}
/** One task card: summary, schedule, outcome, and the actions for its column. */
export function TaskCard({ task, workspaces, t, onRun, onOpen, onRemove, onUpdate }) {
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(task.title);
    const [prompt, setPrompt] = useState(task.prompt);
    const [cron, setCron] = useState(task.cron ?? '');
    const [workspaceId, setWorkspaceId] = useState(task.workspaceId ?? '');
    const running = task.status === 'running';
    const submit = () => {
        onUpdate({
            id: task.id,
            title,
            prompt,
            cron: cron.trim() === '' ? null : cron.trim(),
            workspaceId: workspaceId === '' ? null : workspaceId,
        });
        setEditing(false);
    };
    if (editing) {
        return (_jsxs("li", { className: css.card, "data-testid": "task-card-editing", children: [_jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('board.form.title') }), _jsx("input", { className: css.input, value: title, onChange: event => { setTitle(event.target.value); } })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('board.form.prompt') }), _jsx("textarea", { className: css.textarea, value: prompt, rows: 3, onChange: event => { setPrompt(event.target.value); } })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('board.form.cron') }), _jsx("input", { className: css.input, value: cron, placeholder: t('board.form.cronPlaceholder'), onChange: event => { setCron(event.target.value); } }), _jsx("span", { className: css.hint, children: t('board.form.cronHint') })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('board.form.workspace') }), _jsxs("select", { className: css.input, value: workspaceId, onChange: event => { setWorkspaceId(event.target.value); }, children: [_jsx("option", { value: "", children: t('board.form.workspaceNone') }), workspaces.map(workspace => (_jsx("option", { value: workspace.workspaceId, children: workspace.title }, workspace.workspaceId)))] })] }), _jsxs("div", { className: css.actions, children: [_jsx("button", { type: "button", className: css.primary, onClick: submit, children: t('board.action.save') }), _jsx("button", { type: "button", className: css.action, onClick: () => { setEditing(false); }, children: t('board.form.cancel') })] })] }));
    }
    return (_jsxs("li", { className: css.card, "data-testid": "task-card", "data-status": task.status, children: [_jsx("h4", { className: css.title, children: task.title }), _jsx("p", { className: css.prompt, children: task.prompt }), _jsxs("dl", { className: css.meta, children: [task.cron !== null && _jsx("div", { className: css.metaRow, children: t('board.meta.cron', { cron: task.cron }) }), task.nextRunAt !== null && _jsx("div", { className: css.metaRow, children: t('board.meta.nextRun', { time: timeOf(task.nextRunAt) }) }), _jsx("div", { className: css.metaRow, children: task.lastRunAt === null
                            ? t('board.meta.noSession')
                            : t('board.meta.lastRun', { time: timeOf(task.lastRunAt) }) })] }), task.result !== null && (_jsx("p", { className: task.result.errorMessage === undefined ? css.result : css.resultError, children: task.result.errorMessage === undefined
                    ? `${t('board.result.summary')}: ${task.result.summary ?? '—'}`
                    : t('board.result.error', { message: task.result.errorMessage }) })), _jsxs("div", { className: css.actions, children: [!running && (_jsx("button", { type: "button", className: css.primary, "data-testid": "task-run", onClick: () => { onRun(task); }, children: t('board.action.run') })), task.sessionId !== null && (_jsx("button", { type: "button", className: css.action, "data-testid": "task-open-session", onClick: () => { onOpen(task.sessionId); }, children: t('board.action.open') })), !running && (_jsxs(_Fragment, { children: [task.status === 'planned' && (_jsx("button", { type: "button", className: css.action, onClick: () => { onUpdate({ id: task.id, status: 'todo' }); }, children: t('board.action.toTodo') })), task.status === 'todo' && (_jsx("button", { type: "button", className: css.action, onClick: () => { onUpdate({ id: task.id, status: 'planned' }); }, children: t('board.action.toPlanned') })), _jsx("button", { type: "button", className: css.action, onClick: () => { setEditing(true); }, children: t('board.action.edit') }), _jsx("button", { type: "button", className: css.danger, "data-testid": "task-remove", onClick: () => { onRemove(task); }, children: t('board.action.remove') })] }))] })] }));
}
