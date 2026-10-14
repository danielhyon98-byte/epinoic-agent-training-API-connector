/**
 * One-turn bridge (contract section 7). Every precondition is checked before
 * the injected callback; an admitted turn calls it at most once; there is no
 * retry, fallback, revision or second call on any path. runSpecialistTurn
 * never throws: every path resolves to a SpecialistTurnResult.
 * @module bridge
 */

import { CODE_PATTERN, FINISH_REASONS } from "./constants.js";
import { notRunGate, runGateWith } from "./gate/engine.js";
import { prepareInternal } from "./prepare.js";
import { buildProvenance } from "./provenance.js";
import { buildResult } from "./result.js";
import { isWellFormed, utf8ByteLength } from "./text.js";
import { hasExactKeys, isObjectRecord, isPlainObject, unknownKeys } from "./util.js";

const PREPARE_KEYS = Object.freeze(["slug", "mode", "environment", "bundle", "message", "priorTurns", "limits"]);
const BRIDGE_KEYS = Object.freeze([...PREPARE_KEYS, "turn", "authorizedGenerate", "signal"]);
const TURN_KEYS = Object.freeze(["conversationId", "turnId", "turnVersion", "attemptId"]);
const VIOLATION = Object.freeze({ kind: "violation" });
const ABORTED_BEFORE = Object.freeze({ stage: "precondition", code: "aborted_before_dispatch" });
const ABORTED_AFTER = Object.freeze({ stage: "generation", code: "aborted_after_callback" });

function isTurnValue(v) {
  return (typeof v === "string" && v.length > 0 && v.length <= 256) || (Number.isSafeInteger(v) && v >= 0);
}

function isValidTurn(turn) {
  return isPlainObject(turn) && hasExactKeys(turn, TURN_KEYS) && TURN_KEYS.every((k) => isTurnValue(turn[k]));
}

/** Echo the website-owned turn identifiers unchanged; non-primitive values become null. */
function echoTurn(turn) {
  const pick = (v) => (typeof v === "string" || (typeof v === "number" && Number.isFinite(v)) ? v : null);
  const src = isPlainObject(turn) ? turn : {};
  return {
    conversationId: pick(src.conversationId),
    turnId: pick(src.turnId),
    turnVersion: pick(src.turnVersion),
    attemptId: pick(src.attemptId),
  };
}

function isAbortSignal(signal) {
  return typeof AbortSignal === "function" && signal instanceof AbortSignal;
}

function isNullableRecord(v) {
  return v === null || isObjectRecord(v);
}

/**
 * Validate the callback's reply against the three allowed shapes. Each field
 * is read once. Extra keys anywhere (including any tool-call field) or a
 * finish reason outside the closed set are contract violations.
 * @param {unknown} reply
 */
export function parseReply(reply) {
  try {
    if (!isPlainObject(reply)) return VIOLATION;
    const status = reply.status;
    if (status === "declined") {
      if (!hasExactKeys(reply, ["status", "reason"])) return VIOLATION;
      const reason = reply.reason;
      return typeof reason === "string" && CODE_PATTERN.test(reason) ? { kind: "declined", reason } : VIOLATION;
    }
    if (status === "completed") {
      if (!hasExactKeys(reply, ["status", "output", "usage", "providerEvidence"])) return VIOLATION;
      const { output, usage, providerEvidence } = reply;
      if (!isPlainObject(output) || !hasExactKeys(output, ["text", "finishReason"])) return VIOLATION;
      const { text, finishReason } = output;
      if (typeof text !== "string" || !isWellFormed(text) || !FINISH_REASONS.includes(finishReason)) return VIOLATION;
      if (!isNullableRecord(usage) || !isNullableRecord(providerEvidence)) return VIOLATION;
      return { kind: "completed", text, finishReason, usage, providerEvidence };
    }
    if (status === "failed") {
      if (!hasExactKeys(reply, ["status", "error", "usage", "providerEvidence"])) return VIOLATION;
      const { error, usage, providerEvidence } = reply;
      if (!isPlainObject(error) || !hasExactKeys(error, ["code"])) return VIOLATION;
      const code = error.code;
      if (typeof code !== "string" || !CODE_PATTERN.test(code)) return VIOLATION;
      if (!isNullableRecord(usage) || !isNullableRecord(providerEvidence)) return VIOLATION;
      return { kind: "failed", code, usage, providerEvidence };
    }
    return VIOLATION;
  } catch {
    return VIOLATION;
  }
}

function pickPrepareInput(input) {
  const out = {};
  for (const k of PREPARE_KEYS) if (Object.prototype.hasOwnProperty.call(input, k)) out[k] = input[k];
  return out;
}

/** Outcome for a completed reply, in the order of the contract's table. */
function decideCompleted(ctx, parsed, st, message) {
  const { text, finishReason } = parsed;
  const bytes = utf8ByteLength(text);
  const completion = { finishReason, outputUtf8Bytes: bytes };
  const { entry, gateConfig, limits } = st.resolved;
  const notRun = notRunGate(entry.gateVersion, gateConfig.configVersion);
  const done = (outcome, failure, gate = notRun, answer = null) => ({ outcome, failure, gate, answer, completion });

  if (finishReason === "refusal" || finishReason === "content_filter") {
    return done("refusal", { stage: "completion", code: `finish_${finishReason}` });
  }
  if (finishReason === "length") return done("incomplete", { stage: "completion", code: "finish_length" });
  if (text.trim().length === 0) return done("incomplete", { stage: "completion", code: "empty_output" });
  if (bytes > limits.maxAnswerUtf8Bytes) return done("oversize", { stage: "completion", code: "answer_exceeds_bound" });

  const gate = runGateWith(
    { slug: entry.slug, gateConfig, answerText: text, finishReason, userMessage: message },
    { acceptSynthetic: ctx.acceptSyntheticGate },
  );
  if (gate.status === "failed") {
    return done("gate_failed", { stage: "gate", code: gate.checks.find((c) => c.status === "fail").code }, gate);
  }
  if (gate.status !== "passed") {
    const first = gate.checks.find((c) => c.status === "unsupported");
    return done("gate_unverifiable", { stage: "gate", code: first ? first.code : "gate_unverifiable" }, gate);
  }
  return done("answer", null, gate, text);
}

async function runInner(ctx, input, st) {
  const finish = (parts) => st.finish(parts);
  const precondition = (code) => finish({ outcome: "precondition_failed", failure: { stage: "precondition", code } });

  if (!isPlainObject(input)) return precondition("input_invalid");
  st.turn = echoTurn(input.turn);
  if (Object.prototype.hasOwnProperty.call(input, "tools")) return precondition("tools_not_supported");
  if (unknownKeys(input, BRIDGE_KEYS).length > 0) return precondition("unknown_input_field");
  if (!isValidTurn(input.turn)) return precondition("turn_invalid");
  const callback = input.authorizedGenerate;
  if (typeof callback !== "function") return precondition("callback_missing");
  const signal = input.signal ?? undefined;
  if (signal !== undefined && !isAbortSignal(signal)) return precondition("signal_invalid");
  if (signal?.aborted) return finish({ outcome: "cancelled", failure: ABORTED_BEFORE });

  const prepared = await prepareInternal(ctx, pickPrepareInput(input));
  st.resolved = prepared.resolved;
  if (!prepared.ok) return precondition(prepared.failure.code);
  if (signal?.aborted) return finish({ outcome: "cancelled", failure: ABORTED_BEFORE });

  // Dispatch: exactly one call. Nothing below can reach this line again.
  st.invocations = 1;
  st.authorization = "unknown";
  let parsed;
  try {
    parsed = parseReply(await callback(prepared.request, Object.freeze({ signal })));
  } catch {
    parsed = { kind: "threw" };
  }
  const abortedAfter = signal !== undefined && signal.aborted === true;

  if (parsed.kind === "threw" || parsed.kind === "violation") {
    const code = parsed.kind === "threw" ? "callback_threw" : "callback_contract_violation";
    return finish({ outcome: abortedAfter ? "cancelled" : "failed", failure: abortedAfter ? ABORTED_AFTER : { stage: "generation", code } });
  }
  if (parsed.kind === "declined") {
    st.authorization = "declined";
    return finish({ outcome: abortedAfter ? "cancelled" : "declined", failure: abortedAfter ? ABORTED_AFTER : { stage: "authorization", code: parsed.reason } });
  }
  st.authorization = "admitted";
  st.usage = parsed.usage;
  st.providerEvidence = parsed.providerEvidence;
  if (parsed.kind === "failed") {
    return finish({ outcome: abortedAfter ? "cancelled" : "failed", failure: abortedAfter ? ABORTED_AFTER : { stage: "generation", code: parsed.code } });
  }
  if (abortedAfter) {
    return finish({
      outcome: "cancelled",
      failure: ABORTED_AFTER,
      completion: { finishReason: parsed.finishReason, outputUtf8Bytes: utf8ByteLength(parsed.text) },
    });
  }
  return finish(decideCompleted(ctx, parsed, st, input.message));
}

/**
 * Run one specialist turn under a runtime context.
 * @param {import("./context.js").RuntimeContext} ctx
 * @param {unknown} input
 * @returns {Promise<import("./result.js").SpecialistTurnResult>}
 */
export async function runTurnWith(ctx, input) {
  const st = {
    invocations: 0,
    authorization: "not_requested",
    usage: null,
    providerEvidence: null,
    turn: echoTurn(undefined),
    /** @type {any} */
    resolved: {},
    finish(parts) {
      const { entry, gateConfig } = st.resolved;
      return buildResult({
        outcome: parts.outcome,
        answer: parts.answer ?? null,
        failure: parts.failure ?? null,
        completion: parts.completion,
        gate: parts.gate ?? notRunGate(entry ? entry.gateVersion : null, gateConfig ? gateConfig.configVersion : null),
        usage: st.usage,
        providerEvidence: st.providerEvidence,
        dispatch: { callbackInvocations: st.invocations, authorization: st.authorization },
        provenance: buildProvenance(ctx, st.resolved),
        turn: st.turn,
      });
    },
  };
  try {
    return await runInner(ctx, input, st);
  } catch {
    // Defensive: an unexpected internal error must still yield a result, and
    // must never lead to a second callback invocation.
    return st.finish(
      st.invocations === 0
        ? { outcome: "precondition_failed", failure: { stage: "precondition", code: "internal_error" } }
        : { outcome: "failed", failure: { stage: "generation", code: "internal_error" } },
    );
  }
}
