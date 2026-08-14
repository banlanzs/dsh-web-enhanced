# assets

README 中引用的截图（`board.png` / `graph.png` / `panel.png` / `balance.png`）由真机 e2e 生成，提交入库前请刷新：

```sh
# 需要宿主构建（DSH_ROOT 内先 pnpm run build），浏览器截图无需模型 key
node scripts/e2e.mjs --capture --install link --port 3190
```

`--capture` 会把四块 UI（任务看板、Git 图谱、浮动面板、余额行）截图写入本目录，与 README 的引用一一对应。
