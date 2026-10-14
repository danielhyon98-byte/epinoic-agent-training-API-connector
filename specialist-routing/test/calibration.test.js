import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { checkCalibration, computeCalibrationFingerprint, policyDigest } from "../src/index.js";
import { brief, clone, setup } from "./helpers.js";

const ctx = await setup();
const identity = async () => ({
  model: ctx.harness.calibrationContext.model,
  labelSetSha256: ctx.ids.labelSetSha256,
  catalogueSha256: ctx.ids.catalogueSha256,
  policySha256: await policyDigest(ctx.policy),
  adapterVersion: ctx.harness.adapter.version,
  excerptVersion: ctx.harness.excerpt.version,
  datasets: clone(ctx.harness.calibrationContext.datasets),
});

describe("computeCalibrationFingerprint", () => {
  test("the fixture policy fingerprint is the fingerprint of the fixture identity", async () => {
    const fp = await computeCalibrationFingerprint(await identity());
    assert.equal(fp, ctx.policy.calibration.fingerprint);
    assert.equal(await computeCalibrationFingerprint(await identity()), fp, "deterministic");
  });

  test("a change to any identity field changes the fingerprint", async () => {
    const base = await computeCalibrationFingerprint(await identity());
    const changes = {
      model: (i) => { i.model = "another-model"; },
      labelSetSha256: (i) => { i.labelSetSha256 = "1".repeat(64); },
      catalogueSha256: (i) => { i.catalogueSha256 = "2".repeat(64); },
      policySha256: (i) => { i.policySha256 = "3".repeat(64); },
      adapterVersion: (i) => { i.adapterVersion = "synthetic-adapter/0.1.1"; },
      excerptVersion: (i) => { i.excerptVersion = "synthetic-excerpt/0.2.0"; },
      tuneSha256: (i) => { i.datasets.tuneSha256 = "4".repeat(64); },
      holdoutSha256: (i) => { i.datasets.holdoutSha256 = "5".repeat(64); },
    };
    const seen = new Set([base]);
    for (const [name, mutate] of Object.entries(changes)) {
      const i = await identity();
      mutate(i);
      const fp = await computeCalibrationFingerprint(i);
      assert.ok(!seen.has(fp), name);
      seen.add(fp);
    }
  });

  test("every field is required and no other field is accepted", async () => {
    for (const key of ["model", "labelSetSha256", "catalogueSha256", "policySha256", "adapterVersion", "excerptVersion", "datasets"]) {
      const i = await identity();
      delete i[key];
      await assert.rejects(computeCalibrationFingerprint(i), TypeError, key);
    }
    const a = await identity();
    delete a.datasets.holdoutSha256;
    await assert.rejects(computeCalibrationFingerprint(a), TypeError);
    const b = await identity();
    b.thresholds = {};
    await assert.rejects(computeCalibrationFingerprint(b), TypeError);
    const c = await identity();
    c.catalogueSha256 = "XYZ";
    await assert.rejects(computeCalibrationFingerprint(c), TypeError);
  });
});

describe("checkCalibration", () => {
  test("ok for the fixture identity", async () => {
    const r = await checkCalibration({ policy: ctx.policy, identity: await identity() });
    assert.deepEqual(r, { ok: true, reason: null, fingerprint: ctx.policy.calibration.fingerprint, detail: null });
    assert.ok(Object.isFrozen(r));
  });

  test("stale or mismatched identity gives calibration_mismatch", async () => {
    const stale = await identity();
    stale.datasets.tuneSha256 = "6".repeat(64);
    assert.equal((await checkCalibration({ policy: ctx.policy, identity: stale })).reason, "calibration_mismatch");
    const wrongPolicy = await identity();
    wrongPolicy.policySha256 = "7".repeat(64);
    assert.equal((await checkCalibration({ policy: ctx.policy, identity: wrongPolicy })).reason, "calibration_mismatch");
    const incomplete = await identity();
    delete incomplete.model;
    assert.equal((await checkCalibration({ policy: ctx.policy, identity: incomplete })).reason, "calibration_mismatch");
  });

  test("a policy without calibration gives calibration_missing", async () => {
    const p = clone(ctx.policy);
    p.calibration = null;
    assert.equal((await checkCalibration({ policy: p, identity: await identity() })).reason, "calibration_missing");
    assert.equal((await checkCalibration({ policy: {}, identity: await identity() })).reason, "calibration_missing");
  });

  test("thresholds are outside the fingerprint (contract section 7): editing them alone keeps it valid", async () => {
    const p = clone(ctx.policy);
    p.thresholds.routeMin = 0.7;
    assert.equal((await checkCalibration({ policy: p, identity: { ...(await identity()), policySha256: await policyDigest(p) } })).ok, true);
  });
});

describe("selection enforces the calibration fingerprint", () => {
  const mismatch = { outcome: "unavailable", reason: "calibration_mismatch", slug: null, candidates: [] };

  test("a changed model or dataset in the calibration context", async () => {
    const model = { ...ctx.options, calibrationContext: { ...ctx.options.calibrationContext, model: "other-model" } };
    assert.deepEqual(brief(await ctx.select(ctx.evidence({ history: 0.9 }), { options: model })), mismatch);
    const datasets = clone(ctx.options);
    datasets.calibrationContext.datasets.holdoutSha256 = "8".repeat(64);
    assert.deepEqual(brief(await ctx.select(ctx.evidence({ history: 0.9 }), { options: datasets })), mismatch);
  });

  test("a missing or malformed calibration context", async () => {
    const { calibrationContext, ...rest } = ctx.options;
    assert.ok(calibrationContext);
    assert.deepEqual(brief(await ctx.select(ctx.evidence({ history: 0.9 }), { options: rest })), mismatch);
    const extra = { ...ctx.options, calibrationContext: { ...ctx.options.calibrationContext, thresholds: {} } };
    assert.deepEqual(brief(await ctx.select(ctx.evidence({ history: 0.9 }), { options: extra })), mismatch);
  });

  test("evidence from a different adapter or excerpt version", async () => {
    const a = ctx.evidence({ history: 0.9 });
    a.adapter.version = "synthetic-adapter/0.2.0";
    assert.deepEqual(brief(await ctx.select(a)), mismatch);
    const e = ctx.evidence({ history: 0.9 });
    e.excerpt.version = "synthetic-excerpt/0.1.0-head-4096";
    assert.deepEqual(brief(await ctx.select(e)), mismatch);
  });

  test("a policy edit outside thresholds (policyVersion) makes the record stale", async () => {
    const p = clone(ctx.policy);
    p.policyVersion = "fixture/0.1.1";
    const r = await ctx.select(ctx.evidence({ history: 0.9 }), { policy: p });
    assert.deepEqual(brief(r), mismatch);
    assert.equal(r.identity.calibrationFingerprint, null);
  });

  test("a matching identity reports the verified fingerprint", async () => {
    const r = await ctx.select(ctx.evidence({ history: 0.9 }));
    assert.equal(r.identity.calibrationFingerprint, ctx.policy.calibration.fingerprint);
  });
});
