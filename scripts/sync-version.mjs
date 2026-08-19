#!/usr/bin/env node
/**
 * 把 package.json 的 version 同步进 src/client/meta.ts。
 *
 * 由 package.json 的 `version` 生命周期脚本调用：npm version 改完
 * package.json 之后、git commit + tag 之前执行，同步结果因此落在同一个
 * version commit 里。浏览器 bundle 读不到 package manifest，所以这份重复
 * 必须存在；tests/meta.spec.ts 仍是兜底——本脚本失效时它照样会红。
 *
 * 单独执行也安全：已同步时不写文件、退出 0。
 */
import { readFileSync, writeFileSync } from 'node:fs'

const META_URL = new URL('../src/client/meta.ts', import.meta.url)
const PKG_URL = new URL('../package.json', import.meta.url)

// 锚在完整的声明行上：宽松匹配会在文件里出现第二个版本字面量时改错地方。
const DECLARATION = /^(export const WEB_ENHANCED_VERSION = ')([^']*)(')$/m

const { version } = JSON.parse(readFileSync(PKG_URL, 'utf8'))
const source = readFileSync(META_URL, 'utf8')
const current = DECLARATION.exec(source)

if (current === null) {
  console.error('sync-version: FAIL — src/client/meta.ts 里找不到 WEB_ENHANCED_VERSION 声明；'
    + '重命名了就同步改本脚本与 tests/meta.spec.ts')
  process.exit(1)
}

if (current[2] === version) {
  console.log(`sync-version: 已是 ${version}，无需改动`)
  process.exit(0)
}

writeFileSync(META_URL, source.replace(DECLARATION, `$1${version}$3`))
console.log(`sync-version: ${current[2]} → ${version}`)
