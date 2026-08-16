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
import { getPath } from '@deepseek-ai/dsh-client-schema-form';
/** Namespace owning the DeepSeek route-level thinking fields. */
export const DEEPSEEK_NS = 'llm-deepseek';
/** Namespace owning pi-ai provider profiles and per-model capabilities. */
export const PI_AI_NS = 'llm-pi-ai';
/** Every request modality a pi-ai model may declare. */
export const MODALITIES = ['text', 'image'];
/** Every pi-ai thinking level, in canonical escalation order. */
export const THINKING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
/** Whether a value is a plain data object (not an array or null). */
export function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
/** Read a value as a record, defaulting every non-record to `{}`. */
export function recordOf(value) {
    return isRecord(value) ? value : {};
}
/** Deep-clone a value as a record, defaulting every non-record to `{}`. */
export function cloneRecord(value) {
    return structuredClone(recordOf(value));
}
/**
 * A user-section subtree as a plain draft object (absent → empty).
 * @param namespace - the namespace whose redacted user layer is read.
 * @param path - path from the section root to the edited subtree.
 */
export function draftAt(namespace, path) {
    return cloneRecord(getPath(namespace.user, path));
}
/**
 * The minimal path ops carrying `after` over `before`. Only keys observed in
 * the draft are named, so redacted secret fields and fields outside the card
 * survive an apply unchanged.
 * @param base - path of the edited subtree inside the user section.
 * @param before - the subtree as loaded, or undefined when it is new.
 * @param after - the subtree as edited.
 * @returns ordered set/unset ops; empty when nothing changed.
 */
export function pathOps(base, before, after) {
    const previous = recordOf(before);
    const ops = [];
    for (const [key, value] of Object.entries(after)) {
        if (JSON.stringify(previous[key]) === JSON.stringify(value))
            continue;
        ops.push({ op: 'set', path: [...base, key], value });
    }
    for (const key of Object.keys(previous)) {
        if (!(key in after))
            ops.push({ op: 'unset', path: [...base, key] });
    }
    return ops;
}
/** Human text for a rejected wire call. */
export function messageOf(error) {
    return error instanceof Error ? error.message : String(error);
}
/**
 * Apply one card's draft through path-addressed settings ops.
 * @param args - namespace, subtree, before/after values, and revision facts.
 * @returns the new committed subtree/revision, or the failure to show.
 */
export async function applyDraft(args) {
    const { api, ns, path, before, after, expectedRevision, conflictText } = args;
    const ops = pathOps(path, before, after);
    if (ops.length === 0)
        return { ok: true, committed: before, revision: expectedRevision };
    try {
        const response = await api.settings.mutate({ ns, ops, expectedRevision });
        if (!response.result.ok) {
            const conflicted = response.result.error.code === 'settings-conflict';
            const failure = conflicted
                ? conflictText
                : response.result.error.message;
            return { ok: false, failure, conflicted };
        }
        return {
            ok: true,
            committed: getPath(response.result.value.user, path),
            revision: response.result.value.revision,
        };
    }
    catch (error) {
        return { ok: false, failure: messageOf(error), conflicted: false };
    }
}
/** Whether a value is a valid pi-ai `input` modality list. */
function validInputList(value) {
    return Array.isArray(value)
        && value.every(modality => MODALITIES.includes(modality));
}
/** Validate one `reasoningEfforts` dict against the adapter's resolution rules. */
function reasoningFailure(value) {
    if (!isRecord(value))
        return 'reasoningWireRequired';
    const entries = Object.entries(value);
    if (entries.length === 0 || !entries.some(([level]) => level !== 'off'))
        return 'reasoningNeedLevel';
    for (const [level, wire] of entries) {
        if (!THINKING_LEVELS.includes(level))
            return 'reasoningWireRequired';
        if (level === 'off') {
            // `off` may send nothing (null) or an explicit empty-presence spelling.
            if (wire !== null && (typeof wire !== 'string' || wire.length === 0))
                return 'reasoningWireRequired';
        }
        else if (typeof wire !== 'string' || wire.length === 0) {
            return 'reasoningWireRequired';
        }
    }
    return undefined;
}
/** Validate the capability fields of one model entry (`models` row or override). */
function modelCapabilitiesFailure(entry) {
    const input = entry['input'];
    if (input !== undefined && !validInputList(input))
        return 'modelInputInvalid';
    const efforts = entry['reasoningEfforts'];
    if (efforts !== undefined && efforts !== false) {
        const failure = reasoningFailure(efforts);
        if (failure !== undefined)
            return failure;
    }
    return undefined;
}
/**
 * Drop empty `modelOverrides` entries and an emptied dict before saving.
 * An override whose every capability field was removed has nothing left to
 * say, so it returns to inheritance instead of lingering as `{}`.
 * @param draft - the provider profile draft.
 * @returns a normalized copy.
 */
export function normalizePiAiDraft(draft) {
    const next = { ...draft };
    const overrides = next['modelOverrides'];
    if (!isRecord(overrides))
        return next;
    const cleaned = {};
    for (const [id, entry] of Object.entries(overrides)) {
        if (!isRecord(entry) || Object.keys(entry).length === 0)
            continue;
        cleaned[id] = entry;
    }
    if (Object.keys(cleaned).length > 0)
        next['modelOverrides'] = cleaned;
    else
        delete next['modelOverrides'];
    return next;
}
/**
 * Validate one pi-ai provider profile draft before it is written.
 * @param draft - the provider profile draft.
 * @returns the first localized failure key, or undefined when it may apply.
 */
export function validatePiAiDraft(draft) {
    const defaultInput = draft['defaultInput'];
    if (defaultInput !== undefined && (!validInputList(defaultInput) || defaultInput.length === 0)) {
        return 'defaultInputEmpty';
    }
    const models = draft['models'];
    if (models !== undefined) {
        if (!Array.isArray(models))
            return 'modelInputInvalid';
        for (const entry of models) {
            if (!isRecord(entry))
                return 'modelInputInvalid';
            const failure = modelCapabilitiesFailure(entry);
            if (failure !== undefined)
                return failure;
        }
    }
    const overrides = draft['modelOverrides'];
    if (overrides !== undefined) {
        if (!isRecord(overrides))
            return 'modelInputInvalid';
        for (const [id, entry] of Object.entries(overrides)) {
            if (id.length === 0)
                return 'modelOverrideEmptyId';
            if (!isRecord(entry))
                return 'modelInputInvalid';
            const failure = modelCapabilitiesFailure(entry);
            if (failure !== undefined)
                return failure;
        }
    }
    return undefined;
}
/**
 * Validate the DeepSeek route-level thinking fields. The adapter rejects
 * `thinking: disabled` beside a non-off reasoning effort, so the card
 * refuses that combination before spending a wire round trip.
 * @param draft - the whole llm-deepseek user-section draft.
 * @returns the first localized failure key, or undefined when it may apply.
 */
export function validateDeepSeekDraft(draft) {
    const thinking = draft['thinking'];
    if (thinking !== undefined && thinking !== 'enabled' && thinking !== 'disabled') {
        return 'thinkingInvalid';
    }
    const effort = draft['reasoningEffort'];
    if (effort !== undefined && effort !== 'off' && effort !== 'high' && effort !== 'max') {
        return 'reasoningEffortInvalid';
    }
    if (thinking === 'disabled' && effort !== undefined && effort !== 'off') {
        return 'reasoningDisabledConflict';
    }
    return undefined;
}
