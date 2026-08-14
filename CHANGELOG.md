# Changelog

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
