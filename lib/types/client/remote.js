/**
 * The client half's Typert contribution: the shared descriptors mounted as
 * this page's Remote namespace, plus the namespace typing.
 *
 * The descriptors themselves live in `../descriptors.ts` because the host half
 * registers the same list — see that module for why registering explicitly is
 * required rather than relying on the `@Remote` markers.
 * @module dsh-web-enhanced/src/client/remote
 */
import { WEB_ENHANCED_DESCRIPTORS, WEB_ENHANCED_PACKAGE } from "../descriptors.js";
/** The contribution mounted by the client half. */
export const webEnhancedRemote = {
    package: WEB_ENHANCED_PACKAGE,
    descriptors: [...WEB_ENHANCED_DESCRIPTORS],
};
