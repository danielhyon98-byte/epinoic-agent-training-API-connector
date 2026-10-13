/**
 * URL detection shared by the url-policy and sources-line checks.
 * Detects "scheme://", "www.", "mailto:", a bare domain followed by a path,
 * and an IPv4 address followed by a path. A heuristic, not a URL parser.
 * @module gate/url-scan
 */

import { normaliseForScan } from "./text-scan.js";

const URL_PATTERNS = Object.freeze([
  /\b[a-z][a-z0-9+.-]*:\/\//i,
  /\bwww\./i,
  /\bmailto:/i,
  /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\/\S*/i,
  /\b\d{1,3}(?:\.\d{1,3}){3}(?::\d{1,5})?\/\S*/,
]);

/**
 * True when the text appears to contain a URL.
 * @param {string} text
 */
export function containsUrl(text) {
  const t = normaliseForScan(text);
  return URL_PATTERNS.some((re) => re.test(t));
}
