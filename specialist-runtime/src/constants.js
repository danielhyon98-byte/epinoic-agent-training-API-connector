/**
 * Fixed identifiers of the specialist runtime contract
 * (docs/handoff/website-specialist-integration.md, contract v0.1.0).
 * @module constants
 */

/** Contract version every result and capability object carries. */
export const RUNTIME_CONTRACT_VERSION = "epinoic.specialist-runtime.v0.1.0";

/** The only supported mode: one turn, no tools, no retrieval. */
export const PILOT_MODE = "pilot-single-turn-no-tools";

/** Schema identifiers used by this package. */
export const SCHEMAS = Object.freeze({
  manifest: "epinoic.specialist-runtime-manifest.v1",
  bundleModule: "epinoic.specialist-bundle-module.v1",
  verifiedBundle: "epinoic.verified-bundle.v1",
  preparedRequest: "epinoic.prepared-specialist-request.v1",
  turnResult: "epinoic.specialist-turn-result.v1",
  capabilities: "epinoic.specialist-capabilities.v1",
  gateConfig: "epinoic.specialist-gate-config.v1",
  turnLog: "epinoic.specialist-turn-log.v1",
  reportedLimits: "epinoic.reported-website-limits.v1",
  manifestValidation: "epinoic.specialist-manifest-validation.v1",
});

/** Environments the pinned runtime accepts. "offline-test" is refused here. */
export const RUNTIME_ENVIRONMENTS = Object.freeze(["production", "staging-pilot"]);

/** The only environment the offline test runtime accepts. */
export const OFFLINE_TEST_ENVIRONMENT = "offline-test";

/** Closed set of normalised finish reasons the callback may report. */
export const FINISH_REASONS = Object.freeze(["stop", "length", "refusal", "content_filter", "unknown"]);

/** Closed set of turn outcomes. */
export const OUTCOMES = Object.freeze([
  "answer",
  "precondition_failed",
  "declined",
  "cancelled",
  "failed",
  "refusal",
  "incomplete",
  "oversize",
  "gate_failed",
  "gate_unverifiable",
]);

export const GATE_KIND = "deterministic-format-policy";

export const GATE_DISCLAIMER =
  "Deterministic format and policy heuristics. Not factual, academic or formal verification.";

/** Canonical slug syntax: lowercase kebab-case. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Lowercase SHA-256 hex digest. */
export const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;

/** Full 40-hex git commit id. Short ids are refused. */
export const COMMIT_PATTERN = /^[0-9a-f]{40}$/;

/** Code-like strings accepted from the callback (decline reasons, error codes). */
export const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
