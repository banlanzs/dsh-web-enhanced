/**
 * uSES bridge: turns a bare observable snapshot source into a typed selector
 * hook. The rc.6 kernel shipped this as `bindSnapshotSelector` from
 * `@deepseek-ai/dsh-client-web-react`; the 0.1.1 client contract merged the
 * package into ui-renderer and stopped exporting the binding (the renderer
 * keeps it for its own bindings only), so the plugin carries the twelve-line
 * bridge locally. Semantics are the upstream implementation verbatim:
 * subscribe/getSnapshot are captured once per source into stable closures so
 * components never resubscribe across renders, and equality defaults to
 * Object.is.
 * @module dsh-web-enhanced/src/client/selector
 */

import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector.js'
import type { HostObservable, SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'

/**
 * Bind a bare observable source to a typed uSES selector hook.
 * @param w - snapshot source (store instance, session object).
 * @returns the selector hook.
 */
export function bindSnapshotSelector<T>(w: HostObservable<T>): SnapshotSelectorHook<T> {
  const subscribe = (fn: () => void) => w.subscribe(fn)
  const getSnapshot = () => w.getSnapshot()
  return function useSelector<S>(sel: (s: T) => S, eq?: (a: S, b: S) => boolean): S {
    return useSyncExternalStoreWithSelector(subscribe, getSnapshot, undefined, sel, eq)
  }
}
