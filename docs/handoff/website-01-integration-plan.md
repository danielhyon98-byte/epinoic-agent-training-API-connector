# Smallest website 01 integration plan (History pilot)

For: website Claude 01, which owns `src/chat/`, `src/state/`, `src/router/`,
`public/`, the shared schemas, config, CI and release wiring.
Status: **plan only**. This repository changes no website file. The website
source could not be read from this session, so file names below come from the
coordination handoffs, not from the code. Confirm them against website `main`
before acting.

## Preconditions (none are met yet)

1. The runtime slice is completed against the real source. That means the History
   bundle is exported at a pinned Agent-Training commit, its SHA-256 matches, the
   handoff/04 gate rules are filled, and the package is ported into Agent-Training
   and reviewed. See `specialist-runtime/README.md`.
2. 03's Anthropic and/or OpenAI transport is implemented and reviewed, including
   finish-reason normalisation into `stop | length | refusal | content_filter | unknown`.
3. 04's reserve/claim/settle module and migration 0003 are implemented and reviewed.
4. The 03 and 04 usage shapes are reconciled by their owners.
5. Bruno approves a model, explicit caps and staging-only pilot enablement in a
   reviewed manifest change (`stagingPilotEnabled: true`, never `productionEnabled`).

## Patch, in order

1. **Vendor the package at a pin.** Copy the reviewed `specialist-runtime/src/` into
   the website, for example `vendor/specialist-runtime/`, with a `SOURCE` file
   recording repo, commit and a tree hash. Add the generated
   `history.bundle.mjs` from `tools/export-bundle.mjs`, and record its SHA-256 in the
   same `SOURCE` file. Check the Worker script size limit, since the embedded bundle
   is about 400 KB of base64.
2. **Load once per isolate.** Keep a module-level promise of
   `loadPinnedBundle({ slug: "history", bundleModule, environment })`. If it rejects,
   every History turn fails closed before any authorization or dispatch.
3. **Wire the callback** in the turn path (01's `src/chat/turn.js`, behind a new
   backend value such as `CHAT_BACKEND=specialist`). It runs only when the trusted
   stored subject is `history`:

   ```js
   const result = await runSpecialistTurn({
     slug: "history", mode: PILOT_MODE, environment: env.SPECIALIST_ENVIRONMENT, // "staging-pilot"
     bundle: await historyBundle,
     message, priorTurns,                       // from 01's owned history
     limits: specialistLimits(env),             // from src/state/limits.js + 03's approved bounds
     turn: { conversationId, turnId, turnVersion, attemptId },
     signal: attemptAbortSignal,
     authorizedGenerate: async (prepared, { signal }) => {
       const grant = await budget.reserveAndClaim(/* 04 */);
       if (!grant.ok) return { status: "declined", reason: grant.reason };
       const r = await transport.generate(prepared, { signal });   // 03
       await budget.settle(grant, r.usage);                          // 04; unknown stays unknown
       return r;   // already { status, output, usage, providerEvidence }
     }
   });
   ```

4. **Map outcomes** (see the runtime contract, section 7). Store and return text only
   when `outcome === "answer"`. Every other outcome becomes 01's bounded error result.
   Withheld text is never stored or shown. Set the review field to `not_required`, or
   to `passed` only if 01 explicitly decides "deterministic gate passed" is what
   `passed` means and the disclosure says so.
5. **Log only `redactForLog(result)`.** It carries no answer text, user text, provider
   evidence or keys.
6. **Disclosure copy:** "Checked by automated format rules, not reviewed by a
   teacher. Marks are provisional."
7. **Tests (website side, no live call):** fake 03 transport and fake 04 budget. Cover
   a declined budget (zero transport calls), an abort before and after dispatch, each
   non-answer outcome withholding text, the duplicate-send and retry identity
   unchanged, and History-only gating. Keep the existing suite green.

## Not in this patch

- No router change. The pilot keeps the closed `english`/`history` router and sticky
  subjects. Expanded routing (`specialist-routing/`) needs its own reviewed contract,
  state, UI and D1 change and a fresh calibration (see `specialist-routing.md`,
  section 10).
- No English mapping decision, no other subject, no tools, retrieval, Z3 or claim
  extraction, and no production enablement.
