/**
 * URL detection shared by the url-policy and sources-line checks.
 * Detects exactly the three forms in contract section 8: "scheme://",
 * "www." and a bare domain followed by a path ("example.org/page").
 * Not detected (by design, to avoid false positives in STEM and networking
 * answers): bare IP addresses or IP/CIDR ("192.168.1.10", "10.0.0.0/8"), bare
 * domains without a path ("example.org"), e-mail addresses and "mailto:".
 * A heuristic, not a URL parser.
 * @module gate/url-scan
 */

import { normaliseForScan } from "./text-scan.js";

const URL_PATTERNS = Object.freeze([
  /\b[a-z][a-z0-9+.-]*:\/\//i,
  /\bwww\./i,
  /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\/\S*/i,
]);

/**
 * True when the text appears to contain a URL.
 * @param {string} text
 */
export function containsUrl(text) {
  const t = normaliseForScan(text);
  return URL_PATTERNS.some((re) => re.test(t));
}
