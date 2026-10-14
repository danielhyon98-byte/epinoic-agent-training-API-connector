import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { selectSticky } from "../src/index.js";
import { brief, clone, deepFreeze, setup } from "./helpers.js";

const ctx = await setup();

describe("selectSticky (trusted follow-up path, no inference)", () => {
  test("a valid, available stored subject routes as sticky_subject", async () => {
    const r = await ctx.sticky("history");
    assert.deepEqual(brief(r), { outcome: "route", reason: "sticky_subject", slug: "history", candidates: [] });
    assert.equal(r.path, "sticky");
    assert.equal(r.inferencePerformed, false);
    assert.deepEqual(r.identity, { catalogueSha256: ctx.ids.catalogueSha256, labelSetSha256: null, policyVersion: null, calibrationFingerprint: null });
    assert.ok(Object.isFrozen(r));
  });

  test("an unknown slug, a browser route ID or a non-string is sticky_invalid", async () => {
    for (const slug of ["english", "visual-arts", "History", "", 42, null, undefined]) {
      const r = await ctx.sticky(slug);
      assert.deepEqual(brief(r), { outcome: "unavailable", reason: "sticky_invalid", slug: null, candidates: [] }, String(slug));
      assert.equal(r.inferencePerformed, false);
    }
  });

  test("a stored subject that is now unavailable or absent is specialist_unavailable, not replaced", async () => {
    await assert.doesNotReject(ctx.sticky("physics"));
    assert.deepEqual(brief(await ctx.sticky("physics")), { outcome: "unavailable", reason: "specialist_unavailable", slug: null, candidates: ["physics"] });
    assert.deepEqual(brief(await ctx.sticky("chemistry")), { outcome: "unavailable", reason: "specialist_unavailable", slug: null, candidates: ["chemistry"] });
    const caps = clone(ctx.capabilities);
    caps.entries.find((e) => e.slug === "history").available = false;
    const r = await ctx.sticky("history", { capabilities: caps });
    assert.deepEqual(r.candidates, [{ slug: "history", available: false }]);
    assert.equal(r.inferencePerformed, false);
  });

  test("needs no policy or calibration, but validates catalogue and capabilities", async () => {
    const broken = clone(ctx.catalogue);
    broken.families[0].members.push("drama");
    assert.equal((await ctx.sticky("history", { catalogue: broken })).reason, "identity_mismatch");
    const badCaps = clone(ctx.capabilities);
    badCaps.runtimeContractVersion = "x";
    assert.equal((await ctx.sticky("history", { capabilities: badCaps })).reason, "capabilities_invalid");
    const r = await selectSticky({ stickySlug: "history", catalogue: ctx.catalogue, capabilities: ctx.capabilities });
    assert.equal(r.reason, "capabilities_invalid", "offline-test capabilities need the harness flag");
    const live = { ...clone(ctx.capabilities), environment: "staging" };
    assert.equal((await selectSticky({ stickySlug: "history", catalogue: ctx.catalogue, capabilities: live })).reason, "sticky_subject");
  });

  test("does not mutate inputs and rejects unknown options", async () => {
    const catalogue = deepFreeze(clone(ctx.catalogue));
    const capabilities = deepFreeze(clone(ctx.capabilities));
    const r = await selectSticky({ stickySlug: "biology", catalogue, capabilities, options: deepFreeze({ offlineFixtureHarness: true }) });
    assert.equal(r.reason, "sticky_subject");
    await assert.rejects(selectSticky({ stickySlug: "biology", catalogue, capabilities, options: { reclassify: true } }), TypeError);
  });
});
