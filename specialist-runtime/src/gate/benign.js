/**
 * Benign allowlist for the internal-code-leakage check. A configured "code"
 * that looks like ordinary exam or history vocabulary (paper names, HL/SL,
 * years and date ranges, bracketed numbers, question-value phrases) is refused
 * by the gate config validator and by tools/extract-codes.mjs, so the code
 * pattern has to be tightened instead of flagging normal answers.
 * @module gate/benign
 */

const BENIGN_TOKEN_PATTERNS = Object.freeze([
  /^papers?\s*[1-3](?:\s*(?:\/|and|&|or)\s*[1-3])?$/i, // Paper 1, Paper 2, Papers 1/2
  /^(?:HL|SL|HL\/SL|SL\/HL|higher level|standard level)$/i,
  /^(?:IA|EE|TOK|IB)$/i,
  /^\(?\[?(?:c\.\s*)?\d{1,4}(?:\s*[-–—/]\s*\d{1,4})?\)?\]?$/, // 1917, (1917), 1914–1918, 1917/18, [15]
  /^\[?\(?\d{1,3}\s*(?:-\s*)?marks?\)?\]?$/i, // [15 marks], 15-mark
  /^(?:e\.g\.|i\.e\.|U\.S\.|U\.K\.|c\.|p\.|pp\.)$/i,
  /^\d+(?:\.\d+)?$/, // decimals and plain numbers
]);

/**
 * True when `token` is ordinary vocabulary that must never count as an
 * internal code.
 * @param {string} token
 */
export function isBenignToken(token) {
  const t = token.trim();
  return BENIGN_TOKEN_PATTERNS.some((re) => re.test(t));
}
