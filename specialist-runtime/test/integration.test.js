// Offline integration: prepare -> fake authorized adapter -> gate -> result.
// The adapter stands in for website 01's wrapper around 04 (authorization)
// and 03 (transport). It is SYNTHETIC: no provider is called.
import test from "node:test";
import assert from "node:assert/strict";
import { OUTCOMES } from "../src/constants.js";
import { SCENARIOS } from "../fixtures/synthetic/scenarios.js";
import { GOOD_ANSWER, SYNTHETIC_TURN, USER_MESSAGE, loadSyntheticBundle, offlineRuntime, prepareInput, turnInput } from "../fixtures/synthetic/harness.js";

const RESULT_KEYS = [
  "schema", "contractVersion", "outcome", "answer", "failure", "completion", "gate", "usage", "usageStatus",
  "providerEvidence", "dispatch", "provenance", "turn",
];
const PROVENANCE_KEYS = [
  "manifestVersion", "slug", "sourceRepo", "sourceCommit", "kbVersion", "bundleSha256", "gateVersion",
  "gateConfigVersion", "runtimeNoticeVersion", "mode", "libraryManifestVersion", "toolsRun", "retrieval", "claims",
];
const STAGES = ["precondition", "authorization", "generation", "completion", "gate"];

const isStringOrNull = (v) => v === null || typeof v === "string";
const isRecordOrNull = (v) => v === null || (typeof v === "object" && !Array.isArray(v));

/** Assert every documented SpecialistTurnResult field is present with its documented type. */
function assertResultShape(r) {
  assert.deepEqual(Object.keys(r), RESULT_KEYS);
  assert.equal(r.schema, "epinoic.specialist-turn-result.v1");
  assert.equal(r.contractVersion, "epinoic.specialist-runtime.v0.1.0");
  assert.ok(OUTCOMES.includes(r.outcome));
  assert.ok(isStringOrNull(r.answer));
  assert.equal(r.answer !== null, r.outcome === "answer");
  if (r.failure !== null) {
    assert.deepEqual(Object.keys(r.failure), ["stage", "code"]);
    assert.ok(STAGES.includes(r.failure.stage));
    assert.equal(typeof r.failure.code, "string");
  }
  assert.equal(r.failure === null, r.outcome === "answer");
  assert.deepEqual(Object.keys(r.completion), ["finishReason", "outputUtf8Bytes"]);
  assert.ok(isStringOrNull(r.completion.finishReason));
  assert.ok(r.completion.outputUtf8Bytes === null || Number.isSafeInteger(r.completion.outputUtf8Bytes));
  assert.deepEqual(Object.keys(r.gate), ["kind", "version", "configVersion", "status", "checks", "disclaimer"]);
  assert.equal(r.gate.kind, "deterministic-format-policy");
  assert.ok(isStringOrNull(r.gate.version) && isStringOrNull(r.gate.configVersion));
  assert.ok(["passed", "failed", "unverifiable", "not_run"].includes(r.gate.status));
  assert.ok(Array.isArray(r.gate.checks));
  for (const c of r.gate.checks) {
    assert.deepEqual(Object.keys(c), ["id", "status", "code"]);
    assert.ok(["pass", "fail", "unsupported"].includes(c.status));
  }
  assert.equal(r.gate.disclaimer, "Deterministic format and policy heuristics. Not factual, academic or formal verification.");
  assert.ok(isRecordOrNull(r.usage));
  assert.equal(r.usageStatus, r.usage === null ? "unknown" : "reported");
  assert.ok(isRecordOrNull(r.providerEvidence));
  assert.deepEqual(Object.keys(r.dispatch), ["callbackInvocations", "authorization"]);
  assert.ok([0, 1].includes(r.dispatch.callbackInvocations));
  assert.ok(["not_requested", "declined", "admitted", "unknown"].includes(r.dispatch.authorization));
  assert.equal(r.dispatch.callbackInvocations === 0, r.dispatch.authorization === "not_requested");
  assert.deepEqual(Object.keys(r.provenance), PROVENANCE_KEYS);
  for (const k of PROVENANCE_KEYS.slice(0, 10)) assert.ok(isStringOrNull(r.provenance[k]), k);
  assert.equal(r.provenance.libraryManifestVersion, null);
  assert.deepEqual(r.provenance.toolsRun, []);
  assert.equal(r.provenance.retrieval, null);
  assert.equal(r.provenance.claims, null);
  assert.deepEqual(Object.keys(r.turn), ["conversationId", "turnId", "turnVersion", "attemptId"]);
}

test("prepare -> fake authorized adapter -> gate -> result: the documented result, field by field", async () => {
  const rt = offlineRuntime();
  const bundle = await loadSyntheticBundle(rt);

  const prepared = await rt.prepareTurn(prepareInput(bundle));
  assert.equal(prepared.ok, true);

  // A SYNTHETIC stand-in for website 01's callback: authorize (04), map the
  // request to a provider-shaped payload (03's choice), "transport", normalise.
  const log = [];
  async function authorizedGenerate(request, { signal }) {
    log.push("authorize");
    assert.equal(signal, undefined);
    const payload = {
      system: request.instructions.map((i) => ({ type: "text", text: i.text })),
      messages: request.messages.map((m) => ({ role: m.role, content: m.text })),
      tools: request.tools,
    };
    assert.equal(payload.system[0].text, prepared.request.instructions[0].text);
    assert.deepEqual(payload.tools, []);
    log.push("transport");
    return {
      status: "completed",
      output: { text: GOOD_ANSWER, finishReason: "stop" },
      usage: { synthetic: true, inputTokens: 1000, outputTokens: 60 },
      providerEvidence: { synthetic: true, requestId: "synthetic-req-int-1" },
    };
  }

  const result = await rt.runSpecialistTurn(turnInput(bundle, authorizedGenerate));
  assert.deepEqual(log, ["authorize", "transport"]);
  assertResultShape(result);
  assert.equal(result.outcome, "answer");
  assert.equal(result.answer, GOOD_ANSWER);
  assert.equal(result.gate.status, "passed");
  assert.equal(result.completion.finishReason, "stop");
  assert.equal(result.completion.outputUtf8Bytes, Buffer.byteLength(GOOD_ANSWER, "utf8"));
  assert.deepEqual(result.dispatch, { callbackInvocations: 1, authorization: "admitted" });
  assert.deepEqual(result.provenance, prepared.request.provenance);
  assert.deepEqual(result.turn, SYNTHETIC_TURN);
  assert.ok(!JSON.stringify(result).includes(USER_MESSAGE), "the result does not carry the user's message");
});

test("every outcome yields the documented shape", async () => {
  for (const scenario of SCENARIOS) {
    const { result } = await scenario.run();
    assertResultShape(result);
  }
});
