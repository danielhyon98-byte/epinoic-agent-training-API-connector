#!/usr/bin/env node
/**
 * Regenerate the derived parts of the synthetic fixtures (deterministic):
 * - fixtures/harness.synthetic.json  calibrationContext.datasets  <- eval split digests
 * - fixtures/policy.synthetic.json   calibration.fingerprint      <- fixture calibration identity
 * - fixtures/evidence.synthetic.json evidence identity and excerpt <- current catalogue / label set
 *
 *   node tools/build-fixtures.mjs          write the files
 *   node tools/build-fixtures.mjs --check  exit 1 if any file is stale (writes nothing)
 *
 * Run it after editing the overlay (and rebuilding the catalogue), the eval set
 * or the fixture policy. The thresholds in the fixture policy are arbitrary
 * policy-test values: binding them to the eval digests exercises the
 * fingerprint mechanism, it does not mean they were fitted to that data.
 */

import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  buildLabelSet,
  catalogueDigest,
  computeCalibrationFingerprint,
  labelSetDigest,
  policyDigest,
} from "../src/index.js";
import { FIXTURE_BRAND, SCHEMAS } from "../src/version.js";
import { PATHS, datasetDigests, headExcerpt, loadJsonl, readJson } from "./lib/eval-lib.mjs";

/** The example History message behind fixtures/evidence.synthetic.json. */
export const EXAMPLE_TEXT = "Why did the Soviet Union put up the Berlin Wall in 1961 instead of just closing the border?";

/** Compute every derived fixture. @returns {Promise<Record<string, string>>} path -> file text */
export async function deriveFixtures() {
  const catalogue = readJson(PATHS.catalogue);
  const harness = readJson(PATHS.harness);
  const policy = readJson(PATHS.policy);
  const { items, errors } = loadJsonl(PATHS.eval);
  if (errors.length) throw new Error(`eval set does not parse: ${errors[0]}`);

  const labelSet = buildLabelSet(catalogue);
  const catalogueSha256 = await catalogueDigest(catalogue);
  const labelSetSha256 = await labelSetDigest(labelSet);

  const datasets = datasetDigests(items.map((x) => x.item));
  const nextHarness = { ...harness, calibrationContext: { ...harness.calibrationContext, datasets } };

  const fingerprint = await computeCalibrationFingerprint({
    model: harness.calibrationContext.model,
    labelSetSha256,
    catalogueSha256,
    policySha256: await policyDigest(policy),
    adapterVersion: harness.adapter.version,
    excerptVersion: harness.excerpt.version,
    datasets,
  });
  const nextPolicy = { ...policy, calibration: { ...policy.calibration, fingerprint } };

  const excerpt = headExcerpt(EXAMPLE_TEXT, harness.excerpt.windowUtf8Bytes);
  const evidenceFixture = {
    fixtureBrand: FIXTURE_BRAND,
    note: "Hand-assigned synthetic scores for one example message, in the exact epinoic.routing-evidence.v1 shape. Not provider output: no adapter or model produced it.",
    text: EXAMPLE_TEXT,
    evidence: {
      schema: SCHEMAS.evidence,
      labelSetVersion: labelSet.labelSetVersion,
      labelSetSha256,
      catalogueSha256,
      adapter: { ...harness.adapter },
      excerpt: {
        version: harness.excerpt.version,
        utf8Bytes: excerpt.utf8Bytes,
        codePoints: excerpt.codePoints,
        truncated: excerpt.truncated,
      },
      subjects: [
        { label: "history", score: 0.91 },
        { label: "geography", score: 0.14 },
      ],
      families: [],
      flags: { out_of_scope: 0.03, mixed_request: 0.02, non_english_input: 0.01, needs_task_context: 0.05 },
    },
  };

  const text = (value) => `${JSON.stringify(value, null, 2)}\n`;
  return {
    [PATHS.harness]: text(nextHarness),
    [PATHS.policy]: text(nextPolicy),
    [PATHS.evidence]: text(evidenceFixture),
  };
}

/** @param {string} file */
function readOrEmpty(file) {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

/** @param {string[]} argv */
export async function main(argv) {
  const check = argv.includes("--check");
  const unknown = argv.filter((a) => a !== "--check");
  if (unknown.length) {
    process.stderr.write(`unknown argument ${unknown[0]}\n`);
    return 2;
  }
  const files = await deriveFixtures();
  const stale = Object.keys(files).filter((file) => readOrEmpty(file) !== files[file]);
  if (check) {
    for (const file of stale) process.stdout.write(`STALE: ${file}\n`);
    process.stdout.write(stale.length ? "fixtures are stale; run npm run build:fixtures\n" : "fixtures are up to date\n");
    return stale.length ? 1 : 0;
  }
  for (const file of stale) writeFileSync(file, files[file]);
  process.stdout.write(`updated ${stale.length} fixture file(s)\n`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  process.exitCode = await main(process.argv.slice(2));
}
