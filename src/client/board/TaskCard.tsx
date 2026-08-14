/**
 * One task card on the board. Owns its own edit form, so opening an editor on
 * one card cannot disturb the others, and reports every mutation upward — the
 * board owns the task list and the refresh cadence.
 * @module dsh-web-enhanced/src/client/board/TaskCard
 */

import { useState } from 'react'
import type { WorkspaceView } from '@deepseek-ai/dsh-client-runtime/client'
import type { TaskRecord, TaskUpdateRequest } from '../contract.ts'
import type { Translate } from '../locale-keys.ts'
import css from './TaskCard.module.css'

/** Props of one task card. */
export interface TaskCardProps {
  readonly task: TaskRecord
  readonly workspaces: readonly WorkspaceView[]
  readonly t: Translate
  /** Start the task now. */
  readonly onRun: (task: TaskRecord) => void
  /** Make the task's run session current. */
  readonly onOpen: (sessionId: string) => void
  /** Delete the task. */
  readonly onRemove: (task: TaskRecord) => void
  /** Apply an edit (title, prompt, cron, column, or workspace). */
  readonly onUpdate: (request: TaskUpdateRequest) => void
}

/** Local timestamp text, or an em dash when the instant is absent. */
function timeOf(at: number | null): string {
  return at === null ? '—' : new Date(at).toLocaleString()
}

/** One task card: summary, schedule, outcome, and the actions for its column. */
export function TaskCard({ task, workspaces, t, onRun, onOpen, onRemove, onUpdate }: TaskCardProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [prompt, setPrompt] = useState(task.prompt)
  const [cron, setCron] = useState(task.cron ?? '')
  const [workspaceId, setWorkspaceId] = useState(task.workspaceId ?? '')

  const running = task.status === 'running'

  const submit = (): void => {
    onUpdate({
      id: task.id,
      title,
      prompt,
      cron: cron.trim() === '' ? null : cron.trim(),
      workspaceId: workspaceId === '' ? null : workspaceId,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <li className={css.card} data-testid="task-card-editing">
        <label className={css.field}>
          <span className={css.fieldLabel}>{t('board.form.title')}</span>
          <input className={css.input} value={title} onChange={event => { setTitle(event.target.value) }} />
        </label>
        <label className={css.field}>
          <span className={css.fieldLabel}>{t('board.form.prompt')}</span>
          <textarea className={css.textarea} value={prompt} rows={3} onChange={event => { setPrompt(event.target.value) }} />
        </label>
        <label className={css.field}>
          <span className={css.fieldLabel}>{t('board.form.cron')}</span>
          <input
            className={css.input}
            value={cron}
            placeholder={t('board.form.cronPlaceholder')}
            onChange={event => { setCron(event.target.value) }}
          />
          <span className={css.hint}>{t('board.form.cronHint')}</span>
        </label>
        <label className={css.field}>
          <span className={css.fieldLabel}>{t('board.form.workspace')}</span>
          <select className={css.input} value={workspaceId} onChange={event => { setWorkspaceId(event.target.value) }}>
            <option value="">{t('board.form.workspaceNone')}</option>
            {workspaces.map(workspace => (
              <option key={workspace.workspaceId} value={workspace.workspaceId}>{workspace.title}</option>
            ))}
          </select>
        </label>
        <div className={css.actions}>
          <button type="button" className={css.primary} onClick={submit}>{t('board.action.save')}</button>
          <button type="button" className={css.action} onClick={() => { setEditing(false) }}>{t('board.form.cancel')}</button>
        </div>
      </li>
    )
  }

  return (
    <li className={css.card} data-testid="task-card" data-status={task.status}>
      <h4 className={css.title}>{task.title}</h4>
      <p className={css.prompt}>{task.prompt}</p>
      <dl className={css.meta}>
        {task.cron !== null && <div className={css.metaRow}>{t('board.meta.cron', { cron: task.cron })}</div>}
        {task.nextRunAt !== null && <div className={css.metaRow}>{t('board.meta.nextRun', { time: timeOf(task.nextRunAt) })}</div>}
        <div className={css.metaRow}>
          {task.lastRunAt === null
            ? t('board.meta.noSession')
            : t('board.meta.lastRun', { time: timeOf(task.lastRunAt) })}
        </div>
      </dl>
      {task.result !== null && (
        <p className={task.result.errorMessage === undefined ? css.result : css.resultError}>
          {task.result.errorMessage === undefined
            ? `${t('board.result.summary')}: ${task.result.summary ?? '—'}`
            : t('board.result.error', { message: task.result.errorMessage })}
        </p>
      )}
      <div className={css.actions}>
        {!running && (
          <button type="button" className={css.primary} data-testid="task-run" onClick={() => { onRun(task) }}>
            {t('board.action.run')}
          </button>
        )}
        {task.sessionId !== null && (
          <button
            type="button"
            className={css.action}
            data-testid="task-open-session"
            onClick={() => { onOpen(task.sessionId!) }}
          >
            {t('board.action.open')}
          </button>
        )}
        {/* A running task is immutable on the host, so editing and deleting
            are withheld rather than offered and rejected. */}
        {!running && (
          <>
            {task.status === 'planned' && (
              <button type="button" className={css.action} onClick={() => { onUpdate({ id: task.id, status: 'todo' }) }}>
                {t('board.action.toTodo')}
              </button>
            )}
            {task.status === 'todo' && (
              <button type="button" className={css.action} onClick={() => { onUpdate({ id: task.id, status: 'planned' }) }}>
                {t('board.action.toPlanned')}
              </button>
            )}
            <button type="button" className={css.action} onClick={() => { setEditing(true) }}>
              {t('board.action.edit')}
            </button>
            <button type="button" className={css.danger} data-testid="task-remove" onClick={() => { onRemove(task) }}>
              {t('board.action.remove')}
            </button>
          </>
        )}
      </div>
    </li>
  )
}
