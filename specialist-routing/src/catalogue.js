/**
 * Routing catalogue validation (`epinoic.routing-catalogue.v1`).
 * @module catalogue
 */

import { SCHEMAS } from "./version.js";
import {
  ErrorList,
  HEX40_RE,
  HEX64_RE,
  KEBAB_RE,
  SEMVER_RE,
  checkKeys,
  checkTermList,
  checkUnique,
  isNonEmptyString,
  isPlainObject,
  isSafeRelativePath,
  scanForbiddenKeys,
} from "./util.js";

const TOP_KEYS = Object.freeze([
  "schema", "catalogueVersion", "synthetic", "source", "families", "subjects",
  "overlapPolicies", "taskContextTerms", "unresolvedDecisions",
]);
const SOURCE_KEYS = Object.freeze(["repo", "commit", "packagesPath", "packageDigests"]);
const FAMILY_KEYS = Object.freeze(["id", "displayName", "members", "genericAliases", "resolution"]);
const SUBJECT_KEYS = Object.freeze([
  "slug", "displayName", "family", "teachingScope", "aliases", "overlapGroups",
  "isLanguageCourse", "slugStatus", "evidence",
]);
const EVIDENCE_KEYS = Object.freeze(["path", "sha256"]);
const OVERLAP_KEYS = Object.freeze(["id", "members", "rule"]);
const DECISION_KEYS = Object.freeze(["id", "question", "interim", "owners"]);

/** The only family resolution: a generic family alias always clarifies. */
export const FAMILY_RESOLUTION = "clarify";
/** The only overlap rule: clarify unless trusted course metadata names exactly one member. */
export const OVERLAP_RULE = "clarify_unless_trusted_course";
/** Allowed `slugStatus` values. */
export const SLUG_STATUSES = Object.freeze(["handoff", "provisional"]);

const MAX_SCOPE_LENGTH = 400;
const MAX_TEXT_LENGTH = 600;

/**
 * Validate a routing catalogue. Synchronous: no digest is needed.
 *
 * Rejects: unknown or missing fields at any level; provider, model, key,
 * secret, token, enablement or availability fields anywhere
 * (`forbidden_field`); slugs that are not lower-case kebab-case; duplicate
 * slugs; leaf aliases shared by two subjects; a leaf alias equal to a family
 * generic alias; family members that are not subjects; a subject in two
 * families; family/subject cross-references that disagree; overlap members
 * that are unknown; a synthetic catalogue that claims evidence or a commit;
 * and a non-synthetic catalogue with missing or inconsistent evidence.
 *
 * A family generic alias such as "english" naming several variants is valid:
 * it is explicit ambiguity, and selection always clarifies it.
 *
 * @param {unknown} catalogue
 * @returns {Readonly<{ok: boolean, errors: ReadonlyArray<{path: string, code: string, detail: string | null}>}>}
 */
export function validateCatalogue(catalogue) {
  const errors = new ErrorList();
  if (!isPlainObject(catalogue)) {
    errors.add("$", "type", "expected an object");
    return errors.result();
  }
  scanForbiddenKeys(catalogue, "$", "catalogue", errors);
  checkKeys(catalogue, TOP_KEYS, [], "$", errors, "catalogue");

  if (catalogue.schema !== SCHEMAS.catalogue) errors.add("$.schema", "schema_mismatch", String(catalogue.schema));
  if (typeof catalogue.catalogueVersion !== "string" || !SEMVER_RE.test(catalogue.catalogueVersion)) {
    errors.add("$.catalogueVersion", "type", "expected MAJOR.MINOR.PATCH");
  }
  if (typeof catalogue.synthetic !== "boolean") errors.add("$.synthetic", "type", "expected boolean");
  const synthetic = catalogue.synthetic === true;

  const subjects = Array.isArray(catalogue.subjects) ? catalogue.subjects : [];
  if (!Array.isArray(catalogue.subjects) || subjects.length === 0) {
    errors.add("$.subjects", "type", "expected a non-empty array");
  }
  const slugs = [];
  subjects.forEach((s, i) => {
    if (isPlainObject(s) && typeof s.slug === "string") slugs.push(s.slug);
    else if (!isPlainObject(s)) errors.add(`$.subjects[${i}]`, "type", "expected an object");
  });
  checkUnique(slugs, "$.subjects", "duplicate_slug", errors);
  const slugSet = new Set(slugs);

  const families = validateFamilies(catalogue.families, slugSet, errors);
  const overlaps = validateOverlaps(catalogue.overlapPolicies, slugSet, errors);
  const familyAliases = new Set(families.flatMap((f) => f.aliases));

  const aliasOwner = new Map();
  subjects.forEach((s, i) => {
    if (!isPlainObject(s)) return;
    validateSubject(s, `$.subjects[${i}]`, { families, overlaps, familyAliases, aliasOwner, synthetic }, errors);
  });

  validateSource(catalogue.source, { synthetic, slugs, subjects }, errors);
  checkTermList(catalogue.taskContextTerms, "$.taskContextTerms", errors, { min: 1 });
  validateDecisions(catalogue.unresolvedDecisions, errors);
  return errors.result();
}

/**
 * @param {unknown} value
 * @param {Set<string>} slugSet
 * @param {ErrorList} errors
 * @returns {{id: string, members: string[], aliases: string[]}[]}
 */
function validateFamilies(value, slugSet, errors) {
  if (!Array.isArray(value)) {
    errors.add("$.families", "type", "expected an array");
    return [];
  }
  const out = [];
  const memberOf = new Map();
  const ids = [];
  value.forEach((f, i) => {
    const path = `$.families[${i}]`;
    if (!isPlainObject(f)) {
      errors.add(path, "type", "expected an object");
      return;
    }
    checkKeys(f, FAMILY_KEYS, [], path, errors, "catalogue");
    if (typeof f.id !== "string" || !KEBAB_RE.test(f.id)) errors.add(`${path}.id`, "not_kebab_case", String(f.id));
    else ids.push(f.id);
    if (!isNonEmptyString(f.displayName)) errors.add(`${path}.displayName`, "type", "expected a non-empty string");
    if (f.resolution !== FAMILY_RESOLUTION) errors.add(`${path}.resolution`, "invalid_resolution", String(f.resolution));
    const aliases = checkTermList(f.genericAliases, `${path}.genericAliases`, errors, { min: 1 });
    const members = [];
    if (!Array.isArray(f.members) || f.members.length < 2) {
      errors.add(`${path}.members`, "type", "expected at least two member slugs");
    } else {
      f.members.forEach((m, j) => {
        if (typeof m !== "string" || !slugSet.has(m)) {
          errors.add(`${path}.members[${j}]`, "unknown_member", String(m));
          return;
        }
        if (memberOf.has(m) && memberOf.get(m) !== f.id) {
          errors.add(`${path}.members[${j}]`, "subject_in_multiple_families", m);
        }
        memberOf.set(m, f.id);
        members.push(m);
      });
      checkUnique(members, `${path}.members`, "duplicate_member", errors);
    }
    out.push({ id: f.id, members, aliases });
  });
  checkUnique(ids, "$.families", "duplicate_family", errors);
  checkUnique(out.flatMap((f) => f.aliases), "$.families", "family_alias_collision", errors);
  return out;
}

/**
 * @param {unknown} value
 * @param {Set<string>} slugSet
 * @param {ErrorList} errors
 * @returns {{id: string, members: string[]}[]}
 */
function validateOverlaps(value, slugSet, errors) {
  if (!Array.isArray(value)) {
    errors.add("$.overlapPolicies", "type", "expected an array");
    return [];
  }
  const out = [];
  value.forEach((p, i) => {
    const path = `$.overlapPolicies[${i}]`;
    if (!isPlainObject(p)) {
      errors.add(path, "type", "expected an object");
      return;
    }
    checkKeys(p, OVERLAP_KEYS, [], path, errors, "catalogue");
    if (typeof p.id !== "string" || !KEBAB_RE.test(p.id)) errors.add(`${path}.id`, "not_kebab_case", String(p.id));
    if (p.rule !== OVERLAP_RULE) errors.add(`${path}.rule`, "invalid_rule", String(p.rule));
    const members = [];
    if (!Array.isArray(p.members) || p.members.length < 2) {
      errors.add(`${path}.members`, "type", "expected at least two member slugs");
    } else {
      p.members.forEach((m, j) => {
        if (typeof m !== "string" || !slugSet.has(m)) errors.add(`${path}.members[${j}]`, "unknown_overlap_member", String(m));
        else members.push(m);
      });
      checkUnique(members, `${path}.members`, "duplicate_member", errors);
    }
    out.push({ id: p.id, members });
  });
  checkUnique(out.map((p) => p.id), "$.overlapPolicies", "duplicate_overlap", errors);
  return out;
}

/**
 * @param {Record<string, any>} s
 * @param {string} path
 * @param {{families: {id: string, members: string[]}[], overlaps: {id: string, members: string[]}[],
 *   familyAliases: Set<string>, aliasOwner: Map<string, string>, synthetic: boolean}} ctx
 * @param {ErrorList} errors
 */
function validateSubject(s, path, ctx, errors) {
  checkKeys(s, SUBJECT_KEYS, [], path, errors, "catalogue");
  if (typeof s.slug !== "string" || !KEBAB_RE.test(s.slug)) errors.add(`${path}.slug`, "not_kebab_case", String(s.slug));
  if (!isNonEmptyString(s.displayName)) errors.add(`${path}.displayName`, "type", "expected a non-empty string");
  if (!isNonEmptyString(s.teachingScope) || s.teachingScope.length > MAX_SCOPE_LENGTH) {
    errors.add(`${path}.teachingScope`, "type", `expected 1..${MAX_SCOPE_LENGTH} characters`);
  }
  if (typeof s.isLanguageCourse !== "boolean") errors.add(`${path}.isLanguageCourse`, "type", "expected boolean");
  if (!SLUG_STATUSES.includes(s.slugStatus)) errors.add(`${path}.slugStatus`, "invalid_slug_status", String(s.slugStatus));

  // Family cross-reference: subject.family and family.members must agree.
  const listedIn = ctx.families.filter((f) => f.members.includes(s.slug)).map((f) => f.id);
  if (s.family === null) {
    if (listedIn.length > 0) errors.add(`${path}.family`, "family_mismatch", `listed in ${listedIn.join(",")}`);
  } else if (typeof s.family !== "string" || !ctx.families.some((f) => f.id === s.family)) {
    errors.add(`${path}.family`, "unknown_family", String(s.family));
  } else if (!listedIn.includes(s.family)) {
    errors.add(`${path}.family`, "family_mismatch", `not a member of ${s.family}`);
  }

  // Overlap cross-reference.
  const groups = checkTermList(s.overlapGroups, `${path}.overlapGroups`, errors);
  for (const g of groups) {
    const policy = ctx.overlaps.find((p) => p.id === g);
    if (!policy) errors.add(`${path}.overlapGroups`, "unknown_overlap_group", g);
    else if (!policy.members.includes(s.slug)) errors.add(`${path}.overlapGroups`, "overlap_mismatch", g);
  }
  for (const p of ctx.overlaps) {
    if (p.members.includes(s.slug) && !groups.includes(p.id)) errors.add(`${path}.overlapGroups`, "overlap_mismatch", p.id);
  }

  // Leaf aliases: unique across leaves, never equal to a family generic alias.
  const aliases = checkTermList(s.aliases, `${path}.aliases`, errors);
  for (const alias of aliases) {
    if (ctx.familyAliases.has(alias)) errors.add(`${path}.aliases`, "alias_equals_family_alias", alias);
    const owner = ctx.aliasOwner.get(alias);
    if (owner !== undefined && owner !== s.slug) errors.add(`${path}.aliases`, "alias_collision", `${alias} (also ${owner})`);
    ctx.aliasOwner.set(alias, s.slug);
  }

  // Evidence: null when synthetic; required and well-formed otherwise.
  if (ctx.synthetic) {
    if (s.evidence !== null) errors.add(`${path}.evidence`, "synthetic_with_evidence", "synthetic catalogues carry no evidence");
  } else if (!isPlainObject(s.evidence)) {
    errors.add(`${path}.evidence`, "missing_evidence", "non-synthetic catalogue needs evidence");
  } else {
    checkKeys(s.evidence, EVIDENCE_KEYS, [], `${path}.evidence`, errors, "catalogue");
    if (!isSafeRelativePath(s.evidence.path)) errors.add(`${path}.evidence.path`, "type", "expected a safe relative path");
    if (typeof s.evidence.sha256 !== "string" || !HEX64_RE.test(s.evidence.sha256)) {
      errors.add(`${path}.evidence.sha256`, "type", "expected 64 lower-case hex");
    }
  }
}

/**
 * @param {unknown} source
 * @param {{synthetic: boolean, slugs: string[], subjects: any[]}} ctx
 * @param {ErrorList} errors
 */
function validateSource(source, ctx, errors) {
  if (!isPlainObject(source)) {
    errors.add("$.source", "type", "expected an object");
    return;
  }
  checkKeys(source, SOURCE_KEYS, [], "$.source", errors, "catalogue");
  if (!isNonEmptyString(source.repo)) errors.add("$.source.repo", "type", "expected a non-empty string");
  if (!isSafeRelativePath(source.packagesPath)) errors.add("$.source.packagesPath", "type", "expected a safe relative path");
  if (!isPlainObject(source.packageDigests)) {
    errors.add("$.source.packageDigests", "type", "expected an object");
    return;
  }
  const digestSlugs = Object.keys(source.packageDigests);
  if (ctx.synthetic) {
    if (source.commit !== null) errors.add("$.source.commit", "synthetic_with_commit", "must be null when synthetic");
    if (digestSlugs.length > 0) errors.add("$.source.packageDigests", "synthetic_with_evidence", "must be {} when synthetic");
    return;
  }
  if (typeof source.commit !== "string" || !HEX40_RE.test(source.commit)) {
    errors.add("$.source.commit", "missing_evidence", "non-synthetic catalogue needs a 40-hex commit");
  }
  for (const slug of digestSlugs) {
    if (!ctx.slugs.includes(slug)) errors.add(`$.source.packageDigests.${slug}`, "unknown_slug", slug);
    else if (typeof source.packageDigests[slug] !== "string" || !HEX64_RE.test(source.packageDigests[slug])) {
      errors.add(`$.source.packageDigests.${slug}`, "type", "expected 64 lower-case hex");
    }
  }
  for (const s of ctx.subjects) {
    if (!isPlainObject(s) || typeof s.slug !== "string") continue;
    const digest = source.packageDigests[s.slug];
    if (digest === undefined) {
      errors.add(`$.source.packageDigests.${s.slug}`, "missing_evidence", s.slug);
      continue;
    }
    if (isPlainObject(s.evidence)) {
      if (s.evidence.sha256 !== digest) errors.add(`$.source.packageDigests.${s.slug}`, "evidence_mismatch", s.slug);
      if (s.evidence.path !== `${source.packagesPath}/${s.slug}`) {
        errors.add(`$.source.packageDigests.${s.slug}`, "evidence_mismatch", `path must be ${source.packagesPath}/${s.slug}`);
      }
    }
  }
}

/**
 * @param {unknown} value
 * @param {ErrorList} errors
 */
function validateDecisions(value, errors) {
  if (!Array.isArray(value)) {
    errors.add("$.unresolvedDecisions", "type", "expected an array");
    return;
  }
  const ids = [];
  value.forEach((d, i) => {
    const path = `$.unresolvedDecisions[${i}]`;
    if (!isPlainObject(d)) {
      errors.add(path, "type", "expected an object");
      return;
    }
    checkKeys(d, DECISION_KEYS, [], path, errors, "catalogue");
    if (typeof d.id !== "string" || !KEBAB_RE.test(d.id)) errors.add(`${path}.id`, "not_kebab_case", String(d.id));
    else ids.push(d.id);
    for (const key of ["question", "interim"]) {
      if (!isNonEmptyString(d[key]) || d[key].length > MAX_TEXT_LENGTH) errors.add(`${path}.${key}`, "type", "expected text");
    }
    if (!Array.isArray(d.owners) || d.owners.length === 0 || !d.owners.every(isNonEmptyString)) {
      errors.add(`${path}.owners`, "type", "expected a non-empty array of names");
    }
  });
  checkUnique(ids, "$.unresolvedDecisions", "duplicate_decision", errors);
}

/**
 * Lookup tables for a catalogue that has already passed validateCatalogue.
 * @param {any} catalogue
 */
export function indexCatalogue(catalogue) {
  const subjects = new Map(catalogue.subjects.map((s, i) => [s.slug, { ...s, order: i }]));
  const families = new Map(catalogue.families.map((f) => [f.id, f]));
  const overlaps = new Map(catalogue.overlapPolicies.map((p) => [p.id, p]));
  return { subjects, families, overlaps, order: catalogue.subjects.map((s) => s.slug) };
}
