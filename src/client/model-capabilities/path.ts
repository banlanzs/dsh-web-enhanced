/**
 * Minimal path ops for the Model Capabilities settings draft.
 *
 * The rc.6 kernel shipped these in `@deepseek-ai/dsh-client-schema-form`;
 * the 0.1.1 client contract moved schema handling behind the ui-settings
 * `ctx.settingsSchema` service and deleted the package. Feature plugins may
 * no longer runtime-import shared helpers from one another (packages/client
 * AGENTS.md), and the capability page only needs the four plain record-path
 * primitives — no schema introspection — so they live here as plugin-local
 * utilities with the same semantics the old package had.
 * @module dsh-web-enhanced/src/client/model-capabilities/path
 */

/**
 * Read a nested value by path.
 * @param value - root value (draft or fallback layer).
 * @param path - key path from the root; array indexes as strings.
 * @returns the value at the path, or `undefined` along a missing branch.
 */
export function getPath(value: unknown, path: readonly string[]): unknown {
  let current = value
  for (const key of path) {
    if (Array.isArray(current)) {
      current = current[Number(key)]
      continue
    }
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

/**
 * Whether a draft explicitly carries the path (its presence marks a user
 * override, independent of the value stored there).
 * @param value - root value (draft or fallback layer).
 * @param path - key path from the root; array indexes as strings.
 * @returns whether the path's final key exists on its parent.
 */
export function hasPath(value: unknown, path: readonly string[]): boolean {
  if (path.length === 0) return value !== undefined
  const parent = getPath(value, path.slice(0, -1))
  const key = path[path.length - 1]!
  if (Array.isArray(parent)) return Number(key) < parent.length
  if (typeof parent !== 'object' || parent === null) return false
  return key in (parent as Record<string, unknown>)
}

function cloneContainer(container: unknown, key: string): unknown {
  if (Array.isArray(container)) return [...container]
  if (typeof container === 'object' && container !== null) return { ...container }
  return /^\d+$/.test(key) ? [] : {}
}

/** Clone the container spine down to the leaf's parent, materializing missing intermediates. */
function cloneSpine(root: unknown, path: readonly string[]): {
  result: unknown
  parent: unknown
  leaf: string
} {
  const result = { ...(root as Record<string, unknown>) }
  let target: unknown = result
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!
    const nextKey = path[i + 1]!
    const record = target as Record<string, unknown>
    const child = cloneContainer(record[key], nextKey)
    if (Array.isArray(target)) (target as unknown[])[Number(key)] = child
    else record[key] = child
    target = child
  }
  return { result, parent: target, leaf: path[path.length - 1]! }
}

/**
 * Immutably set a nested value, materializing missing intermediate containers.
 * @param root - draft root (never mutated).
 * @param path - non-empty key path.
 * @param value - value to store at the path.
 * @returns the new draft root.
 */
export function setPath(root: Record<string, unknown>, path: readonly string[], value: unknown): Record<string, unknown> {
  if (path.length === 0) throw new Error('dsh-web-enhanced: setPath needs a non-empty path')
  const { result, parent, leaf } = cloneSpine(root, path)
  if (Array.isArray(parent)) (parent as unknown[])[Number(leaf)] = value
  else (parent as Record<string, unknown>)[leaf] = value
  return result as Record<string, unknown>
}

/**
 * Immutably remove a nested key. Removing along a missing branch returns the
 * root unchanged.
 * @param root - draft root (never mutated).
 * @param path - non-empty key path.
 * @returns the new draft root.
 */
export function deletePath(root: Record<string, unknown>, path: readonly string[]): Record<string, unknown> {
  if (path.length === 0) throw new Error('dsh-web-enhanced: deletePath needs a non-empty path')
  if (!hasPath(root, path)) return root
  const { result, parent, leaf } = cloneSpine(root, path)
  if (Array.isArray(parent)) (parent as unknown[]).splice(Number(leaf), 1)
  else Reflect.deleteProperty(parent as Record<string, unknown>, leaf)
  return result as Record<string, unknown>
}
