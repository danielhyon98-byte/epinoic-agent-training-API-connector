import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createOfflineTestRuntime, prepareTurn } from "../src/index.js";
import { RUNTIME_NOTICE_TEXT, RUNTIME_NOTICE_VERSION } from "../src/prepare.js";
import { SYNTHETIC_GATE_CONFIG } from "../fixtures/synthetic/gate-config.js";
import { SYNTHETIC_BUNDLE_SHA256 } from "../fixtures/synthetic/manifest.js";
import {
  SYNTHETIC_BUNDLE_MODULE,
  SYNTHETIC_LIMITS,
  USER_MESSAGE,
  loadSyntheticBundle,
  offlineRuntime,
  prepareInput,
} from "../fixtures/synthetic/harness.js";

const TEXT_BYTES = readFileSync(new URL("../fixtures/synthetic/synthetic-bundle.txt", import.meta.url));
const utf8Len = (s) => Buffer.byteLength(s, "utf8");

function isDeepFrozen(value) {
  if (value === null || typeof value !== "object") return true;
  return Object.isFrozen(value) && Object.values(value).every(isDeepFrozen);
}

async function setup() {
  const rt = offlineRuntime();
  return { rt, bundle: await loadSyntheticBundle(rt) };
}

async function failureCode(rt, input) {
  const out = await rt.prepareTurn(input);
  assert.equal(out.ok, false);
  assert.equal(out.request, undefined, "no request is returned on failure");
  assert.equal(out.failure.stage, "precondition");
  return out.failure.code;
}

const PRIOR = [
  { role: "user", text: "What caused the First World War?" },
  { role: "assistant", text: "Historians stress alliances, militarism and the July Crisis of 1914." },
];

test("prepares the documented request: bundle first, notice second, no tools, deep-frozen", async () => {
  const { rt, bundle } = await setup();
  const out = await rt.prepareTurn(prepareInput(bundle, { priorTurns: PRIOR }));
  assert.equal(out.ok, true);
  const r = out.request;
  assert.ok(isDeepFrozen(r));
  assert.deepEqual(Object.keys(r), ["schema", "slug", "mode", "instructions", "messages", "tools", "bounds", "provenance"]);
  assert.equal(r.schema, "epinoic.prepared-specialist-request.v1");
  assert.equal(r.slug, "history");
  assert.equal(r.mode, "pilot-single-turn-no-tools");
  assert.deepEqual(r.tools, []);
  assert.equal(r.instructions.length, 2);
  assert.deepEqual(Object.keys(r.instructions[0]), ["kind", "text", "sha256"]);
  assert.equal(r.instructions[0].kind, "mandatory-bundle");
  assert.deepEqual(r.instructions[1], { kind: "runtime-notice", version: "pilot-notice/0.1.0", text: RUNTIME_NOTICE_TEXT });
  assert.deepEqual(r.messages, [...PRIOR, { role: "user", text: USER_MESSAGE }]);
  const expectedBytes = TEXT_BYTES.length + utf8Len(RUNTIME_NOTICE_TEXT) + PRIOR.reduce((n, t) => n + utf8Len(t.text), 0) + utf8Len(USER_MESSAGE);
  assert.deepEqual(r.bounds, { preparedInputUtf8Bytes: expectedBytes, maxOutputTokens: 1024, tokenCount: null, tokenCountStatus: "not-measured" });
});

test("mandatory bundle preservation: instructions[0].text is byte-identical and its SHA-256 re-verifies", async () => {
  const { rt, bundle } = await setup();
  const { request } = await rt.prepareTurn(prepareInput(bundle));
  const bytes = Buffer.from(new TextEncoder().encode(request.instructions[0].text));
  assert.deepEqual(bytes, TEXT_BYTES);
  assert.deepEqual(bytes, Buffer.from(SYNTHETIC_BUNDLE_MODULE.base64, "base64"));
  const sha = createHash("sha256").update(bytes).digest("hex");
  assert.equal(sha, SYNTHETIC_BUNDLE_SHA256);
  assert.equal(request.instructions[0].sha256, sha);
});

test("provenance: no library, no tools run, no retrieval, no claims", async () => {
  const { rt, bundle } = await setup();
  const { request } = await rt.prepareTurn(prepareInput(bundle));
  assert.deepEqual(request.provenance, {
    manifestVersion: "synthetic-offline-test.0",
    slug: "history",
    sourceRepo: "synthetic/offline-fixture",
    sourceCommit: "synthetic-no-commit",
    kbVersion: "synthetic-kb-0",
    bundleSha256: SYNTHETIC_BUNDLE_SHA256,
    gateVersion: "history-gate/0.1.0",
    gateConfigVersion: "synthetic-offline-test/0.1.0",
    runtimeNoticeVersion: "pilot-notice/0.1.0",
    mode: "pilot-single-turn-no-tools",
    libraryManifestVersion: null,
    toolsRun: [],
    retrieval: null,
    claims: null,
  });
});

test("runtime notice pilot-notice/0.1.0 states the no-tools facts and does not override the bundle", () => {
  assert.equal(RUNTIME_NOTICE_VERSION, "pilot-notice/0.1.0");
  assert.match(RUNTIME_NOTICE_TEXT, /pilot-notice\/0\.1\.0/);
  assert.match(RUNTIME_NOTICE_TEXT, /no tools/);
  assert.match(RUNTIME_NOTICE_TEXT, /no retrieval/);
  assert.match(RUNTIME_NOTICE_TEXT, /no web browsing/);
  assert.match(RUNTIME_NOTICE_TEXT, /Do not claim to have .*consulted any source/);
  assert.match(RUNTIME_NOTICE_TEXT, /does not override/);
  assert.ok(RUNTIME_NOTICE_TEXT.length < 600, "kept short");
});

test("maxOutputTokens is optional and passed through as null when absent", async () => {
  const { rt, bundle } = await setup();
  const { maxOutputTokens, ...limits } = SYNTHETIC_LIMITS;
  const out = await rt.prepareTurn(prepareInput(bundle, { limits }));
  assert.equal(out.request.bounds.maxOutputTokens, null);
  assert.equal(maxOutputTokens, 1024);
});

test("absent tools: passing tools (even an empty list) is refused", async () => {
  const { rt, bundle } = await setup();
  assert.equal(await failureCode(rt, prepareInput(bundle, { tools: [] })), "tools_not_supported");
  assert.equal(await failureCode(rt, prepareInput(bundle, { tools: [{ name: "web_search" }] })), "tools_not_supported");
  assert.equal(await failureCode(rt, prepareInput(bundle, { retrieval: { k: 5 } })), "unknown_input_field");
});

test("prepared_input_exceeds_bound: refused with nothing trimmed; the exact size is accepted", async () => {
  const { rt, bundle } = await setup();
  const ok = await rt.prepareTurn(prepareInput(bundle));
  const exact = ok.request.bounds.preparedInputUtf8Bytes;
  const atBound = await rt.prepareTurn(prepareInput(bundle, { limits: { ...SYNTHETIC_LIMITS, maxPreparedInputUtf8Bytes: exact } }));
  assert.equal(atBound.ok, true);
  assert.equal(atBound.request.instructions[0].text, bundle.text, "never trimmed");
  const code = await failureCode(rt, prepareInput(bundle, { limits: { ...SYNTHETIC_LIMITS, maxPreparedInputUtf8Bytes: exact - 1 } }));
  assert.equal(code, "prepared_input_exceeds_bound");
  const smallerThanBundle = await failureCode(rt, prepareInput(bundle, { limits: { ...SYNTHETIC_LIMITS, maxPreparedInputUtf8Bytes: 10 } }));
  assert.equal(smallerThanBundle, "prepared_input_exceeds_bound");
});

test("missing or invalid limits are refused; there are no defaults", async () => {
  const { rt, bundle } = await setup();
  assert.equal(await failureCode(rt, prepareInput(bundle, { limits: undefined })), "limits_missing");
  assert.equal(await failureCode(rt, prepareInput(bundle, { limits: null })), "limits_missing");
  assert.equal(await failureCode(rt, prepareInput(bundle, { limits: {} })), "limits_missing");
  for (const key of ["maxMessageCodePoints", "maxPriorTurns", "maxPriorTurnsUtf8Bytes", "maxPreparedInputUtf8Bytes", "maxAnswerUtf8Bytes"]) {
    const limits = { ...SYNTHETIC_LIMITS };
    delete limits[key];
    assert.equal(await failureCode(rt, prepareInput(bundle, { limits })), "limits_missing", key);
  }
  for (const bad of [0, -1, 1.5, "100", Number.NaN, Infinity]) {
    assert.equal(await failureCode(rt, prepareInput(bundle, { limits: { ...SYNTHETIC_LIMITS, maxAnswerUtf8Bytes: bad } })), "limits_invalid", String(bad));
  }
  assert.equal(await failureCode(rt, prepareInput(bundle, { limits: { ...SYNTHETIC_LIMITS, maxOutputTokens: 0 } })), "limits_invalid");
  assert.equal(await failureCode(rt, prepareInput(bundle, { limits: { ...SYNTHETIC_LIMITS, maxTokens: 10 } })), "limits_invalid");
  assert.equal(await failureCode(rt, prepareInput(bundle, { limits: [1, 2] })), "limits_invalid");
});

test("message: required, well-formed, bounded in code points", async () => {
  const { rt, bundle } = await setup();
  for (const message of [undefined, "", "   \n", 42, "broken \uD800 surrogate"]) {
    assert.equal(await failureCode(rt, prepareInput(bundle, { message })), "message_invalid", String(message));
  }
  const limits = { ...SYNTHETIC_LIMITS, maxMessageCodePoints: 3 };
  assert.equal((await rt.prepareTurn(prepareInput(bundle, { message: "\u{1F600}\u{1F600}\u{1F600}", limits }))).ok, true, "counts code points, not UTF-16 units");
  assert.equal(await failureCode(rt, prepareInput(bundle, { message: "abcd", limits })), "message_exceeds_bound");
});

test("prior turns: validated and bounded, never trimmed", async () => {
  const { rt, bundle } = await setup();
  const tooMany = await failureCode(rt, prepareInput(bundle, { priorTurns: PRIOR, limits: { ...SYNTHETIC_LIMITS, maxPriorTurns: 1 } }));
  assert.equal(tooMany, "prior_turns_exceed_bound");
  const tooBig = await failureCode(rt, prepareInput(bundle, { priorTurns: PRIOR, limits: { ...SYNTHETIC_LIMITS, maxPriorTurnsUtf8Bytes: 20 } }));
  assert.equal(tooBig, "prior_turns_exceed_bound");
  for (const priorTurns of [null, "x", [{ role: "system", text: "x" }], [{ role: "user", text: "" }], [{ role: "user", text: "x", id: 1 }]]) {
    assert.equal(await failureCode(rt, prepareInput(bundle, { priorTurns })), "prior_turns_invalid", JSON.stringify(priorTurns));
  }
  const zero = await rt.prepareTurn(prepareInput(bundle, { limits: { ...SYNTHETIC_LIMITS, maxPriorTurns: 0, maxPriorTurnsUtf8Bytes: 0 } }));
  assert.equal(zero.ok, true);
});

test("the bundle must be an intact VerifiedBundle for this slug, environment and manifest", async () => {
  const { rt, bundle } = await setup();
  assert.equal(await failureCode(rt, prepareInput(SYNTHETIC_BUNDLE_MODULE)), "bundle_not_verified");
  assert.equal(await failureCode(rt, prepareInput(undefined)), "bundle_not_verified");
  assert.equal(await failureCode(rt, prepareInput({ ...bundle, environment: "staging-pilot" })), "bundle_not_verified");
  assert.equal(await failureCode(rt, prepareInput({ ...bundle, text: bundle.text.replace("SYNTHETIC", "SYNTHETIK") })), "bundle_integrity_failed");
  assert.equal(await failureCode(rt, prepareInput({ ...bundle, sourceCommit: "other" })), "bundle_provenance_mismatch");
});

test("mode, gate configuration and gate version are preconditions", async () => {
  const { rt, bundle } = await setup();
  assert.equal(await failureCode(rt, prepareInput(bundle, { mode: "chat-with-tools" })), "unsupported_mode");
  const missing = createOfflineTestRuntime({ manifest: rt.manifest, gateConfigs: {} });
  assert.equal(await failureCode(missing, prepareInput(bundle)), "gate_config_missing");
  const wrongVersion = offlineRuntime({ ...SYNTHETIC_GATE_CONFIG, gateVersion: "history-gate/9.9.9" });
  assert.equal(await failureCode(wrongVersion, prepareInput(bundle)), "gate_version_mismatch");
});

test("pinned prepareTurn refuses every environment today", async () => {
  const { bundle } = await setup();
  for (const environment of ["production", "staging-pilot"]) {
    const out = await prepareTurn(prepareInput(bundle, { environment }));
    assert.deepEqual(out, { ok: false, failure: { stage: "precondition", code: "slug_not_enabled" } });
    assert.ok(Object.isFrozen(out) && Object.isFrozen(out.failure));
  }
  const offline = await prepareTurn(prepareInput(bundle));
  assert.deepEqual(offline.failure, { stage: "precondition", code: "environment_not_supported" });
});
