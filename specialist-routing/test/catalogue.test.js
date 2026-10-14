import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { buildLabelSet, validateCatalogue } from "../src/index.js";
import { clone, codes, loadFixtures } from "./helpers.js";

const { catalogue: FIXTURE, roster } = loadFixtures();
const fresh = () => clone(FIXTURE);
const subject = (c, slug) => c.subjects.find((s) => s.slug === slug);

/** A structurally valid non-synthetic catalogue built from the fixture. */
function nonSynthetic() {
  const c = fresh();
  c.synthetic = false;
  c.source.commit = "a".repeat(40);
  for (const s of c.subjects) {
    const digest = "b".repeat(63) + (s.slug.length % 10);
    c.source.packageDigests[s.slug] = digest;
    s.evidence = { path: `knowledge-bases/${s.slug}`, sha256: digest };
  }
  return c;
}

describe("validateCatalogue", () => {
  test("the generated synthetic fixture is valid and frozen in its result", () => {
    const r = validateCatalogue(FIXTURE);
    assert.deepEqual(r, { ok: true, errors: [] });
    assert.ok(Object.isFrozen(r) && Object.isFrozen(r.errors));
    assert.equal(FIXTURE.synthetic, true);
    assert.equal(FIXTURE.source.commit, null);
    assert.deepEqual(FIXTURE.source.packageDigests, {});
    assert.ok(FIXTURE.subjects.every((s) => s.evidence === null));
  });

  test("subjects match the 16-agent roster slugs and slugStatus = roster slugSource", () => {
    assert.equal(FIXTURE.subjects.length, 16);
    assert.deepEqual(FIXTURE.subjects.map((s) => s.slug).sort(), roster.agents.map((a) => a.slug).sort());
    for (const a of roster.agents) assert.equal(subject(FIXTURE, a.slug).slugStatus, a.slugSource, a.slug);
  });

  test("intentional family ambiguity is valid: 'english' and 'english literature' are family-level aliases", () => {
    const english = FIXTURE.families.find((f) => f.id === "english");
    assert.deepEqual(english.members, ["english-a-literature", "english-a-lang-lit", "english-specialist"]);
    assert.ok(english.genericAliases.includes("english"));
    assert.ok(english.genericAliases.includes("english literature"));
    assert.equal(english.resolution, "clarify");
    assert.ok(!subject(FIXTURE, "english-a-literature").aliases.includes("english literature"));
    const maths = FIXTURE.families.find((f) => f.id === "mathematics");
    assert.deepEqual(maths.members, ["mathematics-aa", "mathematics-ai"]);
    assert.equal(validateCatalogue(FIXTURE).ok, true);
  });

  test("spanish-b is a language course; environment overlap lists ess, biology, geography", () => {
    assert.equal(subject(FIXTURE, "spanish-b").isLanguageCourse, true);
    assert.equal(FIXTURE.subjects.filter((s) => s.isLanguageCourse).length, 1);
    assert.deepEqual(FIXTURE.overlapPolicies, [
      { id: "environment", members: ["ess", "biology", "geography"], rule: "clarify_unless_trusted_course" },
    ]);
  });

  test("rejects a duplicate slug", () => {
    const c = fresh();
    c.subjects.push(clone(c.subjects[0]));
    assert.ok(codes(validateCatalogue(c)).includes("duplicate_slug"));
  });

  test("rejects a slug that is not lower-case kebab-case", () => {
    for (const bad of ["History", "maths_aa", "-x", "a--b", "a b"]) {
      const c = fresh();
      c.subjects[0].slug = bad;
      assert.ok(codes(validateCatalogue(c)).includes("not_kebab_case"), bad);
    }
  });

  test("rejects a leaf alias shared by two subjects", () => {
    const c = fresh();
    subject(c, "chemistry").aliases.push("bio");
    const r = validateCatalogue(c);
    assert.ok(codes(r).includes("alias_collision"));
  });

  test("rejects a leaf alias equal to a family generic alias", () => {
    const c = fresh();
    subject(c, "english-a-literature").aliases.push("english literature");
    assert.ok(codes(validateCatalogue(c)).includes("alias_equals_family_alias"));
    const d = fresh();
    subject(d, "mathematics-aa").aliases.push("maths");
    assert.ok(codes(validateCatalogue(d)).includes("alias_equals_family_alias"));
  });

  test("rejects a family member that is not a catalogue subject", () => {
    const c = fresh();
    c.families[0].members.push("drama");
    assert.ok(codes(validateCatalogue(c)).includes("unknown_member"));
  });

  test("rejects a subject in two families", () => {
    const c = fresh();
    c.families[1].members.push("english-a-lang-lit");
    const r = codes(validateCatalogue(c));
    assert.ok(r.includes("subject_in_multiple_families"));
  });

  test("rejects subject.family that disagrees with family members", () => {
    const c = fresh();
    subject(c, "english-specialist").family = null;
    assert.ok(codes(validateCatalogue(c)).includes("family_mismatch"));
    const d = fresh();
    subject(d, "history").family = "english";
    assert.ok(codes(validateCatalogue(d)).includes("family_mismatch"));
    const e = fresh();
    subject(e, "history").family = "humanities";
    assert.ok(codes(validateCatalogue(e)).includes("unknown_family"));
  });

  test("rejects unknown overlap members and overlap cross-reference mismatches", () => {
    const c = fresh();
    c.overlapPolicies[0].members.push("marine-science");
    assert.ok(codes(validateCatalogue(c)).includes("unknown_overlap_member"));
    const d = fresh();
    subject(d, "chemistry").overlapGroups.push("environment");
    assert.ok(codes(validateCatalogue(d)).includes("overlap_mismatch"));
    const e = fresh();
    subject(e, "ess").overlapGroups = [];
    assert.ok(codes(validateCatalogue(e)).includes("overlap_mismatch"));
  });

  test("rejects unknown fields at the top level and nested", () => {
    for (const mutate of [
      (c) => { c.extra = 1; },
      (c) => { c.subjects[3].notes = "x"; },
      (c) => { c.families[0].defaultMember = "english-a-literature"; },
      (c) => { c.source.branch = "main"; },
      (c) => { c.overlapPolicies[0].priority = 1; },
      (c) => { c.unresolvedDecisions[0].status = "open"; },
    ]) {
      const c = fresh();
      mutate(c);
      assert.ok(codes(validateCatalogue(c)).includes("unknown_field"));
    }
  });

  test("rejects provider, model, key and enablement fields anywhere", () => {
    const cases = [
      (c) => { c.provider = "fastino"; },
      (c) => { c.subjects[0].model = "gliner"; },
      (c) => { c.subjects[2].modelId = "x"; },
      (c) => { c.families[0].apiKey = "sk-test"; },
      (c) => { c.source.key = "k"; },
      (c) => { c.subjects[5].enabled = true; },
      (c) => { c.subjects[5].productionEnabled = true; },
      (c) => { c.unresolvedDecisions[1].enablement = "on"; },
      (c) => { c.subjects[0].available = true; },
      (c) => { c.overlapPolicies[0].secret = "s"; },
      (c) => { c.subjects[1].token = "t"; },
    ];
    for (const mutate of cases) {
      const c = fresh();
      mutate(c);
      const r = validateCatalogue(c);
      assert.equal(r.ok, false);
      assert.ok(codes(r).includes("forbidden_field"), JSON.stringify(r.errors));
    }
  });

  test("rejects missing fields and non-normalised aliases", () => {
    const c = fresh();
    delete c.subjects[0].teachingScope;
    assert.ok(codes(validateCatalogue(c)).includes("missing_field"));
    const d = fresh();
    subject(d, "biology").aliases.push(" Bio ");
    assert.ok(codes(validateCatalogue(d)).includes("not_normalised"));
    const e = fresh();
    e.families[0].resolution = "default:english-a-literature";
    assert.ok(codes(validateCatalogue(e)).includes("invalid_resolution"));
  });

  test("a synthetic catalogue may not claim evidence or a commit", () => {
    const c = fresh();
    c.subjects[0].evidence = { path: "knowledge-bases/history", sha256: "c".repeat(64) };
    assert.ok(codes(validateCatalogue(c)).includes("synthetic_with_evidence"));
    const d = fresh();
    d.source.commit = "a".repeat(40);
    assert.ok(codes(validateCatalogue(d)).includes("synthetic_with_commit"));
  });

  test("rejects a non-synthetic catalogue without evidence", () => {
    const c = fresh();
    c.synthetic = false;
    const r = validateCatalogue(c);
    assert.equal(r.ok, false);
    assert.ok(codes(r).includes("missing_evidence"));
    assert.ok(r.errors.some((e) => e.path === "$.source.commit"));
  });

  test("accepts a complete non-synthetic catalogue and rejects inconsistent evidence", () => {
    assert.deepEqual(validateCatalogue(nonSynthetic()).errors, []);
    const c = nonSynthetic();
    c.subjects[4].evidence.sha256 = "d".repeat(64);
    assert.ok(codes(validateCatalogue(c)).includes("evidence_mismatch"));
    const d = nonSynthetic();
    delete d.source.packageDigests.history;
    assert.ok(codes(validateCatalogue(d)).includes("missing_evidence"));
    const e = nonSynthetic();
    e.subjects[0].evidence = null;
    assert.ok(codes(validateCatalogue(e)).includes("missing_evidence"));
  });

  test("rejects non-objects", () => {
    for (const v of [null, [], "x", 3, undefined]) assert.equal(validateCatalogue(v).ok, false);
  });
});

describe("buildLabelSet", () => {
  test("one label per slug and family plus the four flags, versioned and frozen", () => {
    const ls = buildLabelSet(FIXTURE);
    assert.equal(ls.schema, "epinoic.routing-label-set.v1");
    assert.equal(ls.labelSetVersion, "routing-labels/0.1.0");
    assert.equal(ls.status, "proposed-unverified-against-provider");
    assert.deepEqual(ls.subjects.map((s) => s.label), FIXTURE.subjects.map((s) => s.slug));
    assert.deepEqual(ls.families.map((f) => f.label), ["english", "mathematics"]);
    assert.deepEqual(ls.flags.map((f) => f.label), ["out_of_scope", "mixed_request", "non_english_input", "needs_task_context"]);
    for (const l of [...ls.subjects, ...ls.families, ...ls.flags]) assert.ok(l.description.length > 10 && l.description.length < 400);
    assert.ok(Object.isFrozen(ls) && Object.isFrozen(ls.subjects[0]));
    assert.deepEqual(buildLabelSet(clone(FIXTURE)), ls);
  });

  test("a language course label says it is not the input language; other labels do not", () => {
    const ls = buildLabelSet(FIXTURE);
    const note = "it says nothing about the language the message is written in";
    assert.ok(ls.subjects.find((s) => s.label === "spanish-b").description.includes(note));
    assert.equal(ls.subjects.filter((s) => s.description.includes(note)).length, 1);
    assert.match(ls.flags.find((f) => f.label === "non_english_input").description, /language course/);
  });

  test("throws for an invalid catalogue", () => {
    const c = clone(FIXTURE);
    c.subjects.push(clone(c.subjects[0]));
    assert.throws(() => buildLabelSet(c), TypeError);
  });
});
