/**
 * Pure draft decisions behind the Global Prompt settings tab.
 *
 * The namespace owns exactly two top-level keys, so the panel drafts the
 * whole user layer (unlike the multi-card Model Capabilities page, which
 * edits subtrees). Kept pure for the node-env test suite.
 * @module dsh-web-enhanced/src/client/global-prompt/draft
 */
import { recordOf } from "../model-capabilities/settings-draft.js";
/**
 * Read one settings user layer as a draft. Absent or malformed fields fall
 * back to the namespace defaults (off, empty text).
 * @param user - redacted user layer of the namespace view.
 */
export function globalPromptDraftOf(user) {
    const record = recordOf(user);
    return {
        enabled: record['enabled'] === true,
        text: typeof record['text'] === 'string' ? record['text'] : '',
    };
}
/** The settings subtree one draft saves. */
export function globalPromptRecordOf(draft) {
    return { enabled: draft.enabled, text: draft.text };
}
/**
 * Validate one draft before it spends a wire round trip.
 * @param draft - the draft to check.
 * @param maxChars - hard cap on the prompt text.
 */
export function validateGlobalPromptDraft(draft, maxChars) {
    if (draft.text.length > maxChars)
        return 'textTooLong';
    return undefined;
}
