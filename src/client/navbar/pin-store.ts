/**
 * Pin store: per-session curated turns behind the navbar's gold pills.
 *
 * Persistence is localStorage keyed per session id (a client-only reading
 * aid, like the selected-session key). The DOM attributes the navbar reads
 * (`data-we-nav-pinned` / `data-we-nav-pin-text` on the chat row) are a
 * projection this store owns; storage is injectable so node tests run it
 * against a Map.
 * @module dsh-web-enhanced/src/client/navbar/pin-store
 */

/** One curated turn: the pinned assistant message and its context text. */
export interface PinItem {
  /** The assistant message's host id (pin identity). */
  readonly messageId: string
  /** Curated context text (the turn's user message, truncated). */
  readonly text: string
  /** When the pin was made, epoch ms. */
  readonly ts: number
  /** The turn number (the chat row's `data-turn-tail`), when known. */
  readonly turn?: number
}

/** localStorage-like persistence seam (injectable for tests). */
export interface PinStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** Create one pin store bound to a storage seam. */
export function createPinStore(storage: PinStorage) {
  const key = (sessionId: string): string => `dsh.web-enhanced.navbar.pins:${sessionId}`
  /** Parse a session's stored list; corruption reads as empty. */
  const load = (sessionId: string): PinItem[] => {
    try {
      const raw = storage.getItem(key(sessionId))
      if (raw === null) return []
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed.filter((item): item is PinItem => {
        if (typeof item !== 'object' || item === null) return false
        const record = item as Record<string, unknown>
        return typeof record['messageId'] === 'string'
          && typeof record['text'] === 'string'
          && typeof record['ts'] === 'number'
          && (record['turn'] === undefined || typeof record['turn'] === 'number')
      })
    } catch {
      return []
    }
  }
  const write = (sessionId: string, pins: readonly PinItem[]): void => {
    storage.setItem(key(sessionId), JSON.stringify(pins))
  }
  return {
    load,
    /**
     * Whether one message is pinned.
     * @param sessionId - the owning session.
     * @param messageId - the assistant message id.
     */
    isPinned(sessionId: string, messageId: string): boolean {
      return load(sessionId).some(item => item.messageId === messageId)
    },
    /**
     * Stored context text of one pin.
     * @param sessionId - the owning session.
     * @param messageId - the assistant message id.
     */
    textOf(sessionId: string, messageId: string): string | undefined {
      return load(sessionId).find(item => item.messageId === messageId)?.text
    },
    /**
     * Pinned turn numbers of one session (rows carry `data-turn-tail`).
     * @param sessionId - the owning session.
     */
    turnsOf(sessionId: string): Set<number> {
      const turns = new Set<number>()
      for (const pin of load(sessionId)) {
        if (pin.turn !== undefined && Number.isFinite(pin.turn)) turns.add(pin.turn)
      }
      return turns
    },
    /**
     * Stored context text of one pinned turn.
     * @param sessionId - the owning session.
     * @param turn - the turn number.
     */
    textOfTurn(sessionId: string, turn: number): string | undefined {
      return load(sessionId).find(item => item.turn === turn)?.text
    },
    /**
     * Pin or unpin one message.
     * @param sessionId - the owning session.
     * @param messageId - the assistant message id.
     * @param text - curated context text.
     * @param turn - the turn number, when known.
     * @returns true when the message is pinned after the call.
     */
    toggle(sessionId: string, messageId: string, text: string, turn?: number): boolean {
      const pins = [...load(sessionId)]
      const index = pins.findIndex(item => item.messageId === messageId)
      if (index >= 0) {
        pins.splice(index, 1)
        write(sessionId, pins)
        return false
      }
      pins.push({ messageId, text, ts: Date.now(), ...turn !== undefined ? { turn } : {} })
      write(sessionId, pins)
      return true
    },
  }
}

/** The live store over the browser's localStorage. */
export const pinStore = typeof localStorage === 'undefined'
  ? createPinStore({ getItem: () => null, setItem: () => {} })
  : createPinStore(localStorage)
