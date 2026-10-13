/**
 * Small structural helpers shared by the runtime modules.
 * @module util
 */

/**
 * Freeze an object graph in place (plain objects and arrays). Returns the input.
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function deepFreeze(value) {
  const seen = new Set();
  const visit = (v) => {
    if (v === null || typeof v !== "object" || seen.has(v)) return;
    seen.add(v);
    for (const key of Object.keys(v)) visit(v[key]);
    Object.freeze(v);
  };
  visit(value);
  return value;
}

/**
 * True for objects whose prototype is Object.prototype or null (not arrays,
 * class instances or functions).
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
export function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * True for a non-null, non-array object of any prototype.
 * @param {unknown} value
 * @returns {value is object}
 */
export function isObjectRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Own enumerable keys of `obj` that are not in `allowed`.
 * @param {object} obj
 * @param {readonly string[]} allowed
 * @returns {string[]}
 */
export function unknownKeys(obj, allowed) {
  return Object.keys(obj).filter((k) => !allowed.includes(k));
}

/**
 * True when `obj` has exactly the keys in `keys` (own, enumerable), no more, no fewer.
 * @param {object} obj
 * @param {readonly string[]} keys
 */
export function hasExactKeys(obj, keys) {
  const own = Object.keys(obj);
  return own.length === keys.length && keys.every((k) => Object.prototype.hasOwnProperty.call(obj, k));
}

/**
 * @param {unknown} value
 * @returns {value is string}
 */
export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Own-property lookup in a record keyed by slug, without prototype leakage.
 * @param {object} record
 * @param {string} key
 */
export function ownValue(record, key) {
  return Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;
}

/**
 * True for a relative POSIX path with no empty, "." or ".." segments.
 * @param {unknown} value
 */
export function isSafeRelativePath(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 1024) return false;
  if (value.startsWith("/") || value.includes("\\") || value.includes("\0")) return false;
  if (/^[A-Za-z]:/.test(value)) return false;
  return value.split("/").every((seg) => seg.length > 0 && seg !== "." && seg !== "..");
}
