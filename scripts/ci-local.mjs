#!/usr/bin/env node
/**
 * check 门的唯一事实来源：ci.yml 的 check job 只做 checkout / setup-node /
 * setup-pnpm，其余每一步都由本脚本执行。本地跑本脚本 = CI 会跑的全部内容，
 * 两侧不可能再漂移。
 *
 * 用法：
 *   node scripts/ci-local.mjs [--full|--fast] [--matrix|--node 22,24]
 *                             [--no-worktree] [--port 3190]
 *                             [--rebuild-host] [--keep]
 *
 *   --full          默认。含 smoke e2e（需宿主构建 + 系统 Chrome）
 *   --fast          跳过 smoke e2e，只跑 install/check/pack/漂移门
 *   --node 22,24    依次在这些 Node 版本上重跑自己（本地经 nvm 定位）
 *   --matrix        等价 --node 22,24（与 ci.yml 的矩阵一致）
 *   --no-worktree   就地跑；CI 用（checkout 本身已是干净树）
 *   --port          smoke e2e 的端口，默认 3190
 *   --rebuild-host  强制重装重建宿主，忽略已缓存的构建
 *   --keep          保留 e2e 的临时 DSH_HOME（排障用）
 *   --clean         成功后删除 worktree 与本次打包产物（省空间，下次全量重建）
 *
 * 本地默认在 `.ci-local/worktree`（HEAD 的干净副本）里执行，因此
 * `git diff --exit-code -- lib/` 与 CI 的全新 checkout 语义一致，且不污染
 * 开发树 —— 代价是**未提交的改动不参与本次验证**。
 *
 * 退出码 0 = 与 CI 等价的检查全部通过。
 */

import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// ── 宿主基线 ────────────────────────────────────────────────────────────────
// smoke e2e 的宿主 SHA，钉在 rc.7 发布提交（2026-08-17，全链路 e2e 首次全绿
// 时的宿主）。宿主 master 前移不再能使本仓库变红；升级基线时只改这一处。
const HOST_REF = '99f6f02fecdb7dff40c3fbc9470f5907c29f74ca'
const HOST_URL = 'https://github.com/deepseek-ai/deepseek-harness.git'

// ci.yml 的矩阵：22 = 最低支持宿主，24 = 前向集成。
const MATRIX_NODES = ['22', '24']

const SCRIPT_PATH = fileURLToPath(import.meta.url)
const SCRIPT_DIR = dirname(SCRIPT_PATH)

const fail = (msg) => { console.error(`\n✗ ${msg}\n`); process.exit(1) }
const log = (msg) => console.log(`· ${msg}`)
const step = (n, total, title) => console.log(`\n▶ [${n}/${total}] ${title}`)

/**
 * 解析命令的可执行形态。Windows 上 npm/pnpm/git 是 .cmd shim：正常终端里
 * libuv 会按 PATHEXT 找到并包装；受限环境（无 cmd 包装权限）里直接 spawn
 * 报 ENOENT/EINVAL，此时退回 `cmd /d /s /c` 显式包装（参数按需加引号）。
 */
function resolveCommand(cmd, args) {
  if (process.platform !== 'win32') return { cmd, args }
  // 无参数探测：只看 spawn 是否可行（usage/help 退出码不算失败），零副作用。
  const probe = spawnSync(cmd, [], { stdio: 'ignore' })
  if (probe.error === undefined || probe.error === null) return { cmd, args }
  const flat = [cmd, ...args].map((part) => {
    const text = String(part)
    return /[\s"]/u.test(text) ? '"' + text.replaceAll('"', '\\"') + '"' : text
  }).join(' ')
  return { cmd: process.env.ComSpec ?? 'cmd.exe', args: ['/d', '/s', '/c', flat] }
}

/** 执行并继承 stdio；非零退出即失败，带上可复现的命令行。 */
const run = (cmd, args, opts = {}) => {
  const where = opts.cwd === undefined ? '' : ` (cwd: ${opts.cwd})`
  log(`$ ${cmd} ${args.join(' ')}${where}`)
  const resolved = resolveCommand(cmd, args)
  const r = spawnSync(resolved.cmd, resolved.args, { stdio: 'inherit', ...opts })
  if (r.error !== undefined && r.error !== null) fail(`无法执行 ${cmd}：${r.error.message}`)
  if (r.status !== 0) fail(`失败（退出码 ${r.status}）：${cmd} ${args.join(' ')}${where}`)
}

/** 执行并取回 stdout；失败返回 null，供探测类调用判断。 */
const capture = (cmd, args, opts = {}) => {
  try {
    const resolved = resolveCommand(cmd, args)
    const r = spawnSync(resolved.cmd, resolved.args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts })
    if (r.error !== undefined && r.error !== null) return null
    if (r.status !== 0) return null
    return (r.stdout ?? '').trim()
  } catch {
    return null
  }
}

// ── 参数 ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
if (argv.includes('--help') || argv.includes('-h')) {
  console.log(readFileSync(SCRIPT_PATH, 'utf8').split('*/')[0].replace(/^#!.*\n/, ''))
  process.exit(0)
}
const flag = (name) => argv.includes(name)
const value = (name) => {
  const i = argv.indexOf(name)
  return i === -1 ? undefined : argv[i + 1]
}

const FAST = flag('--fast')
const FULL = !FAST
const USE_WORKTREE = !flag('--no-worktree')
const PORT = value('--port') ?? '3190'
const REBUILD_HOST = flag('--rebuild-host')
const KEEP = flag('--keep')
const CLEAN = flag('--clean')
const NODES = flag('--matrix')
  ? MATRIX_NODES
  : (value('--node') ?? '').split(',').map(s => s.trim()).filter(Boolean)

// ── Node 矩阵：逐个版本重跑自己 ─────────────────────────────────────────────
// nvm 是 shell function，无法直接 exec；改为定位 ~/.nvm 下的 node 可执行文件。
if (NODES.length > 0) {
  const passthrough = argv.filter((a, i) =>
    a !== '--matrix' && a !== '--node' && argv[i - 1] !== '--node')
  for (const version of NODES) {
    const bin = resolveNodeBin(version)
    console.log(`\n${'═'.repeat(72)}\n█ Node ${version}: ${bin}\n${'═'.repeat(72)}`)
    const r = spawnSync(bin, [SCRIPT_PATH, ...passthrough], { stdio: 'inherit' })
    if (r.status !== 0) fail(`Node ${version} 矩阵分支失败（退出码 ${r.status}）`)
  }
  console.log(`\n✓ 矩阵全部通过：Node ${NODES.join(', ')}`)
  process.exit(0)
}

// ── 定位主仓库与工作目录 ────────────────────────────────────────────────────
// .ci-local 始终落在主仓库根：worktree 内跑时也复用同一份宿主缓存。
const gitCommonDir = capture('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: SCRIPT_DIR })
if (gitCommonDir === null) fail('不在 git 仓库中（本脚本依赖 git 提供干净树语义）')
const MAIN_ROOT = dirname(gitCommonDir)
const CI_LOCAL = join(MAIN_ROOT, '.ci-local')
const HOST_DIR = join(CI_LOCAL, 'host', HOST_REF)
const HOST_BUILT_MARKER = join(HOST_DIR, '.ci-host-built')
const WORKTREE_DIR = join(CI_LOCAL, 'worktree')

const TOTAL = FULL ? 8 : 6
let stepNo = 0

console.log(`dsh-web-enhanced 本地 CI 门（与 ci.yml 的 check job 等价）`)
log(`模式: ${FULL ? '--full（含 smoke e2e）' : '--fast（跳过 smoke e2e）'}`)
log(`Node: ${process.version}  主仓库: ${MAIN_ROOT}`)

// ── 1. 前置检查 ─────────────────────────────────────────────────────────────
step(++stepNo, TOTAL, '前置检查')
{
  const major = Number(process.versions.node.split('.')[0])
  if (!MATRIX_NODES.includes(String(major))) {
    log(`⚠ 当前 Node ${major} 不在 CI 矩阵 ${MATRIX_NODES.join('/')} 内；用 --matrix 覆盖两个版本`)
  }
  const pnpmVersion = capture('pnpm', ['--version'])
  if (pnpmVersion === null) fail('未找到 pnpm')
  log(`pnpm ${pnpmVersion}`)
  if (FULL) assertChromeAvailable()
}

// ── 2. 准备干净工作树 ───────────────────────────────────────────────────────
step(++stepNo, TOTAL, USE_WORKTREE ? '准备 HEAD 的干净 worktree' : '就地运行（--no-worktree）')
const REPO_DIR = USE_WORKTREE ? prepareWorktree() : MAIN_ROOT
log(`工作目录: ${REPO_DIR}`)

// ── 3. 宿主：取到钉死的 SHA 并构建（按 SHA 缓存）─────────────────────────────
if (FULL) {
  step(++stepNo, TOTAL, `宿主 @ ${HOST_REF.slice(0, 10)}`)
  ensureHost()
}

// ── 4. 插件依赖 ─────────────────────────────────────────────────────────────
step(++stepNo, TOTAL, 'pnpm install --frozen-lockfile')
run('pnpm', ['install', '--frozen-lockfile'], { cwd: REPO_DIR })

// ── 5. check：干净重建 + 类型检查 + 单测 ────────────────────────────────────
step(++stepNo, TOTAL, 'pnpm run check（rm lib → tsc -b --force → vitest → tsdown）')
run('pnpm', ['run', 'check'], { cwd: REPO_DIR })

// ── 6. 打包门 ───────────────────────────────────────────────────────────────
step(++stepNo, TOTAL, 'verify-pack')
run('node', ['scripts/verify-pack.mjs'], { cwd: REPO_DIR })

// ── 7. 产物漂移门 ───────────────────────────────────────────────────────────
// 提交进仓的 lib/ 必须与 src 一致：漂移 = 上次源码改动从未构建发布。
step(++stepNo, TOTAL, 'lib/ 与 src/ 一致性')
{
  const r = spawnSync('git', ['diff', '--exit-code', '--', 'lib/'], { cwd: REPO_DIR, stdio: 'inherit' })
  if (r.status !== 0) {
    console.error('\n  lib/ 与 src/ 不一致：干净重建的产物和提交进仓的不同。')
    console.error('  修法：在开发树执行 `pnpm run check`，然后提交 lib/ 产物。')
    fail('产物漂移门失败')
  }
  log('lib/ 无漂移')
}

// ── 8. smoke e2e（无模型 key）───────────────────────────────────────────────
if (FULL) {
  step(++stepNo, TOTAL, `smoke e2e（真实安装 → 真实 web → 浏览器断言，端口 ${PORT}）`)
  const packed = capture('npm', ['pack', '--silent'], { cwd: REPO_DIR })
  if (packed === null) fail('npm pack 失败')
  const tarballName = packed.split('\n').filter(Boolean).pop().trim()
  const tarballPath = join(REPO_DIR, tarballName)
  if (!existsSync(tarballPath)) fail(`npm pack 未产出预期 tarball：${tarballPath}`)
  const tarballSha = createHash('sha256').update(readFileSync(tarballPath)).digest('hex')
  log(`tarball: ${tarballName} (sha256 ${tarballSha.slice(0, 12)}…)`)

  const e2eArgs = [
    'scripts/e2e.mjs', '--smoke', '--install', 'tarball',
    '--tarball', tarballPath, '--tarball-sha256', tarballSha,
    '--port', String(PORT),
  ]
  if (KEEP) e2eArgs.push('--keep')
  run('node', e2eArgs, {
    cwd: REPO_DIR,
    env: {
      ...process.env,
      DSH_ROOT: HOST_DIR,
      DSH_BIN: join(HOST_DIR, 'apps/cli/lib/bin.js'),
    },
  })
}

console.log(`\n✓ 全部通过 —— 这与 ci.yml 的 check job 在 Node ${process.versions.node.split('.')[0]} 上跑的内容等价。`)
if (FAST) console.log('  注意：--fast 跳过了 smoke e2e，CI 仍会跑它。')
if (NODES.length === 0 && !flag('--matrix')) {
  console.log(`  注意：本次只覆盖 Node ${process.versions.node.split('.')[0]}；CI 矩阵是 ${MATRIX_NODES.join(' + ')}，用 --matrix 全覆盖。`)
}
if (CLEAN) {
  // 全部重新生成、纯缓存性质的产物：worktree（含 node_modules）与本次打包的 tgz。
  // host/<sha> 保留——宿主构建最重且按 SHA 缓存，删了每次 --full 都重建。
  log('--clean：清理 worktree 与打包产物')
  if (existsSync(WORKTREE_DIR)) rmSync(WORKTREE_DIR, { recursive: true, force: true })
  run('git', ['worktree', 'prune'], { cwd: MAIN_ROOT })
  for (const file of readdirSync(REPO_DIR)) {
    if (file.endsWith('.tgz')) rmSync(join(REPO_DIR, file), { force: true })
  }
}
process.exit(0)

// ── 实现 ────────────────────────────────────────────────────────────────────

/**
 * 在 `.ci-local/worktree` 建立/复用 HEAD 的干净副本并返回其路径。
 *
 * 复用而不是每次重建：node_modules 得以保留，pnpm install 走增量。清理用
 * `clean -xdf --exclude=node_modules` + `reset --hard`，因此被跟踪文件回到
 * HEAD、未跟踪残留（tgz、截图）被清除，与 CI 的全新 checkout 等价。
 * @returns worktree 的绝对路径。
 */
function prepareWorktree() {
  const head = capture('git', ['rev-parse', 'HEAD'], { cwd: MAIN_ROOT })
  if (head === null) fail('无法解析 HEAD')
  const dirty = capture('git', ['status', '--porcelain'], { cwd: MAIN_ROOT })
  if (dirty !== null && dirty !== '') {
    log('⚠ 开发树有未提交改动；worktree 基于 HEAD，本次验证不包含它们')
  }
  mkdirSync(CI_LOCAL, { recursive: true })
  if (!existsSync(join(WORKTREE_DIR, '.git'))) {
    // 上一次异常退出可能留下已注册但目录消失的 worktree 记录。
    run('git', ['worktree', 'prune'], { cwd: MAIN_ROOT })
    if (existsSync(WORKTREE_DIR)) rmSync(WORKTREE_DIR, { recursive: true, force: true })
    run('git', ['worktree', 'add', '--detach', WORKTREE_DIR, head], { cwd: MAIN_ROOT })
  } else {
    // reset --hard 直接移动 HEAD 并丢弃脏文件；先 checkout 会被上一次运行的
    // 本地改动阻止（HEAD 前进复用 worktree 时必然发生）。
    run('git', ['reset', '--hard', head], { cwd: WORKTREE_DIR })
    run('git', ['clean', '-xdf', '--exclude=node_modules'], { cwd: WORKTREE_DIR })
  }
  return WORKTREE_DIR
}

/**
 * 确保 HOST_REF 的宿主存在于 HOST_DIR 且已 install + build。
 *
 * 优先从本地已有的 deepseek-harness clone 取（`git clone --local` 硬链接对象，
 * 零网络、秒级、且目标是独立仓库）；找不到才走 CI 的浅取路径。构建成功后写
 * 标记文件，SHA 不变即整步跳过。
 */
function ensureHost() {
  if (existsSync(HOST_BUILT_MARKER) && !REBUILD_HOST) {
    log(`宿主已构建（缓存命中）：${HOST_DIR}`)
    log(`  强制重建用 --rebuild-host`)
    return
  }
  mkdirSync(dirname(HOST_DIR), { recursive: true })

  if (!existsSync(join(HOST_DIR, '.git'))) {
    if (existsSync(HOST_DIR)) rmSync(HOST_DIR, { recursive: true, force: true })
    const localClone = findLocalHostClone()
    if (localClone !== null) {
      log(`从本地 clone 取宿主（零网络）：${localClone}`)
      run('git', ['clone', '--local', '--no-checkout', localClone, HOST_DIR])
      run('git', ['checkout', '--detach', HOST_REF], { cwd: HOST_DIR })
    } else {
      log('本地无可用 clone，改走网络浅取')
      // 按 ref 定向浅取而不是 clone 默认分支：HOST_REF 钉的是 SHA，默认分支
      // 前移后浅克隆里不会再有它，checkout 必然失败。
      mkdirSync(HOST_DIR, { recursive: true })
      run('git', ['init', '-q', HOST_DIR])
      run('git', ['remote', 'add', 'origin', HOST_URL], { cwd: HOST_DIR })
      run('git', ['fetch', '--depth', '1', 'origin', HOST_REF], { cwd: HOST_DIR })
      run('git', ['checkout', '-q', '--detach', 'FETCH_HEAD'], { cwd: HOST_DIR })
    }
  }

  const actual = capture('git', ['rev-parse', 'HEAD'], { cwd: HOST_DIR })
  if (actual !== HOST_REF) fail(`宿主 checkout 不是钉死的 SHA：期望 ${HOST_REF}，实际 ${actual}`)

  // 宿主落在插件仓库内（.ci-local/），必须确认插件根的 .npmrc 没有沿目录树
  // 泄漏进宿主的 pnpm 配置 —— 否则宿主的依赖解析与 CI 不同，整个 e2e 失去
  // 参照价值。宿主自身无 .npmrc，pnpm 默认 auto-install-peers=true。
  const inherited = capture('pnpm', ['config', 'get', 'auto-install-peers'], { cwd: HOST_DIR })
  if (inherited === 'false') {
    fail(`宿主继承了插件根的 .npmrc（auto-install-peers=false）：${HOST_DIR}\n`
      + '  这会让宿主依赖解析偏离 CI。请把宿主移出插件仓库后重跑。')
  }
  // pnpm 对未设置的键打印字面 undefined —— 那正是「没继承」的期望结果。
  const shown = (inherited === null || inherited === '' || inherited === 'undefined')
    ? '未设置（pnpm 默认 true）'
    : inherited
  log(`宿主 pnpm 配置隔离正常（auto-install-peers: ${shown}）`)

  log('宿主 install + build（首次较慢，之后按 SHA 缓存跳过）')
  run('pnpm', ['install', '--frozen-lockfile'], { cwd: HOST_DIR })
  run('pnpm', ['run', 'build'], { cwd: HOST_DIR })

  const bin = join(HOST_DIR, 'apps/cli/lib/bin.js')
  if (!existsSync(bin)) fail(`宿主构建后仍无 ${bin}`)
  writeFileSync(HOST_BUILT_MARKER, `${HOST_REF}\nbuilt by node ${process.version}\n`)
  log(`宿主就绪：${bin}`)
}

/**
 * 向上探测一个含 HOST_REF 对象的 deepseek-harness clone。
 * @returns clone 的绝对路径；没找到返回 null。
 */
function findLocalHostClone() {
  const override = process.env.DSH_LOCAL_CLONE
  if (override !== undefined && override !== '') {
    if (capture('git', ['cat-file', '-t', HOST_REF], { cwd: override }) !== 'commit') {
      fail(`DSH_LOCAL_CLONE=${override} 中没有 ${HOST_REF}`)
    }
    return resolve(override)
  }
  let dir = MAIN_ROOT
  for (let i = 0; i < 6; i++) {
    dir = dirname(dir)
    if (dir === '/' || dir === '') break
    if (!existsSync(join(dir, '.git'))) continue
    if (capture('git', ['cat-file', '-t', HOST_REF], { cwd: dir }) !== 'commit') continue
    return dir
  }
  return null
}

/**
 * smoke e2e 用 playwright 的 `channel: 'chrome'`，即系统安装的真实 Chrome
 * （CI 的 ubuntu-latest 预装）。缺失时给出安装指令并失败，而不是等到
 * e2e 跑到浏览器那一步再报晦涩错误。
 */
function assertChromeAvailable() {
  if (process.platform === 'win32') {
    const candidates = [
      process.env['PROGRAMFILES'] + '\\Google\\Chrome\\Application\\chrome.exe',
      process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
      process.env['LOCALAPPDATA'] + '\\Google\\Chrome\\Application\\chrome.exe',
    ]
    for (const candidate of candidates) {
      if (candidate !== undefined && existsSync(candidate)) {
        log('Chrome: ' + candidate)
        return
      }
    }
    fail('smoke e2e 需要系统 Chrome（e2e.mjs 用 playwright channel:"chrome"），本机未找到。\n'
      + '  装法：安装 Google Chrome 到默认路径（playwright channel:"chrome" 会读注册表/标准路径）。\n'
      + '  只想先跑其余检查：加 --fast')
  }
  const found = capture('sh', ['-c',
    'command -v google-chrome-stable || command -v google-chrome || command -v chrome'])
  if (found !== null && found !== '') {
    log(`Chrome: ${found.split('\n')[0]}`)
    return
  }
  if (existsSync('/opt/google/chrome/chrome')) {
    log('Chrome: /opt/google/chrome/chrome')
    return
  }
  fail('smoke e2e 需要系统 Chrome（e2e.mjs 用 playwright channel:"chrome"），本机未找到。\n'
    + '  装法（任选其一，均需一次）：\n'
    + `    npx playwright@1.49.0 install --with-deps chrome    # 需 sudo，会装 google-chrome-stable\n`
    + '    sudo apt install google-chrome-stable\n'
    + '  只想先跑其余检查：加 --fast')
}

/**
 * 定位指定大版本的 node 可执行文件：先看当前进程，再看 PATH，最后翻 ~/.nvm。
 * @param version - Node 大版本号，如 '22'。
 * @returns node 可执行文件的绝对路径或可执行名。
 */
function resolveNodeBin(version) {
  if (process.versions.node.split('.')[0] === version) return process.execPath
  const nvmVersions = join(process.env.HOME ?? '', '.nvm/versions/node')
  if (existsSync(nvmVersions)) {
    const match = readdirSync(nvmVersions)
      .filter(name => name.startsWith(`v${version}.`))
      .sort()
      .pop()
    if (match !== undefined) return join(nvmVersions, match, 'bin/node')
  }
  if (process.platform === 'win32') {
    // nvm-windows / nvm4w：版本目录 <root>\v<major>.*\node.exe；NVM_HOME 优先。
    const roots = [
      process.env.NVM_HOME,
      'C:\\nvm4w',
      'C:\\nvm',
      join(process.env.APPDATA ?? '', 'nvm'),
    ].filter((root) => root !== undefined && existsSync(root))
    for (const root of roots) {
      const match = readdirSync(root)
        .filter(name => name.startsWith(`v${version}.`))
        .sort()
        .pop()
      if (match !== undefined) return join(root, match, 'node.exe')
    }
  }
  fail(`找不到 Node ${version}。本机装法：nvm install ${version}`)
}
