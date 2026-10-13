/**
 * Deterministic History format/policy gate (contract section 8). Each check
 * returns "pass", "fail" or "unsupported", never an assumed pass. Check
 * results carry codes only, never answer text.
 * @module gate/engine
 */

import { GATE_DISCLAIMER, GATE_KIND } from "../constants.js";
import { deepFreeze, isPlainObject } from "../util.js";
import { CHECK_IDS, validateGateConfig } from "./config.js";
import { completenessCheck } from "./checks/completeness.js";
import { internalCodeLeakageCheck } from "./checks/internal-code-leakage.js";
import { provisionalMarkCheck } from "./checks/provisional-mark.js";
import { sourcesLineCheck } from "./checks/sources-line.js";
import { urlPolicyCheck } from "./checks/url-policy.js";

const CHECKS = Object.freeze({
  completeness: completenessCheck,
  "url-policy": urlPolicyCheck,
  "internal-code-leakage": internalCodeLeakageCheck,
  "provisional-mark": provisionalMarkCheck,
  "sources-line": sourcesLineCheck,
});

/**
 * @typedef {{ id: string, status: "pass" | "fail" | "unsupported", code: string }} GateCheck
 * @typedef {{
 *   kind: "deterministic-format-policy",
 *   version: string | null,
 *   configVersion: string | null,
 *   status: "passed" | "failed" | "unverifiable" | "not_run",
 *   checks: GateCheck[],
 *   disclaimer: string
 * }} GateResult
 */

/**
 * A gate result for a turn whose gate did not run.
 * @param {string | null} version
 * @param {string | null} configVersion
 * @returns {GateResult}
 */
export function notRunGate(version, configVersion) {
  return deepFreeze({ kind: GATE_KIND, version, configVersion, status: "not_run", checks: [], disclaimer: GATE_DISCLAIMER });
}

function allUnsupported(version, configVersion, code) {
  return deepFreeze({
    kind: GATE_KIND,
    version,
    configVersion,
    status: "unverifiable",
    checks: CHECK_IDS.map((id) => ({ id, status: "unsupported", code })),
    disclaimer: GATE_DISCLAIMER,
  });
}

function aggregate(checks) {
  if (checks.some((c) => c.status === "fail")) return "failed";
  if (checks.some((c) => c.status === "unsupported")) return "unverifiable";
  return "passed";
}

/**
 * Run the gate.
 * @param {{ slug: unknown, gateConfig: unknown, answerText: unknown, finishReason: unknown, userMessage?: unknown }} input
 * @param {{ acceptSynthetic: boolean }} options Synthetic configs are accepted only by the offline test runtime.
 * @returns {GateResult}
 */
export function runGateWith(input, { acceptSynthetic }) {
  if (!isPlainObject(input)) return allUnsupported(null, null, "gate_input_invalid");
  const { slug, gateConfig, answerText, finishReason } = input;
  const userMessage = input.userMessage ?? "";
  if (!validateGateConfig(gateConfig).ok) return allUnsupported(null, null, "gate_config_invalid");
  const version = gateConfig.gateVersion;
  const configVersion = gateConfig.configVersion;
  if (gateConfig.synthetic && !acceptSynthetic) return allUnsupported(version, configVersion, "synthetic_config_refused");
  if (gateConfig.slug !== slug) return allUnsupported(version, configVersion, "gate_config_slug_mismatch");
  if (typeof answerText !== "string" || typeof userMessage !== "string") {
    return allUnsupported(version, configVersion, "gate_input_invalid");
  }

  const context = { answerText, finishReason, userMessage };
  const checks = CHECK_IDS.map((id) => {
    const cfg = gateConfig.checks[id];
    if (cfg.status !== "active") return { id, status: "unsupported", code: "rule_pending" };
    const { status, code } = CHECKS[id](cfg, context);
    return { id, status, code };
  });
  return deepFreeze({ kind: GATE_KIND, version, configVersion, status: aggregate(checks), checks, disclaimer: GATE_DISCLAIMER });
}
