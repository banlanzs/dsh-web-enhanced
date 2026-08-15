/**
 * Task board: the five status columns, the create form, and the refresh
 * cadence. Two surfaces share the same panel — the full-frame overlay and the
 * workspace view's「任务看板」tab — so the data/logic lives in {@link
 * BoardPanel} and the two wrappers own only their chrome.
 *
 * A running task settles on the host (the agent session finishes and the
 * record is written back), so the board polls WHILE it shows a running task
 * and stops as soon as none is left — the status change has no push channel
 * to this plugin, and a permanent timer would poll an idle board forever.
 * @module dsh-web-enhanced/src/client/board/BoardOverlay
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { TaskRecord, TaskStatus, TaskUpdateRequest, WebEnhancedProps } from '../contract.ts'
import { errorMessageOf } from '../result.ts'
import { OverlayShell } from '../shell/OverlayShell.tsx'
import { TaskCard } from './TaskCard.tsx'
import css from './BoardOverlay.module.css'

/** Full composed props of the board overlay. */
export type BoardOverlayProps = WebEnhancedProps<'shell.overlay'>

/** Poll interval while at least one task is running, in milliseconds. */
const RUNNING_POLL_MS = 2_000

/** The five columns, left to right, with their dictionary keys. */
const COLUMNS: ReadonlyArray<{ status: TaskStatus; key: 'board.column.planned' | 'board.column.todo' | 'board.column.running' | 'board.column.done' | 'board.column.failed' }> = [
  { status: 'planned', key: 'board.column.planned' },
  { status: 'todo', key: 'board.column.todo' },
  { status: 'running', key: 'board.column.running' },
  { status: 'done', key: 'board.column.done' },
  { status: 'failed', key: 'board.column.failed' },
]

/** What the chrome-free panel needs from its host surface. */
export interface BoardPanelProps {
  readonly remote: WebEnhancedProps<'shell.overlay'>['remote']
  readonly workspaces: readonly { workspaceId: string; title: string }[]
  readonly openSession: (sessionId: string) => void
  readonly t: WebEnhancedProps<'shell.overlay'>['t']
}

/** The chrome-free board: error strip, create form, and the five columns. */
export function BoardPanel({ remote, workspaces, openSession, t }: BoardPanelProps) {
  const [tasks, setTasks] = useState<readonly TaskRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const live = useRef(true)
  useEffect(() => () => { live.current = false }, [])

  const reload = useCallback(async (): Promise<void> => {
    const result = await remote.taskList()
    if (!live.current) return
    if ('error' in result) {
      setError(result.error.message)
      return
    }
    setError(null)
    setTasks(result.tasks)
  }, [remote])

  // The panel is mounted only while visible, so mount = open.
  useEffect(() => { void reload() }, [reload])

  const anyRunning = tasks.some(task => task.status === 'running')
  useEffect(() => {
    if (!anyRunning) return
    const timer = setInterval(() => { void reload() }, RUNNING_POLL_MS)
    return () => { clearInterval(timer) }
  }, [anyRunning, reload])

  /** Run one host mutation and refresh; failures land in the banner. */
  const mutate = useCallback(async (call: Promise<unknown>): Promise<void> => {
    const result = await call
    if (!live.current) return
    const message = errorMessageOf(result)
    if (message !== undefined) {
      setError(message)
      return
    }
    await reload()
  }, [reload])

  return (
    <div className={css.panel} data-testid="board-panel">
      <div className={css.toolbar}>
        <button type="button" className={css.action} data-testid="board-create-toggle" onClick={() => { setCreating(value => !value) }}>
          {t('board.create')}
        </button>
      </div>
      {error !== null && <p className={css.error} data-testid="board-error">{t('board.error', { message: error })}</p>}
      {creating && (
        <CreateForm
          workspaces={workspaces}
          t={t}
          onCancel={() => { setCreating(false) }}
          onCreate={(request) => {
            setCreating(false)
            void mutate(remote.taskCreate(request))
          }}
        />
      )}
      <div className={css.columns} data-testid="board-columns">
        {COLUMNS.map((column) => {
          const items = tasks.filter(task => task.status === column.status)
          return (
            <section className={css.column} key={column.status} data-column={column.status}>
              <h3 className={css.columnTitle}>
                {t(column.key)}
                <span className={css.count}>{items.length}</span>
              </h3>
              {items.length === 0
                ? <p className={css.empty}>{t('board.empty')}</p>
                : (
                    <ul className={css.cards}>
                      {items.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          workspaces={workspaces}
                          t={t}
                          onRun={(target) => { void mutate(remote.taskRun({ id: target.id })) }}
                          onOpen={openSession}
                          onRemove={(target) => { void mutate(remote.taskRemove({ id: target.id })) }}
                          onUpdate={(request: TaskUpdateRequest) => { void mutate(remote.taskUpdate(request)) }}
                        />
                      ))}
                    </ul>
                  )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

/** The task board overlay: the same panel under the full-frame chrome. */
export function BoardOverlay({
  useOverlay, useWorkspaces, remote, openSession, closeOverlay, t,
}: BoardOverlayProps) {
  const open = useOverlay(state => state.open === 'board')
  const workspaces = useWorkspaces(state => state.items)
  if (!open) return null
  return (
    <OverlayShell title={t('board.title')} closeLabel={t('board.close')} onClose={closeOverlay} testId="board-overlay" fill>
      <BoardPanel remote={remote} workspaces={workspaces} openSession={openSession} t={t} />
    </OverlayShell>
  )
}

/** Props of the create form. */
interface CreateFormProps {
  readonly workspaces: readonly { workspaceId: string; title: string }[]
  readonly t: BoardPanelProps['t']
  readonly onCancel: () => void
  readonly onCreate: (request: { title: string; prompt: string; cron?: string; workspaceId?: string | null }) => void
}

/** Inline create form: title, prompt, optional cron, optional project. */
function CreateForm({ workspaces, t, onCancel, onCreate }: CreateFormProps) {
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [cron, setCron] = useState('')
  const [workspaceId, setWorkspaceId] = useState('')
  const ready = title.trim() !== '' && prompt.trim() !== ''

  return (
    <form
      className={css.form}
      data-testid="board-create-form"
      onSubmit={(event) => {
        event.preventDefault()
        if (!ready) return
        const trimmedCron = cron.trim()
        onCreate({
          title,
          prompt,
          ...(trimmedCron === '' ? {} : { cron: trimmedCron }),
          ...(workspaceId === '' ? {} : { workspaceId }),
        })
      }}
    >
      <label className={css.field}>
        <span className={css.fieldLabel}>{t('board.form.title')}</span>
        <input
          className={css.input}
          value={title}
          placeholder={t('board.form.titlePlaceholder')}
          data-testid="board-form-title"
          onChange={event => { setTitle(event.target.value) }}
        />
      </label>
      <label className={css.field}>
        <span className={css.fieldLabel}>{t('board.form.prompt')}</span>
        <textarea
          className={css.textarea}
          value={prompt}
          rows={3}
          placeholder={t('board.form.promptPlaceholder')}
          data-testid="board-form-prompt"
          onChange={event => { setPrompt(event.target.value) }}
        />
      </label>
      <label className={css.field}>
        <span className={css.fieldLabel}>{t('board.form.cron')}</span>
        <input
          className={css.input}
          value={cron}
          placeholder={t('board.form.cronPlaceholder')}
          data-testid="board-form-cron"
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
      <div className={css.formActions}>
        <button type="submit" className={css.primary} disabled={!ready} data-testid="board-form-submit">
          {t('board.form.submit')}
        </button>
        <button type="button" className={css.action} onClick={onCancel}>{t('board.form.cancel')}</button>
      </div>
    </form>
  )
}
