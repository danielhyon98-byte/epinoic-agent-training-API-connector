/**
 * provisional-mark: every awarded mark, band, level or grade mention has the
 * configured provisional label in the same sentence.
 *
 * Exempt question-value phrases (contract section 8): "worth 15 marks",
 * "a 15-mark question" (any "N-mark") and "[15 marks]". They are blanked out
 * before anything else is matched.
 *
 * Award mentions are detected in two tiers (case-insensitive):
 *
 * 1. Assessment-specific forms, always a mention: "12 marks", "band 4",
 *    "mark band 4", "markband", "grade 6", "grade A", "awarded 6",
 *    "would score 12".
 * 2. Forms that are ordinary in STEM or general text ("3/4", "5 out of 7",
 *    "level 3", "top band", "7–9 band"): a mention ONLY when the same sentence
 *    also has an assessment cue ("mark", "markband", "score", "award",
 *    "grade", "criterion", "rubric", "assessment", "achievement level",
 *    "give this/it", "you would get/earn/achieve", ...). So "1/2 + 1/4 = 3/4",
 *    "x = 3/4", "at the 5% significance level", "sea level rose 0.2 m" and
 *    "level 3 of the menu" are not mentions, while "Provisional mark: 5/7"
 *    and "I'd give this 5 out of 7" are.
 *
 * Known limits (fail-closed or fail-open, see README "Limitations"):
 * "Paper 2 is out of 30 marks" and "grade 6 students" are treated as awards;
 * "you got 5/7" without a cue word and "this is a level 4 response" are not.
 * @module gate/checks/provisional-mark
 */

import { compilePattern } from "../config.js";
import { normaliseForMarks, splitSentences } from "../text-scan.js";

const EXEMPT_PHRASES = Object.freeze([
  /\bworth\s+\d{1,3}\s+marks?\b/gi,
  /\b\d{1,3}-marks?\b/gi,
  /\[\s*\d{1,3}\s+marks?\s*\]/gi,
]);

/** Tier 1: assessment-specific, always an award mention. */
const ASSESSMENT_SPECIFIC = Object.freeze([
  /\b\d{1,3}(?:\.\d+)?\s*marks?\b/i,
  /\b(?:mark\s*)?band\s*\d/i,
  /\bmarkbands?\b/i,
  /\bgrade\s*(?:of\s+|:\s*)?[1-7]\b/i,
  /\b[Gg]rade\s*(?:of\s+|:\s*)?[A-E]\b/,
  /\b(?:award(?:s|ed|ing)?|scor(?:e|es|ed|ing))\s+(?:(?:it|this|that|you|a|an|the\s+\w+|your\s+\w+)\s+)?\d{1,3}\b/i,
]);

/** Tier 2: ambiguous outside assessment, a mention only with an assessment cue. */
const CONTEXT_DEPENDENT = Object.freeze([
  /\b\d{1,3}(?:\.\d+)?\s+out\s+of\s+\d{1,3}\b/i,
  /\blevel\s*\d/i,
  /\b(?:top|highest|lowest|upper|lower|middle|bottom)\s+(?:mark\s*)?band\b/i,
  /\b\d{1,2}\s*[-–—]\s*\d{1,2}\s+(?:mark\s*)?band\b/i,
]);

const ASSESSMENT_CUE = new RegExp(
  [
    String.raw`\b(?:marks?|mark\s*scheme|markbands?|scor(?:e|es|ed|ing)|award(?:s|ed|ing)?|grade[sd]?|grading|criteri(?:on|a)|rubric|assess(?:ed|ing|ment)?|achievement\s+levels?|level\s+descriptors?)\b`,
    String.raw`\b(?:give|gives|giving|gave)\s+(?:this|it|that|you)\b`,
    String.raw`\b(?:you|this|it|that)\s+(?:would\s+|might\s+|could\s+|will\s+|should\s+)?(?:get|gets|got|earn|earns|earned|receive|receives|received|achieve|achieves|achieved|deserve|deserves|deserved)\b`,
  ].join("|"),
  "i",
);

const SLASH_SCORE = /\b(\d{1,3})\s*\/\s*(\d{1,3})\b/g;

function blank(text, re) {
  return text.replace(re, (m) => " ".repeat(m.length));
}

function hasSlashScore(sentence) {
  SLASH_SCORE.lastIndex = 0;
  let m;
  while ((m = SLASH_SCORE.exec(sentence)) !== null) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    const before = sentence.slice(0, m.index);
    const after = sentence.slice(m.index + m[0].length);
    if (/\d\s*\/\s*$/.test(before) || /^\s*\/\s*\d/.test(after)) continue; // a date such as 03/12/1917
    if (/\bpapers?\s*$/i.test(before)) continue; // "Paper 1/2"
    if (b > 0 && b <= 100 && a <= b) return true;
  }
  return false;
}

/**
 * True when the sentence mentions an awarded mark, band, level or grade.
 * @param {string} sentence
 */
export function mentionsAward(sentence) {
  let s = normaliseForMarks(sentence);
  for (const re of EXEMPT_PHRASES) s = blank(s, re);
  if (ASSESSMENT_SPECIFIC.some((re) => re.test(s))) return true;
  if (!ASSESSMENT_CUE.test(s)) return false;
  return hasSlashScore(s) || CONTEXT_DEPENDENT.some((re) => re.test(s));
}

/**
 * @param {{ labelPattern: { source: string, flags: string } }} cfg
 * @param {{ answerText: string }} input
 * @returns {{ status: "pass" | "fail" | "unsupported", code: string }}
 */
export function provisionalMarkCheck(cfg, { answerText }) {
  const label = compilePattern(cfg.labelPattern);
  if (label === null) return { status: "unsupported", code: "label_pattern_invalid" };
  let mentions = 0;
  for (const sentence of splitSentences(answerText)) {
    if (!mentionsAward(sentence)) continue;
    mentions++;
    if (!label.test(normaliseForMarks(sentence))) return { status: "fail", code: "provisional_label_missing" };
  }
  return mentions === 0
    ? { status: "pass", code: "no_awarded_marks" }
    : { status: "pass", code: "provisional_labels_present" };
}
