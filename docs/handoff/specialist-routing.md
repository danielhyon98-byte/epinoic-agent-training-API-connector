# Specialist routing: multi-specialist selection contract

Owner: Daniel's second Claude (specialist-routing lane). Package: `specialist-routing/`.
Status: **offline slice, source pins unverified, no live inference**.
Contract version: `epinoic.specialist-routing.v0.1.0`.

This is the early interface section the router handoff asks for before substantial
implementation. Website 01 owns the existing `src/router/`, the Fastino GLiNER
adapter and PR19's English/History calibration, and keeps that ownership. This
package is a portable selection layer for later reviewed integration. It is not a
second adapter or a live router.

## 1. Source pins and what was verified

| Source | Pin | Verified here? |
| --- | --- | --- |
| Agent-Training `main` | `651d71ded41d4a3b8a106fe23b4198e7fc292146` | **No.** Unreachable. |
| Agent-Training handoff branch (PR1) | `2b157286947830578453fff35a3d990cad179d78` | **No.** |
| Website `main` (`src/router/*`, `public/chat-contract.js`, `src/state/limits.js`, `migrations/0001_chat_state.sql`) | `2cd318208980e5b236d16b4281dfc0560a7b9610` | **No.** |
| Website PR19 (calibration plan) | `7f44b54f4e33d0a7a3ece63defbe99ebbe19763b` | **No.** Its data and thresholds are not used here. |
| Runtime capabilities contract | `docs/handoff/website-specialist-integration.md` in this repo, section 9 | Yes. Same repo and branch. |
| 16-agent roster | Logic Translator `docs/ARENA_RESULTS.md` round 7 (`361cc4e`), plus six slugs named in the handoffs | Roster: yes. Ten folder slugs are **provisional**. |

Because the knowledge-base packages could not be read, the catalogue in this repo is
**synthetic**. It is built from a hand-written overlay (`specialist-routing/catalogue/routing-overlay.json`)
and the roster, with no package evidence. The builder refuses to produce a
non-synthetic catalogue until it runs against a real `knowledge-bases/` checkout.

## 2. Boundary

The package selects at most one canonical specialist slug, asks for clarification,
or reports unavailability. It **never** answers, invokes an agent, calls a model or
the Fastino adapter, parses raw HTTP, fans out, retries, falls back, mutates a
conversation, reads browser route IDs, stores provider or model choices or keys, or
decides production enablement. Availability comes only from the runtime owner's
capabilities object.

## 3. Catalogue schema (`epinoic.routing-catalogue.v1`)

```js
{
  schema: "epinoic.routing-catalogue.v1",
  catalogueVersion: "0.1.0",
  synthetic: true,                                  // false only when built from a real checkout
  source: { repo, commit /* null when synthetic */, packagesPath: "knowledge-bases",
            packageDigests: { [slug]: "<sha256>" } /* {} when synthetic */ },
  families: [{
    id: "english", displayName: "English",
    members: ["english-a-literature", "english-a-lang-lit", "english-specialist"],
    genericAliases: ["english", "english a", "ib english"],   // intentionally ambiguous
    resolution: "clarify"                                      // never a default member
  }, ...],                                                     // also "mathematics"
  subjects: [{
    slug, displayName, family /* family id or null */,
    teachingScope: "<one or two plain sentences>",
    aliases: ["<leaf alias>", ...],                // must not collide across leaves
    overlapGroups: ["environment"],                // see overlapPolicies
    isLanguageCourse: false,                       // true for spanish-b: a subject, not an input language
    slugStatus: "handoff" | "provisional",
    evidence: { path, sha256 } | null              // null when synthetic
  }, ...],
  overlapPolicies: [{ id: "environment", members: ["ess", "biology", "geography"],
                      rule: "clarify_unless_trusted_course" }],
  taskContextTerms: ["paper 1", "paper 2", "essay", "source analysis", "exam help", "ia", "internal assessment", ...],
  unresolvedDecisions: [ ... ]                     // see section 9
}
```

`catalogueSha256` is SHA-256 over the canonical JSON (keys sorted, no whitespace) of
the catalogue. It is computed, never stored inside the object it hashes.

`validateCatalogue` rejects (all tested): duplicate slugs; slugs that are not
lowercase kebab-case; leaf aliases shared by two subjects; a leaf alias equal to a
family generic alias; family members that are not catalogue subjects; a subject in
two families; overlap members that are unknown; unknown fields; a non-synthetic
catalogue with missing evidence; and provider, model, key or enablement fields
anywhere. A family generic alias such as "english" naming several variants is
**valid**. It is represented as explicit ambiguity.

## 4. Classification evidence (`epinoic.routing-evidence.v1`)

The evidence is provider-neutral. Website 01's adapter would map Fastino output into
this shape. Raw HTTP parsing stays with that adapter.

```js
{
  schema: "epinoic.routing-evidence.v1",
  labelSetVersion, labelSetSha256, catalogueSha256,
  adapter: { id: "<opaque>", version: "<opaque>" },
  excerpt: { version: "<opaque>", utf8Bytes: <int>, codePoints: <int>, truncated: <bool> },
  subjects: [{ label: "<catalogue slug>", score: <0..1> }],   // one entry per label at most
  families: [{ label: "<family id>", score: <0..1> }],
  flags: { out_of_scope: <0..1>, mixed_request: <0..1>, non_english_input: <0..1>, needs_task_context: <0..1> }
}
```

`validateEvidence(evidence, { catalogue, labelSet, limits })` is strict. It rejects
unknown top-level or nested fields, including any `route`, `slug`, `model` or
`override` field. It also rejects unknown labels, a label repeated in one list
(contradictory or not), missing fields, non-finite numbers, NaN, scores outside
[0, 1], an excerpt over `limits.maxExcerptUtf8Bytes`, and a `labelSetSha256` or
`catalogueSha256` that does not match the current catalogue. Several plausible
subjects is **valid** evidence. The selection policy handles it.

### Proposed expanded label set

`buildLabelSet(catalogue)` produces the proposed description: one subject label per
slug, one family label per family, and the four flags, each with a short natural
language description. It is versioned and hashed (`labelSetSha256`).

**Not compared with the real Fastino contract.** `src/router/fastino.js` could not be
read. Whether GLiNER-2.5-Decide through the existing hosted adapter supports this
many classification labels, multi-label output and per-label scores in one request is
**unverified**. The adapter owner must confirm or reject the shape. No provider
capability is assumed.

### Size

`measureClassificationPayload({ labelSet, excerpt })` reports separately:
`labelSchemaUtf8Bytes`, `excerptUtf8Bytes`, `serializedBodyUtf8Bytes` (provider-neutral
JSON of `{ text, labels }`), and `tokenBound: { status: "unverified" }`. The current
two-subject request and response limits are not evidence that the 16-subject payload
fits.

## 5. Capabilities input (from specialist-runtime)

The router consumes exactly the runtime's `getCapabilities({ environment })` output
(`epinoic.specialist-capabilities.v1`; see the runtime contract, section 9):
`{ schema, runtimeContractVersion, manifestVersion, environment, entries: [{ slug, available, supportedModes, gateVersion, bundleSha256 }] }`.

The router rejects an unknown `schema` or `runtimeContractVersion`, duplicate entry
slugs, and entry slugs absent from the catalogue. A catalogue subject with no entry
is treated as **not available**, which is not an error, because the runtime lists
only the pilot today. This package keeps no availability registry of its own. Tests
use `fixtures/capabilities.synthetic.json`, which has the runtime's exact shape.

## 6. Selection

```js
selectSpecialist({ evidence, catalogue, labelSet, policy, capabilities, trusted = {}, options = {} })
  -> RoutingResult
selectSticky({ stickySlug, catalogue, capabilities })              // no inference
  -> RoutingResult
```

`trusted` is server-derived only: `{ courseSlugs?: string[] }` from a trusted profile.
Browser route IDs and prompt text are never inputs. Unknown `trusted` fields are
rejected.

```js
RoutingResult = {
  schema: "epinoic.routing-result.v1",
  outcome: "route" | "clarify" | "unavailable",
  slug: string | null,                         // only for "route", always catalogue + capability-permitted
  reason: <closed code, below>,
  candidates: [{ slug, available }],           // for "clarify" (and recognised slug for "specialist_unavailable")
  path: "classification" | "sticky",
  identity: { catalogueSha256, labelSetSha256, policyVersion, calibrationFingerprint /* or null */ },
  inferencePerformed: false                    // selection never runs inference
}
```

| Outcome | Reason codes |
| --- | --- |
| `route` | `single_subject`, `trusted_course_metadata`, `sticky_subject` |
| `clarify` | `generic_family` (English/Maths), `competing_subjects`, `overlap_policy` (ESS/Biology/Geography), `mixed_request`, `needs_task_context`, `low_confidence` |
| `unavailable` | `specialist_unavailable` (recognised but disabled), `out_of_scope`, `unsupported_language`, `calibration_missing`, `calibration_mismatch`, `identity_mismatch`, `evidence_invalid`, `capabilities_invalid`, `fixture_policy_rejected`, `sticky_invalid` |

The policy is evaluated in this order, which is documented and tested:

1. Validate the catalogue, capabilities, policy and evidence. Check identity hashes,
   then the calibration fingerprint. A production policy with `calibration: null` or
   status `unapproved` returns `unavailable/calibration_missing`, so new live
   classification cannot start.
2. `non_english_input` at or above threshold gives `unsupported_language`. A Spanish
   **course** (`isLanguageCourse`) signal does not count as non-English input. Script
   checks are not claimed as multilingual understanding.
3. `mixed_request` at or above threshold, or two or more subjects from different
   families or overlap groups at or above `routeMin`, gives `clarify/mixed_request`.
   A request that pairs a supported half with an unsupported or out-of-scope half is
   also mixed. It is never reduced to the supported half and never fanned out.
4. `out_of_scope` at or above threshold with no subject at or above `routeMin` gives
   `out_of_scope`.
5. A family generic signal at or above `familyMin`, with no member separated by
   `marginMin`, gives `clarify/generic_family` with the family's members. One
   exception: when `trusted.courseSlugs` contains exactly one member, the result is
   `route/trusted_course_metadata`.
6. `needs_task_context` at or above threshold with no subject at or above `routeMin`
   gives `clarify/needs_task_context` ("Paper 1", "essay", "source analysis" or "exam
   help" without a subject).
7. If the top subject is below `routeMin`: candidates at or above `clarifyFloor` give
   `clarify/low_confidence`, otherwise the result is `out_of_scope`.
8. If the top two are within `marginMin`: when they share an overlap group, the result
   is `overlap_policy` (resolved only by trusted course metadata naming exactly one).
   Otherwise it is `competing_subjects`. No arbitrary highest-score tie-break.
9. A recognised subject that capabilities mark unavailable, or that has no entry,
   gives `unavailable/specialist_unavailable` with that slug as the candidate. It is
   **never** replaced by another enabled specialist.
10. Otherwise the result is `route/single_subject`.

`selectSticky` is the follow-up path the website uses for a trusted stored subject. It
runs no inference. It re-checks that the slug exists in the catalogue and is still
available (`route/sticky_subject`), or returns `unavailable/sticky_invalid` or
`specialist_unavailable`. An explicit "different subject" action means the website
calls `selectSpecialist` again. This package adds no phrase-triggered
reclassification.

## 7. Policy and calibration identity

```js
Policy = {
  schema: "epinoic.routing-policy.v1",
  policyVersion,
  status: "unapproved" | "fixture-only" | "approved",
  thresholds: { routeMin, marginMin, familyMin, clarifyFloor, outOfScopeMin, mixedMin,
                nonEnglishMin, taskContextMin } | null,
  calibration: { fingerprint, recordId } | null
}
```

- `PRODUCTION_POLICY` (exported) is `status: "unapproved"`, `thresholds: null`,
  `calibration: null`. It cannot start new classification.
- The fixture policy (`fixtures/policy.synthetic.json`) has `status: "fixture-only"` and
  a `fixtureBrand` marker. `selectSpecialist` rejects it unless
  `options.offlineFixtureHarness === true`. `loadApprovedPolicy()` always rejects it.
  Its thresholds are arbitrary policy-test values, **not** calibrated probabilities and
  **not** PR19's two-subject thresholds.
- `computeCalibrationFingerprint(identity)` is SHA-256 over canonical JSON of
  `{ model, labelSetSha256, catalogueSha256, policySha256 (thresholds excluded), adapterVersion, excerptVersion, datasets: { tuneSha256, holdoutSha256 } }`.
  Every field is required. A change to any of them gives `calibration_mismatch`.
- Trusted sticky selection is not inference and does not need calibration.

## 8. Original synthetic evaluation set

`specialist-routing/eval/routing-eval.synthetic.jsonl` holds original items written for
this package. They are not taken from official papers, student conversations or the
website's frozen set. Each item has `id`, `group` (paraphrase or template family),
`split` (deterministic from SHA-256 of `group`, so related paraphrases share a
split), `text` or a `compose` generator for long messages, `expected` (outcome,
reason, slug or candidates), `rationale`, `disputed` and `tags`. Some items also
carry `trusted` and `syntheticEvidence`.

`npm run evaluate` checks schema, per-subject and per-boundary coverage in both
splits, no group crossing splits, a cross-split near-duplicate scan, and disputed
items listed for review. It then runs **policy-mechanics tests**: synthetic evidence
through `validateEvidence` and `selectSpecialist` with the fixture policy and
synthetic capabilities. The report says these are policy tests over synthetic scores.
They are not provider observations or classifier accuracy. No model is called. Real
scoring, tuning and holdout runs are coordinated with the calibration owner after
review.

## 9. Unresolved alias and course decisions (need Daniel/Bruno/01)

1. **Real folder slugs** for the ten provisional subjects (economics, business-management,
   psychology, geography, spanish-b, computer-science, physics, chemistry, biology, ess).
2. **Scope of `english-specialist`**: a second English A: Literature agent (as the
   translator roster suggests) or something else. Until then, "English literature" is a
   family-level ambiguous alias, not a leaf alias of `english-a-literature`.
3. **Website `english` route ID**: which of the three English packages it maps to.
   This is website 01's decision, as the runtime handoff says.
4. **Trusted course metadata source**: whether a server-side student profile exists.
   Until it does, `courseSlugs` is absent and family and overlap ambiguity always
   clarifies.
5. **Spanish B input language**: the router supports English-language input only in
   the pilot. Spanish-language messages give `unsupported_language`, even about the
   Spanish course, unless policy changes.
6. **Fastino label capacity and shape** (section 4).
7. **SL/HL**: kept out of routing. Level is a specialist-side clarifying question.

## 10. Website 01 integration delta (not done here)

The current public specialist IDs and D1 route constraints allow only `english` and
`history`. Routing to any other slug needs a reviewed website change to
`public/chat-contract.js`, the state and route enums, a D1 migration (numbered after
04's reserved 0003), UI copy for clarify and unavailable, a calibration record for the
expanded schema, and adapter mapping into `epinoic.routing-evidence.v1`. This
package changes none of them.
