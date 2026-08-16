/**
 * Pure provider/model joins behind the Model Capabilities page: which
 * directory entries belong on the page and what override candidates a
 * provider offers. Kept separate from the snapshot store so node-env tests
 * can exercise the decisions without loading the browser runtime module.
 * @module dsh-web-enhanced/src/client/model-capabilities/capability-join
 */
import { getPath } from '@deepseek-ai/dsh-client-schema-form';
import { DEEPSEEK_NS, PI_AI_NS } from "./settings-draft.js";
/**
 * Whether a directory entry belongs on the capabilities page. DeepSeek always
 * does (its fields live at the section root); a pi-ai route is shown once it
 * is configured, active, or hand-declared — dormant catalog providers stay on
 * the ordinary Models page, where their first profile belongs.
 * @param entry - one configurable-provider directory entry.
 * @param namespace - its settings namespace view, when the host has one.
 * @returns whether the page renders a card for the entry.
 */
export function visibleCapabilityProvider(entry, namespace) {
    if (entry.settingsNs === DEEPSEEK_NS)
        return true;
    if (entry.settingsNs !== PI_AI_NS)
        return false;
    if (entry.settingsPath.length === 0)
        return false;
    if (entry.active || entry.declared === true)
        return true;
    return namespace !== undefined && getPath(namespace.user, entry.settingsPath) !== undefined;
}
/**
 * Effective model options for a provider, preferring the live catalog and
 * falling back to the settings layers so a dormant/declared route still has
 * candidates.
 * @param namespace - the provider's settings namespace view.
 * @param path - the provider profile path.
 * @param catalog - live catalog models for the route (possibly empty).
 * @returns deduplicated options in display order.
 */
export function modelOptionsOf(namespace, path, catalog) {
    const seen = new Set();
    const options = [];
    const push = (id, name) => {
        if (typeof id !== 'string' || id.length === 0 || seen.has(id))
            return;
        seen.add(id);
        options.push({ id, ...typeof name === 'string' && name.length > 0 ? { name } : {} });
    };
    for (const model of catalog)
        push(model.id, model.name);
    for (const layer of [namespace.value, namespace.base]) {
        const models = getPath(layer, [...path, 'models']);
        if (!Array.isArray(models))
            continue;
        for (const entry of models) {
            if (typeof entry !== 'object' || entry === null || Array.isArray(entry))
                continue;
            push(entry['id'], entry['name']);
        }
    }
    for (const layer of [namespace.value, namespace.base]) {
        const overrides = getPath(layer, [...path, 'modelOverrides']);
        if (typeof overrides !== 'object' || overrides === null || Array.isArray(overrides))
            continue;
        for (const id of Object.keys(overrides))
            push(id, undefined);
    }
    return options;
}
