/**
 * UTF-8 and base64 helpers. Portable: TextEncoder, TextDecoder, atob and btoa only.
 * @module text
 */

const encoder = new TextEncoder();

const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

/**
 * Encode a string as UTF-8 bytes.
 * @param {string} text
 * @returns {Uint8Array}
 */
export function utf8Encode(text) {
  return encoder.encode(text);
}

/**
 * Number of UTF-8 bytes `text` encodes to (lone surrogates count as U+FFFD, as
 * TextEncoder would encode them).
 * @param {string} text
 * @returns {number}
 */
export function utf8ByteLength(text) {
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 0x80) n += 1;
    else if (c < 0x800) n += 2;
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < text.length && (text.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
      n += 4;
      i++;
    } else n += 3;
  }
  return n;
}

/**
 * True when the string has no lone surrogates, so UTF-8 encoding is lossless.
 * @param {string} text
 */
export function isWellFormed(text) {
  return !LONE_SURROGATE.test(text);
}

/**
 * Number of Unicode code points in a well-formed string.
 * @param {string} text
 */
export function codePointLength(text) {
  let n = 0;
  for (const _ of text) n++;
  return n;
}

/**
 * Strict UTF-8 decode. Throws TypeError on invalid UTF-8. A leading BOM is kept
 * in the returned string (ignoreBOM: true), so re-encoding reproduces the bytes.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function decodeUtf8Strict(bytes) {
  return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
}

const BASE64_CANONICAL = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

/**
 * Encode bytes as standard padded base64.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function encodeBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Strict base64 decode: standard alphabet, padded, no whitespace, canonical
 * (re-encoding must reproduce the input). Returns null when invalid.
 * @param {unknown} text
 * @returns {Uint8Array | null}
 */
export function decodeBase64Strict(text) {
  if (typeof text !== "string" || text.length === 0 || !BASE64_CANONICAL.test(text)) return null;
  let binary;
  try {
    binary = atob(text);
  } catch {
    return null;
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return encodeBase64(bytes) === text ? bytes : null;
}

/**
 * Byte-wise equality.
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 */
export function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
