/**
 * Gate configuration schema and validation. All five checks are required in
 * v0.1.0: a configuration can mark a check "pending" (it then reports
 * "unsupported") but cannot switch one off.
 * @module gate/config
 */

import { SCHEMAS, SLUG_PATTERN } from "../constants.js";
import { isNonEmptyString, isPlainObject, unknownKeys } from "../util.js";
import { isBenignToken } from "./benign.js";
import { containsUrl } from "./url-scan.js";

/** Check ids in the order they run and are reported. */
export const CHECK_IDS = Object.freeze([
  "completeness",
  "url-policy",
  "internal-code-leakage",
  "provisional-mark",
  "sources-line",
]);

const TOP_KEYS = Object.freeze([
  "schema",
  "slug",
  "gateVersion",
  "configVersion",
  "configStatus",
  "synthetic",
  "label",
  "checks",
]);

const ACTIVE_KEYS = Object.freeze({
  completeness: ["status", "note"],
  "url-policy": ["status", "policy", "note"],
  "internal-code-leakage": ["status", "codes", "note"],
  "provisional-mark": ["status", "labelPattern", "note"],
  "sources-line": ["status", "prefix", "required", "allowedValues", "mode", "itemTags", "note"],
});
const PENDING_KEYS = Object.freeze(["status", "pendingOn", "note"]);
const ALLOWED_REGEX_FLAGS = /^[imsu]*$/;

/**
 * Compile a `{ source, flags }` pattern. Returns null when it is invalid, uses
 * stateful flags (g, y) or matches the empty string.
 * @param {unknown} spec
 * @returns {RegExp | null}
 */
export function compilePattern(spec) {
  if (!isPlainObject(spec) || unknownKeys(spec, ["source", "flags"]).length > 0) return null;
  if (!isNonEmptyString(spec.source) || typeof spec.flags !== "string" || !ALLOWED_REGEX_FLAGS.test(spec.flags)) return null;
  let re;
  try {
    re = new RegExp(spec.source, spec.flags);
  } catch {
    return null;
  }
  return re.test("") ? null : re;
}

function checkActive(id, cfg, add) {
  const path = `$.checks.${id}`;
  switch (id) {
    case "url-policy":
      if (cfg.policy !== "forbid_all") add(`${path}.policy`, "url_policy_unsupported");
      break;
    case "internal-code-leakage": {
      const codes = cfg.codes;
      if (!Array.isArray(codes) || codes.length === 0) {
        add(`${path}.codes`, "codes_invalid");
        break;
      }
      const ok = codes.every((c) => isNonEmptyString(c) && c === c.trim() && c.length <= 128 && !/[\r\n]/.test(c));
      if (!ok) add(`${path}.codes`, "codes_invalid");
      else if (new Set(codes).size !== codes.length) add(`${path}.codes`, "codes_duplicate");
      else if (codes.some(isBenignToken)) add(`${path}.codes`, "code_is_benign_token");
      break;
    }
    case "provisional-mark":
      if (compilePattern(cfg.labelPattern) === null) add(`${path}.labelPattern`, "label_pattern_invalid");
      break;
    case "sources-line": {
      if (!isNonEmptyString(cfg.prefix) || /[\r\n]/.test(cfg.prefix)) add(`${path}.prefix`, "prefix_invalid");
      if (typeof cfg.required !== "boolean") add(`${path}.required`, "required_invalid");
      const values = cfg.allowedValues;
      const valuesOk =
        Array.isArray(values) &&
        values.length > 0 &&
        values.every((v) => isNonEmptyString(v) && v === v.trim() && !/[\r\n]/.test(v) && !containsUrl(v));
      if (!valuesOk) add(`${path}.allowedValues`, "allowed_values_invalid");
      const mode = cfg.mode ?? "exact";
      if (mode !== "exact" && mode !== "tagged-list") add(`${path}.mode`, "mode_invalid");
      if (mode === "tagged-list") {
        const tags = cfg.itemTags;
        const tagsOk =
          Array.isArray(tags) &&
          tags.length > 0 &&
          new Set(tags).size === tags.length &&
          tags.every((t) => isNonEmptyString(t) && t === t.trim() && !/[()\r\n;]/.test(t) && !containsUrl(t));
        if (!tagsOk) add(`${path}.itemTags`, "item_tags_invalid");
      } else if (cfg.itemTags !== undefined) {
        add(`${path}.itemTags`, "item_tags_need_tagged_list_mode");
      }
      break;
    }
    default:
      break;
  }
}

/**
 * Validate a gate configuration. Returns `{ ok, errors: [{ path, code }] }`.
 * @param {unknown} config
 */
export function validateGateConfig(config) {
  const errors = [];
  const add = (path, code) => errors.push({ path, code });
  if (!isPlainObject(config)) {
    add("$", "gate_config_not_object");
    return { ok: false, errors };
  }
  for (const k of unknownKeys(config, TOP_KEYS)) add(`$.${k}`, "unknown_field");
  if (config.schema !== SCHEMAS.gateConfig) add("$.schema", "schema_invalid");
  if (typeof config.slug !== "string" || !SLUG_PATTERN.test(config.slug)) add("$.slug", "slug_invalid");
  if (!isNonEmptyString(config.gateVersion)) add("$.gateVersion", "gate_version_invalid");
  if (!isNonEmptyString(config.configVersion)) add("$.configVersion", "config_version_invalid");
  if (!isNonEmptyString(config.configStatus)) add("$.configStatus", "config_status_invalid");
  if (typeof config.synthetic !== "boolean") add("$.synthetic", "synthetic_flag_invalid");
  if (config.synthetic === true && (typeof config.label !== "string" || !config.label.includes("SYNTHETIC"))) {
    add("$.label", "synthetic_label_missing");
  }
  if (config.label !== undefined && typeof config.label !== "string") add("$.label", "label_invalid");

  const checks = config.checks;
  if (!isPlainObject(checks)) {
    add("$.checks", "checks_invalid");
    return { ok: false, errors };
  }
  for (const k of unknownKeys(checks, CHECK_IDS)) add(`$.checks.${k}`, "unknown_check");
  for (const id of CHECK_IDS) {
    const cfg = checks[id];
    const path = `$.checks.${id}`;
    if (!isPlainObject(cfg)) {
      add(path, "check_missing");
      continue;
    }
    if (cfg.note !== undefined && typeof cfg.note !== "string") add(`${path}.note`, "note_invalid");
    if (cfg.status === "pending") {
      for (const k of unknownKeys(cfg, PENDING_KEYS)) add(`${path}.${k}`, "unknown_field");
      if (!isNonEmptyString(cfg.pendingOn)) add(`${path}.pendingOn`, "pending_on_invalid");
    } else if (cfg.status === "active") {
      for (const k of unknownKeys(cfg, ACTIVE_KEYS[id])) add(`${path}.${k}`, "unknown_field");
      checkActive(id, cfg, add);
    } else {
      add(`${path}.status`, "check_status_invalid");
    }
  }
  return { ok: errors.length === 0, errors };
}
