/**
 * Text normalisation and sentence splitting used by the gate checks.
 * Deterministic, no locale data beyond String.prototype.normalize.
 * @module gate/text-scan
 */

const ZERO_WIDTH = /[­​-‍⁠﻿]/g;
const ALL_HYPHENS = /[‐-―−﹘﹣－]/g;
const WORD_HYPHENS = /[‐‑]/g;
const LINE_BREAK = /\r\n|\r|\n| | /;

/**
 * NFKC-normalise and drop zero-width characters, so full-width or
 * zero-width-split text cannot hide a URL or code.
 * @param {string} text
 */
export function normaliseForScan(text) {
  return text.normalize("NFKC").replace(ZERO_WIDTH, "");
}

/**
 * As normaliseForScan, and fold every dash/hyphen variant to "-" (for code matching).
 * @param {string} text
 */
export function normaliseForCodes(text) {
  return normaliseForScan(text).replace(ALL_HYPHENS, "-");
}

/**
 * As normaliseForScan, and fold word hyphens (U+2010, U+2011) to "-", leaving
 * en and em dashes in ranges such as "7–9" untouched.
 * @param {string} text
 */
export function normaliseForMarks(text) {
  return normaliseForScan(text).replace(WORD_HYPHENS, "-");
}

/**
 * Split text into lines.
 * @param {string} text
 */
export function splitLines(text) {
  return text.split(LINE_BREAK);
}

const ABBREVIATIONS = new Set([
  "e.g.", "i.e.", "cf.", "c.", "ca.", "p.", "pp.", "vs.", "v.", "no.", "nos.", "vol.", "vols.", "ed.", "eds.",
  "fig.", "approx.", "mr.", "mrs.", "ms.", "dr.", "st.", "gen.", "col.", "lt.", "capt.", "sgt.", "prof.",
  "jr.", "sr.", "u.s.", "u.k.", "u.s.s.r.", "a.d.", "b.c.", "b.c.e.", "c.e.", "a.m.", "p.m.", "al.", "b.",
  "d.", "r.", "ch.", "sec.",
]);

const BOUNDARY = /[.!?]+["'’”)\]]*(?=\s|$)/g;

function endsWithAbbreviation(line, dotIndex) {
  let start = dotIndex;
  while (start > 0 && !/\s/.test(line[start - 1])) start--;
  const token = line.slice(start, dotIndex + 1).replace(/^[("'‘“[]+/, "");
  if (/^[A-Z]\.$/.test(token)) return true; // an initial, as in "J. F. Kennedy"
  return ABBREVIATIONS.has(token.toLowerCase());
}

/**
 * Split text into sentences. Every line break ends a sentence. Within a line,
 * ".", "!" or "?" followed by whitespace ends a sentence, except after common
 * abbreviations ("e.g.", "i.e.", "U.S.", "c.", "p.") and initials. Decimals such
 * as "3.5" never split. This is a heuristic.
 * @param {string} text
 * @returns {string[]}
 */
export function splitSentences(text) {
  const out = [];
  for (const line of splitLines(text)) {
    let start = 0;
    BOUNDARY.lastIndex = 0;
    let m;
    while ((m = BOUNDARY.exec(line)) !== null) {
      if (m[0] === "." && endsWithAbbreviation(line, m.index)) continue;
      out.push(line.slice(start, m.index + m[0].length));
      start = m.index + m[0].length;
    }
    if (start < line.length) out.push(line.slice(start));
  }
  return out.map((s) => s.trim()).filter((s) => s.length > 0);
}

/**
 * Escape a literal for use inside a RegExp.
 * @param {string} literal
 */
export function escapeRegExp(literal) {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
