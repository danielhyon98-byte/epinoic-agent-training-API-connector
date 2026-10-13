/**
 * completeness: finishReason must be "stop" and the text non-empty.
 * An unknown finish reason is "unsupported", never an assumed pass.
 * @module gate/checks/completeness
 */

const FAIL_CODES = Object.freeze({
  length: "finish_length",
  refusal: "finish_refusal",
  content_filter: "finish_content_filter",
});

/**
 * @param {object} _cfg Active check configuration (no options).
 * @param {{ answerText: string, finishReason: unknown }} input
 * @returns {{ status: "pass" | "fail" | "unsupported", code: string }}
 */
export function completenessCheck(_cfg, { answerText, finishReason }) {
  if (finishReason === "unknown") return { status: "unsupported", code: "finish_reason_unknown" };
  if (typeof finishReason === "string" && Object.prototype.hasOwnProperty.call(FAIL_CODES, finishReason)) {
    return { status: "fail", code: FAIL_CODES[finishReason] };
  }
  if (finishReason !== "stop") return { status: "unsupported", code: "finish_reason_unrecognised" };
  if (answerText.trim().length === 0) return { status: "fail", code: "empty_output" };
  return { status: "pass", code: "complete" };
}
