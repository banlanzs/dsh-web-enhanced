/**
 * The client half's Typert contribution: the shared descriptors mounted as
 * this page's Remote namespace, plus the namespace typing.
 *
 * The descriptors themselves live in `../descriptors.ts` because the host half
 * registers the same list — see that module for why registering explicitly is
 * required rather than relying on the `@Remote` markers.
 * @module dsh-web-enhanced/src/client/remote
 */

import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { WEB_ENHANCED_DESCRIPTORS, WEB_ENHANCED_PACKAGE } from '../descriptors.ts'
import type { RawWebEnhancedNamespace } from './facade.ts'

/** The contribution mounted by the client half. */
export const webEnhancedRemote: TypertRemoteContribution = {
  package: WEB_ENHANCED_PACKAGE,
  descriptors: [...WEB_ENHANCED_DESCRIPTORS],
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    /**
     * Web-enhanced host capabilities.
     *
     * Typed with the RAW method shapes: a mounted namespace method resolves to
     * the `RemoteResult` envelope, not to the host payload. `createRemoteFacade`
     * opens it for components.
     */
    webEnhanced: RawWebEnhancedNamespace
  }
}
