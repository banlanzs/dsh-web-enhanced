/**
 * Composer model picker: a plugin-owned shadow of the host
 * `conversation.input.model` seat.
 *
 * The host ui-model-selection component is a small in-place menu with every
 * provider expanded at once. This registration wins the single slot at a lower
 * priority and renders a wider portaled menu instead: one row per provider
 * (collapsed by default) whose submenu lists that provider's models, plus the
 * current model's reasoning-effort choices. Data and writes still ride the
 * host's shared per-session ModelDirectory, so the /model command and this
 * seat stay one fact source.
 * @module dsh-web-enhanced/src/client/model-picker/ModelPicker
 */
import type { Translate } from '../locale-keys.ts';
/** Wire selection shape (structural; the host package owns the real type). */
interface PickerSelection {
    readonly provider: string;
    readonly model: string;
    readonly reasoningEffort?: string;
}
/** One reasoning-effort level advertised for the current model. */
interface EffortInfo {
    readonly id: string;
    readonly name: string;
    readonly description?: string;
}
/** One advisory model row inside a provider group. */
interface ModelInfo {
    readonly id: string;
    readonly name: string;
    readonly description?: string;
    readonly reasoning?: {
        readonly defaultEffort?: string;
        readonly efforts: readonly EffortInfo[];
    };
}
/** One provider group and its advisory models. */
interface ProviderGroup {
    readonly id: string;
    readonly name: string;
    readonly models: readonly ModelInfo[];
}
/** The shared per-session directory snapshot. */
interface DirectoryState {
    readonly current: PickerSelection | null;
    readonly groups: readonly ProviderGroup[];
    readonly failures: readonly {
        readonly id: string;
        readonly name: string;
        readonly message: string;
    }[];
    readonly status: 'idle' | 'loading' | 'ready' | 'selecting' | 'error';
    readonly error: string | null;
}
/** The shared directory controller face the host service resolves. */
interface DirectoryFace {
    readonly store: {
        getSnapshot(): DirectoryState;
        subscribe(listener: () => void): () => void;
    };
    load(): Promise<unknown>;
    select(selection: PickerSelection): Promise<unknown>;
}
/** Injected face this slot registration builds per session. */
export interface ModelPickerInjected {
    readonly available: boolean;
    readonly directory: DirectoryFace['store'] | null;
    readonly load: () => void;
    readonly select: (selection: PickerSelection) => Promise<boolean>;
}
/** Component props: owner share (`locked`) + injected face + locale seat. */
export type ModelPickerProps = ModelPickerInjected & {
    readonly locked: boolean;
    readonly t: Translate;
};
/**
 * The composer model seat replacement.
 * @param props - locked, shared directory store, load/select verbs, locale.
 */
export declare function ModelPicker({ locked, available, directory, load, select, t }: ModelPickerProps): import("react").JSX.Element | null;
export {};
