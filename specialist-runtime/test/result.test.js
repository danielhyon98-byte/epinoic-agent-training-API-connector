import test from "node:test";
import assert from "node:assert/strict";
import { OUTCOMES } from "../src/constants.js";
import { notRunGate } from "../src/gate/engine.js";
import { buildResult } from "../src/result.js";

const base = {
  gate: notRunGate(null, null),
  dispatch: { callbackInvocations: 1, authorization: "admitted" },
  provenance: { claims: null, toolsRun: [] },
  turn: { conversationId: "c", turnId: "t", turnVersion: 1, attemptId: "a" },
};

test("buildResult forces answer to null for every outcome except 'answer' (defence in depth)", () => {
  for (const outcome of OUTCOMES) {
    const r = buildResult({ ...base, outcome, answer: "SYNTHETIC answer text" });
    if (outcome === "answer") assert.equal(r.answer, "SYNTHETIC answer text");
    else assert.equal(r.answer, null, outcome);
  }
});

test("buildResult refuses unknown outcomes and derives usageStatus from usage only", () => {
  assert.throws(() => buildResult({ ...base, outcome: "ok" }), TypeError);
  const usage = { inputTokens: 0 };
  const reported = buildResult({ ...base, outcome: "failed", usage });
  assert.equal(reported.usage, usage, "same object, by reference");
  assert.equal(reported.usageStatus, "reported");
  const unknown = buildResult({ ...base, outcome: "failed" });
  assert.equal(unknown.usage, null);
  assert.equal(unknown.usageStatus, "unknown");
  assert.ok(Object.isFrozen(reported) && Object.isFrozen(reported.provenance) && Object.isFrozen(reported.provenance.toolsRun));
  assert.equal(Object.isFrozen(usage), false, "the callback's usage object is not frozen");
});
