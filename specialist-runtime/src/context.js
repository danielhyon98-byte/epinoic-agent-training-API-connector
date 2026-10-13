/**
 * Runtime context: the manifest, gate configurations and accepted
 * environments a runtime instance works with. The pinned runtime and the
 * offline test runtime are two contexts over the same code.
 * @module context
 */

import { checkManifest, findEntry, isEntryEnabled } from "./manifest.js";
import { validateGateConfig } from "./gate/config.js";
import { ownValue } from "./util.js";

/**
 * @typedef {{
 *   profile: "runtime" | "offline-test",
 *   environments: readonly string[],
 *   manifest: any,
 *   manifestValid: boolean,
 *   gateConfigs: Readonly<Record<string, any>>,
 *   acceptSyntheticGate: boolean
 * }} RuntimeContext
 */

/**
 * Build a frozen context. `manifest` and `gateConfigs` must already be frozen.
 * @param {Omit<RuntimeContext, "manifestValid">} spec
 * @returns {RuntimeContext}
 */
export function createContext(spec) {
  return Object.freeze({ ...spec, manifestValid: checkManifest(spec.manifest, spec.profile).ok });
}

/**
 * Resolve an entry that the environment enables, or a precondition code.
 * @param {RuntimeContext} ctx
 * @param {unknown} environment
 * @param {unknown} slug
 * @returns {{ code: string, entry?: any } | { code: null, entry: any }}
 */
export function resolveEnabledEntry(ctx, environment, slug) {
  if (typeof environment !== "string" || !ctx.environments.includes(environment)) {
    return { code: "environment_not_supported" };
  }
  if (!ctx.manifestValid) return { code: "manifest_invalid" };
  const entry = findEntry(ctx.manifest, slug);
  if (entry === undefined) return { code: "unknown_slug" };
  if (!isEntryEnabled(entry, environment, ctx.profile)) return { code: "slug_not_enabled", entry };
  return { code: null, entry };
}

/**
 * Resolve the gate configuration for an entry, or a precondition code.
 * @param {RuntimeContext} ctx
 * @param {any} entry
 * @returns {{ code: string } | { code: null, gateConfig: any }}
 */
export function resolveGateConfig(ctx, entry) {
  const gateConfig = ownValue(ctx.gateConfigs, entry.slug);
  if (gateConfig === undefined) return { code: "gate_config_missing" };
  if (!validateGateConfig(gateConfig).ok || gateConfig.slug !== entry.slug) return { code: "gate_config_invalid" };
  if (gateConfig.synthetic && !ctx.acceptSyntheticGate) return { code: "gate_config_invalid" };
  if (gateConfig.gateVersion !== entry.gateVersion) return { code: "gate_version_mismatch" };
  return { code: null, gateConfig };
}

/**
 * Whether an entry is available to the router in an environment: enabled by
 * the manifest and backed by a valid gate configuration.
 * @param {RuntimeContext} ctx
 * @param {string} environment
 * @param {any} entry
 */
export function isAvailable(ctx, environment, entry) {
  if (!ctx.environments.includes(environment) || !ctx.manifestValid) return false;
  return isEntryEnabled(entry, environment, ctx.profile) && resolveGateConfig(ctx, entry).code === null;
}
