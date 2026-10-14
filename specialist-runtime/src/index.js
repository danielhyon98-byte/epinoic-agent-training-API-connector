/**
 * @epinoic/specialist-runtime: public exports, exactly the table in
 * docs/handoff/website-specialist-integration.md section 3.
 *
 * Portable ES modules: only globalThis.crypto.subtle, TextEncoder/TextDecoder,
 * atob/btoa and AbortSignal. No filesystem, network, process, console or Node
 * built-ins. Enforced by tools/check-portable.mjs.
 * @module index
 */

export { RUNTIME_CONTRACT_VERSION, PILOT_MODE } from "./constants.js";
export { RUNTIME_MANIFEST, REPORTED_WEBSITE_LIMITS, validateManifest } from "./manifest.js";
export { HISTORY_GATE_CONFIG } from "./gate/history-config.js";
export { redactForLog } from "./redact.js";
export {
  getCapabilities,
  loadPinnedBundle,
  prepareTurn,
  runSpecialistTurn,
  runGate,
  createOfflineTestRuntime,
} from "./runtime.js";
