import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { PRODUCTION_POLICY, RoutingPolicyError, loadApprovedPolicy, validatePolicy } from "../src/index.js";
import { brief, clone, codes, setup } from "./helpers.js";

const ctx = await setup();
const approved = () => {
  const p = clone(ctx.policy);
  delete p.fixtureBrand;
  p.status = "approved";
  p.policyVersion = "approved/0.1.0";
  return p;
};

/** @param {() => unknown} fn @param {string} code */
function throwsCode(fn, code) {
  assert.throws(fn, (e) => e instanceof RoutingPolicyError && e.code === code);
}

describe("PRODUCTION_POLICY", () => {
  test("is unapproved with no thresholds and no calibration, deep-frozen", () => {
    assert.deepEqual(PRODUCTION_POLICY, {
      schema: "epinoic.routing-policy.v1",
      policyVersion: "production/0.1.0-unapproved",
      status: "unapproved",
      thresholds: null,
      calibration: null,
    });
    assert.ok(Object.isFrozen(PRODUCTION_POLICY));
    assert.equal(validatePolicy(PRODUCTION_POLICY).ok, true);
  });

  test("cannot start new classification: selectSpecialist returns unavailable/calibration_missing", async () => {
    for (const harness of [true, false]) {
      const r = await ctx.select(ctx.evidence({ history: 0.95 }), {
        policy: PRODUCTION_POLICY,
        options: { ...ctx.options, offlineFixtureHarness: harness },
        capabilities: { ...ctx.capabilities, environment: "staging" },
      });
      assert.deepEqual(brief(r), { outcome: "unavailable", reason: "calibration_missing", slug: null, candidates: [] });
      assert.equal(r.identity.policyVersion, PRODUCTION_POLICY.policyVersion);
      assert.equal(r.identity.calibrationFingerprint, null);
    }
  });

  test("loadApprovedPolicy rejects it with calibration_missing", () => {
    throwsCode(() => loadApprovedPolicy(PRODUCTION_POLICY), "calibration_missing");
  });
});

describe("fixture policy", () => {
  test("is fixture-only, branded and carries a calibration fingerprint", () => {
    assert.equal(ctx.policy.status, "fixture-only");
    assert.equal(ctx.policy.fixtureBrand, "SYNTHETIC-FIXTURE-NOT-FOR-PRODUCTION");
    assert.match(ctx.policy.calibration.fingerprint, /^[0-9a-f]{64}$/);
    assert.equal(validatePolicy(ctx.policy).ok, true);
  });

  test("selectSpecialist rejects it unless options.offlineFixtureHarness === true", async () => {
    const live = { ...ctx.capabilities, environment: "staging" };
    for (const options of [{ ...ctx.options, offlineFixtureHarness: false }, { limits: ctx.options.limits, calibrationContext: ctx.options.calibrationContext }]) {
      const r = await ctx.select(ctx.evidence({ history: 0.95 }), { options, capabilities: live });
      assert.deepEqual(brief(r), { outcome: "unavailable", reason: "fixture_policy_rejected", slug: null, candidates: [] });
    }
    const ok = await ctx.select(ctx.evidence({ history: 0.95 }));
    assert.equal(ok.outcome, "route");
  });

  test("loadApprovedPolicy always rejects it, whatever its status claims", () => {
    throwsCode(() => loadApprovedPolicy(ctx.policy), "fixture_policy_rejected");
    const relabelled = clone(ctx.policy);
    relabelled.status = "approved";
    throwsCode(() => loadApprovedPolicy(relabelled), "fixture_policy_rejected");
  });
});

describe("validatePolicy and loadApprovedPolicy", () => {
  test("an approved policy with thresholds and calibration loads as a frozen copy", () => {
    const p = approved();
    const loaded = loadApprovedPolicy(p);
    assert.deepEqual(loaded, p);
    assert.notEqual(loaded, p);
    assert.ok(Object.isFrozen(loaded) && Object.isFrozen(loaded.thresholds));
  });

  test("approved without thresholds or calibration, or unapproved, is calibration_missing", () => {
    const a = approved();
    a.calibration = null;
    throwsCode(() => loadApprovedPolicy(a), "calibration_missing");
    const b = approved();
    b.thresholds = null;
    throwsCode(() => loadApprovedPolicy(b), "calibration_missing");
    const c = approved();
    c.status = "unapproved";
    throwsCode(() => loadApprovedPolicy(c), "calibration_missing");
  });

  test("structural errors are policy_invalid", () => {
    const cases = [
      (p) => { p.extra = 1; },
      (p) => { p.thresholds.routeMin = 1.5; },
      (p) => { p.thresholds.marginMin = 0; },
      (p) => { p.thresholds.familyMin = NaN; },
      (p) => { delete p.thresholds.taskContextMin; },
      (p) => { p.thresholds.clarifyFloor = 0.7; },
      (p) => { p.thresholds.marginMin = 0.6; },
      (p) => { p.calibration.fingerprint = "abc"; },
      (p) => { p.calibration.model = "x"; },
      (p) => { p.status = "live"; },
      (p) => { p.schema = "epinoic.routing-policy.v2"; },
    ];
    for (const mutate of cases) {
      const p = approved();
      mutate(p);
      assert.equal(validatePolicy(p).ok, false);
      throwsCode(() => loadApprovedPolicy(p), "policy_invalid");
    }
  });

  test("fixtureBrand is required for fixture-only and forbidden otherwise", () => {
    const a = clone(ctx.policy);
    delete a.fixtureBrand;
    assert.ok(codes(validatePolicy(a)).includes("missing_fixture_brand"));
    const b = approved();
    b.fixtureBrand = "SYNTHETIC-FIXTURE-NOT-FOR-PRODUCTION";
    assert.ok(codes(validatePolicy(b)).includes("unknown_field"));
    throwsCode(() => loadApprovedPolicy(b), "fixture_policy_rejected");
  });

  test("a structurally invalid policy stops selection with calibration_missing", async () => {
    const p = clone(ctx.policy);
    p.thresholds.routeMin = 2;
    const r = await ctx.select(ctx.evidence({ history: 0.95 }), { policy: p });
    assert.deepEqual(brief(r), { outcome: "unavailable", reason: "calibration_missing", slug: null, candidates: [] });
    assert.equal(r.identity.policyVersion, null);
  });

  test("a fixture policy without calibration is calibration_missing even in the harness", async () => {
    const p = clone(ctx.policy);
    p.calibration = null;
    const r = await ctx.select(ctx.evidence({ history: 0.95 }), { policy: p });
    assert.equal(r.reason, "calibration_missing");
  });
});
