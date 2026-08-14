/**
 * In-memory StorageBackend test double for the web-enhanced gateway tests:
 * a shared media pool survives across backends (restart simulation), and
 * failNextWrites injects durability failures.
 */
import { StorageError } from '@deepseek-ai/dsh-storage'
import type { KvFacet, KvUnit, KvUnitDescriptor, StorageBackend } from '@deepseek-ai/dsh-storage'

/** One unit's medium: tables of records plus the global slot. */
export interface MemoryMedium {
  tables: Map<string, Map<string, unknown>>
  global: unknown
}

/** Shared media pool; survives across backend instances. */
export class MemoryMediaPool {
  readonly media = new Map<string, MemoryMedium>()
  readonly versions = new Map<string, number>()
  failNextWrites = 0

  consumeInjectedFailure(): void {
    if (this.failNextWrites > 0) {
      this.failNextWrites -= 1
      throw new Error('injected write failure')
    }
  }
}

class MemoryKvUnit implements KvUnit {
  private closed = false

  constructor(
    private readonly pool: MemoryMediaPool,
    private readonly medium: MemoryMedium,
    private readonly descriptor: KvUnitDescriptor,
    private readonly onClose: () => void,
  ) {}

  private assertOpen(): void {
    if (this.closed) throw new StorageError('closed', `memory unit '${this.descriptor.name}' is closed`)
  }

  async loadAll(): Promise<{ tables: Record<string, Record<string, unknown>>; global: unknown }> {
    this.assertOpen()
    const tables: Record<string, Record<string, unknown>> = {}
    for (const table of this.descriptor.tables) {
      tables[table] = Object.fromEntries(this.medium.tables.get(table) ?? [])
    }
    return { tables, global: this.medium.global }
  }

  async putRecord(table: string, key: string, value: unknown): Promise<void> {
    this.assertOpen()
    this.pool.consumeInjectedFailure()
    let records = this.medium.tables.get(table)
    if (records === undefined) {
      records = new Map()
      this.medium.tables.set(table, records)
    }
    records.set(key, value)
  }

  async deleteRecord(table: string, key: string): Promise<void> {
    this.assertOpen()
    this.pool.consumeInjectedFailure()
    this.medium.tables.get(table)?.delete(key)
  }

  async setGlobal(value: unknown): Promise<void> {
    this.assertOpen()
    this.pool.consumeInjectedFailure()
    this.medium.global = value
  }

  async close(): Promise<void> {
    this.closed = true
    this.onClose()
  }
}

/** In-memory backend over one pooled medium. */
export class MemoryStorageBackend implements StorageBackend {
  constructor(private readonly pool: MemoryMediaPool) {}

  /** The kv facet is the only facet this double implements. */
  readonly kv: KvFacet = {
    open: (descriptor) => this.open(descriptor),
  }

  /** The memory medium needs no teardown. */
  async close(): Promise<void> {}

  private async open(descriptor: KvUnitDescriptor): Promise<KvUnit> {
    const expected = this.pool.versions.get(descriptor.name) ?? descriptor.version
    if (expected !== descriptor.version) {
      throw new StorageError('version-mismatch', `memory unit '${descriptor.name}' version ${descriptor.version} vs medium ${expected}`)
    }
    this.pool.versions.set(descriptor.name, descriptor.version)
    let medium = this.pool.media.get(descriptor.name)
    if (medium === undefined) {
      medium = { tables: new Map(), global: null }
      this.pool.media.set(descriptor.name, medium)
    }
    return new MemoryKvUnit(this.pool, medium, descriptor, () => {})
  }
}
