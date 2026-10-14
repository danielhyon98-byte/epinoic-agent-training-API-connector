import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { buildLabelSet, validateEvidence } from "../src/index.js";
import { clone, codes, setup } from "./helpers.js";

const ctx = await setup();
const context = () => ({ catalogue: ctx.catalogue, labelSet: ctx.labelSet, limits: { maxExcerptUtf8Bytes: 2048 } });
const valid = () => ctx.evidence({ history: 0.9, geography: 0.2 }, { english: 0.1 }, { needs_task_context: 0.1 });
const check = (ev, c = context()) => validateEvidence(ev, c);

describe("validateEvidence", () => {
  test("accepts well-formed evidence, including several plausible subjects", async () => {
    assert.deepEqual(await check(valid()), { ok: true, errors: [] });
    const several = ctx.evidence({ ess: 0.7, biology: 0.69, geography: 0.68, history: 0.6 });
    assert.equal((await check(several)).ok, true);
    assert.equal((await check(ctx.evidence())).ok, true, "empty subject and family lists are valid");
  });

  test("rejects an unknown subject or family label", async () => {
    assert.ok(codes(await check(ctx.evidence({ drama: 0.8 }))).includes("unknown_label"));
    assert.ok(codes(await check(ctx.evidence({}, { sciences: 0.8 }))).includes("unknown_label"));
    assert.ok(codes(await check(ctx.evidence({ english: 0.8 }))).includes("unknown_label"), "a family id is not a subject label");
  });

  test("rejects a repeated label, contradictory or identical", async () => {
    const contradictory = valid();
    contradictory.subjects.push({ label: "history", score: 0.1 });
    const r1 = await check(contradictory);
    assert.ok(r1.errors.some((e) => e.code === "duplicate_label" && e.detail.includes("contradictory")));
    const identical = valid();
    identical.subjects.push({ label: "history", score: 0.9 });
    const r2 = await check(identical);
    assert.ok(r2.errors.some((e) => e.code === "duplicate_label" && e.detail.includes("identical")));
    const fam = valid();
    fam.families.push({ label: "english", score: 0.1 });
    assert.ok(codes(await check(fam)).includes("duplicate_label"));
  });

  test("rejects missing fields at every level", async () => {
    for (const key of ["schema", "labelSetVersion", "labelSetSha256", "catalogueSha256", "adapter", "excerpt", "subjects", "families", "flags"]) {
      const ev = valid();
      delete ev[key];
      assert.ok(codes(await check(ev)).includes("missing_field"), key);
    }
    for (const [obj, key] of [["adapter", "version"], ["excerpt", "truncated"], ["flags", "mixed_request"]]) {
      const ev = valid();
      delete ev[obj][key];
      assert.ok(codes(await check(ev)).includes("missing_field"), `${obj}.${key}`);
    }
    const ev = valid();
    delete ev.subjects[0].score;
    assert.ok(codes(await check(ev)).includes("missing_field"));
  });

  test("rejects NaN, Infinity and out-of-range scores", async () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      assert.ok(codes(await check(ctx.evidence({ history: bad }))).includes("non_finite"), String(bad));
      assert.ok(codes(await check(ctx.evidence({}, {}, { out_of_scope: bad }))).includes("non_finite"));
    }
    for (const bad of [-0.01, 1.01, 2]) {
      assert.ok(codes(await check(ctx.evidence({ history: bad }))).includes("out_of_range"), String(bad));
      assert.ok(codes(await check(ctx.evidence({}, { mathematics: bad }))).includes("out_of_range"));
    }
    assert.ok(codes(await check(ctx.evidence({ history: "0.9" }))).includes("type"));
    assert.equal((await check(ctx.evidence({ history: 0, physics: 1 }))).ok, true, "0 and 1 are in range");
  });

  test("rejects an excerpt over the byte limit and inconsistent excerpt counts", async () => {
    const big = valid();
    big.excerpt.utf8Bytes = 2049;
    big.excerpt.codePoints = 2049;
    assert.ok(codes(await check(big)).includes("excerpt_oversize"));
    const edge = valid();
    edge.excerpt.utf8Bytes = 2048;
    edge.excerpt.codePoints = 700;
    assert.equal((await check(edge)).ok, true, "exactly at the limit is allowed");
    const inconsistent = valid();
    inconsistent.excerpt.utf8Bytes = 10;
    inconsistent.excerpt.codePoints = 11;
    assert.ok(codes(await check(inconsistent)).includes("excerpt_inconsistent"));
    const fractional = valid();
    fractional.excerpt.utf8Bytes = 10.5;
    assert.ok(codes(await check(fractional)).includes("out_of_range"));
  });

  test("rejects identity mismatches: label-set hash, catalogue hash, label-set version", async () => {
    const ls = valid();
    ls.labelSetSha256 = "0".repeat(64);
    assert.ok(codes(await check(ls)).includes("label_set_hash_mismatch"));
    const cat = valid();
    cat.catalogueSha256 = "f".repeat(64);
    assert.ok(codes(await check(cat)).includes("catalogue_hash_mismatch"));
    const ver = valid();
    ver.labelSetVersion = "routing-labels/9.9.9";
    assert.ok(codes(await check(ver)).includes("label_set_version_mismatch"));
  });

  test("rejects smuggled route, slug, model and override fields anywhere", async () => {
    const cases = [
      (ev) => { ev.route = "physics"; },
      (ev) => { ev.slug = "physics"; },
      (ev) => { ev.model = "gliner"; },
      (ev) => { ev.override = { slug: "physics" }; },
      (ev) => { ev.adapter.model = "x"; },
      (ev) => { ev.subjects[0].slug = "physics"; },
      (ev) => { ev.subjects[0].route = true; },
      (ev) => { ev.flags.override = 1; },
      (ev) => { ev.excerpt.targetSpecialist = "physics"; },
      (ev) => { ev.provider = "fastino"; },
      (ev) => { ev.available = true; },
    ];
    for (const mutate of cases) {
      const ev = valid();
      mutate(ev);
      const r = await check(ev);
      assert.equal(r.ok, false);
      assert.ok(codes(r).includes("forbidden_field"), JSON.stringify(r.errors));
    }
  });

  test("rejects other unknown top-level and nested fields", async () => {
    for (const mutate of [
      (ev) => { ev.extra = 1; },
      (ev) => { ev.adapter.build = "1"; },
      (ev) => { ev.subjects[0].confidence = 0.2; },
      (ev) => { ev.flags.sarcasm = 0.2; },
      (ev) => { ev.excerpt.text = "the raw message"; },
    ]) {
      const ev = valid();
      mutate(ev);
      assert.ok(codes(await check(ev)).includes("unknown_field"));
    }
  });

  test("rejects wrong types and schema", async () => {
    const ev = valid();
    ev.schema = "epinoic.routing-evidence.v2";
    assert.ok(codes(await check(ev)).includes("schema_mismatch"));
    for (const bad of [null, [], "x"]) assert.equal((await check(bad)).ok, false);
    const s = valid();
    s.subjects = { history: 0.9 };
    assert.ok(codes(await check(s)).includes("type"));
  });

  test("reports context problems: limits, label set not built from the catalogue, invalid catalogue", async () => {
    assert.ok(codes(await check(valid(), { ...context(), limits: undefined })).includes("limits_invalid"));
    assert.ok(codes(await check(valid(), { ...context(), limits: { maxExcerptUtf8Bytes: 0 } })).includes("limits_invalid"));
    assert.ok(codes(await check(valid(), { ...context(), limits: { maxExcerptUtf8Bytes: 10, other: 1 } })).includes("limits_invalid"));
    const otherCatalogue = clone(ctx.catalogue);
    otherCatalogue.subjects[0].teachingScope = "Changed scope sentence.";
    const otherLabels = buildLabelSet(otherCatalogue);
    assert.ok(codes(await check(valid(), { ...context(), labelSet: otherLabels })).includes("label_set_catalogue_mismatch"));
    const broken = clone(ctx.catalogue);
    broken.subjects.push(clone(broken.subjects[0]));
    assert.ok(codes(await check(valid(), { ...context(), catalogue: broken })).includes("catalogue_invalid"));
  });

  test("the result is frozen", async () => {
    const r = await check(ctx.evidence({ drama: 1 }));
    assert.ok(Object.isFrozen(r) && Object.isFrozen(r.errors) && Object.isFrozen(r.errors[0]));
  });
});
