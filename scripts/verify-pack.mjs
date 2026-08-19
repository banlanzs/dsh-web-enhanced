#!/usr/bin/env node
/**
 * Pack verification gate: packs a REAL tarball and asserts the published
 * surface — required entries present, forbidden entries absent, all runtime
 * export targets resolvable inside the tarball, sizes under the targets.
 * Fails non-zero with the concrete offenders; thresholds are overridable
 * via env (tuning), never silently widened.
 */
import { spawnSync } from 'node:child_process'

/** Windows 上 .cmd shim 在受限环境直接 spawn 会 ENOENT/EINVAL；退回 cmd 包装。 */
function winCommand(cmd, args) {
  if (process.platform !== 'win32') return [cmd, args]
  const probe = spawnSync(cmd, [], { stdio: 'ignore' })
  if (probe.error === undefined || probe.error === null) return [cmd, args]
  const flat = [cmd, ...args].map((part) => {
    const text = String(part)
    return /[\s"]/u.test(text) ? '"' + text.replaceAll('"', '\\"') + '"' : text
  }).join(' ')
  return [process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', flat]]
}
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const MAX_TARBALL = Number(process.env.WEB_ENHANCED_PACK_MAX_TARBALL ?? 2 * 1024 * 1024)
const MAX_UNPACKED = Number(process.env.WEB_ENHANCED_PACK_MAX_UNPACKED ?? 8 * 1024 * 1024)

const pkgJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

// All runtime export targets (strings under each export entry) must exist.
const exportTargets = []
for (const entry of Object.values(pkgJson.exports)) {
  if (typeof entry === 'string') exportTargets.push(entry)
  else if (entry !== null && typeof entry === 'object') {
    for (const v of Object.values(entry)) {
      if (typeof v === 'string') exportTargets.push(v)
    }
  }
}

// Everything the loader / installer / TS consumers resolve.
const required = [
  'package.json', 'LICENSE', 'README.md', 'README.zh-CN.md', 'CHANGELOG.md', 'cordis.patch.yml',
  ...exportTargets,
]

const dir = mkdtempSync(join(tmpdir(), 'web-enhanced-pack-'))
try {
  // spawnSync + winCommand 包装：npm 是 .cmd shim，受限环境直接 spawn 会 ENOENT/EINVAL。
  const [npmCmd, npmArgs] = winCommand('npm', ['pack', '--pack-destination', dir, '--json'])
  const packedRun = spawnSync(npmCmd, npmArgs, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (packedRun.error !== undefined && packedRun.error !== null) {
    console.error('verify-pack: FAIL — cannot run npm pack: ' + packedRun.error.message)
    process.exit(1)
  }
  if (packedRun.status !== 0) {
    console.error('verify-pack: FAIL — npm pack exited ' + packedRun.status + ':\n' + String(packedRun.stderr ?? '').slice(0, 500))
    process.exit(1)
  }
  const out = packedRun.stdout ?? ''
  // npm pack runs the package's `prepare` script; on some platforms the
  // script's log lines (tsdown etc., possibly ANSI-colored) land on npm's
  // stdout BEFORE the JSON, and the JSON itself is pretty-printed. Find the
  // real array start (a '[' followed by whitespace then '{') and slice to
  // the last ']' instead of parsing the whole stream.
  const jsonStart = out.search(/\[\s*\{/)
  const end = out.lastIndexOf(']')
  if (jsonStart < 0 || end < 0 || end <= jsonStart) {
    console.error(`verify-pack: FAIL — no pack JSON in npm output:\n${out.slice(0, 500)}`)
    process.exit(1)
  }
  const [packed] = JSON.parse(out.slice(jsonStart, end + 1))
  const paths = new Set(packed.files.map(f => f.path))
  // npm pack reports paths without the leading './' that exports use.
  const at = (p) => (p.startsWith('./') ? p.slice(2) : p)

  const missing = required.filter(p => !paths.has(at(p)))
  if (missing.length > 0) {
    console.error(`verify-pack: FAIL — missing required entries: ${missing.join(', ')}`)
    process.exit(1)
  }

  const forbidden = [...paths].filter(p =>
    p.startsWith('src/')
    || p.endsWith('.map')
    || p.includes('.tsbuildinfo'),
  )
  if (forbidden.length > 0) {
    console.error(`verify-pack: FAIL — forbidden entries in pack:\n  ${forbidden.join('\n  ')}`)
    process.exit(1)
  }

  const tarballBytes = statSync(join(dir, packed.filename)).size
  const problems = []
  if (tarballBytes > MAX_TARBALL) problems.push(`tarball ${tarballBytes} > ${MAX_TARBALL}`)
  if (packed.unpackedSize > MAX_UNPACKED) problems.push(`unpacked ${packed.unpackedSize} > ${MAX_UNPACKED}`)
  if (problems.length > 0) {
    console.error(`verify-pack: FAIL — ${problems.join('; ')}`)
    process.exit(1)
  }

  console.log(`verify-pack: OK — ${packed.filename}`)
  console.log(`  tarball ${(tarballBytes / 1048576).toFixed(2)} MB (max ${(MAX_TARBALL / 1048576).toFixed(0)} MB), unpacked ${(packed.unpackedSize / 1048576).toFixed(2)} MB (max ${(MAX_UNPACKED / 1048576).toFixed(0)} MB), ${packed.entryCount} files`)
} finally {
  rmSync(dir, { recursive: true, force: true })
}
