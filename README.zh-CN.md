# dsh-web-enhanced

<div align="center">

[English](./README.md) · **简体中文**

</div>

> DeepSeek Harness 的 Web 增强插件：任务看板（含 cron 定时执行）、Git 图谱、VSCode 式资源管理器（文件树 + 预览分栏）/变更面板、DeepSeek API 余额显示，以及纯文本模型的识图（图片理解）。
>
> 🔌 生态：仓库已打 `#dsh` · `#dsh-plugin` topics —— 欢迎被 @dsh-plugin 收录。

独立于 deepseek-harness 仓库开发与构建——本插件只消费官方发布的 `@deepseek-ai/*` 包与 Web 客户端既有槽位，不修改任何仓库源码。

## 功能

| 功能 | 说明 |
|---|---|
| **任务看板** | 「工作区」视图里的**任务看板**标签页；任务按五列组织（待规划 / 待办 / 进行中 / 已完成 / 已失败）；卡片「执行」在宿主上开一个真实 DSH 智能体会话运行任务提示词，会话按部署的 agent preset 组合（因此拿得到 bash / read_file / write_file 等工具）并附着到任务绑定的项目上，完成后状态与结果自动回写；「查看会话」跳转到执行会话；**每张卡片带内联编辑表单**（title / prompt / cron / 状态列——done/failed 改回 planned/todo 即重开）；**「已完成」列的卡片默认折叠为一行标题**（点击展开），「已失败」不折叠，因为那一列的错误信息正是要看的东西；支持 5 字段 cron 定时（如 `0 23 * * *`），到期自动运行，宿主重启后补跑并恢复中断任务。 |
| **Git 图谱** | 「工作区」视图里的 **Git 图谱**标签页；分支泳道 + 提交历史以 SVG 渲染（首父连续泳道 + 合并横向连线）；分支下拉只筛选图谱显示的提交（全部分支 / 单分支），不切换仓库；点击任一提交展开详情：完整 hash、父提交、作者与邮箱、时间、提交正文，以及逐文件增删行数。**顶部另有「未提交的改动」一行**：空心虚线圆点画在 HEAD 所在泳道上并虚线连到 HEAD，展开后逐文件列出暂存 / 未暂存 / 未跟踪的增删行数（未跟踪文件的行数由宿主读文件数出，二进制或超限报 `—`）。会话标题旁的**分支切换器**（`titleCluster` 行）才是真正的 checkout，与图谱筛选是两回事；切换前若工作区不干净会先问一句，并分开报「已跟踪 / 未跟踪」的条数。 |
| **工作区视图** | 会话顶部视图栏中的「工作区」标签页，与「对话」「轨迹」并列，内含**资源管理器**（VSCode 式布局：左侧文件树侧边栏、右侧打开文件的预览）/ 变更 / **任务看板** / **Git 图谱**四个面板。文件树侧边栏可一键收起/展开（状态持久化），支持整行展开、文件名搜索、点击在右侧打开预览；预览支持 markdown（含 GFM 表格、HTML 表格与行内 HTML）/ HTML（sandbox iframe）/ 代码 / **diff**（行级高亮 unified diff）/ CSV / 图片 / PDF / 文本 / **Office（docx/xlsx，宿主侧结构化转换）**，且支持**源码 / 分屏 / 预览**三态与保存；变更页基于真实 git status，支持 stage / unstage / discard 与逐文件 diff。当前面板与展开的目录按工作区持久化。
| **对话节点导航条** | 对话流右缘等距节点串（每条 user 消息一节点）：激活药丸跟随阅读位置（视口内最顶 user 消息）、悬停/聚焦弹 6 行截断预览卡、点击平滑跳转、>11 节点滑动窗口、导航条上滚轮逐条切换、整条可点无需瞄准；<2 条 user 消息或非对话页自动隐藏。支持**精选轮次**：assistant 操作条新增精选按钮（按会话存 localStorage），精选轮次在导航条上显示为金色药丸、恒可见、点击直达被精选的回复。零数据通道：全部读官方 DOM 锚点（`data-time-hover-root` / `data-chat-flow` / `data-turn-tail`）。 |
| **界面皮肤** | 「设置 → Web 增强 → 皮肤」：5 套内置皮肤（原生 / 深海 / 暖沙 / 森林 / 紫晶）经主题服务覆盖栈整体重着色，明暗两套色板成对定义、随「外观」自动切换，选择保存在浏览器本地。**自定义背景图片**：支持 PNG / JPG / WebP / GIF / AVIF / BMP / ICO / SVG（本地存储，超预算自动压缩后应用），与任意皮肤叠加；所有自定义背景统一淡化（高透明度蒙层 + 轻微模糊），内容卡片保持不透明，不影响阅读。 |
| **文件 mention** | 输入框 `+` 菜单里的「引用文件」「引用文件夹」两项：项目内条目以**缩进目录视图**呈现（文件夹与文件都有，可本地过滤），文件选择器里点击文件夹行即**进入该文件夹**——打开插件自带的文件浏览器并定位到该目录；浏览器按文件资源管理器方式工作（面包屑 / 上一级 / 主目录 / 逐层列表 / 按名过滤，点文件夹进入、点文件选中）。第一行在项目根目录打开同一个浏览器，也可以走到**项目外**。选中文件后把 `@路径` 插入草稿，含空格的路径自动加引号。 |
| **余额显示** | 输入框下方显示 DeepSeek API 余额（`GET /user/balance`），带刷新、弱化错误态，以及**当前会话已计费 token 的估算花费**（价格从 models.dev 拉取，USD / 百万 token）。**余额仅在当前会话的模型路由确实指向该余额所属账户时显示**——切到别家渠道（或把 deepseek-official 改指到自建网关）后余额部分隐藏，因为那时的数字说的是另一个账户；花费部分只在 models.dev 有对应 provider/model 的价格时显示。 |
| **识图（图片理解）** | 内置、透明的纯文本模型识图能力（取代 `DSH-vision`）。纯文本模型直接发图：绕过「当前模型不支持图片」的发送门禁与 `read_image` 工具门禁；对话记录照常保留图片（UI 与多模态模型一致），模型实际看到的是 `[图片内容描述]` 文本转写；多模态模型用**打补丁前的真实 resolver** 判定、原样放行，不为它们浪费识别 token。**两级用户模型池，按序回退**：DSH 模型池（勾选 DSH 已声明支持图片的模型保存为池；池空则自动探测）→ 本地 Ollama（自动探测）→ 独立识图 API 模型池（拉取 `/models` 后多选保存；可选一个优先模型，否则按池顺序）→ 静态 `visionFallbackModels` 回退链。端点路径带内容哈希缓存、分类错误、匿名端点硬超时与冷却；所有源都失败才给模型返回失败占位信息，**每次失败的尝试都会留在内存里并显示在识图页状态卡的「识别尝试失败记录」中**（来源、模型、错误、时间）。**设置 → Web 增强 → 识图是完整配置表单**，保存立即生效并持久化到 DSH settings；`cordis.patch.yml` 里的 `vision*` 静态配置作为底值保留。 |
| **设置页 + 插件管理** | 设置面板左侧多一行「Web 增强」（注册到 `settings.section`）。页内的**插件管理**列出当前 profile 装了哪些插件（名称、版本、依赖 spec、是否已启用为层），可**更新**或**移除**。列的是 profile `package.json` 的 `dependencies`——那才是 pnpm 能操作的集合；模板层（`@deepseek-ai/dsh-base` 等）单独列出且不给按钮，因为没有任何依赖提供它们。**只看得到启动时所用的那个 profile**（`dsh --profile web` 就只列 web 的依赖），profile 名与路径印在标题下。**所有操作都在下次启动才生效**（层栈在启动时组合），界面照直说明；移除本插件自己不被阻止，但确认框会说清代价。 |
| **模型能力页** | 设置面板在宿主「模型」页之后新增一行「模型能力」，编辑宿主模型页刻意留空的字段，走同样的 `settings.mutate` 路径补丁纪律。**DeepSeek 官方**：渠道级 `thinking`（enabled / disabled）与 `reasoningEffort`（off / high / max），并校验「禁用思考时只能 off」的适配器约束。**已配置的 pi-ai 渠道**：渠道级 `defaultInput` 与默认 `reasoning` 档位；每个模型级 `input`（text / image）与 `reasoningEfforts`（继承目录能力 / 不支持推理 / 自定义七个 pi-ai 档位及 wire 值）。目录渠道通过最小 `modelOverrides` 条目覆盖（下拉选择模型即可新增）；已拥有 `models` 列表的渠道在原列表行内编辑。保存立即生效，宿主页字段与未知字段不会被改写。 |

## 截图

由 `scripts/e2e.mjs --capture` 在真实 UI 上截图（无需模型 key）：

| 任务看板 | Git 图谱 |
|---|---|
| ![任务看板](./assets/board.png) | ![Git 图谱](./assets/graph.png) |

| 浮动面板 | 余额行 |
|---|---|
| ![工作区](./assets/panel.png) | ![余额行](./assets/balance.png) |

## 安装

插件是一个 bundle 组合包（`dsh.bundle`），安装进 Web profile：

```sh
dsh plugin --profile web add git+https://github.com/banlanzs/dsh-web-enhanced.git   # 推荐
# 或：
# dsh plugin --profile web add ./dsh-web-enhanced-0.12.1.tgz
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

### 更新

**不需要先卸载再装。** `dsh plugin` 是一个 pnpm 转发器：它把参数原样交给 profile 目录里的 `pnpm` 执行，再按**已安装状态**重新对齐 bundle 层列表。所以更新就是一条命令，然后重启 DSH：

```sh
dsh plugin --profile web update dsh-web-enhanced
dsh --profile web
```

要点：**`install` 拉不到新提交，`update` 才行。** `github:banlanzs/dsh-web-enhanced` 这种没写 ref 的 spec 跟的是默认分支，但 pnpm 会把当时解析到的 commit 钉进 profile 的锁文件：

```
dsh-web-enhanced: github:banlanzs/dsh-web-enhanced
  → codeload.github.com/banlanzs/dsh-web-enhanced/tar.gz/<commit>
```

`pnpm install` 尊重锁文件、只会重装同一个 commit；`update` 会重新解析分支 HEAD 并改写锁文件。

层列表按「已安装状态」而不是「依赖差异」对齐是刻意的：这样某个包在新版本里**才开始**声明 `dsh.bundle` 时，`update` 也能把它加进层栈。

万一某次 `update` 没动（pnpm 对 git 依赖偶尔会啃缓存），退路依次是 `--force`，再不行才是 remove + add：

```sh
dsh plugin --profile web update --force dsh-web-enhanced
# 仍然不动时的兜底
dsh plugin --profile web remove dsh-web-enhanced
dsh plugin --profile web add git+https://github.com/banlanzs/dsh-web-enhanced.git
```

### 开发迭代

本插件**不能**用 `link:`（见上文提示——它会复制一份宿主包，从而静默地让所有
host 能力失效）。改用打包重装来迭代：

```sh
cd dsh-web-enhanced
pnpm install && pnpm run check && npm pack
dsh plugin --profile web remove dsh-web-enhanced
dsh plugin --profile web add ./dsh-web-enhanced-0.12.1.tgz
```

Windows 上 tarball 安装需要真正的符号链接权限（pnpm 的 `importPackage` 步骤）。
若报 `EPERM ... symlink`，可开启开发者模式，或改用 git URL 安装（不走该路径）。

## 配置

插件行 config 字段（均有默认值；`vision*` 各项也可以在 设置 → Web 增强 → 识图 里在线编辑，界面保存的值覆盖这些底值、立即生效）：

| key | 默认 | 含义 |
|---|---|---|
| `cronIntervalMs` | 30000 | 调度器最小触发间隔；定时器按最近一次待执行任务一次性布防，无任务时不布防 |
| `balanceApiKeyEnv` | `DEEPSEEK_API_KEY` | 余额查询的 API key 环境变量 |
| `balanceCacheTtlMs` | 60000 | 余额视图缓存时长 |
| `balanceBaseUrl` | `https://api.deepseek.com` | 余额端点基址 |
| `balanceProviders` | `[deepseek-official]` | 余额行只对这些模型渠道显示；渠道另配了 baseURL 时还要与端点同主机 |
| `modelsDevUrl` | `https://models.dev/api.json` | 会话花费估算拉取价格表的地址 |
| `modelsDevCacheTtlMs` | 21600000 | 价格表缓存时长（6 小时） |
| `modelsDevTimeoutMs` | 10000 | 价格表请求超时 |
| `pricingProviderMap` | `{deepseek-official: deepseek}` | 模型渠道 provider id → models.dev provider id |
| `skipDirs` | `[node_modules]` | 文件树/搜索与 mention 选择器跳过的目录（`.git` 恒跳过；文件浏览器不套用该过滤） |
| `readMaxBytes` | 1 MiB | 文本读取上限（超出截断标记） |
| `writeMaxBytes` | 2 MiB | 文件写入上限 |
| `binaryMaxBytes` | 5 MiB | 二进制预览（base64）上限 |
| `gitOutputMaxBytes` | 256 KiB | git 单流输出上限 |
| `gitMaxCount` | 100 | git log 行数上限 |
| `gitWorkingMaxFiles` | 300 | 未提交改动的文件数上限；也限定了最多读多少个未跟踪文件来数行数 |
| `searchMaxDepth` / `searchMaxEntries` | 8 / 200 | 文件搜索深度与条数上限 |
| `officeMaxBytes` | 5 MiB | Office（docx/xlsx）预览文件大小上限 |
| `browseMaxEntries` | 500 | mention 浏览器单层目录的条目上限 |
| `pluginOpTimeoutMs` | 300000 | 单次 pnpm 操作（update/remove）的超时 |
| `profileDir` | 空 | profile 目录；留空则从本模块位置向上探测。仅用于 profile 不在插件模块祖先链上的部署 |
| `visionEnabled` | true | 识图集成总开关 |
| `visionPatchAdmission` | true | 包装 `llm.resolveModelInfo`，让纯文本模型通过发送门禁与 `read_image` 门禁（可逆、卸载顺序安全） |
| `visionProvider` / `visionModel` | 空 | 指定用于转写的 DSH 模型渠道/模型；留空则从所有已配置渠道自动探测支持图片的模型 |
| `visionHarnessModels` | `[]` | 用户勾选的 DSH 模型池 `[{provider, model}, …]`，按序尝试后才轮到独立 API；非空时替代自动探测（钉选对仍最优先） |
| `visionPrompt` / `visionMarker` | 中文详尽描述提示词 / `[图片内容描述]` | 转写提示词，以及模型看到的图片替代标记 |
| `visionBaseUrl` / `visionApiKey` / `visionEndpointModel` | 空 | OpenAI 兼容 VLM 端点（如 DashScope 兼容模式）；key 依次回退 `visionApiKeyEnv` → `VISION_API_KEY` → `DASHSCOPE_API_KEY`。base URL 或模型任一为空则不启用该来源 |
| `visionEndpointModels` | `[]` | 独立端点的模型池；设置页拉取 `/models` 后多选保存。转写先试 `visionEndpointModel`（设了的话），再按池顺序逐个试 |
| `visionApiKeyEnv` / `visionAnonymous` | `VISION_API_KEY` / false | 端点密钥环境变量；true 时不带 Authorization 头（匿名/免费端点强制 20s 硬超时） |
| `visionTimeoutMs` / `visionMaxTokens` | 120000 / 4096 | VLM 请求超时与输出上限 |
| `visionAutoLocalOllama` | true | 启动时探测 `visionLocalOllamaUrl`；检测到本地 Ollama 后把它的第一个视觉模型加进转写链最前（图片不出本机） |
| `visionLocalOllamaModel` / `visionLocalOllamaUrl` | 空 / `http://localhost:11434/v1` | 优先使用的 Ollama 模型（空则选第一个 `*vl*`/`*vision*` 模型）与其 OpenAI 兼容基址 |
| `visionFallbackModels` | `[]` | 有序回退链 `{model, baseURL?, apiKey?, anonymous?, timeoutMs?}`；每条可指向不同供应商，无密钥的非匿名条目自动跳过 |
| `visionCacheLimit` / `visionCooldownMs` | 200 / 60000 | 进程内转写缓存条数（按图片字节 SHA-256）与刚失败（429/超时）端点的冷却时长 |

## 架构要点

- **零仓库改动**：客户端 UI 只注册到既有槽位——`conversation.view`（工作区视图标签页，内含文件/预览/变更/**任务看板**/**Git 图谱** 五个 tab）、`shell.overlay`（mention 文件浏览器浮层）、`conversation.session.header.actions`（会话标题旁 `titleCluster` 行里的分支切换器）、`conversation.composer.dock`（余额 + 本轮花费行），外加通过 `ctx.commandUi.register` 注册的两个客户端命令（`+` 菜单里的文件 / 文件夹 mention）。未占用布局的 `details` 槽：那是已被 ui-conversation 的 `DetailsPanel` 占据的 `single` 槽，注册进去会顶掉工具详情列。
- **可选服务一律非注入读取**：`agentPresets`、`llm`、`settings`、`credentials`、`modelDirectories`、`commandUi`、`conversation` 都用 `ctx.get()` 取，缺任何一个只让对应的那一小块降级，不会让插件入口卡住不启动。
- **识图走宿主的「模型可见表面」而不是改适配器**：`visionIntegration` Cordis 服务可逆地包装共享 `llm.resolveModelInfo`（包装带标记，卸载时只有当前仍是自己的包装才还原，绝不误拆后来者的包装）。`agent/pre-step` 为含图消息计算描述并写入 `session` 表面替换（`surfaceOp: replace`）——模型推导历史读到文字，原文 append 的图片留在对话记录里；包装后的 `session.deriveMessages` 覆盖替换微任务落盘前的那一步请求，`tools/post-execute` 对 `read_image` 结果做同样替换。多模态判定始终读补丁前捕获的原始 resolver。转写引擎 `VisionTranscriber` 依次尝试 DSH 已配置的视觉模型（`llm.stream`）、本地 Ollama、OpenAI 兼容端点回退链（回退、内容哈希缓存、分类错误、冷却——这部分健壮性来自 `dsh-vision-proxy`）。
- **任务执行**：`agentPresets.resolve()` 解析部署默认 preset → 写进 `meta.agentPreset` → 在 `setup` 里 `mount`（与宿主 `ensureSession` 同序），随后 `workspace.attachSession` 把会话记到项目上；之后 `followup` + `whenIdle` + `sessions.flush`，结果按 `turn/end` reason 回写。没有 preset 名册的部署照常运行，只是会话只带宿主根注册的工具。
- **手写 remote contribution**：host 方法用 `@Remote` 装饰器（Typert SRC 模式，宿主网关自动发现 `ctx.webEnhanced` 服务）；客户端在 apply 里 `ctx.remote.$mount()` 手写的 src-json contribution，无需 typert 生成管线。
- **持久化**：任务记录存 `ctx.storageDomain` 域 `web_enhanced`（JSON 后端），重启恢复 running → failed（host-restart）。
- **未提交改动只读不写**：三条命令（`diff --cached --numstat`、`diff --numstat`、`ls-files --others --exclude-standard`）——git 算的是三个不同的 diff，没有哪一条能一次回答完。未跟踪文件根本没有 numstat，而唯一能让它有的办法是先入索引（那是改仓库），所以它的新增行数改由宿主侧有界读取数出；文件列表先截断**再**去读，因此几千个未跟踪文件不会变成几千次读盘。
- **路径安全**：所有 fs/git 路径经工作区根校验（拒绝绝对路径、`..`、反斜杠）；单 ref 参数拒绝 `-` 开头、`..` 范围与空白/通配（防止一个参数变成两个或变成选项）；git 输出有界收集；文件读有字节上限与二进制嗅探。Office 文件在宿主侧用 fflate 解包为有界结构化 blocks（标题/段落/列表/表格，≤ 2000 块、≤ 200×50 表格），绝不产出原始 HTML。
- **唯一的例外：`fsBrowse`**。它列出任意绝对目录，不受工作区根约束——因为 mention 产出的只是一个**路径字符串**，而用户要的路径可能就在项目外。它只返回名称、类型与大小；读、写、预览仍然全部锁在工作区内。
- **插件管理不改宿主任何文件**：设置页注册进既有的 `settings.section` 槽；配置与清单走本插件自己的 Typert 网关，因此不需要像 DSH-vision 那样去改 apiproxy 的 settings 暴露白名单（那是改 `node_modules` 里的宿主发布产物，每次升级会被覆盖）。remove/update 只在 profile 目录里跑 pnpm、重写该 profile 的 `dsh.profile.bundles`——与 `dsh plugin` 完全同一条路径。也没有把 `@deepseek-ai/dsh-app-boot`（CLI 里这些例程的归属）写成 peer：它是 dsh 安装的依赖而非 profile 的依赖，那样恰好会在这段代码唯一运行的部署里解析失败。
- **预览安全**：markdown / CSV / diff / Office / 表格全部渲染为 React 元素，从不 `dangerouslySetInnerHTML`。markdown 里的 HTML 走白名单映射到对应元素，未知标签只丢标记保留文字，`script`/`style` 连内容一起丢；`javascript:`/`data:` 链接降级为字面文本（`data:image/*` 的图片除外），HTML 文件预览进 `sandbox=""` iframe。

## 开发

```sh
pnpm install
pnpm run check   # typecheck + 全部测试 + 构建（297 个测试）
```

构建产物：
- `lib/index.js` — node half：`web-enhanced` 函数插件（挂载 `WebEnhancedGateway` Typert 服务：task*/git*/fs*/balanceGet/pricingGet/visionStatus/visionConfigGet/visionConfigSet/visionEndpointModels + cron 调度器 + 重启恢复，以及带 settings 命名空间的 `VisionInterceptor` 识图服务）
- `lib/client.js` — 浏览器 half：模块加载器闭包格式（`window.__ModuleLoader__.load`），由 `dsh.client` manifest 声明
- `cordis.patch.yml` — bundle 补丁：插入 `web-enhanced` 行（一个行同时承载 node 与 browser 两个 half）

### 真机 e2e（无模型 key）

真实链路全跑：临时 dsh web → 安装插件 → 浏览器打开工作区视图里的看板/图谱标签页、会话浮动面板与余额行，全程不 mock：

```sh
# 需要宿主构建：DSH_ROOT（默认 ~/.dsh/source/current）内先 pnpm run build
node scripts/e2e.mjs --smoke --install link --port 3190
node scripts/e2e.mjs --capture   # 顺带刷新本 README 使用的 assets/*.png
```

前置：PATH 上有 `dsh`/`pnpm`，以及主仓 web 构建产物（playwright 从主仓解析）。PASS 退出码 0；失败保留 `e2e-fail-*.png` 截图并打印 `dsh-web.log` 尾部。

## 已知限制

- 工作区为视图标签页而非并排列：激活时取代对话记录显示，而不是与其并排；它自身不拥有宽度与折叠状态。
- markdown 中的 HTML 只做白名单渲染：`<table>` 按结构解析，行内标签映射到对应元素，其余标签只保留文字。`<details>`、内联 `style`、自定义元素不还原。
- mention 的项目内列表一次性列出宿主搜索上限（`searchMaxEntries`，默认 200）内的条目，并保持 `skipDirs` 过滤（默认 `node_modules`，`.git` 恒隐藏）：依赖目录正是几乎不会被引用的路径，列出来会把真正的项目文件挤出这批结果。每层遍历都是文件优先、再进子目录，因此根目录的 `TODO.md` 这类文档一定在批次内。弹层内的搜索是对这批结果的本地过滤，不是逐键重新查询。要越过上限、走到项目外、或进入被跳过的目录，用第一行的「浏览其他位置…」——它的浏览器不套用 `skipDirs` 过滤。
- mention 浏览器是应用内的文件管理器，不调系统对话框：宿主的 `host.pickDirectory` 只选目录且只在 `native` 能力下可用，浏览器的 `<input type="file">` 出于安全也不给绝对路径。Windows 上的盘符列表靠 26 次并发 `stat` 探测得到（Node 无原生绑定就拿不到盘符表），断连的网络盘符可能让这一步慢上一两秒；未映射为盘符的 UNC 共享（`\\server\share`）目前走不到。
- Office 预览为结构化视图：docx 的标题/段落/列表/表格与 xlsx 首个工作表可预览；内联样式（加粗/颜色）、图片与多工作表不保留。旧版 `.doc`/`.xls` 二进制格式不支持预览。
- 定时任务为 best-effort：tick 粒度 30s，宿主关机期间错过的窗口在启动时补跑一次，不留积压。
- 余额 key 与模型提供商同源（环境变量）；未配置时显示错误态而非报错。切到非 `balanceProviders` 的渠道时整行隐藏。
- 图谱泳道为简化算法（首父连续性），非 git 完整拓扑着色；提交详情的文件清单按首父 diff 统计，合并提交因此只显示它带进来的改动。
- 未提交改动行：未跟踪文件的行数由宿主读文件数出（git 对未跟踪路径没有 numstat，而生成 numstat 就得先入索引——那是修改仓库），二进制、超过 `readMaxBytes` 或读取时已消失的文件报 `—`；同一文件既暂存又继续改过会出现两行（那是 git 算的两个 diff）。HEAD 不在当前绘制范围内时该行置顶且不连线。
- 分支切换不做 stash，也不阻止脏切换：git 会把不冲突的改动带过去，冲突时自行拒绝；这里只是切换前告知并让你确认。
- 插件管理**不重载运行中的进程**：Cordis 在启动时组合层栈，所以 update/remove 描述的是下一次启动。同理它也不做 enable/disable——那要改的是 profile 的 `cordis.patch.yml`，与安装是两回事。
- 插件管理**只看得到启动时所用的 profile**：`dsh --profile web` 列的是 `~/.dsh/profiles/web` 的依赖，装在别的 profile 里的插件不会出现。profile 目录就是 pnpm 的工作目录，跨 profile 操作会在一个此刻并未组合层栈的目录里跑 pnpm。要管别的 profile，用那个 profile 启动，或走 `dsh plugin --profile <name>`。
- 插件管理需要 PATH 上有 `pnpm`，且 profile 目录在本插件模块的祖先链上（正常安装即满足；源码检出或测试环境会显示「没有可管理的插件」而不是报错）。同时只允许一个 pnpm 操作在跑，第二个请求会被告知而不是排队。
- 识图至少需要一种转写源：DSH 里配置一个多模态模型、本地 Ollama、或独立识图 API。三者都没有时，发给纯文本模型的图片会被替换为占位描述而不是让整个回合报错，设置页的「识图」标签页会显示原因。该标签页同时就是这三者的配置入口，保存立即生效（`vision*` 静态配置作为底值保留）。转写质量取决于所选视觉模型的能力上限，不是插件的保证。
- 端点转写会把图片字节（base64、HTTPS）发给配置的 VLM 端点——除非端点是本机服务（如 Ollama），图片会离开本机。除进程内内容哈希缓存外不保存任何东西。DSH 模型路径在同一轮内按图片去重，但不跨轮缓存；端点路径按图片内容跨轮缓存。
- 不要再同时安装 `DSH-vision`（`dsh-image-vision`）：两个插件都会打发送补丁、都会对同一张图识别一次。本插件的补丁自身卸载顺序安全，但 DSH-vision 的卸载会还原它自己捕获的方法，仍可能覆盖后来挂上的包装。
- 暂未内置大图缩放（`dsh-vision-proxy` 里可选的 `sharp` 步骤）；端点收到的是原始字节，`visionMaxTokens` 仍会限制转写输出长度。

## License

MIT
