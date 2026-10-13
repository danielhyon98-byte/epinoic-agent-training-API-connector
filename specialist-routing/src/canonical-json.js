/**
 * Canonical JSON used for every digest in this package.
 * @module canonical-json
 */

import { isPlainObject } from "./util.js";

/**
 * Serialise a JSON value canonically: object keys sorted by UTF-16 code unit
 * order (the default JavaScript sort), no whitespace, strings and numbers as
 * `JSON.stringify` writes them (lone surrogates are escaped, `-0` becomes `0`).
 *
 * Strict: throws `TypeError` for anything that is not plain JSON, namely
 * `undefined` (including as an object value), functions, symbols, bigints,
 * `NaN`, `Infinity`, sparse arrays, cycles and non-plain objects such as
 * `Date` or `Map`. Such values could otherwise hash ambiguously.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function canonicalJson(value) {
  return encode(value, new Set(), "$");
}

/**
 * @param {unknown} value
 * @param {Set<object>} stack
 * @param {string} path
 * @returns {string}
 */
function encode(value, stack, path) {
  if (value === null) return "null";
  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value)) throw new TypeError(`canonicalJson: non-finite number at ${path}`);
      return JSON.stringify(value);
    case "string":
      return JSON.stringify(value);
    case "object":
      break;
    default:
      throw new TypeError(`canonicalJson: unsupported ${typeof value} at ${path}`);
  }
  if (stack.has(value)) throw new TypeError(`canonicalJson: cycle at ${path}`);
  stack.add(value);
  let out;
  if (Array.isArray(value)) {
    const parts = [];
    for (let i = 0; i < value.length; i += 1) {
      if (!(i in value)) throw new TypeError(`canonicalJson: sparse array at ${path}[${i}]`);
      parts.push(encode(value[i], stack, `${path}[${i}]`));
    }
    out = `[${parts.join(",")}]`;
  } else if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    const parts = keys.map((key) => `${JSON.stringify(key)}:${encode(value[key], stack, `${path}.${key}`)}`);
    out = `{${parts.join(",")}}`;
  } else {
    throw new TypeError(`canonicalJson: non-plain object at ${path}`);
  }
  stack.delete(value);
  return out;
}
