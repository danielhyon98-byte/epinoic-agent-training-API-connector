// SYNTHETIC TEST FIXTURE: offline-test manifest. Not the runtime manifest.
// It is accepted only by createOfflineTestRuntime, which accepts only the
// "offline-test" environment. Its bundleSha256 is the SHA-256 of
// synthetic-bundle.txt (checked independently in test/fixtures.test.js).

function freeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export const SYNTHETIC_BUNDLE_SHA256 = "a8ec4dd5369633a03f91c735c3fca2365219a7e79e82f17d884db995d1322efe";

export const SYNTHETIC_MANIFEST = freeze({
  schema: "epinoic.specialist-runtime-manifest.v1",
  manifestVersion: "synthetic-offline-test.0",
  sourceStatus: "synthetic-offline-test",
  environment: "offline-test",
  label: "SYNTHETIC manifest for offline tests only. Not the Epinoic runtime manifest.",
  entries: [
    {
      slug: "history",
      displayName: "History (SYNTHETIC fixture)",
      source: {
        repo: "synthetic/offline-fixture",
        commit: "synthetic-no-commit",
        bundlePath: "fixtures/synthetic/synthetic-bundle.txt",
      },
      kbVersion: "synthetic-kb-0",
      bundleSha256: SYNTHETIC_BUNDLE_SHA256,
      bundleSha256Status: "synthetic-fixture",
      supportedModes: ["pilot-single-turn-no-tools"],
      gateVersion: "history-gate/0.1.0",
      libraryManifestVersion: null,
      productionEnabled: false,
      stagingPilotEnabled: false,
      offlineTestEnabled: true,
    },
    {
      slug: "synthetic-disabled",
      displayName: "Disabled entry (SYNTHETIC fixture)",
      source: { repo: "synthetic/offline-fixture", commit: null, bundlePath: null },
      kbVersion: null,
      bundleSha256: "0000000000000000000000000000000000000000000000000000000000000000",
      bundleSha256Status: "synthetic-fixture",
      supportedModes: ["pilot-single-turn-no-tools"],
      gateVersion: "synthetic-gate/0.0.0",
      libraryManifestVersion: null,
      productionEnabled: false,
      stagingPilotEnabled: false,
      offlineTestEnabled: false,
    },
  ],
});

/**
 * A copy of the synthetic manifest with the history entry changed.
 * @param {object} entryOverrides
 * @param {object} [topOverrides]
 */
export function syntheticManifestWith(entryOverrides, topOverrides = {}) {
  const copy = JSON.parse(JSON.stringify(SYNTHETIC_MANIFEST));
  Object.assign(copy.entries[0], entryOverrides);
  return Object.assign(copy, topOverrides);
}
