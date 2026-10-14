import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { RUNTIME_MANIFEST, createOfflineTestRuntime, loadPinnedBundle } from "../src/index.js";
import * as syntheticModuleNamespace from "../fixtures/synthetic/history.synthetic.bundle.mjs";
import { SYNTHETIC_GATE_CONFIG } from "../fixtures/synthetic/gate-config.js";
import { SYNTHETIC_BUNDLE_SHA256, SYNTHETIC_MANIFEST, syntheticManifestWith } from "../fixtures/synthetic/manifest.js";
import { SYNTHETIC_BUNDLE_MODULE, moduleForBytes, offlineRuntime, sha256Hex } from "../fixtures/synthetic/harness.js";

const TEXT_BYTES = readFileSync(new URL("../fixtures/synthetic/synthetic-bundle.txt", import.meta.url));

function runtimeFor(manifest) {
  return createOfflineTestRuntime({ manifest, gateConfigs: { history: SYNTHETIC_GATE_CONFIG } });
}

async function rejectsWith(promiseFn, code) {
  await assert.rejects(promiseFn, (err) => {
    assert.equal(err.name, "RuntimeIntegrityError");
    assert.equal(err.code, code);
    assert.ok(!String(err.message).includes("SYNTHETIC TEST BUNDLE"), "error messages carry codes, never bundle text");
    return true;
  });
}

const load = (rt, overrides = {}) =>
  rt.loadPinnedBundle({ slug: "history", bundleModule: SYNTHETIC_BUNDLE_MODULE, environment: "offline-test", ...overrides });

test("correct checksum: returns a frozen VerifiedBundle with the exact text", async () => {
  const b = await load(offlineRuntime());
  assert.ok(Object.isFrozen(b));
  assert.equal(b.schema, "epinoic.verified-bundle.v1");
  assert.equal(b.slug, "history");
  assert.equal(b.environment, "offline-test");
  assert.equal(b.sha256, SYNTHETIC_BUNDLE_SHA256);
  assert.equal(b.byteLength, TEXT_BYTES.length);
  assert.equal(b.text, TEXT_BYTES.toString("utf8"));
  assert.ok(b.text.startsWith("SYNTHETIC TEST BUNDLE — NOT THE EPINOIC HISTORY KNOWLEDGE BASE"));
  assert.equal(b.sourceCommit, "synthetic-no-commit");
});

test("accepts the module namespace ({ BUNDLE }) as well as the BUNDLE export", async () => {
  const b = await offlineRuntime().loadPinnedBundle({ slug: "history", bundleModule: syntheticModuleNamespace, environment: "offline-test" });
  assert.equal(b.sha256, SYNTHETIC_BUNDLE_SHA256);
});

test("wrong checksum: tampered bytes, or a module sha256 that differs from the manifest", async () => {
  const tampered = Buffer.from(TEXT_BYTES);
  tampered[0] = 0x58; // "X"
  const forged = { ...SYNTHETIC_BUNDLE_MODULE, base64: tampered.toString("base64") };
  await rejectsWith(() => load(offlineRuntime(), { bundleModule: forged }), "bundle_checksum_mismatch");

  const otherSha = moduleForBytes(tampered); // self-consistent module, but not the manifest's sha
  await rejectsWith(() => load(offlineRuntime(), { bundleModule: otherSha }), "bundle_checksum_mismatch");
});

test("module/manifest slug mismatch is refused", async () => {
  const mod = { ...SYNTHETIC_BUNDLE_MODULE, slug: "economics" };
  await rejectsWith(() => load(offlineRuntime(), { bundleModule: mod }), "bundle_slug_mismatch");
});

test("module provenance must match the manifest entry", async () => {
  for (const field of ["sourceRepo", "sourceCommit", "bundlePath", "kbVersion"]) {
    const mod = { ...SYNTHETIC_BUNDLE_MODULE, [field]: "something-else" };
    await rejectsWith(() => load(offlineRuntime(), { bundleModule: mod }), "bundle_provenance_mismatch");
  }
});

test("invalid base64 is refused (bad characters, whitespace, missing padding, non-canonical bits)", async () => {
  const b64 = SYNTHETIC_BUNDLE_MODULE.base64;
  for (const bad of ["!!!!" + b64.slice(4), b64.slice(0, 10) + "\n" + b64.slice(10), b64.replace(/=+$/, ""), "QR=="]) {
    await rejectsWith(() => load(offlineRuntime(), { bundleModule: { ...SYNTHETIC_BUNDLE_MODULE, base64: bad } }), "invalid_base64");
  }
});

test("invalid UTF-8 is refused after the checksum matches", async () => {
  const bytes = Uint8Array.from([0x53, 0x59, 0x4e, 0xff, 0xfe, 0x0a]);
  const rt = runtimeFor(syntheticManifestWith({ bundleSha256: sha256Hex(bytes) }));
  await rejectsWith(() => load(rt, { bundleModule: moduleForBytes(bytes) }), "invalid_utf8");
});

test("byteLength mismatch and malformed modules are refused", async () => {
  await rejectsWith(() => load(offlineRuntime(), { bundleModule: { ...SYNTHETIC_BUNDLE_MODULE, byteLength: 1 } }), "bundle_length_mismatch");
  await rejectsWith(() => load(offlineRuntime(), { bundleModule: { ...SYNTHETIC_BUNDLE_MODULE, extra: 1 } }), "bundle_module_invalid");
  await rejectsWith(() => load(offlineRuntime(), { bundleModule: { ...SYNTHETIC_BUNDLE_MODULE, schema: "x" } }), "bundle_module_invalid");
  await rejectsWith(() => load(offlineRuntime(), { bundleModule: null }), "bundle_module_invalid");
});

test("unknown slug is refused", async () => {
  await rejectsWith(() => load(offlineRuntime(), { slug: "economics" }), "unknown_slug");
  await rejectsWith(() => loadPinnedBundle({ slug: "economics", bundleModule: SYNTHETIC_BUNDLE_MODULE, environment: "staging-pilot" }), "unknown_slug");
});

test("a slug the environment does not enable is refused (offline fixture entry)", async () => {
  await rejectsWith(() => load(offlineRuntime(), { slug: "synthetic-disabled" }), "slug_not_enabled");
});

test("pinned runtime: history is disabled in production and staging-pilot", async () => {
  for (const environment of ["production", "staging-pilot"]) {
    await rejectsWith(() => loadPinnedBundle({ slug: "history", bundleModule: SYNTHETIC_BUNDLE_MODULE, environment }), "slug_not_enabled");
  }
});

test("pinned runtime refuses offline-test; offline runtime refuses production and staging-pilot", async () => {
  await rejectsWith(() => loadPinnedBundle({ slug: "history", bundleModule: SYNTHETIC_BUNDLE_MODULE, environment: "offline-test" }), "environment_not_supported");
  for (const environment of ["production", "staging-pilot", "staging", undefined]) {
    await rejectsWith(() => load(offlineRuntime(), { environment }), "environment_not_supported");
  }
});

test("createOfflineTestRuntime refuses the pinned manifest and invalid options", () => {
  const refuses = (options, code) =>
    assert.throws(() => createOfflineTestRuntime(options), (err) => err.name === "RuntimeIntegrityError" && err.code === code);
  refuses({ manifest: RUNTIME_MANIFEST, gateConfigs: {} }, "offline_manifest_invalid");
  refuses({ manifest: SYNTHETIC_MANIFEST, gateConfigs: { history: { ...SYNTHETIC_GATE_CONFIG, slug: "economics" } } }, "offline_gate_configs_invalid");
  refuses({ manifest: SYNTHETIC_MANIFEST, gateConfigs: {}, environment: "production" }, "offline_runtime_options_invalid");
  refuses(undefined, "offline_runtime_options_invalid");
});

test("loadPinnedBundle refuses unknown argument fields", async () => {
  await rejectsWith(() => load(offlineRuntime(), { skipChecksum: true }), "unknown_input_field");
});

test("BOM and CRLF line endings survive byte-for-byte", async () => {
  const bytes = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from("SYNTHETIC BOM FIXTURE\r\nline two\r\n", "utf8")]);
  const rt = runtimeFor(syntheticManifestWith({ bundleSha256: sha256Hex(bytes) }));
  const b = await load(rt, { bundleModule: moduleForBytes(bytes) });
  assert.equal(b.text.charCodeAt(0), 0xfeff);
  assert.ok(b.text.includes("\r\n"));
  assert.deepEqual(Buffer.from(new TextEncoder().encode(b.text)), bytes);
});
