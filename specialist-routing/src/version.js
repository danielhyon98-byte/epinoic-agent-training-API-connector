/**
 * Contract identifiers shared by every module in this package.
 * @module version
 */

/** Version of the routing contract in docs/handoff/specialist-routing.md. */
export const ROUTING_CONTRACT_VERSION = "epinoic.specialist-routing.v0.1.0";

/** Schema identifiers for every object this package reads or writes. */
export const SCHEMAS = Object.freeze({
  catalogue: "epinoic.routing-catalogue.v1",
  labelSet: "epinoic.routing-label-set.v1",
  evidence: "epinoic.routing-evidence.v1",
  policy: "epinoic.routing-policy.v1",
  result: "epinoic.routing-result.v1",
  capabilities: "epinoic.specialist-capabilities.v1",
});

/** Runtime contract versions whose capabilities object this router accepts. */
export const ACCEPTED_RUNTIME_CONTRACT_VERSIONS = Object.freeze([
  "epinoic.specialist-runtime.v0.1.0",
]);

/** Version of the proposed classification label set produced by buildLabelSet. */
export const LABEL_SET_VERSION = "routing-labels/0.1.0";

/** The four evidence flags, in their canonical order. */
export const FLAG_LABELS = Object.freeze([
  "out_of_scope",
  "mixed_request",
  "non_english_input",
  "needs_task_context",
]);

/** Marker every fixture-only policy must carry. */
export const FIXTURE_BRAND = "SYNTHETIC-FIXTURE-NOT-FOR-PRODUCTION";

/** Capabilities environment that only the runtime's offline test runtime produces. */
export const OFFLINE_TEST_ENVIRONMENT = "offline-test";
