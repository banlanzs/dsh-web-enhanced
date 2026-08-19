/**
 * Service assembly: every domain of the web-enhanced gateway, built in
 * dependency order and handed over as interfaces.
 *
 * The gateway holds this record and nothing else — it declares the wire
 * methods and delegates each to the domain that owns the behaviour. Adding a
 * capability means adding a domain module and one line here; the wire methods
 * are the only part that must stay in the gateway class, because `@Remote`
 * records its markers on the service prototype.
 *
 * Two seams cross domain lines and are bound here rather than inside a
 * domain, so neither module has to know the other exists:
 * - the git domain counts lines in untracked files through the files domain;
 * - the memory store shares the task board's storage domain.
 * @module dsh-web-enhanced/src/services
 */

import type { Context } from '@deepseek-ai/cordis'
import type { TaskBoard } from './board.ts'
import { createBoardDomain } from './board-gateway.ts'
import type { Config } from './config.ts'
import { createFilesDomain } from './files-gateway.ts'
import type { FilesDomainFace } from './files-gateway.ts'
import { createGitDomain } from './git-gateway.ts'
import type { GitDomainFace } from './git-gateway.ts'
import { createGlobalPromptDomain } from './global-prompt-gateway.ts'
import type { GlobalPromptDomainFace } from './global-prompt-gateway.ts'
import { createMemoryDomain } from './memory-gateway.ts'
import type { MemoryDomainFace } from './memory-gateway.ts'
import { MemoryStore } from './memory-store.ts'
import { createModelDomain } from './model-gateway.ts'
import type { ModelDomainFace } from './model-gateway.ts'
import { createPluginsDomain } from './plugins-gateway.ts'
import type { PluginsDomainFace } from './plugins-gateway.ts'
import { createVisionDomain } from './vision-gateway.ts'
import type { VisionDomainFace } from './vision-gateway.ts'
import { createWorkspaceFace } from './workspace-service.ts'
import type { WorkspaceFace } from './workspace-service.ts'

/** Every domain the gateway delegates to, as interfaces. */
export interface Services {
  readonly workspace: WorkspaceFace
  readonly files: FilesDomainFace
  readonly git: GitDomainFace
  readonly board: TaskBoard
  readonly memory: MemoryDomainFace
  readonly model: ModelDomainFace
  readonly plugins: PluginsDomainFace
  readonly globalPrompt: GlobalPromptDomainFace
  readonly vision: VisionDomainFace
}

/**
 * Build every domain in dependency order.
 *
 * Mounting order matters twice: the files domain precedes git (which reads
 * its line counter) and the board precedes memory (which shares its storage
 * domain). Everything else is independent.
 * @param ctx - owning context with the injected core services.
 * @param config - the resolved plugin config.
 * @returns the assembled domains.
 */
export function createServices(ctx: Context, config: Required<Config>): Services {
  const workspace = createWorkspaceFace(ctx)
  const files = createFilesDomain({ workspace, config })
  const git = createGitDomain({
    ctx,
    workspace,
    config,
    countLines: (root, path) => files.countLines(root, path),
  })
  const board = createBoardDomain({ ctx, workspace, config })
  return {
    workspace,
    files,
    git,
    board,
    memory: createMemoryDomain({ ctx, workspace, store: new MemoryStore(ctx, board.domain) }),
    model: createModelDomain({ ctx, config }),
    plugins: createPluginsDomain({ ctx, config, outputMaxBytes: config.gitOutputMaxBytes }),
    globalPrompt: createGlobalPromptDomain(ctx),
    vision: createVisionDomain(ctx),
  }
}
