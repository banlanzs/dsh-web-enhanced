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
| **Task board** | Sidebar entry opens a board with five columns (Planned / To do / Running / Done / Failed). 「Run」opens a real DSH agent session that executes the task prompt; the status and result write back automatically when it finishes. 「View session」jumps to the execution session. **Each card has an inline edit form** (title / prompt / cron / column — done or failed tasks reopen via planned/todo). Supports 5-field cron scheduling (e.g. `0 23 * * *`): runs automatically at the due time, catches up after a host restart, and recovers interrupted runs. |
| **Git graph** | Sidebar entry opens a graph overlay; branch lanes + commit history rendered as SVG (first-parent continuous lanes + horizontal merge links). A branch strip above the composer switches branches, shows recent commits, and opens the graph. |
| **Right panel** | When a project session is open, a floating panel (Preview / Files / Changes) appears on the right of the chat area. The file tree expands, searches by name, and opens files in preview; preview supports markdown / HTML (sandboxed iframe) / code / **diff** (line-highlighted unified diff) / CSV / images / PDF / text / **Office docx & xlsx** (host-side structural conversion) with source / **split** (editor + preview side by side with a draggable divider) / view modes and save. The Changes tab is backed by real `git status` with stage / unstage / discard and per-file diffs. Panel width is draggable, double-click resets it, and collapsed state + width persist per workspace (localStorage). |
| **Balance line** | Shows the DeepSeek API balance (`GET /user/balance`) below the composer, with a refresh button and a muted error state. |

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
dsh plugin --profile web add ./dsh-web-enhanced        # local directory
# or from git / npm / tarball:
# dsh plugin --profile web add github:you/dsh-web-enhanced#<sha>
# dsh plugin --profile web add dsh-web-enhanced
# dsh plugin --profile web add ./dsh-web-enhanced-0.2.0.tgz
```

When installing from git, pnpm runs the package's `prepare` script (self-contained build) — on first install you will be prompted to enable `allowBuilds` for this package.

Then start:

```sh
dsh --profile web
```

### One-click script

After cloning, just run it — it checks the prerequisites (dsh / pnpm / repo reachability), installs via the public git URL, and prompts you to restart:

```sh
git clone https://github.com/omdsh-dev/dsh-web-enhanced.git
cd dsh-web-enhanced
./scripts/install.sh
```

### Developer iteration (link mode)

```sh
cd dsh-web-enhanced
pnpm install
dsh plugin --profile web add link:$PWD
```

## Configuration

Plugin-row `config` fields (all have defaults):

| key | default | meaning |
|---|---|---|
| `cronIntervalMs` | 30000 | Scheduler tick interval |
| `balanceApiKeyEnv` | `DEEPSEEK_API_KEY` | Env var for the balance query API key |
| `balanceCacheTtlMs` | 60000 | Balance view cache duration |
| `balanceBaseUrl` | `https://api.deepseek.com` | Balance endpoint base URL |
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
  - `shell.overlay` — the board, the graph, and the right dock **themselves**. This is the frame-wide floating layer: above every column, outside their scroll containers, additive (a list slot), and click-through until an entry opts into pointer events.
  - `conversation.input.dock` — the branch strip (above the composer).
  - `conversation.composer.dock` — the balance line (below the composer).

  The right dock deliberately does **not** take the layout's `details` slot: that is a `single` slot already occupied by ui-conversation's `DetailsPanel`, so registering there would replace the tool-details column and remove the `conversation.details.tool` seat it declares. Living on `shell.overlay` is also what lets the dock own its own geometry — `ctx.layout` exposes open/close for the details column but no width API, and the dock's width must be draggable and remembered per project.
- **One request object per remote method**: the Typert gateway maps `descriptor.parameters` positionally onto the host method (`Reflect.apply`) and both halves reject a mismatched argument count, so a descriptor's parameter list *is* the host signature. Every method here declares exactly one `request` parameter; `tests/contribution.spec.ts` guards it.
- **Hand-written remote contribution**: host methods use the `@Remote` decorator (Typert SRC mode; the host gateway auto-discovers the `ctx.webEnhanced` service); the client mounts a hand-declared src-json contribution in `apply` — no typert generation pipeline.
- **Cross-scope shared state**: the overlays are `root`-scoped and the branch strip and balance line are `session`-scoped, so a single slot-store handle cannot serve both ("one handle, one scope"). Shared state lives in `apply` as plain observables and reaches components through each registration's inject `hooks` compartment.
- **Task execution**: `agents.create` + `followup` + `whenIdle` + `sessions.flush` (the same headless driving sequence), the result is written back from the `turn/end` reason.
- **Persistence**: task records live in the `ctx.storageDomain` domain `web_enhanced` (JSON backend); restart recovery settles `running` → `failed` (host-restart). Panel geometry (width, collapsed, expanded directories) persists to `localStorage` keyed per workspace.
- **Path safety**: every fs/git path is validated against the workspace root (absolute paths, `..`, and backslashes are rejected); git output is collected with bounds; file reads have byte caps and binary sniffing. Office files are converted on the host (fflate) into bounded structural blocks — headings, paragraphs, list items, tables (≤ 2000 blocks, ≤ 200×50 table) — never raw HTML.
- **Preview safety**: Markdown, CSV, diff, and Office previews render as React elements, never `dangerouslySetInnerHTML`. `javascript:`/`data:` link targets degrade to literal text, and HTML previews load in a `sandbox=""` iframe (no scripts, no same-origin access).

## Development

```sh
pnpm install
pnpm run check   # typecheck + full tests + build (87 tests)
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

- The right panel is a floating layer, not the product details column: it does not participate in the layout's collapse/yield chain, minimum width 300px.
- Office preview is structural: docx headings/paragraphs/lists/tables and the first xlsx worksheet are rendered; inline styles (bold, colors), images, and multi-sheet workbooks are not. Legacy `.doc`/`.xls` binaries are not previewable.
- Scheduled tasks are best-effort: 30s tick granularity; windows missed while the host is down are caught up once at startup, no backlog is kept.
- The balance key shares its source with the model provider (env var); when unconfigured it shows an error state rather than failing.
- The graph lanes use a simplified algorithm (first-parent continuity), not git's full topology coloring.

## License

MIT
