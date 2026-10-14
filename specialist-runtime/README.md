# @epinoic/specialist-runtime

The provider-neutral History specialist component for the Epinoic AI website
Worker. It verifies the pinned History bundle and manifest, prepares one bounded
no-tools request with the bundle intact, calls an injected authorized-generation
callback **at most once**, runs History's deterministic format and policy gate,
and returns an internal result with provenance.

It implements `docs/handoff/website-specialist-integration.md` (contract
`epinoic.specialist-runtime.v0.1.0`). Where this README and the contract
disagree, the contract wins.

> **Status: offline slice. Source unverified. Nothing enabled. No provider calls.**
>
> - `Epinoic-AI/Epinoic-Agent-Training` was not reachable. The real History
>   bundle, its validators and History's handoff/04 gate rules were **not read or
>   run**.
> - `RUNTIME_MANIFEST` keeps `source.commit`, `source.bundlePath` and `kbVersion`
>   **null (pending)**. The bundle SHA-256 `a5b8a2da…19240` is recorded as
>   `reported-by-audit-02-not-verified`.
> - `productionEnabled` and `stagingPilotEnabled` are `false`, and this package
>   refuses `productionEnabled: true` under any conditions. `getCapabilities`
>   reports every entry `available: false` in every environment.
> - `HISTORY_GATE_CONFIG` is **pending handoff/04**: three of its five checks report
>   `unsupported`, so a History answer can at best be `gate_unverifiable`. Nothing
>   can pass until the real rules and bundle codes are loaded.
> - Every test runs on clearly labelled **SYNTHETIC** fixtures through
>   `createOfflineTestRuntime`. No result here is a provider observation, a
>   measurement or an accuracy claim.

## What it does not do

It does not call a provider, read or hold API keys, fetch, retry, fall back,
revise, stream, run tools, retrieve, use MyLib or a library manifest, store
conversations, invent conversation or turn IDs, compute prices or caps, reserve
or settle budget, write D1 migrations, enable production, or call Z3 or the
translator. The browser never sees its internals.

## Exports (`src/index.js`)

Exactly the contract's export table, nothing else.

| Export | Kind | Purpose |
| --- | --- | --- |
| `RUNTIME_CONTRACT_VERSION` | string | `"epinoic.specialist-runtime.v0.1.0"` |
| `PILOT_MODE` | string | `"pilot-single-turn-no-tools"`, the only supported mode |
| `RUNTIME_MANIFEST` | frozen object | The authoritative runtime manifest (pins pending, nothing enabled) |
| `REPORTED_WEBSITE_LIMITS` | frozen object | Reference only, never defaults. The four limits the coordination handoff reports (12,000 code points, 32 KiB body, 64 KiB stored result, 180 s deadline). They were not read from website source. |
| `validateManifest(manifest)` | function | Structural and enablement invariants. Returns frozen `{ schema, profile, ok, errors: [{ path, code }] }` |
| `getCapabilities({ environment })` | function | Capabilities for the router |
| `loadPinnedBundle({ slug, bundleModule, environment })` | async | Decode and SHA-256-verify an exported bundle module. Frozen `VerifiedBundle` or throws `RuntimeIntegrityError` |
| `prepareTurn(input)` | async | The bounded `PreparedRequest`, or `{ ok: false, failure: { stage: "precondition", code } }` |
| `runSpecialistTurn(input)` | async | The one-turn bridge. Never throws; always resolves to a `SpecialistTurnResult` |
| `runGate({ slug, gateConfig, answerText, finishReason, userMessage })` | function | Deterministic gate. Refuses synthetic configs |
| `HISTORY_GATE_CONFIG` | frozen object | Pinned History gate configuration, pending handoff/04 |
| `createOfflineTestRuntime({ manifest, gateConfigs })` | function | Separate runtime for synthetic fixtures; accepts only `environment: "offline-test"` |
| `redactForLog(result)` | function | Log-safe projection: no answer text, user text, provider evidence or keys |

`RuntimeIntegrityError` is not in the export table, so it is not exported from
`index.js`. Errors have `name === "RuntimeIntegrityError"` and a stable `code`;
the class is in `src/errors.js`.

Environments: the pinned runtime accepts `"production"` and `"staging-pilot"`
and refuses `"offline-test"`. The offline runtime accepts only `"offline-test"`.

The runtime modules use only `globalThis.crypto.subtle`, `TextEncoder`,
`TextDecoder`, `atob`, `btoa` and `AbortSignal`, plus language built-ins. They have
no filesystem, network, `process`, `console`, `Date`, randomness or Node
built-in use. `npm run check:portable` enforces this. Build-time tools in
`tools/` use Node.

## How website 01 uses it

### 1. Export the bundle at build time (private CI, never committed)

```
node specialist-runtime/tools/export-bundle.mjs \
  --kb-checkout /path/to/Epinoic-Agent-Training \
  --commit <40-hex commit> \
  --slug history \
  --bundle-path <path of the History bundle inside the checkout> \
  --out specialist-runtime/dist/history.bundle.mjs \
  [--kb-version <version>]
```

It refuses (exit 1, nothing written) unless all of these hold: `HEAD` equals
`--commit` (`git -C <checkout> rev-parse HEAD`); the bundle path is tracked and
`git status --porcelain -- <path>` is empty; the working-tree bytes equal the
committed blob; the SHA-256 of those bytes equals the manifest; the bytes are
valid UTF-8; `--commit`, `--bundle-path` and `--kb-version` equal the manifest
pins where those are set; and `--out` is a `.mjs` file outside the checkout that
is git-ignored if it is inside a work tree. Unknown options exit 2. There is no
bypass flag. `dist/` is git-ignored here and in the repository root, because the
bundle is proprietary and this repository is public.

It writes:

```js
export const BUNDLE = Object.freeze({
  schema: "epinoic.specialist-bundle-module.v1",
  slug: "history", sourceRepo, sourceCommit, bundlePath, kbVersion,
  sha256: "<hex of the exact file bytes>", byteLength: <n>,
  base64: "<exact file bytes, base64>"
});
```

### 2. Import it in the Worker (plain ES modules)

```js
import {
  PILOT_MODE, getCapabilities, loadPinnedBundle, runSpecialistTurn, redactForLog,
} from "../specialist-runtime/src/index.js";            // or "@epinoic/specialist-runtime"
import { BUNDLE } from "../specialist-runtime/dist/history.bundle.mjs";

const environment = "staging-pilot";                     // from 01's configuration
const caps = getCapabilities({ environment });           // the router reads this; no second registry

// Throws RuntimeIntegrityError on any integrity or enablement failure.
// Today it always throws "slug_not_enabled": History is not enabled.
const bundle = await loadPinnedBundle({ slug: "history", bundleModule: BUNDLE, environment });
```

### 3. Run one turn with the injected callback

The callback is 01's code. It wraps 04 (eligibility, reserve and claim
immediately before dispatch, then settle) and 03 (transport, error and usage
normalisation). The names `budget` and `transports` below are illustrative; they
belong to 04 and 03, not to this package.

```js
const result = await runSpecialistTurn({
  slug: "history",
  mode: PILOT_MODE,
  environment,
  bundle,                                    // the VerifiedBundle from loadPinnedBundle
  message,                                   // already validated by 01
  priorTurns,                                // [{ role: "user" | "assistant", text }] from 01's own history
  limits: {                                  // required; from 01/03 configuration, no defaults
    maxMessageCodePoints, maxPriorTurns, maxPriorTurnsUtf8Bytes,
    maxPreparedInputUtf8Bytes, maxAnswerUtf8Bytes, maxOutputTokens /* optional */,
  },
  turn: { conversationId, turnId, turnVersion, attemptId },   // website-owned, echoed only
  signal: request.signal,                    // optional AbortSignal
  async authorizedGenerate(prepared, { signal }) {
    const claim = await budget.reserveAndClaim(prepared.bounds);      // 04
    if (!claim.ok) return { status: "declined", reason: claim.reason }; // nothing dispatched
    const out = await transports.generate(prepared, { signal });        // 03: one call, no retry
    await budget.settle(claim, out.usage);                              // 04, with 03's usage
    return out.ok
      ? { status: "completed",
          output: { text: out.text, finishReason: out.finishReason },   // "stop" | "length" | "refusal" | "content_filter" | "unknown"
          usage: out.usage ?? null, providerEvidence: out.evidence ?? null }
      : { status: "failed", error: { code: out.errorCode },
          usage: out.usage ?? null, providerEvidence: out.evidence ?? null };
  },
});

if (result.outcome === "answer") show(result.answer);
else log(redactForLog(result));                // never log the result itself
```

Callback reply rules (anything else is `failed` / `callback_contract_violation`):
exactly the keys shown; `usage` and `providerEvidence` are an object or `null`
and must be present; `error` is exactly `{ code }`; `reason` and `code` are
code-like strings (`[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}`); `finishReason` is in
the closed set; no tool-call field of any kind. The runtime does not race the
callback against the signal: it waits for the reply, then fences it if the
signal aborted meanwhile, so usage is never lost.

Suggested transport mapping, for 03 to decide: for Anthropic Messages, one
`system` text block per instruction with the bundle block marked cacheable; for
OpenAI Responses, the instructions joined in order into `instructions` with a
fixed separator. The `messages` become `input`/`messages`. Role alternation and
provider token counting are 03's concern; this package does not count tokens.

## Prepared request

```js
{
  schema: "epinoic.prepared-specialist-request.v1",
  slug: "history", mode: "pilot-single-turn-no-tools",
  instructions: [
    { kind: "mandatory-bundle", text: <bundle text, byte-identical>, sha256 },
    { kind: "runtime-notice", version: "pilot-notice/0.1.0", text: <notice> }
  ],
  messages: [...priorTurns, { role: "user", text: message }],
  tools: [],
  bounds: { preparedInputUtf8Bytes, maxOutputTokens /* or null */, tokenCount: null, tokenCountStatus: "not-measured" },
  provenance: { ... }
}
```

Deep-frozen. The bundle is never trimmed, summarised or reordered; its SHA-256 is
re-verified over the UTF-8 bytes of the text on every call. A leading BOM and
CRLF line endings survive. `preparedInputUtf8Bytes` is the sum of the UTF-8
bytes of both instruction texts and all message texts (no role or JSON
overhead). Over `maxPreparedInputUtf8Bytes` fails with
`prepared_input_exceeds_bound` and nothing is dispatched. Token fit is not
inferred from bytes. The notice text is in full in `src/prepare.js`.

## Result shape

```js
SpecialistTurnResult = {
  schema: "epinoic.specialist-turn-result.v1",
  contractVersion: "epinoic.specialist-runtime.v0.1.0",
  outcome,                                    // see the table below
  answer: string | null,                      // non-null ONLY when outcome === "answer"
  failure: { stage, code } | null,            // stage: precondition | authorization | generation | completion | gate
  completion: { finishReason: string | null, outputUtf8Bytes: number | null },
  gate: { kind: "deterministic-format-policy", version, configVersion,
          status: "passed" | "failed" | "unverifiable" | "not_run",
          checks: [{ id, status: "pass" | "fail" | "unsupported", code }],
          disclaimer: "Deterministic format and policy heuristics. Not factual, academic or formal verification." },
  usage: object | null,                       // the callback's object, by reference, never computed or modified
  usageStatus: "reported" | "unknown",        // "unknown" whenever usage is null; never 0
  providerEvidence: object | null,            // the callback's object, by reference
  dispatch: { callbackInvocations: 0 | 1, authorization: "not_requested" | "declined" | "admitted" | "unknown" },
  provenance: { manifestVersion, slug, sourceRepo, sourceCommit, kbVersion, bundleSha256,
                gateVersion, gateConfigVersion, runtimeNoticeVersion, mode,
                libraryManifestVersion: null, toolsRun: [], retrieval: null, claims: null },
  turn: { conversationId, turnId, turnVersion, attemptId }    // echoed unchanged
}
```

The result's own structure is frozen. `usage` and `providerEvidence` are 03's
objects; they are passed through by reference and not frozen. `usageStatus` only
says whether a usage object was reported: read `dispatch` to know whether a
dispatch could have happened (`callbackInvocations: 0` or `authorization:
"declined"` means nothing was dispatched).

## Outcomes

| Outcome | When | Answer | `failure` |
| --- | --- | --- | --- |
| `precondition_failed` | Any check before the callback failed (environment, manifest, slug, enablement, mode, gate config, limits, message, prior turns, bundle integrity, input size, turn, callback, signal, unknown or `tools` input field) | withheld | `precondition` / e.g. `slug_not_enabled`, `limits_missing`, `prepared_input_exceeds_bound`, `tools_not_supported` |
| `cancelled` | Signal aborted before dispatch (0 invocations), or after the callback returned (answer withheld, usage and evidence kept) | withheld | `precondition` / `aborted_before_dispatch`, or `generation` / `aborted_after_callback` |
| `declined` | The callback returned `{ status: "declined" }`; nothing dispatched | withheld | `authorization` / the decline reason |
| `failed` | The callback threw (`callback_threw`), replied outside the shapes or reported tool calls (`callback_contract_violation`), or returned `{ status: "failed" }` (its code) | withheld | `generation` / code |
| `refusal` | `finishReason` is `refusal` or `content_filter` | withheld | `completion` / `finish_refusal`, `finish_content_filter` |
| `incomplete` | `finishReason` is `length`, or the text is empty or whitespace | withheld | `completion` / `finish_length`, `empty_output` |
| `oversize` | UTF-8 size over `limits.maxAnswerUtf8Bytes` | withheld, **never truncated** | `completion` / `answer_exceeds_bound` |
| `gate_failed` | A gate check failed | withheld | `gate` / the first failing check's code |
| `gate_unverifiable` | No check failed but one is `unsupported` (unknown finish reason, pending History rule) | withheld | `gate` / the first unsupported check's code |
| `answer` | All checks passed | returned | `null` |

Order of decision after a completed reply: refusal, then incomplete, then
oversize, then the gate. A specialist's clarifying question ("Which paper is
this for, SL or HL?") is a normal `answer`; it is not parsed into a router
clarification.

## Gate checks

All five checks run and are required. A configuration can mark a check
`pending` (reports `unsupported`), but cannot switch one off. Checks report codes
only, never answer text.

| Check | What it checks | Pinned `HISTORY_GATE_CONFIG` | Synthetic test config |
| --- | --- | --- | --- |
| `completeness` | `finishReason === "stop"` and non-empty text. `unknown` (and anything unrecognised) is `unsupported` | Active (generic) | Active |
| `url-policy` | No `scheme://`, `www.` or bare domain-with-path (after NFKC and zero-width removal) | Active, pilot default `forbid_all`, pending reconciliation with handoff/04 | Active, `forbid_all` |
| `internal-code-leakage` | Exact, case-sensitive, boundary-matched internal codes (dash variants folded). Codes in the user's own message are excluded. A config whose code list contains benign vocabulary (paper names, HL/SL, years, date ranges, bracketed numbers, "[15 marks]") is refused | **Pending** (`unsupported`): codes come from the bundle via `tools/extract-codes.mjs` and handoff/04's convention | Fake codes `HXR-101`, `HXR-102`, `HXR-215` |
| `provisional-mark` | Every awarded mark, band, level or grade mention has the label in the same sentence. Exempt: "worth 15 marks", "a 15-mark question", "[15 marks]" | **Pending** (`unsupported`): the label rule from handoff/04 | Label `/\bprovisional\b/i` |
| `sources-line` | Exactly one line starting with the prefix; its value is exactly one allowed value; no URL | **Pending** (`unsupported`): the rule from handoff/04 | `Sources: none consulted (no retrieval in this session)` |

The top-level `runGate` refuses configs marked `synthetic: true` (every check
`unsupported`, code `synthetic_config_refused`); synthetic configs run only
through `createOfflineTestRuntime`.

`provisional-mark` detects award mentions in two tiers, after removing the
exempt phrases:

1. Always an award: "12 marks", "band 4", "markband", "grade 6", "grade A",
   "awarded 6", "would score 12".
2. Only with an assessment cue in the same sentence ("mark", "markband",
   "score", "award", "grade", "criterion", "rubric", "assessment", "achievement
   level", "give this/it", "you would get/earn/achieve"): "5/7", "5 out of 7",
   "level 4", "top band", "7–9 band". So "1/2 + 1/4 = 3/4", "x = 3/4", "at the 5%
   significance level", "sea level rose 0.2 m" and "level 3 of the menu" are not
   awards, while "Provisional mark: 5/7" and "I'd give this 5 out of 7" are.

These are fallible heuristics. They do not verify facts, historical accuracy,
interpretation or academic quality, and they are not Z3 or formal verification.

## Completing the slice against the real source

Do these in order, in a session that can read `Epinoic-AI/Epinoic-Agent-Training`,
and record every command, output and runtime in the work log.

1. [ ] Clone the real Agent-Training checkout and check out the pinned commit
   (`651d71ded41d4a3b8a106fe23b4198e7fc292146` per the coordination handoff, or the
   newer commit agreed with Daniel/Bruno). Confirm `git status` is clean.
2. [ ] Inside `knowledge-bases`, run `python3 -I _build/validate_kb.py history` and
   `python3 -I _build/check_kb_set.py .`. Record each output, exit code and
   runtime, and whether either changed any bundle file (`git status` before and
   after). Stop if a validator fails or a bundle changed.
3. [ ] Make this repository private (or move the work into Agent-Training) before
   any proprietary text, code or export is placed near it.
4. [ ] Run `tools/export-bundle.mjs` against the clean checkout. It must report
   SHA-256 `a5b8a2da6feb447ea06d9e38946ba50f71b14495e517169b5b3a418530119240`. If it
   refuses with `sha256_mismatch`, stop and report the actual value to audit 02;
   do not edit the manifest to match.
5. [ ] In a reviewed commit, fill the manifest pins: `source.commit`,
   `source.bundlePath`, `kbVersion`, `bundleSha256Status: "verified"`,
   `sourceStatus: "verified"`, and a new `manifestVersion`. Keep both enablement
   flags `false` in that commit. Re-run the export with `--kb-version` so the module
   provenance matches the pins (loadPinnedBundle compares them).
6. [ ] Read handoff/04. Fill `HISTORY_GATE_CONFIG` in `src/gate/history-config.js`:
   reconcile `url-policy`; set `internal-code-leakage` to the codes from
   `node tools/extract-codes.mjs --bundle-module dist/history.bundle.mjs --pattern '<pattern from handoff/04>'`;
   set the `provisional-mark` label pattern and the `sources-line` rule. Bump
   `configVersion`. If the codes are proprietary, keep them out of public
   repositories.
7. [ ] Add tests with real-rule examples, re-run `npm test` and
   `npm run check:portable`, and record the counts.
8. [ ] Port the reviewed package to `Epinoic-AI/Epinoic-Agent-Training` on its own
   branch (for example `feature/history-specialist-integration`). If another
   Daniel Claude already owns `specialist-runtime/` there, reconcile first.
9. [ ] Staging enablement (`stagingPilotEnabled: true`) is a separate reviewed
   change after 03 measures token fit with the provider's counter and 04's caps
   are in place. Production enablement is refused by this package version.

## Tests

Node.js 22 or later. No dependencies to install.

```
cd specialist-runtime
npm test                  # node --test test/
npm run check:portable    # node tools/check-portable.mjs
```

Last run (Node v22.22.0): `npm test` **117 tests, 117 pass, 0 fail**;
`npm run check:portable` **OK, 28 files in src**.

Node 22 does not expand a directory passed to `node --test`; it loads
`test/index.js`, which imports every `*.test.js`. `test/index-completeness.test.js`
fails if a test file is missing from that index.

| File | Covers |
| --- | --- |
| `exports.test.js` | Exact export table, frozen constants, limits are not defaults, zero dependencies |
| `manifest.test.js` | Pinned manifest values; enablement refused with pending or unverified pins; production refused; `libraryManifestVersion` null; slug rules; offline profile |
| `bundle.test.js` | Correct/wrong checksum, slug mismatch, provenance mismatch, invalid base64, invalid UTF-8, unknown/disabled slug, environment refusals both ways, BOM/CRLF |
| `prepare.test.js` | Request shape, byte-identical bundle with SHA re-verified, notice, tools refused, input bound without trimming, missing/invalid limits, message and prior-turn bounds |
| `bridge.test.js` | Every outcome path, callback at most once, aborts, throws, malformed replies, tool calls, usage pass-through and unknown usage, turn echo, provenance, property test over all outcomes |
| `result.test.js` | The result builder's own answer and usage invariants |
| `gate.test.js` | Pass and fail per check, benign counterexamples (contract and reviewer STEM list), pinned config never passes, config validation |
| `capabilities.test.js` | Shape; `available: false` everywhere for the pinned manifest |
| `redact.test.js` | No answer, user text, provider evidence or fake `sk-…` keys in logs; no console use |
| `portable.test.js` | `src/` scan is clean; each forbidden construct is caught; the CLI fails on a planted violation |
| `export-bundle.test.js` | Temporary git repos: success path, HEAD mismatch, dirty/staged/untracked path, hidden working-tree edit, SHA mismatch, unsafe output, CLI exit codes |
| `extract-codes.test.js` | Output shape, required pattern, refusals |
| `fixtures.test.js` | Fixtures are labelled synthetic and internally consistent |
| `integration.test.js` | prepare, fake authorized adapter, gate and result, every documented field and type |

## Layout

| Path | What it is |
| --- | --- |
| `src/index.js` | Public exports |
| `src/runtime.js` | Pinned runtime and `createOfflineTestRuntime` |
| `src/manifest.js` | `RUNTIME_MANIFEST`, `REPORTED_WEBSITE_LIMITS`, `validateManifest` |
| `src/bundle.js` | Bundle module and VerifiedBundle verification |
| `src/prepare.js`, `src/limits.js` | Prepared request, runtime notice `pilot-notice/0.1.0`, limits |
| `src/bridge.js`, `src/result.js`, `src/provenance.js` | One-turn bridge and result |
| `src/gate/` | Gate engine, config validation, the five checks, `HISTORY_GATE_CONFIG` |
| `src/redact.js`, `src/capabilities.js`, `src/context.js` | Log projection, router capabilities, runtime context |
| `src/sha256.js`, `src/text.js`, `src/util.js`, `src/errors.js`, `src/constants.js` | Helpers |
| `tools/export-bundle.mjs` | Build-time bundle export (Node) |
| `tools/extract-codes.mjs` | Code extraction for the leakage check. `--pattern` is required and must come from handoff/04 or the bundle's documented code convention |
| `tools/check-portable.mjs` | Static portability scan of `src/` |
| `fixtures/synthetic/` | SYNTHETIC bundle text and module (`build-synthetic-bundle.mjs`), manifest, gate config, fake callbacks, scenarios |

## Limitations

- Source pins, the bundle checksum and the History gate rules are unverified, so
  nothing can be enabled and no History answer can pass the pinned gate.
- `REPORTED_WEBSITE_LIMITS` holds the handoff-reported values only. They were not checked against website source.
- The gate is heuristic. Known cases: "Paper 2 is out of 30 marks" and "grade 6
  students" count as awards and need the label (fail closed); "Your essay: 5/7."
  (no cue word) and "This is a level 4 response." are not detected (fail open);
  "St.Petersburg/Petrograd" or units written like "J.kg/K" look like a
  domain-with-path. Bare IPs, IP/CIDR, bare domains without a path, e-mail
  addresses and `mailto:` are not flagged by `url-policy`.
- Sentence splitting is a heuristic (line breaks, ". " except after common
  abbreviations and initials).
- Code exclusion uses only the current user message, not prior turns.
- `preparedInputUtf8Bytes` counts text bytes only. Token counts are not measured.
- The runtime waits for the callback even if the signal aborts; 01's callback must
  honour the signal it is given.
- The callback reply schema is strict by design: extra keys, an `error.message`
  or a missing `usage` key are contract violations.

## Not claimed

- The real bundle checksum, `python3 -I _build/validate_kb.py history`,
  `python3 -I _build/check_kb_set.py .` and History's handoff/04 rules: **not run or
  read**.
- Token counts and model fit: not measured.
- No provider call and no paid test. The 13 live model release checks were not run.
- Retrieval, library, MyBib and citation requirements: not claimed. The pilot runs
  without tools.
- The gate is not factual, academic or formal verification. `claims` stays `null`;
  no Z3.
- This module alone does not make the website live or turn any subject into a
  tested agent.
