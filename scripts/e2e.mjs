#!/usr/bin/env node
/**
 * dsh-web-enhanced 真机 e2e（无模型 key）：真实 dsh web + 插件 → 浏览器断言
 * 四块 UI —— 会话「工作区」视图里的资源管理器/预览、任务看板、Git 图谱，
 * 以及输入框下余额行。全程走真实链路，不 mock 任何环节，
 * 任何断言都不需要 DEEPSEEK_API_KEY（余额无 key 时渲染弱化错误态）。
 *
 * 失败日志可读：web 的 stdout/stderr 真写进 dsh-web.log，失败时输出日志尾部，
 * 截图保留到当前目录；清理在 finally 中完成，只杀自己起的进程组。
 *
 * 用法：
 *   node scripts/e2e.mjs [--port 3190] [--keep] --install git|tarball
 *                        [--tarball <路径> --tarball-sha256 <sha>] [--capture] [--smoke]
 *
 *   --install git     从 git URL 安装（公开仓库）
 *   --install tarball 必须给 --tarball 绝对路径与 --tarball-sha256（防假安装）
 *   --capture         把四块 UI 截图保存到 assets/（board.png graph.png panel.png balance.png）
 *   --smoke           CI 别名：本插件全链路均无需模型 key，--smoke 与默认行为一致
 * 退出码 0 = PASS，1 = FAIL。
 */

import { spawn, spawnSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdtemp, mkdir, copyFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { createServer } from 'node:net'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const fail = (msg) => { console.error(`✗ ${msg}`); process.exit(1) }
const log = (msg) => console.log(`· ${msg}`)

const DSH_ROOT = process.env.DSH_ROOT ?? resolve(process.env.HOME ?? '', '.dsh/source/current')
// 精确宿主二进制：必须是 DSH_ROOT 内构建出的绝对路径；默认不从 PATH 找 dsh。
const DSH_BIN = process.env.DSH_BIN ?? join(DSH_ROOT, 'apps/cli/lib/bin.js')
if (!resolve(DSH_BIN).startsWith('/')) fail('DSH_BIN 必须是绝对路径')
if (!existsSync(DSH_BIN)) fail(`DSH_BIN 不存在: ${DSH_BIN}（在 DSH_ROOT 内先 pnpm run build）`)
const arg = (name) => {
  const index = process.argv.indexOf(name)
  return index === -1 ? undefined : process.argv[index + 1]
}
const PORT = Number(arg('--port') ?? 3190)
const KEEP = process.argv.includes('--keep')
const CAPTURE = process.argv.includes('--capture')
const SMOKE = process.argv.includes('--smoke')
const INSTALL = arg('--install')
const TARBALL = arg('--tarball')
const TARBALL_SHA = arg('--tarball-sha256')
const GIT_URL = 'git+https://github.com/banlanzs/dsh-web-enhanced.git'

// ── 文案（产品语言 zh，en 镜像；断言同时接受两者）─────────────────────────
const UI = {
  workspaceView: ['工作区', 'Workspace'],
  boardColumns: [
    ['待规划', 'Planned'], ['待办', 'To do'], ['进行中', 'Running'],
    ['已完成', 'Done'], ['已失败', 'Failed'],
  ],
}

// ── 预检：参数、端口、工具 ─────────────────────────────────────────────────
if (!['git', 'tarball'].includes(INSTALL)) {
  fail(`--install 仅允许 git | tarball，收到 "${String(INSTALL)}"；link 会复制 peer 依赖并使 remote 失效`)
}
if (INSTALL === 'tarball') {
  if (!TARBALL || !TARBALL_SHA) fail('tarball 模式必须提供 --tarball <绝对路径> 与 --tarball-sha256 <sha256>')
  if (!resolve(TARBALL).startsWith('/')) fail('--tarball 必须是绝对路径')
  if (!existsSync(TARBALL)) fail(`tarball 不存在: ${TARBALL}`)
  const actual = createHash('sha256').update(await (await import('node:fs/promises')).readFile(TARBALL)).digest('hex')
  if (actual !== TARBALL_SHA.toLowerCase()) fail(`tarball SHA256 不匹配：期望 ${TARBALL_SHA}，实际 ${actual}`)
  log(`✓ tarball SHA256 匹配（${actual.slice(0, 12)}…）`)
}
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) fail(`非法端口: ${PORT}`)
await new Promise((res) => {
  const probe = createServer()
  probe.once('error', () => { fail(`端口 ${PORT} 已被占用，请用 --port 换一个`) })
  probe.listen(PORT, '127.0.0.1', () => probe.close(res))
})
{
  const r = spawnSync('sh', ['-c', 'command -v pnpm'], { encoding: 'utf8' })
  if (r.status !== 0) fail('未找到 pnpm，请先安装并确保在 PATH 上')
}
log(`DSH_BIN: ${DSH_BIN}`)
log(`pnpm: ${spawnSync('pnpm', ['--version'], { encoding: 'utf8' }).stdout.trim()}`)
if (SMOKE) log('smoke 模式：无模型 key 全链路（本插件四块功能均不需 key）')

// ── 临时环境 ──────────────────────────────────────────────────────────────
const DSH_HOME = await mkdtemp(join(tmpdir(), 'dsh-e2e-'))
const env = { ...process.env, DSH_HOME }
const webLog = join(DSH_HOME, 'dsh-web.log')
const artifactsDir = process.cwd()
const assetsDir = join(REPO_ROOT, 'assets')
let webChild = null

const killWeb = () => {
  if (webChild === null) return
  // 只杀自己启动的进程组（detached spawn 的负 pid），绝不 broad pkill
  try { process.kill(-webChild.pid, 'SIGTERM') } catch { /* already gone */ }
  try { process.kill(webChild.pid, 'SIGTERM') } catch { /* already gone */ }
  webChild = null
}

const cleanup = async () => {
  killWeb()
  if (!KEEP) await rm(DSH_HOME, { recursive: true, force: true })
  else log(`保留临时环境: ${DSH_HOME}（日志: ${webLog}）`)
}

const logTail = async (n = 30) => {
  try {
    const content = await (await import('node:fs/promises')).readFile(webLog, 'utf8')
    const lines = content.split('\n').filter(Boolean).slice(-n)
    console.error('── dsh-web.log 尾部 ──')
    console.error(lines.join('\n') || '(空)')
  } catch { /* no log yet */ }
}

const screenshot = async (name) => {
  try {
    if (browser !== null) await page.screenshot({ path: join(artifactsDir, name) })
  } catch { /* screenshot best-effort */ }
}

let browser = null
let page = null

try {
  // ── 安装插件 ────────────────────────────────────────────────────────────
  if (INSTALL === 'git') {
    log('安装插件（git+https，公开仓库）...')
    const r = spawnSync(DSH_BIN, ['plugin', '--profile', 'web', 'add', GIT_URL], { env, stdio: 'inherit' })
    if (r.status !== 0) fail('git URL 安装失败（见上方输出）')
  } else {
    log(`安装插件（tarball ${TARBALL}）...`)
    const r = spawnSync(DSH_BIN, ['plugin', '--profile', 'web', 'add', TARBALL], { env, stdio: 'inherit' })
    if (r.status !== 0) fail('tarball 安装失败（见上方输出）')
  }

  // ── 启动 dsh web（stdout/stderr 真写进 webLog）──────────────────────────
  log('预置工作区注册表...')
  const workspaceId = randomUUID()
  const now = new Date().toISOString()
  const workspaceReg = {
    unit: { name: 'workspace', version: 2 },
    global: { initialized: true, workspaceIds: [workspaceId], archivedSessionIds: [] },
    tables: { workspaces: { [workspaceId]: {
      path: REPO_ROOT, title: 'dsh-web-enhanced-e2e', sessionIds: [], createdAt: now, updatedAt: now,
    } } },
  }
  await mkdir(join(DSH_HOME, 'storages'), { recursive: true })
  await writeFile(join(DSH_HOME, 'storages/workspace.json'), JSON.stringify(workspaceReg, null, 2))

  const hostSettings = join(homedir(), '.dsh/settings.yaml')
  if (existsSync(hostSettings)) {
    await copyFile(hostSettings, join(DSH_HOME, 'settings.yaml'))
    log('已复制模型配置 settings.yaml（余额可能显示真实值）')
  }

  log(`启动 dsh web (port ${PORT}, DSH_HOME=${DSH_HOME})...`)
  const logStream = createWriteStream(webLog, { flags: 'a' })
  webChild = spawn(DSH_BIN, ['web', '--port', String(PORT)], {
    env, detached: true, stdio: ['ignore', 'pipe', 'pipe'],
  })
  webChild.stdout.pipe(logStream)
  webChild.stderr.pipe(logStream)
  const BASE = `http://127.0.0.1:${PORT}`
  let ready = false
  for (let i = 0; i < 120; i++) {
    if (webChild.exitCode !== null) break
    try { const res = await fetch(BASE); if (res.ok) { ready = true; break } } catch { /* booting */ }
    await new Promise(r => setTimeout(r, 1000))
  }
  if (!ready) {
    await logTail()
    fail(`dsh web 120s 内未就绪（日志: ${webLog}）`)
  }
  log('dsh web 就绪')

  // ── 浏览器链路 ──────────────────────────────────────────────────────────
  const { chromium } = await import(pathToFileURL(join(DSH_ROOT, 'apps/web/node_modules/playwright/index.mjs')).href)
  browser = await chromium.launch({ channel: 'chrome', headless: true })
  page = await browser.newPage({ viewport: { width: 1440, height: 1200 } })
  const pageErrors = []
  const consoleErrors = []
  const responseErrors = []
  page.on('pageerror', e => pageErrors.push(String(e)))
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('response', (response) => {
    if (response.status() >= 400 && response.url().includes('/api/')) {
      responseErrors.push(`${response.status()} ${response.url()}`)
    }
  })
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(5000)

  // client.js 必须 200（插件 bundle 可加载）；404 直接失败
  const clientRes = await fetch(`${BASE}/plugins/dsh-web-enhanced/client.js`)
  if (!clientRes.ok) {
    await screenshot('e2e-fail-client404.png')
    await logTail()
    fail(`client.js 返回 ${clientRes.status}（插件 bundle 未加载）`)
  }
  log(`✓ client.js ${clientRes.status}`)

  // ── 断言 1: 新会话进入工作区视图 ────────────────────────────────────────
  // 与宿主自己的浏览器 e2e 使用同一 accessible-name 契约。页面可能同时有
  // 侧边栏新建按钮和工作区里的空白会话行，文本 first() 会命中错误节点。
  const newSession = page.getByRole('button', { name: /^(?:New session|新.*会话)$/ }).last()
  await newSession.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
  if (!(await newSession.isVisible().catch(() => false))) {
    await screenshot('e2e-fail-newsession.png')
    await logTail()
    fail('首页未出现「新会话」入口')
  }
  await newSession.click()
  await page.waitForTimeout(1500)
  log('✓ 新会话入口已点击')

  const workspaceTab = await waitForTab(page, UI.workspaceView, 30000)
  if (workspaceTab === null) {
    await screenshot('e2e-fail-workspace-tab.png')
    await logTail()
    await logPluginDiagnostics(page, pageErrors, consoleErrors, responseErrors)
    fail('新会话 30s 内未出现「工作区」视图标签')
  }
  await workspaceTab.click()
  const workspaceView = page.locator('[data-testid="workspace-view"]')
  await workspaceView.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
  if (!(await workspaceView.isVisible().catch(() => false))) {
    await screenshot('e2e-fail-workspace-view.png')
    await logTail()
    fail('点击「工作区」后 15s 内未出现工作区视图（会话未挂到预置工作区？）')
  }
  log('✓ 会话工作区视图已打开')

  // 文件树 → 预览真实链路：点击工作区根目录的 README.md，断言 markdown
  // 预览出现（文件树 fsList → 文件打开 fsRead → 预览渲染，全程不 mock）。
  const readmeRow = workspaceView.locator('[data-testid="file-row"]').filter({ hasText: 'README.md' }).first()
  await readmeRow.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {})
  if (!(await readmeRow.isVisible().catch(() => false))) {
    await screenshot('e2e-fail-filetree.png')
    await logTail()
    fail('工作区文件树 20s 内未出现 README.md（工作区根未列出？）')
  }
  await readmeRow.click()
  await page.waitForTimeout(2000)
  const markdownHeading = workspaceView.getByRole('heading', { name: /dsh-web-enhanced/ }).first()
  await markdownHeading.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
  if (!(await markdownHeading.isVisible().catch(() => false))) {
    await screenshot('e2e-fail-preview.png')
    await logTail()
    fail('点击 README.md 后 15s 内未渲染 markdown 预览（文件树→预览链路断裂）')
  }
  log('✓ 文件树 → 预览链路：README.md 已渲染 markdown 标题')
  if (CAPTURE) {
    await page.screenshot({ path: join(assetsDir, 'panel.png') })
  }

  // ── 断言 2: 工作区任务看板 ──────────────────────────────────────────────
  const boardTab = workspaceView.locator('[data-testid="workspace-view-tab-board"]')
  await boardTab.click()
  const boardPanel = workspaceView.locator('[data-testid="board-panel"]')
  await boardPanel.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
  if (!(await boardPanel.isVisible().catch(() => false))) {
    await screenshot('e2e-fail-board.png')
    await logTail()
    fail('点击工作区「任务看板」标签后 15s 内未出现看板面板')
  }
  for (const col of UI.boardColumns) {
    const found = await hasAnyText(boardPanel, col, 5000)
    if (!found) {
      await screenshot('e2e-fail-board.png')
      await logTail()
      fail(`看板面板缺少列「${col[0]}」`)
    }
  }
  log('✓ 工作区任务看板：五列齐全')
  if (CAPTURE) {
    await mkdir(assetsDir, { recursive: true }).catch(() => {})
    await page.screenshot({ path: join(assetsDir, 'board.png') })
  }

  // ── 断言 3: 工作区 Git 图谱 ─────────────────────────────────────────────
  const graphTab = workspaceView.locator('[data-testid="workspace-view-tab-graph"]')
  await graphTab.click()
  const graphPanel = workspaceView.locator('[data-testid="graph-panel"]')
  await graphPanel.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
  if (!(await graphPanel.isVisible().catch(() => false))) {
    await screenshot('e2e-fail-graph.png')
    await logTail()
    fail('点击工作区「Git 图谱」标签后 15s 内未出现图谱面板')
  }
  log('✓ 工作区 Git 图谱已打开')
  if (CAPTURE) {
    await page.screenshot({ path: join(assetsDir, 'graph.png') })
  }

  // ── 断言 4: 输入框下余额行 ──────────────────────────────────────────────

  // 余额行（conversation.composer.dock；无 key 时渲染错误态，有 key 渲染数值）
  const balanceLine = page.locator('[data-testid="balance-line"]')
  await balanceLine.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
  if (!(await balanceLine.isVisible().catch(() => false))) {
    await screenshot('e2e-fail-balance.png')
    await logTail()
    fail('输入框下方 15s 内未出现余额行')
  }
  const balanceError = balanceLine.locator('[data-testid="balance-error"]')
  const balanceValue = balanceLine.locator('[data-testid="balance-value"]')
  await balanceLine.locator('[data-testid="balance-error"], [data-testid="balance-value"]')
    .first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
  const hasState = await balanceError.isVisible().catch(() => false) || await balanceValue.isVisible().catch(() => false)
  if (!hasState) {
    await screenshot('e2e-fail-balance.png')
    await logTail()
    fail('余额行 15s 内既无数值态也无错误态')
  }
  log('✓ 余额行（' + (await balanceError.isVisible().catch(() => false) ? '错误态（无 key）' : '数值态') + '）')
  if (CAPTURE) {
    await page.screenshot({ path: join(assetsDir, 'balance.png') })
  }

  // ── 收尾：页面异常零容忍 ────────────────────────────────────────────────
  if (pageErrors.length > 0) {
    await screenshot('e2e-fail-pageerror.png')
    await logTail()
    fail(`页面异常: ${pageErrors.slice(0, 3).join(' | ')}`)
  }

  console.log('PASS 真机 e2e 通过（无模型 key）：安装 → 新会话 → 工作区预览 → 看板 → 图谱 → 余额行')
  await browser.close()
  await cleanup()
  process.exit(0)
} catch (e) {
  console.error('✗ e2e 异常:', e)
  await logTail()
  if (browser !== null) await browser.close().catch(() => {})
  await cleanup()
  process.exit(1)
}

// ── 工具函数 ────────────────────────────────────────────────────────────────

/** 轮询等待任一命名的 tab 出现，返回 locator（zh/en 任一），超时返回 null。 */
async function waitForTab(page, variants, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    for (const v of variants) {
      const loc = page.getByRole('tab', { name: v, exact: true }).first()
      if (await loc.isVisible().catch(() => false)) return loc
    }
    await new Promise(r => setTimeout(r, 500))
  }
  return null
}

/** 输出插件加载诊断，区分 bundle 未执行、apply 未完成和 UI 选择器漂移。 */
async function logPluginDiagnostics(page, pageErrors, consoleErrors, responseErrors) {
  const diag = await page.evaluate(() => {
    const testIds = [...document.querySelectorAll('[data-testid]')]
      .map(el => el.getAttribute('data-testid'))
      .filter(id => id !== null && (id.includes('web-enhanced') || id.includes('workspace-view')))
    const styles = [...document.querySelectorAll('style[data-plugin]')]
      .map(el => el.getAttribute('data-plugin'))
    const tabs = [...document.querySelectorAll('[role="tab"]')]
      .filter(el => el instanceof HTMLElement && el.offsetParent !== null)
      .map(el => el.textContent?.trim() ?? '')
      .filter(Boolean)
    return { testIds, styles: [...new Set(styles)], tabs, url: location.href }
  }).catch(() => null)
  log(`诊断：url=${JSON.stringify(diag?.url ?? 'n/a')} tabs=${JSON.stringify(diag?.tabs ?? 'n/a')} 插件 testid=${JSON.stringify(diag?.testIds ?? 'n/a')} 注入样式=${JSON.stringify(diag?.styles ?? 'n/a')} pageerrors=${JSON.stringify(pageErrors.slice(0, 3))} consoleErrors=${JSON.stringify(consoleErrors.slice(0, 5))} apiErrors=${JSON.stringify(responseErrors.slice(0, 5))}`)
}

/** 容器内是否出现任一文案（最多轮询 timeoutMs）。 */
async function hasAnyText(container, variants, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    for (const v of variants) {
      const loc = container.getByText(v, { exact: false }).first()
      if (await loc.isVisible().catch(() => false)) return true
    }
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}
