/**
 * Type shim for the host-owned Tool UI package.
 *
 * `@deepseek-ai/dsh-client-ui-tool` is composed by the web profile, not by
 * this plugin, so its `tool.call.toolview` slot declaration is not part of
 * this package's program. The completion-collapse renderer declares that
 * child slot and delegates to the host's keyed atomic tool views, so the slot
 * definition is mirrored here — structurally the same owner currency the host
 * package publishes.
 * @module dsh-web-enhanced/src/client/ui-tool-shim
 */
import type { ToolCallBlock } from '@deepseek-ai/dsh-client-runtime/client'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /** Keyed atomic Tool call view, dispatched by the wire Tool name. */
    'tool.call.toolview': {
      kind: 'keyed'
      scope: 'session'
      owner: {
        /** Tool call identity, stable across running and settled forms. */
        callId: string
        /** Wire Tool name and keyed dispatch value. */
        toolName: string
        /** Frozen running call or settled result node. */
        block: ToolCallBlock
        /** Session workspace root for relative summaries. */
        cwd?: string | undefined
        /** Open a Tool argument path through the Host. */
        openFile: (path: string) => void
        /** Inspect this call in the trajectory view when available. */
        inspect?: (() => void) | undefined
      }
    }
  }
}
