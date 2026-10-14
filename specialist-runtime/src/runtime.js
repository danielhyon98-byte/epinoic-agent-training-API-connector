/**
 * The pinned runtime (RUNTIME_MANIFEST + HISTORY_GATE_CONFIG; environments
 * "production" and "staging-pilot") and the separate offline test runtime
 * (synthetic fixtures; environment "offline-test" only).
 * @module runtime
 */

import { capabilitiesWith } from "./capabilities.js";
import { OFFLINE_TEST_ENVIRONMENT, RUNTIME_ENVIRONMENTS } from "./constants.js";
import { createContext } from "./context.js";
import { RuntimeIntegrityError } from "./errors.js";
import { runGateWith } from "./gate/engine.js";
import { validateGateConfig } from "./gate/config.js";
import { HISTORY_GATE_CONFIG } from "./gate/history-config.js";
import { MANIFEST_PROFILES, RUNTIME_MANIFEST, checkManifest } from "./manifest.js";
import { prepareTurnWith } from "./prepare.js";
import { runTurnWith } from "./bridge.js";
import { verifyBundleModule } from "./bundle.js";
import { deepFreeze, isPlainObject, unknownKeys } from "./util.js";

function slugMap(record) {
  return Object.freeze(Object.assign(Object.create(null), record));
}

const PINNED = createContext({
  profile: MANIFEST_PROFILES.runtime,
  environments: RUNTIME_ENVIRONMENTS,
  manifest: RUNTIME_MANIFEST,
  gateConfigs: slugMap({ history: HISTORY_GATE_CONFIG }),
  acceptSyntheticGate: false,
});

/**
 * Decode and SHA-256-verify an exported bundle module against the pinned
 * manifest. Returns a frozen VerifiedBundle or throws RuntimeIntegrityError.
 * Today every pinned entry is disabled, so this always throws
 * ("slug_not_enabled" for history).
 * @param {{ slug: string, bundleModule: unknown, environment: string }} args
 * @returns {Promise<import("./bundle.js").VerifiedBundle>}
 */
export function loadPinnedBundle(args) {
  return verifyBundleModule(PINNED, args);
}

/**
 * Capabilities for the router under the pinned manifest.
 * @param {{ environment: string }} args
 * @returns {import("./capabilities.js").Capabilities}
 */
export function getCapabilities(args) {
  return capabilitiesWith(PINNED, args);
}

/**
 * Build the bounded PreparedRequest under the pinned manifest.
 * @param {{ slug: string, mode: string, environment: string, bundle: import("./bundle.js").VerifiedBundle,
 *   message: string, priorTurns?: Array<{ role: "user" | "assistant", text: string }>, limits: object }} input
 * @returns {Promise<{ ok: true, request: import("./prepare.js").PreparedRequest } | { ok: false, failure: { stage: "precondition", code: string } }>}
 */
export function prepareTurn(input) {
  return prepareTurnWith(PINNED, input);
}

/**
 * Run one specialist turn under the pinned manifest. Never throws.
 * @param {{ slug: string, mode: string, environment: string, bundle: import("./bundle.js").VerifiedBundle,
 *   message: string, priorTurns?: Array<{ role: "user" | "assistant", text: string }>, limits: object,
 *   turn: { conversationId: string | number, turnId: string | number, turnVersion: string | number, attemptId: string | number },
 *   authorizedGenerate: (request: import("./prepare.js").PreparedRequest, options: { signal?: AbortSignal }) => Promise<unknown>,
 *   signal?: AbortSignal | null }} input
 * @returns {Promise<import("./result.js").SpecialistTurnResult>}
 */
export function runSpecialistTurn(input) {
  return runTurnWith(PINNED, input);
}

/**
 * Deterministic gate. Synthetic gate configurations are refused here (every
 * check "unsupported", code "synthetic_config_refused"); they run only
 * through createOfflineTestRuntime.
 * @param {{ slug: string, gateConfig: object, answerText: string, finishReason: string, userMessage?: string }} input
 * @returns {import("./gate/engine.js").GateResult}
 */
export function runGate(input) {
  return runGateWith(input, { acceptSynthetic: false });
}

function cloneFrozen(value) {
  try {
    return deepFreeze(JSON.parse(JSON.stringify(value)));
  } catch {
    return undefined;
  }
}

/**
 * Create a separate, explicit runtime for synthetic fixtures. It accepts only
 * `environment: "offline-test"`, a manifest that declares itself synthetic
 * (`sourceStatus: "synthetic-offline-test"`, `environment: "offline-test"`,
 * a "SYNTHETIC" label, no real-environment enablement), and gate
 * configurations keyed by slug (synthetic or pinned). Inputs are copied and
 * frozen. Throws RuntimeIntegrityError on invalid options.
 * @param {{ manifest: object, gateConfigs: Record<string, object> }} options
 */
export function createOfflineTestRuntime(options) {
  if (!isPlainObject(options) || unknownKeys(options, ["manifest", "gateConfigs"]).length > 0) {
    throw new RuntimeIntegrityError("offline_runtime_options_invalid");
  }
  const manifest = cloneFrozen(options.manifest);
  if (!checkManifest(manifest, MANIFEST_PROFILES.offlineTest).ok) throw new RuntimeIntegrityError("offline_manifest_invalid");
  if (!isPlainObject(options.gateConfigs)) throw new RuntimeIntegrityError("offline_gate_configs_invalid");
  const configs = {};
  for (const [slug, config] of Object.entries(options.gateConfigs)) {
    const copy = cloneFrozen(config);
    if (!validateGateConfig(copy).ok || copy.slug !== slug) throw new RuntimeIntegrityError("offline_gate_configs_invalid");
    configs[slug] = copy;
  }
  const ctx = createContext({
    profile: MANIFEST_PROFILES.offlineTest,
    environments: Object.freeze([OFFLINE_TEST_ENVIRONMENT]),
    manifest,
    gateConfigs: slugMap(configs),
    acceptSyntheticGate: true,
  });
  return Object.freeze({
    environment: OFFLINE_TEST_ENVIRONMENT,
    synthetic: true,
    manifest,
    /** @param {unknown} m */
    validateManifest: (m) => checkManifest(m, MANIFEST_PROFILES.offlineTest),
    /** @param {{ environment: string }} args */
    getCapabilities: (args) => capabilitiesWith(ctx, args),
    /** @param {{ slug: string, bundleModule: unknown, environment: string }} args */
    loadPinnedBundle: (args) => verifyBundleModule(ctx, args),
    /** @param {object} input */
    prepareTurn: (input) => prepareTurnWith(ctx, input),
    /** @param {object} input */
    runSpecialistTurn: (input) => runTurnWith(ctx, input),
    /** @param {object} input */
    runGate: (input) => runGateWith(input, { acceptSynthetic: true }),
  });
}
