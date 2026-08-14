# dsh-web-enhanced 重写设计

本文记录 `dsh-web-enhanced` 完全重写的需求映射、扩展点落位决策与模块划分。需求来源是同目录的 [FEATURE-REQUEST.md](../FEATURE-REQUEST.md)，宿主约束来源是 deepseek-harness 主仓 `packages/client/*` 的槽位声明。

## 1. 宿主扩展点事实

重写前先确定宿主到底开放了什么。以下事实全部来自主仓源码，不是推测。

### 1.1 布局层四个座位

`ui-layout` 的 `AppFrame` 占据内建的 `root` 槽，并在同一次 `register()` 中声明四个子槽（`packages/client/ui-layout/src/client/index.ts`）：

| 槽名 | kind | scope | 占用状态 |
|---|---|---|---|
| `sidebar` | single | root | 已被 `ui-sidebar` 的 `SidebarRoot` 占用 |
| `conversation` | single | session-maybe | 已被 `ui-conversation` 的 `ConversationRoot` 占用 |
| `details` | single | session | 已被 `ui-conversation` 的 `DetailsPanel` 占用 |
| `shell.overlay` | **list** | root | **空闲，且明确是加性座位** |

`single` 槽的语义是"注册即替换"：`SlotCore.register` 允许同 cell 不同 `priority` 共存，但只有 priority 最低的那个渲染，其余不渲染。所以往 `details` 注册不是"加一块面板"，而是把宿主的工具详情面板连同它声明的 `conversation.details.tool` 座位一起挤掉。

`root` 槽的 JSDoc（`packages/client/runtime/src/client/slots.ts`）直接给出了官方指引：

> For a surface of your own that floats over the whole app, register into `shell.overlay` instead (a list slot: additive, and click-through until your entry opts into pointer events).

`shell.overlay` 的声明注释同样写明它"位于所有列之上、在它们的滚动容器之外"，且"图层本身是点击穿透的，条目自行选择接管指针事件"。

**决策：本插件所有覆盖型表面（任务看板、Git 图谱、右侧面板）一律注册到 `shell.overlay`，不占用 `details`。** 代价是右侧面板浮在会话之上而非挤压布局列；收益是不破坏宿主自带的工具详情面板，且宽度/折叠完全由插件自持——这恰好是 FEATURE-REQUEST 要求的（见 §1.3）。

### 1.2 会话与工作区上下文

`shell.overlay` 是 `root` scope，组件拿不到框架注入的 `sessionId`。但 `GlobalStandardProps` 对**每个**槽组件都注入（`packages/client/runtime/src/client/index.ts`）：

- `useSessions: SnapshotSelectorHook<SessionListState>` —— `SessionListState.current` 就是当前会话 id，`byId` 是会话摘要表
- `useWorkspaces: SnapshotSelectorHook<WorkspaceListState>` —— `items` 是工作区列表，`recentWorkspaceId` 是最近活跃工作区

右侧面板需要的"当前项目"就是工作区 id，从 `useWorkspaces` 读取；跳转执行会话用 `ctx.sessions.open(id)`（`SessionsService.open` 是真实公开方法，不需要结构性 cast）。

### 1.3 宿主没有的能力

`ctx.layout` 只暴露 `toggleSidebar` / `openDetails` / `closeDetails`（`packages/client/ui-layout/src/client/service.ts`），**没有宽度 API**——面板几何存在 root entry 的 layout store 里，插件够不到。

FEATURE-REQUEST 要求"面板宽度可拖拽调整，双击把手复位默认宽度，折叠状态与宽度按项目持久化"，这只能由插件自己实现。`defineStore` 支持 `persist: string`（落 localStorage），按项目持久化的做法是把 workspaceId 作为 state 内的 map 键，而不是开多个 store 实例（`shell.overlay` 是 root scope，只有一个实例）。

### 1.4 输入区座位

`ui-conversation` 声明（`packages/client/ui-conversation/src/client/contract/slots.ts`）：

| 槽名 | kind | scope | 位置 |
|---|---|---|---|
| `conversation.input.dock` | list | session | 输入框**上方** |
| `conversation.composer.dock` | list | session | 输入框**下方** |
| `conversation.input.left` / `.right` | list | session | 输入框内左右侧 |

分支选择器落 `conversation.input.dock`，余额行落 `conversation.composer.dock`，与 FEATURE-REQUEST 的"输入框上方"/"输入框下方"字面对应。

### 1.5 侧边栏入口

`sidebar.footer.action`（list, root，`ui-sidebar` 声明）是侧边栏底部的动作行座位。任务看板与 Git 图谱的**入口按钮**放这里；**面板本体**放 `shell.overlay`。两者用同一个 store 句柄联动。

## 2. 需求到实现的映射

| FEATURE-REQUEST | 落位 | 说明 |
|---|---|---|
| ① 任务看板（五列 / 执行 / 跳转会话 / cron） | 入口 `sidebar.footer.action` + 本体 `shell.overlay` | 状态机见 §3.1 |
| ② Git 图谱（分支选择器 + 分支泳道提交历史） | 分支条 `conversation.input.dock` + 图谱 `shell.overlay` | |
| ③ 右侧面板（文件树 / 预览 / SCM） | `shell.overlay` 右侧停靠 | 宽度与折叠自持，按工作区持久化 |
| ④ 余额行 | `conversation.composer.dock` | `GET https://api.deepseek.com/user/balance` |

## 3. 模块划分

```
src/
  index.ts              插件入口：声明 inject，挂载 gateway
  config.ts             Config schema + 显式 resolve
  gateway.ts            Typert 命名空间装配（只做 wire 转发）
  types.ts              wire 载荷类型（node 与 client 共享）
  domain/
    task-board.ts       任务 CRUD + 列状态机
    task-runner.ts      在新 agent 会话中执行任务并回写结果
    scheduler.ts        cron 轮询循环
    cron.ts             cron 表达式解析与下次触发时间
    git.ts              git 子进程封装
    fs.ts               工作区文件列举 / 读 / 写 / 删 / 搜索
    office.ts           docx / xlsx 转预览块
    balance.ts          DeepSeek 余额客户端（带 TTL 缓存）
  client/
    index.ts            槽位注册总装
    remote.ts           Typert descriptor 契约 + 命名空间类型声明
    contract.ts         客户端侧类型（远程门面、预览词汇、注入面）
    locales.ts          zh / en 词典
    locale-keys.ts      词典键联合
    stores/
      overlay.ts        看板 / 图谱开关
      panel.ts          右侧面板：tab、宽度、折叠、按工作区持久化
      preview.ts        预览标签页集合
    board/              看板 UI
    git/                分支条 + 图谱
    panel/              右侧面板：文件树 / 预览 / SCM
    balance/            余额行
```

原则：

- **gateway 只做 wire 转发**，业务逻辑全在 `domain/`，这样领域逻辑可以脱离 Typert 单测。
- **业务失败是结果字段，不是异常**——客户端要把失败内联渲染出来，抛异常会变成 RPC 层错误而丢失可渲染信息。
- **没有硬编码可调参数**：超时、上限、轮询间隔全部走 `Config`，可从 cordis.yml 改。

## 4. 相对旧实现的修正

旧实现（0.3.0）的偏差，逐条对应到重写：

1. **右侧面板注册错了座位**——旧代码把 `FloatingPanel` 注册进 `conversation.input.dock`（输入框上方的 dock，session scope），靠 CSS 伪装成右侧面板。它因此活在会话列的滚动容器里，且会随会话切换重建。改为 `shell.overlay`。
2. **看板 / 图谱 overlay 挂在侧边栏条目内部渲染**——`sidebar.footer.action` 是侧边栏底部的按钮座位，在其内部渲染全屏覆盖层要跟侧边栏的层叠上下文和 overflow 搏斗。改为入口与本体分离。
3. **类型逃逸**——`ctx.get('remote.webEnhanced' as never, false)`、`ctx.sessions as unknown as { open(id: string): void }`。后者完全不必要（`sessions.open` 是公开方法，只需为 branded `SessionId` 做一次有注释的窄转换）。
4. **契约不一致**——`client/contract.ts` 的 `WebEnhancedRemote.taskRun` 只有 `{ id }`，而 `client/remote.ts` 的 `WebEnhancedNamespace.taskRun` 是 `{ id, workspaceId? }`，网关侧读的是 `request.workspaceId`。定时任务因此拿不到工作区。重写后两侧从同一个类型派生。
5. **store 动作签名用 `any[]`**。
6. **FEATURE-REQUEST 未落地的细节**：文件树整行点击展开、按文件名搜索定位、预览分屏编辑与保存、宽度拖拽、双击把手复位、折叠状态与宽度按项目持久化。

## 5. 验证口径

- `domain/` 每个模块有单测（cron 边界、git porcelain 解析、fs 越界拒绝、office 截断、balance 缓存与失败）。
- 客户端有注册测试：断言四个座位各自拿到预期条目，以及 `shell.overlay` 未触碰 `details`。
- `tsc -b` + `vitest run` + `tsdown` 三者必须全绿才算完成。
