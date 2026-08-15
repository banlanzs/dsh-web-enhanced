/**
 * Whether the balance query says anything about the session's current model
 * route.
 *
 * The balance endpoint belongs to one account at one vendor. A session routed
 * to some other channel — a self-hosted gateway, another vendor, a proxy —
 * still has a balance somewhere, but not one this endpoint knows, so the line
 * would be reporting a number about a different account than the one paying
 * for the conversation. That is worse than showing nothing.
 * @module dsh-web-enhanced/src/channel
 */

/** What the applicability decision reads. */
export interface ChannelFacts {
  /** Provider route of the session's current selection; undefined when unknown. */
  readonly provider: string | undefined
  /** Provider routes whose account the balance endpoint serves. */
  readonly allowed: readonly string[]
  /** Base URL the balance itself is queried from. */
  readonly balanceBaseUrl: string
  /**
   * Base URL configured for {@link provider}, when its adapter's settings
   * declare one. `undefined` means the route runs on its adapter default,
   * which for an allowed provider is the vendor's own endpoint.
   */
  readonly providerBaseUrl: string | undefined
}

/** Host of one URL, lowercased; undefined when it does not parse. */
function hostOf(url: string): string | undefined {
  try {
    return new URL(url).host.toLowerCase()
  } catch {
    return undefined
  }
}

/**
 * Decide whether the balance line belongs on screen for one model route.
 * @param facts - the route, the allow list, and both endpoints.
 * @returns true when the balance describes the account this route bills.
 */
export function balanceApplies(facts: ChannelFacts): boolean {
  // No named route: the caller could not say, so nothing contradicts the line.
  // This is the pre-selection frame, not a foreign channel.
  if (facts.provider === undefined) return true
  if (!facts.allowed.includes(facts.provider)) return false
  if (facts.providerBaseUrl === undefined) return true
  const configured = hostOf(facts.providerBaseUrl)
  const balance = hostOf(facts.balanceBaseUrl)
  // An allowed route repointed at a private endpoint bills a different
  // account; an unparseable endpoint is not evidence of the same one.
  return configured !== undefined && balance !== undefined && configured === balance
}
