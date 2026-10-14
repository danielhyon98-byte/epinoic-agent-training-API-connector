import test from "node:test";
import assert from "node:assert/strict";
import { createOfflineTestRuntime, getCapabilities } from "../src/index.js";
import { SYNTHETIC_MANIFEST } from "../fixtures/synthetic/manifest.js";
import { offlineRuntime } from "../fixtures/synthetic/harness.js";

const ENTRY_KEYS = ["slug", "available", "supportedModes", "gateVersion", "bundleSha256"];

test("getCapabilities has the documented shape and is frozen", () => {
  const caps = getCapabilities({ environment: "staging-pilot" });
  assert.deepEqual(Object.keys(caps), ["schema", "runtimeContractVersion", "manifestVersion", "environment", "entries"]);
  assert.equal(caps.schema, "epinoic.specialist-capabilities.v1");
  assert.equal(caps.runtimeContractVersion, "epinoic.specialist-runtime.v0.1.0");
  assert.equal(caps.manifestVersion, "2026-10-13.0");
  assert.equal(caps.environment, "staging-pilot");
  assert.equal(caps.entries.length, 1);
  assert.deepEqual(Object.keys(caps.entries[0]), ENTRY_KEYS);
  assert.deepEqual(caps.entries[0], {
    slug: "history",
    available: false,
    supportedModes: ["pilot-single-turn-no-tools"],
    gateVersion: "history-gate/0.1.0",
    bundleSha256: "a5b8a2da6feb447ea06d9e38946ba50f71b14495e517169b5b3a418530119240",
  });
  assert.ok(Object.isFrozen(caps) && Object.isFrozen(caps.entries) && Object.isFrozen(caps.entries[0]));
});

test("pinned manifest: every entry is unavailable in every environment", () => {
  for (const environment of ["production", "staging-pilot", "offline-test", "staging", "dev", ""]) {
    const caps = getCapabilities({ environment });
    assert.equal(caps.environment, environment);
    assert.ok(caps.entries.every((e) => e.available === false), environment);
  }
});

test("a non-string environment is a programming error", () => {
  for (const args of [undefined, {}, { environment: 1 }, null]) {
    assert.throws(() => getCapabilities(args), (err) => err.name === "RuntimeIntegrityError" && err.code === "environment_invalid");
  }
});

test("offline runtime: available only where the synthetic manifest enables it and a gate config exists", () => {
  const rt = offlineRuntime();
  const offline = rt.getCapabilities({ environment: "offline-test" });
  assert.deepEqual(offline.entries.map((e) => [e.slug, e.available]), [["history", true], ["synthetic-disabled", false]]);
  for (const environment of ["production", "staging-pilot"]) {
    assert.ok(rt.getCapabilities({ environment }).entries.every((e) => !e.available), environment);
  }
  const noGate = createOfflineTestRuntime({ manifest: SYNTHETIC_MANIFEST, gateConfigs: {} });
  assert.equal(noGate.getCapabilities({ environment: "offline-test" }).entries[0].available, false);
});
