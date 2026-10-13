/**
 * SHA-256 digests over canonical JSON.
 *
 * Every function here is **async** because the only portable SHA-256 is
 * `globalThis.crypto.subtle.digest`, which returns a Promise. Anything that
 * needs a digest (evidence validation, selection, calibration) is async too.
 * @module digest
 */

import { canonicalJson } from "./canonical-json.js";

const utf8 = new TextEncoder();

/**
 * Lower-case hex SHA-256 of the UTF-8 bytes of a string.
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function sha256Hex(text) {
  if (typeof text !== "string") throw new TypeError("sha256Hex: expected a string");
  const subtle = globalThis.crypto && globalThis.crypto.subtle;
  if (!subtle) throw new Error("sha256Hex: globalThis.crypto.subtle is not available");
  const buffer = await subtle.digest("SHA-256", utf8.encode(text));
  let hex = "";
  for (const byte of new Uint8Array(buffer)) hex += byte.toString(16).padStart(2, "0");
  return hex;
}

/**
 * SHA-256 of a value's canonical JSON.
 * @param {unknown} value
 * @returns {Promise<string>}
 */
export async function canonicalDigest(value) {
  return sha256Hex(canonicalJson(value));
}

/**
 * `catalogueSha256`: SHA-256 over the canonical JSON of the whole catalogue.
 * The digest is never stored inside the object it hashes. Key order in the
 * input does not change the result. Async (see module note).
 * @param {object} catalogue
 * @returns {Promise<string>}
 */
export async function catalogueDigest(catalogue) {
  return canonicalDigest(catalogue);
}

/**
 * `labelSetSha256`: SHA-256 over the canonical JSON of a label set produced by
 * `buildLabelSet`. Async (see module note).
 * @param {object} labelSet
 * @returns {Promise<string>}
 */
export async function labelSetDigest(labelSet) {
  return canonicalDigest(labelSet);
}

/**
 * `policySha256` for the calibration fingerprint: SHA-256 over the canonical
 * JSON of the policy with `thresholds` excluded (as the contract says) and
 * `calibration` excluded (it holds the fingerprint, so including it would be
 * circular). Async (see module note).
 * @param {object} policy
 * @returns {Promise<string>}
 */
export async function policyDigest(policy) {
  if (policy === null || typeof policy !== "object" || Array.isArray(policy)) {
    throw new TypeError("policyDigest: expected a policy object");
  }
  const rest = {};
  for (const key of Object.keys(policy)) {
    if (key !== "thresholds" && key !== "calibration") rest[key] = policy[key];
  }
  return canonicalDigest(rest);
}
