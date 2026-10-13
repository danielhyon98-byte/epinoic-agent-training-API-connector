/**
 * Bundle module verification (contract section 5).
 * @module bundle
 */

import { SCHEMAS, SHA256_HEX_PATTERN } from "./constants.js";
import { resolveEnabledEntry } from "./context.js";
import { RuntimeIntegrityError } from "./errors.js";
import { sha256Hex } from "./sha256.js";
import { decodeBase64Strict, decodeUtf8Strict, isWellFormed, utf8Encode } from "./text.js";
import { deepFreeze, hasExactKeys, isObjectRecord, isPlainObject, unknownKeys } from "./util.js";

const MODULE_KEYS = Object.freeze([
  "schema", "slug", "sourceRepo", "sourceCommit", "bundlePath", "kbVersion", "sha256", "byteLength", "base64",
]);
const VERIFIED_KEYS = Object.freeze([
  "schema", "slug", "environment", "manifestVersion", "sourceRepo", "sourceCommit", "bundlePath", "kbVersion",
  "sha256", "byteLength", "text",
]);
const LOAD_KEYS = Object.freeze(["slug", "bundleModule", "environment"]);

/**
 * @typedef {Readonly<{
 *   schema: "epinoic.verified-bundle.v1",
 *   slug: string, environment: string, manifestVersion: string,
 *   sourceRepo: string, sourceCommit: string, bundlePath: string, kbVersion: string,
 *   sha256: string, byteLength: number,
 *   text: string
 * }>} VerifiedBundle
 */

/** Accept either the `BUNDLE` export or the module namespace `{ BUNDLE }`. */
function unwrapModule(bundleModule) {
  if (isObjectRecord(bundleModule) && bundleModule.schema === undefined && "BUNDLE" in bundleModule) {
    return bundleModule.BUNDLE;
  }
  return bundleModule;
}

function isModuleShape(mod) {
  return (
    isPlainObject(mod) &&
    hasExactKeys(mod, MODULE_KEYS) &&
    mod.schema === SCHEMAS.bundleModule &&
    typeof mod.slug === "string" &&
    typeof mod.sha256 === "string" &&
    SHA256_HEX_PATTERN.test(mod.sha256) &&
    Number.isSafeInteger(mod.byteLength) &&
    mod.byteLength >= 0 &&
    typeof mod.base64 === "string"
  );
}

function provenanceMatches(source, entry) {
  return (
    source.sourceRepo === entry.source.repo &&
    source.sourceCommit === entry.source.commit &&
    source.bundlePath === entry.source.bundlePath &&
    source.kbVersion === entry.kbVersion
  );
}

/**
 * Decode and verify an exported bundle module against a context's manifest.
 * Throws RuntimeIntegrityError with one of: input_invalid, unknown_input_field,
 * environment_not_supported, manifest_invalid, unknown_slug, slug_not_enabled,
 * bundle_module_invalid, bundle_slug_mismatch, bundle_provenance_mismatch,
 * bundle_checksum_mismatch, invalid_base64, bundle_empty,
 * bundle_length_mismatch, invalid_utf8.
 * @param {import("./context.js").RuntimeContext} ctx
 * @param {unknown} args
 * @returns {Promise<VerifiedBundle>}
 */
export async function verifyBundleModule(ctx, args) {
  if (!isPlainObject(args)) throw new RuntimeIntegrityError("input_invalid");
  if (unknownKeys(args, LOAD_KEYS).length > 0) throw new RuntimeIntegrityError("unknown_input_field");
  const { slug, environment } = args;
  const resolved = resolveEnabledEntry(ctx, environment, slug);
  if (resolved.code !== null) throw new RuntimeIntegrityError(resolved.code);
  const entry = resolved.entry;

  const mod = unwrapModule(args.bundleModule);
  if (!isModuleShape(mod)) throw new RuntimeIntegrityError("bundle_module_invalid");
  if (mod.slug !== slug || entry.slug !== slug) throw new RuntimeIntegrityError("bundle_slug_mismatch");
  if (!provenanceMatches(mod, entry)) throw new RuntimeIntegrityError("bundle_provenance_mismatch");
  if (mod.sha256 !== entry.bundleSha256) throw new RuntimeIntegrityError("bundle_checksum_mismatch");

  const bytes = decodeBase64Strict(mod.base64);
  if (bytes === null) throw new RuntimeIntegrityError("invalid_base64");
  if (bytes.length === 0) throw new RuntimeIntegrityError("bundle_empty");
  if (bytes.length !== mod.byteLength) throw new RuntimeIntegrityError("bundle_length_mismatch");
  const actual = await sha256Hex(bytes);
  if (actual !== mod.sha256 || actual !== entry.bundleSha256) throw new RuntimeIntegrityError("bundle_checksum_mismatch");

  let text;
  try {
    text = decodeUtf8Strict(bytes);
  } catch {
    throw new RuntimeIntegrityError("invalid_utf8");
  }
  return deepFreeze({
    schema: SCHEMAS.verifiedBundle,
    slug,
    environment,
    manifestVersion: ctx.manifest.manifestVersion,
    sourceRepo: entry.source.repo,
    sourceCommit: entry.source.commit,
    bundlePath: entry.source.bundlePath,
    kbVersion: entry.kbVersion,
    sha256: actual,
    byteLength: bytes.length,
    text,
  });
}

/**
 * Re-verify a VerifiedBundle before it is used in a request: shape, binding to
 * this slug, environment and manifest version, provenance, and SHA-256 over the
 * UTF-8 bytes of its text against the bundle and the manifest. Returns null
 * when intact, otherwise a precondition code.
 * @param {import("./context.js").RuntimeContext} ctx
 * @param {unknown} bundle
 * @param {any} entry
 * @param {string} environment
 * @returns {Promise<string | null>}
 */
export async function checkVerifiedBundle(ctx, bundle, entry, environment) {
  if (!isPlainObject(bundle) || !hasExactKeys(bundle, VERIFIED_KEYS) || bundle.schema !== SCHEMAS.verifiedBundle) {
    return "bundle_not_verified";
  }
  if (bundle.slug !== entry.slug || bundle.environment !== environment || bundle.manifestVersion !== ctx.manifest.manifestVersion) {
    return "bundle_not_verified";
  }
  if (!provenanceMatches(bundle, entry)) return "bundle_provenance_mismatch";
  if (typeof bundle.text !== "string" || !isWellFormed(bundle.text)) return "bundle_integrity_failed";
  const bytes = utf8Encode(bundle.text);
  if (bytes.length !== bundle.byteLength) return "bundle_integrity_failed";
  const sha = await sha256Hex(bytes);
  if (sha !== bundle.sha256 || sha !== entry.bundleSha256) return "bundle_integrity_failed";
  return null;
}
