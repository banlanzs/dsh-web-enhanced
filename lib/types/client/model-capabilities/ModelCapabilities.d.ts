/**
 * The Model Capabilities settings page: a separate settings section right
 * after the host Models page. It edits exactly what the host Models editor
 * deliberately leaves out:
 *
 * - llm-deepseek (whole section): `thinking` and `reasoningEffort`.
 * - llm-pi-ai provider profiles: `defaultInput` / `reasoning`, plus every
 *   model's `input` and `reasoningEfforts` — through `models` rows when the
 *   profile already owns the list, through minimal `modelOverrides` entries
 *   for catalog routes otherwise.
 *
 * Every card applies path-addressed settings ops against the user layer it
 * cloned, so fields edited by the host Models page survive untouched.
 * @module dsh-web-enhanced/src/client/model-capabilities/ModelCapabilities
 */
import type { ReactNode } from 'react';
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { CapabilitiesState, CapabilitiesStore } from './store.ts';
/** Injected dependencies of {@link ModelCapabilitiesSection}. */
export interface ModelCapabilitiesInjected {
    /** The page store (loaded on mount, refreshed on pushed invalidations). */
    controller: CapabilitiesStore;
    /** uSES subscription hook bound to the store. */
    useSnapshot: <S>(sel: (s: CapabilitiesState) => S, eq?: (a: S, b: S) => boolean) => S;
    /** Wire faces the cards write through. */
    api: Pick<IApiClient, 'settings' | 'llm'>;
}
/** Full composed props of the settings section. */
export type ModelCapabilitiesProps = PropsRuntime<'settings.section'> & InjectFace<ModelCapabilitiesInjected> & PropsLocale<'webEnhanced'>;
/** Render the settings section content column. */
export declare function ModelCapabilitiesSection(props: ModelCapabilitiesProps): ReactNode;
