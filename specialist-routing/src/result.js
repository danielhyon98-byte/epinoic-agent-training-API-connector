/**
 * RoutingResult (`epinoic.routing-result.v1`) and its closed enums.
 * @module result
 */

import { SCHEMAS } from "./version.js";
import { deepFreeze } from "./util.js";

/** Closed outcome enum. */
export const ROUTING_OUTCOMES = Object.freeze(["route", "clarify", "unavailable"]);

/** Closed reason codes per outcome (contract section 6). */
export const REASONS_BY_OUTCOME = deepFreeze({
  route: ["single_subject", "trusted_course_metadata", "sticky_subject"],
  clarify: ["generic_family", "competing_subjects", "overlap_policy", "mixed_request", "needs_task_context", "low_confidence"],
  unavailable: [
    "specialist_unavailable", "out_of_scope", "unsupported_language", "calibration_missing",
    "calibration_mismatch", "identity_mismatch", "evidence_invalid", "capabilities_invalid",
    "fixture_policy_rejected", "sticky_invalid",
  ],
});

/** Closed reason enum (all outcomes). */
export const ROUTING_REASONS = Object.freeze([
  ...REASONS_BY_OUTCOME.route,
  ...REASONS_BY_OUTCOME.clarify,
  ...REASONS_BY_OUTCOME.unavailable,
]);

/** Closed path enum. */
export const ROUTING_PATHS = Object.freeze(["classification", "sticky"]);

/** Identity with every field null, for results produced before identity is known. */
export const EMPTY_IDENTITY = Object.freeze({
  catalogueSha256: null,
  labelSetSha256: null,
  policyVersion: null,
  calibrationFingerprint: null,
});

/**
 * Build a deep-frozen RoutingResult. Throws on a reason that does not belong to
 * the outcome, a route without a slug, or a slug on a non-route outcome, so an
 * internal bug can never emit an off-contract result.
 * @param {{outcome: string, reason: string, slug?: string | null,
 *   candidates?: {slug: string, available: boolean}[], path: string,
 *   identity?: {catalogueSha256: string | null, labelSetSha256: string | null,
 *     policyVersion: string | null, calibrationFingerprint: string | null}}} fields
 */
export function makeResult({ outcome, reason, slug = null, candidates = [], path, identity = EMPTY_IDENTITY }) {
  if (!ROUTING_OUTCOMES.includes(outcome) || !REASONS_BY_OUTCOME[outcome].includes(reason)) {
    throw new Error(`makeResult: reason ${reason} is not valid for outcome ${outcome}`);
  }
  if (!ROUTING_PATHS.includes(path)) throw new Error(`makeResult: invalid path ${path}`);
  if ((outcome === "route") !== (typeof slug === "string")) {
    throw new Error("makeResult: slug is required for route and forbidden otherwise");
  }
  return deepFreeze({
    schema: SCHEMAS.result,
    outcome,
    slug,
    reason,
    candidates: candidates.map((c) => ({ slug: c.slug, available: c.available })),
    path,
    identity: {
      catalogueSha256: identity.catalogueSha256,
      labelSetSha256: identity.labelSetSha256,
      policyVersion: identity.policyVersion,
      calibrationFingerprint: identity.calibrationFingerprint,
    },
    inferencePerformed: false,
  });
}
