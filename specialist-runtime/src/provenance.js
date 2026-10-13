/**
 * Provenance shared by PreparedRequest and SpecialistTurnResult (contract
 * section 7). Fields not resolved before a failure are null. Library,
 * tools, retrieval and claims are fixed: none in the pilot.
 * @module provenance
 */

import { PILOT_MODE } from "./constants.js";

/**
 * @typedef {{
 *   manifestVersion: string | null, slug: string | null, sourceRepo: string | null,
 *   sourceCommit: string | null, kbVersion: string | null, bundleSha256: string | null,
 *   gateVersion: string | null, gateConfigVersion: string | null,
 *   runtimeNoticeVersion: string | null, mode: string | null,
 *   libraryManifestVersion: null, toolsRun: [], retrieval: null, claims: null
 * }} Provenance
 */

/**
 * @param {import("./context.js").RuntimeContext} ctx
 * @param {{ entry?: any, gateConfig?: any, modeOk?: boolean, runtimeNoticeVersion?: string | null }} resolved
 * @returns {Provenance}
 */
export function buildProvenance(ctx, resolved) {
  const entry = resolved.entry ?? null;
  return {
    manifestVersion: ctx.manifestValid ? ctx.manifest.manifestVersion : null,
    slug: entry ? entry.slug : null,
    sourceRepo: entry ? entry.source.repo : null,
    sourceCommit: entry ? entry.source.commit : null,
    kbVersion: entry ? entry.kbVersion : null,
    bundleSha256: entry ? entry.bundleSha256 : null,
    gateVersion: entry ? entry.gateVersion : null,
    gateConfigVersion: resolved.gateConfig ? resolved.gateConfig.configVersion : null,
    runtimeNoticeVersion: resolved.runtimeNoticeVersion ?? null,
    mode: resolved.modeOk ? PILOT_MODE : null,
    libraryManifestVersion: null,
    toolsRun: [],
    retrieval: null,
    claims: null,
  };
}
