# dsh-web-enhanced 本地 Profile 测试

本文说明如何创建一个以 Web profile 为基础的独立 `test` profile，在其中测试本地构建的 `dsh-web-enhanced`，确认无误后再安装到正式 `web` profile。

## 推送前：本地 CI 门

`.github/workflows/ci.yml` 的 `check` job 只做 checkout / setup-node / setup-pnpm，其余每一步都由 `scripts/ci-local.mjs` 执行。本地跑同一个脚本，得到的就是 CI 会跑的全部内容。

```bash
node scripts/ci-local.mjs            # 默认 --full：等价 CI 的单个矩阵分支
node scripts/ci-local.mjs --fast     # 跳过 smoke e2e，日常迭代用
node scripts/ci-local.mjs --matrix   # Node 22 + 24 全覆盖，等价整个 check job
node scripts/ci-local.mjs --clean    # 成功后清理 worktree 与打包产物（省空间）
```

脚本默认在 `.ci-local/worktree`（HEAD 的干净副本）里执行，因此 `git diff --exit-code -- lib/` 的产物漂移门与 CI 的全新 checkout 语义一致，也不会污染开发树。代价是**未提交的改动不参与验证**：要验证工作中的改动，先提交，或加 `--no-worktree` 就地跑。

worktree（含 node_modules）与每次打包的 tgz 都是可再生的缓存产物。加 `--clean` 会在成功后删除它们，省约 150 MB；代价是下次运行要重建 worktree 并全量 `pnpm install`（慢 1-2 分钟）。`.ci-local/host/<sha>` 的宿主构建**不**随 `--clean` 删除——它最重且按 SHA 缓存，需要时手动删除该目录即可。

宿主基线 SHA 钉在脚本的 `HOST_REF` 常量里，是升级宿主基线时唯一需要改的地方。宿主按 SHA 缓存在 `.ci-local/host/<sha>`，优先从本地已有的 deepseek-harness clone 以 `git clone --local` 取（零网络、秒级），找不到才走网络浅取；构建一次后后续运行整步跳过，用 `--rebuild-host` 强制重建。

`--full` 需要两项一次性准备，缺失时脚本在第一步就报出安装指令：

- 系统 Chrome：`scripts/e2e.mjs` 用 playwright 的 `channel: 'chrome'`（CI 的 ubuntu-latest 预装）。装法 `npx playwright@1.49.0 install --with-deps chrome` 或 `sudo apt install google-chrome-stable`。
- `--matrix` 还需要 Node 22：`nvm install 22`。

本地无法完全等价的残余部分：`ubuntu-latest` 镜像的月度更新、npm registry 的时间依赖行为（pnpm `minimumReleaseAge` 策略、`@next` 标签解析）、GitHub 侧的并发与 artifact 语义。这些不受本脚本覆盖。

`host-canary` job 只在 schedule / workflow_dispatch 触发且 `continue-on-error: true`，不参与 push 的红绿判定，因此不在本脚本范围内。

## 发布到 npm

版本号在两个源里重复：`package.json` 的 `version` 与 `src/client/meta.ts` 的 `WEB_ENHANCED_VERSION`——浏览器 bundle 在运行时读不到 package manifest，import 它又会把整个文件拖进 bundle。`npm version` 的 `version` 生命周期脚本负责同步：

```json
"version": "node scripts/sync-version.mjs && pnpm run check && git add src/client/meta.ts lib"
```

它在 `npm version` 改完 `package.json` 之后、`git commit` 打 tag 之前运行，依次同步 `meta.ts`、干净重建 `lib/`、把两者一并 `git add`，因此源与产物落在同一个 version commit 里。

这里必须是 `check` 而不是 `build`：`build` 是增量的，而干净重建会重排 `lib/client.js` 的内联模块顺序，只有 `check`（`rm -rf lib` + `tsc -b --force`）产出的字节与 CI 一致，否则 CI 的 lib/ 漂移门会红。

`tests/meta.spec.ts` 把两个版本号钉死，是绕开上述路径手工改版本时的兜底。

完整流程：

```bash
# 1. 写 CHANGELOG.md 并提交（内容必须人写；npm version 要求工作树干净）
# 2. 版本号两处 + lib/ 产物 + commit + tag，一次完成
npm version minor -m "chore(web-enhanced): release %s"
# 3. 全门（含真机 e2e）
node scripts/ci-local.mjs
# 4. 发布
npm publish && git push --follow-tags
```

本文其余部分讲的是另一件事：把插件真装进 profile 做人工交互验证。三者互补——CI 门保证「推上去会绿」，发布流程保证「发出去的版本号是对的」，profile 测试保证「用起来对」。

## 关键结论

- `dsh` 支持同时运行多个 profile；不同 Web 实例必须使用不同端口。
- `web` 和 `headless` 会自动初始化，`test` 等自定义 profile 必须先通过 `dsh plugin --profile <name> ...` 创建。
- `dsh` 没有内置自更新命令。通过 npm 全局安装时，使用 `npm install -g @deepseek-ai/dsh@latest` 更新。
- `dsh-web-enhanced` **不能使用** `dsh plugin --profile test add .` 或任何 `link:` 安装。必须先构建并打包，再把 `.tgz` 安装进 profile。
- `test` 和 `web` 的 profile 配置目录不同，但在同一个 `DSH_HOME` 下仍共享 home 级配置、凭据、设置和部分持久化数据。

## 1. 检查前置环境

本项目要求：

```powershell
node --version
pnpm --version
dsh --version
```

预期版本范围以 `package.json` 为准：Node.js `^22.19.0 || >=24.0.0`，pnpm `>=11.7.0 <12`。

## 2. 更新全局 dsh

`dsh` 没有 `upgrade` 或 `self-update` 命令。通过 npm 全局安装时，更新命令如下：

```powershell
npm install -g @deepseek-ai/dsh@latest "--allow-scripts=@deepseek-ai/dsh-subprocess-local,koffi,node-pty"
dsh --version
dsh --profile web --help
```

这里仅允许 Harness 确实需要的三个安装脚本：

- `@deepseek-ai/dsh-subprocess-local`
- `koffi`
- `node-pty`

`@google/genai` 的脚本是 no-op，Harness 也不依赖 `protobufjs` 的 postinstall，因此 npm 继续提示这两个包未获许可时可以忽略。

### Windows 原生模块被占用

若更新时报 `EBUSY` 或 `EPERM`，路径中包含 `koffi.node`、`sharp-*.node` 或 `libvips*.dll`，通常是仍在运行的 `dsh --profile web` 已加载旧版原生模块。先查看 DSH 进程：

```powershell
Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -like '*@deepseek-ai/dsh/lib/bin.js*' } |
  Select-Object ProcessId, CommandLine
```

在对应终端按 `Ctrl+C` 正常关闭所有 DSH 实例，再重新运行安装命令。不要直接终止所有 `node.exe`，因为其他开发工具也可能使用 Node.js。

安装成功但旧的 `.dsh-*` 临时目录清理失败时，新版通常已经可用。关闭占用进程或重启 Windows 后再清理残留目录即可。

以下警告本身不表示安装失败：

- `node-domexception` deprecated：传递依赖警告。
- `.npmrc allow-scripts setting is being ignored`：命令行 `--allow-scripts` 正在覆盖 `.npmrc`。
- `packages are looking for funding`：npm 的普通提示。

应以命令是否出现 `npm error`、退出码以及 `dsh --version` 的结果判断是否成功。

## 3. 创建与 Web 等价的 test profile

自定义 profile 默认只有 `@deepseek-ai/dsh-base`。需要显式加入与当前 CLI 版本匹配的 `@deepseek-ai/dsh-web-app`，才能获得 Web 应用配置。

不要依赖 `dsh-web-app` 的无版本 `latest` 标签。它曾错误指向旧的 `0.0.1-rc.1`，导致安装不存在或已经改名的依赖。使用当前 `dsh` 版本最稳妥：

```powershell
$dshVersion = (dsh --version).Trim()
dsh plugin --profile test add "@deepseek-ai/dsh-web-app@$dshVersion"
```

首次运行会创建：

```text
$DSH_HOME/profiles/test/
  package.json
  pnpm-workspace.yaml
  cordis.patch.yml
```

默认 `DSH_HOME` 是 `$HOME\.dsh`。

### 处理 koffi 构建许可

如果安装输出：

```text
ERR_PNPM_IGNORED_BUILDS Ignored build scripts: koffi@...
```

说明依赖已经下载，但 pnpm 以非零状态退出，`dsh` 尚未把 `web-app` 同步进 bundle 列表。批准项目已审核的 `koffi`，然后重新安装：

```powershell
dsh plugin --profile test approve-builds koffi
dsh plugin --profile test install
```

如果 `approve-builds` 没有写入配置，可在 `$HOME\.dsh\profiles\test\pnpm-workspace.yaml` 中加入：

```yaml
allowBuilds:
  koffi: true
```

然后再次执行：

```powershell
dsh plugin --profile test install
```

### 验证 Web 基线

```powershell
dsh --profile test --dump-config
```

输出应包含 `@deepseek-ai/dsh-base` 和 `@deepseek-ai/dsh-web-app` 配置层。此时可以先验证空白的 Web 测试实例：

```powershell
dsh --profile test --port 3081
```

如果端口不重要，也可以让操作系统选择空闲端口：

```powershell
dsh --profile test --port 0
```

## 4. 同步现有 web profile 的自定义配置

`$DSH_HOME/cordis.patch.yml` 是 home 级配置，所有 profile 自动共享，无需复制。

如果现有 `web` 使用了 profile 专属的 `$DSH_HOME/profiles/web/cordis.patch.yml`，而 `test` 也需要相同覆盖，可以在首次创建 `test` 后复制一次：

```powershell
Copy-Item `
  "$HOME\.dsh\profiles\web\cordis.patch.yml" `
  "$HOME\.dsh\profiles\test\cordis.patch.yml"
```

该命令会覆盖 `test` 当前的 patch 文件，因此应在添加 test 专属配置之前执行。

如果 `web` 还安装了其他树外 bundle，应使用以下方式逐个安装到 `test`：

```powershell
dsh plugin --profile test add <package-or-tarball>
```

不要复制整个 profile 目录、`node_modules` 或 pnpm 锁文件。profile 的依赖和 bundle 列表应由 `dsh plugin` 维护。

## 5. 构建 dsh-web-enhanced

进入本插件的实际包根目录，即包含 `package.json` 和 `cordis.patch.yml` 的目录：

```powershell
Set-Location D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced
pnpm install
pnpm check
npm pack
```

`pnpm check` 会执行完整的类型检查、测试并从 `src/` 重建 `lib/`。`lib/` 是提交进仓库的构建产物，不要手工修改。

取得当前版本对应的 tarball 路径：

```powershell
$pluginVersion = (Get-Content .\package.json | ConvertFrom-Json).version
$tarball = (Resolve-Path ".\dsh-web-enhanced-$pluginVersion.tgz").Path
$tarball
```

## 6. 将本地 tarball 安装到 test

首次安装：

```powershell
dsh plugin --profile test add $tarball
```

验证 bundle 已进入配置层：

```powershell
dsh --profile test --dump-config | Select-String 'dsh-web-enhanced'
```

然后启动测试实例：

```powershell
dsh --profile test --port 3081
```

正在运行的正式 `web` 可以继续使用默认端口；两个实例必须避免绑定同一个 host/port。

## 7. 为什么不能 add .

不要执行：

```powershell
dsh plugin --profile test add .
dsh plugin --profile test add link:.
```

本插件把所有 `@deepseek-ai/*` 包声明为 peer 依赖，这些依赖必须解析到 profile 提供的同一份实例。Node.js 会从符号链接包的真实路径解析依赖，因此 `link:` 安装可能从插件 checkout 自己的 `node_modules` 加载第二份 Harness 包。

典型故障表现是客户端界面仍能加载，但 host 端注册信息位于另一份模块实例中，导致 `/api/webEnhanced/*` 全部返回 404。

怀疑出现重复实例时，可分别从 profile 和插件构建目录检查解析路径；两条结果必须完全一致：

```powershell
node -e "console.log(require.resolve('@deepseek-ai/dsh-typert-protocol',{paths:['C:/Users/<用户名>/.dsh/profiles/test']}))"
node -e "console.log(require.resolve('@deepseek-ai/dsh-typert-protocol',{paths:['<插件仓库路径>/lib']}))"
```

## 8. 日常开发迭代

每轮修改后的固定流程：

```powershell
Set-Location D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced
pnpm check
npm pack

$pluginVersion = (Get-Content .\package.json | ConvertFrom-Json).version
$tarball = (Resolve-Path ".\dsh-web-enhanced-$pluginVersion.tgz").Path

dsh plugin --profile test remove dsh-web-enhanced
dsh plugin --profile test add $tarball
dsh --profile test --dump-config | Select-String 'dsh-web-enhanced'
dsh --profile test --port 3081
```

使用相同版本号反复打包时，先 `remove` 再 `add` 可以避免 pnpm 继续使用之前解析或缓存的本地 tarball。每次重装后都需要重启测试中的 DSH 进程，bundle 层在启动时组合，不会自动热替换整个插件包。

提交或发布前还应检查：

```powershell
git status --short
```

确认 `lib/` 与源码修改一致，且没有意外生成物被加入提交。

## 9. 测试通过后安装到 web

不要把 `test` profile 的目录复制到 `web`。使用已经通过测试的同一个 tarball 安装。若已经换到新的 PowerShell 终端，先按第 5 节重新计算 `$pluginVersion` 和 `$tarball`：

```powershell
# 先在正式 Web 终端按 Ctrl+C 停止实例

# 仅在 web 已安装旧版插件时执行 remove
dsh plugin --profile web remove dsh-web-enhanced

dsh plugin --profile web add $tarball
dsh --profile web --dump-config | Select-String 'dsh-web-enhanced'
dsh --profile web
```

如果插件已经发布到 npm，可以改为安装明确版本：

```powershell
dsh plugin --profile web add "dsh-web-enhanced@$pluginVersion"
```

已经从 npm 安装后，后续更新使用：

```powershell
dsh plugin --profile web update dsh-web-enhanced
```

## 10. 可选：完全隔离测试数据

同一个 `DSH_HOME` 下的 `test` 和 `web` 具有独立的 profile manifest 与 profile patch，但仍共享：

- `$DSH_HOME/cordis.patch.yml`
- `$DSH_HOME/.credentials.yaml` 和 `$DSH_HOME/.env`
- settings
- 部分 storage 与会话数据

如果插件测试可能改写这些共享数据，在专用 PowerShell 终端设置独立 home，再从头创建 profile：

```powershell
$env:DSH_HOME = "$HOME\.dsh-test"

$dshVersion = (dsh --version).Trim()
dsh plugin --profile test add "@deepseek-ai/dsh-web-app@$dshVersion"
```

独立 `DSH_HOME` 不会自动拥有原 home 的凭据和设置。按测试需要显式配置环境变量或复制必要的非敏感配置；不要把凭据提交进仓库。

## 11. 常见问题

### profile test does not exist

`test` 尚未创建。执行带 profile 的插件管理命令初始化它：

```powershell
$dshVersion = (dsh --version).Trim()
dsh plugin --profile test add "@deepseek-ai/dsh-web-app@$dshVersion"
```

### 安装 dsh-web-app 时出现 npm 404

无版本安装可能命中了错误或过旧的 npm dist-tag。使用与 `dsh --version` 完全一致的版本，不要继续重试无版本命令。

日志中的 `An authorization header was used` 仅表示 npm 请求带有已配置 token；公开包不存在时同样可能返回 404，并不单独证明是权限问题。

### ERR_PNPM_IGNORED_BUILDS: koffi

在对应 profile 中批准 `koffi` 并重新安装：

```powershell
dsh plugin --profile test approve-builds koffi
dsh plugin --profile test install
```

全局 npm 的 `allow-scripts` 与 profile 内 pnpm 的 `approve-builds` 是两套独立配置，处理全局安装不会自动处理 `test` profile。

### peer dependencies warning

单独的 peer warning 不一定导致安装失败。先查看完整结果和退出状态；需要详情时运行：

```powershell
dsh plugin --profile test peers check
```

### Windows tarball 安装报 EPERM symlink

pnpm 导入本地 tarball 时需要真实符号链接权限。启用 Windows Developer Mode 后重试。npm registry 或 Git 安装通常不走同一条本地 tarball symlink 路径，但本地冒烟测试仍推荐启用 Developer Mode。

### 插件界面出现但 API 全部 404

优先检查插件是否曾通过 `add .` 或 `link:` 安装。移除它，执行 `pnpm check` 和 `npm pack`，然后安装 tarball：

```powershell
dsh plugin --profile test remove dsh-web-enhanced
dsh plugin --profile test add $tarball
```

### 端口已经被占用

为 `test` 指定其他端口，或让操作系统自动分配：

```powershell
dsh --profile test --port 3082
# 或
dsh --profile test --port 0
```

## 12. 最短可执行流程

在全局 `dsh` 已正确安装、`test` Web 基线已准备好且该 profile 已至少安装过一次插件的情况下，后续迭代可以缩短为：

```powershell
Set-Location D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced
pnpm check
npm pack

$pluginVersion = (Get-Content .\package.json | ConvertFrom-Json).version
$tarball = (Resolve-Path ".\dsh-web-enhanced-$pluginVersion.tgz").Path

dsh plugin --profile test remove dsh-web-enhanced
dsh plugin --profile test add $tarball
dsh --profile test --port 3081
```

测试通过后，把同一个 `$tarball` 安装进 `web`，不要使用 `add .`。
