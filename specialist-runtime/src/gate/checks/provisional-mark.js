/**
 * provisional-mark: every awarded mark, band, level or grade mention has the
 * configured provisional label in the same sentence.
 *
 * Exempt question-value phrases (contract section 8): "worth 15 marks",
 * "a 15-mark question" (any "N-mark") and "[15 marks]". Nothing else is
 * exempt, so "Paper 2 is out of 30 marks" also needs the label: the check
 * fails closed on phrases it cannot tell apart from an award.
 *
 * Detected award mentions (case-insensitive, after removing exempt phrases):
 * "12/15" (a <= b <= 100, not a date, not "Paper 1/2"), "12 out of 15",
 * "12 marks", "band 4", "markband", "top band", "7–9 band", "level 4",
 * "grade 6", "grade A", "awarded 6", "would score 12".
 * Benign: years and ranges ("1914–1918", "1917/18"), "(1917)", "HL/SL",
 * "Higher Level", "3.5", "p. 45", "c. 1900".
 * @module gate/checks/provisional-mark
 */

import { compilePattern } from "../config.js";
import { normaliseForMarks, splitSentences } from "../text-scan.js";

const EXEMPT_PHRASES = Object.freeze([
  /\bworth\s+\d{1,3}\s+marks?\b/gi,
  /\b\d{1,3}-marks?\b/gi,
  /\[\s*\d{1,3}\s+marks?\s*\]/gi,
]);

const AWARD_PATTERNS = Object.freeze([
  /\b\d{1,3}(?:\.\d+)?\s+out\s+of\s+\d{1,3}\b/i,
  /\b\d{1,3}(?:\.\d+)?\s*marks?\b/i,
  /\b(?:mark\s*)?band\s*\d/i,
  /\bmarkbands?\b/i,
  /\b(?:top|highest|lowest|upper|lower|middle|bottom)\s+(?:mark\s*)?band\b/i,
  /\b\d{1,2}\s*[-–—]\s*\d{1,2}\s+(?:mark\s*)?band\b/i,
  /\blevel\s*\d/i,
  /\bgrade\s*(?:of\s+|:\s*)?[1-7]\b/i,
  /\b[Gg]rade\s*(?:of\s+|:\s*)?[A-E]\b/,
  /\b(?:award(?:s|ed|ing)?|scor(?:e|es|ed|ing))\s+(?:(?:it|this|that|you|a|an|the\s+\w+|your\s+\w+)\s+)?\d{1,3}\b/i,
]);

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
    if (/\d\s*\/\s*$/.test(before) || /^\s*\/\s*\d/.test(after)) continue; // part of a date like 03/12/1917
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
  return hasSlashScore(s) || AWARD_PATTERNS.some((re) => re.test(s));
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
