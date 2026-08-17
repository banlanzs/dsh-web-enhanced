#!/usr/bin/env node
/**
 * dsh-web-enhanced 真机 e2e（无模型 key）：真实 dsh web + 插件 → 浏览器断言
 * 四块 UI —— 侧边栏「任务看板 / Git 图谱」入口、看板覆盖层、图谱覆盖层、会话页
 * 浮动面板（预览/文件/变更）与输入框下余额行。全程走真实链路，不 mock 任何环节，
 * 任何断言都不需要 DEEPSEEK_API_KEY（余额无 key 时渲染弱化错误态）。
 *
 * 失败日志可读：web 的 stdout/stderr 真写进 dsh-web.log，失败时输出日志尾部，
 * 截图保留到当前目录；清理在 finally 中完成，只杀自己起的进程组。
 *
 * 用法：
 *   node scripts/e2e.mjs [--port 3190] [--keep] [--install link|git|tarball]
 *                        [--tarball <路径> --tarball-sha256 <sha>] [--capture] [--smoke]
 *
 *   --install link    （默认）装当前工作区，测的就是当前代码
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
const arg = (name) => process.argv[process.argv.indexOf(name) + 1]
const PORT = Number(arg('--port') ?? 3190)
const KEEP = process.argv.includes('--keep')
const CAPTURE = process.argv.includes('--capture')
const SMOKE = process.argv.includes('--smoke')
const INSTALL = arg('--install') ?? 'link'
const TARBALL = arg('--tarball')
const TARBALL_SHA = arg('--tarball-sha256')
const GIT_URL = 'git+https://github.com/banlanzs/dsh-web-enhanced.git'

// ── 文案（产品语言 zh，en 镜像；断言同时接受两者）─────────────────────────
const UI = {
  boardEntry: ['任务看板', 'Task board'],
  graphEntry: ['Git 图谱', 'Git graph'],
  close: ['关闭', 'Close'],
  newSession: ['新会话', 'New session'],
  boardColumns: [
    ['待规划', 'Planned'], ['待办', 'To do'], ['进行中', 'Running'],
    ['已完成', 'Done'], ['已失败', 'Failed'],
  ],
  panelTabs: [['预览', 'Preview'], ['文件', 'Files'], ['变更', 'Changes']],
}

// ── 预检：参数、端口、工具 ─────────────────────────────────────────────────
if (!['link', 'git', 'tarball'].includes(INSTALL)) fail(`--install 仅允许 link | git | tarball，收到 "${INSTALL}"`)
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
  } else if (INSTALL === 'tarball') {
    log(`安装插件（tarball ${TARBALL}）...`)
    const r = spawnSync(DSH_BIN, ['plugin', '--profile', 'web', 'add', TARBALL], { env, stdio: 'inherit' })
    if (r.status !== 0) fail('tarball 安装失败（见上方输出）')
  } else {
    log('安装插件（link 当前工作区）...')
    const r = spawnSync(DSH_BIN, ['plugin', '--profile', 'web', 'add', `link:${REPO_ROOT}`], { env, stdio: 'inherit' })
    if (r.status !== 0) fail('link 安装失败（见上方输出）')
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
  page.on('pageerror', e => pageErrors.push(String(e)))
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

  // ── 断言 1: 侧边栏入口 ──────────────────────────────────────────────────
  // testid 优先，文案回退：侧边栏收起成 56px 轨道时入口只剩图标，label 根本
  // 不进 DOM（见 SidebarEntry 的 rail 分支），此时文案匹配必然落空，而入口
  // 其实渲染正常。覆盖层/悬浮面板/余额行早已按 testid 断言，这里保持一致。
  const boardEntry = await waitForEntry(page, 'web-enhanced-board-entry', UI.boardEntry, 30000)
  if (boardEntry === null) {
    await screenshot('e2e-fail-sidebar.png')
    await logTail()
    const diag = await page.evaluate(() => {
      const ours = [...document.querySelectorAll('[data-testid]')]
        .map(el => el.getAttribute('data-testid'))
        .filter(id => id !== null && id.includes('web-enhanced'))
      const styles = [...document.querySelectorAll('style[data-plugin]')]
        .map(el => el.getAttribute('data-plugin'))
      return {
        ours,
        styles: [...new Set(styles)],
        testIds: [...document.querySelectorAll('[data-testid]')].length,
      }
    }).catch(() => null)
    log(`诊断：插件 testid=${JSON.stringify(diag?.ours ?? 'n/a')} 注入样式=${JSON.stringify(diag?.styles ?? 'n/a')} 页面 testid 总数=${String(diag?.testIds ?? 'n/a')}`)
    fail(`侧边栏 30s 内未出现「任务看板」入口（pageerrors: ${pageErrors.slice(0, 3).join(' | ') || '无'}）`)
  }
  const graphEntry = await waitForEntry(page, 'web-enhanced-graph-entry', UI.graphEntry, 10000)
  if (graphEntry === null) {
    await screenshot('e2e-fail-sidebar.png')
    await logTail()
    fail(`侧边栏 10s 内未出现「Git 图谱」入口`)
  }
  log('✓ 侧边栏入口：任务看板 + Git 图谱')

  // ── 断言 2: 看板覆盖层 ──────────────────────────────────────────────────
  await boardEntry.click()
  const boardOverlay = page.locator('[data-testid="board-overlay"]')
  await boardOverlay.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
  if (!(await boardOverlay.isVisible().catch(() => false))) {
    await screenshot('e2e-fail-board.png')
    await logTail()
    fail('点击「任务看板」后 15s 内未出现看板覆盖层')
  }
  for (const col of UI.boardColumns) {
    const found = await hasAnyText(boardOverlay, col, 5000)
    if (!found) {
      await screenshot('e2e-fail-board.png')
      await logTail()
      fail(`看板覆盖层缺少列「${col[0]}」`)
    }
  }
  log('✓ 看板覆盖层：五列齐全')
  if (CAPTURE) {
    await mkdir(assetsDir, { recursive: true }).catch(() => {})
    await page.screenshot({ path: join(assetsDir, 'board.png') })
  }
  await closeOverlay(page, boardOverlay, 'board')

  // ── 断言 3: 图谱覆盖层 ──────────────────────────────────────────────────
  await graphEntry.click()
  const graphOverlay = page.locator('[data-testid="graph-overlay"]')
  await graphOverlay.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
  if (!(await graphOverlay.isVisible().catch(() => false))) {
    await screenshot('e2e-fail-graph.png')
    await logTail()
    fail('点击「Git 图谱」后 15s 内未出现图谱覆盖层')
  }
  log('✓ 图谱覆盖层已打开')
  if (CAPTURE) {
    await page.screenshot({ path: join(assetsDir, 'graph.png') })
  }
  await closeOverlay(page, graphOverlay, 'graph')

  // ── 断言 4: 会话页 —— 浮动面板 + 余额行 ────────────────────────────────
  const newSession = await waitForText(page, UI.newSession, 10000)
  if (newSession === null) {
    await screenshot('e2e-fail-newsession.png')
    await logTail()
    fail('首页未出现「新会话」入口')
  }
  await newSession.click().catch(() => {})
  await page.waitForTimeout(1500)

  // 浮动面板（conversation.input.dock，需要会话挂到预置工作区）
  const floatingPanel = page.locator('[data-testid="floating-panel"]')
  await floatingPanel.waitFor({ state: 'visible', timeout: 45000 }).catch(() => {})
  if (!(await floatingPanel.isVisible().catch(() => false))) {
    await screenshot('e2e-fail-panel.png')
    await logTail()
    fail('新会话 45s 内未出现浮动面板（会话未挂到预置工作区？）')
  }
  for (const tab of UI.panelTabs) {
    const found = await hasAnyText(floatingPanel, tab, 5000)
    if (!found) {
      await screenshot('e2e-fail-panel.png')
      await logTail()
      fail(`浮动面板缺少标签「${tab[0]}」`)
    }
  }
  log('✓ 浮动面板：预览 / 文件 / 变更')

  // 文件树 → 预览真实链路：点击工作区根目录的 README.md，断言 markdown
  // 预览出现（文件树 fsList → 文件打开 fsRead → 预览渲染，全程不 mock）。
  const readmeRow = floatingPanel.locator('[data-testid="file-row"]').filter({ hasText: 'README.md' }).first()
  await readmeRow.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {})
  if (!(await readmeRow.isVisible().catch(() => false))) {
    await screenshot('e2e-fail-filetree.png')
    await logTail()
    fail('浮动面板文件树 20s 内未出现 README.md（工作区根未列出？）')
  }
  await readmeRow.click()
  await page.waitForTimeout(2000)
  const markdownHeading = floatingPanel.getByRole('heading', { name: /dsh-web-enhanced/ }).first()
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

  console.log('PASS 真机 e2e 通过（无模型 key）：安装 → 侧边栏入口 → 看板 → 图谱 → 浮动面板 → 余额行')
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

/** 轮询等待任一文案出现，返回 locator（zh/en 任一），超时返回 null。 */
async function waitForText(page, variants, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    for (const v of variants) {
      const loc = page.getByText(v, { exact: false }).first()
      if (await loc.isVisible().catch(() => false)) return loc
    }
    await new Promise(r => setTimeout(r, 500))
  }
  return null
}

/**
 * 等待一个侧边栏入口出现：先按 testid，再按文案回退。
 *
 * 入口在收起的 56px 轨道里只渲染图标（label 不进 DOM），所以文案匹配会漏报
 * 一个其实正常的入口；testid 两种形态都在。文案回退保留，是为了兼容还没有
 * testid 的旧构建。
 * @param page - playwright page。
 * @param testId - 入口按钮的 data-testid。
 * @param variants - 中英文案，testid 落空时回退匹配。
 * @param timeoutMs - 总超时。
 * @returns 命中的 locator，超时返回 null。
 */
async function waitForEntry(page, testId, variants, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const byId = page.locator(`[data-testid="${testId}"]`).first()
    if (await byId.isVisible().catch(() => false)) return byId
    for (const v of variants) {
      const loc = page.getByText(v, { exact: false }).first()
      if (await loc.isVisible().catch(() => false)) return loc
    }
    await new Promise(r => setTimeout(r, 500))
  }
  return null
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

/** 点掉覆盖层的关闭按钮（按 overlay 作用域找文案，避免误点别处）。 */
async function closeOverlay(page, overlay, label) {
  const close = await (async () => {
    for (const v of UI.close) {
      const loc = overlay.getByText(v, { exact: false }).first()
      if (await loc.isVisible().catch(() => false)) return loc
    }
    return null
  })()
  if (close === null) {
    await screenshot(`e2e-fail-close-${label}.png`)
    await logTail()
    fail(`覆盖层（${label}）内未找到关闭按钮`)
  }
  await close.click().catch(() => {})
  await page.waitForTimeout(500)
  const gone = await overlay.isHidden().catch(() => true)
  if (!gone) {
    await screenshot(`e2e-fail-close-${label}.png`)
    fail(`覆盖层（${label}）关闭失败`)
  }
}
