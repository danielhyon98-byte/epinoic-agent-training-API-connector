import test from "node:test";
import assert from "node:assert/strict";
import { runSpecialistTurn } from "../src/index.js";
import { OUTCOMES } from "../src/constants.js";
import {
  abortAfterCallback,
  completedCallback,
  declinedCallback,
  failedCallback,
  malformedCallback,
  syntheticEvidence,
  syntheticUsage,
  throwingCallback,
  toolCallsCallback,
} from "../fixtures/synthetic/callbacks.js";
import { SYNTHETIC_SOURCES_LINE } from "../fixtures/synthetic/gate-config.js";
import { SCENARIOS } from "../fixtures/synthetic/scenarios.js";
import {
  CLARIFYING_ANSWER,
  GOOD_ANSWER,
  SYNTHETIC_LIMITS,
  SYNTHETIC_TURN,
  loadSyntheticBundle,
  offlineRuntime,
  turnInput,
} from "../fixtures/synthetic/harness.js";

async function runWith(fake, overrides = {}, rt = offlineRuntime()) {
  const bundle = await loadSyntheticBundle(rt);
  const result = await rt.runSpecialistTurn(turnInput(bundle, fake.authorizedGenerate, overrides));
  assert.ok(fake.stats.invocations <= 1, "callback invoked at most once");
  assert.equal(result.dispatch.callbackInvocations, fake.stats.invocations);
  return result;
}

test("a normal answer passes the synthetic gate and is returned", async () => {
  const fake = completedCallback({ text: GOOD_ANSWER });
  const r = await runWith(fake);
  assert.equal(r.outcome, "answer");
  assert.equal(r.answer, GOOD_ANSWER);
  assert.equal(r.failure, null);
  assert.equal(r.gate.status, "passed");
  assert.deepEqual(r.dispatch, { callbackInvocations: 1, authorization: "admitted" });
  assert.equal(fake.stats.transport.calls, 1);
  assert.ok(Object.isFrozen(r));
});

test("the callback receives the frozen prepared request (no tools) and the signal", async () => {
  const controller = new AbortController();
  const fake = completedCallback({ text: GOOD_ANSWER });
  await runWith(fake, { signal: controller.signal });
  const req = fake.stats.lastRequest;
  assert.ok(Object.isFrozen(req) && Object.isFrozen(req.instructions) && Object.isFrozen(req.tools));
  assert.deepEqual(req.tools, []);
  assert.equal(req.instructions[0].kind, "mandatory-bundle");
  assert.equal(fake.stats.lastOptions.signal, controller.signal);
});

test("a specialist's clarifying question is an ordinary answer, not a router clarification", async () => {
  const r = await runWith(completedCallback({ text: CLARIFYING_ANSWER }));
  assert.equal(r.outcome, "answer");
  assert.equal(r.answer, CLARIFYING_ANSWER);
});

test("refusal and content_filter give outcome refusal with the answer withheld", async () => {
  for (const finishReason of ["refusal", "content_filter"]) {
    const r = await runWith(completedCallback({ text: "I can't help with that.", finishReason }));
    assert.equal(r.outcome, "refusal");
    assert.equal(r.answer, null);
    assert.deepEqual(r.failure, { stage: "completion", code: `finish_${finishReason}` });
    assert.equal(r.gate.status, "not_run");
    assert.equal(r.completion.finishReason, finishReason);
  }
});

test("length, empty or whitespace-only text give outcome incomplete", async () => {
  const length = await runWith(completedCallback({ text: GOOD_ANSWER, finishReason: "length" }));
  assert.equal(length.outcome, "incomplete");
  assert.deepEqual(length.failure, { stage: "completion", code: "finish_length" });
  for (const text of ["", "  \n\t "]) {
    const r = await runWith(completedCallback({ text }));
    assert.equal(r.outcome, "incomplete");
    assert.deepEqual(r.failure, { stage: "completion", code: "empty_output" });
    assert.equal(r.answer, null);
  }
});

test("oversize answers are withheld, never truncated; the exact bound is accepted", async () => {
  const bytes = Buffer.byteLength(GOOD_ANSWER, "utf8");
  const over = await runWith(completedCallback({ text: GOOD_ANSWER }), { limits: { ...SYNTHETIC_LIMITS, maxAnswerUtf8Bytes: bytes - 1 } });
  assert.equal(over.outcome, "oversize");
  assert.equal(over.answer, null);
  assert.deepEqual(over.failure, { stage: "completion", code: "answer_exceeds_bound" });
  assert.equal(over.completion.outputUtf8Bytes, bytes);
  assert.ok(!JSON.stringify(over).includes("Treaty"), "no partial answer anywhere in the result");
  const exact = await runWith(completedCallback({ text: GOOD_ANSWER }), { limits: { ...SYNTHETIC_LIMITS, maxAnswerUtf8Bytes: bytes } });
  assert.equal(exact.outcome, "answer");
});

test("unknown finishReason gives gate_unverifiable (completeness unsupported)", async () => {
  const r = await runWith(completedCallback({ text: GOOD_ANSWER, finishReason: "unknown" }));
  assert.equal(r.outcome, "gate_unverifiable");
  assert.equal(r.answer, null);
  assert.deepEqual(r.gate.checks[0], { id: "completeness", status: "unsupported", code: "finish_reason_unknown" });
  assert.deepEqual(r.failure, { stage: "gate", code: "finish_reason_unknown" });
});

test("gate failures withhold the answer: URL, leaked code, unlabelled mark, bad sources line", async () => {
  const cases = [
    ["See https://example.org/versailles for more.", "url_present"],
    ["As rule HXR-101 says, write prose.", "internal_code_present"],
    ["I would award this essay 12/15.", "provisional_label_missing"],
  ];
  for (const [body, code] of cases) {
    const r = await runWith(completedCallback({ text: `${body}\n${SYNTHETIC_SOURCES_LINE}` }));
    assert.equal(r.outcome, "gate_failed", body);
    assert.equal(r.answer, null);
    assert.deepEqual(r.failure, { stage: "gate", code });
  }
  const sources = await runWith(completedCallback({ text: "The treaty was signed in 1919.\nSources: Taylor (1961)" }));
  assert.equal(sources.outcome, "gate_failed");
  assert.deepEqual(sources.failure, { stage: "gate", code: "sources_line_invalid" });
});

test("declined: no transport call, outcome declined, authorization recorded", async () => {
  const fake = declinedCallback("budget_unavailable");
  const r = await runWith(fake);
  assert.equal(r.outcome, "declined");
  assert.equal(fake.stats.transport.calls, 0);
  assert.deepEqual(r.dispatch, { callbackInvocations: 1, authorization: "declined" });
  assert.deepEqual(r.failure, { stage: "authorization", code: "budget_unavailable" });
  assert.equal(r.usage, null);
  assert.equal(r.usageStatus, "unknown");
  assert.equal(r.answer, null);
});

test("a signal aborted before dispatch gives cancelled with zero invocations", async () => {
  const controller = new AbortController();
  controller.abort();
  const fake = completedCallback({ text: GOOD_ANSWER });
  const r = await runWith(fake, { signal: controller.signal });
  assert.equal(r.outcome, "cancelled");
  assert.equal(fake.stats.invocations, 0);
  assert.equal(fake.stats.transport.calls, 0);
  assert.deepEqual(r.dispatch, { callbackInvocations: 0, authorization: "not_requested" });
  assert.deepEqual(r.failure, { stage: "precondition", code: "aborted_before_dispatch" });
});

test("an abort after the callback returns fences the result: cancelled, answer withheld, usage and evidence kept", async () => {
  const controller = new AbortController();
  const usage = syntheticUsage();
  const evidence = syntheticEvidence();
  const reply = { status: "completed", output: { text: GOOD_ANSWER, finishReason: "stop" }, usage, providerEvidence: evidence };
  const fake = abortAfterCallback(controller, reply);
  const r = await runWith(fake, { signal: controller.signal });
  assert.equal(r.outcome, "cancelled");
  assert.equal(r.answer, null);
  assert.equal(r.usage, usage);
  assert.equal(r.usageStatus, "reported");
  assert.equal(r.providerEvidence, evidence);
  assert.deepEqual(r.failure, { stage: "generation", code: "aborted_after_callback" });
  assert.deepEqual(r.dispatch, { callbackInvocations: 1, authorization: "admitted" });
  assert.equal(r.gate.status, "not_run");
  assert.equal(fake.stats.invocations, 1);

  const c2 = new AbortController();
  const declined = await runWith(abortAfterCallback(c2, { status: "declined", reason: "budget_unavailable" }), { signal: c2.signal });
  assert.equal(declined.outcome, "cancelled");
  assert.equal(declined.dispatch.authorization, "declined");
});

test("a throwing callback gives failed/callback_threw with usage unknown, never zero", async () => {
  const fake = throwingCallback();
  const r = await runWith(fake);
  assert.equal(r.outcome, "failed");
  assert.deepEqual(r.failure, { stage: "generation", code: "callback_threw" });
  assert.equal(r.usage, null);
  assert.equal(r.usageStatus, "unknown");
  assert.deepEqual(r.dispatch, { callbackInvocations: 1, authorization: "unknown" });
});

test("malformed callback replies give failed/callback_contract_violation, each with one invocation", async () => {
  const usage = syntheticUsage();
  const ok = { status: "completed", output: { text: GOOD_ANSWER, finishReason: "stop" }, usage, providerEvidence: null };
  const replies = [
    undefined,
    null,
    "completed",
    42,
    [],
    { status: "ok" },
    { status: "completed", output: { text: GOOD_ANSWER, finishReason: "stop" }, usage },
    { ...ok, extra: true },
    { ...ok, output: { text: 42, finishReason: "stop" } },
    { ...ok, output: { text: GOOD_ANSWER } },
    { ...ok, output: { text: GOOD_ANSWER, finishReason: "max_tokens" } },
    { ...ok, output: { text: GOOD_ANSWER, finishReason: "tool_use" } },
    { ...ok, output: { text: "bad \uDC00 text", finishReason: "stop" } },
    { ...ok, usage: [1, 2] },
    { ...ok, usage: "1234 tokens" },
    { ...ok, providerEvidence: 7 },
    { status: "declined" },
    { status: "declined", reason: "no budget left" },
    { status: "declined", reason: "x", usage: null },
    { status: "failed", error: { code: "x", message: "detail" }, usage: null, providerEvidence: null },
    { status: "failed", error: "x", usage: null, providerEvidence: null },
    { status: "failed", error: { code: "x" } },
    Promise.resolve({ status: "completed" }),
  ];
  for (const reply of replies) {
    const fake = malformedCallback(reply);
    const r = await runWith(fake);
    assert.equal(r.outcome, "failed", JSON.stringify(reply));
    assert.deepEqual(r.failure, { stage: "generation", code: "callback_contract_violation" });
    assert.equal(r.usage, null);
    assert.equal(r.usageStatus, "unknown");
    assert.equal(r.dispatch.authorization, "unknown");
    assert.equal(fake.stats.invocations, 1);
  }
});

test("output reporting tool calls is a contract violation in this mode", async () => {
  const fake = toolCallsCallback();
  const r = await runWith(fake);
  assert.equal(r.outcome, "failed");
  assert.deepEqual(r.failure, { stage: "generation", code: "callback_contract_violation" });
  assert.deepEqual(r.provenance.toolsRun, []);
});

test("a normalised failed reply passes its code, usage and evidence through", async () => {
  const usage = syntheticUsage();
  const evidence = syntheticEvidence();
  const r = await runWith(failedCallback({ code: "provider_timeout", usage, providerEvidence: evidence }));
  assert.equal(r.outcome, "failed");
  assert.deepEqual(r.failure, { stage: "generation", code: "provider_timeout" });
  assert.equal(r.usage, usage);
  assert.equal(r.usageStatus, "reported");
  assert.equal(r.providerEvidence, evidence);
  const unknown = await runWith(failedCallback({ code: "provider_timeout" }));
  assert.equal(unknown.usage, null);
  assert.equal(unknown.usageStatus, "unknown");
});

test("unknown usage stays null with usageStatus unknown, never 0", async () => {
  const r = await runWith(completedCallback({ text: GOOD_ANSWER, usage: null, providerEvidence: null }));
  assert.equal(r.outcome, "answer");
  assert.equal(r.usage, null);
  assert.equal(r.usageStatus, "unknown");
  assert.equal(r.providerEvidence, null);
});

test("usage and providerEvidence are passed through verbatim: same objects, same content, not frozen or modified", async () => {
  const usage = { inputTokens: 10, outputTokens: 2, cache: { read: 5, write: 0 }, synthetic: true };
  const evidence = { provider: "synthetic-offline", requestId: "synthetic-req-9", headers: { "x-synthetic": "1" } };
  const usageSnapshot = structuredClone(usage);
  const evidenceSnapshot = structuredClone(evidence);
  const r = await runWith(completedCallback({ text: GOOD_ANSWER, usage, providerEvidence: evidence }));
  assert.equal(r.usage, usage);
  assert.equal(r.providerEvidence, evidence);
  assert.deepEqual(r.usage, usageSnapshot);
  assert.deepEqual(r.providerEvidence, evidenceSnapshot);
  assert.equal(Object.isFrozen(usage), false);
  assert.equal(Object.isFrozen(evidence), false);
});

test("every precondition failure happens before the callback: zero invocations", async () => {
  const cases = [
    [{ limits: undefined }, "limits_missing"],
    [{ limits: { ...SYNTHETIC_LIMITS, maxPreparedInputUtf8Bytes: 50 } }, "prepared_input_exceeds_bound"],
    [{ tools: [] }, "tools_not_supported"],
    [{ slug: "economics" }, "unknown_slug"],
    [{ slug: "synthetic-disabled" }, "slug_not_enabled"],
    [{ environment: "staging-pilot" }, "environment_not_supported"],
    [{ mode: "chat" }, "unsupported_mode"],
    [{ bundle: { schema: "epinoic.verified-bundle.v1" } }, "bundle_not_verified"],
    [{ message: "" }, "message_invalid"],
    [{ turn: { conversationId: "c" } }, "turn_invalid"],
    [{ turn: undefined }, "turn_invalid"],
    [{ signal: { aborted: false } }, "signal_invalid"],
    [{ retry: 2 }, "unknown_input_field"],
  ];
  for (const [overrides, code] of cases) {
    const fake = completedCallback({ text: GOOD_ANSWER });
    const r = await runWith(fake, overrides);
    assert.equal(r.outcome, "precondition_failed", code);
    assert.deepEqual(r.failure, { stage: "precondition", code });
    assert.equal(fake.stats.invocations, 0, code);
    assert.deepEqual(r.dispatch, { callbackInvocations: 0, authorization: "not_requested" });
    assert.equal(r.gate.status, "not_run");
    assert.equal(r.answer, null);
  }
  const noCallback = await (async () => {
    const rt = offlineRuntime();
    const bundle = await loadSyntheticBundle(rt);
    return rt.runSpecialistTurn(turnInput(bundle, undefined));
  })();
  assert.deepEqual(noCallback.failure, { stage: "precondition", code: "callback_missing" });
});

test("runSpecialistTurn never throws, even on garbage input", async () => {
  for (const input of [undefined, null, 5, "x", []]) {
    const r = await runSpecialistTurn(input);
    assert.equal(r.outcome, "precondition_failed");
    assert.deepEqual(r.failure, { stage: "precondition", code: "input_invalid" });
  }
});

test("pinned runtime: every environment fails before the callback today", async () => {
  const bundle = await loadSyntheticBundle();
  for (const [environment, code] of [["production", "slug_not_enabled"], ["staging-pilot", "slug_not_enabled"], ["offline-test", "environment_not_supported"]]) {
    const fake = completedCallback({ text: GOOD_ANSWER });
    const r = await runSpecialistTurn(turnInput(bundle, fake.authorizedGenerate, { environment }));
    assert.equal(r.outcome, "precondition_failed");
    assert.deepEqual(r.failure, { stage: "precondition", code });
    assert.equal(fake.stats.invocations, 0);
  }
});

test("turn identifiers are echoed unchanged, on success and on failure", async () => {
  const ok = await runWith(completedCallback({ text: GOOD_ANSWER }));
  assert.deepEqual(ok.turn, SYNTHETIC_TURN);
  const failed = await runWith(completedCallback({ text: GOOD_ANSWER }), { limits: undefined });
  assert.deepEqual(failed.turn, SYNTHETIC_TURN);
  assert.ok(Object.isFrozen(ok.turn));
});

test("provenance is complete and fixed: claims null, toolsRun [], retrieval null, library null", async () => {
  const r = await runWith(completedCallback({ text: GOOD_ANSWER }));
  assert.equal(r.provenance.claims, null);
  assert.deepEqual(r.provenance.toolsRun, []);
  assert.equal(r.provenance.retrieval, null);
  assert.equal(r.provenance.libraryManifestVersion, null);
  assert.equal(r.provenance.runtimeNoticeVersion, "pilot-notice/0.1.0");
  assert.equal(r.provenance.gateConfigVersion, "synthetic-offline-test/0.1.0");
  const early = await runWith(completedCallback({ text: GOOD_ANSWER }), { slug: "economics" });
  assert.equal(early.provenance.slug, null);
  assert.equal(early.provenance.runtimeNoticeVersion, null, "no notice was prepared");
  assert.equal(early.provenance.claims, null);
});

test("property: answer is non-null only when outcome is 'answer', across every outcome; callback at most once", async () => {
  const seen = new Set();
  for (const scenario of SCENARIOS) {
    const { result, stats } = await scenario.run();
    assert.equal(result.outcome, scenario.outcome, scenario.name);
    seen.add(result.outcome);
    if (result.outcome === "answer") assert.equal(typeof result.answer, "string", scenario.name);
    else assert.equal(result.answer, null, scenario.name);
    assert.ok(stats.invocations <= 1, scenario.name);
    assert.equal(result.dispatch.callbackInvocations, stats.invocations, scenario.name);
    if (result.usage === null) assert.equal(result.usageStatus, "unknown", scenario.name);
  }
  assert.deepEqual([...seen].sort(), [...OUTCOMES].sort(), "every outcome is exercised");
});
