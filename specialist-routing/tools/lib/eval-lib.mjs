/**
 * Shared Node-side helpers for the synthetic evaluation set: loading, split
 * determinism, `compose` expansion, the fixture excerpt window, dataset
 * digests, item schema checks, near-duplicate tokens and conversion of
 * hand-assigned synthetic scores into `epinoic.routing-evidence.v1`.
 *
 * Build/eval tooling only (Node allowed). The runtime in src/ never imports this.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalJson } from "../../src/canonical-json.js";
import { REASONS_BY_OUTCOME } from "../../src/result.js";
import { FLAG_LABELS, SCHEMAS } from "../../src/version.js";

export const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const PATHS = Object.freeze({
  catalogue: path.join(PACKAGE_ROOT, "fixtures", "catalogue.synthetic.json"),
  capabilities: path.join(PACKAGE_ROOT, "fixtures", "capabilities.synthetic.json"),
  policy: path.join(PACKAGE_ROOT, "fixtures", "policy.synthetic.json"),
  harness: path.join(PACKAGE_ROOT, "fixtures", "harness.synthetic.json"),
  evidence: path.join(PACKAGE_ROOT, "fixtures", "evidence.synthetic.json"),
  eval: path.join(PACKAGE_ROOT, "eval", "routing-eval.synthetic.jsonl"),
});

/** Split rule: first byte of SHA-256(group) below this value is "tune", otherwise "holdout". */
export const SPLIT_TUNE_BELOW = 154;
/** Marker every syntheticEvidence object must carry. */
export const SYNTHETIC_EVIDENCE_KIND = "hand-assigned-synthetic-scores";
/** Largest expanded `compose` text accepted. */
export const MAX_COMPOSE_UTF8_BYTES = 65536;
/** Minimum single-subject items per subject per split. */
export const MIN_SUBJECT_ITEMS_PER_SPLIT = 3;
/** Minimum items per boundary tag per split. */
export const MIN_TAG_ITEMS_PER_SPLIT = 2;
/** Cross-split near-duplicate threshold (normalised token-set Jaccard). */
export const NEAR_DUPLICATE_JACCARD = 0.8;

/** Boundary tags that must each appear in both splits. */
export const BOUNDARY_TAGS = Object.freeze([
  "generic-english", "generic-maths", "english-variant-specific", "maths-variant-specific",
  "overlap-environment", "mixed-subjects", "mixed-supported-unsupported", "unavailable-recognised",
  "out-of-scope", "unsupported-language", "language-vs-subject", "needs-task-context",
  "prompt-injection", "long-message", "excerpt-edge", "trusted-course-metadata", "sticky-follow-up",
]);
/** Descriptive tags with no coverage requirement. */
export const OTHER_TAGS = Object.freeze(["single-subject", "competing-subjects", "low-confidence", "alias"]);

const ITEM_REQUIRED = ["id", "group", "split", "expected", "rationale", "disputed", "tags"];
const ITEM_OPTIONAL = ["text", "compose", "trusted", "syntheticEvidence", "disputeNote", "expectedExcerpt"];
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const utf8 = new TextEncoder();

/** @param {string} file */
export function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

/** @param {string | Buffer} data */
export function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

/** @param {string} group @returns {"tune" | "holdout"} */
export function splitOfGroup(group) {
  return createHash("sha256").update(group, "utf8").digest()[0] < SPLIT_TUNE_BELOW ? "tune" : "holdout";
}

/**
 * Parse a JSONL file. Blank lines are not allowed.
 * @param {string} file
 * @returns {{items: {line: number, item: any}[], errors: string[]}}
 */
export function loadJsonl(file) {
  const raw = readFileSync(file, "utf8");
  const errors = [];
  const items = [];
  const lines = raw.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  lines.forEach((text, i) => {
    try {
      items.push({ line: i + 1, item: JSON.parse(text) });
    } catch (error) {
      errors.push(`line ${i + 1}: invalid JSON (${error.message})`);
    }
  });
  return { items, errors };
}

/**
 * Expand a `compose` generator: `{ segments: [{ text, repeat }] }` becomes the
 * concatenation of each segment's text repeated `repeat` times (no separators).
 * @param {any} compose
 * @returns {string}
 */
export function expandCompose(compose) {
  if (!compose || typeof compose !== "object" || !Array.isArray(compose.segments) || compose.segments.length === 0) {
    throw new TypeError("compose must be { segments: [{ text, repeat }] }");
  }
  for (const key of Object.keys(compose)) if (key !== "segments") throw new TypeError(`compose: unknown field ${key}`);
  let out = "";
  for (const seg of compose.segments) {
    const keys = Object.keys(seg ?? {});
    if (keys.some((k) => k !== "text" && k !== "repeat") || typeof seg.text !== "string" || seg.text.length === 0
      || !Number.isSafeInteger(seg.repeat) || seg.repeat < 1 || seg.repeat > 1000) {
      throw new TypeError("compose segment must be { text: non-empty string, repeat: 1..1000 }");
    }
    out += seg.text.repeat(seg.repeat);
    if (utf8.encode(out).length > MAX_COMPOSE_UTF8_BYTES) throw new TypeError("compose expands beyond the size limit");
  }
  return out;
}

/** @param {any} item @returns {string} */
export function itemText(item) {
  return typeof item.text === "string" ? item.text : expandCompose(item.compose);
}

/**
 * The fixture harness excerpt: the longest prefix of whole code points whose
 * UTF-8 encoding fits in `windowBytes`. This is the harness's stand-in for
 * website 01's excerpting, which this package does not own.
 * @param {string} text
 * @param {number} windowBytes
 * @returns {{text: string, utf8Bytes: number, codePoints: number, truncated: boolean}}
 */
export function headExcerpt(text, windowBytes) {
  let bytes = 0;
  let codePoints = 0;
  let end = 0;
  for (const ch of text) {
    const size = utf8.encode(ch).length;
    if (bytes + size > windowBytes) break;
    bytes += size;
    codePoints += 1;
    end += ch.length;
  }
  return { text: text.slice(0, end), utf8Bytes: bytes, codePoints, truncated: end < text.length };
}

/**
 * Dataset digests for the calibration identity: SHA-256 over the canonical JSON
 * of each split's items sorted by id.
 * @param {any[]} items
 * @returns {{tuneSha256: string, holdoutSha256: string}}
 */
export function datasetDigests(items) {
  const bySplit = (split) => items.filter((it) => it.split === split).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return {
    tuneSha256: sha256(canonicalJson(bySplit("tune"))),
    holdoutSha256: sha256(canonicalJson(bySplit("holdout"))),
  };
}

/** @param {string} text @returns {Set<string>} normalised token set */
export function tokenSet(text) {
  const norm = text.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  return new Set(norm.length ? norm.split(" ") : []);
}

/** @param {Set<string>} a @param {Set<string>} b */
export function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / (a.size + b.size - inter);
}

/**
 * Convert hand-assigned synthetic scores into routing evidence. Labels and
 * scores are copied as given (validateEvidence then checks them); missing flags
 * default to 0. These are NOT provider observations.
 * @param {any} synthetic
 * @param {{catalogueSha256: string, labelSetSha256: string, labelSetVersion: string,
 *   adapter: {id: string, version: string}, excerptVersion: string,
 *   excerpt: {utf8Bytes: number, codePoints: number, truncated: boolean}}} ctx
 */
export function evidenceFromSynthetic(synthetic, ctx) {
  const toList = (obj) => Object.keys(obj).sort().map((label) => ({ label, score: obj[label] }));
  const flags = {};
  for (const f of FLAG_LABELS) flags[f] = synthetic.flags && f in synthetic.flags ? synthetic.flags[f] : 0;
  return {
    schema: SCHEMAS.evidence,
    labelSetVersion: ctx.labelSetVersion,
    labelSetSha256: ctx.labelSetSha256,
    catalogueSha256: ctx.catalogueSha256,
    adapter: { id: ctx.adapter.id, version: ctx.adapter.version },
    excerpt: {
      version: ctx.excerptVersion,
      utf8Bytes: ctx.excerpt.utf8Bytes,
      codePoints: ctx.excerpt.codePoints,
      truncated: ctx.excerpt.truncated,
    },
    subjects: toList(synthetic.subjects ?? {}),
    families: toList(synthetic.families ?? {}),
    flags,
  };
}

/**
 * Schema check for one evaluation item. Returns a list of problems.
 * @param {any} item
 * @param {{slugs: Set<string>, families: Set<string>}} ctx
 * @returns {string[]}
 */
export function checkItemSchema(item, ctx) {
  const problems = [];
  const bad = (msg) => problems.push(msg);
  if (!item || typeof item !== "object" || Array.isArray(item)) return ["item is not an object"];
  for (const key of Object.keys(item)) if (![...ITEM_REQUIRED, ...ITEM_OPTIONAL].includes(key)) bad(`unknown field ${key}`);
  for (const key of ITEM_REQUIRED) if (!(key in item)) bad(`missing field ${key}`);
  if (typeof item.id !== "string" || !KEBAB.test(item.id)) bad("id must be kebab-case");
  if (typeof item.group !== "string" || !KEBAB.test(item.group)) bad("group must be kebab-case");
  if (item.split !== "tune" && item.split !== "holdout") bad("split must be tune or holdout");
  if (("text" in item) === ("compose" in item)) bad("exactly one of text or compose is required");
  if ("text" in item && (typeof item.text !== "string" || item.text.length === 0 || item.text.length > 4000)) {
    bad("text must be a string of 1..4000 characters");
  }
  if ("compose" in item) {
    try {
      expandCompose(item.compose);
    } catch (error) {
      bad(error.message);
    }
  }
  if (typeof item.rationale !== "string" || item.rationale.trim() === "") bad("rationale must be text");
  if (typeof item.disputed !== "boolean") bad("disputed must be boolean");
  if (item.disputed === true && (typeof item.disputeNote !== "string" || item.disputeNote.trim() === "")) {
    bad("disputed items need a disputeNote");
  }
  if (item.disputed === false && "disputeNote" in item) bad("disputeNote only on disputed items");
  if (!Array.isArray(item.tags) || item.tags.length === 0) bad("tags must be a non-empty array");
  else {
    for (const t of item.tags) if (!BOUNDARY_TAGS.includes(t) && !OTHER_TAGS.includes(t)) bad(`unknown tag ${t}`);
    if (new Set(item.tags).size !== item.tags.length) bad("duplicate tags");
  }
  problems.push(...checkExpected(item.expected, ctx));

  const sticky = item.trusted && typeof item.trusted === "object" && "stickySlug" in item.trusted;
  if ("trusted" in item) {
    const t = item.trusted;
    const keys = t && typeof t === "object" ? Object.keys(t) : [];
    if (keys.length !== 1 || !["courseSlugs", "stickySlug"].includes(keys[0])) {
      bad("trusted must be { courseSlugs } or { stickySlug }");
    } else if (keys[0] === "stickySlug" && typeof t.stickySlug !== "string") bad("trusted.stickySlug must be a string");
    else if (keys[0] === "courseSlugs" && (!Array.isArray(t.courseSlugs) || !t.courseSlugs.every((s) => ctx.slugs.has(s)))) {
      bad("trusted.courseSlugs must list catalogue slugs");
    }
  }
  if (sticky && "syntheticEvidence" in item) bad("sticky items run no inference and carry no syntheticEvidence");
  if (sticky && !item.tags?.includes("sticky-follow-up")) bad("sticky items must be tagged sticky-follow-up");
  if ("syntheticEvidence" in item) problems.push(...checkSyntheticEvidence(item.syntheticEvidence));
  if ("expectedExcerpt" in item) {
    const e = item.expectedExcerpt;
    if (!e || typeof e !== "object" || !Number.isSafeInteger(e.utf8Bytes) || typeof e.truncated !== "boolean"
      || Object.keys(e).some((k) => !["utf8Bytes", "codePoints", "truncated"].includes(k))
      || ("codePoints" in e && !Number.isSafeInteger(e.codePoints))) {
      bad("expectedExcerpt must be { utf8Bytes, codePoints?, truncated }");
    }
  }
  return problems;
}

/** @param {any} expected @param {{slugs: Set<string>}} ctx */
function checkExpected(expected, ctx) {
  const problems = [];
  if (!expected || typeof expected !== "object") return ["expected must be an object"];
  for (const key of Object.keys(expected)) {
    if (!["outcome", "reason", "slug", "candidates"].includes(key)) problems.push(`expected: unknown field ${key}`);
  }
  const reasons = REASONS_BY_OUTCOME[expected.outcome];
  if (!reasons) return [...problems, `expected.outcome ${expected.outcome} is not a routing outcome`];
  if (!reasons.includes(expected.reason)) problems.push(`expected.reason ${expected.reason} is not valid for ${expected.outcome}`);
  const cands = expected.candidates;
  if (cands !== undefined && (!Array.isArray(cands) || !cands.every((s) => ctx.slugs.has(s)) || new Set(cands).size !== cands.length)) {
    problems.push("expected.candidates must be unique catalogue slugs");
  }
  if (expected.outcome === "route") {
    if (!ctx.slugs.has(expected.slug)) problems.push("route items need a catalogue slug");
    if (cands !== undefined) problems.push("route items carry no candidates");
  } else {
    if ("slug" in expected) problems.push("only route items carry a slug");
    if (expected.outcome === "clarify" && cands === undefined) problems.push("clarify items need candidates");
    if (expected.reason === "specialist_unavailable" && (!Array.isArray(cands) || cands.length !== 1)) {
      problems.push("specialist_unavailable items name exactly one candidate");
    }
    if (expected.outcome === "unavailable" && expected.reason !== "specialist_unavailable" && cands !== undefined && cands.length > 0) {
      problems.push("only specialist_unavailable carries candidates among unavailable outcomes");
    }
  }
  return problems;
}

/** @param {any} se */
function checkSyntheticEvidence(se) {
  const problems = [];
  if (!se || typeof se !== "object") return ["syntheticEvidence must be an object"];
  for (const key of Object.keys(se)) {
    if (!["kind", "subjects", "families", "flags"].includes(key)) problems.push(`syntheticEvidence: unknown field ${key}`);
  }
  if (se.kind !== SYNTHETIC_EVIDENCE_KIND) problems.push(`syntheticEvidence.kind must be "${SYNTHETIC_EVIDENCE_KIND}"`);
  for (const key of ["subjects", "families", "flags"]) {
    if (key in se && (typeof se[key] !== "object" || se[key] === null || Array.isArray(se[key]))) {
      problems.push(`syntheticEvidence.${key} must be an object of label -> score`);
    }
  }
  return problems;
}

/**
 * The single subject an item's expectation identifies, or null: the routed slug,
 * or the one candidate of `specialist_unavailable`.
 * @param {any} expected
 */
export function primarySubject(expected) {
  if (expected.outcome === "route") return expected.slug;
  if (expected.reason === "specialist_unavailable" && Array.isArray(expected.candidates) && expected.candidates.length === 1) {
    return expected.candidates[0];
  }
  return null;
}
