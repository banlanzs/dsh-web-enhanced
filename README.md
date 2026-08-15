# dsh-web-enhanced

<div align="center">

**English** · [简体中文](./README.zh-CN.md)

</div>

> A Web-enhanced plugin for DeepSeek Harness: task board with cron scheduling, git graph, preview/files/SCM right panel, and DeepSeek API balance line.
>
> 🔌 Ecosystem: the repo carries the `#dsh` · `#dsh-plugin` topics — welcome to be listed by @dsh-plugin.

Developed and built independently of the deepseek-harness repo — the plugin only consumes the officially published `@deepseek-ai/*` packages and the existing Web client slots. No harness source is modified.

## Features

| Feature | Description |
|---|---|
| **Task board** | Sidebar entry opens a board with five columns (Planned / To do / Running / Done / Failed). 「Run」opens a real DSH agent session that executes the task prompt — composed from the deployment's agent preset (so it has bash / read_file / write_file) and attached to the task's project — and the status and result write back automatically when it finishes. 「View session」jumps to the execution session. **Each card has an inline edit form** (title / prompt / cron / column — done or failed tasks reopen via planned/todo). Supports 5-field cron scheduling (e.g. `0 23 * * *`): runs automatically at the due time, catches up after a host restart, and recovers interrupted runs. |
| **Git graph** | Sidebar entry opens a graph overlay; branch lanes + commit history rendered as SVG (first-parent continuous lanes + horizontal merge links). The header's branch dropdown filters which commits the graph DRAWS (all branches, or one) and changes nothing in the repository; clicking a commit expands its full hash, parents, author and email, date, message body, and per-file added/removed line counts. The branch strip above the composer is the other operation — it checks a branch out. |
| **Workspace view** | A **Workspace** tab in the conversation's view ring, beside Chat and Trajectory, with three panes (Files / Preview / Changes). The file tree expands, searches by name, and opens files in preview; preview supports markdown (GFM tables, HTML tables, and inline HTML) / HTML (sandboxed iframe) / code / **diff** (line-highlighted unified diff) / CSV / images / PDF / text / **Office docx & xlsx** (host-side structural conversion) with source / **split** (editor + preview side by side) / view modes and save. The Changes pane is backed by real `git status` with stage / unstage / discard and per-file diffs. The active pane and the open directories persist per workspace. |
| **File mentions** | 「Mention file」and「Mention folder」in the composer's `+` menu: pick a workspace entry and its `@path` is inserted into the draft (paths with spaces are quoted). |
| **Balance line** | Shows the DeepSeek API balance (`GET /user/balance`) below the composer, with a refresh button and a muted error state. **Only while the session's model route actually bills that account** — switching to another channel (or repointing `deepseek-official` at a private gateway) hides the whole line, because the number would then be about somebody else's account. |

## Screenshots

Captured from the real UI by `scripts/e2e.mjs --capture` (no model key needed):

| Task board | Git graph |
|---|---|
| ![Task board](./assets/board.png) | ![Git graph](./assets/graph.png) |

| Floating panel | Balance line |
|---|---|
| ![Floating panel](./assets/panel.png) | ![Balance line](./assets/balance.png) |

## Installation

The plugin is a bundle combo package (`dsh.bundle`) installed into a Web profile:

```sh
dsh plugin --profile web add git+https://github.com/banlanzs/dsh-web-enhanced.git   # recommended
# or:
# dsh plugin --profile web add ./dsh-web-enhanced-0.4.0.tgz
# dsh plugin --profile web add dsh-web-enhanced
```

`lib/` is committed, so there is no `prepare` step and installing from git needs no toolchain and no `allowBuilds` prompt.

> **Install it, do not `link:` it.** Every `@deepseek-ai/*` package is a **peer** dependency and must resolve to the single copy the profile provides. Node resolves a symlinked package from its REAL path, so a `link:`-installed plugin resolves those specifiers inside its own `node_modules` instead — a second `@deepseek-ai/dsh-typert-protocol` instance. The `@Remote` decorator records its markers in that module's private state, so the host gateway (holding the other instance) then sees no descriptors at all and every `/api/webEnhanced/*` answers **404** while the client half still loads and renders. Verify a suspicious install with:
>
> ```sh
> node -e "console.log(require.resolve('@deepseek-ai/dsh-typert-protocol',{paths:['<profile>']}))"
> node -e "console.log(require.resolve('@deepseek-ai/dsh-typert-protocol',{paths:['<plugin>/lib']}))"
> ```
>
> The two paths must be identical.

Then start:

```sh
dsh --profile web
```

### One-click script

After cloning, just run it — it checks the prerequisites (dsh / pnpm / repo reachability), installs via the public git URL, and prompts you to restart:

```sh
git clone https://github.com/banlanzs/dsh-web-enhanced.git
cd dsh-web-enhanced
./scripts/install.sh
```

### Developer iteration

`link:` is NOT usable for this plugin (see the note above — it duplicates the
harness packages and silently disables every host capability). Iterate by
reinstalling from a packed tarball instead:

```sh
cd dsh-web-enhanced
pnpm install && pnpm run check && npm pack
dsh plugin --profile web remove dsh-web-enhanced
dsh plugin --profile web add ./dsh-web-enhanced-0.4.0.tgz
```

On Windows, tarball installs need real symlink permission (pnpm's
`importPackage` step). If it fails with `EPERM ... symlink`, either enable
Developer Mode or install from the git URL, which does not take that path.

## Configuration

Plugin-row `config` fields (all have defaults):

| key | default | meaning |
|---|---|---|
| `cronIntervalMs` | 30000 | Scheduler tick interval |
| `balanceApiKeyEnv` | `DEEPSEEK_API_KEY` | Env var for the balance query API key |
| `balanceCacheTtlMs` | 60000 | Balance view cache duration |
| `balanceBaseUrl` | `https://api.deepseek.com` | Balance endpoint base URL |
| `balanceProviders` | `[deepseek-official]` | Model routes the balance line is shown for; a route with its own configured `baseURL` must also share the endpoint's host |
| `skipDirs` | `[node_modules]` | Directories skipped by the file tree/search (`.git` is always skipped) |
| `readMaxBytes` | 1 MiB | Text read cap (truncated with a marker beyond it) |
| `writeMaxBytes` | 2 MiB | File write cap |
| `binaryMaxBytes` | 5 MiB | Binary preview (base64) cap |
| `gitOutputMaxBytes` | 256 KiB | Single git stream output cap |
| `gitMaxCount` | 100 | `git log` row cap |
| `searchMaxDepth` / `searchMaxEntries` | 8 / 200 | File search depth and entry caps |
| `officeMaxBytes` | 5 MiB | Office preview (docx/xlsx) file size cap |

## Architecture

- **Zero harness changes**: the client UI only registers into existing slots.
  - `sidebar.footer.action` — the task-board and git-graph **entry buttons**.
  - `shell.overlay` — the board and the graph **themselves**. This is the frame-wide floating layer: above every column, outside their scroll containers, additive (a list slot), and click-through until an entry opts into pointer events.
  - `conversation.view` — the Workspace tab, one entry in the view ring beside Chat and Trajectory. The ring renders one view at a time at full column width, so this surface owns no geometry: no docking, no drag-to-resize, no collapse. Those belong to the frame.
  - `conversation.input.dock` — the branch strip (above the composer), aligned to the input card through the column's shared width variables.
  - `conversation.composer.dock` — the balance line (below the composer).

  Nothing registers into the layout's `details` slot: that is a `single` slot already occupied by ui-conversation's `DetailsPanel`, so registering there would replace the tool-details column and remove the `conversation.details.tool` seat it declares. Beside the slots, two client commands are registered through `ctx.commandUi.register` — the file and folder mention pickers in the composer's `+` menu.
- **Optional services are read uninjected**: `agentPresets`, `llm`, `settings`, `credentials`, `modelDirectories`, `commandUi`, and `conversation` all come from `ctx.get()`. A deployment composed without one degrades exactly that surface instead of leaving this plugin's entry waiting on a service it may never get.
- **One request object per remote method**: the Typert gateway maps `descriptor.parameters` positionally onto the host method (`Reflect.apply`) and both halves reject a mismatched argument count, so a descriptor's parameter list *is* the host signature. Every method here declares exactly one `request` parameter; `tests/contribution.spec.ts` guards it.
- **Hand-written remote contribution**: host methods use the `@Remote` decorator (Typert SRC mode; the host gateway auto-discovers the `ctx.webEnhanced` service); the client mounts a hand-declared src-json contribution in `apply` — no typert generation pipeline.
- **Cross-scope shared state**: the overlays are `root`-scoped and the branch strip and balance line are `session`-scoped, so a single slot-store handle cannot serve both ("one handle, one scope"). Shared state lives in `apply` as plain observables and reaches components through each registration's inject `hooks` compartment.
- **Task execution**: `agentPresets.resolve()` names the deployment preset, it is recorded on `meta.agentPreset` and mounted inside `setup` (the host's own `ensureSession` order), then `workspace.attachSession` records the run's session on its project; the run itself is `followup` + `whenIdle` + `sessions.flush` and the result is written back from the `turn/end` reason. A deployment with no preset roster still runs tasks — its sessions just carry whatever the host root registered.
- **Persistence**: task records live in the `ctx.storageDomain` domain `web_enhanced` (JSON backend); restart recovery settles `running` → `failed` (host-restart). Panel geometry (width, collapsed, expanded directories) persists to `localStorage` keyed per workspace.
- **Path safety**: every fs/git path is validated against the workspace root (absolute paths, `..`, and backslashes are rejected); a single-ref argument rejects a leading `-`, `..` ranges, and whitespace or globs, so one argument can never become two or become an option; git output is collected with bounds; file reads have byte caps and binary sniffing. Office files are converted on the host (fflate) into bounded structural blocks — headings, paragraphs, list items, tables (≤ 2000 blocks, ≤ 200×50 table) — never raw HTML.
- **Preview safety**: Markdown, CSV, diff, tables, and Office previews render as React elements, never `dangerouslySetInnerHTML`. HTML inside Markdown maps through an allow list to real elements; an unknown tag loses its markup and keeps its text, and `script`/`style` lose both. `javascript:`/`data:` link targets degrade to literal text (a `data:image/*` picture is the exception), and HTML file previews load in a `sandbox=""` iframe (no scripts, no same-origin access).

## Development

```sh
pnpm install
pnpm run check   # typecheck + full tests + build (164 tests)
```

Build outputs:
- `lib/index.js` — node half: the `web-enhanced` function plugin (mounts the `WebEnhancedGateway` Typert service: task*/git*/fs*/balanceGet + cron scheduler + restart recovery)
- `lib/client.js` — browser half: module-loader closure format (`window.__ModuleLoader__.load`), declared by the `dsh.client` manifest
- `cordis.patch.yml` — bundle patch: inserts the `web-enhanced` row (one row carries both the node and browser halves)

### Real-device e2e (no model key)

The full real chain: start a temporary dsh web → install the plugin → open the sidebar board/graph, a session's floating panel and balance line — all asserted in a real browser, nothing mocked:

```sh
# needs the host build: DSH_ROOT (default ~/.dsh/source/current) with pnpm run build done
node scripts/e2e.mjs --smoke --install link --port 3190
node scripts/e2e.mjs --capture   # also refresh assets/*.png used by this README
```

Prereqs: `dsh`/`pnpm` on PATH, and the main repo's web build output (playwright resolves from the main repo). On PASS it exits 0; failure keeps `e2e-fail-*.png` screenshots and prints the `dsh-web.log` tail.

## Known limitations

- The workspace surface is a view tab, not a side-by-side column: it replaces the transcript while active rather than sitting next to it, and it owns no width or collapse of its own.
- HTML inside Markdown renders through an allow list: `<table>` is read structurally and inline tags map to real elements, everything else keeps only its text. `<details>`, inline `style`, and custom elements are not reproduced.
- The mention pickers list one bounded pass of the host search (`searchMaxEntries`, 200 by default); the popup's own search filters that batch locally rather than re-querying per keystroke.
- Office preview is structural: docx headings/paragraphs/lists/tables and the first xlsx worksheet are rendered; inline styles (bold, colors), images, and multi-sheet workbooks are not. Legacy `.doc`/`.xls` binaries are not previewable.
- Scheduled tasks are best-effort: 30s tick granularity; windows missed while the host is down are caught up once at startup, no backlog is kept.
- The balance key shares its source with the model provider (env var); when unconfigured it shows an error state rather than failing. On a route outside `balanceProviders` the line is hidden entirely.
- The graph lanes use a simplified algorithm (first-parent continuity), not git's full topology coloring; a commit's file list is the first-parent diff, so a merge shows only what it brought in.

## License

MIT
