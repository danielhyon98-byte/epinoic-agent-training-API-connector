/**
 * Log-safe projection of a SpecialistTurnResult (contract section 3).
 * Built from an allowlist of fields. Never included: answer text, prepared
 * messages, user text, providerEvidence (only whether it was present).
 * Strings from the callback or the website (failure codes, usage strings,
 * turn ids) are scrubbed: anything key-like becomes "[redacted]".
 * @module redact
 */

import { GATE_KIND, OUTCOMES, RUNTIME_CONTRACT_VERSION, SCHEMAS } from "./constants.js";
import { deepFreeze, isObjectRecord } from "./util.js";

const REDACTED = "[redacted]";

const KEY_LIKE = Object.freeze([
  /sk-[A-Za-z0-9_-]{6,}/, // OpenAI / Anthropic style secret keys
  /\bBearer\s+\S+/i,
  /\bBasic\s+[A-Za-z0-9+/=]{8,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{16,}/,
  /\bxox[abprs]-[A-Za-z0-9-]{8,}/,
  /\bAIza[0-9A-Za-z_-]{20,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/, // JWT
]);

const SECRET_KEY_NAME = /api[-_]?key|secret|passw(?:or)?d|authori[sz]ation|bearer|credential|private[-_]?key|access[-_]?token|refresh[-_]?token|session[-_]?token|id[-_]?token|cookie|signature/i;

/** High-entropy run: 32+ token characters mixing upper case, lower case and digits. */
function looksHighEntropy(s) {
  for (const run of s.match(/[A-Za-z0-9_\-+/=]{32,}/g) ?? []) {
    if (/[A-Z]/.test(run) && /[a-z]/.test(run) && /[0-9]/.test(run)) return true;
  }
  return false;
}

/**
 * True when a string looks like a credential or secret.
 * @param {string} s
 */
export function isKeyLike(s) {
  return KEY_LIKE.some((re) => re.test(s)) || looksHighEntropy(s);
}

function scrubString(s) {
  if (typeof s !== "string") return s;
  return s.length > 256 || isKeyLike(s) ? REDACTED : s;
}

function scrubScalar(v) {
  if (v === null || typeof v === "boolean") return v;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") return scrubString(v);
  return null;
}

/** Bounded, scrubbed deep copy of a JSON-like value (for usage). */
function scrubValue(v, depth = 0) {
  if (!isObjectRecord(v) && !Array.isArray(v)) return scrubScalar(v);
  if (depth >= 5) return REDACTED;
  if (Array.isArray(v)) return v.slice(0, 64).map((x) => scrubValue(x, depth + 1));
  const out = {};
  for (const key of Object.keys(v).slice(0, 64)) {
    const safeKey = isKeyLike(key) ? REDACTED : key;
    out[safeKey] = SECRET_KEY_NAME.test(key) ? REDACTED : scrubValue(v[key], depth + 1);
  }
  return out;
}

function pick(obj, keys) {
  const src = isObjectRecord(obj) ? obj : {};
  const out = {};
  for (const k of keys) out[k] = scrubScalar(src[k]);
  return out;
}

/**
 * Log-safe projection of a turn result. Accepts anything; unknown input
 * yields a projection of nulls.
 * @param {unknown} result
 * @returns {Readonly<Record<string, unknown>>}
 */
export function redactForLog(result) {
  const r = isObjectRecord(result) ? result : {};
  const gate = isObjectRecord(r.gate) ? r.gate : {};
  const checks = Array.isArray(gate.checks) ? gate.checks : [];
  return deepFreeze({
    schema: SCHEMAS.turnLog,
    contractVersion: RUNTIME_CONTRACT_VERSION,
    resultSchema: r.schema === SCHEMAS.turnResult ? r.schema : null,
    outcome: OUTCOMES.includes(r.outcome) ? r.outcome : null,
    answerPresent: typeof r.answer === "string",
    failure: isObjectRecord(r.failure) ? pick(r.failure, ["stage", "code"]) : null,
    completion: pick(r.completion, ["finishReason", "outputUtf8Bytes"]),
    gate: {
      kind: GATE_KIND,
      version: scrubScalar(gate.version),
      configVersion: scrubScalar(gate.configVersion),
      status: scrubScalar(gate.status),
      checks: checks.slice(0, 16).map((c) => pick(c, ["id", "status", "code"])),
    },
    usageStatus: r.usageStatus === "reported" ? "reported" : "unknown",
    usage: r.usage === null || r.usage === undefined ? null : scrubValue(r.usage),
    providerEvidencePresent: r.providerEvidence !== null && r.providerEvidence !== undefined,
    dispatch: pick(r.dispatch, ["callbackInvocations", "authorization"]),
    provenance: {
      ...pick(r.provenance, [
        "manifestVersion", "slug", "sourceRepo", "sourceCommit", "kbVersion", "bundleSha256", "gateVersion",
        "gateConfigVersion", "runtimeNoticeVersion", "mode",
      ]),
      libraryManifestVersion: null,
      toolsRun: [],
      retrieval: null,
      claims: null,
    },
    turn: pick(r.turn, ["conversationId", "turnId", "turnVersion", "attemptId"]),
  });
}
