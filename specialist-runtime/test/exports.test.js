import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as api from "../src/index.js";
import { loadSyntheticBundle, offlineRuntime, prepareInput } from "../fixtures/synthetic/harness.js";

const CONTRACT_EXPORTS = [
  "RUNTIME_CONTRACT_VERSION",
  "PILOT_MODE",
  "RUNTIME_MANIFEST",
  "REPORTED_WEBSITE_LIMITS",
  "validateManifest",
  "getCapabilities",
  "loadPinnedBundle",
  "prepareTurn",
  "runSpecialistTurn",
  "runGate",
  "HISTORY_GATE_CONFIG",
  "createOfflineTestRuntime",
  "redactForLog",
];

function isDeepFrozen(value) {
  if (value === null || typeof value !== "object") return true;
  return Object.isFrozen(value) && Object.values(value).every(isDeepFrozen);
}

test("src/index.js exports exactly the contract's export table", () => {
  assert.deepEqual(Object.keys(api).sort(), [...CONTRACT_EXPORTS].sort());
});

test("export kinds and constant values match the contract", () => {
  assert.equal(api.RUNTIME_CONTRACT_VERSION, "epinoic.specialist-runtime.v0.1.0");
  assert.equal(api.PILOT_MODE, "pilot-single-turn-no-tools");
  for (const fn of ["validateManifest", "getCapabilities", "loadPinnedBundle", "prepareTurn", "runSpecialistTurn", "runGate", "createOfflineTestRuntime", "redactForLog"]) {
    assert.equal(typeof api[fn], "function", fn);
  }
});

test("RUNTIME_MANIFEST, REPORTED_WEBSITE_LIMITS and HISTORY_GATE_CONFIG are deeply frozen", () => {
  assert.ok(isDeepFrozen(api.RUNTIME_MANIFEST));
  assert.ok(isDeepFrozen(api.REPORTED_WEBSITE_LIMITS));
  assert.ok(isDeepFrozen(api.HISTORY_GATE_CONFIG));
  assert.throws(() => {
    api.RUNTIME_MANIFEST.entries[0].stagingPilotEnabled = true;
  }, TypeError);
});

test("REPORTED_WEBSITE_LIMITS are reference-only handoff values and never used as defaults", async () => {
  assert.equal(api.REPORTED_WEBSITE_LIMITS.usage, "reference-only-never-defaults");
  assert.equal(api.REPORTED_WEBSITE_LIMITS.status, "reported-in-handoff-not-read-from-website-source");
  assert.deepEqual({ ...api.REPORTED_WEBSITE_LIMITS.values }, {
    messageMaxCodePoints: 12000,
    requestBodyMaxBytes: 32768,
    storedResultMaxBytes: 65536,
    turnDeadlineSeconds: 180,
  });
  const rt = offlineRuntime();
  const bundle = await loadSyntheticBundle(rt);
  const out = await rt.prepareTurn(prepareInput(bundle, { limits: undefined }));
  assert.deepEqual(out, { ok: false, failure: { stage: "precondition", code: "limits_missing" } });
});

test("package.json: zero dependencies, required scripts, engines and ES modules", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.name, "@epinoic/specialist-runtime");
  assert.equal(pkg.version, "0.1.0");
  assert.equal(pkg.private, true);
  assert.equal(pkg.type, "module");
  assert.equal(pkg.engines.node, ">=22");
  assert.equal(pkg.scripts.test, "node --test test/");
  assert.equal(pkg.scripts["check:portable"], "node tools/check-portable.mjs");
  for (const k of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies", "bundledDependencies"]) {
    assert.equal(pkg[k], undefined, k);
  }
});

test("exported bundle modules are git-ignored by the package", () => {
  const ignore = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");
  assert.match(ignore, /^dist\/$/m);
});
