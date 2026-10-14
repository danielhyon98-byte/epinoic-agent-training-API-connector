#!/usr/bin/env node
/**
 * Offline evaluator for eval/routing-eval.synthetic.jsonl.
 *
 * Checks: fixture validity and freshness, item schema, unique ids, split
 * determinism (first byte of SHA-256(group) < 154 -> tune), no group crossing
 * splits, subject x split and boundary-tag x split coverage minimums, a
 * cross-split near-duplicate scan (normalised token-set Jaccard >= 0.8), and a
 * list of disputed items. Then runs POLICY MECHANICS: hand-assigned synthetic
 * scores -> validateEvidence -> selectSpecialist (fixture policy, offline
 * harness), or selectSticky for sticky items, compared with each item's
 * expectation, plus route-safety properties over every result.
 *
 * Prints a deterministic report and writes no files. Exit status 1 on any failure.
 */

import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  buildLabelSet,
  catalogueDigest,
  labelSetDigest,
  measureClassificationPayload,
  REASONS_BY_OUTCOME,
  selectSpecialist,
  selectSticky,
  validateCapabilities,
  validateCatalogue,
  validateEvidence,
  validatePolicy,
} from "../src/index.js";
import {
  BOUNDARY_TAGS,
  MIN_SUBJECT_ITEMS_PER_SPLIT,
  MIN_TAG_ITEMS_PER_SPLIT,
  NEAR_DUPLICATE_JACCARD,
  PATHS,
  checkItemSchema,
  datasetDigests,
  evidenceFromSynthetic,
  headExcerpt,
  itemText,
  jaccard,
  loadJsonl,
  primarySubject,
  readJson,
  splitOfGroup,
  tokenSet,
} from "./lib/eval-lib.mjs";

export const REPORT_HEADER =
  "POLICY-MECHANICS TEST OVER SYNTHETIC SCORES — NOT PROVIDER OBSERVATIONS, NOT CLASSIFIER ACCURACY. No model was called.";

const SPLITS = ["tune", "holdout"];

/** @param {string} s @param {number} n */
const pad = (s, n) => String(s).padEnd(n);

/**
 * Run every check. Returns the report lines and the failure list.
 * @param {{evalPath?: string}} [paths] override the eval file (tests use a temporary copy)
 * @returns {Promise<{lines: string[], failures: string[], summary: object}>}
 */
export async function evaluate({ evalPath = PATHS.eval } = {}) {
  const lines = [];
  const failures = [];
  const out = (s = "") => lines.push(s);
  const fail = (s) => failures.push(s);

  const catalogue = readJson(PATHS.catalogue);
  const capabilities = readJson(PATHS.capabilities);
  const policy = readJson(PATHS.policy);
  const harness = readJson(PATHS.harness);

  // Fixtures.
  if (!validateCatalogue(catalogue).ok) fail("fixtures/catalogue.synthetic.json does not validate");
  if (catalogue.synthetic !== true) fail("the evaluation catalogue must be the synthetic one");
  if (!validateCapabilities(capabilities, { catalogue }).ok) fail("fixtures/capabilities.synthetic.json does not validate");
  if (!validatePolicy(policy).ok || policy.status !== "fixture-only") fail("fixtures/policy.synthetic.json must be a valid fixture-only policy");
  if (failures.length) return { lines: [REPORT_HEADER, "", ...failures.map((f) => `FAIL ${f}`)], failures, summary: {} };

  const labelSet = buildLabelSet(catalogue);
  const catalogueSha256 = await catalogueDigest(catalogue);
  const labelSetSha256 = await labelSetDigest(labelSet);
  const slugs = new Set(catalogue.subjects.map((s) => s.slug));
  const order = catalogue.subjects.map((s) => s.slug);
  const availability = new Map(capabilities.entries.map((e) => [e.slug, e.available]));
  const isAvailable = (slug) => availability.get(slug) === true;

  // Items: parse, schema, ids, split determinism, groups.
  const { items: loaded, errors: parseErrors } = loadJsonl(evalPath);
  parseErrors.forEach(fail);
  const items = loaded.map((x) => x.item);
  const ids = new Set();
  const groupSplit = new Map();
  for (const { line, item } of loaded) {
    const where = `eval line ${line} (${item?.id ?? "?"})`;
    for (const p of checkItemSchema(item, { slugs, families: new Set(catalogue.families.map((f) => f.id)) })) fail(`${where}: ${p}`);
    if (ids.has(item.id)) fail(`${where}: duplicate id`);
    ids.add(item.id);
    if (typeof item.group === "string") {
      const expected = splitOfGroup(item.group);
      if (item.split !== expected) fail(`${where}: split ${item.split} but SHA-256(group) gives ${expected}`);
      if (groupSplit.has(item.group) && groupSplit.get(item.group) !== item.split) fail(`${where}: group ${item.group} crosses splits`);
      groupSplit.set(item.group, item.split);
    }
  }
  const datasets = datasetDigests(items);
  const ctxDatasets = harness.calibrationContext?.datasets ?? {};
  if (ctxDatasets.tuneSha256 !== datasets.tuneSha256 || ctxDatasets.holdoutSha256 !== datasets.holdoutSha256) {
    fail("fixtures/harness.synthetic.json dataset digests are stale; run npm run build:fixtures");
  }

  out(REPORT_HEADER);
  out("");
  out("Synthetic evaluation set: eval/routing-eval.synthetic.jsonl (original items, synthetic scores).");
  out("Expected results assume fixtures/capabilities.synthetic.json and the fixture-only policy thresholds,");
  out("which are arbitrary policy-test values, not calibrated probabilities.");
  out("");
  const bySplit = Object.fromEntries(SPLITS.map((s) => [s, items.filter((it) => it.split === s)]));
  const groupsBySplit = Object.fromEntries(SPLITS.map((s) => [s, new Set(bySplit[s].map((it) => it.group)).size]));
  out(`Items: ${items.length} (tune ${bySplit.tune.length}, holdout ${bySplit.holdout.length}); groups: ${groupSplit.size} (tune ${groupsBySplit.tune}, holdout ${groupsBySplit.holdout})`);
  out(`Dataset digests: tune ${datasets.tuneSha256}`);
  out(`                 holdout ${datasets.holdoutSha256}`);
  out(`Identity: catalogueSha256 ${catalogueSha256}`);
  out(`          labelSetSha256 ${labelSetSha256} (${labelSet.labelSetVersion}, ${labelSet.status})`);
  out(`          policy ${policy.policyVersion} (${policy.status}), calibration record ${policy.calibration?.recordId ?? "none"}`);

  // Coverage: subjects x split.
  out("");
  out(`Subject coverage (items whose expectation names exactly one subject; minimum ${MIN_SUBJECT_ITEMS_PER_SPLIT} per split):`);
  out(`  ${pad("subject", 22)} ${pad("tune", 5)} ${pad("holdout", 8)} capabilities`);
  for (const slug of order) {
    const n = (split) => bySplit[split].filter((it) => it.expected && primarySubject(it.expected) === slug).length;
    const [t, h] = [n("tune"), n("holdout")];
    const cap = availability.has(slug) ? (isAvailable(slug) ? "available" : "present, available:false") : "absent";
    const low = t < MIN_SUBJECT_ITEMS_PER_SPLIT || h < MIN_SUBJECT_ITEMS_PER_SPLIT;
    out(`  ${pad(slug, 22)} ${pad(t, 5)} ${pad(h, 8)} ${cap}${low ? "   <-- BELOW MINIMUM" : ""}`);
    if (low) fail(`subject ${slug} below ${MIN_SUBJECT_ITEMS_PER_SPLIT} items in a split (tune ${t}, holdout ${h})`);
  }

  // Coverage: boundary tags x split.
  out("");
  out(`Boundary-tag coverage (minimum ${MIN_TAG_ITEMS_PER_SPLIT} per split):`);
  out(`  ${pad("tag", 28)} ${pad("tune", 5)} holdout`);
  for (const tag of BOUNDARY_TAGS) {
    const n = (split) => bySplit[split].filter((it) => Array.isArray(it.tags) && it.tags.includes(tag)).length;
    const [t, h] = [n("tune"), n("holdout")];
    const low = t < MIN_TAG_ITEMS_PER_SPLIT || h < MIN_TAG_ITEMS_PER_SPLIT;
    out(`  ${pad(tag, 28)} ${pad(t, 5)} ${h}${low ? "   <-- BELOW MINIMUM" : ""}`);
    if (low) fail(`tag ${tag} below ${MIN_TAG_ITEMS_PER_SPLIT} items in a split (tune ${t}, holdout ${h})`);
  }

  // Near-duplicates across splits.
  const tokens = new Map();
  for (const it of items) {
    try {
      tokens.set(it.id, tokenSet(itemText(it)));
    } catch {
      tokens.set(it.id, new Set());
    }
  }
  const nearDupes = [];
  for (const a of bySplit.tune) {
    for (const b of bySplit.holdout) {
      const j = jaccard(tokens.get(a.id), tokens.get(b.id));
      if (j >= NEAR_DUPLICATE_JACCARD) nearDupes.push(`${a.id} ~ ${b.id} (Jaccard ${j.toFixed(3)})`);
    }
  }
  out("");
  out(`Cross-split near-duplicates (normalised token-set Jaccard >= ${NEAR_DUPLICATE_JACCARD}): ${nearDupes.length}`);
  for (const d of nearDupes) {
    out(`  ${d}`);
    fail(`near-duplicate across splits: ${d}`);
  }

  // Disputed items.
  const disputed = items.filter((it) => it.disputed === true);
  out("");
  out(`Disputed items for review: ${disputed.length}`);
  for (const it of disputed) out(`  ${it.id} [${it.split}]: ${it.disputeNote}`);

  // Policy mechanics.
  const options = {
    offlineFixtureHarness: true,
    limits: harness.limits,
    calibrationContext: harness.calibrationContext,
  };
  const tally = Object.fromEntries(SPLITS.map((s) => [s, { pass: 0, fail: 0, notRun: 0 }]));
  const reasonsSeen = new Map();
  let longestExcerpt = "";
  const mechanicsFailures = [];
  for (const it of items) {
    if (!it || !SPLITS.includes(it.split) || !it.expected) continue;
    const t = tally[it.split];
    const sticky = it.trusted && typeof it.trusted.stickySlug === "string";
    if (!sticky && !it.syntheticEvidence) {
      t.notRun += 1;
      continue;
    }
    let result;
    let problem = null;
    try {
      if (sticky) {
        result = await selectSticky({ stickySlug: it.trusted.stickySlug, catalogue, capabilities, options: { offlineFixtureHarness: true } });
      } else {
        const text = itemText(it);
        const excerpt = headExcerpt(text, harness.excerpt.windowUtf8Bytes);
        if (excerpt.text.length > longestExcerpt.length) longestExcerpt = excerpt.text;
        if (it.expectedExcerpt) {
          for (const key of Object.keys(it.expectedExcerpt)) {
            if (it.expectedExcerpt[key] !== excerpt[key]) problem = `excerpt ${key} ${excerpt[key]} != expected ${it.expectedExcerpt[key]}`;
          }
        }
        const evidence = evidenceFromSynthetic(it.syntheticEvidence, {
          catalogueSha256, labelSetSha256, labelSetVersion: labelSet.labelSetVersion,
          adapter: harness.adapter, excerptVersion: harness.excerpt.version, excerpt,
        });
        const check = await validateEvidence(evidence, { catalogue, labelSet, limits: harness.limits });
        if (!check.ok) problem = `synthetic evidence invalid: ${check.errors.map((e) => `${e.path} ${e.code}`).join(", ")}`;
        const trusted = it.trusted && Array.isArray(it.trusted.courseSlugs) ? { courseSlugs: it.trusted.courseSlugs } : {};
        result = await selectSpecialist({ evidence, catalogue, labelSet, policy, capabilities, trusted, options });
      }
    } catch (error) {
      problem = `threw ${error.message}`;
    }
    if (result) {
      problem ??= compare(it.expected, result, order);
      problem ??= safety(result, { slugs, isAvailable, sticky });
      reasonsSeen.set(`${result.outcome}/${result.reason}`, (reasonsSeen.get(`${result.outcome}/${result.reason}`) ?? 0) + 1);
    }
    if (problem) {
      t.fail += 1;
      mechanicsFailures.push(`${it.id} [${it.split}]: ${problem}`);
    } else t.pass += 1;
  }
  out("");
  out("Policy mechanics (synthetic scores -> validateEvidence -> selectSpecialist; sticky items -> selectSticky):");
  for (const s of SPLITS) out(`  ${pad(s, 8)} pass ${tally[s].pass}, fail ${tally[s].fail}, not run (no synthetic evidence) ${tally[s].notRun}`);
  for (const f of mechanicsFailures) {
    out(`  FAIL ${f}`);
    fail(`mechanics: ${f}`);
  }
  out("  Outcome/reason codes exercised:");
  for (const outcome of Object.keys(REASONS_BY_OUTCOME)) {
    for (const reason of REASONS_BY_OUTCOME[outcome]) {
      const n = reasonsSeen.get(`${outcome}/${reason}`) ?? 0;
      out(`    ${pad(`${outcome}/${reason}`, 36)} ${n}${n === 0 ? "  (not in this set; covered by unit tests)" : ""}`);
    }
  }

  const size = measureClassificationPayload({ labelSet, excerpt: longestExcerpt });
  out("");
  out(`Payload size (proposed label set, longest synthetic excerpt): ${size.labelCount} labels, ` +
    `label schema ${size.labelSchemaUtf8Bytes} B, excerpt ${size.excerptUtf8Bytes} B, ` +
    `serialized body ${size.serializedBodyUtf8Bytes} B, token bound ${size.tokenBound.status}.`);

  const total = SPLITS.reduce((acc, s) => ({ pass: acc.pass + tally[s].pass, fail: acc.fail + tally[s].fail, notRun: acc.notRun + tally[s].notRun }), { pass: 0, fail: 0, notRun: 0 });
  out("");
  out(failures.length === 0
    ? `RESULT: PASS. ${items.length} items, mechanics ${total.pass} pass / ${total.fail} fail / ${total.notRun} not run. No model was called.`
    : `RESULT: FAIL (${failures.length} problem(s)). No model was called.`);
  for (const f of failures) if (!f.startsWith("mechanics:") && !f.startsWith("near-duplicate")) out(`  FAIL ${f}`);
  return {
    lines,
    failures,
    summary: { items: items.length, tune: bySplit.tune.length, holdout: bySplit.holdout.length, mechanics: total, tally, nearDuplicates: nearDupes.length, disputed: disputed.length },
  };
}

/**
 * @param {any} expected
 * @param {any} result
 * @param {string[]} order
 * @returns {string | null}
 */
function compare(expected, result, order) {
  const got = `${result.outcome}/${result.reason}${result.slug ? ` ${result.slug}` : ""} [${result.candidates.map((c) => c.slug).join(",")}]`;
  if (result.outcome !== expected.outcome || result.reason !== expected.reason) return `got ${got}, expected ${expected.outcome}/${expected.reason}`;
  if (expected.outcome === "route" && result.slug !== expected.slug) return `got ${got}, expected slug ${expected.slug}`;
  if (expected.candidates) {
    const want = order.filter((s) => expected.candidates.includes(s));
    const have = result.candidates.map((c) => c.slug);
    if (want.join(",") !== have.join(",")) return `got ${got}, expected candidates [${want.join(",")}]`;
  }
  return null;
}

/**
 * Route-safety properties that must hold for every result.
 * @returns {string | null}
 */
function safety(result, { slugs, isAvailable, sticky }) {
  if (result.inferencePerformed !== false) return "inferencePerformed must be false";
  if (result.path !== (sticky ? "sticky" : "classification")) return `unexpected path ${result.path}`;
  if (result.outcome === "route" && (!slugs.has(result.slug) || !isAvailable(result.slug))) {
    return `routed to ${result.slug}, which is not an available catalogue slug`;
  }
  if (result.outcome !== "route" && result.slug !== null) return "non-route result carries a slug";
  for (const c of result.candidates) {
    if (!slugs.has(c.slug) || c.available !== isAvailable(c.slug)) return `candidate ${c.slug} has wrong availability`;
  }
  if (!Object.isFrozen(result) || !Object.isFrozen(result.candidates) || !Object.isFrozen(result.identity)) return "result is not frozen";
  return null;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const { lines, failures } = await evaluate();
  process.stdout.write(`${lines.join("\n")}\n`);
  process.exitCode = failures.length ? 1 : 0;
}
