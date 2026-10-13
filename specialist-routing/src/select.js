/**
 * Selection: `selectSpecialist` (classification path) and `selectSticky`
 * (trusted follow-up path). Both are **async** (identity hashes use SHA-256 via
 * crypto.subtle), never run inference, never mutate their inputs and always
 * resolve to a deep-frozen RoutingResult. They throw only for programming
 * errors in `options` (not an object, unknown option, wrong option type).
 * @module select
 */

import { availabilityOf, validateCapabilities } from "./capabilities.js";
import { checkCalibration } from "./calibration.js";
import { indexCatalogue, validateCatalogue } from "./catalogue.js";
import { catalogueDigest, labelSetDigest, policyDigest } from "./digest.js";
import { IDENTITY_ERROR_CODES, validateEvidence } from "./evidence.js";
import { buildLabelSet, validateLabelSet } from "./label-set.js";
import { policyReadiness } from "./policy.js";
import { EMPTY_IDENTITY, makeResult } from "./result.js";
import { OFFLINE_TEST_ENVIRONMENT } from "./version.js";
import { isPlainObject } from "./util.js";

/**
 * Tolerance for margin comparisons, so that float noise such as
 * 0.8 - 0.65 = 0.15000000000000002 does not decide a route. A gap within
 * EPSILON of `marginMin` counts as "within the margin" (fail-closed: clarify).
 */
export const MARGIN_EPSILON = 1e-9;

const SPECIALIST_OPTIONS = Object.freeze(["offlineFixtureHarness", "calibrationContext", "limits"]);
const STICKY_OPTIONS = Object.freeze(["offlineFixtureHarness"]);

/**
 * @param {unknown} options
 * @param {readonly string[]} allowed
 * @param {string} fn
 * @returns {Record<string, any>}
 */
function checkOptions(options, allowed, fn) {
  if (!isPlainObject(options)) throw new TypeError(`${fn}: options must be a plain object`);
  for (const key of Object.keys(options)) {
    if (!allowed.includes(key)) throw new TypeError(`${fn}: unknown option "${key}"`);
  }
  if ("offlineFixtureHarness" in options && typeof options.offlineFixtureHarness !== "boolean") {
    throw new TypeError(`${fn}: options.offlineFixtureHarness must be a boolean`);
  }
  return options;
}

/**
 * `trusted` is server-derived only: `{ courseSlugs?: string[] }`. Unknown
 * fields, unknown or duplicate slugs and non-arrays are rejected.
 * @param {unknown} trusted
 * @param {Set<string>} slugs
 */
function trustedIsValid(trusted, slugs) {
  if (!isPlainObject(trusted)) return false;
  for (const key of Object.keys(trusted)) if (key !== "courseSlugs") return false;
  if (!("courseSlugs" in trusted)) return true;
  const list = trusted.courseSlugs;
  if (!Array.isArray(list) || list.length > slugs.size) return false;
  return list.every((s) => typeof s === "string" && slugs.has(s)) && new Set(list).size === list.length;
}

/**
 * Pick the single trusted course for a group, or null. The group resolves only
 * when exactly one of its members is a trusted course and that member is
 * eligible (one of the clarify candidates).
 * @param {readonly string[]} courses
 * @param {readonly string[]} groupMembers
 * @param {readonly string[]} eligible
 */
function trustedPick(courses, groupMembers, eligible) {
  const matches = groupMembers.filter((m) => courses.includes(m));
  return matches.length === 1 && eligible.includes(matches[0]) ? matches[0] : null;
}

/**
 * Select at most one canonical specialist slug from validated evidence.
 *
 * Policy order (contract section 6, each step tested):
 * 1. Validate catalogue (and the label set derived from it), capabilities,
 *    policy and evidence; check identity hashes; check the calibration fingerprint.
 * 2. `non_english_input >= nonEnglishMin` -> `unavailable/unsupported_language`.
 * 3. `mixed_request >= mixedMin`, or two unrelated topics (subjects at or above
 *    `routeMin`, family signals at or above `familyMin`), or `out_of_scope >=
 *    outOfScopeMin` together with any such topic -> `clarify/mixed_request`.
 * 4. `out_of_scope >= outOfScopeMin` with no subject at or above `routeMin` -> `unavailable/out_of_scope`.
 * 5. Family signal at or above `familyMin` with no member separated by more than
 *    `marginMin` (and at or above `routeMin`) -> `clarify/generic_family`, unless
 *    trusted courses name exactly one member -> route `trusted_course_metadata`.
 * 6. `needs_task_context >= taskContextMin` with no subject at or above `routeMin`
 *    -> `clarify/needs_task_context`.
 * 7. Top subject below `routeMin`: candidates at or above `clarifyFloor` ->
 *    `clarify/low_confidence`, otherwise `unavailable/out_of_scope`.
 * 8. Top two within `marginMin`: all near-top subjects in one overlap group ->
 *    `clarify/overlap_policy` (resolved only by trusted courses naming exactly one
 *    member), otherwise `clarify/competing_subjects`. No score tie-break.
 * 9. A recognised subject (including a trusted pick) that capabilities mark
 *    unavailable or omit -> `unavailable/specialist_unavailable` with that slug.
 *    Never replaced by another specialist.
 * 10. Otherwise `route/single_subject`.
 *
 * Invalid inputs map onto the closed reasons: invalid catalogue or a label set
 * that is not `buildLabelSet(catalogue)` -> `identity_mismatch`; invalid
 * capabilities, or `offline-test` capabilities outside the harness ->
 * `capabilities_invalid`; a structurally invalid policy -> `calibration_missing`;
 * invalid `trusted` or missing `options.limits` -> `evidence_invalid`; a missing
 * or malformed `options.calibrationContext` -> `calibration_mismatch`.
 *
 * @param {{
 *   evidence: object, catalogue: object, labelSet: object, policy: object, capabilities: object,
 *   trusted?: {courseSlugs?: string[]},
 *   options?: {offlineFixtureHarness?: boolean, limits?: {maxExcerptUtf8Bytes: number},
 *     calibrationContext?: {model: string, datasets: {tuneSha256: string, holdoutSha256: string}}}
 * }} input
 * @returns {Promise<Readonly<object>>} RoutingResult
 */
export async function selectSpecialist({
  evidence, catalogue, labelSet, policy, capabilities, trusted = {}, options = {},
} = {}) {
  const opts = checkOptions(options, SPECIALIST_OPTIONS, "selectSpecialist");
  const harness = opts.offlineFixtureHarness === true;
  const identity = { ...EMPTY_IDENTITY };
  const finish = (outcome, reason, extra = {}) =>
    makeResult({ outcome, reason, path: "classification", identity, ...extra });

  // Step 1: inputs, identity, calibration.
  if (!validateCatalogue(catalogue).ok) return finish("unavailable", "identity_mismatch");
  identity.catalogueSha256 = await catalogueDigest(catalogue);
  const expectedLabelSetSha256 = await labelSetDigest(buildLabelSet(catalogue));
  if (!validateLabelSet(labelSet).ok || (await labelSetDigest(labelSet)) !== expectedLabelSetSha256) {
    return finish("unavailable", "identity_mismatch");
  }
  identity.labelSetSha256 = expectedLabelSetSha256;

  if (!validateCapabilities(capabilities, { catalogue }).ok) return finish("unavailable", "capabilities_invalid");
  if (capabilities.environment === OFFLINE_TEST_ENVIRONMENT && !harness) {
    return finish("unavailable", "capabilities_invalid");
  }

  const readiness = policyReadiness(policy, opts);
  if (readiness === "policy_invalid") return finish("unavailable", "calibration_missing");
  identity.policyVersion = policy.policyVersion;
  if (readiness !== "usable") return finish("unavailable", readiness);

  const evidenceCheck = await validateEvidence(evidence, { catalogue, labelSet, limits: opts.limits });
  const structural = evidenceCheck.errors.filter((e) => !IDENTITY_ERROR_CODES.includes(e.code));
  const slugs = new Set(catalogue.subjects.map((s) => s.slug));
  if (structural.length > 0 || !trustedIsValid(trusted, slugs)) return finish("unavailable", "evidence_invalid");
  if (!evidenceCheck.ok) return finish("unavailable", "identity_mismatch");

  const ctx = opts.calibrationContext;
  const ctxOk = isPlainObject(ctx) && Object.keys(ctx).every((k) => k === "model" || k === "datasets");
  const calibration = await checkCalibration({
    policy,
    identity: {
      model: ctxOk ? ctx.model : undefined,
      labelSetSha256: identity.labelSetSha256,
      catalogueSha256: identity.catalogueSha256,
      policySha256: await policyDigest(policy),
      adapterVersion: evidence.adapter.version,
      excerptVersion: evidence.excerpt.version,
      datasets: ctxOk ? ctx.datasets : undefined,
    },
  });
  if (!calibration.ok) return finish("unavailable", calibration.reason);
  identity.calibrationFingerprint = calibration.fingerprint;

  return decide({
    evidence,
    catalogue,
    thresholds: policy.thresholds,
    courses: Array.isArray(trusted.courseSlugs) ? trusted.courseSlugs : [],
    available: availabilityOf(capabilities),
    finish,
  });
}

/**
 * Steps 2-10 over validated inputs.
 * @param {{evidence: any, catalogue: any, thresholds: any, courses: string[],
 *   available: (slug: string) => boolean, finish: Function}} input
 */
function decide({ evidence, catalogue, thresholds: T, courses, available, finish }) {
  const idx = indexCatalogue(catalogue);
  const score = new Map(idx.order.map((s) => [s, 0]));
  for (const e of evidence.subjects) score.set(e.label, e.score);
  const familyScore = new Map(catalogue.families.map((f) => [f.id, 0]));
  for (const e of evidence.families) familyScore.set(e.label, e.score);
  const flags = evidence.flags;
  const S = (slug) => score.get(slug);
  const inCatalogueOrder = (list) => idx.order.filter((s) => list.includes(s));
  const candidates = (list) => inCatalogueOrder(list).map((slug) => ({ slug, available: available(slug) }));
  const withinMargin = (top, other) => top - other <= T.marginMin + MARGIN_EPSILON;
  const routeIfAvailable = (slug, reason) =>
    available(slug)
      ? finish("route", reason, { slug })
      : finish("unavailable", "specialist_unavailable", { candidates: [{ slug, available: false }] });

  // Step 2: input language. A language-course subject score never counts here.
  if (flags.non_english_input >= T.nonEnglishMin) return finish("unavailable", "unsupported_language");

  // Step 3: mixed requests are never reduced to one half and never fanned out.
  const strongSubjects = idx.order.filter((s) => S(s) >= T.routeMin);
  const strongFamilies = catalogue.families.filter((f) => familyScore.get(f.id) >= T.familyMin);
  const topics = [
    ...strongSubjects.map((slug) => ({ slug, family: null })),
    ...strongFamilies.map((f) => ({ slug: null, family: f })),
  ];
  const related = (a, b) => {
    if (a.slug && b.slug) {
      const sa = idx.subjects.get(a.slug);
      const sb = idx.subjects.get(b.slug);
      return (sa.family !== null && sa.family === sb.family) || sa.overlapGroups.some((g) => sb.overlapGroups.includes(g));
    }
    if (a.family && b.family) return a.family.id === b.family.id;
    const fam = a.family || b.family;
    return fam.members.includes(a.slug || b.slug);
  };
  let unrelatedPair = false;
  for (let i = 0; i < topics.length && !unrelatedPair; i += 1) {
    for (let j = i + 1; j < topics.length; j += 1) {
      if (!related(topics[i], topics[j])) {
        unrelatedPair = true;
        break;
      }
    }
  }
  const outsideHalf = flags.out_of_scope >= T.outOfScopeMin && topics.length > 0;
  if (flags.mixed_request >= T.mixedMin || unrelatedPair || outsideHalf) {
    const named = [...strongSubjects, ...strongFamilies.flatMap((f) => f.members)];
    return finish("clarify", "mixed_request", { candidates: candidates(named) });
  }

  // Step 4: out of scope.
  if (flags.out_of_scope >= T.outOfScopeMin && strongSubjects.length === 0) {
    return finish("unavailable", "out_of_scope");
  }

  // Step 5: generic family (English, Maths). Never a default member.
  for (const family of strongFamilies) {
    const members = [...family.members].sort((a, b) => S(b) - S(a) || idx.subjects.get(a).order - idx.subjects.get(b).order);
    const top = S(members[0]);
    const separated = top >= T.routeMin && !withinMargin(top, S(members[1]));
    if (!separated) {
      const pick = trustedPick(courses, family.members, family.members);
      if (pick) return routeIfAvailable(pick, "trusted_course_metadata");
      return finish("clarify", "generic_family", { candidates: candidates(family.members) });
    }
  }

  // Step 6: assessment task without a subject.
  const floorCandidates = idx.order.filter((s) => S(s) >= T.clarifyFloor);
  if (flags.needs_task_context >= T.taskContextMin && strongSubjects.length === 0) {
    return finish("clarify", "needs_task_context", { candidates: candidates(floorCandidates) });
  }

  // Step 7: low confidence.
  const ranked = [...idx.order].sort((a, b) => S(b) - S(a) || idx.subjects.get(a).order - idx.subjects.get(b).order);
  const top = ranked[0];
  if (S(top) < T.routeMin) {
    if (floorCandidates.length > 0) return finish("clarify", "low_confidence", { candidates: candidates(floorCandidates) });
    return finish("unavailable", "out_of_scope");
  }

  // Step 8: near ties. No arbitrary highest-score tie-break.
  if (withinMargin(S(top), S(ranked[1]))) {
    const near = ranked.filter((s) => withinMargin(S(top), S(s)));
    const group = catalogue.overlapPolicies.find((p) => near.every((s) => p.members.includes(s)));
    if (group) {
      const pick = trustedPick(courses, group.members, near);
      if (pick) return routeIfAvailable(pick, "trusted_course_metadata");
      return finish("clarify", "overlap_policy", { candidates: candidates(near) });
    }
    return finish("clarify", "competing_subjects", { candidates: candidates(near) });
  }

  // Steps 9 and 10.
  return routeIfAvailable(top, "single_subject");
}

/**
 * Trusted follow-up path for a subject the website stored server-side. Runs no
 * inference and needs no calibration. Re-checks that the slug is in the
 * catalogue (`unavailable/sticky_invalid` otherwise) and still available
 * (`route/sticky_subject`, or `unavailable/specialist_unavailable`). An
 * explicit "different subject" action means calling selectSpecialist again;
 * there is no phrase-triggered reclassification here. **Async.**
 *
 * @param {{stickySlug: string, catalogue: object, capabilities: object,
 *   options?: {offlineFixtureHarness?: boolean}}} input
 * @returns {Promise<Readonly<object>>} RoutingResult with `path: "sticky"`
 */
export async function selectSticky({ stickySlug, catalogue, capabilities, options = {} } = {}) {
  const opts = checkOptions(options, STICKY_OPTIONS, "selectSticky");
  const identity = { ...EMPTY_IDENTITY };
  const finish = (outcome, reason, extra = {}) => makeResult({ outcome, reason, path: "sticky", identity, ...extra });

  if (!validateCatalogue(catalogue).ok) return finish("unavailable", "identity_mismatch");
  identity.catalogueSha256 = await catalogueDigest(catalogue);
  if (!validateCapabilities(capabilities, { catalogue }).ok) return finish("unavailable", "capabilities_invalid");
  if (capabilities.environment === OFFLINE_TEST_ENVIRONMENT && opts.offlineFixtureHarness !== true) {
    return finish("unavailable", "capabilities_invalid");
  }
  if (typeof stickySlug !== "string" || !catalogue.subjects.some((s) => s.slug === stickySlug)) {
    return finish("unavailable", "sticky_invalid");
  }
  if (!availabilityOf(capabilities)(stickySlug)) {
    return finish("unavailable", "specialist_unavailable", { candidates: [{ slug: stickySlug, available: false }] });
  }
  return finish("route", "sticky_subject", { slug: stickySlug });
}
