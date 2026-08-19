/**
 * The assembled plugin config: every domain fragment's defaults, and the
 * field order the schema presents them in.
 *
 * The three mirrored copies of every option (interface, zod schema, resolve
 * function) used to live in `src/gateway.ts`; each domain now owns its own
 * slice, and this suite is what holds their sum equivalent to the single-site
 * definition it replaced.
 */

import { describe, expect, it } from 'vitest'
import { Config, resolveConfig } from '../src/config.ts'

/** The zod object's field table, in declaration order. */
function fieldOrder(): string[] {
  return Object.keys((Config as unknown as { dict: Record<string, unknown> }).dict)
}

describe('config assembly', () => {
  it('applies every default through the schema', () => {
    const value = new Config({}) as Record<string, unknown>
    expect(value['cronIntervalMs']).toBe(30_000)
    expect(value['balanceBaseUrl']).toBe('https://api.deepseek.com')
    expect(value['skipDirs']).toEqual(['node_modules'])
    expect(value['gitWorkingMaxFiles']).toBe(300)
    expect(value['profileDir']).toBe('')
    expect(value['visionEnabled']).toBe(true)
    expect(value['visionLocalOllamaUrl']).toBe('http://localhost:11434/v1')
    expect(value['pricingProviderMap']).toEqual({ 'deepseek-official': 'deepseek' })
  })

  it('resolveConfig matches the schema defaults field for field', () => {
    const fromSchema = new Config({}) as Record<string, unknown>
    const fromResolve = resolveConfig({}) as unknown as Record<string, unknown>
    expect(Object.keys(fromResolve).sort()).toEqual(Object.keys(fromSchema).sort())
    for (const key of Object.keys(fromResolve)) {
      expect({ key, value: fromResolve[key] }).toEqual({ key, value: fromSchema[key] })
    }
  })

  it('honours user overrides', () => {
    const value = new Config({ gitMaxCount: 5, visionEnabled: false }) as Record<string, unknown>
    expect(value['gitMaxCount']).toBe(5)
    expect(value['visionEnabled']).toBe(false)
    expect(resolveConfig({ gitMaxCount: 5 }).gitMaxCount).toBe(5)
  })

  it('carries exactly the 46 fields the single-site schema declared', () => {
    // Guards the split against a fragment that silently drops or duplicates a
    // field: the set is the contract, the order below is the presentation.
    expect(new Set(fieldOrder()).size).toBe(46)
  })

  it('presents the fields grouped by owning domain', () => {
    // Pinned so a fragment reordering shows up as a test change rather than a
    // silently reshuffled settings form. Groups follow the module that owns
    // each slice: board, model, files, git, plugins, vision. The git trio is
    // the one place this differs from the pre-split order, where those three
    // sat between the files byte caps and the files search caps.
    expect(fieldOrder()).toEqual([
      'cronIntervalMs',
      'balanceApiKeyEnv', 'balanceCacheTtlMs', 'balanceBaseUrl', 'balanceProviders',
      'modelsDevUrl', 'modelsDevCacheTtlMs', 'modelsDevTimeoutMs', 'pricingProviderMap',
      'opencodeGoUsageUrl', 'opencodeGoCacheTtlMs', 'opencodeGoAuthFile',
      'skipDirs', 'readMaxBytes', 'writeMaxBytes', 'binaryMaxBytes',
      'searchMaxDepth', 'searchMaxEntries', 'officeMaxBytes', 'browseMaxEntries',
      'gitOutputMaxBytes', 'gitMaxCount', 'gitWorkingMaxFiles',
      'pluginOpTimeoutMs', 'profileDir',
      'visionEnabled', 'visionPatchAdmission', 'visionPrompt', 'visionMarker',
      'visionProvider', 'visionModel', 'visionHarnessModels', 'visionBaseUrl',
      'visionApiKey', 'visionApiKeyEnv', 'visionEndpointModel', 'visionEndpointModels',
      'visionAnonymous', 'visionTimeoutMs', 'visionMaxTokens', 'visionAutoLocalOllama',
      'visionLocalOllamaModel', 'visionLocalOllamaUrl', 'visionFallbackModels',
      'visionCacheLimit', 'visionCooldownMs',
    ])
  })
})
