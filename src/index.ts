/**
 * dsh-web-enhanced plugin entry: mounts the web-enhanced gateway (task
 * board with cron scheduling, git, files, Office preview, and balance) as
 * one Typert namespace consumed by the browser half.
 * @module dsh-web-enhanced
 */

import type { Context } from '@deepseek-ai/cordis'
import type { InvocationDescriptor } from '@deepseek-ai/dsh-typert-protocol'
import { WEB_ENHANCED_DESCRIPTORS, WEB_ENHANCED_PACKAGE } from './descriptors.ts'
import { WebEnhancedGateway, Config } from './gateway.ts'
import { VisionInterceptor } from './vision.ts'
import { applyGlobalPrompt } from './global-prompt.ts'

export { WebEnhancedGateway, Config }
export {
  applyGlobalPrompt, GLOBAL_PROMPT_ORDER, GLOBAL_PROMPT_SECTION, GlobalPromptSettingsSchema,
  globalPromptTextOf,
} from './global-prompt.ts'
export type { GlobalPromptSettingsValue } from './global-prompt.ts'
export { VisionInterceptor, VisionTranscriber, VISION_SETTINGS_NS, VisionSettingsSchema } from './vision.ts'
export type {
  VisionConfigSource, VisionSettings, VisionSettingsScopeFace, VisionSettingsServiceFace,
  VisionSettingsValue,
} from './vision.ts'

/**
 * One package contribution as `TypertRegistry.register` accepts it.
 *
 * Declared locally: the shape belongs to `@deepseek-ai/dsh-typert-registry`,
 * which is the host's own dependency, not this plugin's.
 */
interface HostContribution {
  readonly package: string
  readonly face: 'host' | 'client'
  readonly schemas: readonly never[]
  readonly model: { readonly services: readonly never[]; readonly events: readonly never[]; readonly objects: readonly never[] }
  readonly invocations: readonly InvocationDescriptor[]
}

/**
 * The registration face of the Typert service.
 *
 * `register` is a public method of the `TypertRegistry` service but is absent
 * from the `TypertRegistryContract` interface that types `ctx.typert`, and the
 * local registry exposes reads only — so this is the one entry point, reached
 * through a narrowing rather than a cast of the whole service.
 */
interface TypertRegistrar {
  register?: (contribution: HostContribution) => () => void
}

/** Cordis plugin name (the loader row references the package, this is the entry name). */
export const name = 'web-enhanced'

/**
 * Core services the gateway and its scheduler require.
 *
 * `typert` is required for the descriptor registration below, not by the
 * gateway itself.
 */
export const inject = [
  'agents', 'sessions', 'agentDefaultModel', 'storageDomain', 'subprocess', 'workspaceRegistry',
  'typert',
]

/**
 * Mount the gateway, its scheduler, and the strict Remote definitions.
 *
 * The descriptors are registered explicitly instead of relying on the
 * Gateway's SRC discovery. SRC mode reads the `@Remote` markers out of
 * dsh-typert-protocol's private module state, which is only shared when the
 * plugin and the host resolve that package to the same file — a globally
 * installed `dsh` CLI bundles its own copy while an installed plugin binds to
 * the profile's, so the markers never meet and the Gateway refuses (404s)
 * every endpoint. The `ctx.typert.local` registry is a Cordis service and does
 * not care how the specifier resolved.
 * @param ctx - owning context with the injected core services.
 * @param config - plugin config; defaults apply field-wise.
 * @throws when the host's Typert service exposes no registration method,
 * which would otherwise surface as every endpoint answering 404.
 */
export function apply(ctx: Context, config: Config = {}): void {
  const registrar = ctx.typert as unknown as TypertRegistrar
  if (typeof registrar.register !== 'function') {
    throw new TypeError(
      'dsh-web-enhanced: the host Typert service exposes no register() method, '
      + 'so the Remote definitions cannot be published and every endpoint would answer 404',
    )
  }
  const register = registrar.register.bind(registrar)
  ctx.effect(() => register({
    package: WEB_ENHANCED_PACKAGE,
    face: 'host',
    schemas: [],
    model: { services: [], events: [], objects: [] },
    invocations: WEB_ENHANCED_DESCRIPTORS,
  }), 'web-enhanced: Remote definitions')
  applyGlobalPrompt(ctx)
  ctx.plugin(VisionInterceptor, config)
  ctx.plugin(WebEnhancedGateway, config)
}
