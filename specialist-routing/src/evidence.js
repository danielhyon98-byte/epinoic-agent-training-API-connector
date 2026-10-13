/**
 * Strict validation of provider-neutral classification evidence
 * (`epinoic.routing-evidence.v1`). Website 01's adapter maps Fastino output into
 * this shape; raw HTTP parsing stays with that adapter.
 * @module evidence
 */

import { validateCatalogue } from "./catalogue.js";
import { catalogueDigest, labelSetDigest } from "./digest.js";
import { buildLabelSet, validateLabelSet } from "./label-set.js";
import { FLAG_LABELS, SCHEMAS } from "./version.js";
import {
  ErrorList,
  checkKeys,
  isOpaqueString,
  isPlainObject,
  scanForbiddenKeys,
} from "./util.js";

const TOP_KEYS = Object.freeze([
  "schema", "labelSetVersion", "labelSetSha256", "catalogueSha256",
  "adapter", "excerpt", "subjects", "families", "flags",
]);
const ADAPTER_KEYS = Object.freeze(["id", "version"]);
const EXCERPT_KEYS = Object.freeze(["version", "utf8Bytes", "codePoints", "truncated"]);
const SCORE_KEYS = Object.freeze(["label", "score"]);

/** Error codes that mean "evidence was produced for a different catalogue or label set". */
export const IDENTITY_ERROR_CODES = Object.freeze([
  "label_set_version_mismatch",
  "label_set_hash_mismatch",
  "catalogue_hash_mismatch",
]);

/**
 * Validate classification evidence against the current catalogue and label set.
 * **Async** because the identity hashes need SHA-256 (crypto.subtle).
 *
 * Rejects unknown top-level or nested fields (`unknown_field`) and any routing
 * directive or provider field such as `route`, `slug`, `model` or `override`
 * (`forbidden_field`); missing fields; unknown labels; a label repeated in one
 * list, whether contradictory or identical (`duplicate_label`); non-finite
 * numbers and NaN (`non_finite`); scores outside [0, 1] (`out_of_range`); an
 * excerpt over `limits.maxExcerptUtf8Bytes` (`excerpt_oversize`) or with
 * inconsistent byte/code-point counts; and identity mismatches
 * (`label_set_version_mismatch`, `label_set_hash_mismatch`,
 * `catalogue_hash_mismatch`). Several plausible subjects is valid evidence.
 *
 * Context problems are reported too: `catalogue_invalid`, `label_set_invalid`,
 * `label_set_catalogue_mismatch` (the label set is not the one buildLabelSet
 * derives from this catalogue) and `limits_invalid`.
 *
 * @param {unknown} evidence
 * @param {{catalogue: object, labelSet: object, limits: {maxExcerptUtf8Bytes: number}}} context
 * @returns {Promise<Readonly<{ok: boolean, errors: ReadonlyArray<{path: string, code: string, detail: string | null}>}>>}
 */
export async function validateEvidence(evidence, context) {
  const errors = new ErrorList();
  const { catalogue, labelSet, limits } = isPlainObject(context) ? context : {};

  if (!validateCatalogue(catalogue).ok) {
    errors.add("context.catalogue", "catalogue_invalid", "the catalogue does not validate");
    return errors.result();
  }
  if (!validateLabelSet(labelSet).ok) {
    errors.add("context.labelSet", "label_set_invalid", "the label set does not validate");
    return errors.result();
  }
  const [catalogueSha256, labelSetSha256, expectedLabelSetSha256] = await Promise.all([
    catalogueDigest(catalogue),
    labelSetDigest(labelSet),
    labelSetDigest(buildLabelSet(catalogue)),
  ]);
  if (labelSetSha256 !== expectedLabelSetSha256) {
    errors.add("context.labelSet", "label_set_catalogue_mismatch", "not the label set built from this catalogue");
    return errors.result();
  }
  const maxBytes = isPlainObject(limits) ? limits.maxExcerptUtf8Bytes : undefined;
  if (!isPlainObject(limits) || Object.keys(limits).some((k) => k !== "maxExcerptUtf8Bytes")
    || !Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    errors.add("context.limits", "limits_invalid", "expected { maxExcerptUtf8Bytes: positive integer }");
    return errors.result();
  }

  if (!isPlainObject(evidence)) {
    errors.add("$", "type", "expected an object");
    return errors.result();
  }
  scanForbiddenKeys(evidence, "$", "evidence", errors);
  checkKeys(evidence, TOP_KEYS, [], "$", errors, "evidence");
  if (evidence.schema !== SCHEMAS.evidence) errors.add("$.schema", "schema_mismatch", String(evidence.schema));

  checkAdapter(evidence.adapter, errors);
  checkExcerpt(evidence.excerpt, maxBytes, errors);
  checkScores(evidence.subjects, "$.subjects", new Set(catalogue.subjects.map((s) => s.slug)), errors);
  checkScores(evidence.families, "$.families", new Set(catalogue.families.map((f) => f.id)), errors);
  checkFlags(evidence.flags, errors);

  for (const key of ["labelSetVersion", "labelSetSha256", "catalogueSha256"]) {
    if (key in evidence && typeof evidence[key] !== "string") errors.add(`$.${key}`, "type", "expected a string");
  }
  if (typeof evidence.labelSetVersion === "string" && evidence.labelSetVersion !== labelSet.labelSetVersion) {
    errors.add("$.labelSetVersion", "label_set_version_mismatch", evidence.labelSetVersion);
  }
  if (typeof evidence.labelSetSha256 === "string" && evidence.labelSetSha256 !== labelSetSha256) {
    errors.add("$.labelSetSha256", "label_set_hash_mismatch", "does not match the current label set");
  }
  if (typeof evidence.catalogueSha256 === "string" && evidence.catalogueSha256 !== catalogueSha256) {
    errors.add("$.catalogueSha256", "catalogue_hash_mismatch", "does not match the current catalogue");
  }
  return errors.result();
}

/** @param {unknown} adapter @param {ErrorList} errors */
function checkAdapter(adapter, errors) {
  if (adapter === undefined) return; // reported as missing_field
  if (!isPlainObject(adapter)) {
    errors.add("$.adapter", "type", "expected an object");
    return;
  }
  checkKeys(adapter, ADAPTER_KEYS, [], "$.adapter", errors, "evidence");
  for (const key of ADAPTER_KEYS) {
    if (key in adapter && !isOpaqueString(adapter[key])) errors.add(`$.adapter.${key}`, "type", "expected an opaque string");
  }
}

/** @param {unknown} excerpt @param {number} maxBytes @param {ErrorList} errors */
function checkExcerpt(excerpt, maxBytes, errors) {
  if (excerpt === undefined) return;
  if (!isPlainObject(excerpt)) {
    errors.add("$.excerpt", "type", "expected an object");
    return;
  }
  checkKeys(excerpt, EXCERPT_KEYS, [], "$.excerpt", errors, "evidence");
  if ("version" in excerpt && !isOpaqueString(excerpt.version)) errors.add("$.excerpt.version", "type", "expected an opaque string");
  if ("truncated" in excerpt && typeof excerpt.truncated !== "boolean") errors.add("$.excerpt.truncated", "type", "expected boolean");
  let counts = true;
  for (const key of ["utf8Bytes", "codePoints"]) {
    if (!(key in excerpt)) {
      counts = false;
      continue;
    }
    const v = excerpt[key];
    if (typeof v !== "number") {
      errors.add(`$.excerpt.${key}`, "type", "expected a number");
      counts = false;
    } else if (!Number.isFinite(v)) {
      errors.add(`$.excerpt.${key}`, "non_finite", String(v));
      counts = false;
    } else if (!Number.isSafeInteger(v) || v < 0) {
      errors.add(`$.excerpt.${key}`, "out_of_range", "expected a non-negative integer");
      counts = false;
    }
  }
  if (!counts) return;
  if (excerpt.utf8Bytes > maxBytes) errors.add("$.excerpt.utf8Bytes", "excerpt_oversize", `${excerpt.utf8Bytes} > ${maxBytes}`);
  // Each code point is 1..4 UTF-8 bytes.
  if (excerpt.codePoints > excerpt.utf8Bytes || excerpt.utf8Bytes > 4 * excerpt.codePoints) {
    errors.add("$.excerpt", "excerpt_inconsistent", "utf8Bytes must be between codePoints and 4 x codePoints");
  }
}

/**
 * @param {unknown} list
 * @param {string} path
 * @param {Set<string>} known
 * @param {ErrorList} errors
 */
function checkScores(list, path, known, errors) {
  if (list === undefined) return;
  if (!Array.isArray(list)) {
    errors.add(path, "type", "expected an array");
    return;
  }
  /** @type {Map<string, unknown>} */
  const seen = new Map();
  list.forEach((entry, i) => {
    const p = `${path}[${i}]`;
    if (!isPlainObject(entry)) {
      errors.add(p, "type", "expected { label, score }");
      return;
    }
    checkKeys(entry, SCORE_KEYS, [], p, errors, "evidence");
    if ("label" in entry) {
      if (typeof entry.label !== "string") errors.add(`${p}.label`, "type", "expected a string");
      else if (!known.has(entry.label)) errors.add(`${p}.label`, "unknown_label", entry.label);
      else if (seen.has(entry.label)) {
        const same = Object.is(seen.get(entry.label), entry.score);
        errors.add(`${p}.label`, "duplicate_label", `${entry.label} (${same ? "identical" : "contradictory"})`);
      } else seen.set(entry.label, entry.score);
    }
    if ("score" in entry) checkScore(entry.score, `${p}.score`, errors);
  });
}

/** @param {unknown} flags @param {ErrorList} errors */
function checkFlags(flags, errors) {
  if (flags === undefined) return;
  if (!isPlainObject(flags)) {
    errors.add("$.flags", "type", "expected an object");
    return;
  }
  checkKeys(flags, FLAG_LABELS, [], "$.flags", errors, "evidence");
  for (const key of FLAG_LABELS) if (key in flags) checkScore(flags[key], `$.flags.${key}`, errors);
}

/** @param {unknown} v @param {string} path @param {ErrorList} errors */
function checkScore(v, path, errors) {
  if (typeof v !== "number") errors.add(path, "type", "expected a number");
  else if (!Number.isFinite(v)) errors.add(path, "non_finite", String(v));
  else if (v < 0 || v > 1) errors.add(path, "out_of_range", String(v));
}
