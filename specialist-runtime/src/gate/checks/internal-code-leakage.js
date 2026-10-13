/**
 * internal-code-leakage: no configured internal code appears in the answer.
 * Matching is exact (case-sensitive) and boundary-matched: a code is not
 * matched inside a longer alphanumeric token ("HXR-1010" does not match
 * "HXR-101"). Dash variants and zero-width characters are folded first, so
 * "HXR–101" still matches. Codes that appear in the user's own message are
 * excluded, so quoted user material is not a leak.
 * @module gate/checks/internal-code-leakage
 */

import { escapeRegExp, normaliseForCodes } from "../text-scan.js";

function boundaryPattern(code) {
  return new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(normaliseForCodes(code))}(?![A-Za-z0-9])`);
}

/**
 * @param {{ codes: string[] }} cfg
 * @param {{ answerText: string, userMessage: string }} input
 * @returns {{ status: "pass" | "fail", code: string }}
 */
export function internalCodeLeakageCheck(cfg, { answerText, userMessage }) {
  const answer = normaliseForCodes(answerText);
  const user = normaliseForCodes(userMessage);
  for (const code of cfg.codes) {
    const re = boundaryPattern(code);
    if (re.test(user)) continue;
    if (re.test(answer)) return { status: "fail", code: "internal_code_present" };
  }
  return { status: "pass", code: "no_internal_code" };
}
