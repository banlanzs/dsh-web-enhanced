# Changelog

## [0.5.1] - 2026-08-15

### 修复：覆盖层内部不随弹窗尺寸伸展

根因在共享的 `OverlayShell`：`.body` 只有 `overflow: auto`，内容按**自身**高度排版，面板剩下的高度就成了空白。新增 `fill` 模式——`.body` 变成 flex 列容器，内容拉伸到面板高度并自持滚动区；看板与文件选择器启用，Git 图谱保持原样（提交历史本来就是自上而下读的文档流）。面板尺寸一点没动：改的是内部的拉伸与滚动归属。

**任务看板**：「列太窄」和「有横向滚动条」是同一个根因——`.columns` 用的是 `grid-auto-columns: minmax(230px, 1fr)`，而 `1fr` 轨道本来就不会缩到内容最小宽度以下，再叠一个 230px 下限，五列在 ~1150px 的面板里根本放不下，于是**既溢出又不变宽**。改成 `grid-template-columns: repeat(5, minmax(0, 1fr))`——`minmax(0, …)` 才是让轨道真正可缩的那一半；只有窗口窄到五列不可读时（`width <= 900px`）才退回可横向滚动的布局。列的高度原本由内容决定（`align-items: start`），所以面板下方大片空白；现在列拉伸到面板高度，每列的卡片列表各自纵向滚动，长列不顶开别人、短列下面也不留死区。卡片去掉 `-webkit-line-clamp`（prompt 3 行、result 4 行就是「内容大量截断」的来源），改为按内容撑高，长路径在卡片内换行而不是撑破列宽。

**文件选择器**：`.rows` 原本写死 `max-height: 52vh`，和 `min(760px, 100%)` 的面板高度对不上，底部必然留白；改为 `flex: 1; min-height: 0; overflow: auto`。列表同时改成 `repeat(auto-fill, minmax(280px, 1fr))` 的多列网格——单列在 1100px 宽的弹窗里浪费掉绝大部分横向空间。行内的 `.name` 补 `flex: 1`，否则名字不撑开、行看着是空的。

## [0.5.0] - 2026-08-15

### 修复：任务执行的会话既没有工具也没有项目

两条根因叠加。其一，任务会话是用 `agents.create` 裸建的，**没有组合 agent preset**——而 `bash` / `read_file` / `write_file` 这些工具是由 preset 所组合的插件注册的，不是宿主根注册的，所以任务会话只剩下根上那几个（现场表现是工具列表只有 `render_ui` 与 `validate_dsh_ui`），提示词再对也做不成事。其二，会话创建后**没有 `workspace.attachSession`**，于是 UI 里那个会话不属于任何项目。

现在按宿主 `api-proxy` 自己的 `ensureSession` 口径来：`agentPresets.resolve()` 先拿到 preset id（必须在建会话前，因为会话边界会在 setup 开始前就把 `meta` 定格）→ 写进 `meta.agentPreset` → 在 `setup` 内 `mount`（放在 setup 里，组合失败就整体回滚，而不是留下一个能力装了一半的会话）→ 建成后再 `attachSession`（注册表要拿会话头的 canonical cwd 去校验，所以必须后于会话存在）。附着被拒只记一条告警：会话已经在正确目录里跑起来了，为一次记账失败丢掉它更糟。没有 preset 名册的部署照常运行。

### 新增：余额行按当前模型渠道显隐

余额端点服务的是**一个供应商的一个账户**。会话切到别家渠道后那个数字说的是另一个账户，比不显示更糟。`balanceGet` 现在带上会话当前的 `provider`，宿主用 `llm.listConfigurableProviders()` 找到该路由的设置节，再从 `settings` 里读出它**实际配置的 baseURL**，与余额端点同主机才回 `applicable: true`，否则整行不渲染、也不发请求。把 `deepseek-official` 改指到自建网关同样会隐藏。新增 config `balanceProviders`（默认 `["deepseek-official"]`）。

### 新增：Git 图谱的分支筛选与提交详情

- 图谱标题栏加分支下拉（全部分支 / 单分支）。它**只**决定图谱从哪段历史画泳道，不动仓库——输入框上方那个分支条才是 checkout，两个控件回答两个不同的问题。
- commit 行可点开：新增 `gitCommit` 远程（`git show --first-parent --numstat`）返回完整 hash、父提交、作者与邮箱、时间、提交正文，以及逐文件增删行数。二进制文件 git 报 `-`，这里也照样显示 `—` 而不是伪造成 0。合并提交按首父统计，因此只显示它带进来的改动。

### 新增：输入框 `+` 菜单里的文件 / 文件夹 mention

用 `ctx.commandUi.register` 注册 `mention-file` / `mention-folder` 两个客户端命令（popupSelect），选中后向草稿追加 `@路径`，含空格的路径自动加引号。

写入必须**晚于**弹层自己消费 `/mention-file` token 的那一步——那步带 draftRev CAS，先改草稿会让 CAS 失效、命令文字留在输入框——所以走一个宏任务延后，有测试盯着这个顺序。

**项目外的路径**：popupSelect 是一次性取数 + 本地过滤的扁平列表，走不了目录，所以第一行是「浏览其他位置…」，点开插件自己的浏览器浮层。新增 `fsBrowse` 远程列出**任意绝对目录**（目录在前、文件在后，各自按名排序，有条数上限并如实报 `truncated`）——这是本插件唯一不受工作区根约束的 fs 能力，理由是 mention 产出的只是一个**路径字符串**；读、写、预览仍然全部锁在工作区内。新增 config `browseMaxEntries`（默认 500）。

浏览器浮层做的是应用内的文件资源管理器（面包屑、上一级、主目录、按名过滤），而不是调系统对话框：宿主的 `host.pickDirectory` 只选**目录**且只在 `native` 能力下可用，而浏览器的 `<input type="file">` 出于安全根本不给绝对路径——两条都满足不了「文件 + 绝对路径 + Web 部署」。

### 修复：预览里的 markdown 表格与 HTML 语法

- 新增 GFM 管道表格：`:---:` 三种对齐、`\|` 转义、按表头宽度补齐或裁掉参差的行。表格只由「表头 + 分隔行」这一**对**认领，所以孤立的竖线行仍是段落、正文下面的 `---` 仍是分割线。
- 新增 HTML `<table>` 的结构化解析（文档里表达不了的单元格常改用它，扁平化会把每个单元格挤成一段话）。
- 行内 HTML 走白名单映射到真实元素（`b/strong`、`i/em/var/cite`、`code/kbd/samp/tt`、`del/s/strike`、`a`、`img`、`br`）；未知标签只丢标记、保留文字（sanitizer 的形状），`script`/`style` 连内容一起丢；并解码手写文档里常见的实体。
- 仍然不用 `dangerouslySetInnerHTML`——整个预览是 React 元素，所以任意 HTML 本就不可能原样执行；`javascript:`/`data:` 链接照旧降级为字面文本，`data:image/*` 的图片是唯一例外（那是自包含文档嵌图片的常规写法，渲染的是位图，不是标记）。

### 安全

- 新的分支 / commit 参数会作为 git 参数拼进命令行，因此加了单 ref 校验：拒绝 `-` 开头（会被当成选项）、`..` 范围、空白与通配（一个参数会变成两个）。

### 变更：工作区表面改为会话视图标签页

文件 / 预览 / 变更从 `shell.overlay` 的右侧停靠浮层，改为注册到 `conversation.view`——「对话」「轨迹」所在的那个视图环。视图环一次只渲染一个条目、占满整列，所以这个表面**不再拥有任何几何**：宽度拖拽、双击把手复位、折叠状态与宽度按项目持久化这三项随之取消（它们归框架管，一个 tab 去抢会和框架打架）。留下的持久化是当前面板 + 展开的目录（后者仍按 workspace 分）。持久化键升到 `dsh.webEnhanced.panel.v2`。

### 接口变化

- 远程方法 20 → 22：新增 `gitCommit`、`fsBrowse`；`balanceGet` 从无参改为带 `{ provider? }`（descriptor 的参数元数就是宿主签名，有 arity 守卫测试）。
- `BalanceView` 新增 `applicable`；`GitLogRequest` 新增 `branch`。
- config 新增 `balanceProviders`、`browseMaxEntries`。
- 测试 148 → 173。

## [0.4.0] - 2026-08-14
### 客户端重写 + 两处运行时阻断修复

**修复：Typert 参数元数不匹配（此前 20 个 remote 方法中 16 个在运行时直接失败）**
网关按 `descriptor.parameters` 的顺序把参数**展开为位置实参**调用 host 方法（`Reflect.apply`），客户端侧同样断言实参个数必须等于参数个数。而此前 `taskCreate` 声明了 3 个参数、`gitLog` 等声明了 2 个，host 签名与客户端调用却都是单个 request 对象——每次调用都抛 `expected N argument(s), got 1`。只有 `taskList` / `balanceGet` / `gitBranches` / `gitStatus`（0 或 1 参数）能跑通。
现在每个方法恰好声明一个 `request` 参数；`gitBranches` / `gitStatus` 的网关签名相应改为请求对象。新增 arity 守卫测试锁定该契约。

**修复：任务的工作区绑定在 wire 上丢失**
`TaskCreateRequest.workspaceId` 存在但 descriptor 未声明该参数，`TaskUpdateRequest` 则完全没有该字段，定时任务因此落到 `process.cwd()` 而非目标项目。现在 create/update/run 三条路径都能绑定与改绑工作区（`null` 清除，省略保持）。

**修复：`git status -z` 重命名解析方向反了**
porcelain v1 的 `-z` 输出为 `XY <新路径>\0<原路径>\0`，此前拼成了 `新 -> 原`，且把拼接结果写进 `path` 字段——该字段还要作为 git 路径参数传给 stage/unstage/discard，重命名条目因此不可操作。现在 `path` 恒为当前路径，原路径单独走 `origPath`。

**修复：cron 的 day-of-month × day-of-week 语义**
此前用值集合大小（`days.size === 31`）判断字段是否通配，显式写出的 `1-31` 会被误判为通配而走错分支（`0 9 1-31 * 1` 会只在周一触发，而非每天）。现在解析时记录字段原文是否为 `*`。

**修复：构建不确定，CI 漂移门会随机失败**
lightningcss 不保证其 `exports` 对象的迭代顺序，CSS Modules 类名映射因此在每次构建间换序——同一份源码两次构建产出的 `lib/client.js` 字节不同（实测三次哈希两两不等）。而 CI 有 lib 与 src 漂移门。现按本地类名做固定 UTF-16 排序（不用 `localeCompare`，其结果随系统语言环境变化），三连构建哈希已一致。

### 客户端槽位落位重做
- **右侧面板**从 `conversation.input.dock`（输入框上方的 dock，session scope）迁到 `shell.overlay`。此前它活在会话列的滚动容器里、随会话切换重建，靠 CSS 伪装成右侧面板。`shell.overlay` 是框架明确提供的加性浮层座位（位于所有列之上、在其滚动容器之外）。未占用 `details`——那是已被 ui-conversation 的 DetailsPanel 占据的 `single` 槽，注册进去会顶掉宿主的工具详情面板。
- **看板 / 图谱**改为入口与本体分离：按钮留在 `sidebar.footer.action`，覆盖层本体注册到 `shell.overlay`，不再从侧边栏按钮内部渲染全屏浮层。

### FEATURE-REQUEST 补齐
- 文件树整行点击展开、按文件名搜索（防抖，走 host 侧有界递归搜索）
- 预览分屏编辑与保存回写；源码/分屏/预览三态；`markdown` / `html` / `code` / `diff` / `csv` / `pdf` / `office` / `image` / `text` 分格式渲染
- 面板宽度拖拽、双击把手复位、折叠状态与宽度**按项目持久化**（宿主 `ctx.layout` 只有开合、无宽度 API，故由插件自持）
- 任务卡片内联编辑 cron 与绑定项目

### 类型与安全
- 消除 `ctx.sessions as unknown as {...}`、`useStore as (...)`、`useSessions(...) as {...}` 等结构性强转——根因是组件编译单元缺少 `dsh-client-runtime/client` 的 declaration merge
- store 动作签名去掉 `any[]`
- 跨 scope 共享状态改用 inject 面的 `hooks` 舱（slot store 句柄被钉在首次挂载的 scope，无法同时服务 `root` 与 `session` 座位）
- Markdown / Office / CSV / diff 全部渲染为 React 元素，无 `dangerouslySetInnerHTML`；`javascript:` / `data:` 链接降级为纯文本；HTML 预览走 `sandbox=""` iframe

## [0.3.0] - 2026-08-17
### 功能重实现（按 FEATURE-REQUEST 从零重写 src）
- **任务看板**：五列 + 创建（含 cron）+ 执行/回写/跳会话 + 定时调度/重启恢复；**新增卡片内联编辑表单**——可改 title / prompt / cron（空 = 清除定时，保存时校验并重算 nextRunAt）/ 状态列（planned/todo 自由选，done/failed 改回即重开；running 保持拒绝编辑守卫）
- **Git 图谱**：分支条（当前分支/切换/提交历史 popover/图谱入口）+ SVG 泳道图谱（首父连续泳道 + 合并横向连线）
- **右侧面板**：文件树/搜索/SCM（stage/unstage/discard + 逐文件 diff）/宽度拖拽/双击复位/折叠持久化；**新增 diff 预览**（`.diff`/`.patch` → 行级高亮 unified diff，SCM 差异块复用同一渲染器）；**新增 Office 预览**（docx/xlsx host 侧 fflate 解包 → 结构化 blocks，client 白名单 React 渲染，无 HTML 注入面；有界：文件 ≤ officeMaxBytes、块 ≤ 2000、表格 ≤ 200×50，截断带标记）；**新增分屏编辑**（源码/分屏/预览三态，分屏态左编辑右预览 + 可拖分隔条 25%-75%）
- **余额显示**：`GET /user/balance` + Bearer，缓存 TTL + 刷新 + 弱化错误态
- **架构重构**：host 侧从单一 index 拆为 gateway（Typert 装配）/ board（任务领域 + 调度）/ office（转换）/ files / git / balance / cron / run-task；client 侧 remote 贡献独立为 remote.ts
- **接口变化**：remote 新增 `fsOfficePreview`（`{workspaceId, path}` → `{kind, blocks, truncated}`）；`Config` 新增 `officeMaxBytes`（默认 5 MiB）；locale 新增 `board.edit` / `panel.split` / `office.*` 键（zh/en）
- **依赖**：新增 `fflate`（node 侧，client bundle 零增重）
- **测试**：87 个全绿（+11：office 转换层 8 + gateway Office 链路 3，含截断/超大/损坏/不支持格式负例）

## [0.2.0] - 2026-08-16
### 工程重塑（独立仓库形态）
- **独立仓库化**：插件从 deepseek-harness 内嵌工作区包改为可单独发布的仓库——自带 `pnpm-workspace.yaml` + `pnpm-lock.yaml`（自包含 workspace，pnpm 自动排除出父 workspace），本地继续消费已发布 `@deepseek-ai/*` rc.6 包，开箱可构建
- **发布元数据补齐**：`repository` / `homepage` / `bugs`（`omdsh-dev/dsh-web-enhanced`，占位可改）、`keywords`、`publishConfig.access: public`、`engines`（node ^22.19 || >=24）、`packageManager`；新增 `check` 脚本（typecheck + 测试 + 构建）
- **CI 全门禁**（`.github/workflows/ci.yml`）：Node 22/24 矩阵 + 宿主 clone/build + `check` + pack 校验门 + lib 与 src 漂移门 + 无模型 key 真机 e2e smoke
- **脚本**：`scripts/install.sh` 一键安装（前置自检 + 幂等 + git URL 安装）；`scripts/verify-pack.mjs` 真实 tarball 校验（必需条目 / 禁用条目 / 体积上限）；`scripts/e2e.mjs` 真机 e2e（无 key 全链路：侧边栏入口 → 看板 → 图谱 → 浮动面板 → 余额行，`--capture` 截图）
- **构建卫生**：client bundle 关闭 sourcemap（确定性构建），tsconfig 关闭 sourceMap，tsbuildinfo 移出 `lib/`；`lib/` 构建产物随仓提交，发布包不含 `src/`、`.map`、`.tsbuildinfo`
- **文档**：英文 README + 中文镜像、CHANGELOG、MIT LICENSE、hub 收录登记建议（`docs/hub-registration.md`）
- **功能与架构零改动**：任务看板 + cron、Git 图谱、文件/预览/SCM 浮动面板、余额显示、Typert remote 网关、客户端槽位注册方式全部保持原样

## [0.1.0] - 2026-08-10
### 新增
- **任务看板**：侧边栏入口；五列组织（待规划/待办/进行中/已完成/已失败）；卡片「执行」开真实 DSH 智能体会话运行任务提示词，完成后状态与结果自动回写；「查看会话」跳转执行会话；支持 5 字段 cron 定时，到期自动运行，宿主重启后补跑并恢复中断任务
- **Git 图谱**：侧边栏入口打开图谱覆盖层；分支泳道 + 提交历史 SVG 渲染（首父连续泳道 + 合并横向连线）；输入框上方分支选择条（切换分支、最近提交、打开图谱）
- **右侧浮动面板**：预览 / 文件 / 变更三标签；文件树展开、文件名搜索、点击打开预览；预览支持 markdown / HTML（sandbox iframe）/ 代码 / CSV / 图片 / PDF / 文本，可源码-预览切换并保存；变更页基于真实 git status，支持 stage / unstage / discard 与逐文件 diff；宽度可拖拽、双击复位、折叠与宽度按工作区持久化
- **余额显示**：输入框下方显示 DeepSeek API 余额（`GET /user/balance`），带刷新与弱化错误态
