/**
 * Result-branch helper for the fallible remote payloads.
 *
 * Every gateway method answers a discriminated union of one success shape and
 * `{ error }` — business failures are result fields, never thrown exceptions,
 * so the UI can render them in place. Components that only need "did this
 * fail, and why" go through here instead of re-narrowing each union.
 * @module dsh-web-enhanced/src/client/result
 */

/**
 * The failure message of a remote result, when it took the error branch.
 * @param result - any gateway result payload.
 * @returns the message, or undefined when the call succeeded.
 */
export function errorMessageOf(result: unknown): string | undefined {
  if (typeof result !== 'object' || result === null || !('error' in result)) return undefined
  const error = (result as { error: unknown }).error
  if (typeof error !== 'object' || error === null || !('message' in error)) return undefined
  const message = (error as { message: unknown }).message
  return typeof message === 'string' ? message : undefined
}
