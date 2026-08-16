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
    readonly messageId: string;
    /** Curated context text (the turn's user message, truncated). */
    readonly text: string;
    /** When the pin was made, epoch ms. */
    readonly ts: number;
    /** The turn number (the chat row's `data-turn-tail`), when known. */
    readonly turn?: number;
}
/** localStorage-like persistence seam (injectable for tests). */
export interface PinStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}
/** Create one pin store bound to a storage seam. */
export declare function createPinStore(storage: PinStorage): {
    load: (sessionId: string) => PinItem[];
    /**
     * Whether one message is pinned.
     * @param sessionId - the owning session.
     * @param messageId - the assistant message id.
     */
    isPinned(sessionId: string, messageId: string): boolean;
    /**
     * Stored context text of one pin.
     * @param sessionId - the owning session.
     * @param messageId - the assistant message id.
     */
    textOf(sessionId: string, messageId: string): string | undefined;
    /**
     * Pinned turn numbers of one session (rows carry `data-turn-tail`).
     * @param sessionId - the owning session.
     */
    turnsOf(sessionId: string): Set<number>;
    /**
     * Stored context text of one pinned turn.
     * @param sessionId - the owning session.
     * @param turn - the turn number.
     */
    textOfTurn(sessionId: string, turn: number): string | undefined;
    /**
     * Pin or unpin one message.
     * @param sessionId - the owning session.
     * @param messageId - the assistant message id.
     * @param text - curated context text.
     * @param turn - the turn number, when known.
     * @returns true when the message is pinned after the call.
     */
    toggle(sessionId: string, messageId: string, text: string, turn?: number): boolean;
};
/** The live store over the browser's localStorage. */
export declare const pinStore: {
    load: (sessionId: string) => PinItem[];
    /**
     * Whether one message is pinned.
     * @param sessionId - the owning session.
     * @param messageId - the assistant message id.
     */
    isPinned(sessionId: string, messageId: string): boolean;
    /**
     * Stored context text of one pin.
     * @param sessionId - the owning session.
     * @param messageId - the assistant message id.
     */
    textOf(sessionId: string, messageId: string): string | undefined;
    /**
     * Pinned turn numbers of one session (rows carry `data-turn-tail`).
     * @param sessionId - the owning session.
     */
    turnsOf(sessionId: string): Set<number>;
    /**
     * Stored context text of one pinned turn.
     * @param sessionId - the owning session.
     * @param turn - the turn number.
     */
    textOfTurn(sessionId: string, turn: number): string | undefined;
    /**
     * Pin or unpin one message.
     * @param sessionId - the owning session.
     * @param messageId - the assistant message id.
     * @param text - curated context text.
     * @param turn - the turn number, when known.
     * @returns true when the message is pinned after the call.
     */
    toggle(sessionId: string, messageId: string, text: string, turn?: number): boolean;
};
