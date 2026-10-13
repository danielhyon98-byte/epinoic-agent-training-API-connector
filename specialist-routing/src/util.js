/**
 * Small shared helpers: shape checks, error collection, freezing.
 * Portable: no host APIs beyond the language itself and TextEncoder.
 * @module util
 */

export const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const HEX64_RE = /^[0-9a-f]{64}$/;
export const HEX40_RE = /^[0-9a-f]{40}$/;
export const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/** Longest opaque identifier (adapter id, versions, record ids) accepted anywhere. */
export const MAX_OPAQUE_LENGTH = 128;

const utf8 = new TextEncoder();

/** @param {string} text @returns {number} UTF-8 byte length */
export function utf8Length(text) {
  return utf8.encode(text).length;
}

/** @param {unknown} value @returns {value is Record<string, unknown>} */
export function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** @param {unknown} value @returns {boolean} non-empty string no longer than MAX_OPAQUE_LENGTH */
export function isOpaqueString(value) {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_OPAQUE_LENGTH;
}

/** @param {unknown} value @returns {boolean} non-empty string after trimming */
export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Normalise an alias or term: NFKC, lower case, trimmed, single spaces.
 * Catalogue aliases must already be in this form.
 * @param {string} text
 * @returns {string}
 */
export function normaliseTerm(text) {
  return text.normalize("NFKC").toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Recursively freeze a JSON-like value in place and return it.
 * @template T
 * @param {T} value
 * @returns {Readonly<T>}
 */
export function deepFreeze(value) {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze(value[key]);
  }
  return value;
}

/**
 * Collects validation errors as `{ path, code, detail }` and produces a frozen
 * `{ ok, errors }` result.
 */
export class ErrorList {
  constructor() {
    /** @type {{path: string, code: string, detail: string | null}[]} */
    this.items = [];
  }

  /** @param {string} path @param {string} code @param {string} [detail] */
  add(path, code, detail) {
    this.items.push({ path, code, detail: detail === undefined ? null : String(detail) });
  }

  get ok() {
    return this.items.length === 0;
  }

  /** @returns {Readonly<{ok: boolean, errors: ReadonlyArray<{path: string, code: string, detail: string | null}>}>} */
  result() {
    return deepFreeze({ ok: this.ok, errors: this.items.map((e) => ({ ...e })) });
  }
}

/**
 * Lower-case a key and drop separators, for forbidden-field matching.
 * @param {string} key
 */
function squash(key) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Keys that must never appear in a catalogue: provider, model, key, enablement. */
const CATALOGUE_FORBIDDEN = /(provider|model|apikey|secret|password|credential|token|enabled|enablement|enable|availab|deploy)/;

/** Keys that must never appear in evidence: routing directives as well as the above. */
const EVIDENCE_FORBIDDEN = /(route|routing|override|slug|specialist|agent|target|model|provider|apikey|secret|token|enabled|enable|availab)/;

/**
 * True when a key names something this package must not carry.
 * @param {string} key
 * @param {"catalogue" | "evidence"} context
 */
export function isForbiddenKey(key, context) {
  const s = squash(key);
  if (s === "key" || s === "keys" || s.endsWith("key")) return true;
  return (context === "evidence" ? EVIDENCE_FORBIDDEN : CATALOGUE_FORBIDDEN).test(s);
}

/**
 * Walk every key of a JSON-like value and report forbidden keys with their paths.
 * @param {unknown} value
 * @param {string} path
 * @param {"catalogue" | "evidence"} context
 * @param {ErrorList} errors
 */
export function scanForbiddenKeys(value, path, context, errors) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => scanForbiddenKeys(item, `${path}[${i}]`, context, errors));
  } else if (value !== null && typeof value === "object") {
    for (const key of Object.keys(value)) {
      const child = `${path}.${key}`;
      if (isForbiddenKey(key, context)) errors.add(child, "forbidden_field", key);
      scanForbiddenKeys(value[key], child, context, errors);
    }
  }
}

/**
 * Check that an object has exactly the allowed keys. Unknown keys are reported
 * as `unknown_field` unless they are forbidden (reported separately by
 * scanForbiddenKeys). Missing required keys are reported as `missing_field`.
 * @param {Record<string, unknown>} obj
 * @param {readonly string[]} required
 * @param {readonly string[]} optional
 * @param {string} path
 * @param {ErrorList} errors
 * @param {"catalogue" | "evidence" | null} [forbiddenContext]
 */
export function checkKeys(obj, required, optional, path, errors, forbiddenContext = null) {
  for (const key of Object.keys(obj)) {
    if (required.includes(key) || optional.includes(key)) continue;
    if (forbiddenContext && isForbiddenKey(key, forbiddenContext)) continue;
    errors.add(`${path}.${key}`, "unknown_field", key);
  }
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(obj, key) || obj[key] === undefined) {
      errors.add(`${path}.${key}`, "missing_field", key);
    }
  }
}

/**
 * Report duplicate strings in a list.
 * @param {readonly string[]} list
 * @param {string} path
 * @param {string} code
 * @param {ErrorList} errors
 */
export function checkUnique(list, path, code, errors) {
  const seen = new Set();
  for (const item of list) {
    if (seen.has(item)) errors.add(path, code, item);
    seen.add(item);
  }
}

/**
 * Validate an array of normalised, unique, non-empty strings.
 * @param {unknown} value
 * @param {string} path
 * @param {ErrorList} errors
 * @param {{ min?: number, maxLength?: number }} [opts]
 * @returns {string[]} the valid strings (possibly empty)
 */
export function checkTermList(value, path, errors, { min = 0, maxLength = 64 } = {}) {
  if (!Array.isArray(value)) {
    errors.add(path, "type", "expected array of strings");
    return [];
  }
  if (value.length < min) errors.add(path, "too_few", `at least ${min}`);
  const out = [];
  value.forEach((term, i) => {
    if (typeof term !== "string" || term.length === 0 || term.length > maxLength) {
      errors.add(`${path}[${i}]`, "type", `expected a string of 1..${maxLength} characters`);
    } else if (term !== normaliseTerm(term)) {
      errors.add(`${path}[${i}]`, "not_normalised", term);
    } else {
      out.push(term);
    }
  });
  checkUnique(out, path, "duplicate_term", errors);
  return out;
}

/** @param {unknown} value @returns {boolean} a relative POSIX path without '..' or empty segments */
export function isSafeRelativePath(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 512) return false;
  if (value.startsWith("/") || value.includes("\\") || value.includes("\0")) return false;
  return value.split("/").every((seg) => seg.length > 0 && seg !== "." && seg !== "..");
}
