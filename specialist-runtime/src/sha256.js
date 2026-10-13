/**
 * Canonical SHA-256 helper: lowercase hex over exact bytes, via WebCrypto.
 * @module sha256
 */

import { utf8Encode } from "./text.js";

const HEX = "0123456789abcdef";

/**
 * SHA-256 of exact bytes as 64 lowercase hex characters.
 * @param {Uint8Array} bytes
 * @returns {Promise<string>}
 */
export async function sha256Hex(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError("sha256Hex expects a Uint8Array");
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes));
  let out = "";
  for (const b of digest) out += HEX[b >> 4] + HEX[b & 15];
  return out;
}

/**
 * SHA-256 of the UTF-8 encoding of `text`.
 * @param {string} text
 * @returns {Promise<string>}
 */
export function sha256HexOfText(text) {
  return sha256Hex(utf8Encode(text));
}
