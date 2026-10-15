/**
 * Text normalisation and sentence splitting used by the gate checks.
 * Deterministic, no locale data beyond String.prototype.normalize.
 * @module gate/text-scan
 */

const ZERO_WIDTH = /[\u00AD\u200B-\u200D\u2060\uFEFF]/g;
const ALL_HYPHENS = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g;
const WORD_HYPHENS = /[\u2010\u2011]/g;
const LINE_BREAK = /\r\n|\r|\n|\u2028|\u2029/;

/**
 * NFKC-normalise and drop zero-width characters, so full-width or
 * zero-width-split text cannot hide a URL or code.
 * @param {string} text
 */
export function normaliseForScan(text) {
  return text.normalize("NFKC").replace(ZERO_WIDTH, "");
}

// Superscript and subscript characters (U+00B2, U+00B3, U+00B9, U+2070-U+209C). NFKC folds
// them to plain characters, which turned the unit "K⁴" into the rule code "K4" (cycle 1,
// Physics). For code matching they keep a marker: "K⁴" -> "K^4", "H₂" -> "H_2".
const SUPERSCRIPT = /[\u00B2\u00B3\u00B9\u2070-\u207F]/g;
const SUBSCRIPT = /[\u2080-\u209C]/g;

/**
 * As normaliseForScan, and fold every dash/hyphen variant to "-" (for code matching).
 * Superscripts and subscripts are kept apart from the base text ("K⁴" is not "K4").
 * @param {string} text
 */
export function normaliseForCodes(text) {
  const marked = text
    .replace(SUPERSCRIPT, (c) => `^${c.normalize("NFKC")}`)
    .replace(SUBSCRIPT, (c) => `_${c.normalize("NFKC")}`);
  return normaliseForScan(marked).replace(ALL_HYPHENS, "-");
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

const BOUNDARY = /[.!?]+["'\u2019\u201D)\]]*(?=\s|$)/g;

function endsWithAbbreviation(line, dotIndex) {
  let start = dotIndex;
  while (start > 0 && !/\s/.test(line[start - 1])) start--;
  const token = line.slice(start, dotIndex + 1).replace(/^[("'\u2018\u201C[]+/, "");
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
