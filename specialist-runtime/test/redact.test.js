import test from "node:test";
import assert from "node:assert/strict";
import { redactForLog } from "../src/index.js";
import { isKeyLike } from "../src/redact.js";
import { completedCallback, declinedCallback } from "../fixtures/synthetic/callbacks.js";
import { SCENARIOS } from "../fixtures/synthetic/scenarios.js";
import { GOOD_ANSWER, loadSyntheticBundle, offlineRuntime, turnInput } from "../fixtures/synthetic/harness.js";

// Fake, clearly invalid key-shaped strings. They are not real credentials.
const FAKE_KEY = "sk-test-FAKEKEY0000000000notreal";
const FAKE_ANT_KEY = "sk-ant-FAKE0000000000000000notreal";
const USER_TEXT = `Here is my key ${FAKE_KEY}, can you check Versailles?`;

async function resultWithSecrets() {
  const rt = offlineRuntime();
  const bundle = await loadSyntheticBundle(rt);
  const fake = completedCallback({
    text: GOOD_ANSWER,
    usage: { inputTokens: 100, outputTokens: 20, apiKey: FAKE_ANT_KEY, note: `debug ${FAKE_KEY}` },
    providerEvidence: { requestId: "synthetic-req-77", authorization: `Bearer ${FAKE_KEY}`, echo: FAKE_ANT_KEY },
  });
  return rt.runSpecialistTurn(turnInput(bundle, fake.authorizedGenerate, { message: USER_TEXT }));
}

test("redactForLog removes answer, messages, user text, providerEvidence and key-like strings", async () => {
  const result = await resultWithSecrets();
  assert.equal(result.outcome, "answer");
  const log = redactForLog(result);
  const json = JSON.stringify(log);
  assert.ok(!json.includes("sk-"), "no key-like string survives");
  assert.ok(!json.includes("Bearer"));
  assert.ok(!json.includes("Versailles"), "neither answer nor user text");
  assert.ok(!json.includes("Here is my key"));
  assert.ok(!json.includes("synthetic-req-77"), "provider evidence is not logged");
  assert.ok(!json.includes("SYNTHETIC TEST BUNDLE"), "no bundle text");
  assert.ok(!json.includes("Sources:"));
  assert.equal(log.answerPresent, true);
  assert.equal(log.providerEvidencePresent, true);
  assert.equal(log.usage.inputTokens, 100);
  assert.equal(log.usage.apiKey, "[redacted]");
  assert.equal(log.usage.note, "[redacted]");
  assert.equal(log.outcome, "answer");
  assert.equal(log.gate.status, "passed");
  assert.deepEqual(log.turn, result.turn);
  assert.equal(log.provenance.bundleSha256, result.provenance.bundleSha256, "hex digests are kept");
  assert.equal(log.provenance.claims, null);
  assert.ok(Object.isFrozen(log) && Object.isFrozen(log.gate));
  for (const forbidden of ["answer", "messages", "providerEvidence", "message", "request"]) {
    assert.equal(Object.prototype.hasOwnProperty.call(log, forbidden), false, forbidden);
  }
});

test("redactForLog scrubs key-like failure codes taken from the callback", async () => {
  const rt = offlineRuntime();
  const bundle = await loadSyntheticBundle(rt);
  const r = await rt.runSpecialistTurn(turnInput(bundle, declinedCallback(FAKE_KEY).authorizedGenerate));
  assert.equal(r.failure.code, FAKE_KEY, "the internal result keeps the code");
  assert.equal(redactForLog(r).failure.code, "[redacted]");
});

test("redactForLog is safe for every outcome and for garbage input", async () => {
  for (const scenario of SCENARIOS) {
    const { result } = await scenario.run();
    const log = redactForLog(result);
    assert.equal(log.outcome, result.outcome);
    if (typeof result.answer === "string") assert.ok(!JSON.stringify(log).includes(result.answer));
  }
  for (const input of [undefined, null, 1, "x", [], { outcome: "bogus", answer: "secret answer" }]) {
    const log = redactForLog(input);
    assert.equal(log.schema, "epinoic.specialist-turn-log.v1");
    assert.ok(!JSON.stringify(log).includes("secret answer"));
  }
});

test("key-like detection", () => {
  for (const s of [FAKE_KEY, FAKE_ANT_KEY, "Bearer abc.def", "AKIAABCDEFGHIJKLMNOP", "ghp_ABCDEFGHIJKLMNOPQRSTuvwx", "aB3dE5gH7jK9mN1pQ3sT5vW7yZ9bC1dE"]) {
    assert.equal(isKeyLike(s), true, s);
  }
  for (const s of ["history", "a5b8a2da6feb447ea06d9e38946ba50f71b14495e517169b5b3a418530119240", "synthetic-conv-1", "provider_unavailable"]) {
    assert.equal(isKeyLike(s), false, s);
  }
});

test("the runtime never writes to the console during a turn", async () => {
  const calls = [];
  const saved = {};
  for (const m of ["log", "info", "warn", "error", "debug", "trace"]) {
    saved[m] = console[m];
    console[m] = (...args) => calls.push([m, args]);
  }
  try {
    for (const scenario of SCENARIOS) await scenario.run();
  } finally {
    Object.assign(console, saved);
  }
  assert.deepEqual(calls, []);
});
