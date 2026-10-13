/**
 * Calibration identity and fingerprint.
 * Async throughout: SHA-256 comes from crypto.subtle.
 * @module calibration
 */

import { canonicalDigest, policyDigest } from "./digest.js";
import { validatePolicy } from "./policy.js";
import { HEX64_RE, deepFreeze, isOpaqueString, isPlainObject } from "./util.js";

const IDENTITY_KEYS = Object.freeze([
  "model", "labelSetSha256", "catalogueSha256", "policySha256",
  "adapterVersion", "excerptVersion", "datasets",
]);
const DATASET_KEYS = Object.freeze(["tuneSha256", "holdoutSha256"]);

/**
 * Describe what is wrong with a calibration identity, or return null.
 * @param {unknown} identity
 * @returns {string | null}
 */
export function describeIdentityProblem(identity) {
  if (!isPlainObject(identity)) return "identity must be an object";
  const keys = Object.keys(identity);
  for (const k of keys) if (!IDENTITY_KEYS.includes(k)) return `unknown identity field ${k}`;
  for (const k of IDENTITY_KEYS) if (!(k in identity)) return `missing identity field ${k}`;
  for (const k of ["model", "adapterVersion", "excerptVersion"]) {
    if (!isOpaqueString(identity[k])) return `${k} must be a non-empty string`;
  }
  for (const k of ["labelSetSha256", "catalogueSha256", "policySha256"]) {
    if (typeof identity[k] !== "string" || !HEX64_RE.test(identity[k])) return `${k} must be 64 lower-case hex`;
  }
  const d = identity.datasets;
  if (!isPlainObject(d)) return "datasets must be an object";
  for (const k of Object.keys(d)) if (!DATASET_KEYS.includes(k)) return `unknown datasets field ${k}`;
  for (const k of DATASET_KEYS) {
    if (typeof d[k] !== "string" || !HEX64_RE.test(d[k])) return `datasets.${k} must be 64 lower-case hex`;
  }
  return null;
}

/**
 * SHA-256 over the canonical JSON of
 * `{ model, labelSetSha256, catalogueSha256, policySha256, adapterVersion,
 *    excerptVersion, datasets: { tuneSha256, holdoutSha256 } }`.
 * Every field is required and no other field is accepted. **Async.**
 * @param {object} identity
 * @returns {Promise<string>}
 * @throws {TypeError} when the identity is incomplete or malformed
 */
export async function computeCalibrationFingerprint(identity) {
  const problem = describeIdentityProblem(identity);
  if (problem) throw new TypeError(`computeCalibrationFingerprint: ${problem}`);
  return canonicalDigest({
    model: identity.model,
    labelSetSha256: identity.labelSetSha256,
    catalogueSha256: identity.catalogueSha256,
    policySha256: identity.policySha256,
    adapterVersion: identity.adapterVersion,
    excerptVersion: identity.excerptVersion,
    datasets: { tuneSha256: identity.datasets.tuneSha256, holdoutSha256: identity.datasets.holdoutSha256 },
  });
}

/**
 * Check a policy's calibration record against the identity in force. **Async.**
 *
 * - `calibration_missing`: the policy is invalid or has `calibration: null`.
 * - `calibration_mismatch`: the identity is incomplete or malformed, its
 *   `policySha256` is not this policy's digest, or the recomputed fingerprint
 *   differs from `policy.calibration.fingerprint` (any changed field: model,
 *   label set, catalogue, policy, adapter version, excerpt version, datasets).
 *
 * Note: `policySha256` excludes thresholds (contract section 7), so a threshold
 * edit alone does not change the fingerprint; bump `policyVersion` with it.
 *
 * @param {{policy: object, identity: object}} input
 * @returns {Promise<Readonly<{ok: boolean, reason: null | "calibration_missing" | "calibration_mismatch",
 *   fingerprint: string | null, detail: string | null}>>}
 */
export async function checkCalibration({ policy, identity } = {}) {
  const fail = (reason, detail) => deepFreeze({ ok: false, reason, fingerprint: null, detail });
  if (!validatePolicy(policy).ok || policy.calibration === null) {
    return fail("calibration_missing", "no valid calibration record");
  }
  const problem = describeIdentityProblem(identity);
  if (problem) return fail("calibration_mismatch", problem);
  if (identity.policySha256 !== (await policyDigest(policy))) {
    return fail("calibration_mismatch", "policySha256 is not this policy's digest");
  }
  const fingerprint = await computeCalibrationFingerprint(identity);
  if (fingerprint !== policy.calibration.fingerprint) {
    return fail("calibration_mismatch", "fingerprint differs from the calibration record");
  }
  return deepFreeze({ ok: true, reason: null, fingerprint, detail: null });
}
