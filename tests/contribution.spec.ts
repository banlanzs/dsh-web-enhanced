/**
 * Guards the hand-declared remote contribution against the rc.6 client
 * gateway contract: every result and parameter codec must be strict, and
 * every result schema must accept the payload shapes declared in
 * `../src/types.ts` (success and error branches).
 * @module dsh-web-enhanced/tests/contribution
 */

import { describe, expect, it } from 'vitest'
import { webEnhancedRemote } from '../src/client/remote.ts'

/** The rc.6 gateway check: mode must be strict, schema must parse. */
function requireStrictCodec(codec: { mode: string; schema?: { parse(value: unknown): unknown } }, endpoint: string, field: string): void {
  if (codec.mode !== 'strict') throw new Error(`generated Remote ${endpoint} field ${JSON.stringify(field)} has no strict codec`)
  if (typeof codec.schema?.parse !== 'function') throw new Error(`generated Remote ${endpoint} field ${JSON.stringify(field)} has no parseable schema`)
}

const errorPayload = { error: { code: 'E_TEST', message: 'boom' } }
const task = {
  id: 'task_1', title: 't', prompt: 'p', status: 'todo', cron: null, nextRunAt: null,
  workspaceId: null, sessionId: null, result: null, createdAt: 1, updatedAt: 2, lastRunAt: null,
}
const commit = { hash: 'a', parents: [], refs: ['main'], author: 'x', date: 1, subject: 's' }
const entry = { name: 'a', path: 'a', kind: 'file', size: 3 }

/**
 * Methods invoked with no argument at all. Everything else takes exactly one
 * request object — see the arity guard below.
 */
const nullaryMethods = new Set(['taskList', 'balanceGet'])

/** One representative payload per method, both the success and the error branch. */
const payloads: Record<string, unknown[]> = {
  taskList: [{ tasks: [task] }, errorPayload],
  taskCreate: [{ task }, errorPayload],
  taskUpdate: [{ task }, errorPayload],
  taskRemove: [{ removed: true }, errorPayload],
  taskRun: [{ started: true, sessionId: null }, errorPayload],
  balanceGet: [{ isAvailable: true, infos: [{ currency: 'CNY', totalBalance: 1, grantedBalance: 2, toppedUpBalance: 3 }], cachedAt: 4 }],
  gitBranches: [{ branches: [{ name: 'main', current: true }] }, errorPayload],
  gitLog: [{ commits: [commit] }, errorPayload],
  gitCheckout: [{ ok: true, message: 'm' }, errorPayload],
  gitStatus: [{ entries: [{ path: 'a', staged: 'M', unstaged: '' }] }, { entries: [{ path: 'new', origPath: 'old', staged: 'R', unstaged: ' ' }] }, errorPayload],
  gitDiff: [{ text: 'diff' }, errorPayload],
  gitStage: [{ ok: true }, errorPayload],
  gitUnstage: [{ ok: true }, errorPayload],
  gitDiscard: [{ ok: true }, errorPayload],
  fsList: [{ entries: [entry] }, errorPayload],
  fsSearch: [{ entries: [entry] }, errorPayload],
  fsRead: [{ kind: 'text', content: 'c', truncated: false, size: 1 }, { kind: 'binary', content: 'b', truncated: true, size: 2 }, errorPayload],
  fsWrite: [{ ok: true }, errorPayload],
  fsDelete: [{ ok: true }, errorPayload],
  fsOfficePreview: [{
    kind: 'docx',
    blocks: [{ type: 'p', text: 'x' }, { type: 'table', rows: [['a']] }],
    truncated: false,
  }, errorPayload],
}

describe('webEnhancedRemote contribution', () => {
  it('every descriptor uses strict codecs with parseable schemas', () => {
    expect(webEnhancedRemote.package).toBe('dsh-web-enhanced')
    for (const descriptor of webEnhancedRemote.descriptors) {
      const endpoint = `${descriptor.namespace}/${descriptor.method}`
      requireStrictCodec(descriptor.result, endpoint, 'result')
      for (const parameter of descriptor.parameters) requireStrictCodec(parameter.codec, endpoint, parameter.wire)
      expect(descriptor.invocation).toEqual({ kind: 'direct' })
      expect(descriptor.service).toBe('webEnhanced')
      expect(descriptor.namespace).toBe('webEnhanced')
      expect(descriptor.method).toBe(descriptor.method)
      expect(descriptor.parameters.every(p => p.source === 'json' && p.wire === p.name)).toBe(true)
    }
  })

  it('declares one request parameter per method, matching the positional gateway contract', () => {
    // The Typert gateway builds the host call as Reflect.apply(method, receiver,
    // descriptor.parameters.map(...)) and the client half refuses a call whose
    // argument count differs from descriptor.parameters.length. A descriptor
    // that splits a request object into per-field parameters therefore compiles
    // but fails at runtime on both sides — this guard is what catches that.
    for (const descriptor of webEnhancedRemote.descriptors) {
      const expected = nullaryMethods.has(descriptor.method) ? 0 : 1
      expect(descriptor.parameters, `${descriptor.method} arity`).toHaveLength(expected)
      if (expected === 1) expect(descriptor.parameters[0]!.wire).toBe('request')
    }
  })

  it('exposes exactly the 20 gateway methods, each with a representative payload', () => {
    const methods = webEnhancedRemote.descriptors.map(d => d.method).sort()
    expect(methods).toEqual(Object.keys(payloads).sort())
    expect(methods).toHaveLength(20)
  })

  it('every result schema accepts its success and error payloads', () => {
    for (const descriptor of webEnhancedRemote.descriptors) {
      const schema = descriptor.result.schema
      const samples = payloads[descriptor.method]
      expect(samples.length).toBeGreaterThan(0)
      for (const sample of samples) expect(() => schema.parse(sample), `${descriptor.method} rejected sample`).not.toThrow()
    }
  })

  it('parameter schemas accept undefined and plain JSON values', () => {
    for (const descriptor of webEnhancedRemote.descriptors) {
      for (const parameter of descriptor.parameters) {
        expect(() => parameter.codec.schema.parse(undefined), `${descriptor.method}.${parameter.wire} rejected undefined`).not.toThrow()
        expect(() => parameter.codec.schema.parse('x'), `${descriptor.method}.${parameter.wire} rejected string`).not.toThrow()
        expect(() => parameter.codec.schema.parse(42), `${descriptor.method}.${parameter.wire} rejected number`).not.toThrow()
      }
    }
  })
})
