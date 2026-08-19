/**
 * Draft model for the Model Capabilities settings page.
 *
 * Every card edits one user-settings subtree with the same minimal path-op
 * discipline as the host Models page: the draft is cloned from the redacted
 * `user` layer, unknown keys survive an apply untouched, and only changed
 * top-level keys become `settings.mutate` ops. That way the page can name the
 * fields it owns (`input`, `reasoningEfforts`, route-level defaults) without
 * ever rebuilding a subtree from a partial descriptor.
 * @module dsh-web-enhanced/src/client/model-capabilities/settings-draft
 */
import type { IApiClient, SettingsNamespaceView, SettingsPathOpView } from '@deepseek-ai/dsh-api-remotes/client';
/** Namespace owning the DeepSeek route-level thinking fields. */
export declare const DEEPSEEK_NS = "llm-deepseek";
/** Namespace owning pi-ai provider profiles and per-model capabilities. */
export declare const PI_AI_NS = "llm-pi-ai";
/** Every request modality a pi-ai model may declare. */
export declare const MODALITIES: readonly ["text", "image"];
/** Every pi-ai thinking level, in canonical escalation order. */
export declare const THINKING_LEVELS: readonly ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
/** A plain settings subtree as a string-keyed record. */
export type JsonRecord = Record<string, unknown>;
/** Whether a value is a plain data object (not an array or null). */
export declare function isRecord(value: unknown): value is JsonRecord;
/** Read a value as a record, defaulting every non-record to `{}`. */
export declare function recordOf(value: unknown): JsonRecord;
/** Deep-clone a value as a record, defaulting every non-record to `{}`. */
export declare function cloneRecord(value: unknown): JsonRecord;
/**
 * A user-section subtree as a plain draft object (absent → empty).
 * @param namespace - the namespace whose redacted user layer is read.
 * @param path - path from the section root to the edited subtree.
 */
export declare function draftAt(namespace: SettingsNamespaceView, path: readonly string[]): JsonRecord;
/**
 * The minimal path ops carrying `after` over `before`. Only keys observed in
 * the draft are named, so redacted secret fields and fields outside the card
 * survive an apply unchanged.
 * @param base - path of the edited subtree inside the user section.
 * @param before - the subtree as loaded, or undefined when it is new.
 * @param after - the subtree as edited.
 * @returns ordered set/unset ops; empty when nothing changed.
 */
export declare function pathOps(base: readonly string[], before: unknown, after: JsonRecord): SettingsPathOpView[];
/** Human text for a rejected wire call. */
export declare function messageOf(error: unknown): string;
/** One apply result: the committed subtree and revision, or a failure text. */
export type DraftApplyResult = {
    ok: true;
    committed: unknown;
    revision: number;
} | {
    ok: false;
    failure: string;
    conflicted: boolean;
};
/** Facts a settings draft apply needs. */
export interface ApplyDraftArgs {
    /** Wire face carrying `settings.mutate`. */
    api: Pick<IApiClient, 'settings'>;
    /** Owning settings namespace. */
    ns: string;
    /** Path of the edited subtree inside the user section. */
    path: readonly string[];
    /** Subtree as loaded; `undefined` when it is new. */
    before: unknown;
    /** Subtree as edited. */
    after: JsonRecord;
    /** Revision the draft was read at. */
    expectedRevision: number;
    /** Localized conflict message. */
    conflictText: string;
}
/**
 * Apply one card's draft through path-addressed settings ops.
 * @param args - namespace, subtree, before/after values, and revision facts.
 * @returns the new committed subtree/revision, or the failure to show.
 */
export declare function applyDraft(args: ApplyDraftArgs): Promise<DraftApplyResult>;
/** Validation failures of one pi-ai provider profile draft. */
export type PiAiDraftFailure = 'defaultInputEmpty' | 'modelInputInvalid' | 'modelOverrideEmptyId' | 'reasoningNeedLevel' | 'reasoningWireRequired';
/**
 * Drop empty `modelOverrides` entries and an emptied dict before saving.
 * An override whose every capability field was removed has nothing left to
 * say, so it returns to inheritance instead of lingering as `{}`.
 * @param draft - the provider profile draft.
 * @returns a normalized copy.
 */
export declare function normalizePiAiDraft(draft: JsonRecord): JsonRecord;
/**
 * Write one reasoning-efforts value onto every model in a provider draft —
 * every entry of a `models` list, or every `modelOverrides` entry — so a
 * route-level preset reaches all models in one action instead of per-model
 * editing. `undefined` removes the field (returning models to inheritance);
 * the caller's normalize step drops any override left empty by the removal.
 * @param draft - the provider profile draft.
 * @param reasoningEfforts - the value to set (`undefined` | `false` | dict).
 * @param listMode - whether the draft uses a `models` list (true) or
 *   `modelOverrides` (false).
 * @returns a new draft with every model's reasoning-efforts replaced.
 */
export declare function applyReasoningToAll(draft: JsonRecord, reasoningEfforts: unknown, listMode: boolean): JsonRecord;
/**
 * Whether a batch-apply reasoning-efforts preset is a value worth writing:
 * 'false' (non-reasoning) or a dict offering at least one non-off level with
 * a non-empty wire value. 'undefined' and an empty/off-only dict are not.
 * @param value - the preset the batch editor holds.
 * @returns whether the batch apply button may run with this preset.
 */
export declare function usableReasoningPreset(value: unknown): boolean;
/**
 * Validate one pi-ai provider profile draft before it is written.
 * @param draft - the provider profile draft.
 * @returns the first localized failure key, or undefined when it may apply.
 */
export declare function validatePiAiDraft(draft: JsonRecord): PiAiDraftFailure | undefined;
/** Validation failures of the llm-deepseek route-level draft. */
export type DeepSeekDraftFailure = 'thinkingInvalid' | 'reasoningEffortInvalid' | 'reasoningDisabledConflict';
/**
 * Validate the DeepSeek route-level thinking fields. The adapter rejects
 * `thinking: disabled` beside a non-off reasoning effort, so the card
 * refuses that combination before spending a wire round trip.
 * @param draft - the whole llm-deepseek user-section draft.
 * @returns the first localized failure key, or undefined when it may apply.
 */
export declare function validateDeepSeekDraft(draft: JsonRecord): DeepSeekDraftFailure | undefined;
