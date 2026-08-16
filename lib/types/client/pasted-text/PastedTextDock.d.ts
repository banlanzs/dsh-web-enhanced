/**
 * The composer's pasted-text chips: one row above the input card, exactly
 * where the conversation dock sits. Each chip is a reference occurrence the
 * paste interceptor inserted; clicking opens a modal editor, removing drops
 * the occurrence (and therefore the U+FFFC placeholder) from the draft.
 * @module dsh-web-enhanced/src/client/pasted-text/PastedTextDock
 */
import type { ReactNode } from 'react';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { PastedTextStore } from './store.ts';
/** One reference occurrence, narrowed to the fields the dock reads. */
export interface PastedTextOccurrence {
    readonly occurrenceId: number;
    readonly source: string;
    readonly ref: string;
    readonly offset: number;
    readonly label: string;
    readonly clipboardText: string;
    readonly invalid?: boolean;
}
/** Injected face of the pasted-text dock registration. */
export interface PastedTextDockInjected {
    readonly store: PastedTextStore;
    /** Remove one reference occurrence from the draft (a U+FFFC span). */
    readonly remove: (span: {
        readonly start: number;
        readonly end: number;
    }) => void;
}
/** Full composed props of the pasted-text dock. */
export type PastedTextDockProps = PropsRuntime<'conversation.input.dock'> & InjectFace<PastedTextDockInjected> & PropsLocale<'webEnhanced'>;
/** The pasted-text chips; renders nothing while the draft holds none. */
export declare function PastedTextDock({ input, store, remove, t }: PastedTextDockProps): ReactNode;
