import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { validateCapabilities } from "../src/index.js";
import { brief, clone, codes, setup } from "./helpers.js";

const ctx = await setup();
const caps = () => clone(ctx.capabilities);
const check = (c) => validateCapabilities(c, { catalogue: ctx.catalogue });

describe("validateCapabilities", () => {
  test("the synthetic fixture has the runtime's exact shape and validates", () => {
    assert.deepEqual(check(ctx.capabilities), { ok: true, errors: [] });
    assert.deepEqual(Object.keys(ctx.capabilities), ["schema", "runtimeContractVersion", "manifestVersion", "environment", "entries"]);
    for (const e of ctx.capabilities.entries) {
      assert.deepEqual(Object.keys(e), ["slug", "available", "supportedModes", "gateVersion", "bundleSha256"]);
    }
    assert.equal(ctx.capabilities.environment, "offline-test");
    const available = ctx.capabilities.entries.filter((e) => e.available).map((e) => e.slug);
    const present = ctx.capabilities.entries.map((e) => e.slug);
    assert.ok(available.includes("history"));
    assert.ok(present.includes("physics") && !available.includes("physics"));
    assert.ok(present.length < ctx.catalogue.subjects.length / 2, "most subjects are absent");
  });

  test("rejects an unknown schema or runtime contract version", () => {
    const a = caps();
    a.schema = "epinoic.specialist-capabilities.v2";
    assert.ok(codes(check(a)).includes("schema_mismatch"));
    const b = caps();
    b.runtimeContractVersion = "epinoic.specialist-runtime.v9.0.0";
    assert.ok(codes(check(b)).includes("unsupported_runtime_contract"));
  });

  test("rejects duplicate entry slugs and slugs absent from the catalogue", () => {
    const a = caps();
    a.entries.push(clone(a.entries[0]));
    assert.ok(codes(check(a)).includes("duplicate_slug"));
    const b = caps();
    b.entries.push({ slug: "visual-arts", available: false, supportedModes: [], gateVersion: null, bundleSha256: null });
    assert.ok(codes(check(b)).includes("unknown_slug"));
    const c = caps();
    c.entries[0].slug = "english";
    assert.ok(codes(check(c)).includes("unknown_slug"), "website route IDs are not catalogue slugs");
  });

  test("rejects unknown fields, bad types and an available entry without mode, gate or bundle", () => {
    const a = caps();
    a.entries[0].priority = 1;
    assert.ok(codes(check(a)).includes("unknown_field"));
    const b = caps();
    b.registry = {};
    assert.ok(codes(check(b)).includes("unknown_field"));
    const c = caps();
    c.entries[0].available = "yes";
    assert.ok(codes(check(c)).includes("type"));
    const d = caps();
    d.entries[0].bundleSha256 = null;
    assert.ok(codes(check(d)).includes("available_without_bundle"));
    const e = caps();
    e.entries[0].supportedModes = [];
    assert.ok(codes(check(e)).includes("available_without_mode"));
    const f = caps();
    f.entries[0].gateVersion = null;
    assert.ok(codes(check(f)).includes("available_without_gate"));
    assert.equal(check(null).ok, false);
    assert.ok(codes(validateCapabilities(caps(), {})).includes("catalogue_invalid"));
  });

  test("a subject with no entry is not available, which is not an error", async () => {
    assert.ok(!ctx.capabilities.entries.some((e) => e.slug === "chemistry"));
    const r = await ctx.select(ctx.evidence({ chemistry: 0.9 }));
    assert.deepEqual(brief(r), { outcome: "unavailable", reason: "specialist_unavailable", slug: null, candidates: ["chemistry"] });
    assert.deepEqual(r.candidates, [{ slug: "chemistry", available: false }]);
  });

  test("invalid capabilities stop selection with capabilities_invalid", async () => {
    const bad = caps();
    bad.entries.push(clone(bad.entries[0]));
    const r = await ctx.select(ctx.evidence({ history: 0.9 }), { capabilities: bad });
    assert.deepEqual(brief(r), { outcome: "unavailable", reason: "capabilities_invalid", slug: null, candidates: [] });
  });
});
