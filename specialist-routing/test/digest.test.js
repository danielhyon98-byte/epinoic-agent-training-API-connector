import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, test } from "node:test";
import { buildLabelSet, canonicalJson, catalogueDigest, labelSetDigest, policyDigest } from "../src/index.js";
import { clone, loadFixtures } from "./helpers.js";

const { catalogue, policy, evidenceFixture } = loadFixtures();

/** Rebuild every object with its keys in reverse order. */
function reverseKeys(v) {
  if (Array.isArray(v)) return v.map(reverseKeys);
  if (v && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v).reverse()) out[k] = reverseKeys(v[k]);
    return out;
  }
  return v;
}

describe("canonicalJson", () => {
  test("sorts keys at every level and writes no whitespace", () => {
    assert.equal(canonicalJson({ b: 1, a: [1, { d: 2, c: "x y" }], e: null, f: true }), '{"a":[1,{"c":"x y","d":2}],"b":1,"e":null,"f":true}');
  });

  test("normalises -0 and escapes lone surrogates", () => {
    assert.equal(canonicalJson(-0), "0");
    assert.equal(canonicalJson("\ud800"), '"\\ud800"');
  });

  test("rejects values that are not plain JSON", () => {
    const cyclic = {};
    cyclic.self = cyclic;
    // eslint-disable-next-line no-sparse-arrays
    const sparse = [1, , 3];
    for (const bad of [NaN, Infinity, -Infinity, undefined, () => 1, Symbol("s"), 1n, cyclic, new Date(0), new Map(), sparse, { a: undefined }]) {
      assert.throws(() => canonicalJson(bad), TypeError);
    }
  });
});

describe("digests", () => {
  test("catalogueDigest is SHA-256 of the canonical JSON (cross-checked with node:crypto)", async () => {
    const expected = createHash("sha256").update(canonicalJson(catalogue), "utf8").digest("hex");
    assert.equal(await catalogueDigest(catalogue), expected);
    assert.match(expected, /^[0-9a-f]{64}$/);
  });

  test("catalogueDigest is stable and matches the identity recorded in the generated evidence fixture", async () => {
    const a = await catalogueDigest(catalogue);
    const b = await catalogueDigest(clone(catalogue));
    assert.equal(a, b);
    assert.equal(a, evidenceFixture.evidence.catalogueSha256);
  });

  test("key order does not change any digest", async () => {
    assert.equal(await catalogueDigest(reverseKeys(catalogue)), await catalogueDigest(catalogue));
    const ls = buildLabelSet(catalogue);
    assert.equal(await labelSetDigest(reverseKeys(ls)), await labelSetDigest(ls));
    assert.equal(await policyDigest(reverseKeys(policy)), await policyDigest(policy));
  });

  test("any content change changes the catalogue digest", async () => {
    const base = await catalogueDigest(catalogue);
    const c = clone(catalogue);
    c.subjects[0].teachingScope += " ";
    assert.notEqual(await catalogueDigest(c), base);
    const d = clone(catalogue);
    d.subjects.reverse();
    assert.notEqual(await catalogueDigest(d), base, "array order is significant");
  });

  test("labelSetDigest matches the generated evidence fixture", async () => {
    assert.equal(await labelSetDigest(buildLabelSet(catalogue)), evidenceFixture.evidence.labelSetSha256);
  });

  test("policyDigest excludes thresholds and calibration but covers everything else", async () => {
    const base = await policyDigest(policy);
    const p = clone(policy);
    p.thresholds.routeMin = 0.9;
    p.calibration.recordId = "other";
    assert.equal(await policyDigest(p), base);
    const q = clone(policy);
    q.policyVersion = "fixture/0.1.1";
    assert.notEqual(await policyDigest(q), base);
  });
});
