// SYNTHETIC TEST FIXTURE: shared inputs for the offline tests. All values are
// invented for tests. SYNTHETIC_LIMITS are NOT the website's limits.

import { createHash } from "node:crypto";
import { createOfflineTestRuntime } from "../../src/index.js";
import { BUNDLE } from "./history.synthetic.bundle.mjs";
import { SYNTHETIC_GATE_CONFIG, SYNTHETIC_SOURCES_LINE } from "./gate-config.js";
import { SYNTHETIC_MANIFEST } from "./manifest.js";

export { BUNDLE as SYNTHETIC_BUNDLE_MODULE };

export const SYNTHETIC_LIMITS = Object.freeze({
  maxMessageCodePoints: 4000,
  maxPriorTurns: 6,
  maxPriorTurnsUtf8Bytes: 16000,
  maxPreparedInputUtf8Bytes: 64000,
  maxAnswerUtf8Bytes: 8000,
  maxOutputTokens: 1024,
});

export const SYNTHETIC_TURN = Object.freeze({
  conversationId: "synthetic-conv-1",
  turnId: "synthetic-turn-7",
  turnVersion: 3,
  attemptId: "synthetic-attempt-2",
});

export const USER_MESSAGE = "How far did the Treaty of Versailles destabilise Germany in the 1920s?";

export const GOOD_ANSWER = [
  "The Treaty of Versailles (1919) imposed reparations and territorial losses on Germany.",
  "Historians still debate how far it, rather than the 1923 hyperinflation, explains later instability.",
  SYNTHETIC_SOURCES_LINE,
].join("\n");

export const CLARIFYING_ANSWER = [
  "Which paper is this for, Paper 1 or Paper 2, and are you taking SL or HL?",
  SYNTHETIC_SOURCES_LINE,
].join("\n");

/** Offline runtime over the synthetic manifest and gate config. */
export function offlineRuntime(gateConfig = SYNTHETIC_GATE_CONFIG, manifest = SYNTHETIC_MANIFEST) {
  return createOfflineTestRuntime({ manifest, gateConfigs: { history: gateConfig } });
}

/** VerifiedBundle for the synthetic history fixture. */
export function loadSyntheticBundle(runtime = offlineRuntime()) {
  return runtime.loadPinnedBundle({ slug: "history", bundleModule: BUNDLE, environment: "offline-test" });
}

/** Full runSpecialistTurn input with synthetic defaults. */
export function turnInput(bundle, authorizedGenerate, overrides = {}) {
  return {
    slug: "history",
    mode: "pilot-single-turn-no-tools",
    environment: "offline-test",
    bundle,
    message: USER_MESSAGE,
    priorTurns: [],
    limits: SYNTHETIC_LIMITS,
    turn: SYNTHETIC_TURN,
    authorizedGenerate,
    ...overrides,
  };
}

/** prepareTurn input with synthetic defaults. */
export function prepareInput(bundle, overrides = {}) {
  return {
    slug: "history",
    mode: "pilot-single-turn-no-tools",
    environment: "offline-test",
    bundle,
    message: USER_MESSAGE,
    priorTurns: [],
    limits: SYNTHETIC_LIMITS,
    ...overrides,
  };
}

export function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * A bundle-module object for arbitrary bytes, with the synthetic provenance.
 * @param {Uint8Array} bytes
 * @param {object} [overrides]
 */
export function moduleForBytes(bytes, overrides = {}) {
  return {
    schema: "epinoic.specialist-bundle-module.v1",
    slug: "history",
    sourceRepo: "synthetic/offline-fixture",
    sourceCommit: "synthetic-no-commit",
    bundlePath: "fixtures/synthetic/synthetic-bundle.txt",
    kbVersion: "synthetic-kb-0",
    sha256: sha256Hex(bytes),
    byteLength: bytes.length,
    base64: Buffer.from(bytes).toString("base64"),
    ...overrides,
  };
}
