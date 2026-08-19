import type { ApiError } from './types.ts'

/**
 * Normalize a thrown value into the wire's error shape.
 *
 * Business failures cross the Typert wire as result fields, never thrown
 * exceptions; this is the shared conversion every domain service uses.
 * @param error - the thrown value.
 * @param fallback - code used when the error carries no ENOENT marker.
 * @returns the wire error.
 */
export function errorOf(error: unknown, fallback: string): ApiError {
  const message = error instanceof Error ? error.message : String(error)
  const code = error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT'
    ? 'not-found'
    : fallback
  return { code, message }
}
