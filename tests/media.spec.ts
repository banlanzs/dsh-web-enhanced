/**
 * Media registry behavior: stable URLs per key, LRU eviction with revoke,
 * content-derived keys, and the shared single-flight workspace image read.
 * @module dsh-web-enhanced/tests/media
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  binaryObjectUrl, contentKey, releaseAllObjectUrls, releaseObjectUrl, workspaceImageUrl,
} from '../src/client/media.ts'

/** Browser-like URL double counting create/revoke. */
function stubObjectUrls(): { created: number; revoked: string[] } {
  const state = { created: 0, revoked: [] as string[] }
  let serial = 0
  vi.stubGlobal('URL', {
    createObjectUrl: undefined,
    createObjectURL: vi.fn(() => {
      state.created += 1
      return `blob:${serial += 1}`
    }),
    revokeObjectURL: vi.fn((url: string) => { state.revoked.push(url) }),
  })
  return state
}

afterEach(() => {
  releaseAllObjectUrls()
  vi.unstubAllGlobals()
})

describe('binary object URL registry', () => {
  it('serves one stable URL per key and re-decodes nothing', () => {
    const urls = stubObjectUrls()
    const first = binaryObjectUrl('k', 'QUJD', 'image/png')
    const second = binaryObjectUrl('k', 'QUJD', 'image/png')
    expect(second).toBe(first)
    expect(urls.created).toBe(1)
  })

  it('revokes the least-recently-used entry beyond capacity', () => {
    const urls = stubObjectUrls()
    for (let i = 0; i < 16; i++) binaryObjectUrl(`k${i}`, 'QUJD', 'image/png')
    expect(urls.created).toBe(16)
    // Touch k0 so k1 becomes the oldest, then overflow.
    binaryObjectUrl('k0', 'QUJD', 'image/png')
    const seventeenth = binaryObjectUrl('k16', 'QUFD', 'image/png')
    expect(urls.created).toBe(17)
    expect(urls.revoked).toEqual(['blob:2'])
    expect(seventeenth).toBe('blob:17')
  })

  it('release drops exactly its key; releaseAll clears everything', () => {
    const urls = stubObjectUrls()
    const a = binaryObjectUrl('a', 'QUJD', 'image/png')
    binaryObjectUrl('b', 'QUJD', 'image/png')
    releaseObjectUrl('a')
    expect(urls.revoked).toEqual([a])
    releaseAllObjectUrls()
    expect(urls.revoked).toHaveLength(2)
    // A fresh acquire after release makes a NEW url.
    expect(binaryObjectUrl('a', 'QUJD', 'image/png')).not.toBe(a)
  })

  it('falls back to a data URL where object URLs do not exist', () => {
    vi.stubGlobal('URL', { revokeObjectURL: vi.fn() })
    expect(binaryObjectUrl('k', 'QUJD', 'image/png')).toBe('data:image/png;base64,QUJD')
    // The fallback never registers, so release stays a no-op.
    expect(() => releaseObjectUrl('k')).not.toThrow()
  })

  it('keys derive from content: equal payloads collide, different do not', () => {
    expect(contentKey('preview', 'AAA')).toBe(contentKey('preview', 'AAA'))
    expect(contentKey('preview', 'AAA')).not.toBe(contentKey('preview', 'AAB'))
    expect(contentKey('a', 'AAA')).not.toBe(contentKey('b', 'AAA'))
  })
})

describe('workspace image single-flight', () => {
  const mime = (path: string): string => `image/${path.split('.').pop()}`

  it('concurrent mounts share one read and one URL', async () => {
    const urls = stubObjectUrls()
    let reads = 0
    const remote = {
      fsRead: async () => {
        reads += 1
        await Promise.resolve()
        return { kind: 'binary' as const, content: 'QUJD' }
      },
    }
    const [a, b] = await Promise.all([
      workspaceImageUrl(remote, 'w', 'i.png', mime),
      workspaceImageUrl(remote, 'w', 'i.png', mime),
    ])
    expect(reads).toBe(1)
    expect(b).toBe(a)
    expect(urls.created).toBe(1)
  })

  it('a settled load re-fetches on the next mount (failures never stick)', async () => {
    stubObjectUrls()
    let reads = 0
    let fail = true
    const remote = {
      fsRead: async () => {
        reads += 1
        return fail ? { error: { message: 'nope' } } : { kind: 'binary' as const, content: 'QUJD' }
      },
    }
    await expect(workspaceImageUrl(remote, 'w', 'i.png', mime)).rejects.toMatchObject({ message: 'nope' })
    fail = false
    await expect(workspaceImageUrl(remote, 'w', 'i.png', mime)).resolves.toMatch(/^blob:/u)
    expect(reads).toBe(2)
  })

  it('SVG text renders as a charset data URL without an object URL', async () => {
    const urls = stubObjectUrls()
    const remote = { fsRead: async () => ({ kind: 'text' as const, content: '<svg/>' }) }
    await expect(workspaceImageUrl(remote, 'w', 'd.svg', () => 'image/svg+xml'))
      .resolves.toBe(`data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg/>')}`)
    expect(urls.created).toBe(0)
  })
})
