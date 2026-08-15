/**
 * Breadcrumb split of the mention browser: an absolute path becomes a list of
 * navigable ancestors on both path grammars.
 * @vitest-environment jsdom
 * @module dsh-web-enhanced/tests/crumbs
 */

import { describe, expect, it } from 'vitest'
import { crumbsOf } from '../src/client/browse/BrowseOverlay.tsx'

describe('crumbsOf', () => {
  it('splits a POSIX path, rooting at /', () => {
    expect(crumbsOf('/home/u/src')).toEqual([
      { name: '/', path: '/' },
      { name: 'home', path: '/home' },
      { name: 'u', path: '/home/u' },
      { name: 'src', path: '/home/u/src' },
    ])
  })

  it('splits a Windows path, and the drive crumb keeps its root separator', () => {
    // `C:` alone names the CURRENT directory on that drive, not its root, so
    // the crumb would navigate somewhere else entirely.
    expect(crumbsOf('C:\\Users\\me\\docs')).toEqual([
      { name: 'C:', path: 'C:\\' },
      { name: 'Users', path: 'C:\\Users' },
      { name: 'me', path: 'C:\\Users\\me' },
      { name: 'docs', path: 'C:\\Users\\me\\docs' },
    ])
  })

  it('yields a single crumb at a root', () => {
    expect(crumbsOf('/')).toEqual([{ name: '/', path: '/' }])
  })
})
