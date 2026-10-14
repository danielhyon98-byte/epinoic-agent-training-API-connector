// Shared test helpers (imported by *.test.js; contains no tests itself).
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildLabelSet,
  catalogueDigest,
  labelSetDigest,
  selectSpecialist,
  selectSticky,
} from "../src/index.js";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @param {string} rel */
export function readJsonFile(rel) {
  return JSON.parse(readFileSync(path.join(ROOT, rel), "utf8"));
}

/** Fresh, mutable copies of every fixture. */
export function loadFixtures() {
  return {
    catalogue: readJsonFile("fixtures/catalogue.synthetic.json"),
    capabilities: readJsonFile("fixtures/capabilities.synthetic.json"),
    policy: readJsonFile("fixtures/policy.synthetic.json"),
    harness: readJsonFile("fixtures/harness.synthetic.json"),
    evidenceFixture: readJsonFile("fixtures/evidence.synthetic.json"),
    roster: JSON.parse(readFileSync(path.join(ROOT, "..", "agents", "agents.json"), "utf8")),
  };
}

/** @template T @param {T} v @returns {T} */
export function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

/** Recursively freeze a value (tests freeze inputs to prove selection never mutates them). */
export function deepFreeze(v) {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const k of Object.keys(v)) deepFreeze(v[k]);
  }
  return v;
}

/** Error codes from a validation result. */
export function codes(result) {
  return result.errors.map((e) => e.code);
}

/**
 * Fixture context plus builders for valid evidence and selection calls.
 * Evidence uses the harness adapter and excerpt versions, so the fixture
 * policy's calibration fingerprint matches.
 */
export async function setup() {
  const f = loadFixtures();
  const labelSet = buildLabelSet(f.catalogue);
  const ids = {
    catalogueSha256: await catalogueDigest(f.catalogue),
    labelSetSha256: await labelSetDigest(labelSet),
  };
  const options = {
    offlineFixtureHarness: true,
    limits: clone(f.harness.limits),
    calibrationContext: clone(f.harness.calibrationContext),
  };
  /**
   * @param {Record<string, number>} [subjects]
   * @param {Record<string, number>} [families]
   * @param {Record<string, number>} [flags]
   */
  const evidence = (subjects = {}, families = {}, flags = {}) => ({
    schema: "epinoic.routing-evidence.v1",
    labelSetVersion: labelSet.labelSetVersion,
    labelSetSha256: ids.labelSetSha256,
    catalogueSha256: ids.catalogueSha256,
    adapter: { ...f.harness.adapter },
    excerpt: { version: f.harness.excerpt.version, utf8Bytes: 64, codePoints: 64, truncated: false },
    subjects: Object.entries(subjects).map(([label, score]) => ({ label, score })),
    families: Object.entries(families).map(([label, score]) => ({ label, score })),
    flags: { out_of_scope: 0, mixed_request: 0, non_english_input: 0, needs_task_context: 0, ...flags },
  });
  const select = (ev, extra = {}) =>
    selectSpecialist({
      evidence: ev,
      catalogue: f.catalogue,
      labelSet,
      policy: f.policy,
      capabilities: f.capabilities,
      options,
      ...extra,
    });
  const sticky = (stickySlug, extra = {}) =>
    selectSticky({ stickySlug, catalogue: f.catalogue, capabilities: f.capabilities, options: { offlineFixtureHarness: true }, ...extra });
  return { ...f, labelSet, ids, options, evidence, select, sticky };
}

/** Compact view of a RoutingResult for assertions. */
export function brief(result) {
  return {
    outcome: result.outcome,
    reason: result.reason,
    slug: result.slug,
    candidates: result.candidates.map((c) => c.slug),
  };
}
