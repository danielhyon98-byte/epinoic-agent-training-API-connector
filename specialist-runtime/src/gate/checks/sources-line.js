/**
 * sources-line: the answer's sources line follows the configured rule. A
 * sources line is a line whose trimmed text starts with the configured prefix
 * (exactly; "**Sources:**" does not count). In "exact" mode (the default) its
 * value must be exactly one of the allowed values. In "tagged-list" mode it may
 * instead list items, each tagged with how it was used (for example "supplied
 * text" or "recalled, not consulted"), so an answer can name the sources behind
 * its claims without implying that anything was retrieved. No URL ever passes.
 * @module gate/checks/sources-line
 */

import { containsUrl } from "../url-scan.js";
import { normaliseForScan, splitLines } from "../text-scan.js";

/** Most items a tagged-list sources line may carry. */
export const MAX_SOURCE_ITEMS = 20;

/**
 * Tagged-list mode: the value is "; "-separated items, each ending with one
 * configured tag in parentheses, e.g. "Fischer (1961) (recalled, not consulted)".
 * The tag makes the line say honestly how each item was used. No item may be
 * empty and none may contain a URL (checked on the whole value by the caller).
 * @param {string} value
 * @param {string[]} tags
 */
function taggedListOk(value, tags) {
  const items = value.split(";").map((i) => i.trim());
  if (items.length === 0 || items.length > MAX_SOURCE_ITEMS) return false;
  return items.every((item) => tags.some((t) => item.endsWith(`(${t})`) && item.length > t.length + 2));
}

/**
 * @param {{ prefix: string, required: boolean, allowedValues: string[], mode?: "exact" | "tagged-list", itemTags?: string[] }} cfg
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
  if (containsUrl(value)) return { status: "fail", code: "sources_line_invalid" };
  if (allowed.includes(value)) return { status: "pass", code: "sources_line_valid" };
  if ((cfg.mode ?? "exact") === "tagged-list") {
    const tags = cfg.itemTags.map(normaliseForScan);
    return taggedListOk(value, tags)
      ? { status: "pass", code: "sources_line_valid" }
      : { status: "fail", code: "sources_line_untagged_item" };
  }
  return { status: "fail", code: "sources_line_invalid" };
}
