/**
 * SpecialistTurnResult construction (contract section 7).
 * @module result
 */

import { OUTCOMES, RUNTIME_CONTRACT_VERSION, SCHEMAS } from "./constants.js";

/**
 * @typedef {{ stage: "precondition" | "authorization" | "generation" | "completion" | "gate", code: string }} Failure
 * @typedef {{ conversationId: string | number | null, turnId: string | number | null, turnVersion: string | number | null, attemptId: string | number | null }} TurnEcho
 * @typedef {Readonly<{
 *   schema: "epinoic.specialist-turn-result.v1",
 *   contractVersion: string,
 *   outcome: string,
 *   answer: string | null,
 *   failure: Failure | null,
 *   completion: { finishReason: string | null, outputUtf8Bytes: number | null },
 *   gate: import("./gate/engine.js").GateResult,
 *   usage: object | null,
 *   usageStatus: "reported" | "unknown",
 *   providerEvidence: object | null,
 *   dispatch: { callbackInvocations: 0 | 1, authorization: "not_requested" | "declined" | "admitted" | "unknown" },
 *   provenance: import("./provenance.js").Provenance,
 *   turn: TurnEcho
 * }>} SpecialistTurnResult
 */

function freezeOwn(obj) {
  return obj === null ? null : Object.freeze(obj);
}

/**
 * Build a result. The runtime's own structure is frozen; `usage` and
 * `providerEvidence` are the callback's objects, passed through by reference
 * and never modified or frozen here. `answer` is forced to null unless the
 * outcome is "answer".
 * @param {{
 *   outcome: string, answer?: string | null, failure?: Failure | null,
 *   completion?: { finishReason: string | null, outputUtf8Bytes: number | null },
 *   gate: any, usage?: object | null, providerEvidence?: object | null,
 *   dispatch: { callbackInvocations: 0 | 1, authorization: string },
 *   provenance: any, turn: TurnEcho
 * }} parts
 * @returns {SpecialistTurnResult}
 */
export function buildResult(parts) {
  if (!OUTCOMES.includes(parts.outcome)) throw new TypeError("internal: unknown outcome");
  const usage = parts.usage ?? null;
  const provenance = { ...parts.provenance, toolsRun: Object.freeze([]) };
  return Object.freeze({
    schema: SCHEMAS.turnResult,
    contractVersion: RUNTIME_CONTRACT_VERSION,
    outcome: parts.outcome,
    answer: parts.outcome === "answer" && typeof parts.answer === "string" ? parts.answer : null,
    failure: freezeOwn(parts.failure ? { stage: parts.failure.stage, code: parts.failure.code } : null),
    completion: Object.freeze(parts.completion ? { ...parts.completion } : { finishReason: null, outputUtf8Bytes: null }),
    gate: parts.gate,
    usage,
    usageStatus: usage === null ? "unknown" : "reported",
    providerEvidence: parts.providerEvidence ?? null,
    dispatch: Object.freeze({ ...parts.dispatch }),
    provenance: Object.freeze(provenance),
    turn: Object.freeze({ ...parts.turn }),
  });
}
