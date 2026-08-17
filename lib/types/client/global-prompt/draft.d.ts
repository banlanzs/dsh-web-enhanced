/**
 * Pure draft decisions behind the Global Prompt settings tab.
 *
 * The namespace owns exactly two top-level keys, so the panel drafts the
 * whole user layer (unlike the multi-card Model Capabilities page, which
 * edits subtrees). Kept pure for the node-env test suite.
 * @module dsh-web-enhanced/src/client/global-prompt/draft
 */
import type { JsonRecord } from '../model-capabilities/settings-draft.ts';
/** Editable form values of the tab. */
export interface GlobalPromptDraft {
    readonly enabled: boolean;
    readonly text: string;
}
/**
 * Read one settings user layer as a draft. Absent or malformed fields fall
 * back to the namespace defaults (off, empty text).
 * @param user - redacted user layer of the namespace view.
 */
export declare function globalPromptDraftOf(user: unknown): GlobalPromptDraft;
/** The settings subtree one draft saves. */
export declare function globalPromptRecordOf(draft: GlobalPromptDraft): JsonRecord;
/** Why a draft may not save, or undefined when it may. */
export type GlobalPromptDraftFailure = 'textTooLong';
/**
 * Validate one draft before it spends a wire round trip.
 * @param draft - the draft to check.
 * @param maxChars - hard cap on the prompt text.
 */
export declare function validateGlobalPromptDraft(draft: GlobalPromptDraft, maxChars: number): GlobalPromptDraftFailure | undefined;
