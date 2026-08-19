/**
 * Standalone build for dsh-web-enhanced: the node-half library (tsc emits
 * lib/types, tsdown re-emits lib/) plus the browser client bundle in the
 * module-loader closure format (lib/client.js). The webEnhanced remote is a
 * hand-declared src-json contribution, so no typert generation step exists.
 */
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { basename, dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type UserConfig } from 'tsdown'
import { transform } from 'lightningcss'

const ID = 'dsh-web-enhanced'

/**
 * Package root, derived from this config's own location rather than
 * `process.cwd()`, so the ids below do not depend on where the build was
 * invoked from.
 */
const ROOT = dirname(fileURLToPath(import.meta.url))

/**
 * One absolute path as a repo-relative, forward-slash id.
 *
 * Every byte derived from a path must be machine-independent: the id lands
 * verbatim in the bundle's `//#region` comments, and lightningcss hashes the
 * `filename` it is given to scope CSS module class names. An absolute path
 * therefore makes the artifact differ per build machine (`D:\...` vs
 * `/home/runner/...`), which the CI lib/src drift gate reads as a real
 * change — the gate can only work if the same source produces the same bytes
 * everywhere.
 * @param abs - absolute path to a source file.
 * @returns the path relative to the package root, with forward slashes.
 */
function repoRelative(abs: string): string {
  return relative(ROOT, abs).split(sep).join('/')
}

/** Browser platform modules resolved from the loader module table. */
const PLATFORM_MODULES = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-attachment',
  '@deepseek-ai/dsh-client-schema-form',
]

/** Documented runtime store exemption (see the harness tsdown preset). */
const RUNTIME_STORE_EXEMPTION = '@deepseek-ai/dsh-client-runtime/client'

/** Externals resolved from the loader module table. */
const CLIENT_EXTERNALS: readonly string[] = [...PLATFORM_MODULES, RUNTIME_STORE_EXEMPTION]

/** CSS module virtual-id wrapper (kept out of tsdown's own css pipeline). */
const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

/**
 * Plain (non-module) stylesheets shipped by dependencies, keyed by specifier
 * and mapped to a FIXED virtual id.
 *
 * The client bundle is one JS file loaded by the host's module loader — a
 * stylesheet emitted beside it would never be fetched, so vendor CSS has to
 * ride the same inline-and-inject path the CSS modules use. The virtual id is
 * fixed rather than derived from the resolved path because that path contains
 * the pnpm store layout (`node_modules/.pnpm/@xterm+xterm@5.5.0/...`), which
 * would put a version-pinned machine-specific string into the artifact and
 * trip the CI lib/src drift gate on any dependency bump.
 */
const VENDOR_CSS: Readonly<Record<string, string>> = {
  '@xterm/xterm/css/xterm.css': 'vendor/xterm.css',
}

/** Attribution retained in the bundle: minification drops the source's own header. */
const VENDOR_CSS_NOTICE: Readonly<Record<string, string>> = {
  'vendor/xterm.css': '/*! xterm.js — Copyright (c) 2017 The xterm.js authors — MIT */\n',
}

/** Resolve a vendor stylesheet against this package's installed dependencies. */
const requireFromConfig = createRequire(import.meta.url)

/** Resolve an emitted lib/types asset import against its src/ counterpart. */
function sourceAssetPath(source: string, importer: string): string {
  const emitted = resolve(dirname(importer), source)
  const marker = sep + 'lib' + sep + 'types' + sep
  const boundary = emitted.indexOf(marker)
  if (boundary < 0) return emitted
  return resolve(emitted.slice(0, boundary), 'src', emitted.slice(boundary + marker.length))
}

/** Node-half library config: re-emit the tsc output into lib/. */
const libConfig: UserConfig = {
  name: ID,
  entry: ['lib/types/index.js', 'lib/types/invariant.js'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
}

/** Browser client bundle: the module-loader closure artifact at lib/client.js. */
const clientConfig: UserConfig = {
  name: ID + '/client',
  entry: { client: 'lib/types/client/index.js' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  // No sourcemap in the production bundle: nothing ships the map, nothing
  // rewrites paths, builds are byte-identical (same src → same client.js).
  sourcemap: false,
  clean: false,
  external: [...CLIENT_EXTERNALS],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
  },
  // Everything not in the loader module table inlines.
  noExternal: (id: string) => (CLIENT_EXTERNALS.includes(id) ? undefined : true),
  plugins: [
    {
      name: 'dsh-css-modules-inline',
      resolveId(source: string, importer: string | undefined) {
        const vendor = VENDOR_CSS[source]
        if (vendor !== undefined) return CSS_VIRTUAL_PREFIX + vendor + CSS_VIRTUAL_SUFFIX
        if (!source.endsWith('.module.css')) return null
        const abs = importer !== undefined ? sourceAssetPath(source, importer) : source
        return CSS_VIRTUAL_PREFIX + repoRelative(abs) + CSS_VIRTUAL_SUFFIX
      },
      async load(virtualId: string) {
        if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
        const relId = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
        const specifier = Object.keys(VENDOR_CSS).find(key => VENDOR_CSS[key] === relId)
        const fileId = specifier === undefined ? resolve(ROOT, relId) : requireFromConfig.resolve(specifier)
        this.addWatchFile(fileId)
        const source = await readFile(fileId)
        const { code, exports: cssExports } = transform({
          // The RELATIVE id, not the absolute path: lightningcss derives the
          // class-name hash from this, so an absolute path would rescope every
          // class per build machine.
          filename: relId,
          code: source,
          // Vendor stylesheets address the DOM their own library builds, so
          // their selectors must stay global.
          ...specifier === undefined ? { cssModules: { pattern: '[hash]_[local]' as const } } : {},
          minify: true,
        })
        const classMap: Record<string, string> = {}
        // Deterministic key order. lightningcss does not promise a stable
        // iteration order for its exports object, and an unstable order makes
        // the emitted bundle differ between builds of identical source, which
        // trips the CI lib/src drift gate. Fixed UTF-16 comparison on the
        // LOCAL class names — never localeCompare, whose result depends on the
        // system locale. Values are unchanged.
        const ordered = Object.entries(cssExports ?? {})
          .map(([local, exp]) => [local, exp.name] as const)
          .sort((left, right) => (left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : 0))
        for (const [local, name] of ordered) classMap[local] = name
        const tagId = ID + '/' + basename(fileId)
        const notice = VENDOR_CSS_NOTICE[relId] ?? ''
        return [
          `const css = ${JSON.stringify(notice + code.toString())};`,
          `const tagId = ${JSON.stringify(tagId)};`,
          'if (typeof document !== \'undefined\' && document.querySelector(\'style[data-plugin-css=\' + JSON.stringify(tagId) + \']\') === null) {',
          '  const tag = document.createElement(\'style\');',
          `  tag.dataset.plugin = ${JSON.stringify(ID)};`,
          '  tag.dataset.pluginCss = tagId;',
          '  tag.textContent = css;',
          '  document.head.appendChild(tag);',
          '}',
          `export default ${JSON.stringify(classMap)};`,
        ].join('\n')
      },
    },
  ],
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}

export default defineConfig([libConfig, clientConfig])
