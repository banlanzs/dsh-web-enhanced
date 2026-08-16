# dsh-web-enhanced

<div align="center">

**English** · [简体中文](./README.zh-CN.md)

</div>

> A Web-enhanced plugin for DeepSeek Harness: task board with cron scheduling, git graph, preview/files/SCM right panel, DeepSeek API balance line, and image understanding for text-only models.
>
> 🔌 Ecosystem: the repo carries the `#dsh` · `#dsh-plugin` topics — welcome to be listed by @dsh-plugin.

Developed and built independently of the deepseek-harness repo — the plugin only consumes the officially published `@deepseek-ai/*` packages and the existing Web client slots. No harness source is modified.

## Features

| Feature | Description |
|---|---|
| **Task board** | A **Task Board** tab inside the **Workspace** view with five columns (Planned / To do / Running / Done / Failed). 「Run」opens a real DSH agent session that executes the task prompt — composed from the deployment's agent preset (so it has bash / read_file / write_file) and attached to the task's project — and the status and result write back automatically when it finishes. 「View session」jumps to the execution session. **Each card has an inline edit form** (title / prompt / cron / column — done or failed tasks reopen via planned/todo). **A card in the Done column starts collapsed to a single title line** (click to expand); Failed does not collapse, because that column's message is the thing you came to read. Supports 5-field cron scheduling (e.g. `0 23 * * *`): runs automatically at the due time, catches up after a host restart, and recovers interrupted runs. |
| **Git graph** | A **Git Graph** tab inside the **Workspace** view; branch lanes + commit history rendered as SVG (first-parent continuous lanes + horizontal merge links). The branch dropdown filters which commits the graph DRAWS (all branches, or one) and changes nothing in the repository; clicking a commit expands its full hash, parents, author and email, date, message body, and per-file added/removed line counts. **An「Uncommitted changes」row sits on HEAD**: a hollow dashed dot on HEAD's own lane, joined to it by a dashed stub, expanding to the staged / unstaged / untracked files with their added and removed line counts (an untracked file's count comes from reading it on the host; binary or over-cap files report `—`). The branch switcher beside the session title (header `titleCluster`) is the other operation — it checks a branch out, and asks first when the work tree is dirty, counting tracked and untracked entries apart. |
| **Workspace view** | A **Workspace** tab in the conversation's view ring, beside Chat and Trajectory, with four panes (**Explorer** / Changes / **Task Board** / **Git Graph**). The Explorer is VSCode-style: a file-tree sidebar on the left and the open file's preview on the right; the tree expands, searches by name, and opens files into that preview side; preview supports markdown (GFM tables, HTML tables, and inline HTML) / HTML (sandboxed iframe) / code / **diff** (line-highlighted unified diff) / CSV / images / PDF / text / **Office docx & xlsx** (host-side structural conversion) with source / **split** (editor + preview side by side) / view modes and save. The Changes pane is backed by real `git status` with stage / unstage / discard and per-file diffs. The active pane and the open directories persist per workspace. |
| **File mentions** | 「Mention file」and「Mention folder」in the composer's `+` menu: an indented project directory view (folders and files, locally filterable) whose folder rows **enter that folder** — they open the plugin's own file browser at it, which works like a file manager (breadcrumbs / parent / home / per-level listing / filter by name; a file click picks, a folder click enters). The first row opens the same browser at the project root, and it can also walk **outside the project**. Picking a file inserts its `@path` into the draft (paths with spaces are quoted). |
| **Balance line** | Shows the DeepSeek API balance (`GET /user/balance`) below the composer, with a refresh button, a muted error state, and **an estimated cost of the current session's billed tokens** (prices fetched from models.dev, USD per million tokens). **Only while the session's model route actually bills that account** — switching to another channel (or repointing `deepseek-official` at a private gateway) hides the balance part, because the number would then be about somebody else's account; the cost part appears only when models.dev has a price for the exact provider/model selection. |
| **Image understanding** | Transparent image support for text-only models, built in (supersedes `DSH-vision`). Sending an image to a text-only model passes the「model does not support images」gate and the `read_image` tool gate; the transcript keeps the image (the UI shows it exactly like on a multimodal route) while the model sees a `[图片内容描述]` text transcription; multimodal models are detected through the REAL pre-patch resolver and pass through untouched, so no token is spent describing images they can see. **Two user-selected model pools, in fallback order**: the DSH pool (multi-select the DSH models that declare image input; empty = auto-detect) → local Ollama (auto-detected) → the dedicated API pool (fetched from the endpoint's `/models`, multi-selected and saved; an optional preferred model goes first, otherwise pool order) → the static `visionFallbackModels` chain. Content-hash cache, classified errors, anonymous-endpoint timeout caps, and cooldowns apply to the endpoint path; only after every source fails does the model get the failure placeholder, and **each failed attempt is kept in memory and listed in the Vision tab's status card** (source, model, error, time). **The Vision tab in Settings → Web Enhanced is a full configuration form** whose saves apply immediately through a settings namespace — the static `vision*` keys in `cordis.patch.yml` remain as the base layer. |
| **Settings page + plugin management** | One more row in the Settings nav, "Web Enhanced" (registered into `settings.section`). Its **Plugins** tab lists what the current profile has installed — name, version, dependency spec, whether it is an active layer — and offers **Update** and **Remove**. What it lists is the profile `package.json`'s `dependencies`, because that is the set pnpm can act on; template layers (`@deepseek-ai/dsh-base` and friends) are shown apart with no buttons, since no dependency provides them. **Only the profile this host started with is visible** (`dsh --profile web` lists web's dependencies and nothing else); the profile name and path are printed under the title. **Every operation takes effect on the next start** (the layer stack is composed at boot) and the UI says so. Removing this plugin itself is not blocked — the confirmation just spells out what it costs. |

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
# dsh plugin --profile web add ./dsh-web-enhanced-0.12.1.tgz
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

### Updating

**No uninstall-then-reinstall needed.** `dsh plugin` is a pnpm forwarder: it hands your arguments verbatim to `pnpm` in the profile directory, then reconciles the bundle layer list against the **installed state**. So an update is one command, then a restart:

```sh
dsh plugin --profile web update dsh-web-enhanced
dsh --profile web
```

The thing to know: **`install` will not pick up new commits, `update` will.** A ref-less spec like `github:banlanzs/dsh-web-enhanced` tracks the default branch, but pnpm pins whichever commit it resolved into the profile's lockfile:

```
dsh-web-enhanced: github:banlanzs/dsh-web-enhanced
  → codeload.github.com/banlanzs/dsh-web-enhanced/tar.gz/<commit>
```

`pnpm install` honours that lock and reinstalls the same commit; `update` re-resolves the branch head and rewrites it.

Reconciling by installed state rather than by dependency diff is deliberate: it is what lets `update` activate a package that only started declaring `dsh.bundle` in a newer version.

If an update ever fails to move (pnpm can hold on to a cached git resolution), the fallbacks in order are `--force`, and only then remove + add:

```sh
dsh plugin --profile web update --force dsh-web-enhanced
# last resort
dsh plugin --profile web remove dsh-web-enhanced
dsh plugin --profile web add git+https://github.com/banlanzs/dsh-web-enhanced.git
```

### Developer iteration

`link:` is NOT usable for this plugin (see the note above — it duplicates the
harness packages and silently disables every host capability). Iterate by
reinstalling from a packed tarball instead:

```sh
cd dsh-web-enhanced
pnpm install && pnpm run check && npm pack
dsh plugin --profile web remove dsh-web-enhanced
dsh plugin --profile web add ./dsh-web-enhanced-0.12.1.tgz
```

On Windows, tarball installs need real symlink permission (pnpm's
`importPackage` step). If it fails with `EPERM ... symlink`, either enable
Developer Mode or install from the git URL, which does not take that path.

## Configuration

Plugin-row `config` fields (all have defaults; the `vision*` ones can also be edited live in Settings → Web Enhanced → Vision, whose saves override these base values):

| key | default | meaning |
|---|---|---|
| `cronIntervalMs` | 30000 | Scheduler tick interval |
| `balanceApiKeyEnv` | `DEEPSEEK_API_KEY` | Env var for the balance query API key |
| `balanceCacheTtlMs` | 60000 | Balance view cache duration |
| `balanceBaseUrl` | `https://api.deepseek.com` | Balance endpoint base URL |
| `balanceProviders` | `[deepseek-official]` | Model routes the balance line is shown for; a route with its own configured `baseURL` must also share the endpoint's host |
| `modelsDevUrl` | `https://models.dev/api.json` | Pricing blob fetched for the session-cost readout |
| `modelsDevCacheTtlMs` | 21600000 | How long one fetched pricing index stays fresh (6 h) |
| `modelsDevTimeoutMs` | 10000 | Pricing fetch timeout |
| `pricingProviderMap` | `{deepseek-official: deepseek}` | Model-route provider id → models.dev provider id |
| `skipDirs` | `[node_modules]` | Directories skipped by the file tree/search and by the mention pickers (`.git` is always skipped; the browse overlay does not apply the filter) |
| `readMaxBytes` | 1 MiB | Text read cap (truncated with a marker beyond it) |
| `writeMaxBytes` | 2 MiB | File write cap |
| `binaryMaxBytes` | 5 MiB | Binary preview (base64) cap |
| `gitOutputMaxBytes` | 256 KiB | Single git stream output cap |
| `gitMaxCount` | 100 | `git log` row cap |
| `gitWorkingMaxFiles` | 300 | Cap on the uncommitted file list, and with it how many untracked files are read to count their lines |
| `searchMaxDepth` / `searchMaxEntries` | 8 / 200 | File search depth and entry caps |
| `officeMaxBytes` | 5 MiB | Office preview (docx/xlsx) file size cap |
| `browseMaxEntries` | 500 | Entry cap of one directory level in the mention browser |
| `pluginOpTimeoutMs` | 300000 | Deadline for one pnpm operation (update/remove) |
| `profileDir` | empty | Profile directory; empty walks up from this module. Only for a deployment whose profile is not an ancestor of the loaded plugin |
| `visionEnabled` | true | Master switch of the image-understanding integration |
| `visionPatchAdmission` | true | Wrap `llm.resolveModelInfo` so text-only models admit images past the send preflight and the `read_image` gate (reversible, unload-order safe) |
| `visionProvider` / `visionModel` | empty | Pin the DSH-configured provider/model used for transcription; empty = auto-detect the first image-capable models from all configured providers |
| `visionHarnessModels` | `[]` | User-selected DSH model pool `[{provider, model}, …]`, tried in order before the dedicated API; non-empty replaces auto-detection (the pinned pair still goes first) |
| `visionPrompt` / `visionMarker` | Chinese thorough-description prompt / `[图片内容描述]` | Transcription prompt and the marker the model sees instead of the image block |
| `visionBaseUrl` / `visionApiKey` / `visionEndpointModel` | empty | OpenAI-compatible VLM endpoint (e.g. DashScope compatible mode); key falls back to `visionApiKeyEnv` → `VISION_API_KEY` → `DASHSCOPE_API_KEY`. Empty base URL or model disables this source |
| `visionEndpointModels` | `[]` | Dedicated-endpoint model pool; the Settings tab fills it by fetching `/models` and multi-selecting. Transcription tries `visionEndpointModel` first (when set), then every pool model in order |
| `visionApiKeyEnv` / `visionAnonymous` | `VISION_API_KEY` / false | Env var for the endpoint key; `true` skips the Authorization header (free/local endpoints get a hard 20 s timeout cap) |
| `visionTimeoutMs` / `visionMaxTokens` | 120000 / 4096 | VLM request timeout and output cap |
| `visionAutoLocalOllama` | true | Probe `visionLocalOllamaUrl` at startup; when an Ollama is running, its first vision-capable model is prepended to the transcription chain (images stay on this machine) |
| `visionLocalOllamaModel` / `visionLocalOllamaUrl` | empty / `http://localhost:11434/v1` | Preferred Ollama model (empty picks the first `*vl*`/`*vision*` model) and its OpenAI-compatible base URL |
| `visionFallbackModels` | `[]` | Ordered fallback chain `{model, baseURL?, apiKey?, anonymous?, timeoutMs?}`; each entry may point at a different provider, keyless non-anonymous entries are skipped |
| `visionCacheLimit` / `visionCooldownMs` | 200 / 60000 | In-process transcription cache entries (SHA-256 of image bytes) and how long an endpoint that just failed (429/timeout) is skipped |

## Architecture

- **Zero harness changes**: the client UI only registers into existing slots.
  - `conversation.view` — the Workspace tab, one entry in the view ring beside Chat and Trajectory. The ring renders one view at a time at full column width, so this surface owns no geometry: no docking, no drag-to-resize, no collapse. Those belong to the frame. Its internal tablist carries Explorer / Changes / **Task Board** / **Git Graph**.
  - `shell.overlay` — the mention file browser (the frame-wide floating layer).
  - `conversation.session.header.actions` — the branch switcher beside the session title (`titleCluster`).
  - `conversation.composer.dock` — the balance + session-cost line (below the composer).

  Nothing registers into the layout's `details` slot: that is a `single` slot already occupied by ui-conversation's `DetailsPanel`, so registering there would replace the tool-details column and remove the `conversation.details.tool` seat it declares. Beside the slots, two client commands are registered through `ctx.commandUi.register` — the file and folder mention pickers in the composer's `+` menu.
- **Optional services are read uninjected**: `agentPresets`, `llm`, `settings`, `credentials`, `modelDirectories`, `commandUi`, and `conversation` all come from `ctx.get()`. A deployment composed without one degrades exactly that surface instead of leaving this plugin's entry waiting on a service it may never get.
- **Image understanding rides the host's model-visible surface, not adapter trickery**: a `visionIntegration` Cordis service reversibly wraps the shared `llm.resolveModelInfo` (marked wrapper; teardown restores it only while it is still the live function, so a foreign wrapper on top is never amputated). `agent/pre-step` transcribes image-bearing messages and files a `session` surface replacement (`surfaceOp: replace`) whose text the model derives while the append-original image stays in the transcript — a wrapped `session.deriveMessages` covers the first request of the step before the replacement microtask lands, and `tools/post-execute` rewrites `read_image` results the same way. Multimodal detection always reads the captured pre-patch resolver. The transcription engine (`VisionTranscriber`) then tries DSH-configured vision models via `llm.stream`, local Ollama, and an OpenAI-compatible endpoint chain (fallbacks, content-hash cache, classified errors, cooldowns) — the robustness parts ported from `dsh-vision-proxy`.
- **One request object per remote method**: the Typert gateway maps `descriptor.parameters` positionally onto the host method (`Reflect.apply`) and both halves reject a mismatched argument count, so a descriptor's parameter list *is* the host signature. Every method here declares exactly one `request` parameter; `tests/contribution.spec.ts` guards it.
- **Hand-written remote contribution**: host methods use the `@Remote` decorator (Typert SRC mode; the host gateway auto-discovers the `ctx.webEnhanced` service); the client mounts a hand-declared src-json contribution in `apply` — no typert generation pipeline.
- **Cross-scope shared state**: the mention browser overlay is `root`-scoped and the branch strip and balance line are `session`-scoped, so a single slot-store handle cannot serve both ("one handle, one scope"). Shared state lives in `apply` as plain observables and reaches components through each registration's inject `hooks` compartment.
- **Task execution**: `agentPresets.resolve()` names the deployment preset, it is recorded on `meta.agentPreset` and mounted inside `setup` (the host's own `ensureSession` order), then `workspace.attachSession` records the run's session on its project; the run itself is `followup` + `whenIdle` + `sessions.flush` and the result is written back from the `turn/end` reason. A deployment with no preset roster still runs tasks — its sessions just carry whatever the host root registered.
- **Persistence**: task records live in the `ctx.storageDomain` domain `web_enhanced` (JSON backend); restart recovery settles `running` → `failed` (host-restart). Panel geometry (width, collapsed, expanded directories) persists to `localStorage` keyed per workspace.
- **The uncommitted row is read, never written**: three commands (`diff --cached --numstat`, `diff --numstat`, `ls-files --others --exclude-standard`), because git computes three different diffs and no single command answers all of them. An untracked file has no numstat at all, and the only way to give it one is to stage it — so its added-line count comes from a bounded host-side read instead, and the list is capped BEFORE those reads happen.
- **Path safety**: every fs/git path is validated against the workspace root (absolute paths, `..`, and backslashes are rejected); a single-ref argument rejects a leading `-`, `..` ranges, and whitespace or globs, so one argument can never become two or become an option; git output is collected with bounds; file reads have byte caps and binary sniffing. Office files are converted on the host (fflate) into bounded structural blocks — headings, paragraphs, list items, tables (≤ 2000 blocks, ≤ 200×50 table) — never raw HTML.
- **The one exception, `fsBrowse`**: it lists any absolute directory and is deliberately not workspace-scoped, because a mention produces a path STRING and the path the user wants may sit outside the project. It returns names, kinds, and sizes only; reads, writes, and previews all stay behind the workspace root.
- **Plugin management modifies no host file**: the settings page registers into the existing `settings.section` slot, and the inventory rides this plugin's own Typert gateway — so unlike DSH-vision it needs no edit to the api-proxy's settings allowlist (that patches the host's published output inside `node_modules`, which every upgrade overwrites). Remove and update only run pnpm in the profile directory and rewrite that profile's `dsh.profile.bundles`, exactly the path `dsh plugin` takes. `@deepseek-ai/dsh-app-boot`, which owns those routines for the CLI, is deliberately NOT a peer dependency: it belongs to the dsh installation rather than the profile, so peer resolution would fail in precisely the deployment this code runs in.
- **Preview safety**: Markdown, CSV, diff, tables, and Office previews render as React elements, never `dangerouslySetInnerHTML`. HTML inside Markdown maps through an allow list to real elements; an unknown tag loses its markup and keeps its text, and `script`/`style` lose both. `javascript:`/`data:` link targets degrade to literal text (a `data:image/*` picture is the exception), and HTML file previews load in a `sandbox=""` iframe (no scripts, no same-origin access).

## Development

```sh
pnpm install
pnpm run check   # typecheck + full tests + build (297 tests)
```

Build outputs:
- `lib/index.js` — node half: the `web-enhanced` function plugin (mounts the `WebEnhancedGateway` Typert service: task*/git*/fs*/balanceGet/pricingGet/visionStatus/visionConfigGet/visionConfigSet/visionEndpointModels + cron scheduler + restart recovery, and the `VisionInterceptor` image-understanding service with its settings namespace)
- `lib/client.js` — browser half: module-loader closure format (`window.__ModuleLoader__.load`), declared by the `dsh.client` manifest
- `cordis.patch.yml` — bundle patch: inserts the `web-enhanced` row (one row carries both the node and browser halves)

### Real-device e2e (no model key)

The full real chain: start a temporary dsh web → install the plugin → open the workspace view's board/graph tabs, a session's floating panel and balance line — all asserted in a real browser, nothing mocked:

```sh
# needs the host build: DSH_ROOT (default ~/.dsh/source/current) with pnpm run build done
node scripts/e2e.mjs --smoke --install link --port 3190
node scripts/e2e.mjs --capture   # also refresh assets/*.png used by this README
```

Prereqs: `dsh`/`pnpm` on PATH, and the main repo's web build output (playwright resolves from the main repo). On PASS it exits 0; failure keeps `e2e-fail-*.png` screenshots and prints the `dsh-web.log` tail.

## Known limitations

- The workspace surface is a view tab, not a side-by-side column: it replaces the transcript while active rather than sitting next to it, and it owns no width or collapse of its own.
- HTML inside Markdown renders through an allow list: `<table>` is read structurally and inline tags map to real elements, everything else keeps only its text. `<details>`, inline `style`, and custom elements are not reproduced.
- The mention pickers' in-project list is one bounded pass of the host search (`searchMaxEntries`, 200 by default) and keeps the `skipDirs` filter (`node_modules` by default, `.git` always): dependency trees are the paths nobody references, and listing them would crowd the real project files out of the batch. Within each directory the walk lists files before descending, so root-level documents like `TODO.md` survive the cap. The popup's own search filters that batch locally rather than re-querying per keystroke. Past that cap, past the project boundary, and into a skipped directory, the first row's「Browse elsewhere…」is the way — its walker applies no `skipDirs` filter.
- The mention browser is an in-app file manager, not an operating-system dialog: the host's `host.pickDirectory` picks directories only and only under the `native` capability, and a browser's `<input type="file">` withholds absolute paths by design. On Windows the drive list comes from 26 concurrent `stat` probes (Node exposes no drive table without a native binding), so a disconnected network letter can cost a second or two; a UNC share not mapped to a letter (`\\server\share`) is not reachable yet.
- Office preview is structural: docx headings/paragraphs/lists/tables and the first xlsx worksheet are rendered; inline styles (bold, colors), images, and multi-sheet workbooks are not. Legacy `.doc`/`.xls` binaries are not previewable.
- Scheduled tasks are best-effort: 30s tick granularity; windows missed while the host is down are caught up once at startup, no backlog is kept.
- The balance key shares its source with the model provider (env var); when unconfigured it shows an error state rather than failing. On a route outside `balanceProviders` the line is hidden entirely.
- The graph lanes use a simplified algorithm (first-parent continuity), not git's full topology coloring; a commit's file list is the first-parent diff, so a merge shows only what it brought in.
- The uncommitted row: an untracked file's line count comes from reading it on the host (git has no numstat for a path it does not track, and producing one would mean staging it — a mutation), and a binary file, one over `readMaxBytes`, or one already gone reports `—`. A file both staged and edited again appears twice, because those are two diffs git computed separately. When HEAD is not among the drawn rows the row goes to the top with nothing to connect to.
- Branch switching neither stashes nor blocks a dirty switch: git carries non-conflicting changes across and refuses the rest on its own. What this adds is being told first.
- Plugin management does **not** reload the running process: Cordis composes the layer stack at boot, so an update or removal describes the next start. For the same reason it offers no enable/disable — that edits the profile's `cordis.patch.yml`, a different thing from installing.
- Plugin management sees **only the profile this host started with**: `dsh --profile web` lists `~/.dsh/profiles/web`'s dependencies, and a plugin installed into another profile does not appear. The profile directory is pnpm's working directory, and acting across profiles would run pnpm in a directory whose layer stack is not the one composed right now. To manage another profile, start with it — or use `dsh plugin --profile <name>`.
- Plugin management needs `pnpm` on PATH and the profile directory on this module's ancestor chain (true of any normal install; a source checkout or a test reports "nothing to manage" rather than an error). One pnpm operation runs at a time — a second request is told so rather than queued.
- Image understanding needs at least one transcription source — a DSH-configured multimodal model, a local Ollama, or the dedicated endpoint. With none, images to text-only models are replaced by a placeholder description instead of crashing the turn, and the Vision tab shows why. The same tab configures all three sources, and saves apply immediately (the static `vision*` keys stay as the base layer). Transcription quality is the chosen vision model's ceiling, not a plugin guarantee.
- Endpoint transcription sends image bytes (base64, HTTPS) to the configured VLM endpoint; they leave the machine unless the endpoint is local (Ollama). Only the in-process content-hash cache is kept — nothing else is stored. The harness-model path re-identifies an image within one step but does not cache across turns; the endpoint path does cache across turns by image content.
- Do not install `DSH-vision` (`dsh-image-vision`) alongside this plugin: both would patch admission and both would transcribe the same image. This plugin's admission wrapper is unload-order safe itself, but `DSH-vision`'s teardown restores whatever IT captured and can still clobber a wrapper installed after it.
- Large-image downscaling (the optional `sharp` step `dsh-vision-proxy` has) is not bundled; endpoints receive the original bytes. `visionMaxTokens` caps the transcription output either way.

## License

MIT
