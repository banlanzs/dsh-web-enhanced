# 模块化开发指南

本文说明 `dsh-web-enhanced` 的模块边界在哪、维护已有功能该动哪些文件、新增一个功能模块需要走哪几步。适用于 0.21.0 之后的服务端域化结构。

架构背景见 [REWRITE-DESIGN.md](./REWRITE-DESIGN.md)（宿主槽位事实与初版模块划分）；本文只讲**怎么改**。

---

## 1. 结构总览

插件分两半，中间由一份共享的 RPC 契约连接。

```
服务端 src/*.ts                     共享契约                客户端 src/client/**
─────────────────────               ─────────              ──────────────────────
index.ts        插件入口             descriptors.ts   ←──   client/remote.ts   挂载命名空间
  ├ applyGlobalPrompt               （42 条 RPC 描述符）     client/facade.ts   拆信封
  ├ applyMemory                                            client/contract.ts 组件消费面
  ├ VisionInterceptor               types.ts                     ↑
  └ WebEnhancedGateway              （wire 载荷类型）        client/index.ts    slot 装配
        ↓ 一行委托                   schemas.ts                   ↓
    services.ts                     （storage 校验）        各功能目录（组件 + 状态）
    ├ 每域一个服务模块
    └ 处理跨域装配
```

三条不变量，改动前请先记住：

1. **服务端功能之间不直接 import**。域与域之间只通过接口引用，装配在 `services.ts` 一处完成。
2. **`@Remote` 方法必须留在 `WebEnhancedGateway` 类上**。装饰器把标记记在 service 原型上，搬到别处端点会 404。方法体只写一行委托。
3. **业务失败是返回值，不是异常**。每个端点返回载荷或 `{ error: ApiError }`，客户端内联渲染。

---

## 2. 服务端：一个功能域的构成

每个域模块（`src/<域>-gateway.ts`）导出三样东西：

```ts
// ① 接口 —— 网关和其他域看到的唯一形状
export interface GitDomainFace {
  branches(request: GitBranchesRequest): Promise<GitBranchesResult>
  // ...
}

// ② config 片段 —— 类型 + zod 片段 + resolve 三合一，加字段只改这里
export interface GitConfigInput { gitMaxCount?: number /* ... */ }
export const gitConfigFragment: z<Required<GitConfigInput>> = z.object({
  gitMaxCount: z.number().default(100),
})
export function resolveGitConfig(config: Partial<GitConfigInput>): Required<GitConfigInput> {
  return { gitMaxCount: config.gitMaxCount ?? 100 }
}

// ③ 工厂 —— 依赖显式声明，内部持有实现细节
export interface GitDomainDeps { readonly ctx: Context; /* ... */ }
export function createGitDomain(deps: GitDomainDeps): GitDomainFace { /* ... */ }
```

现有域清单：

| 模块 | 端点 | 说明 |
|---|---|---|
| `board-gateway.ts` + `board.ts` | task×5 | 任务看板；`board.ts` owns 存储与调度，`board-gateway.ts` 只做世界接入 |
| `git-gateway.ts` | git×11 | 每请求新建 `GitClient`；数未跟踪文件行数经 files 域 |
| `files-gateway.ts` | fs×7 | 含空查询搜索缓存与 `countLines`（git 域消费） |
| `model-gateway.ts` | balance/pricing/route/rate/opencodeGo/retry×7 | 余额、定价、路由名、重试策略 |
| `memory-gateway.ts` | memory×4 | 存储域与任务板共享 |
| `global-prompt-gateway.ts` | globalPrompt×2 | 走本插件网关，非宿主 settings RPC |
| `vision-gateway.ts` | vision×4 | 图像理解的**线面**；拦截运行时在 `vision.ts` |
| `plugins-gateway.ts` | plugin×3 | profile 清单与 pnpm 变更 |

基础设施（不含端点）：

| 模块 | 职责 |
|---|---|
| `services.ts` | `createServices(ctx, config)` 按依赖序装配全部域，绑定跨域缝 |
| `config.ts` | 汇总各域 config 片段 → `Config` + `resolveConfig` |
| `faces.ts` | 宿主服务的结构性 face（`LlmDirectoryFace`/`SettingsVisionFace` 等）+ `settingsFace(ctx)` |
| `workspace-service.ts` | workspace 解析 + 共享 `workspaceNotFound` |
| `error.ts` | `errorOf(error, fallback)` 错误归一 |

---

## 3. 维护已有功能：改动落点速查

| 你要改的东西 | 动这些文件 |
|---|---|
| 某端点的业务逻辑 | 对应 `src/<域>-gateway.ts`，**不用动** `gateway.ts` |
| 加/改一个配置项 | 该域模块的 config 片段三处（interface / fragment / resolve），然后跑 `tests/config-assembly.spec.ts` |
| 端点的请求或响应字段 | `types.ts`（类型）→ `descriptors.ts`（wire schema）→ `client/contract.ts`（客户端签名）三处同步 |
| UI 文案 | `client/locales.ts` 的 `zh` 与 `en`（中文是权威键集，漏英文会编译失败） |
| 某个界面的行为 | `client/<功能目录>/`，多数不需要碰服务端 |
| 宿主服务的读取方式 | `faces.ts`（结构性 face 集中在此，不要在域模块里重复声明） |

**加配置项的完整例子**（给 git 域加一个 `gitFetchTimeoutMs`）：

```ts
// src/git-gateway.ts —— 只改这一个文件的三处
export interface GitConfigInput {
  gitMaxCount?: number
  gitFetchTimeoutMs?: number          // ①
}
export const gitConfigFragment: z<Required<GitConfigInput>> = z.object({
  gitMaxCount: z.number().default(100),
  gitFetchTimeoutMs: z.number().default(30_000),   // ②
})
export function resolveGitConfig(config: Partial<GitConfigInput>): Required<GitConfigInput> {
  return {
    gitMaxCount: config.gitMaxCount ?? 100,
    gitFetchTimeoutMs: config.gitFetchTimeoutMs ?? 30_000,   // ③
  }
}
```

`config.ts` 无需改动——它展开的是片段。但 `tests/config-assembly.spec.ts` 里钉住的字段数（46）和字段顺序列表要同步更新，那个测试失败就是在提醒你「设置表单的字段布局变了」。

---

## 4. 新增一个功能模块（服务端 + RPC + UI）

以「加一个 `npmOutdated` 端点，列出 profile 里过期的插件」为例，走完整七步。

### 步骤 1 — 定义 wire 类型（`src/types.ts`）

```ts
/** One outdated dependency row. */
export interface OutdatedEntryView {
  readonly name: string
  readonly current: string
  readonly latest: string
}

/** List outdated profile dependencies. */
export interface NpmOutdatedRequest { readonly refresh?: boolean }
export type NpmOutdatedResult = { readonly entries: readonly OutdatedEntryView[] } | { readonly error: ApiError }
```

类型只写纯 JSON 形状——它要过 Typert 的线，brand 是编译期的。

### 步骤 2 — 注册 RPC 描述符（`src/descriptors.ts`）

在 `WEB_ENHANCED_DESCRIPTORS` 数组**末尾**追加（顺序即注册顺序，插在中间会让 `tests/gateway.spec.ts` 的顺序断言失败）：

```ts
const outdatedEntrySchema = z.object({ name: z.string(), current: z.string(), latest: z.string() })

// 数组内：
unary('npmOutdated', 'NpmOutdatedRequest', 'NpmOutdatedResult',
  okOrError(z.object({ entries: z.array(outdatedEntrySchema) }))),
```

无参端点用 `nullary(method, resultTypeSymbol, resultSchema)`，有参用 `unary(method, requestTypeSymbol, resultTypeSymbol, resultSchema)`。**每个端点至多一个参数**——这是 Typert 的线协议约束，不是风格选择。

### 步骤 3 — 实现域逻辑

如果属于已有域（本例属 plugins），加到该域的接口 + 实现：

```ts
// src/plugins-gateway.ts
export interface PluginsDomainFace {
  list(request: PluginListRequest): Promise<PluginListResult>
  outdated(request: NpmOutdatedRequest): Promise<NpmOutdatedResult>   // 新增
  // ...
}

export function createPluginsDomain(deps: PluginsDomainDeps): PluginsDomainFace {
  return {
    async outdated(request) {
      try {
        const dir = await profileDir()
        if (dir === undefined) return { error: noProfile() }
        // ...业务逻辑
        return { entries }
      } catch (error) {
        return { error: errorOf(error, 'npm-outdated') }   // 失败是返回值
      }
    },
    // ...
  }
}
```

**如果是全新的域**，新建 `src/<域>-gateway.ts`，按第 2 节的三件套写（接口 + config 片段 + 工厂），然后：

- `src/config.ts`：import 该域的 fragment/resolve，加进 `Config` 的展开与 `resolveConfig`（无 config 项则跳过）；
- `src/services.ts`：`Services` 接口加一个字段，`createServices` 里加一行装配。有跨域依赖就在这里绑（参考 git 域怎么拿到 files 的 `countLines`）。

### 步骤 4 — 网关加一行委托（`src/gateway.ts`）

方法**追加在类的末尾**（与描述符数组顺序一致）：

```ts
  /** Profile dependencies with a newer published version. */
  @Remote('npmOutdated')
  npmOutdated(request: NpmOutdatedRequest): Promise<NpmOutdatedResult> {
    return this.services.plugins.outdated(request)
  }
```

方法体永远只有一行。如果你发现自己在 `gateway.ts` 里写 `if`，说明逻辑放错了地方。

### 步骤 5 — 客户端契约（`src/client/contract.ts` + `facade.ts`）

```ts
// contract.ts，WebEnhancedRemote 接口内，与网关方法一一镜像
  npmOutdated(request: NpmOutdatedRequest): Promise<NpmOutdatedResult>

// facade.ts，createRemoteFacade 返回对象内
  npmOutdated: async request => open(await raw.npmOutdated(request)),
```

`open()` 负责把 `RemoteResult` 信封拆成「载荷或 `{ error }`」的联合——组件永远看不到信封。

### 步骤 6 — UI（`src/client/<功能目录>/`）

新建目录，组件读注入面 `WebEnhancedInject`（已含 `remote`、`hooks`、各类 actions）：

```tsx
// src/client/outdated/OutdatedPanel.tsx
export function OutdatedPanel({ remote, t }: WebEnhancedProps<'settings.plugins.tab'>) {
  // remote.npmOutdated(...) 直接可用
}
```

文案加进 `client/locales.ts` 的 `zh` 与 `en`（中文键集是权威，只加中文会编译失败）。

在 `client/index.ts` 的 `apply()` 里注册到某个 slot：

```ts
ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
  name: 'settings.plugins.tab',
  id: 'web-enhanced-outdated',
  order: 20,
  locale: NS,
  inject: face,
}, OutdatedPanel))
```

**槽位选择的坑**（血泪记录，见 MEMORY.md 2026-08-18）：以 `priority: -1` shadow 宿主 entry 只赢渲染权，**不转移子槽声明权**——无法复用宿主已声明的子槽。需要包裹宿主渲染时走 DOM 层，参考 `client/navbar/index.ts` 与 `client/tool-calls/apply.ts` 的做法。

### 步骤 7 — 测试与验证

```bash
pnpm typecheck     # tsc -b
pnpm test          # vitest run
pnpm check         # 清理 lib → 全量 tsc → 测试 → 打包（推送前必跑）
```

域逻辑用纯 fake 依赖直接测（不需要真 `Context`）：

```ts
// tests/<域>.spec.ts
const domain = createPluginsDomain({
  ctx: { subprocess: fakeSubprocess } as never,
  config: resolvePluginsConfig({}),
  outputMaxBytes: 262_144,
})
expect(await domain.outdated({})).toEqual({ entries: [] })
```

端点级别的集成测试走 `tests/gateway.spec.ts` 的模式：真 `Context` + `ctx.provide` 注入 fake 服务 + `ctx.plugin(WebEnhancedGateway, config)`。

**新增端点后必须同步** `tests/gateway.spec.ts:232` 的 `remoteMethods(gateway)` 断言数组——它钉住了全部端点名与顺序，是「wire 契约没漂移」的证据。

---

## 5. 检查清单

新增端点：

- [ ] `types.ts` 加请求/响应类型（纯 JSON 形状）
- [ ] `descriptors.ts` 数组**末尾**追加描述符（每端点至多一参）
- [ ] 域模块加接口方法 + 实现（失败走 `{ error }`，用 `errorOf`）
- [ ] `gateway.ts` 类末尾加 `@Remote` 一行委托
- [ ] `client/contract.ts` + `client/facade.ts` 两处镜像
- [ ] `tests/gateway.spec.ts` 的 `remoteMethods` 断言数组同步
- [ ] `pnpm check` 全绿

新增功能域：

- [ ] 新建 `src/<域>-gateway.ts`（接口 + config 片段三件套 + 工厂）
- [ ] `config.ts` 汇入 fragment 与 resolve（若有配置）
- [ ] `services.ts` 的 `Services` 加字段 + `createServices` 加装配行
- [ ] 跨域依赖只在 `services.ts` 绑定，域模块之间不 import
- [ ] `tests/config-assembly.spec.ts` 的字段数与顺序同步

新增 UI：

- [ ] 组件放 `client/<功能目录>/`，只消费注入面不 import 其他功能目录
- [ ] `client/locales.ts` 中英文案成对
- [ ] `client/index.ts` 用 `ctx.effect` / `ctx.slots.inject` 单独一段注册（便于整段删除）
- [ ] 涉及 slot 注册形状的改动，用真机 e2e 兜底（组件渲染测试覆盖不到）

---

## 6. 发布前

参考 MEMORY.md 的既有流程：

1. `pnpm check` 全绿；
2. commit（中英双语各一行，按功能模块拆分，不要跨域混提）；
3. push 后 `dsh plugin --profile test` 先装测试 profile 冒烟，稳定后再更新 `--profile web`；
4. `lib/` 是被跟踪的构建产物——**日常开发不提交**，发版时由 `pnpm run version` 统一处理；
5. profile 里只装插件包，host 包一律由 CLI 内置提供（装第二份会导致 Symbol 双实例，随机炸工具调度或远程网关）。
