# Changelog

## [0.16.1] - 2026-08-16

### 修复：资源管理器左右两栏不再共用滚动

- 根因在工作区视图没有接管宿主的滚动模型：默认布局下 `conversation.view` 的 viewArea 随内容长高、整页滚动，两栏自然一起滚。现按宿主原生契约（轨迹视图同款）在视图根上声明 `data-conversation-composer-overlay`——宿主改为给视图定高并 `overflow: hidden`，视图自持全部滚动区。
- 配套：文件树列表改为自身滚动区（`.list` 独立滚动 + 细滚动条），分栏容器裁剪；视图底部按宿主发布的 `--dsh-composer-height` 预留浮动输入卡空间。

## [0.16.0] - 2026-08-16

### 移除：取消 Web 终端支持

- 按需求回退 0.15.x 引入的 Web 终端：删除「终端」标签页、`TerminalPane`、网关 6 个 `terminal*` Remote、Typert 描述符、wire 类型与中英文案，以及 `@deepseek-ai/dsh-terminal` / `dsh-terminal-bash` 依赖与 `cordis.patch.yml` 挂载行。
- 同一提交里的其余改动保留：可收起文件树侧边栏、预览内容留白加宽。
- 已安装的 profile 执行 `pnpm update dsh-web-enhanced` 后重启宿主即可回到无终端状态（terminal 包随之移除）。

## [0.15.1] - 2026-08-16

### 修复：Web 终端报「宿主未组合 terminal 服务」

- 终端能力现在随插件自带：`@deepseek-ai/dsh-terminal`（PTY 注册表）与 `@deepseek-ai/dsh-terminal-bash`（bash 后端）成为插件 dependencies，`cordis.patch.yml` 增加 `terminal` / `terminal-bash` 两个 Loader 行——安装插件即自动具备，无需在宿主 profile 手动组合。后端注册仍是被动件，只有打开终端才会真正 spawn PTY。
- 已有 profile 升级插件后即可生效（`pnpm update dsh-web-enhanced` 后重启宿主）。

## [0.15.0] - 2026-08-16

### 新增：Web 终端 + 可收起文件树侧边栏；预览内容留白加宽

- **Web 终端**（「工作区」→「终端」标签页）：直连宿主原生 PTY 注册表（`ctx.terminals`，配套 terminal-bash 后端）。会话由当前对话的 live agent 拥有——agent 销毁即自动清理，一个用户的会话不会被别的视图触达；初始工作目录为工作区根目录，后端优先选 `shell`。支持新建/多开切换/关闭、发送命令回车执行（返回渲染后的 viewport 与等待原因：stdin_read / inferred_idle / timeout / session_exit，与模型侧 terminal 工具同一契约）、SIGINT 中断、重开标签自动重连存活会话并回读滚动历史（terminalRead）。
- 网关新增 6 个 Remote：`terminalOpen/Send/Read/Signal/Close/List`（Typert 描述符、client facade、中英文案齐备）；宿主未组合 terminals 服务或 agent 不在场时返回类型化错误而不是失败挂载。
- **文件树侧边栏可收起**：分隔线边缘的 ‹/› 折叠按钮，收起后留 24px 展开导轨，状态随面板状态持久化。
- 预览内容不再贴边：源码/diff/编辑器留白 8px→12×16px，渲染视图 10×12→16×20。
- 测试新增 9 例（终端宿主 8 + 侧边栏持久化 1），共 320。

## [0.14.0] - 2026-08-16

### 调整：工作区改为 VSCode 式布局，「文件」与「预览」合并为「资源管理器」

- 工作区视图内部标签页从五个减为四个：**资源管理器 / 变更 / 任务看板 / Git 图谱**。
- 资源管理器为 VSCode 式分栏：左侧文件树侧边栏（整行展开、文件名搜索不变），右侧显示当前打开文件的预览（源码 / 分屏 / 渲染三态、diff、编辑保存等全部能力不变）；点击文件不再跳标签页，直接在右侧打开。
- 变更页点某文件的 diff 跳转到资源管理器的预览侧（原「预览」标签页）。
- 持久化兼容：旧版保存的 `files` / `preview` 活动标签恢复为 `explorer`，展开目录与打开的预览标签不受影响。
- 无接口破坏；测试新增 1 例（旧标签迁移），共 305。

## [0.13.0] - 2026-08-16

### 新增：界面皮肤系统 + 全模块 UI 美化

- 新增皮肤系统（参考 DSH-Transparent-UI-Plugin 的 theme-layer 模式）：通过 `dsh-client-ui-theme` 主题服务的覆盖栈整体重着色 Web 界面，皮肤在「设置 → Web 增强 → 皮肤」标签页切换，选择持久化在浏览器 localStorage，立即生效、无需刷新，卸载/切回「原生」即完全还原宿主配色。
- 内置 5 套皮肤：原生、深海（Ocean）、暖沙（Amber）、森林（Forest）、紫晶（Violet）；每套均按 light/dark 成对定义 `--dsw-alias-*` 覆盖层，跟随「外观」的浅色/深色偏好自动切换。
- 皮肤卡片带双模式色板预览，当前生效模式一侧有指示标记；部署未组合主题服务时该页显示不可用提示，其余功能不受影响。
- 全模块 UI 美化：统一圆角（卡片 12px / 控件 8px / 徽标胶囊）、140ms 过渡（含 prefers-reduced-motion 降级）、hover/active/focus-visible 状态、分层阴影、细滚动条，颜色全部走 `--dsw-alias-*` 语义 token，皮肤切换对全部模块生效；补齐 AboutPanel 缺失的 `.license` 样式。
- 新增 `tests/skins.spec.ts`（7 例）；无接口破坏（WebEnhancedInject 新增可选场景下的 `skin` 面，仅本插件消费）。

## [0.12.1] - 2026-08-15

### 新增：识图尝试失败记录（可在界面查看每次失败原因）

- 转写引擎现在为**每一次失败的尝试**保留内存记录（上限 50 条，最新在前）：来源（DSH 模型 / 独立 API / Ollama）、失败的模型或端点、错误信息、时间。
- `visionStatus` 返回新增 `failures` 字段；设置 → Web 增强 → 识图 的状态卡新增「识别尝试失败记录」列表 + 「刷新状态」按钮——例如 `mimo-v2.5-free` 失败后轮到独立 API 时，可以看到它具体返回了什么错误。
- 原有进程控制台日志不变（每条 `dsh-web-enhanced vision: <model> failed — …`），全部失败时仍汇总进「最近失败」。
- 无接口破坏；测试数不变（297）。

## [0.12.0] - 2026-08-15

### 调整：识图改为两级模型池按序回退

按用户需求，识图不再「单个优先模型 + 单 API 模型」，而是**两段模型池**：

- **DSH 模型池**（新 settings/config 字段 `harnessModels`）：设置页把 DSH 已声明支持图片的模型按渠道分组多选保存；转写按池顺序逐个尝试，全部失败后进入独立 API。池为空时保持原来的自动探测（上限 4 个）；静态钉选的 `visionProvider`/`visionModel` 仍排最前。
- **独立 API 模型池**（沿用 `endpointModels`）：转写先试可选的优先模型 `endpointModel`，再按保存顺序逐个尝试池内其余模型，最后才是静态 `visionFallbackModels`。
- 全部失败时行为不变：模型收到带已尝试来源的失败占位描述，图片绝不裸奔进纯文本模型。
- UI：DSH 区块从单渠道/单模型下拉改为分组多选模型池；独立 API 的「模型」改为「优先模型（可选）」，留空即按池顺序。

### 接口变化

- 无新增远程；`visionConfigGet`/`visionConfigSet` 增加 `harnessModels` 字段（settings 命名空间同步新增）。
- 新增 config：`visionHarnessModels`。
- 测试 295 → 297。

## [0.11.1] - 2026-08-15

### 改进：「关于」标签页不再只有一段文字

- 新增正式的 About 面板：插件名、版本（构建期注入的 `WEB_ENHANCED_VERSION`，与 package.json 同步）、MIT 许可、项目主页链接。
- 功能列表改为 chips（任务看板 / Git 图谱 / 工作区 / mention / 余额 / 识图 / 插件管理），并补上配置指引（识图在线配置、其余走 cordis.patch.yml）。
- 移除旧的单段 `about.body` 文案；无接口变化，测试数不变（295）。

## [0.11.0] - 2026-08-15

### 新增：独立识图 API 的模型池（拉取 → 多选 → 选一）

「设置 → Web 增强 → 识图」的独立 API 区块不再只能手填一个模型：

- **拉取模型列表**：新增 `visionEndpointModels` 远程，向独立端点请求 OpenAI 兼容的 `GET {baseURL}/models`（15s 上限，密钥优先用表单刚输入的 one-shot key，否则用已保存 key / 环境变量回退；key 永不落日志、永不回传），错误按 auth/quota/rate_limit/404 等分类提示。
- **多选保存为池**：拉回后表单勾选一批候选模型，随主保存写入 settings 命名空间的新字段 `endpointModels`（静态配置对应 `visionEndpointModels` 作为底值）。
- **从池里选一使用**：`endpointModel` 字段在池非空时变为下拉，只能从池里挑（池空时仍可手填）；勾选第一个模型时会自动把它设为当前模型。用户自己判断模型是否支持识图——选错只会在转写时失败，不影响保存。

### 接口变化

- 远程方法 30 → 31：新增 `visionEndpointModels`。
- 新增 config / settings 字段：`visionEndpointModels`（候选池）。
- 测试 293 → 295。

## [0.10.0] - 2026-08-15

### 新增：识图在线配置入口

「设置 → Web 增强 → 识图」从只读状态页升级为**完整配置表单**，保存立即生效、无需重启：

- **运行时可编辑的 settings 命名空间**：新增 `dsh-web-enhanced-vision` 命名空间，`VisionInterceptor` 启动时注册并 `watch` 每次提交——界面保存、`settings.yaml` 外部修改都会即时热更新（转写引擎 reconfigure、发送补丁按需打/拆）。`cordis.patch.yml` 里的 `vision*` 静态配置作为命名空间 base 层保留，界面保存的值优先。
- **从 DSH 模型选择器同源目录手动选识别模型**：`visionConfigGet` 返回宿主 provider/model 目录（与模型选择器同一数据源），表单按 `supportsImage` 过滤后提供渠道/模型下拉；留空即保持原来的自动探测。
- **独立识图 API 配置**：Base URL / 模型 / API Key（密码框，密钥只写不读、可清除）/ 匿名端点 / 超时 / 最大 token，全部在线编辑。该端点只服务于本插件的图片转写，**不注册进 DSH 原有渠道、不参与模型选择器**。
- 本地 Ollama 开关与地址、描述提示词与标记同样在线可改。
- 表单带 settings 修订号 CAS：并发修改返回 `vision-config-conflict`，前端自动重载提示重试；API key 永不回传（只返回 `apiKeySet`）。

### 接口变化

- 远程方法 28 → 30：新增 `visionConfigGet`、`visionConfigSet`。
- 测试 287 → 293。

## [0.9.0] - 2026-08-15

### 新增：识图功能集成（TODO #6）

纯文本模型现在可以直接收图。设计是 `DSH-vision`（透明拦截）与 `dsh-vision-proxy`（健壮转写引擎）两个参考插件的合体：

- **发送门禁与 `read_image` 门禁放行**：新增 `visionIntegration` Cordis 服务，可逆地包装共享 `llm.resolveModelInfo`，给纯文本模型补上 `image` 输入能力——一次同时绕过 api-proxy 的发送准入与 `read_image` 的工具门禁。包装带标记，卸载时**只有当前仍是自己的包装才还原**，修掉了 DSH-vision 无条件还原会误拆后来者包装的隐患。
- **对话记录保图片、模型见文字**：`agent/pre-step` 为含图消息预计算描述；原文 append 图片照常进入历史（UI 与多模态模型一致），模型可见表面通过 `session` 表面替换（`surfaceOp: replace`）换成 `[图片内容描述]` 文字；包装后的 `session.deriveMessages` 覆盖替换微任务落盘前的那一步请求。`tools/post-execute` 对 `read_image` 结果做同样替换。
- **多模态自动检测**：真实能力始终读补丁前捕获的原始 resolver，多模态模型原样放行、不产生识别费用。
- **转写源依次回退**：DSH 已配置的多模态模型（`llm.stream`，自动探测、零额外密钥，支持 `visionProvider`/`visionModel` 钉选）→ 本地 Ollama（启动时探测、自动加进链首）→ `visionBaseUrl` OpenAI 兼容端点 + `visionFallbackModels` 回退链。引擎带图片字节 SHA-256 内容缓存、429/超时冷却、匿名端点 20s 硬超时、分类错误（rate_limit/quota/auth/region/model_not_found/context_too_large/http）与无密钥快速跳过。全部失败时模型收到占位描述，图片绝不裸奔进纯文本模型。
- **设置页新增「识图」标签页**：只读展示实时状态（发送补丁是否生效、探测到的视觉模型、端点/Ollama/密钥来源、缓存条数、最近失败）与配置指引；配置本身仍是插件行静态 config（重启生效）。
- 默认开启（`visionEnabled: true`）。与 `DSH-vision`（`dsh-image-vision`）不共存——两者都会重复识别同一张图；本插件是其超集。

### 接口变化

- 远程方法 27 → 28：新增 `visionStatus`。
- 新增 config：`visionEnabled`、`visionPatchAdmission`、`visionProvider`、`visionModel`、`visionPrompt`、`visionMarker`、`visionBaseUrl`、`visionApiKey`、`visionApiKeyEnv`、`visionEndpointModel`、`visionAnonymous`、`visionTimeoutMs`、`visionMaxTokens`、`visionAutoLocalOllama`、`visionLocalOllamaModel`、`visionLocalOllamaUrl`、`visionFallbackModels`、`visionCacheLimit`、`visionCooldownMs`。
- 测试 266 → 287。

## [0.8.0] - 2026-08-15

### 修复：输入框下方余额行不再被裁掉

余额行之前按自身内容宽度排版，超出输入卡宽度的那部分被容器裁掉。现在采用宿主 StatsLine 同一套宽度纪律：`max-width: var(--dsh-chat-content-width)` + 居中，标签与刷新钮固定，余额数值与错误信息 `min-width: 0` + 单行省略，任何长度都不会再溢出被截。

### 新增：本轮会话花费估算（models.dev 价格）

余额行现在显示当前会话已计费 token 的估算花费。宿主新增 `pricingGet` 远程方法：每 TTL 拉一次 `models.dev/api.json`（默认缓存 6 小时、10 秒超时、单飞共享、失败后可重试），按配置的 `pricingProviderMap`（默认 `deepseek-official → deepseek`）与当前 model id 查 USD/百万 token 价格；缓存读/写价缺省时回退到 input 价。客户端读会话的 `tokenUsage` projection 四个桶（未缓存输入 / 缓存读 / 缓存写 / 输出）计算 `≈ $x`，价格未命中或没有计费 token 时不显示。

新增 config：`modelsDevUrl`、`modelsDevCacheTtlMs`、`modelsDevTimeoutMs`、`pricingProviderMap`。

### 调整：「任务看板」「Git 图谱」进入工作区标签页

侧边栏底部的两个入口取消，改到「工作区」视图的 tablist 里统一显示：文件 / 预览 / 变更 / **任务看板** / **Git 图谱** 五页。实现上把 `BoardOverlay` / `GraphOverlay` 拆成无壳面板（`BoardPanel` / `GraphPanel`）与浮层壳两层，标签页直接复用面板——数据、轮询、展开逻辑只有一份；侧边栏 footer 与对应 `shell.overlay` 注册移除（mention 的 `fsBrowse` 浏览器浮层保留）。

### 修复：宿主会话统计行整行完整显示

余额行上面的宿主 StatsLine 用 `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` 限制在 composer 宽度内，长会话会从「输出」之后被省略。本插件注入全局覆盖：以 `[data-slot='conversation.composer.dock'] > div:not([data-testid='balance-line'])` 结构选择器为主、`.FJxK0a_root` 哈希类名为兜底，把该行改成 `white-space: normal; overflow: visible; overflow-wrap: anywhere; max-width: none`——统计内容完整换行显示，同时不触碰本插件自己的余额行。

### 调整：分支切换器移到会话标题行

分支切换器（`BranchStrip`）从输入框上方的 `conversation.input.dock` 改注册到 `conversation.session.header.actions`——宿主把它渲染在标题旁的 `titleCluster` 动作行。组件改用框架注入的 `sessionId` 精确解析项目（不再依赖「当前会话」），CSS 从 composer 宽度列改为按内容收缩的内联控件；脏树确认与 git 拒绝信息仍堆在切换器下方。

### 接口变化

- 远程方法 26 → 27：新增 `pricingGet`。
- 测试 256 → 266。

## [0.7.2] - 2026-08-15

### 改进：mention 文件选择器按资源管理器方式浏览

弹层宿主的 `popupSelect` 契约是一次性取数的扁平列表，无法在弹层内部挂可展开的树，所以「文件夹点击进入」做在两层上：

- **缩进目录视图**：mention-file 的选项现在同时列出文件夹与文件，按路径深度缩进、显示相对路径；本地过滤照旧。文件夹行带 `navigate`，选中它的效果不是插入路径，而是**进入该文件夹**。
- **文件浏览器浮层就是资源管理器窗口**：点文件夹行后，插件自己的 `fsBrowse` 浮层在该目录打开——面包屑、上一级、主目录、逐层列表、按名过滤，点文件夹进入、点文件选中；第一行「打开文件浏览器…」则直接在**项目根目录**打开它（无工作区的会话仍从主目录开始）。

`BrowseState` 增加可选 `startPath`，浏览浮层打开时定位到调用方给的目录；文件夹行的 `navigate` 会先拼成**绝对路径**再交给浮层（`fsSearch` 返回的是工作区相对路径）。mention-folder 保持选择文件夹即插入路径的语义。

### 接口变化

- `BrowseActions.openBrowse(kind, sessionId, startPath?)` 增加可选起始目录；远程方法数不变（26）。
- 测试 254 → 256。

## [0.7.1] - 2026-08-15

### 修复：侧边栏收起后，看板/图谱入口没有进入 rail 态

宿主本来就把 owner prop `wide` 传给了 `sidebar.footer.action` 的每个注册项，但两个入口组件没消费它。收起 settle 后 `footerActions` 是 `width: auto; justify-content: center` 的行内 flex，两个按钮却仍按展开态渲染（`width:100%` + 图标/文字/gap），内容总宽远超 56px 轨道——「任务看板」文字溢出，第二个按钮被裁到只剩局部。

现在组件消费 `wide`：rail 态**卸载** label（不是 `display:none`——文字会留在可访问性树里，折叠动画期也仍参与排版），改用 `aria-label` + `title` 兜底；CSS 在 `data-wide='false'` 下把每个按钮定为 18×36px（rail 内容盒 36px，两个入口各占一半）、图标居中、无 padding。`wide` 要等宿主 150ms 折叠 settle 后才变 false，所以滑动动画期间内容仍按展开宽度冻结，不会中途回流。展开后恢复图标 + 文字。

### 改进：各模块字体统一放大

全插件最小字号从 10/11px 抬到 12px，正文与控件 12→13、13→14，浮层标题与关闭钮 14→15，Markdown 标题同步放大（h1 22 / h2 19 / h3 17），并给 `OverlayShell` 的内容区补上 14px 继承基准。覆盖任务看板/卡片、Git 图谱、分支条、文件树、预览、SCM、文件浏览器、设置页、余额行与侧边栏入口。

### 修复：mention 文件选择器不显示 `node_modules` 等依赖目录

「有些被 .gitignore 忽略的文件看不到、有些又看得到」的根因不是 .gitignore——`fsSearch` 从来不解析它，跳的是 `.git` 与 `skipDirs`（默认 `node_modules`）：落在依赖目录里的文件被跳掉，其它被忽略文件都列出来。

结论是**维持过滤，并把取舍钉进测试**：`node_modules` 等几乎不会被引用的依赖目录不应出现在 mention 窗口，否则有界列表（默认 200 条）会被海量依赖文件淹没、真正的项目文件反而看不到。确实要引用被跳过目录里的文件时，用第一行「浏览其他位置…」——`fsBrowse` 的浏览器不做 `skipDirs` 过滤，可以走到任何目录。

另一处实测问题随之浮出：根目录的 `TODO.md` 在旧 DFS 顺序下排到第 228 条，被 200 条上限截掉。`searchFiles` 现在**每层先列文件、再递归子目录**（两组各自按名排序）——根目录的 README / TODO.md / package.json 一定最先进入批次，本仓实测 `TODO.md` 升到第 9 位；文件树搜索同样受益。

### 接口变化

- 远程方法数不变（26）；mention 搜索请求明确不带任何放宽选项。
- 测试 252 → 254。

## [0.7.0] - 2026-08-15

### 新增：Git 图谱显示未提交改动

图谱顶部多一行「未提交的改动」：空心虚线圆点画在 **HEAD 所在的泳道**上，用一段虚线连到 HEAD。虚线与空心是有意的——它不是提交，仓库里没有任何东西记录它，一旦提交它就消失了。

它挂在 HEAD 那一行的位置，而不是永远置顶：`--all` 视图里最新的提交可能属于另一条分支，把未提交改动画在那上面就成了错误的归属。HEAD 不在当前绘制范围内时（图谱筛到了没检出的分支，或 HEAD 落在行数上限之外），行仍然显示但置顶且不连线——改动是真实存在的，只是它的基点不在画面里。

展开后是逐文件的增删行数，与提交详情同样的排版。三种状态分开列出（暂存 / 未暂存 / 未跟踪），因为 git 算的就是三个不同的 diff：`--cached` 是索引对 HEAD，裸 `diff` 是工作区对索引，未跟踪文件两者都不在。同一个文件既暂存又继续改过，会出现两行、两组数字——合并成一行就等于编造了一个 git 从未计算过的数。

**未跟踪文件的行数是读文件数出来的**，因为 git 对它根本没有 numstat，而要拿到 numstat 就得先把它加进索引——那是修改仓库，不做。二进制、超过 `readMaxBytes`、以及列出后又消失的文件一律报 `null`（显示为 `—`），不猜。文件列表先按 `gitWorkingMaxFiles`（默认 300）截断**再**去数行数，所以一个有几千个未跟踪文件的仓库不会把一次「打开图谱」变成几千次读盘。

### 改进：分支切换会先说清楚工作区是脏的

切换前读一次 `git status`；有未提交改动时不直接切，而是问一句，并把「已跟踪 / 未跟踪」分开报数——两者的失败方式不同：git 拒绝的是会覆盖已修改**已跟踪**文件的切换，未跟踪文件只在目标分支恰好也有同名路径时才挡路。

**不阻止**脏切换，也**没有加 stash**：git 本来就会把不冲突的改动带过去，冲突时它自己会拒绝，两种情况都不丢东西。真正缺的是「你根本没被告知工作区是脏的」——一次静默成功把改到一半的文件带去了另一条分支，读起来就像数据丢了，尽管并没有。

git 的拒绝信息本来被塞在一个 `white-space: nowrap` 的单行 `<span>` 里，省略号一截什么都看不到；现在它整段显示（等宽、可滚动），因为那段话恰好写明了是哪些文件挡住了。

### 改进：已完成任务折叠为一行

「已完成」列的卡片默认只显示标题与上次执行时间，点一下展开成原来的完整卡片。冗长的提示词与执行结果都是历史，逐条铺开正是把这一列拉到几屏长的原因。

**「已失败」列不折叠**：那一列的错误信息正是打开看板的理由。

### 接口变化

- 远程方法 25 → 26：新增 `gitWorking`。
- config 新增 `gitWorkingMaxFiles`（默认 300）。
- 测试 212 → 252。

### 关于「插件管理看得到哪些插件」

只看得到**启动时所用 profile** 的插件。`dsh --profile web` 下列出的是 `~/.dsh/profiles/web/package.json` 的 `dependencies`，装在 `qqbot` 等其它 profile 里的插件看不到，也不该看到——profile 目录就是 pnpm 的工作目录，跨 profile 的按钮会在另一个目录里跑 pnpm，而那个 profile 的层栈此刻并没有被组合。profile 名与绝对路径就印在标题下一行。

## [0.6.0] - 2026-08-15

### 新增：插件自己的设置页

注册到 `settings.section` —— 设置外壳把这个根级 list 槽的每条注册投影成一行导航（`id` / `order` / `label`），选中哪行就只渲染哪个 section。这就是全部契约：图标来自外壳按 id 写死的白名单（`models` / `agent-presets` / `plugins`），其余一律拿到通用齿轮，插件无从干预。`label` 用 thunk，所以切语言靠 ledger tick 重新取值，不需要重新注册。

页内自带 tab，因为它承载两件不相干的事（管理已装插件、说明本插件是什么），谁都不值得单占一行导航。

**没有走 apiproxy 的 settings 命名空间白名单**。同目录的 DSH-vision 为了让自己的配置出现在设置里，用 awk 改了 `node_modules/@deepseek-ai/dsh-host-apiproxy/lib/index.js` —— 那是改宿主发布产物，每次升级都会被覆盖。本插件已经有自己的 Typert 网关，配置读写走自己的远程方法即可，不碰宿主任何文件。

### 新增：已安装插件管理（remove / update）

宿主的 `pluginInventory` 服务列的是 **Loader 树**，并且它的 README 明说了 "cannot enable, disable, add, or remove plugins"。这里回答的是另一个问题——**profile 装了什么**，因为那才是 pnpm 能操作的集合。两者不重合：一个 npm 包可以贡献多行 Loader 条目，而 profile 模板的 bundles（`@deepseek-ai/dsh-base` 等）是**没有任何依赖提供**的 Loader 行。

所以清单读的是 profile `package.json` 的 `dependencies`，模板层单独列出、不给按钮——`pnpm remove` 一个没人依赖的名字会「成功」且什么都没做。

`dsh plugin` 本身是个 pnpm 转发器，所以这里做的是同样两步：在 profile 目录跑 pnpm，然后按**已安装状态**重写 `dsh.profile.bundles`。按已安装状态而不是依赖差异对齐是刻意的——某个包在新版本里才开始声明 `dsh.bundle` 时，`update` 也能把它激活。

用 `update` 而不是 `install`：没写 ref 的 git spec 跟的是分支，但 pnpm 把解析到的 commit 钉进了锁文件，`install` 会尊重那个钉子。

**没有复用 `@deepseek-ai/dsh-app-boot`**（CLI 里这些例程的归属）。那是 dsh 安装的依赖，不是 profile 的依赖——插件把它写成 peer，恰好会在这段代码唯一运行的部署里解析失败。manifest 的磁盘形状是稳定契约，所以直接读写。

服务端进程比一次性命令多需要三样东西，都加了：单飞锁（这些操作要几秒到几分钟且重写同一个 `node_modules`，第二个调用被告知而不是悄悄排进一个它看不见的队列）、超时（默认 5 分钟，走 subprocess seam 的 `signal`）、有界输出。

Windows 上 `pnpm` 是 `.cmd` shim，CreateProcess 执行不了，而 subprocess seam 明确不做 shell 解释，所以显式走 `cmd.exe /d /s /c`（`/d` 抑制注册表 AutoRun）。参数用空格拼接**仅仅**因为每一个都要么是本模块写的字面量、要么是过了 `assertPackageName` 的包名（拒绝 `-` 开头、大写、空格、`;&|"` 与路径分隔符），不含任何 cmd 元字符。

**任何操作都不影响运行中的进程**：Cordis 在启动时组合层栈，改写 `node_modules` 描述的是下一次启动。所以成功结果恒带 `restartRequired: true`，UI 也照直说。

移除本插件自己**不被拒绝**——那是正当的意图。`self` 标记的作用是让确认文案换一句：说清楚重启后设置页、任务看板、Git 图谱会一起消失，且只能用命令行装回来。

### 接口变化

- 远程方法 22 → 25：新增 `pluginList` / `pluginRemove` / `pluginUpdate`。
- config 新增 `pluginOpTimeoutMs`（默认 300000）、`profileDir`（默认空，即从模块位置向上探测；显式给出用于 profile 不在模块祖先链上的部署）。
- 客户端新增 peer/inject `@deepseek-ai/dsh-client-ui-settings`。
- 测试 175 → 212。

## [0.5.2] - 2026-08-15

### 修复：文件选择器在 Windows 上出不了 C 盘

浏览器从 home 起步，向上走靠 `parent`——而 `parent` 是 `dirname(target)`，在盘根处 `dirname('C:\\')` 返回它自己，于是判定为「已到顶」并置 `null`。这在 POSIX 上是对的（`/` 确实是唯一的顶），在 Windows 上却不是：**每个盘各有一个根，彼此之间没有共同祖先**，所以无论怎么往上走都到不了 D 盘。

`FsBrowseView` 新增 `roots`，浮层顶部据此渲染盘符跳转按钮（当前所在盘高亮）。POSIX 上该列表为空——只会显示一个 `/` 的控件是噪音。

盘符靠**探测**而非枚举：Node 不带原生绑定就拿不到盘符列表。26 次 `stat` 并发跑，代价是最慢的那一个（断连的网络盘符仍可能拖上一两秒）。本机实测 `["C:\\","D:\\"]`，耗时 1 ms。

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
