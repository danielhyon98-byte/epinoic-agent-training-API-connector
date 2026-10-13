/**
 * Validation of the runtime's capabilities object
 * (`epinoic.specialist-capabilities.v1`, runtime contract section 9).
 * This package keeps no availability registry of its own.
 * @module capabilities
 */

import { validateCatalogue } from "./catalogue.js";
import { ACCEPTED_RUNTIME_CONTRACT_VERSIONS, SCHEMAS } from "./version.js";
import { ErrorList, HEX64_RE, checkKeys, isOpaqueString, isPlainObject } from "./util.js";

const TOP_KEYS = Object.freeze(["schema", "runtimeContractVersion", "manifestVersion", "environment", "entries"]);
const ENTRY_KEYS = Object.freeze(["slug", "available", "supportedModes", "gateVersion", "bundleSha256"]);

/**
 * Validate the object returned by the runtime's `getCapabilities({ environment })`.
 * Synchronous.
 *
 * Rejects an unknown `schema` or `runtimeContractVersion`, unknown or missing
 * fields, duplicate entry slugs, entry slugs absent from the catalogue, and
 * malformed entries. An entry with `available: true` must list at least one
 * supported mode, a gate version and a 64-hex bundle digest (fail-closed
 * consistency check). A catalogue subject with no entry is **not** an error:
 * selection treats it as not available.
 *
 * @param {unknown} capabilities
 * @param {{catalogue: object}} context
 * @returns {Readonly<{ok: boolean, errors: ReadonlyArray<{path: string, code: string, detail: string | null}>}>}
 */
export function validateCapabilities(capabilities, context) {
  const errors = new ErrorList();
  const catalogue = isPlainObject(context) ? context.catalogue : undefined;
  if (!validateCatalogue(catalogue).ok) {
    errors.add("context.catalogue", "catalogue_invalid", "a valid catalogue is required");
    return errors.result();
  }
  if (!isPlainObject(capabilities)) {
    errors.add("$", "type", "expected an object");
    return errors.result();
  }
  checkKeys(capabilities, TOP_KEYS, [], "$", errors);
  if (capabilities.schema !== SCHEMAS.capabilities) errors.add("$.schema", "schema_mismatch", String(capabilities.schema));
  if (!ACCEPTED_RUNTIME_CONTRACT_VERSIONS.includes(capabilities.runtimeContractVersion)) {
    errors.add("$.runtimeContractVersion", "unsupported_runtime_contract", String(capabilities.runtimeContractVersion));
  }
  if (!isOpaqueString(capabilities.manifestVersion)) errors.add("$.manifestVersion", "type", "expected a string");
  if (!isOpaqueString(capabilities.environment)) errors.add("$.environment", "type", "expected a string");
  if (!Array.isArray(capabilities.entries)) {
    errors.add("$.entries", "type", "expected an array");
    return errors.result();
  }
  const known = new Set(catalogue.subjects.map((s) => s.slug));
  const seen = new Set();
  capabilities.entries.forEach((entry, i) => {
    const path = `$.entries[${i}]`;
    if (!isPlainObject(entry)) {
      errors.add(path, "type", "expected an object");
      return;
    }
    checkKeys(entry, ENTRY_KEYS, [], path, errors);
    if (typeof entry.slug !== "string") errors.add(`${path}.slug`, "type", "expected a string");
    else if (!known.has(entry.slug)) errors.add(`${path}.slug`, "unknown_slug", entry.slug);
    else if (seen.has(entry.slug)) errors.add(`${path}.slug`, "duplicate_slug", entry.slug);
    else seen.add(entry.slug);
    if (typeof entry.available !== "boolean") errors.add(`${path}.available`, "type", "expected boolean");
    const modes = entry.supportedModes;
    if (!Array.isArray(modes) || !modes.every(isOpaqueString) || new Set(modes).size !== modes.length) {
      errors.add(`${path}.supportedModes`, "type", "expected an array of unique strings");
    }
    if (entry.gateVersion !== null && !isOpaqueString(entry.gateVersion)) {
      errors.add(`${path}.gateVersion`, "type", "expected a string or null");
    }
    if (entry.bundleSha256 !== null && (typeof entry.bundleSha256 !== "string" || !HEX64_RE.test(entry.bundleSha256))) {
      errors.add(`${path}.bundleSha256`, "type", "expected 64 lower-case hex or null");
    }
    if (entry.available === true) {
      if (!Array.isArray(modes) || modes.length === 0) errors.add(`${path}.supportedModes`, "available_without_mode", entry.slug);
      if (entry.gateVersion === null) errors.add(`${path}.gateVersion`, "available_without_gate", entry.slug);
      if (entry.bundleSha256 === null) errors.add(`${path}.bundleSha256`, "available_without_bundle", entry.slug);
    }
  });
  return errors.result();
}

/**
 * Availability lookup for capabilities that already passed validation.
 * A slug with no entry is not available.
 * @param {any} capabilities
 * @returns {(slug: string) => boolean}
 */
export function availabilityOf(capabilities) {
  const map = new Map(capabilities.entries.map((e) => [e.slug, e.available === true]));
  return (slug) => map.get(slug) === true;
}
