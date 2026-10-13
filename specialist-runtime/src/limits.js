/**
 * Website-supplied limits (contract section 6). Required on every call; the
 * runtime has no defaults and never reads REPORTED_WEBSITE_LIMITS.
 * @module limits
 */

import { isPlainObject, unknownKeys } from "./util.js";

const POSITIVE = Object.freeze(["maxMessageCodePoints", "maxPreparedInputUtf8Bytes", "maxAnswerUtf8Bytes"]);
const NON_NEGATIVE = Object.freeze(["maxPriorTurns", "maxPriorTurnsUtf8Bytes"]);
const REQUIRED = Object.freeze([...POSITIVE, ...NON_NEGATIVE]);
const ALLOWED = Object.freeze([...REQUIRED, "maxOutputTokens"]);

/**
 * @typedef {Readonly<{
 *   maxMessageCodePoints: number, maxPriorTurns: number, maxPriorTurnsUtf8Bytes: number,
 *   maxPreparedInputUtf8Bytes: number, maxAnswerUtf8Bytes: number, maxOutputTokens: number | null
 * }>} Limits
 */

/**
 * Validate limits. Missing object or field: "limits_missing". Wrong type,
 * non-integer, out of range or unknown field: "limits_invalid".
 * @param {unknown} limits
 * @returns {{ code: string } | { code: null, limits: Limits }}
 */
export function validateLimits(limits) {
  if (limits === undefined || limits === null) return { code: "limits_missing" };
  if (!isPlainObject(limits)) return { code: "limits_invalid" };
  if (REQUIRED.some((k) => limits[k] === undefined || limits[k] === null)) return { code: "limits_missing" };
  if (unknownKeys(limits, ALLOWED).length > 0) return { code: "limits_invalid" };
  if (POSITIVE.some((k) => !Number.isSafeInteger(limits[k]) || limits[k] < 1)) return { code: "limits_invalid" };
  if (NON_NEGATIVE.some((k) => !Number.isSafeInteger(limits[k]) || limits[k] < 0)) return { code: "limits_invalid" };
  const out = limits.maxOutputTokens;
  if (out !== undefined && out !== null && (!Number.isSafeInteger(out) || out < 1)) return { code: "limits_invalid" };
  return {
    code: null,
    limits: Object.freeze({
      maxMessageCodePoints: limits.maxMessageCodePoints,
      maxPriorTurns: limits.maxPriorTurns,
      maxPriorTurnsUtf8Bytes: limits.maxPriorTurnsUtf8Bytes,
      maxPreparedInputUtf8Bytes: limits.maxPreparedInputUtf8Bytes,
      maxAnswerUtf8Bytes: limits.maxAnswerUtf8Bytes,
      maxOutputTokens: out ?? null,
    }),
  };
}
