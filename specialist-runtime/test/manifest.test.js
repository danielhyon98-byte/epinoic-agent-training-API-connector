import test from "node:test";
import assert from "node:assert/strict";
import { RUNTIME_MANIFEST, validateManifest } from "../src/index.js";
import { SYNTHETIC_MANIFEST, syntheticManifestWith } from "../fixtures/synthetic/manifest.js";
import { offlineRuntime } from "../fixtures/synthetic/harness.js";

const COMMIT = "0123456789abcdef0123456789abcdef01234567";

function runtimeManifestWith(entryOverrides, top = {}) {
  const copy = JSON.parse(JSON.stringify(RUNTIME_MANIFEST));
  Object.assign(copy.entries[0], entryOverrides);
  return Object.assign(copy, top);
}

const VERIFIED_PINS = {
  source: { repo: "Epinoic-AI/Epinoic-Agent-Training", commit: COMMIT, bundlePath: "knowledge-bases/history/bundle.md" },
  kbVersion: "history-kb-1",
  bundleSha256Status: "verified",
};

function codes(result) {
  return result.errors.map((e) => e.code);
}

test("the pinned manifest is valid, keeps pending pins null and enables nothing", () => {
  const v = validateManifest(RUNTIME_MANIFEST);
  assert.equal(v.ok, true, JSON.stringify(v.errors));
  assert.equal(RUNTIME_MANIFEST.schema, "epinoic.specialist-runtime-manifest.v1");
  assert.equal(RUNTIME_MANIFEST.manifestVersion, "2026-10-13.0");
  assert.equal(RUNTIME_MANIFEST.sourceStatus, "unverified-source");
  assert.equal(RUNTIME_MANIFEST.entries.length, 1);
  const [e] = RUNTIME_MANIFEST.entries;
  assert.equal(e.slug, "history");
  assert.equal(e.displayName, "History");
  assert.deepEqual(e.source, { repo: "Epinoic-AI/Epinoic-Agent-Training", commit: null, bundlePath: null });
  assert.equal(e.kbVersion, null);
  assert.equal(e.bundleSha256, "a5b8a2da6feb447ea06d9e38946ba50f71b14495e517169b5b3a418530119240");
  assert.equal(e.bundleSha256Status, "reported-by-audit-02-not-verified");
  assert.deepEqual(e.supportedModes, ["pilot-single-turn-no-tools"]);
  assert.equal(e.gateVersion, "history-gate/0.1.0");
  assert.equal(e.libraryManifestVersion, null);
  assert.equal(e.productionEnabled, false);
  assert.equal(e.stagingPilotEnabled, false);
});

test("validateManifest refuses staging enablement while pins are pending", () => {
  const v = validateManifest(runtimeManifestWith({ stagingPilotEnabled: true }));
  assert.equal(v.ok, false);
  assert.ok(codes(v).includes("enablement_requires_verified_pins"));
});

test("validateManifest refuses enablement with pins set but checksum not verified, or source not verified", () => {
  const notVerified = runtimeManifestWith({ ...VERIFIED_PINS, bundleSha256Status: "reported-by-audit-02-not-verified", stagingPilotEnabled: true }, { sourceStatus: "verified" });
  assert.ok(codes(validateManifest(notVerified)).includes("enablement_requires_verified_pins"));
  const sourceUnverified = runtimeManifestWith({ ...VERIFIED_PINS, stagingPilotEnabled: true });
  assert.ok(codes(validateManifest(sourceUnverified)).includes("enablement_requires_verified_pins"));
  const missingKb = runtimeManifestWith({ ...VERIFIED_PINS, kbVersion: null, stagingPilotEnabled: true }, { sourceStatus: "verified" });
  assert.ok(codes(validateManifest(missingKb)).includes("enablement_requires_verified_pins"));
});

test("validateManifest accepts staging enablement only with every pin verified (hypothetical reviewed change)", () => {
  const v = validateManifest(runtimeManifestWith({ ...VERIFIED_PINS, stagingPilotEnabled: true }, { sourceStatus: "verified" }));
  assert.equal(v.ok, true, JSON.stringify(v.errors));
});

test("validateManifest refuses productionEnabled: true under any conditions", () => {
  for (const m of [
    runtimeManifestWith({ productionEnabled: true }),
    runtimeManifestWith({ ...VERIFIED_PINS, productionEnabled: true, stagingPilotEnabled: true }, { sourceStatus: "verified" }),
  ]) {
    const v = validateManifest(m);
    assert.equal(v.ok, false);
    assert.ok(codes(v).includes("production_enablement_refused"));
  }
});

test("validateManifest requires libraryManifestVersion null (no library in the pilot)", () => {
  assert.ok(codes(validateManifest(runtimeManifestWith({ libraryManifestVersion: "mylib-1" }))).includes("library_manifest_not_supported"));
  const missing = runtimeManifestWith({});
  delete missing.entries[0].libraryManifestVersion;
  assert.ok(codes(validateManifest(missing)).includes("library_manifest_not_supported"));
});

test("validateManifest enforces unique, lowercase, kebab-case slugs", () => {
  for (const slug of ["History", "history_x", "-history", "history-", "his tory", ""]) {
    assert.ok(codes(validateManifest(runtimeManifestWith({ slug }))).includes("slug_invalid"), slug);
  }
  const dup = runtimeManifestWith({});
  dup.entries.push(JSON.parse(JSON.stringify(dup.entries[0])));
  assert.ok(codes(validateManifest(dup)).includes("slug_duplicate"));
  const second = runtimeManifestWith({});
  second.entries.push({ ...JSON.parse(JSON.stringify(second.entries[0])), slug: "economics", displayName: "Economics" });
  assert.equal(validateManifest(second).ok, true, "the registry stays extensible");
});

test("validateManifest refuses structural problems", () => {
  assert.deepEqual(codes(validateManifest(null)), ["manifest_not_object"]);
  assert.ok(codes(validateManifest({ ...JSON.parse(JSON.stringify(RUNTIME_MANIFEST)), schema: "x" })).includes("schema_invalid"));
  assert.ok(codes(validateManifest(runtimeManifestWith({}, { entries: [] }))).includes("entries_invalid"));
  assert.ok(codes(validateManifest(runtimeManifestWith({ offlineTestEnabled: true }))).includes("unknown_field"));
  assert.ok(codes(validateManifest(runtimeManifestWith({}, { environment: "offline-test" }))).includes("unknown_field"));
  assert.ok(codes(validateManifest(runtimeManifestWith({ source: { repo: "r", commit: "abc1234", bundlePath: null } }))).includes("source_commit_invalid"));
  assert.ok(codes(validateManifest(runtimeManifestWith({ source: { repo: "r", commit: null, bundlePath: "../x" } }))).includes("bundle_path_invalid"));
  assert.ok(codes(validateManifest(runtimeManifestWith({ supportedModes: ["chat-with-tools"] }))).includes("supported_modes_invalid"));
  assert.ok(codes(validateManifest(runtimeManifestWith({ bundleSha256: "A5B8" }))).includes("bundle_sha256_invalid"));
  assert.ok(codes(validateManifest(runtimeManifestWith({ bundleSha256Status: "synthetic-fixture" }))).includes("bundle_sha256_status_invalid"));
  assert.ok(codes(validateManifest(runtimeManifestWith({ stagingPilotEnabled: "yes" }))).includes("enablement_flag_invalid"));
});

test("validateManifest returns a frozen result with codes and paths only", () => {
  const v = validateManifest(runtimeManifestWith({ productionEnabled: true }));
  assert.ok(Object.isFrozen(v) && Object.isFrozen(v.errors) && Object.isFrozen(v.errors[0]));
  assert.deepEqual(Object.keys(v.errors[0]).sort(), ["code", "path"]);
});

test("the synthetic manifest is accepted only by the offline profile", () => {
  assert.equal(validateManifest(SYNTHETIC_MANIFEST).ok, false);
  const rt = offlineRuntime();
  assert.equal(rt.validateManifest(SYNTHETIC_MANIFEST).ok, true);
  assert.equal(rt.validateManifest(RUNTIME_MANIFEST).ok, false);
});

test("an offline manifest cannot enable production or staging-pilot", () => {
  const rt = offlineRuntime();
  assert.ok(codes(rt.validateManifest(syntheticManifestWith({ stagingPilotEnabled: true }))).includes("offline_manifest_cannot_enable_real_environment"));
  assert.ok(codes(rt.validateManifest(syntheticManifestWith({ productionEnabled: true }))).includes("production_enablement_refused"));
  assert.ok(codes(rt.validateManifest(syntheticManifestWith({}, { label: "no marker" }))).includes("synthetic_label_missing"));
  assert.ok(codes(rt.validateManifest(syntheticManifestWith({}, { environment: "staging-pilot" }))).includes("environment_invalid"));
});
