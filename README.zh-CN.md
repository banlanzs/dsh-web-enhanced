# dsh-web-enhanced

<div align="center">

[**English**](./README.md) · 简体中文

</div>

> DeepSeek Harness 的 Web 增强插件：任务看板（含 cron 定时执行）、Git 图谱、文件/预览/变更右侧面板、DeepSeek API 余额显示。
>
> 🔌 生态：仓库已打 `#dsh` · `#dsh-plugin` topics —— 欢迎被 @dsh-plugin 收录。

独立于 deepseek-harness 仓库开发与构建——本插件只消费官方发布的 `@deepseek-ai/*` 包与 Web 客户端既有槽位，不修改任何仓库源码。

## 功能

| 功能 | 说明 |
|---|---|
| **任务看板** | 侧边栏入口打开看板；任务按五列组织（待规划 / 待办 / 进行中 / 已完成 / 已失败）；卡片「执行」在宿主上开一个真实 DSH 智能体会话运行任务提示词，完成后状态与结果自动回写；「查看会话」跳转到执行会话；**每张卡片带内联编辑表单**（title / prompt / cron / 状态列——done/failed 改回 planned/todo 即重开）；支持 5 字段 cron 定时（如 `0 23 * * *`），到期自动运行，宿主重启后补跑并恢复中断任务。 |
| **Git 图谱** | 侧边栏入口打开图谱覆盖层；分支泳道 + 提交历史以 SVG 渲染（首父连续泳道 + 合并横向连线）；输入框上方分支选择条（切换分支、最近提交、打开图谱）。 |
| **右侧面板** | 项目会话打开时，聊天区右侧出现浮动面板（预览 / 文件 / 变更 三个标签）。文件树支持展开、文件名搜索、点击打开预览；预览支持 markdown / HTML（sandbox iframe）/ 代码 / **diff**（行级高亮 unified diff）/ CSV / 图片 / PDF / 文本 / **Office（docx/xlsx，宿主侧结构化转换）**，且支持**源码 / 分屏（左编辑右预览 + 可拖分隔条）/ 预览**三态与保存；变更页基于真实 git status，支持 stage / unstage / discard 与逐文件 diff。面板宽度可拖拽、双击把手复位、折叠与宽度按工作区持久化（localStorage）。 |
| **余额显示** | 输入框下方显示 DeepSeek API 余额（`GET /user/balance`），带刷新与弱化错误态。 |

## 截图

由 `scripts/e2e.mjs --capture` 在真实 UI 上截图（无需模型 key）：

| 任务看板 | Git 图谱 |
|---|---|
| ![任务看板](./assets/board.png) | ![Git 图谱](./assets/graph.png) |

| 浮动面板 | 余额行 |
|---|---|
| ![浮动面板](./assets/panel.png) | ![余额行](./assets/balance.png) |

## 安装

插件是一个 bundle 组合包（`dsh.bundle`），安装进 Web profile：

```sh
dsh plugin --profile web add git+https://github.com/banlanzs/dsh-web-enhanced.git   # 推荐
# 或：
# dsh plugin --profile web add ./dsh-web-enhanced-0.4.0.tgz
# dsh plugin --profile web add dsh-web-enhanced
```

`lib/` 随仓提交，因此没有 `prepare` 步骤——从 git 安装无需工具链，也不会提示 `allowBuilds`。

> **要安装，不要 `link:`。** 所有 `@deepseek-ai/*` 都是 **peer** 依赖，必须解析到 profile 提供的那一份。Node 解析符号链接包时以其**真实路径**为起点，所以 `link:` 安装的插件会在自己的 `node_modules` 里解析这些包——于是有了第二份 `@deepseek-ai/dsh-typert-protocol`。`@Remote` 装饰器把标记记录在该模块的私有状态里，持有另一份实例的 host 网关因此看不到任何 descriptor，`/api/webEnhanced/*` 全部返回 **404**，而客户端半仍能正常加载渲染（故障表现具有迷惑性）。怀疑安装有问题时这样验证：
>
> ```sh
> node -e "console.log(require.resolve('@deepseek-ai/dsh-typert-protocol',{paths:['<profile>']}))"
> node -e "console.log(require.resolve('@deepseek-ai/dsh-typert-protocol',{paths:['<plugin>/lib']}))"
> ```
>
> 两条路径必须完全一致。

然后启动：

```sh
dsh --profile web
```

### 一键安装脚本

clone 后直接运行——脚本会检查前置（dsh / pnpm / 仓库可达），用公开 git URL 安装并提示重启：

```sh
git clone https://github.com/banlanzs/dsh-web-enhanced.git
cd dsh-web-enhanced
./scripts/install.sh
```

### 开发迭代

本插件**不能**用 `link:`（见上文提示——它会复制一份宿主包，从而静默地让所有
host 能力失效）。改用打包重装来迭代：

```sh
cd dsh-web-enhanced
pnpm install && pnpm run check && npm pack
dsh plugin --profile web remove dsh-web-enhanced
dsh plugin --profile web add ./dsh-web-enhanced-0.4.0.tgz
```

Windows 上 tarball 安装需要真正的符号链接权限（pnpm 的 `importPackage` 步骤）。
若报 `EPERM ... symlink`，可开启开发者模式，或改用 git URL 安装（不走该路径）。

## 配置

插件行 config 字段（均有默认值）：

| key | 默认 | 含义 |
|---|---|---|
| `cronIntervalMs` | 30000 | 调度器 tick 间隔 |
| `balanceApiKeyEnv` | `DEEPSEEK_API_KEY` | 余额查询的 API key 环境变量 |
| `balanceCacheTtlMs` | 60000 | 余额视图缓存时长 |
| `balanceBaseUrl` | `https://api.deepseek.com` | 余额端点基址 |
| `skipDirs` | `[node_modules]` | 文件树/搜索跳过的目录（`.git` 恒跳过） |
| `readMaxBytes` | 1 MiB | 文本读取上限（超出截断标记） |
| `writeMaxBytes` | 2 MiB | 文件写入上限 |
| `binaryMaxBytes` | 5 MiB | 二进制预览（base64）上限 |
| `gitOutputMaxBytes` | 256 KiB | git 单流输出上限 |
| `gitMaxCount` | 100 | git log 行数上限 |
| `searchMaxDepth` / `searchMaxEntries` | 8 / 200 | 文件搜索深度与条数上限 |
| `officeMaxBytes` | 5 MiB | Office（docx/xlsx）预览文件大小上限 |

## 架构要点

- **零仓库改动**：客户端 UI 只注册到既有槽位——`sidebar.footer.action`（看板/图谱入口）、`conversation.input.dock`（分支条 + 浮动面板）、`conversation.composer.dock`（余额行）。右侧面板以 fixed 浮动层实现（产品的 details 列没有对外扩展槽）。
- **手写 remote contribution**：host 方法用 `@Remote` 装饰器（Typert SRC 模式，宿主网关自动发现 `ctx.webEnhanced` 服务）；客户端在 apply 里 `ctx.remote.$mount()` 手写的 src-json contribution，无需 typert 生成管线。
- **任务执行**：`agents.create` + `followup` + `whenIdle` + `sessions.flush`（headless 同款驱动序列），结果按 `turn/end` reason 回写。
- **持久化**：任务记录存 `ctx.storageDomain` 域 `web_enhanced`（JSON 后端），重启恢复 running → failed（host-restart）。
- **路径安全**：所有 fs/git 路径经工作区根校验（拒绝绝对路径、`..`、反斜杠）；git 输出有界收集；文件读有字节上限与二进制嗅探。Office 文件在宿主侧用 fflate 解包为有界结构化 blocks（标题/段落/列表/表格，≤ 2000 块、≤ 200×50 表格），绝不产出原始 HTML。

## 开发

```sh
pnpm install
pnpm run check   # typecheck + 全部测试 + 构建（148 个测试）
```

构建产物：
- `lib/index.js` — node half：`web-enhanced` 函数插件（挂载 `WebEnhancedGateway` Typert 服务：task*/git*/fs*/balanceGet + cron 调度器 + 重启恢复）
- `lib/client.js` — 浏览器 half：模块加载器闭包格式（`window.__ModuleLoader__.load`），由 `dsh.client` manifest 声明
- `cordis.patch.yml` — bundle 补丁：插入 `web-enhanced` 行（一个行同时承载 node 与 browser 两个 half）

### 真机 e2e（无模型 key）

真实链路全跑：临时 dsh web → 安装插件 → 浏览器打开侧边栏看板/图谱、会话浮动面板与余额行，全程不 mock：

```sh
# 需要宿主构建：DSH_ROOT（默认 ~/.dsh/source/current）内先 pnpm run build
node scripts/e2e.mjs --smoke --install link --port 3190
node scripts/e2e.mjs --capture   # 顺带刷新本 README 使用的 assets/*.png
```

前置：PATH 上有 `dsh`/`pnpm`，以及主仓 web 构建产物（playwright 从主仓解析）。PASS 退出码 0；失败保留 `e2e-fail-*.png` 截图并打印 `dsh-web.log` 尾部。

## 已知限制

- 右侧面板为浮动层而非产品 details 列：不参与布局的折叠/让步链，最小宽度 300px。
- Office 预览为结构化视图：docx 的标题/段落/列表/表格与 xlsx 首个工作表可预览；内联样式（加粗/颜色）、图片与多工作表不保留。旧版 `.doc`/`.xls` 二进制格式不支持预览。
- 定时任务为 best-effort：tick 粒度 30s，宿主关机期间错过的窗口在启动时补跑一次，不留积压。
- 余额 key 与模型提供商同源（环境变量）；未配置时显示错误态而非报错。
- 图谱泳道为简化算法（首父连续性），非 git 完整拓扑着色。

## License

MIT
