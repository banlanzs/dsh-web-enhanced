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
/** Create one pin store bound to a storage seam. */
export function createPinStore(storage) {
    const key = (sessionId) => `dsh.web-enhanced.navbar.pins:${sessionId}`;
    /** Parse a session's stored list; corruption reads as empty. */
    const load = (sessionId) => {
        try {
            const raw = storage.getItem(key(sessionId));
            if (raw === null)
                return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed))
                return [];
            return parsed.filter((item) => {
                if (typeof item !== 'object' || item === null)
                    return false;
                const record = item;
                return typeof record['messageId'] === 'string'
                    && typeof record['text'] === 'string'
                    && typeof record['ts'] === 'number'
                    && (record['turn'] === undefined || typeof record['turn'] === 'number');
            });
        }
        catch {
            return [];
        }
    };
    const write = (sessionId, pins) => {
        storage.setItem(key(sessionId), JSON.stringify(pins));
    };
    return {
        load,
        /**
         * Whether one message is pinned.
         * @param sessionId - the owning session.
         * @param messageId - the assistant message id.
         */
        isPinned(sessionId, messageId) {
            return load(sessionId).some(item => item.messageId === messageId);
        },
        /**
         * Stored context text of one pin.
         * @param sessionId - the owning session.
         * @param messageId - the assistant message id.
         */
        textOf(sessionId, messageId) {
            return load(sessionId).find(item => item.messageId === messageId)?.text;
        },
        /**
         * Pinned turn numbers of one session (rows carry `data-turn-tail`).
         * @param sessionId - the owning session.
         */
        turnsOf(sessionId) {
            const turns = new Set();
            for (const pin of load(sessionId)) {
                if (pin.turn !== undefined && Number.isFinite(pin.turn))
                    turns.add(pin.turn);
            }
            return turns;
        },
        /**
         * Stored context text of one pinned turn.
         * @param sessionId - the owning session.
         * @param turn - the turn number.
         */
        textOfTurn(sessionId, turn) {
            return load(sessionId).find(item => item.turn === turn)?.text;
        },
        /**
         * Pin or unpin one message.
         * @param sessionId - the owning session.
         * @param messageId - the assistant message id.
         * @param text - curated context text.
         * @param turn - the turn number, when known.
         * @returns true when the message is pinned after the call.
         */
        toggle(sessionId, messageId, text, turn) {
            const pins = [...load(sessionId)];
            const index = pins.findIndex(item => item.messageId === messageId);
            if (index >= 0) {
                pins.splice(index, 1);
                write(sessionId, pins);
                return false;
            }
            pins.push({ messageId, text, ts: Date.now(), ...turn !== undefined ? { turn } : {} });
            write(sessionId, pins);
            return true;
        },
    };
}
/** The live store over the browser's localStorage. */
export const pinStore = typeof localStorage === 'undefined'
    ? createPinStore({ getItem: () => null, setItem: () => { } })
    : createPinStore(localStorage);
