/**
 * sources-line: the answer's sources line follows the configured rule. A
 * sources line is a line whose trimmed text starts with the configured prefix
 * (exactly; "**Sources:**" does not count). Its value must be exactly one of
 * the allowed values, which the config validator guarantees contain no URL,
 * so in no-tools mode the line can list no URLs or references.
 * @module gate/checks/sources-line
 */

import { containsUrl } from "../url-scan.js";
import { normaliseForScan, splitLines } from "../text-scan.js";

/**
 * @param {{ prefix: string, required: boolean, allowedValues: string[] }} cfg
 * @param {{ answerText: string }} input
 * @returns {{ status: "pass" | "fail", code: string }}
 */
export function sourcesLineCheck(cfg, { answerText }) {
  const lines = splitLines(normaliseForScan(answerText))
    .map((l) => l.trim())
    .filter((l) => l.startsWith(cfg.prefix));
  if (lines.length === 0) {
    return cfg.required ? { status: "fail", code: "sources_line_missing" } : { status: "pass", code: "sources_line_absent_allowed" };
  }
  if (lines.length > 1) return { status: "fail", code: "sources_line_duplicate" };
  const value = lines[0].slice(cfg.prefix.length).trim();
  const allowed = cfg.allowedValues.map(normaliseForScan);
  if (containsUrl(value) || !allowed.includes(value)) return { status: "fail", code: "sources_line_invalid" };
  return { status: "pass", code: "sources_line_valid" };
}
