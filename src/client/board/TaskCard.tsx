/**
 * One task card on the board. Owns its own edit form, so opening an editor on
 * one card cannot disturb the others, and reports every mutation upward — the
 * board owns the task list and the refresh cadence.
 * @module dsh-web-enhanced/src/client/board/TaskCard
 */

import { memo, useState } from 'react'
import type { TaskRecord, TaskUpdateRequest } from '../contract.ts'
import type { Translate } from '../locale-keys.ts'
import css from './TaskCard.module.css'

/** The slice of a workspace row the card's project picker needs. */
export interface WorkspaceOption {
  readonly workspaceId: string
  readonly title: string
}

/** Props of one task card. */
export interface TaskCardProps {
  readonly task: TaskRecord
  readonly workspaces: readonly WorkspaceOption[]
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

/**
 * Whether a card starts collapsed.
 *
 * Only the done column. A finished task's prompt and result are what made the
 * column scroll for pages, and both are already history — but a FAILED task is
 * the opposite case: its message is the reason to look at the board at all, so
 * it stays open.
 * @param status - the task's column.
 * @returns true when the card collapses by default.
 */
export function collapsesByDefault(status: TaskRecord['status']): boolean {
  return status === 'done'
}

/**
 * One task card: summary, schedule, outcome, and the actions for its column.
 * Memoized: the board polls every {@link RUNNING_POLL_MS} while a task runs,
 * and a card whose task, callbacks, and dictionary seat did not move should
 * not re-render for it.
 */
export const TaskCard = memo(function TaskCard({ task, workspaces, t, onRun, onOpen, onRemove, onUpdate }: TaskCardProps) {
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [prompt, setPrompt] = useState(task.prompt)
  const [cron, setCron] = useState(task.cron ?? '')
  const [workspaceId, setWorkspaceId] = useState(task.workspaceId ?? '')

  const running = task.status === 'running'
  const collapsible = collapsesByDefault(task.status)
  const collapsed = collapsible && !expanded

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

  if (collapsed) {
    return (
      <li className={css.card} data-testid="task-card" data-status={task.status} data-collapsed="true">
        <button
          type="button"
          className={css.summary}
          aria-expanded={false}
          title={t('board.expand')}
          data-testid="task-expand"
          onClick={() => { setExpanded(true) }}
        >
          <span className={css.chevron} aria-hidden>▸</span>
          <span className={css.summaryTitle}>{task.title}</span>
          <span className={css.summaryTime}>{timeOf(task.lastRunAt)}</span>
        </button>
      </li>
    )
  }

  return (
    <li className={css.card} data-testid="task-card" data-status={task.status}>
      {collapsible
        ? (
            <button
              type="button"
              className={css.summary}
              aria-expanded
              title={t('board.collapse')}
              data-testid="task-collapse"
              onClick={() => { setExpanded(false) }}
            >
              <span className={css.chevron} aria-hidden>▾</span>
              <span className={css.summaryTitle}>{task.title}</span>
            </button>
          )
        : <h4 className={css.title}>{task.title}</h4>}
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
})
