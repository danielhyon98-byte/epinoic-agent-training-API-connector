import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { buildSyntheticModuleSource } from "../fixtures/synthetic/build-synthetic-bundle.mjs";
import { SYNTHETIC_GATE_CONFIG } from "../fixtures/synthetic/gate-config.js";
import { SYNTHETIC_BUNDLE_SHA256, SYNTHETIC_MANIFEST } from "../fixtures/synthetic/manifest.js";
import { SYNTHETIC_BUNDLE_MODULE } from "../fixtures/synthetic/harness.js";

const TEXT_URL = new URL("../fixtures/synthetic/synthetic-bundle.txt", import.meta.url);
const MODULE_URL = new URL("../fixtures/synthetic/history.synthetic.bundle.mjs", import.meta.url);

test("the synthetic bundle says it is synthetic, in its own first line", () => {
  const text = readFileSync(TEXT_URL, "utf8");
  assert.ok(text.startsWith("SYNTHETIC TEST BUNDLE — NOT THE EPINOIC HISTORY KNOWLEDGE BASE\n"));
  for (const code of SYNTHETIC_GATE_CONFIG.checks["internal-code-leakage"].codes) assert.ok(text.includes(code), code);
});

test("the committed synthetic module matches its builder and the text file", () => {
  assert.equal(readFileSync(MODULE_URL, "utf8"), buildSyntheticModuleSource());
  assert.deepEqual(Buffer.from(SYNTHETIC_BUNDLE_MODULE.base64, "base64"), readFileSync(TEXT_URL));
});

test("the synthetic manifest's checksum is the independent SHA-256 of the text file", () => {
  const sha = createHash("sha256").update(readFileSync(TEXT_URL)).digest("hex");
  assert.equal(SYNTHETIC_BUNDLE_SHA256, sha);
  assert.equal(SYNTHETIC_MANIFEST.entries[0].bundleSha256, sha);
  assert.equal(SYNTHETIC_BUNDLE_MODULE.sha256, sha);
});

test("synthetic fixtures are labelled and confined to offline-test", () => {
  assert.equal(SYNTHETIC_MANIFEST.environment, "offline-test");
  assert.equal(SYNTHETIC_MANIFEST.sourceStatus, "synthetic-offline-test");
  assert.match(SYNTHETIC_MANIFEST.label, /SYNTHETIC/);
  for (const e of SYNTHETIC_MANIFEST.entries) {
    assert.equal(e.productionEnabled, false);
    assert.equal(e.stagingPilotEnabled, false);
    assert.equal(e.bundleSha256Status, "synthetic-fixture");
  }
  assert.equal(SYNTHETIC_GATE_CONFIG.synthetic, true);
  assert.match(SYNTHETIC_GATE_CONFIG.label, /SYNTHETIC/);
  assert.match(SYNTHETIC_BUNDLE_MODULE.sourceRepo, /synthetic/);
});
