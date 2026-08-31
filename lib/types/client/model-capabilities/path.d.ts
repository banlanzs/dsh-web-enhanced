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
export declare function getPath(value: unknown, path: readonly string[]): unknown;
/**
 * Whether a draft explicitly carries the path (its presence marks a user
 * override, independent of the value stored there).
 * @param value - root value (draft or fallback layer).
 * @param path - key path from the root; array indexes as strings.
 * @returns whether the path's final key exists on its parent.
 */
export declare function hasPath(value: unknown, path: readonly string[]): boolean;
/**
 * Immutably set a nested value, materializing missing intermediate containers.
 * @param root - draft root (never mutated).
 * @param path - non-empty key path.
 * @param value - value to store at the path.
 * @returns the new draft root.
 */
export declare function setPath(root: Record<string, unknown>, path: readonly string[], value: unknown): Record<string, unknown>;
/**
 * Immutably remove a nested key. Removing along a missing branch returns the
 * root unchanged.
 * @param root - draft root (never mutated).
 * @param path - non-empty key path.
 * @returns the new draft root.
 */
export declare function deletePath(root: Record<string, unknown>, path: readonly string[]): Record<string, unknown>;
