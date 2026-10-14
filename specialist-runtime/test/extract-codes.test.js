import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ExtractRefusal, extractCodes } from "../tools/extract-codes.mjs";
import { SYNTHETIC_BUNDLE_SHA256 } from "../fixtures/synthetic/manifest.js";
import { SYNTHETIC_BUNDLE_MODULE } from "../fixtures/synthetic/harness.js";

const TOOL = fileURLToPath(new URL("../tools/extract-codes.mjs", import.meta.url));
const MODULE = fileURLToPath(new URL("../fixtures/synthetic/history.synthetic.bundle.mjs", import.meta.url));
const TEXT = fileURLToPath(new URL("../fixtures/synthetic/synthetic-bundle.txt", import.meta.url));

const dir = mkdtempSync(join(tmpdir(), "epinoic-codes-"));
test.after(() => rmSync(dir, { recursive: true, force: true }));

const run = (...args) => spawnSync(process.execPath, [TOOL, ...args], { encoding: "utf8" });

test("extracts sorted unique codes with the documented output shape", () => {
  const out = extractCodes(Buffer.from("B-2 A-1 B-2 A-10 c-3"), "[AB]-\\d+");
  assert.deepEqual(Object.keys(out), ["schema", "bundleSha256", "pattern", "codes"]);
  assert.equal(out.schema, "epinoic.specialist-bundle-codes.v1");
  assert.equal(out.pattern, "[AB]-\\d+");
  assert.deepEqual(out.codes, ["A-1", "A-10", "B-2"]);
});

test("CLI over the synthetic bundle module and bundle file", () => {
  const fromModule = run("--bundle-module", MODULE, "--pattern", "HXR-\\d{3}");
  assert.equal(fromModule.status, 0, fromModule.stderr);
  const json = JSON.parse(fromModule.stdout);
  assert.deepEqual(json.codes, ["HXR-101", "HXR-102", "HXR-215"]);
  assert.equal(json.bundleSha256, SYNTHETIC_BUNDLE_SHA256);

  const outFile = join(dir, "codes.json");
  const fromFile = run("--bundle-file", TEXT, "--pattern", "HXR-\\d{3}", "--out", outFile);
  assert.equal(fromFile.status, 0, fromFile.stderr);
  assert.deepEqual(JSON.parse(readFileSync(outFile, "utf8")), json);
});

test("--pattern is required and has no default; exactly one bundle source", () => {
  const noPattern = run("--bundle-module", MODULE);
  assert.equal(noPattern.status, 2);
  assert.match(noPattern.stderr, /missing required option --pattern/);
  assert.match(noPattern.stderr, /handoff\/04/);
  assert.equal(run("--pattern", "x").status, 2);
  assert.equal(run("--bundle-module", MODULE, "--bundle-file", TEXT, "--pattern", "HXR-\\d{3}").status, 2);
  assert.equal(run("--bundle-file", TEXT, "--pattern", "(").status, 2, "invalid regex");
});

test("refuses empty-matching patterns, no matches and benign-vocabulary matches", () => {
  const refuses = (fn, code) => assert.throws(fn, (e) => e instanceof ExtractRefusal && e.code === code);
  refuses(() => extractCodes(Buffer.from("HXR-101"), "x*"), "pattern_matches_empty");
  refuses(() => extractCodes(Buffer.from("HXR-101"), "ZZZ-\\d+"), "no_codes_matched");
  refuses(() => extractCodes(Buffer.from("Answer Paper 1 then Paper 2."), "Paper \\d"), "codes_include_benign_tokens");
  refuses(() => extractCodes(Buffer.from("In 1917 and 1918"), "\\d{4}"), "codes_include_benign_tokens");
  refuses(() => extractCodes(Uint8Array.from([0xff, 0xfe]), "x"), "invalid_utf8");
});

test("refuses a bundle module whose bytes do not match its own sha256", () => {
  const tampered = { ...SYNTHETIC_BUNDLE_MODULE, base64: Buffer.from("SYNTHETIC tampered HXR-101").toString("base64") };
  const file = join(dir, "tampered.bundle.mjs");
  writeFileSync(file, `export const BUNDLE = Object.freeze(${JSON.stringify(tampered)});\n`);
  const r = run("--bundle-module", file, "--pattern", "HXR-\\d{3}");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /bundle_checksum_mismatch/);
});
