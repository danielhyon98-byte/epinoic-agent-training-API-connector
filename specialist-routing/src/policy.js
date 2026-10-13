/**
 * Routing policy (`epinoic.routing-policy.v1`): thresholds and calibration identity.
 * @module policy
 */

import { FIXTURE_BRAND, SCHEMAS } from "./version.js";
import { ErrorList, HEX64_RE, checkKeys, deepFreeze, isOpaqueString, isPlainObject } from "./util.js";

/** Allowed policy statuses. */
export const POLICY_STATUSES = Object.freeze(["unapproved", "fixture-only", "approved"]);

/** Threshold names, in documentation order. */
export const THRESHOLD_KEYS = Object.freeze([
  "routeMin", "marginMin", "familyMin", "clarifyFloor",
  "outOfScopeMin", "mixedMin", "nonEnglishMin", "taskContextMin",
]);

const POLICY_KEYS = Object.freeze(["schema", "policyVersion", "status", "thresholds", "calibration"]);
const CALIBRATION_KEYS = Object.freeze(["fingerprint", "recordId"]);

/**
 * The production policy shipped with this version. It is unapproved, has no
 * thresholds and no calibration, so it cannot start new classification:
 * `selectSpecialist` returns `unavailable/calibration_missing` with it.
 */
export const PRODUCTION_POLICY = deepFreeze({
  schema: SCHEMAS.policy,
  policyVersion: "production/0.1.0-unapproved",
  status: "unapproved",
  thresholds: null,
  calibration: null,
});

/** Error thrown by loadApprovedPolicy. `code` is a closed routing reason or `policy_invalid`. */
export class RoutingPolicyError extends Error {
  /** @param {"policy_invalid" | "fixture_policy_rejected" | "calibration_missing"} code @param {string} message */
  constructor(code, message) {
    super(message);
    this.name = "RoutingPolicyError";
    this.code = code;
  }
}

/**
 * Structural validation of a policy. Synchronous.
 *
 * Rules: exact fields; `fixtureBrand` is required for `fixture-only` and
 * forbidden otherwise; every threshold is a finite number in (0, 1];
 * `marginMin` is below 1; `clarifyFloor <= routeMin`; `calibration` is null or
 * `{ fingerprint: 64-hex, recordId }`. Validity does not mean usable: an
 * `unapproved` policy, or one without thresholds or calibration, is valid but
 * selection still returns `calibration_missing`.
 *
 * @param {unknown} policy
 * @returns {Readonly<{ok: boolean, errors: ReadonlyArray<{path: string, code: string, detail: string | null}>}>}
 */
export function validatePolicy(policy) {
  const errors = new ErrorList();
  if (!isPlainObject(policy)) {
    errors.add("$", "type", "expected an object");
    return errors.result();
  }
  const fixture = policy.status === "fixture-only";
  checkKeys(policy, POLICY_KEYS, fixture ? ["fixtureBrand"] : [], "$", errors);
  if (fixture && policy.fixtureBrand !== FIXTURE_BRAND) errors.add("$.fixtureBrand", "missing_fixture_brand", FIXTURE_BRAND);
  if (policy.schema !== SCHEMAS.policy) errors.add("$.schema", "schema_mismatch", String(policy.schema));
  if (!isOpaqueString(policy.policyVersion)) errors.add("$.policyVersion", "type", "expected a string");
  if (!POLICY_STATUSES.includes(policy.status)) errors.add("$.status", "invalid_status", String(policy.status));

  const t = policy.thresholds;
  if (t !== null && t !== undefined) {
    if (!isPlainObject(t)) errors.add("$.thresholds", "type", "expected an object or null");
    else {
      checkKeys(t, THRESHOLD_KEYS, [], "$.thresholds", errors);
      for (const key of THRESHOLD_KEYS) {
        const v = t[key];
        if (v === undefined) continue;
        if (typeof v !== "number" || !Number.isFinite(v)) errors.add(`$.thresholds.${key}`, "non_finite", String(v));
        else if (v <= 0 || v > 1) errors.add(`$.thresholds.${key}`, "out_of_range", String(v));
      }
      if (typeof t.marginMin === "number" && t.marginMin >= 1) errors.add("$.thresholds.marginMin", "out_of_range", "must be < 1");
      if (typeof t.clarifyFloor === "number" && typeof t.routeMin === "number" && t.clarifyFloor > t.routeMin) {
        errors.add("$.thresholds.clarifyFloor", "inconsistent_thresholds", "clarifyFloor must be <= routeMin");
      }
    }
  }

  const c = policy.calibration;
  if (c !== null && c !== undefined) {
    if (!isPlainObject(c)) errors.add("$.calibration", "type", "expected an object or null");
    else {
      checkKeys(c, CALIBRATION_KEYS, [], "$.calibration", errors);
      if (typeof c.fingerprint !== "string" || !HEX64_RE.test(c.fingerprint)) {
        errors.add("$.calibration.fingerprint", "type", "expected 64 lower-case hex");
      }
      if (!isOpaqueString(c.recordId)) errors.add("$.calibration.recordId", "type", "expected a string");
    }
  }
  return errors.result();
}

/**
 * Classify a policy for selection: `"usable"`, or the closed routing reason
 * that stops classification. Does not check the calibration fingerprint.
 * @param {unknown} policy
 * @param {{offlineFixtureHarness?: boolean}} [options]
 * @returns {"usable" | "policy_invalid" | "fixture_policy_rejected" | "calibration_missing"}
 */
export function policyReadiness(policy, options = {}) {
  if (!validatePolicy(policy).ok) return "policy_invalid";
  if (policy.status === "fixture-only" && options.offlineFixtureHarness !== true) return "fixture_policy_rejected";
  if (policy.status === "unapproved" || policy.thresholds === null || policy.calibration === null) {
    return "calibration_missing";
  }
  return "usable";
}

/**
 * Load a policy for production use. Synchronous. Returns a deep-frozen copy of
 * an `approved` policy that has thresholds and a calibration record. Throws
 * `RoutingPolicyError` otherwise:
 * - `fixture_policy_rejected` for any `fixture-only` policy (always, there is no
 *   harness override here);
 * - `calibration_missing` for `unapproved` policies and approved policies
 *   without thresholds or calibration (including PRODUCTION_POLICY);
 * - `policy_invalid` for structural errors.
 *
 * The calibration fingerprint is checked later, per request, by selection.
 * @param {unknown} candidate
 * @returns {Readonly<object>}
 */
export function loadApprovedPolicy(candidate) {
  const check = validatePolicy(candidate);
  if (isPlainObject(candidate) && (candidate.status === "fixture-only" || "fixtureBrand" in candidate)) {
    throw new RoutingPolicyError("fixture_policy_rejected", "fixture-only policies are never loaded as approved");
  }
  if (!check.ok) {
    throw new RoutingPolicyError("policy_invalid", `invalid policy (${check.errors[0].path}: ${check.errors[0].code})`);
  }
  if (candidate.status !== "approved" || candidate.thresholds === null || candidate.calibration === null) {
    throw new RoutingPolicyError("calibration_missing", "policy is not approved with thresholds and a calibration record");
  }
  return deepFreeze(JSON.parse(JSON.stringify(candidate)));
}
