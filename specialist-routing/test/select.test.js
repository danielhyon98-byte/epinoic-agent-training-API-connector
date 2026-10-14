import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  PRODUCTION_POLICY,
  REASONS_BY_OUTCOME,
  ROUTING_OUTCOMES,
  ROUTING_REASONS,
  buildLabelSet,
  selectSpecialist,
} from "../src/index.js";
import { brief, clone, deepFreeze, setup } from "./helpers.js";

const ctx = await setup();
const ENG = ["english-a-literature", "english-a-lang-lit", "english-specialist"];
const MATH = ["mathematics-aa", "mathematics-ai"];
const live = () => ({ ...clone(ctx.capabilities), environment: "staging" });
const run = (subjects, families, flags, extra) => ctx.select(ctx.evidence(subjects, families, flags), extra);
const expectBrief = async (promise, expected) => assert.deepEqual(brief(await promise), {
  slug: null, candidates: [], ...expected,
});

describe("RoutingResult shape", () => {
  test("has every contract field, is deep-frozen and never claims inference", async () => {
    const r = await run({ history: 0.9 });
    assert.deepEqual(Object.keys(r), ["schema", "outcome", "slug", "reason", "candidates", "path", "identity", "inferencePerformed"]);
    assert.equal(r.schema, "epinoic.routing-result.v1");
    assert.equal(r.path, "classification");
    assert.equal(r.inferencePerformed, false);
    assert.deepEqual(r.identity, {
      catalogueSha256: ctx.ids.catalogueSha256,
      labelSetSha256: ctx.ids.labelSetSha256,
      policyVersion: ctx.policy.policyVersion,
      calibrationFingerprint: ctx.policy.calibration.fingerprint,
    });
    assert.ok(Object.isFrozen(r) && Object.isFrozen(r.identity) && Object.isFrozen(r.candidates));
    const c = await run({ ess: 0.7, biology: 0.68 });
    assert.ok(Object.isFrozen(c.candidates[0]));
  });

  test("closed enums are frozen and consistent", () => {
    assert.deepEqual(ROUTING_OUTCOMES, ["route", "clarify", "unavailable"]);
    assert.deepEqual([...ROUTING_REASONS].sort(), Object.values(REASONS_BY_OUTCOME).flat().sort());
    assert.equal(ROUTING_REASONS.length, 19);
    assert.ok(Object.isFrozen(ROUTING_REASONS) && Object.isFrozen(ROUTING_OUTCOMES) && Object.isFrozen(REASONS_BY_OUTCOME.clarify));
  });
});

describe("every outcome and reason code is reachable", () => {
  const badCaps = clone(ctx.capabilities);
  badCaps.schema = "nope";
  const cases = {
    "route/single_subject": () => run({ history: 0.9 }),
    "route/trusted_course_metadata": () => run({}, { english: 0.8 }, {}, { trusted: { courseSlugs: ["english-a-lang-lit"] } }),
    "route/sticky_subject": () => ctx.sticky("history"),
    "clarify/generic_family": () => run({}, { english: 0.8 }),
    "clarify/competing_subjects": () => run({ economics: 0.66, "business-management": 0.58 }),
    "clarify/overlap_policy": () => run({ ess: 0.7, biology: 0.66 }),
    "clarify/mixed_request": () => run({ history: 0.8, physics: 0.8 }),
    "clarify/needs_task_context": () => run({}, {}, { needs_task_context: 0.8 }),
    "clarify/low_confidence": () => run({ history: 0.45 }),
    "unavailable/specialist_unavailable": () => run({ physics: 0.9 }),
    "unavailable/out_of_scope": () => run({}, {}, { out_of_scope: 0.9 }),
    "unavailable/unsupported_language": () => run({ history: 0.9 }, {}, { non_english_input: 0.9 }),
    "unavailable/calibration_missing": () => run({ history: 0.9 }, {}, {}, { policy: PRODUCTION_POLICY, capabilities: live() }),
    "unavailable/calibration_mismatch": () => run({ history: 0.9 }, {}, {}, { options: { ...ctx.options, calibrationContext: { ...ctx.options.calibrationContext, model: "x" } } }),
    "unavailable/identity_mismatch": () => ctx.select({ ...ctx.evidence({ history: 0.9 }), catalogueSha256: "0".repeat(64) }),
    "unavailable/evidence_invalid": () => run({ history: NaN }),
    "unavailable/capabilities_invalid": () => run({ history: 0.9 }, {}, {}, { capabilities: badCaps }),
    "unavailable/fixture_policy_rejected": () => run({ history: 0.9 }, {}, {}, { capabilities: live(), options: { ...ctx.options, offlineFixtureHarness: false } }),
    "unavailable/sticky_invalid": () => ctx.sticky("english"),
  };
  const reached = new Set();
  for (const [key, fn] of Object.entries(cases)) {
    test(key, async () => {
      const r = await fn();
      assert.equal(`${r.outcome}/${r.reason}`, key);
      assert.equal(r.inferencePerformed, false);
      reached.add(r.reason);
    });
  }
  test("the table covers the whole closed reason enum", () => {
    assert.deepEqual([...reached].sort(), [...ROUTING_REASONS].sort());
  });
});

describe("policy order (contract section 6)", () => {
  test("step 1: catalogue, then capabilities, then policy, then evidence, then identity, then calibration", async () => {
    const broken = clone(ctx.catalogue);
    broken.subjects.push(clone(broken.subjects[0]));
    const r1 = await ctx.select(ctx.evidence({ history: NaN }), { catalogue: broken, policy: PRODUCTION_POLICY });
    assert.equal(r1.reason, "identity_mismatch");
    assert.deepEqual(r1.identity, { catalogueSha256: null, labelSetSha256: null, policyVersion: null, calibrationFingerprint: null });

    const otherLabels = clone(buildLabelSet(ctx.catalogue));
    otherLabels.flags[0].description = "changed";
    assert.equal((await ctx.select(ctx.evidence({ history: 0.9 }), { labelSet: otherLabels })).reason, "identity_mismatch");

    const badCaps = clone(ctx.capabilities);
    badCaps.entries.push(clone(badCaps.entries[0]));
    assert.equal((await run({ history: NaN }, {}, {}, { capabilities: badCaps, policy: PRODUCTION_POLICY })).reason, "capabilities_invalid");
    assert.equal((await run({ history: NaN }, {}, {}, { policy: PRODUCTION_POLICY, capabilities: live() })).reason, "calibration_missing");
    const both = { ...ctx.evidence({ history: NaN }), catalogueSha256: "0".repeat(64) };
    assert.equal((await ctx.select(both)).reason, "evidence_invalid");
    const idAndCal = { ...ctx.evidence({ history: 0.9 }), labelSetSha256: "0".repeat(64) };
    const wrongModel = { ...ctx.options, calibrationContext: { ...ctx.options.calibrationContext, model: "x" } };
    assert.equal((await ctx.select(idAndCal, { options: wrongModel })).reason, "identity_mismatch");
  });

  test("step 2 (language) precedes mixed, out-of-scope, family and subject", async () => {
    await expectBrief(run({ history: 0.9, physics: 0.9 }, { english: 0.9 }, { non_english_input: 0.6, mixed_request: 0.9, out_of_scope: 0.9 }),
      { outcome: "unavailable", reason: "unsupported_language" });
  });

  test("step 3 (mixed) precedes out-of-scope", async () => {
    await expectBrief(run({}, {}, { mixed_request: 0.7, out_of_scope: 0.9 }), { outcome: "clarify", reason: "mixed_request" });
  });

  test("step 4 (out of scope) precedes task context and low confidence", async () => {
    await expectBrief(run({ history: 0.5 }, {}, { out_of_scope: 0.9, needs_task_context: 0.9 }), { outcome: "unavailable", reason: "out_of_scope" });
  });

  test("step 5 (generic family) precedes task context", async () => {
    await expectBrief(run({}, { mathematics: 0.8 }, { needs_task_context: 0.95 }), { outcome: "clarify", reason: "generic_family", candidates: MATH });
  });

  test("step 6 (task context) precedes low confidence", async () => {
    await expectBrief(run({ history: 0.45 }, {}, { needs_task_context: 0.8 }), { outcome: "clarify", reason: "needs_task_context", candidates: ["history"] });
  });

  test("step 8 (near tie) precedes availability: no unavailable answer for an unresolved tie", async () => {
    await expectBrief(run({ physics: 0.7, chemistry: 0.58 }), { outcome: "clarify", reason: "competing_subjects", candidates: ["physics", "chemistry"] });
  });
});

describe("ties, near ties and low scores", () => {
  test("an exact tie never picks a winner", async () => {
    await expectBrief(run({ "english-a-literature": 0.7, "english-specialist": 0.7 }), {
      outcome: "clarify", reason: "competing_subjects", candidates: ["english-a-literature", "english-specialist"],
    });
    await expectBrief(run({ economics: 0.62, psychology: 0.5, history: 0.62 }), { outcome: "clarify", reason: "mixed_request", candidates: ["history", "economics"] });
  });

  test("a gap exactly at marginMin is within the margin, despite float noise (0.74 - 0.59)", async () => {
    assert.ok(0.74 - 0.59 > 0.15, "the float difference is slightly above 0.15");
    await expectBrief(run({ history: 0.74, geography: 0.59 }), { outcome: "clarify", reason: "competing_subjects", candidates: ["history", "geography"] });
  });

  test("a gap just above marginMin routes", async () => {
    await expectBrief(run({ history: 0.75, geography: 0.59 }), { outcome: "route", reason: "single_subject", slug: "history" });
    await expectBrief(run({ history: 0.6, geography: 0.44 }), { outcome: "route", reason: "single_subject", slug: "history" });
  });

  test("routeMin is inclusive and the top below it never routes", async () => {
    await expectBrief(run({ history: 0.6 }), { outcome: "route", reason: "single_subject", slug: "history" });
    await expectBrief(run({ history: 0.5999 }), { outcome: "clarify", reason: "low_confidence", candidates: ["history"] });
  });

  test("low scores: candidates at clarifyFloor clarify, otherwise out of scope", async () => {
    await expectBrief(run({ physics: 0.45, chemistry: 0.3, biology: 0.29 }), { outcome: "clarify", reason: "low_confidence", candidates: ["physics", "chemistry"] });
    await expectBrief(run({ physics: 0.29, chemistry: 0.1 }), { outcome: "unavailable", reason: "out_of_scope" });
    await expectBrief(run(), { outcome: "unavailable", reason: "out_of_scope" });
  });

  test("candidates are listed in catalogue order with capability availability", async () => {
    const r = await run({ biology: 0.4, history: 0.35, ess: 0.5 });
    assert.deepEqual(r.candidates, [
      { slug: "history", available: true },
      { slug: "biology", available: true },
      { slug: "ess", available: false },
    ]);
  });
});

describe("generic English and Maths always clarify (never a default member)", () => {
  const patterns = [
    [{}, 0.55],
    [{ "english-a-literature": 0.9, "english-a-lang-lit": 0.8 }, 0.8],
    [{ "english-a-lang-lit": 0.65, "english-specialist": 0.55 }, 0.7],
    [{ "english-a-lang-lit": 0.58, "english-a-literature": 0.1 }, 0.9],
    [{ "english-a-literature": 0.63, "english-specialist": 0.59, "english-a-lang-lit": 0.4 }, 0.78],
  ];
  for (const [subjects, fam] of patterns) {
    test(`english family ${fam} with ${JSON.stringify(subjects)}`, async () => {
      await expectBrief(run(subjects, { english: fam }), { outcome: "clarify", reason: "generic_family", candidates: ENG });
    });
  }
  test("maths family with both members strong but not separated", async () => {
    await expectBrief(run({ "mathematics-aa": 0.7, "mathematics-ai": 0.6 }, { mathematics: 0.8 }), { outcome: "clarify", reason: "generic_family", candidates: MATH });
    await expectBrief(run({}, { mathematics: 0.55 }), { outcome: "clarify", reason: "generic_family", candidates: MATH });
  });
  test("a member separated by more than the margin and at routeMin routes", async () => {
    await expectBrief(run({ "english-a-lang-lit": 0.86, "english-a-literature": 0.3 }, { english: 0.7 }), { outcome: "route", reason: "single_subject", slug: "english-a-lang-lit" });
    await expectBrief(run({ "mathematics-ai": 0.86, "mathematics-aa": 0.3 }, { mathematics: 0.7 }), {
      outcome: "unavailable", reason: "specialist_unavailable", candidates: ["mathematics-ai"],
    });
  });
  test("a family signal below familyMin does not trigger the family rule", async () => {
    await expectBrief(run({ "english-a-literature": 0.4 }, { english: 0.54 }), { outcome: "clarify", reason: "low_confidence", candidates: ["english-a-literature"] });
  });
});

describe("trusted course metadata (server-derived only)", () => {
  const fam = (courseSlugs, subjects = {}) => run(subjects, { english: 0.8 }, {}, { trusted: { courseSlugs } });
  const env = (courseSlugs) => run({ ess: 0.7, biology: 0.66, geography: 0.4 }, {}, {}, { trusted: { courseSlugs } });

  test("resolves a family only when exactly one member matches", async () => {
    await expectBrief(fam(["english-a-lang-lit", "history"]), { outcome: "route", reason: "trusted_course_metadata", slug: "english-a-lang-lit" });
    await expectBrief(fam(["english-a-literature"]), { outcome: "unavailable", reason: "specialist_unavailable", candidates: ["english-a-literature"] });
    await expectBrief(fam(["english-a-literature", "english-a-lang-lit"]), { outcome: "clarify", reason: "generic_family", candidates: ENG });
    await expectBrief(fam(["history"]), { outcome: "clarify", reason: "generic_family", candidates: ENG });
    await expectBrief(fam([]), { outcome: "clarify", reason: "generic_family", candidates: ENG });
  });

  test("resolves an overlap only when exactly one group member matches and it is a candidate", async () => {
    await expectBrief(env(["biology"]), { outcome: "route", reason: "trusted_course_metadata", slug: "biology" });
    await expectBrief(env(["ess", "history"]), { outcome: "unavailable", reason: "specialist_unavailable", candidates: ["ess"] });
    await expectBrief(env(["biology", "geography"]), { outcome: "clarify", reason: "overlap_policy", candidates: ["biology", "ess"] });
    await expectBrief(env(["geography"]), { outcome: "clarify", reason: "overlap_policy", candidates: ["biology", "ess"] });
    await expectBrief(env(["physics"]), { outcome: "clarify", reason: "overlap_policy", candidates: ["biology", "ess"] });
  });

  test("does not change a clear single subject and does not resolve competing subjects", async () => {
    await expectBrief(run({ history: 0.9 }, {}, {}, { trusted: { courseSlugs: ["biology"] } }), { outcome: "route", reason: "single_subject", slug: "history" });
    await expectBrief(run({ "english-a-literature": 0.7, "english-a-lang-lit": 0.68 }, {}, {}, { trusted: { courseSlugs: ["english-a-lang-lit"] } }), {
      outcome: "clarify", reason: "competing_subjects", candidates: ["english-a-literature", "english-a-lang-lit"],
    });
  });

  test("rejects unknown fields, unknown or duplicate slugs and browser route IDs", async () => {
    for (const trusted of [
      { courseSlugs: ["history"], stickySlug: "history" },
      { routeId: "english" },
      { courseSlugs: ["english"] },
      { courseSlugs: ["history", "history"] },
      { courseSlugs: "history" },
      { courseSlugs: [1] },
      null,
      [],
    ]) {
      await expectBrief(run({}, { english: 0.8 }, {}, { trusted }), { outcome: "unavailable", reason: "evidence_invalid" });
    }
  });
});

describe("mixed requests clarify and never route to the supported half", () => {
  test("two unrelated subjects at routeMin, whichever is available", async () => {
    await expectBrief(run({ history: 0.9, physics: 0.6 }), { outcome: "clarify", reason: "mixed_request", candidates: ["history", "physics"] });
    const r = await run({ biology: 0.95, chemistry: 0.61 });
    assert.equal(r.outcome, "clarify");
    assert.equal(r.slug, null);
    assert.deepEqual(r.candidates, [{ slug: "chemistry", available: false }, { slug: "biology", available: true }]);
  });

  test("a supported subject with an out-of-scope half, with or without the mixed flag", async () => {
    await expectBrief(run({ history: 0.9 }, {}, { out_of_scope: 0.6 }), { outcome: "clarify", reason: "mixed_request", candidates: ["history"] });
    await expectBrief(run({ history: 0.9 }, {}, { mixed_request: 0.6 }), { outcome: "clarify", reason: "mixed_request", candidates: ["history"] });
  });

  test("a family signal with an unrelated subject, and two families", async () => {
    await expectBrief(run({ history: 0.8 }, { english: 0.7 }), { outcome: "clarify", reason: "mixed_request", candidates: ["history", ...ENG] });
    await expectBrief(run({}, { english: 0.7, mathematics: 0.7 }), { outcome: "clarify", reason: "mixed_request", candidates: [...ENG, ...MATH] });
  });

  test("related subjects are not mixed: same family or same overlap group", async () => {
    await expectBrief(run({ ess: 0.8, biology: 0.78 }), { outcome: "clarify", reason: "overlap_policy", candidates: ["biology", "ess"] });
    await expectBrief(run({ "mathematics-aa": 0.8, "mathematics-ai": 0.75 }), { outcome: "clarify", reason: "competing_subjects", candidates: MATH });
    await expectBrief(run({ ess: 0.9, biology: 0.65 }), { outcome: "unavailable", reason: "specialist_unavailable", candidates: ["ess"] });
  });
});

describe("availability", () => {
  test("a recognised but unavailable subject stays unavailable and is never replaced", async () => {
    await expectBrief(run({ physics: 0.9, biology: 0.5, "mathematics-aa": 0.45 }), { outcome: "unavailable", reason: "specialist_unavailable", candidates: ["physics"] });
    const r = await run({ ess: 0.9, biology: 0.6 - 0.01 });
    assert.deepEqual(r.candidates, [{ slug: "ess", available: false }]);
  });

  test("a subject absent from capabilities is unavailable", async () => {
    for (const slug of ["chemistry", "economics", "english-specialist", "mathematics-ai"]) {
      await expectBrief(run({ [slug]: 0.92 }), { outcome: "unavailable", reason: "specialist_unavailable", candidates: [slug] });
    }
  });

  test("an available subject routes only when capabilities say so", async () => {
    const caps = clone(ctx.capabilities);
    caps.entries.find((e) => e.slug === "history").available = false;
    await expectBrief(run({ history: 0.9 }, {}, {}, { capabilities: caps }), { outcome: "unavailable", reason: "specialist_unavailable", candidates: ["history"] });
  });

  test("offline-test capabilities are refused outside the fixture harness", async () => {
    const r = await run({ history: 0.9 }, {}, {}, { options: { ...ctx.options, offlineFixtureHarness: false } });
    assert.equal(r.reason, "capabilities_invalid");
  });
});

describe("language versus subject", () => {
  test("a Spanish B course signal with low non_english_input routes", async () => {
    await expectBrief(run({ "spanish-b": 0.88 }, {}, { non_english_input: 0.2 }), { outcome: "route", reason: "single_subject", slug: "spanish-b" });
    await expectBrief(run({ "spanish-b": 0.88 }, {}, { non_english_input: 0.59 }), { outcome: "route", reason: "single_subject", slug: "spanish-b" });
  });

  test("high non_english_input gives unsupported_language, even about Spanish B", async () => {
    await expectBrief(run({ "spanish-b": 0.95 }, {}, { non_english_input: 0.6 }), { outcome: "unavailable", reason: "unsupported_language" });
    await expectBrief(run({ history: 0.9 }, {}, { non_english_input: 0.97 }), { outcome: "unavailable", reason: "unsupported_language" });
  });
});

describe("input handling", () => {
  test("missing limits make evidence unverifiable (evidence_invalid)", async () => {
    const { limits, ...rest } = ctx.options;
    assert.ok(limits);
    assert.equal((await run({ history: 0.9 }, {}, {}, { options: rest })).reason, "evidence_invalid");
  });

  test("an excerpt over the limit is evidence_invalid", async () => {
    const ev = ctx.evidence({ history: 0.9 });
    ev.excerpt.utf8Bytes = 4000;
    ev.excerpt.codePoints = 4000;
    assert.equal((await ctx.select(ev)).reason, "evidence_invalid");
  });

  test("programming errors in options throw TypeError", async () => {
    await assert.rejects(run({ history: 0.9 }, {}, {}, { options: { ...ctx.options, offlineFixtureHarnes: true } }), TypeError);
    await assert.rejects(run({ history: 0.9 }, {}, {}, { options: { ...ctx.options, offlineFixtureHarness: "true" } }), TypeError);
    await assert.rejects(run({ history: 0.9 }, {}, {}, { options: null }), TypeError);
  });

  test("selection never mutates its inputs (all inputs deep-frozen)", async () => {
    const inputs = () => deepFreeze({
      catalogue: clone(ctx.catalogue),
      labelSet: clone(ctx.labelSet),
      policy: clone(ctx.policy),
      capabilities: clone(ctx.capabilities),
      options: clone(ctx.options),
    });
    const scenarios = [
      [{ history: 0.9 }, {}, {}, {}],
      [{}, { english: 0.8 }, {}, { courseSlugs: ["english-a-lang-lit"] }],
      [{ ess: 0.7, biology: 0.66 }, {}, {}, { courseSlugs: ["biology"] }],
      [{ history: 0.8, physics: 0.8 }, {}, {}, {}],
      [{ history: NaN }, {}, {}, {}],
      [{ physics: 0.9 }, {}, { needs_task_context: 0.2 }, {}],
    ];
    for (const [s, f, fl, trusted] of scenarios) {
      const i = inputs();
      const evidence = deepFreeze(ctx.evidence(s, f, fl));
      const frozenTrusted = deepFreeze(clone(trusted));
      const before = JSON.stringify({ i, evidence, frozenTrusted });
      const r = await selectSpecialist({ evidence, trusted: frozenTrusted, ...i });
      assert.ok(r.outcome);
      assert.equal(JSON.stringify({ i, evidence, frozenTrusted }), before);
    }
  });
});

describe("property: random evidence never yields an unsafe route", () => {
  test("500 seeded random evidence objects", async () => {
    let seed = 20261013;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const slugs = ctx.catalogue.subjects.map((s) => s.slug);
    const available = new Set(ctx.capabilities.entries.filter((e) => e.available).map((e) => e.slug));
    const round = (x) => Math.round(x * 100) / 100;
    for (let n = 0; n < 500; n += 1) {
      const subjects = {};
      for (const s of slugs) if (rand() < 0.3) subjects[s] = round(rand());
      const families = {};
      if (rand() < 0.3) families.english = round(rand());
      if (rand() < 0.3) families.mathematics = round(rand());
      const flags = {};
      for (const f of ["out_of_scope", "mixed_request", "non_english_input", "needs_task_context"]) flags[f] = round(rand() * rand());
      const trusted = rand() < 0.2 ? { courseSlugs: slugs.filter(() => rand() < 0.15) } : {};
      const ev = ctx.evidence(subjects, families, flags);
      const r = await ctx.select(ev, { trusted });
      const again = await ctx.select(ev, { trusted });
      assert.deepEqual(r, again, "deterministic");
      assert.ok(REASONS_BY_OUTCOME[r.outcome].includes(r.reason));
      if (r.outcome === "route") {
        assert.ok(slugs.includes(r.slug) && available.has(r.slug), `unsafe route ${r.slug}`);
        assert.ok(r.reason === "single_subject" || r.reason === "trusted_course_metadata");
      } else assert.equal(r.slug, null);
      if (flags.non_english_input >= 0.6) assert.equal(r.reason, "unsupported_language");
      for (const c of r.candidates) assert.equal(c.available, available.has(c.slug));
    }
  });
});
