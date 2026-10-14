# Website specialist integration: History pilot runtime contract

Owner: Daniel's first Claude (specialist-integration lane). Package: `specialist-runtime/`.
Status: **offline slice, source pins unverified** (see "Source pins").
Contract version: `epinoic.specialist-runtime.v0.1.0`.

This is the short contract the handoff asks for before code. Website 01, provider
transports 03 and generation budget 04 can read it to see what the package
exports, what it needs from them and what it returns. Read it at the exact commit
reported to Daniel/Bruno. Chats do not share memory.

## 1. Source pins

| Source | Pin from the coordination handoff | Verified in this session? |
| --- | --- | --- |
| Agent-Training `main` | `651d71ded41d4a3b8a106fe23b4198e7fc292146` | **No.** Repository not reachable. |
| Agent-Training `docs/api-agents-handoff` (PR1) | `2b157286947830578453fff35a3d990cad179d78` | **No.** |
| Website `main` | `2cd318208980e5b236d16b4281dfc0560a7b9610` | **No.** |
| Website audit 02 `docs/specialist-pilot-contract` | `7a351df6eabdf6bde3bf715f74e274bf8a9f5cc5` | **No.** |
| Website 03 `feature/provider-transports` | `ac97e2e252e4f6f4f207f9133e836cfe1ed7dd61` (interface draft only) | **No.** |
| Website 04 `feature/generation-budget` | `cb58dcee36176f02a7cd9e7ae6bad6b734e6de07` (contract draft only) | **No.** |
| History bundle SHA-256 (reported by audit 02) | `a5b8a2da6feb447ea06d9e38946ba50f71b14495e517169b5b3a418530119240` | **No.** Recorded in the manifest as `reported-by-audit-02-not-verified`. |

Because none of these could be read, this package was written in the separate
`danielhyon98-byte/epinoic-agent-training-API-connector` repository, using the
directory layout the handoff proposes for Agent-Training. Before it is used:

1. Re-run this work against a real Agent-Training checkout (see
   `specialist-runtime/README.md`, "Completing the slice against the real source").
2. Port the reviewed package into Agent-Training on its own branch, for example
   `feature/history-specialist-integration`.
3. If another Daniel Claude already owns `specialist-runtime/` there, reconcile with
   it first. Do not run two owners.

## 2. Boundary

The package **does**: verify the pinned History bundle and manifest, prepare one
bounded no-tools request with the mandatory bundle intact, invoke an injected
authorized-generation callback **at most once**, run History's deterministic
format/policy gate, and return an internal result with provenance.

The package **does not**: call a provider, read or hold API keys, fetch, retry, fall
back, revise, stream, run tools, retrieve, use MyLib or a library manifest, store
conversations, invent conversation or turn IDs, compute prices or caps, reserve or
settle budget, write D1 migrations, enable production, or call Z3 or the
translator. The browser never sees its internals.

## 3. Exports (`specialist-runtime/src/index.js`)

All runtime exports are portable ES modules. They use only `globalThis.crypto.subtle`,
`TextEncoder`/`TextDecoder` and `atob`, which exist in Cloudflare Workers and Node 22.
They have no filesystem, network, `process` or Node built-in imports. Build-time
tools in `specialist-runtime/tools/` may use Node.

| Export | Kind | Purpose |
| --- | --- | --- |
| `RUNTIME_CONTRACT_VERSION` | string | `"epinoic.specialist-runtime.v0.1.0"` |
| `PILOT_MODE` | string | `"pilot-single-turn-no-tools"`, the only supported mode |
| `RUNTIME_MANIFEST` | frozen object | The authoritative runtime manifest (section 4) |
| `REPORTED_WEBSITE_LIMITS` | frozen object | Website limits as reported in the handoff, for reference only. They are **not** defaults. |
| `validateManifest(manifest)` | function | Structural and enablement invariants |
| `getCapabilities({ environment })` | function | Capabilities for the router (section 9) |
| `loadPinnedBundle({ slug, bundleModule, environment })` | async | Decodes and SHA-256-verifies an exported bundle module. Returns a frozen `VerifiedBundle` or throws `RuntimeIntegrityError`. |
| `prepareTurn(input)` | async | Builds the bounded `PreparedRequest` (section 6) |
| `runSpecialistTurn(input)` | async | The one-turn bridge (section 7) |
| `runGate({ slug, gateConfig, answerText, finishReason, userMessage })` | function | Deterministic gate (section 8) |
| `HISTORY_GATE_CONFIG` | frozen object | Pinned History gate configuration. It is currently **pending handoff/04**, so History-specific checks report `unsupported`. |
| `createOfflineTestRuntime({ manifest, gateConfigs })` | function | A separate, explicit runtime for fixtures. It accepts only `environment: "offline-test"`. |
| `redactForLog(result)` | function | Log-safe projection: no answer text, user text, provider evidence or keys |

## 4. Runtime manifest

```js
RUNTIME_MANIFEST = {
  schema: "epinoic.specialist-runtime-manifest.v1",
  manifestVersion: "2026-10-13.0",
  sourceStatus: "unverified-source",            // becomes "verified" only after a real-checkout export
  entries: [{
    slug: "history",                            // canonical ID
    displayName: "History",
    source: {
      repo: "Epinoic-AI/Epinoic-Agent-Training",
      commit: null,                             // PENDING: set by a reviewed export
      bundlePath: null                          // PENDING
    },
    kbVersion: null,                            // PENDING
    bundleSha256: "a5b8a2da6feb447ea06d9e38946ba50f71b14495e517169b5b3a418530119240",
    bundleSha256Status: "reported-by-audit-02-not-verified",
    supportedModes: ["pilot-single-turn-no-tools"],
    gateVersion: "history-gate/0.1.0",
    libraryManifestVersion: null,               // no library in the pilot
    productionEnabled: false,
    stagingPilotEnabled: false
  }]
}
```

These invariants are enforced by `validateManifest` and tested:

- Slugs are unique, lowercase and kebab-case.
- An entry may set `productionEnabled` or `stagingPilotEnabled` to true only when
  `source.commit`, `source.bundlePath` and `kbVersion` are set and
  `bundleSha256Status === "verified"`. Pending pins therefore cannot be enabled.
- `productionEnabled: true` is refused by this package version under any
  conditions. Production enablement is a separate, reviewed change.
- Only `history` has an entry. Other specialists are absent, which is not the same
  as disabled-but-known. The registry stays extensible: adding an entry means
  adding the same fields plus a gate configuration.

## 5. Bundle module (build time to runtime)

`tools/export-bundle.mjs` runs in Node against a **clean, real Agent-Training
checkout** at a pinned commit:

```
node specialist-runtime/tools/export-bundle.mjs \
  --kb-checkout /path/to/Epinoic-Agent-Training \
  --commit <40-hex commit> \
  --slug history \
  --bundle-path <path of the History bundle inside the checkout> \
  --out specialist-runtime/dist/history.bundle.mjs
```

It refuses to run unless `HEAD` equals `--commit` and the bundle path has no
uncommitted changes. It refuses a SHA-256 that differs from the manifest. It writes:

```js
export const BUNDLE = Object.freeze({
  schema: "epinoic.specialist-bundle-module.v1",
  slug: "history", sourceRepo, sourceCommit, bundlePath, kbVersion,
  sha256: "<hex of the exact file bytes>", byteLength: <n>,
  base64: "<exact file bytes, base64>"
});
```

The exact bytes are embedded, so BOM and line endings survive. At runtime
`loadPinnedBundle` recomputes SHA-256 over the decoded bytes and compares it with
both the module and the manifest. It then decodes UTF-8 with `fatal: true`.
`dist/` is git-ignored, because this repository is public and the bundle is
proprietary.

Failure before generation (all tested): unknown slug, a slug the environment does
not enable, a module/manifest slug mismatch, a checksum mismatch, invalid base64
and invalid UTF-8.

## 6. Prepared request

`prepareTurn({ slug, mode, environment, bundle, message, priorTurns = [], limits })`

- `message`: the current user message, already validated by website 01.
- `priorTurns`: optional `[{ role: "user" | "assistant", text }]` supplied by the
  website from its owned history. The runtime does not store them.
- `limits` (**required**, supplied by the website from 01/03 configuration):
  `maxMessageCodePoints`, `maxPriorTurns`, `maxPriorTurnsUtf8Bytes`,
  `maxPreparedInputUtf8Bytes`, `maxAnswerUtf8Bytes`, and optionally `maxOutputTokens`,
  which is passed through.

Returns `{ ok: true, request }` or `{ ok: false, failure: { stage: "precondition", code } }`:

```js
PreparedRequest = {
  schema: "epinoic.prepared-specialist-request.v1",
  slug, mode,
  instructions: [
    { kind: "mandatory-bundle", text: <bundle text, byte-identical>, sha256 },
    { kind: "runtime-notice", version: "pilot-notice/0.1.0", text: <short notice: no tools, no retrieval, no browsing> }
  ],
  messages: [...priorTurns, { role: "user", text: message }],
  tools: [],                               // always empty in this mode
  bounds: {
    preparedInputUtf8Bytes, maxOutputTokens /* or null */,
    tokenCount: null, tokenCountStatus: "not-measured"
  },
  provenance: { ...see section 7 }
}
```

The bundle is never trimmed, summarised or reordered. An input over
`maxPreparedInputUtf8Bytes` fails with `prepared_input_exceeds_bound`, and nothing is
dispatched. Token fit is **not** inferred from bytes. 03 and the approved model
configuration must measure it with the provider's token counter before any live test.

The runtime notice is an addition after the bundle, not an edit of it. It is
versioned and shown in full in `specialist-runtime/src/prepare.js` for review.

Suggested transport mapping, for 03 to decide: for Anthropic Messages, one `system`
text block per instruction, with the bundle block marked cacheable. For OpenAI
Responses, the instructions are joined in order into `instructions` with a fixed
separator. The `messages` become `input`/`messages`.

## 7. One-turn bridge

```js
runSpecialistTurn({
  slug, mode, environment, bundle, message, priorTurns, limits,
  turn: { conversationId, turnId, turnVersion, attemptId },  // website-owned, echoed only
  authorizedGenerate,                                          // injected by website 01
  signal                                                       // AbortSignal, optional
}) -> Promise<SpecialistTurnResult>
```

### The injected callback

Website 01 supplies `authorizedGenerate(preparedRequest, { signal })`. It wraps 04
(eligibility, reserve and claim immediately before dispatch, then settle) and 03
(transport, error and usage normalisation). It must resolve to exactly one of:

```js
{ status: "declined", reason: "<code>" }          // nothing was dispatched
{ status: "completed",
  output: { text: string, finishReason: "stop" | "length" | "refusal" | "content_filter" | "unknown" },
  usage: <03's normalised usage object> | null,   // null = unknown
  providerEvidence: <03's evidence object> | null }
{ status: "failed", error: { code: string }, usage: object | null, providerEvidence: object | null }
```

Rules (all tested):

- Every precondition (manifest, enablement, mode, bundle integrity, limits, prepare)
  is checked **before** the callback. A failure gives `callbackInvocations: 0`.
- An aborted `signal` before dispatch gives `cancelled` with zero invocations.
- An admitted turn calls the callback **at most once**. There is no retry, fallback,
  revision or second call on any path.
- `declined` means no downstream call. The result records `authorization: "declined"`.
- A thrown callback or a reply outside the shapes above gives `failed`, with code
  `callback_threw` or `callback_contract_violation`. Usage becomes `unknown`, never
  zero, because a dispatch may have happened.
- An abort that arrives after the callback returns fences the result. The outcome
  is `cancelled`, the answer is withheld, and usage and evidence are kept, because
  stop does not prove the request cost nothing.
- Output that reports tool calls is a contract violation in this mode.

### Result

```js
SpecialistTurnResult = {
  schema: "epinoic.specialist-turn-result.v1",
  contractVersion: "epinoic.specialist-runtime.v0.1.0",
  outcome: "answer" | "precondition_failed" | "declined" | "cancelled" | "failed"
         | "refusal" | "incomplete" | "oversize" | "gate_failed" | "gate_unverifiable",
  answer: string | null,                 // non-null ONLY when outcome === "answer"
  failure: { stage, code } | null,       // stage: precondition|authorization|generation|completion|gate
  completion: { finishReason: string | null, outputUtf8Bytes: number | null },
  gate: {
    kind: "deterministic-format-policy",
    version, configVersion,
    status: "passed" | "failed" | "unverifiable" | "not_run",
    checks: [{ id, status: "pass" | "fail" | "unsupported", code }],   // codes only, never answer text
    disclaimer: "Deterministic format and policy heuristics. Not factual, academic or formal verification."
  },
  usage: object | null,                  // verbatim from the callback; never computed here
  usageStatus: "reported" | "unknown",
  providerEvidence: object | null,       // verbatim from the callback (03 owns its shape)
  dispatch: { callbackInvocations: 0 | 1, authorization: "not_requested" | "declined" | "admitted" | "unknown" },
  provenance: {
    manifestVersion, slug, sourceRepo, sourceCommit, kbVersion, bundleSha256,
    gateVersion, gateConfigVersion, runtimeNoticeVersion, mode,
    libraryManifestVersion: null, toolsRun: [], retrieval: null, claims: null
  },
  turn: { conversationId, turnId, turnVersion, attemptId }   // echoed unchanged
}
```

How outcomes are decided once the callback completes:

| Condition | Outcome | Answer |
| --- | --- | --- |
| `finishReason` is `refusal` or `content_filter` | `refusal` | withheld |
| `finishReason` is `length`, or the text is empty | `incomplete` | withheld |
| UTF-8 size over `limits.maxAnswerUtf8Bytes` | `oversize` | withheld, **never truncated** |
| Any required gate check fails | `gate_failed` | withheld |
| No check fails, but a required check is `unsupported` (for example an unknown finish reason, or a pending History rule) | `gate_unverifiable` | withheld |
| All required checks pass | `answer` | returned |

A specialist's clarifying question, such as "Which paper is this for, SL or HL?", is
a normal in-subject answer. It is **not** parsed into a router clarification.

### Suggested website 01 mapping (01 decides)

| Runtime outcome | Browser review enum | User-facing handling |
| --- | --- | --- |
| `answer` | `not_required`. A deterministic gate pass is not a review. Use `passed` only if 01 decides that "deterministic gate passed" is what `passed` means, and say so in the disclosure. | Show the answer |
| `gate_failed`, `gate_unverifiable`, `incomplete`, `oversize`, `refusal` | none, because no answer is shown | Bounded safe error. The answer text is not stored as a result. |
| `declined` | none | "Temporarily unavailable" or budget message from 04 |
| `cancelled` | none | Existing attempt-fencing behaviour |
| `failed`, `precondition_failed` | none | Generic error. Log `redactForLog(result)` only. |

## 8. History deterministic gate

`runGate` runs these checks. Each returns `pass`, `fail` or `unsupported`, never an
assumed pass.

| Check id | What it checks | Pinned History config today |
| --- | --- | --- |
| `completeness` | `finishReason === "stop"` and non-empty text. An unknown finish reason is `unsupported`. | Generic, active |
| `url-policy` | No `scheme://`, `www.` or bare domain-with-path in the answer. No tools ran, so no URL can have been checked. | **Pilot default** `forbid_all`, pending reconciliation with handoff/04 |
| `internal-code-leakage` | Exact, boundary-matched internal codes from the pinned bundle. Codes present in the user's own message are excluded. A benign allowlist covers paper names, HL/SL, dates and ordinary brackets. | **Pending.** Codes come from the bundle via `tools/extract-codes.mjs`, so the check is `unsupported` |
| `provisional-mark` | Every awarded mark, band, level or grade mention has the provisional label in the same sentence. "Worth 15 marks", "a 15-mark question" and "[15 marks]" are exempt. | **Pending** the label rule from handoff/04, so the check is `unsupported` |
| `sources-line` | The sources line follows the configured rule, and in no-tools mode it lists no URLs or references. | **Pending** the rule from handoff/04, so the check is `unsupported` |

With the pinned config, a History answer can at best be `gate_unverifiable`. That
is intended: no History answer can pass until the real handoff/04 rules and bundle
codes are loaded. The offline tests use a separate synthetic gate config, loaded only
through `createOfflineTestRuntime`, to exercise pass and fail paths. The tests also
include benign counterexamples: paper names, "HL", years and date ranges, ordinary
brackets, "e.g." and "U.S.", decimal numbers, quoted user material and question-value
phrases.

These checks are fallible heuristics. They do not verify facts, historical accuracy,
interpretation or academic quality, and they are not Z3 or formal verification.

## 9. Capabilities for the router

```js
getCapabilities({ environment }) -> {
  schema: "epinoic.specialist-capabilities.v1",
  runtimeContractVersion, manifestVersion, environment,
  entries: [{ slug, available: boolean, supportedModes, gateVersion, bundleSha256 }]
}
```

`available` is true only when the manifest enables the slug for that environment.
Today every entry is `available: false`. The router consumes this object and keeps
no second availability registry.

## 10. Consumed from 03 and 04

| From | What this package relies on | Status |
| --- | --- | --- |
| 03 | A normalised `finishReason` in the closed set above, `usage` as 03 defines it (passed through untouched), `providerEvidence` (passed through), input and output bounds (`maxPreparedInputUtf8Bytes`, `maxOutputTokens`) | 03 is an interface draft. The 03 total-plus-cache usage shape and the 04 disjoint priced categories still need reconciling **by their owners**. This package invents no third usage schema and never adds up tokens. |
| 04 | Authorization happens inside the injected callback, immediately before dispatch. A decline returns `{status:"declined"}`. Settlement uses 03's usage. | 04 is a contract draft and reserves migration 0003. This package writes no ledger and no migration. |

## 11. Clarifications made during implementation (still v0.1.0)

Each gap the implementer found was resolved with the stricter reading. These
are binding for consumers:

1. **Environments** are exactly `"production"`, `"staging-pilot"` and `"offline-test"`.
   The pinned runtime refuses `"offline-test"`. `createOfflineTestRuntime` refuses
   the other two.
2. **Portable globals** used by `src/` are `crypto.subtle`, `TextEncoder`,
   `TextDecoder`, `atob`, `btoa` and `AbortSignal`. They exist in Workers and in
   Node 22. `tools/check-portable.mjs` enforces the list.
3. **`bundle`** in `prepareTurn` and `runSpecialistTurn` must be the `VerifiedBundle`
   returned by `loadPinnedBundle`. It is re-hashed against the manifest on every
   call. Passing a raw bundle module gives `bundle_not_verified`.
4. **Export provenance:** `export-bundle.mjs` takes an optional `--kb-version`. When
   the manifest pins `commit`, `bundlePath` or `kbVersion`, the export must match
   them. `loadPinnedBundle` requires the module's provenance to equal the
   manifest's, so re-export after the reviewed pin commit. The export also refuses
   a dirty tree and an output path that is not git-ignored.
5. **Staging enablement** additionally requires the manifest's top-level
   `sourceStatus: "verified"`. The offline fixture manifest uses a separate
   profile, with `offlineTestEnabled`, `environment` and a `SYNTHETIC` label, which
   the pinned profile refuses.
6. **`available`** in `getCapabilities` is true only when the manifest enables the
   slug for that environment **and** a valid gate configuration exists.
7. **`usageStatus`** is `"unknown"` whenever `usage` is null, including when nothing
   was dispatched. Use `dispatch.callbackInvocations` to tell the two apart.
8. **An abort observed after the callback returns** fences every reply kind
   (completed, declined, failed or threw). The result is `cancelled` with code
   `aborted_after_callback`. Usage and evidence are kept when the reply carried
   them.
9. **Strict reply shapes:** the keys must match exactly. `usage` and `providerEvidence`
   are required keys (null allowed). `error` is exactly `{ code }`. Decline reasons
   and error codes must be code-like (`[a-z0-9_.-]`). A `finishReason` outside the
   closed set, such as a raw `tool_use`, is a contract violation, so 03 must
   normalise first. Any `tools` input, even `[]`, is refused, and so is any
   unknown input field.
10. **`RuntimeIntegrityError`** is not exported. Callers test `err.name` and
    `err.code`.
11. **Synthetic gate configs** load only through `createOfflineTestRuntime`, which
    has its own `runGate`. The top-level `runGate` refuses them.
12. **Gate configs** must define all five checks, all required. A code list that
    contains benign tokens (paper names, HL/SL, years, "[15 marks]") is refused.
13. **Provisional-mark scoping:** "N marks", "band N", "markband", "grade N/A to E"
    and "awarded/scored N" always count as an award. "a/b", "N out of M", "level N",
    "top band" and "7-9 band" count only when the sentence also has an assessment
    word. Ordinary vocabulary passes: "5% significance level", fractions in
    working, "high-level language", "broadband", "sea level". The known misfires
    are pinned by tests and listed in the package README.
14. **URL policy** flags only `scheme://`, `www.` and domain-with-path. A bare IP
    address such as `192.168.1.10` passes.
15. **Turn IDs** must be exactly the four keys, each a non-empty string or a
    non-negative integer. Prior turns are validated but never trimmed. Role
    alternation is left to 03.
16. **Confidentiality:** codes extracted from the proprietary bundle would sit in
    `HISTORY_GATE_CONFIG`. This repository is public, so make it private, or keep
    the extracted list outside it, before filling the config.

## 12. What is not run or not claimed

- The real bundle checksum, the History validators (`python3 -I _build/validate_kb.py history`,
  `python3 -I _build/check_kb_set.py .`) and History's handoff/04 gate rules: **not run or
  read.** The source was unreachable.
- Token counts and model fit: not measured.
- No provider call and no paid test. The 13 live model release checks were not run.
- Retrieval, library, MyBib and citation requirements: not claimed. The pilot runs
  without tools.
- This module alone does not make the website live or turn any subject into a
  tested agent.
