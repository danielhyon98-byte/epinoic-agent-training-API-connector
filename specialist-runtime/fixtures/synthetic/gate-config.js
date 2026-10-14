// SYNTHETIC TEST FIXTURE: gate configuration for offline tests only.
// These rules are invented to exercise pass and fail paths. They are NOT
// History's handoff/04 rules, and the codes are fake (from synthetic-bundle.txt).
// The pinned runGate refuses this config; only createOfflineTestRuntime runs it.

function freeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export const SYNTHETIC_SOURCES_VALUE = "none consulted (no retrieval in this session)";
export const SYNTHETIC_SOURCES_LINE = `Sources: ${SYNTHETIC_SOURCES_VALUE}`;

export const SYNTHETIC_GATE_CONFIG = freeze({
  schema: "epinoic.specialist-gate-config.v1",
  slug: "history",
  gateVersion: "history-gate/0.1.0",
  configVersion: "synthetic-offline-test/0.1.0",
  configStatus: "synthetic-offline-test",
  synthetic: true,
  label: "SYNTHETIC gate configuration for offline tests only. Not History's handoff/04 rules.",
  checks: {
    completeness: { status: "active" },
    "url-policy": { status: "active", policy: "forbid_all" },
    "internal-code-leakage": { status: "active", codes: ["HXR-101", "HXR-102", "HXR-215"] },
    "provisional-mark": { status: "active", labelPattern: { source: "\\bprovisional\\b", flags: "i" } },
    "sources-line": {
      status: "active",
      prefix: "Sources:",
      required: true,
      allowedValues: [SYNTHETIC_SOURCES_VALUE],
    },
  },
});
