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
import { createBoardDomain } from "./board-gateway.js";
import { createFilesDomain } from "./files-gateway.js";
import { createGitDomain } from "./git-gateway.js";
import { createGlobalPromptDomain } from "./global-prompt-gateway.js";
import { createMemoryDomain } from "./memory-gateway.js";
import { MemoryStore } from "./memory-store.js";
import { createModelDomain } from "./model-gateway.js";
import { createPluginsDomain } from "./plugins-gateway.js";
import { createVisionDomain } from "./vision-gateway.js";
import { createWorkspaceFace } from "./workspace-service.js";
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
export function createServices(ctx, config) {
    const workspace = createWorkspaceFace(ctx);
    const files = createFilesDomain({ workspace, config });
    const git = createGitDomain({
        ctx,
        workspace,
        config,
        countLines: (root, path) => files.countLines(root, path),
    });
    const board = createBoardDomain({ ctx, workspace, config });
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
    };
}
