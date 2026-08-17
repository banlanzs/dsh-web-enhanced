# 设计文档：dsh-web-enhanced 记忆功能（同项目跨会话长期记忆）

- 日期：2026-08-17
- 状态：已确认（路径 1+2，Agent 工具写入）
- 范围：同项目跨会话长期记忆；跨项目记忆不做（保留 schema 扩展位）

## 背景与目标

`dsh-web-enhanced` 目前没有跨会话记忆能力：每个会话的上下文随会话结束而丢失，重新开会话需要用户重复说明项目背景、偏好与既有决策。

目标：在同一项目的不同会话之间共享长期记忆。写入由 agent 在会话中主动调用工具完成；读取通过两条注入路径（standing systemPrompt section + 按步精确召回）进入 model 上下文。

## 已确认的决策

| 决策点 | 结论 |
|---|---|
| 写入方式 | Agent 自动提取（agent 调用 `save_memory` 工具主动保存） |
| 提取触发 | Agent 工具调用（无侧边被动扫描） |
| 工具形态 | 注册新 agent tool（`save_memory`），不用 fsWrite hack、不走 Typert Remote |
| 工具可用性 | 所有会话可用（host root 全局注册） |
| 召回路径 | 路径1：standing systemPrompt section；路径2：`agent/pre-step` 精确召回（两条都要） |
| 存储策略 | 复用 `web_enhanced` domain，bump version 1→2 新增 `memories` 表 |
| 注入方式 | `agent.inject()`（不 wrap `deriveMessages`，注入内容不进 session log） |
| 项目标识 | `session.header.cwd` → `workspaceRegistry` 反查 `workspace.id` |

## 架构

### 模块划分

```
index.ts:apply()
  ├─ applyGlobalPrompt(ctx)          [已有]
  ├─ applyMemory(ctx)                [新增]
  │    ├─ 注册 settings namespace (UI 开关)
  │    ├─ 注册 systemPrompt section   (路径1: standing)
  │    └─ ctx.tools.register(save_memory) (路径2: 工具写入)
  ├─ ctx.plugin(VisionInterceptor)
  └─ ctx.plugin(WebEnhancedGateway)

memory.ts        [新增] 编排层：settings + section + 工具注册 + pre-step hook
memory-store.ts  [新增] storageDomain 表封装：save/list/delete/byWorkspace/search
descriptors.ts   [扩展] +memoryList/Delete Remote descriptor
gateway.ts       [扩展] +memoryList/Delete 方法
```

模块职责边界：

- **`memory-store.ts`**：纯数据层。不 import agent/settings/systemPrompt 相关类型；只依赖 `@deepseek-ai/dsh-storage-domain` + 本项目 schema。
- **`memory.ts`**：编排层。依赖 memory-store；注册 settings namespace、systemPrompt section、save_memory 工具；实现 pre-step 召回注入。
- **`gateway.ts`/`descriptors.ts`**：UI 管理接口（列表 + 删除）。写入不走 UI，只走 agent 工具。

### 数据模型

```ts
interface MemoryRecord {
  readonly id: string                    // crypto.randomUUID()
  readonly workspaceId: string | null    // 项目稳定键；null 预留给跨项目（本版本不写）
  readonly kind: 'user' | 'feedback' | 'project' | 'reference'
  readonly summary: string               // 一句话摘要 ≤120 字
  readonly body: string                  // 完整内容
  readonly sourceSessionId: string | null
  readonly createdAt: number             // Unix epoch ms
  readonly updatedAt: number
}
```

storageDomain 表（复用 `web_enhanced` domain，version 1→2）：

```ts
const taskDomainSpec = defineDomain({
  name: 'web_enhanced',
  version: 2,
  tables: {
    tasks:    domainTable<TaskId, TaskRecord>(...),   // 已有，不变
    memories: domainTable<string, MemoryRecord>(memoryRecordSchema),
  },
})
```

## 数据流

### 写入路径（agent 工具）

```
agent 判断"这值得记住" → 调 save_memory({kind, summary, body})
  → memory-store.save(record)     // workspaceId 取自 exec.agent.session.header.cwd
  → storageDomain memories 表落盘
  → 返回 {ok: true, id, deduplicated?: boolean}
```

去重规则：同 workspace 下 `summary` 相同且 `updatedAt` 距今 < 24h → 更新 `body`/`updatedAt` 而非新增（返回 `deduplicated: true`）。

### 召回路径1（standing section）

```
systemPrompt 组装 → section.text() 回调
  → memory.ts 的 currentWorkspaceId() 缓存（由 pre-step 每次更新）
  → memory-store.byWorkspace(workspaceId)
  → 取 Top 10，渲染为 [记忆 {kind}] {summary}：{body} 列表
  → 返回空串则 registry 丢弃该 section
```

### 召回路径2（pre-step 精确注入）

```
ctx.on('agent/pre-step', async (payload, next) => {
  const decision = await next()
  if (decision?.kind !== 'enter' || !enabled) return decision
  const agent = payload.agent
  const session = agent.session
  const workspaceId = workspaceIdFor(session.header.cwd)   // 反查 workspaceRegistry
  cacheWorkspace(workspaceId)                               // 供路径1 section 使用

  const query = lastUserText(session.deriveMessages())
  const hits = memory-store.search(workspaceId, query)      // 关键词打分，Top 3
  if (hits.length === 0) return decision

  agent.inject({
    content: `[回忆] 基于你正在处理的工作，以下是项目记忆中可能相关的内容：\n${hits.join('\n')}`,
    source: { kind: 'plugin', plugin: 'dsh-web-enhanced' },
  })
  return decision
})
```

关键决策与理由：

- **注入用 `agent.inject()` 而非 wrap `deriveMessages`**：inject 是官方文档确认的机制（`docs/cookbook/adding-a-tool.md`），append 内容下一次 model 请求必见；且注入内容不需要进 session log（辅助上下文，不是用户输入），不污染 transcript。
- **关键词匹配不引入 embedding**：对 `summary + body` 做分词 + 词频打分（简易 BM25），Top 3。零新依赖。
- **防抖**：`memory-store` 维护 `lastInjectedSeq`；同 session seq 重复触发则跳过。

## 错误处理

| 场景 | 处理 |
|---|---|
| settings 服务未挂载 | `applyMemory` 整体跳过，插件其余功能照常（仿 `global-prompt.ts:89-101`） |
| storageDomain 打开失败 | `open()` 惰性初始化，rejected promise 被 catch；`save`/`search` 返回失败/空结果，不向上抛 |
| `agent.inject` 时 agent 已销毁 | try/catch 包裹，log warn（文档要求 guard disposed agent） |
| 重复记忆 | 去重规则见上（24h 窗口 + summary 相同） |
| settings namespace 冲突 | catch 后 feature 缺席，不阻塞启动 |
| 记忆数量失控 | `save` 时按 `updatedAt` 淘汰该 workspace 超 200 条上限的旧记忆 |

## 测试计划（vitest）

1. **`memory-store.spec.ts`**：`save/list/delete/byWorkspace/search` 单元测试（查 `@deepseek-ai/dsh-storage-domain` 是否有内存 test helper；若无用 SQLite 临时文件）
2. **`memory.spec.ts`**：settings 缺失时惰性跳过；section text 回调按 workspace 返回正确文本；pre-step hook 注入逻辑（mock agent/session）
3. **工具注册测试**：`save_memory` 名称/描述/参数 schema；`execute` 输出符合 output schema；去重逻辑
4. **descriptors/gateway 测试**：`memoryList`/`memoryDelete` schema 校验 + 错误分支

沿用插件现有 `tests/` 模式（`vitest.config.ts` 已配置）。

## 不做的事（YAGNI）

- ❌ 向量检索 / embedding 依赖
- ❌ 跨项目记忆（`workspaceId: null` 的全局记忆不写入、UI 不暴露）
- ❌ 记忆自动过期 / 遗忘曲线
- ❌ 记忆 UI 编辑面板（只做列表 + 删除，写入走 agent 工具）

## 依赖清单

无需新增 npm 依赖。所需 peerDeps 已在 `package.json`：

- `@deepseek-ai/dsh-agent`（agent 类型、inject）
- `@deepseek-ai/dsh-session`（Session、header.cwd）
- `@deepseek-ai/dsh-storage-domain`（defineDomain/domainTable）
- `@deepseek-ai/dsh-workspace`（workspaceRegistry、WorkspaceId）
- `@deepseek-ai/dsh-tools`（defineTool）—— 需确认是否为 peerDep，否则补加

注意：`dsh-tools` 是否已在 peerDeps 需在实现前核对（当前 package.json 未列出，需补加）。

## 部署影响

- `cordis.patch.yml` 不变（插件已整体挂载）
- domain version 1→2：旧 task board 数据被拒绝加载。task board 数据为运行时生成，非用户持久资产，风险可接受
