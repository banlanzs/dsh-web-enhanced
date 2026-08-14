/**
 * Dictionaries of the web-enhanced namespace. The Chinese copy is canonical:
 * `WebEnhancedKey` derives from it, so a key added here without an English
 * translation stops compiling.
 * @module dsh-web-enhanced/src/client/locales
 */
/** Chinese product copy (canonical key set). */
export declare const zh: {
    readonly 'board.entry': "任务看板";
    readonly 'board.title': "任务看板";
    readonly 'board.close': "关闭";
    readonly 'board.column.planned': "待规划";
    readonly 'board.column.todo': "待办";
    readonly 'board.column.running': "进行中";
    readonly 'board.column.done': "已完成";
    readonly 'board.column.failed': "已失败";
    readonly 'board.empty': "暂无任务";
    readonly 'board.create': "新建任务";
    readonly 'board.form.title': "标题";
    readonly 'board.form.titlePlaceholder': "任务名称";
    readonly 'board.form.prompt': "提示词";
    readonly 'board.form.promptPlaceholder': "例如：运行 pnpm run build 并汇报结果";
    readonly 'board.form.cron': "Cron 表达式";
    readonly 'board.form.cronPlaceholder': "0 23 * * *";
    readonly 'board.form.cronHint': "五段式，留空则仅手动执行。例：0 23 * * * 表示每天 23:00";
    readonly 'board.form.workspace': "项目";
    readonly 'board.form.workspaceNone': "不绑定项目";
    readonly 'board.form.submit': "创建";
    readonly 'board.form.cancel': "取消";
    readonly 'board.action.run': "执行";
    readonly 'board.action.open': "查看会话";
    readonly 'board.action.edit': "编辑";
    readonly 'board.action.remove': "删除";
    readonly 'board.action.save': "保存";
    readonly 'board.action.toTodo': "移到待办";
    readonly 'board.action.toPlanned': "移回待规划";
    readonly 'board.meta.nextRun': "下次执行 {time}";
    readonly 'board.meta.lastRun': "上次执行 {time}";
    readonly 'board.meta.noSession': "尚未执行";
    readonly 'board.meta.cron': "定时 {cron}";
    readonly 'board.result.summary': "结果";
    readonly 'board.result.error': "失败：{message}";
    readonly 'board.error': "操作失败：{message}";
    readonly 'board.loading': "加载中…";
    readonly 'graph.entry': "Git 图谱";
    readonly 'graph.title': "Git 图谱";
    readonly 'graph.close': "关闭";
    readonly 'graph.empty': "没有可显示的提交";
    readonly 'graph.loading': "加载中…";
    readonly 'graph.refresh': "刷新";
    readonly 'graph.noWorkspace': "当前会话未绑定项目";
    readonly 'graph.error': "读取失败：{message}";
    readonly 'branch.label': "分支";
    readonly 'branch.switch': "切换到 {branch}";
    readonly 'branch.loading': "读取分支…";
    readonly 'branch.error': "读取分支失败";
    readonly 'branch.none': "非 Git 仓库";
    readonly 'branch.openGraph': "查看图谱";
    readonly 'panel.tab.files': "文件";
    readonly 'panel.tab.preview': "预览";
    readonly 'panel.tab.scm': "变更";
    readonly 'panel.collapse': "折叠面板";
    readonly 'panel.expand': "展开面板";
    readonly 'panel.resize': "拖动调整宽度，双击复位";
    readonly 'panel.noWorkspace': "当前会话未绑定项目";
    readonly 'files.search': "按文件名搜索";
    readonly 'files.empty': "目录为空";
    readonly 'files.searchEmpty': "没有匹配的文件";
    readonly 'files.error': "读取目录失败：{message}";
    readonly 'preview.empty': "在文件树中选择文件以预览";
    readonly 'preview.mode.source': "源码";
    readonly 'preview.mode.split': "分屏";
    readonly 'preview.mode.view': "预览";
    readonly 'preview.save': "保存";
    readonly 'preview.close': "关闭标签页";
    readonly 'preview.truncated': "内容已截断";
    readonly 'preview.unsupported': "该格式不支持内联预览";
    readonly 'preview.error': "打开失败：{message}";
    readonly 'preview.dirty': "未保存";
    readonly 'scm.empty': "工作区干净";
    readonly 'scm.staged': "已暂存";
    readonly 'scm.changes': "更改";
    readonly 'scm.stage': "暂存";
    readonly 'scm.unstage': "取消暂存";
    readonly 'scm.discard': "放弃更改";
    readonly 'scm.refresh': "刷新";
    readonly 'scm.renamed': "{from} → {to}";
    readonly 'scm.error': "读取状态失败：{message}";
    readonly 'balance.title': "余额";
    readonly 'balance.refresh': "刷新";
    readonly 'balance.error': "余额不可用：{message}";
};
/** English copy; the key set is checked against {@link zh}. */
export declare const en: Record<keyof typeof zh, string>;
