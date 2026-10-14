import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  ROUTING_CONTRACT_VERSION,
  buildLabelSet,
  catalogueDigest,
  labelSetDigest,
  selectSpecialist,
  selectSticky,
  validateCapabilities,
  validateCatalogue,
  validateEvidence,
} from "../src/index.js";
import { deepFreeze, loadFixtures } from "./helpers.js";

describe("offline end-to-end example (synthetic evidence, no model)", () => {
  test("evidence fixture -> validateEvidence -> selectSpecialist -> documented RoutingResult", async () => {
    const { catalogue, capabilities, policy, harness, evidenceFixture } = deepFreeze(loadFixtures());
    assert.equal(ROUTING_CONTRACT_VERSION, "epinoic.specialist-routing.v0.1.0");

    // 1. The website loads the catalogue and capabilities and derives the label set.
    assert.equal(validateCatalogue(catalogue).ok, true);
    assert.equal(validateCapabilities(capabilities, { catalogue }).ok, true);
    const labelSet = buildLabelSet(catalogue);

    // 2. Website 01's adapter would map Fastino output into evidence. Here the
    //    evidence is a hand-assigned synthetic fixture, labelled as such.
    assert.match(evidenceFixture.note, /Not provider output/);
    const { evidence } = evidenceFixture;
    const limits = harness.limits;
    assert.deepEqual(await validateEvidence(evidence, { catalogue, labelSet, limits }), { ok: true, errors: [] });

    // 3. Selection with the fixture-only policy in the explicit offline harness.
    const result = await selectSpecialist({
      evidence,
      catalogue,
      labelSet,
      policy,
      capabilities,
      trusted: {},
      options: { offlineFixtureHarness: true, limits, calibrationContext: harness.calibrationContext },
    });

    assert.deepEqual(result, {
      schema: "epinoic.routing-result.v1",
      outcome: "route",
      slug: "history",
      reason: "single_subject",
      candidates: [],
      path: "classification",
      identity: {
        catalogueSha256: await catalogueDigest(catalogue),
        labelSetSha256: await labelSetDigest(labelSet),
        policyVersion: "fixture/0.1.0",
        calibrationFingerprint: policy.calibration.fingerprint,
      },
      inferencePerformed: false,
    });
    assert.ok(Object.isFrozen(result));

    // 4. A follow-up turn on the stored subject uses the sticky path: no inference.
    const followUp = await selectSticky({ stickySlug: result.slug, catalogue, capabilities, options: { offlineFixtureHarness: true } });
    assert.equal(followUp.outcome, "route");
    assert.equal(followUp.reason, "sticky_subject");
    assert.equal(followUp.path, "sticky");
  });
});
