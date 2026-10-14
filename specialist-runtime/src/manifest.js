/**
 * The pinned runtime manifest and its invariants (contract section 4).
 * @module manifest
 */

import {
  COMMIT_PATTERN,
  OFFLINE_TEST_ENVIRONMENT,
  PILOT_MODE,
  SCHEMAS,
  SHA256_HEX_PATTERN,
  SLUG_PATTERN,
} from "./constants.js";
import { deepFreeze, isNonEmptyString, isPlainObject, isSafeRelativePath, unknownKeys } from "./util.js";

/**
 * The authoritative runtime manifest. Source pins are PENDING: they can be set
 * only by a reviewed change after a real-checkout export (README, "Completing
 * the slice against the real source"). Nothing is enabled.
 */
export const RUNTIME_MANIFEST = deepFreeze({
  schema: SCHEMAS.manifest,
  manifestVersion: "2026-10-13.0",
  sourceStatus: "unverified-source",
  entries: [
    {
      slug: "history",
      displayName: "History",
      source: {
        repo: "Epinoic-AI/Epinoic-Agent-Training",
        commit: null,
        bundlePath: null,
      },
      kbVersion: null,
      bundleSha256: "a5b8a2da6feb447ea06d9e38946ba50f71b14495e517169b5b3a418530119240",
      bundleSha256Status: "reported-by-audit-02-not-verified",
      supportedModes: [PILOT_MODE],
      gateVersion: "history-gate/0.1.0",
      libraryManifestVersion: null,
      productionEnabled: false,
      stagingPilotEnabled: false,
    },
  ],
});

/**
 * Website limits as reported in the 13 October coordination handoff, for
 * reference only. They were NOT read from website source (unreachable). They
 * are NOT defaults: every call must pass `limits` from website 01/03
 * configuration, and the runtime never reads this object. They are different
 * bounds and do not map one-to-one onto the runtime's `limits` fields.
 */
export const REPORTED_WEBSITE_LIMITS = deepFreeze({
  schema: SCHEMAS.reportedLimits,
  status: "reported-in-handoff-not-read-from-website-source",
  usage: "reference-only-never-defaults",
  note:
    "Copied from the coordination handoff (website main 2cd31820…). Message and body limits, " +
    "the stored result cap and the turn deadline are separate bounds. Website 01 supplies the real " +
    "values through `limits`; an incomplete or oversize answer is never truncated to fit.",
  values: {
    messageMaxCodePoints: 12000,
    requestBodyMaxBytes: 32768,
    storedResultMaxBytes: 65536,
    turnDeadlineSeconds: 180,
  },
});

/** Validation profiles. "runtime" is the pinned manifest; "offline-test" is a synthetic fixture manifest. */
export const MANIFEST_PROFILES = Object.freeze({ runtime: "runtime", offlineTest: OFFLINE_TEST_ENVIRONMENT });

const RUNTIME_TOP_KEYS = Object.freeze(["schema", "manifestVersion", "sourceStatus", "entries"]);
const OFFLINE_TOP_KEYS = Object.freeze(["schema", "manifestVersion", "sourceStatus", "environment", "label", "entries"]);
const ENTRY_KEYS = Object.freeze([
  "slug",
  "displayName",
  "source",
  "kbVersion",
  "bundleSha256",
  "bundleSha256Status",
  "supportedModes",
  "gateVersion",
  "libraryManifestVersion",
  "productionEnabled",
  "stagingPilotEnabled",
]);
const OFFLINE_ENTRY_KEYS = Object.freeze([...ENTRY_KEYS, "offlineTestEnabled"]);
const SOURCE_KEYS = Object.freeze(["repo", "commit", "bundlePath"]);
const STATUS_TOKEN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Validate a manifest under a profile. Returns a frozen
 * `{ schema, profile, ok, errors: [{ path, code }] }`.
 * @param {unknown} manifest
 * @param {"runtime" | "offline-test"} profile
 */
export function checkManifest(manifest, profile) {
  /** @type {{ path: string, code: string }[]} */
  const errors = [];
  const add = (path, code) => errors.push({ path, code });
  const offline = profile === MANIFEST_PROFILES.offlineTest;

  if (profile !== MANIFEST_PROFILES.runtime && !offline) {
    add("$", "profile_invalid");
  } else if (!isPlainObject(manifest)) {
    add("$", "manifest_not_object");
  } else {
    for (const k of unknownKeys(manifest, offline ? OFFLINE_TOP_KEYS : RUNTIME_TOP_KEYS)) add(`$.${k}`, "unknown_field");
    if (manifest.schema !== SCHEMAS.manifest) add("$.schema", "schema_invalid");
    if (!isNonEmptyString(manifest.manifestVersion)) add("$.manifestVersion", "manifest_version_invalid");
    if (offline) {
      if (manifest.sourceStatus !== "synthetic-offline-test") add("$.sourceStatus", "source_status_invalid");
      if (manifest.environment !== OFFLINE_TEST_ENVIRONMENT) add("$.environment", "environment_invalid");
      if (typeof manifest.label !== "string" || !manifest.label.includes("SYNTHETIC")) add("$.label", "synthetic_label_missing");
    } else if (manifest.sourceStatus !== "unverified-source" && manifest.sourceStatus !== "verified") {
      add("$.sourceStatus", "source_status_invalid");
    }
    if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) {
      add("$.entries", "entries_invalid");
    } else {
      const seen = new Set();
      manifest.entries.forEach((entry, i) => checkEntry(entry, `$.entries[${i}]`, { offline, manifest, seen, add }));
    }
  }
  return deepFreeze({ schema: SCHEMAS.manifestValidation, profile: String(profile), ok: errors.length === 0, errors });
}

function checkEntry(entry, path, { offline, manifest, seen, add }) {
  if (!isPlainObject(entry)) {
    add(path, "entry_not_object");
    return;
  }
  for (const k of unknownKeys(entry, offline ? OFFLINE_ENTRY_KEYS : ENTRY_KEYS)) add(`${path}.${k}`, "unknown_field");

  if (typeof entry.slug !== "string" || entry.slug.length > 64 || !SLUG_PATTERN.test(entry.slug)) {
    add(`${path}.slug`, "slug_invalid");
  } else if (seen.has(entry.slug)) {
    add(`${path}.slug`, "slug_duplicate");
  } else {
    seen.add(entry.slug);
  }
  if (!isNonEmptyString(entry.displayName)) add(`${path}.displayName`, "display_name_invalid");

  const source = entry.source;
  let pinsComplete = false;
  if (!isPlainObject(source) || unknownKeys(source, SOURCE_KEYS).length > 0) {
    add(`${path}.source`, "source_invalid");
  } else {
    if (!isNonEmptyString(source.repo)) add(`${path}.source.repo`, "source_repo_invalid");
    const commitOk = offline ? isNonEmptyString(source.commit) : typeof source.commit === "string" && COMMIT_PATTERN.test(source.commit);
    if (source.commit !== null && !commitOk) add(`${path}.source.commit`, "source_commit_invalid");
    if (source.bundlePath !== null && !isSafeRelativePath(source.bundlePath)) add(`${path}.source.bundlePath`, "bundle_path_invalid");
    pinsComplete = commitOk && isSafeRelativePath(source.bundlePath) && isNonEmptyString(entry.kbVersion);
  }
  if (entry.kbVersion !== null && !isNonEmptyString(entry.kbVersion)) add(`${path}.kbVersion`, "kb_version_invalid");
  if (typeof entry.bundleSha256 !== "string" || !SHA256_HEX_PATTERN.test(entry.bundleSha256)) {
    add(`${path}.bundleSha256`, "bundle_sha256_invalid");
  }
  const status = entry.bundleSha256Status;
  if (offline ? status !== "synthetic-fixture" : typeof status !== "string" || !STATUS_TOKEN.test(status) || status === "synthetic-fixture") {
    add(`${path}.bundleSha256Status`, "bundle_sha256_status_invalid");
  }
  const modes = entry.supportedModes;
  if (!Array.isArray(modes) || modes.length === 0 || modes.some((m) => m !== PILOT_MODE) || new Set(modes).size !== modes.length) {
    add(`${path}.supportedModes`, "supported_modes_invalid");
  }
  if (!isNonEmptyString(entry.gateVersion)) add(`${path}.gateVersion`, "gate_version_invalid");
  if (entry.libraryManifestVersion !== null) add(`${path}.libraryManifestVersion`, "library_manifest_not_supported");

  if (typeof entry.productionEnabled !== "boolean") add(`${path}.productionEnabled`, "enablement_flag_invalid");
  else if (entry.productionEnabled) add(`${path}.productionEnabled`, "production_enablement_refused");

  if (typeof entry.stagingPilotEnabled !== "boolean") {
    add(`${path}.stagingPilotEnabled`, "enablement_flag_invalid");
  } else if (entry.stagingPilotEnabled) {
    if (offline) add(`${path}.stagingPilotEnabled`, "offline_manifest_cannot_enable_real_environment");
    else if (!pinsComplete || status !== "verified" || manifest.sourceStatus !== "verified") {
      add(`${path}.stagingPilotEnabled`, "enablement_requires_verified_pins");
    }
  }
  if (offline) {
    if (typeof entry.offlineTestEnabled !== "boolean") add(`${path}.offlineTestEnabled`, "enablement_flag_invalid");
    else if (entry.offlineTestEnabled && !pinsComplete) add(`${path}.offlineTestEnabled`, "enablement_requires_pins");
  }
}

/**
 * Structural and enablement invariants of a runtime manifest (contract section 4).
 * Refuses: duplicate or non-kebab slugs; enablement while any pin is pending or
 * the checksum is not "verified"; `productionEnabled: true` under any
 * conditions; a non-null `libraryManifestVersion`; unknown fields.
 *
 * @param {unknown} manifest
 * @returns {{ schema: string, profile: string, ok: boolean, errors: ReadonlyArray<{ path: string, code: string }> }}
 */
export function validateManifest(manifest) {
  return checkManifest(manifest, MANIFEST_PROFILES.runtime);
}

/**
 * Find an entry by slug in a manifest that has already been validated.
 * @param {any} manifest
 * @param {unknown} slug
 */
export function findEntry(manifest, slug) {
  if (typeof slug !== "string") return undefined;
  return manifest.entries.find((e) => e.slug === slug);
}

/**
 * Whether a validated entry is enabled for an environment under a profile.
 * Production is never enabled by this package version.
 * @param {any} entry
 * @param {string} environment
 * @param {"runtime" | "offline-test"} profile
 */
export function isEntryEnabled(entry, environment, profile) {
  if (profile === MANIFEST_PROFILES.offlineTest) {
    return environment === OFFLINE_TEST_ENVIRONMENT && entry.offlineTestEnabled === true;
  }
  if (environment === "staging-pilot") return entry.stagingPilotEnabled === true;
  // "production": refused by validateManifest whenever productionEnabled is true,
  // and hard-disabled here as a second guard.
  return false;
}
