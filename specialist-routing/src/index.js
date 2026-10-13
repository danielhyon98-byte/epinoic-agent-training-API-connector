/**
 * @epinoic/specialist-routing: portable multi-specialist selection layer.
 *
 * Status: synthetic catalogue, no live inference, not calibrated, nothing
 * enabled. Portable ES modules: only `globalThis.crypto.subtle`, `TextEncoder`
 * and `TextDecoder` are used; no filesystem, network, process or Node imports.
 *
 * Async exports (they need SHA-256 from crypto.subtle): catalogueDigest,
 * labelSetDigest, policyDigest, validateEvidence, selectSpecialist,
 * selectSticky, computeCalibrationFingerprint, checkCalibration.
 * Everything else is synchronous.
 * @module @epinoic/specialist-routing
 */

export { ROUTING_CONTRACT_VERSION, SCHEMAS, LABEL_SET_VERSION, FLAG_LABELS, FIXTURE_BRAND } from "./version.js";
export { canonicalJson } from "./canonical-json.js";
export { catalogueDigest, labelSetDigest, policyDigest } from "./digest.js";
export { validateCatalogue } from "./catalogue.js";
export { buildLabelSet, validateLabelSet } from "./label-set.js";
export { validateEvidence } from "./evidence.js";
export { validateCapabilities } from "./capabilities.js";
export { measureClassificationPayload } from "./payload.js";
export { PRODUCTION_POLICY, loadApprovedPolicy, validatePolicy, RoutingPolicyError, THRESHOLD_KEYS } from "./policy.js";
export { computeCalibrationFingerprint, checkCalibration } from "./calibration.js";
export { ROUTING_OUTCOMES, ROUTING_REASONS, REASONS_BY_OUTCOME, ROUTING_PATHS } from "./result.js";
export { selectSpecialist, selectSticky, MARGIN_EPSILON } from "./select.js";
