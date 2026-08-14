# hub 收录登记建议（供 hub 维护者 triage 时复制）

按 dsh-external 规则，hub 不接受 PR：插件仓库由 hub 的 Agent Loop（每 2 小时同步）+ 管理员 triage 收录。
本文件是给维护者的**登记建议**，同步循环把 dsh-web-enhanced 标记为「未分类」时，直接复制下面两段即可。

## catalog.source.json（repos 数组追加一行）

```json
    { "name": "dsh-web-enhanced", "category": "plugin", "tags": ["web", "task-board", "cron", "git", "file-preview"], "note": "Web 增强插件：任务看板（真实智能体会话执行 + cron 定时）、Git 图谱（SVG 分支泳道）、文件/预览/变更浮动面板、DeepSeek 余额显示；仅消费官方发布包与既有客户端槽位，零宿主改动" }
```

## README.md（插件表格，按名字排序插入）

```
| [dsh-web-enhanced](https://github.com/banlanzs/dsh-web-enhanced) | bundle · cordis | 任务看板（cron 定时 + 真实会话执行）、Git 图谱、文件/预览/变更浮动面板、余额显示 — DSH Web 增强插件：四块 UI 全部经既有槽位注册，独立仓库开发构建 | TS | 2026-08-16 |
```

管理器标注：package.json 声明 `dsh.bundle.patch`（`cordis.patch.yml`）→ 自动推导 `bundle · cordis`，无需人工覆盖。
已打 topics：`dsh`、`dsh-plugin`、`web`、`task-board`、`cron`、`git`。

> 仓库位于 `banlanzs` 账户（公开），hub 同步循环可直接读取组织仓库。
