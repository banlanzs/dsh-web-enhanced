/**
 * Tool-call collapse renderer.
 *
 * The host renders one `tool-call` chat node per ROOT tool invocation and
 * nests subcalls below it. That is already collapsed per row, but a long run
 * still fills the transcript with dozens of rows. This renderer shadows the
 * host `tool-call` entry at a lower priority and groups every root Tool call
 * that belongs to one agent step into a single disclosure row:
 *
 * - while the step is running the group stays expanded, so live Bash/Read/…
 *   rows keep streaming exactly as the host renders them (each root is still
 *   dispatched through the host's own `tool.call.toolview` slot);
 * - when every call in the step settles, the group auto-collapses to one
 *   `工具调用 · N 次` line, and the user can expand it again at any time.
 *
 * A loaded page therefore shows completed history compacted, while a live run
 * never hides its progress.
 * @module dsh-web-enhanced/src/client/tool-calls/CollapsedToolCalls
 */

import { memo, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { ChatNodeViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { PropsRenderSlots } from '@deepseek-ai/dsh-client-ui-slots'
import type { ChatSnapshot, ToolCallBlock, ToolResultNode } from '@deepseek-ai/dsh-client-runtime/client'
import { DisclosureRow, IconSparkle16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { Translate } from '../locale-keys.ts'
import css from './CollapsedToolCalls.module.css'

/** Full props of the shadowing tool-call renderer. */
export type CollapsedToolCallsProps =
  Omit<ChatNodeViewProps<'tool-call'>, 't'>
  & PropsRenderSlots<'tool.call.toolview'>
  & { readonly t: Translate }

/** One tool-call chat node (the keyed slot's owner currency). */
type ToolCallChatNode = ChatNodeViewProps<'tool-call'>['node']

/** Narrow a block to its settled result form (rc.6 RunningToolCall has no kind tag). */
export function isSettled(block: ToolCallBlock): block is ToolResultNode {
  return 'call' in block
}

/** Wire tool name of either lifecycle form. */
export function nameOf(block: ToolCallBlock): string {
  return isSettled(block) ? block.call?.name ?? '' : block.name
}

/** Count one call plus every nested subcall recursively. */
export function countCalls(block: ToolCallBlock): number {
  return 1 + block.subCalls.reduce((sum, child) => sum + countCalls(child), 0)
}

/** Flatten a settled result's text blocks into display text. */
export function resultText(block: ToolResultNode): string {
  const parts: string[] = []
  for (const item of block.content) {
    if (typeof item === 'object' && item !== null && 'type' in item && item.type === 'text' && typeof item.text === 'string') {
      parts.push(item.text)
    } else {
      try {
        parts.push(JSON.stringify(item, null, 2))
      } catch {
        parts.push(String(item))
      }
    }
  }
  if (parts.length === 0 && block.error !== undefined) parts.push(`${block.error.name}: ${block.error.code}`)
  return parts.join('\n')
}

/** First line of a potentially multi-line string. */
export function firstLine(text: string): string {
  const end = text.indexOf('\n')
  return end === -1 ? text : text.slice(0, end)
}

/** Filter one step/turn key list down to tool-call seats, with self fallback. */
export function orderedToolKeys(
  nodeKey: string,
  keys: readonly string[],
  kindOf: (key: string) => string | undefined,
): readonly string[] {
  const toolKeys = keys.filter(key => kindOf(key) === 'tool-call')
  return toolKeys.length > 0 ? toolKeys : [nodeKey]
}

/** Step/turn keys one tool-call node belongs to, falling back to itself. */
export function keysOf(node: ToolCallChatNode, chat: ChatSnapshot): readonly string[] {
  const location = node.location
  if (location.kind === 'step') {
    const keys = chat.locations.getStep(location.turn.turn, location.step.step)
    if (keys.length > 0) return keys
  }
  if (location.kind === 'turn') {
    const keys = chat.locations.getTurn(location.turn.turn)
    if (keys.length > 0) return keys
  }
  return [node.key]
}

/** Minimal fallback for tool names the host composition does not own. */
function FallbackToolRow({ toolName, block, t }: {
  readonly toolName: string
  readonly block: ToolCallBlock
  readonly t: Translate
}): ReactNode {
  const [open, setOpen] = useState(false)
  const running = !isSettled(block)
  const body = running ? block.argsRaw : resultText(block)
  const summary = running ? t('toolCalls.running') : body === '' ? t('toolCalls.noOutput') : firstLine(body)
  const title = toolName === 'think' ? t('toolCalls.think') : toolName === '' ? t('toolCalls.unknown') : toolName
  return (
    <DisclosureRow
      icon={<IconSparkle16 />}
      title={title}
      open={open}
      expandable={body !== ''}
      onToggle={() => { setOpen(value => !value) }}
      expandOnRowClick
      collapsedContent={<span className={css.fallbackSummary}>{summary}</span>}
      children={body === '' ? null : <pre className={css.fallbackBody}>{body}</pre>}
      className={css.fallbackRow}
    />
  )
}

/** Props of one recursive host-dispatched branch. */
interface HostBranchProps {
  readonly renderSlot: CollapsedToolCallsProps['renderSlot']
  readonly block: ToolCallBlock
  readonly selectedCallId: string | undefined
  readonly cwd: string | undefined
  readonly openFile: (path: string) => void
  readonly inspectCall: (callId: string) => void
  readonly t: Translate
}

/** One root call rendered through the host's keyed atomic tool views. */
function HostToolBranch({ renderSlot, block, selectedCallId, cwd, openFile, inspectCall, t }: HostBranchProps): ReactNode {
  const toolName = nameOf(block)
  const owner = useMemo(() => ({
    callId: block.callId,
    toolName,
    block,
    openFile,
    cwd,
    inspect: () => { inspectCall(block.callId) },
  }), [block, cwd, openFile, inspectCall, toolName])
  return (
    <div
      className={css.callRow}
      data-chat-anchor-key={`call:${block.callId}`}
      data-chat-call-id={block.callId}
      data-selected={block.callId === selectedCallId || undefined}
    >
      {renderSlot('tool.call.toolview', owner, {
        entryKey: toolName,
        fallback: <FallbackToolRow toolName={toolName} block={block} t={t} />,
      })}
      {block.subCalls.length > 0 && (
        <div className={css.subCalls} data-subcalls>
          {block.subCalls.map(child => (
            <HostToolBranch
              key={child.callId}
              renderSlot={renderSlot}
              block={child}
              selectedCallId={selectedCallId}
              cwd={cwd}
              openFile={openFile}
              inspectCall={inspectCall}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** The first tool-call node renders this group; sibling seats render null. */
export function ToolCallGroup({ blocks, renderSlot, selectedCallId, cwd, openFile, inspectCall, t }: {
  readonly blocks: readonly ToolCallBlock[]
  readonly renderSlot: CollapsedToolCallsProps['renderSlot']
  readonly selectedCallId: string | undefined
  readonly cwd: string | undefined
  readonly openFile: (path: string) => void
  readonly inspectCall: (callId: string) => void
  readonly t: Translate
}): ReactNode {
  const count = blocks.reduce((sum, block) => sum + countCalls(block), 0)
  const settled = blocks.every(isSettled)
  const [expanded, setExpanded] = useState(() => !settled)
  const wasSettled = useRef(settled)
  useEffect(() => {
    if (settled && !wasSettled.current) setExpanded(false)
    wasSettled.current = settled
  }, [settled])
  const summary = settled
    ? t('toolCalls.groupCountSettled', { count })
    : t('toolCalls.groupCountRunning', { count })
  return (
    <div className={css.group} data-state={settled ? 'ok' : 'running'}>
      <DisclosureRow
        icon={<IconSparkle16 />}
        title={t('toolCalls.groupTitle')}
        open={expanded}
        expandable
        onToggle={() => { setExpanded(value => !value) }}
        expandOnRowClick
        previewChevron
        keepContentWhenOpen
        collapsedContent={<span className={css.groupSummary}>{summary}</span>}
        children={expanded ? (
          <div className={css.calls}>
            {blocks.map(block => (
              <HostToolBranch
                key={block.callId}
                renderSlot={renderSlot}
                block={block}
                selectedCallId={selectedCallId}
                cwd={cwd}
                openFile={openFile}
                inspectCall={inspectCall}
                t={t}
              />
            ))}
          </div>
        ) : null}
        className={css.disclosure}
        rowClassName={css.disclosureRow}
      />
    </div>
  )
}

/** The tool-call node renderer registered at priority -1. */
export const CollapsedToolCalls = memo(function CollapsedToolCalls({
  node, selectedCallId, cwd, openFile, inspectCall, useSession, renderSlot, t,
}: CollapsedToolCallsProps): ReactNode {
  const chat = useSession(snapshot => snapshot.chat)
  // The location index can retain hidden/replaced seats; group only the keys
  // the chat flow actually renders this window.
  const visible = keysOf(node, chat).filter(key => chat.order.includes(key))
  const ordered = orderedToolKeys(node.key, visible, key => chat.nodes.get(key)?.kind)
  if (ordered[0] !== node.key) return null
  const blocks = ordered.map(key => {
    const candidate = chat.nodes.get(key)
    return candidate !== undefined && candidate.kind === 'tool-call'
      ? (candidate as unknown as { readonly data: { readonly root: ToolCallBlock } }).data.root
      : node.data.root
  })
  return (
    <ToolCallGroup
      blocks={blocks}
      renderSlot={renderSlot}
      selectedCallId={selectedCallId}
      cwd={cwd}
      openFile={openFile}
      inspectCall={inspectCall}
      t={t}
    />
  )
})
