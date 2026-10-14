/**
 * Capabilities for the router (contract section 9). The router consumes this
 * object and keeps no second availability registry.
 * @module capabilities
 */

import { RUNTIME_CONTRACT_VERSION, SCHEMAS } from "./constants.js";
import { isAvailable } from "./context.js";
import { RuntimeIntegrityError } from "./errors.js";
import { deepFreeze, isPlainObject } from "./util.js";

/**
 * @typedef {Readonly<{
 *   schema: "epinoic.specialist-capabilities.v1",
 *   runtimeContractVersion: string, manifestVersion: string | null, environment: string,
 *   entries: ReadonlyArray<{ slug: string, available: boolean, supportedModes: string[], gateVersion: string, bundleSha256: string }>
 * }>} Capabilities
 */

/**
 * `available` is true only when the manifest enables the slug for this
 * environment and a valid gate configuration backs it. An environment this
 * runtime does not accept, or an invalid manifest, makes everything
 * unavailable (an invalid manifest also lists no entries).
 * @param {import("./context.js").RuntimeContext} ctx
 * @param {unknown} args `{ environment }`
 * @returns {Capabilities}
 */
export function capabilitiesWith(ctx, args) {
  const environment = isPlainObject(args) ? args.environment : undefined;
  if (typeof environment !== "string") throw new RuntimeIntegrityError("environment_invalid");
  const entries = ctx.manifestValid
    ? ctx.manifest.entries.map((entry) => ({
        slug: entry.slug,
        available: isAvailable(ctx, environment, entry),
        supportedModes: [...entry.supportedModes],
        gateVersion: entry.gateVersion,
        bundleSha256: entry.bundleSha256,
      }))
    : [];
  return deepFreeze({
    schema: SCHEMAS.capabilities,
    runtimeContractVersion: RUNTIME_CONTRACT_VERSION,
    manifestVersion: ctx.manifestValid ? ctx.manifest.manifestVersion : null,
    environment,
    entries,
  });
}
