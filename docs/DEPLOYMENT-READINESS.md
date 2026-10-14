# Deployment readiness and Z3 integration (checked 14 October 2026)

**Answer: not ready.** The specialist agents are not deployable on the website, and
the Z3 Logic Translator is not wired into the live answer path. Both facts come from
running `node tools/readiness-check.mjs`, not from assertion. Re-run it after any
change. It exits 0 only when no blocker remains.

## Checks

| Area | Check | Result | Detail |
| --- | --- | --- | --- |
| runtime | Manifest validates | PASS | validateManifest(RUNTIME_MANIFEST) |
| runtime | Manifest source verified | **BLOCKER** | sourceStatus = unverified-source |
| runtime | History source commit pinned | **BLOCKER** | source.commit = null |
| runtime | History bundle path pinned | **BLOCKER** | source.bundlePath = null |
| runtime | History KB version pinned | **BLOCKER** | kbVersion = null |
| runtime | History bundle SHA-256 verified | **BLOCKER** | bundleSha256Status = reported-by-audit-02-not-verified |
| runtime | History gate rules loaded (handoff/04) | **BLOCKER** | pending: internal-code-leakage, provisional-mark, sources-line |
| runtime | History enabled for staging pilot | **BLOCKER** | stagingPilotEnabled = false (needs reviewed enablement) |
| runtime | Specialists available in staging-pilot | **BLOCKER** | 0 of 1 manifest entries available |
| runtime | Specialists available in production | **BLOCKER** | 0 of 1 manifest entries available |
| runtime | Other 15 specialists in manifest | not met (non-blocking) | 1 manifest entry (History only, by design for the pilot) |
| routing | Catalogue built from real packages | **BLOCKER** | synthetic = true |
| routing | Production routing policy approved | **BLOCKER** | PRODUCTION_POLICY.status = unapproved |
| routing | Calibration record present | **BLOCKER** | calibration = null |
| routing | All specialist slugs verified | **BLOCKER** | 10 provisional: economics, business-management, psychology, geography, spanish-b, computer-science, physics, chemistry, biology, ess |
| provider | ANTHROPIC_API_KEY available to this environment | **BLOCKER** | not set; keys belong in the Worker's secret store, set by the website owner |
| provider | OPENAI_API_KEY available to this environment | not met (non-blocking) | not set (only needed if GPT-6 Luna is approved) |
| website | Website repository reachable from this session | **BLOCKER** | Epinoic-AI/Epinoic-Ai-Website: 'you don't have access' (add_repo, 14 Oct) |
| website | Website integration patch applied | **BLOCKER** | plan only: docs/handoff/website-01-integration-plan.md; owned by website 01 |
| website | Website contract accepts more than english/history | **BLOCKER** | per handoff: public IDs and D1 route enum allow only english/history |
| z3 | Translator installed and importable | PASS | EPINOIC_Z3_PYTHON = <venv>/bin/python |
| z3 | Z3 router catches a wrong worked step | PASS | formal_errors = 1, status = ACCEPTED_WITH_FINDINGS |
| z3 | Z3 router passes the correct step | PASS | formal_errors = 0, status = ACCEPTED |
| z3 | Runtime result carries Z3/claims output | **BLOCKER** | claims = null by design: the handoffs defer Z3 and claim extraction |
| z3 | Translator can run inside the Cloudflare Worker | **BLOCKER** | No: Python + z3-solver; the translator README says it does not run in a Worker. Needs a separate service (POST /v1/verify, never deployed) |
| z3 | Translator service deployed | **BLOCKER** | translator docs: 'Nothing in this repository is deployed' |

Deployment ready: NO (20 blockers)

## What the checks mean

### 1. The agents cannot be deployed yet

- **The real knowledge bases were never read.** `Epinoic-AI/Epinoic-Agent-Training` and
  `Epinoic-AI/Epinoic-Ai-Website` refuse this session's GitHub credential. So the
  History bundle's checksum, its validators and its handoff/04 gate rules are
  unverified. The runtime correctly refuses to run History, and every capability
  reports `available: false`.
- **Nothing is enabled, by design.** Production and staging enablement need a
  reviewed manifest change once the pins are verified. The handoffs forbid enabling
  anything in this slice.
- **No API key exists here,** and keys belong in the Worker's secret store set by
  the website owner, never in this repo.
- **The website side is not done.** It needs the integration patch
  (`docs/handoff/website-01-integration-plan.md`), the provider transports (task 03)
  and budget (task 04). For any subject beyond English and History, it also needs
  contract, state, D1 and UI changes.
- **The router is uncalibrated and its catalogue is synthetic.** Ten folder slugs
  are guesses.

### 2. Z3: works offline, not wired into the website

- **Works:** the translator installs (z3-solver 5.1.0). Its suite gives 4,279 passed,
  1 skipped, 4 xfailed (documented pre-existing defects) and 45 stress tests
  deselected. The service tests were **not** run: installing their extras (fastapi
  and others) was blocked by this session's safety classifier.
- **The Z3 router is now used** by `integration/z3/check_answer.py` and the simulation.
  Requests are dispatched through `RouterHub`, which makes them explicit: items,
  command terms and limits. Answers are received through the same hub task. The
  receipt then carries Z3 checks of the answer's own arithmetic, quotation grounding,
  item coverage and formally checked limits such as word bounds.
- **Not in the live path:**
  - The translator is Python and does not run in a Cloudflare Worker, so the website
    would need it as a separate, deployed service (`POST /v1/verify`), which does
    not exist yet.
  - The handoffs deliberately defer Z3 and claim extraction, so the runtime's
    `claims` field is `null`.

## Current problems with this repository

1. **It is public.** The context documents say proprietary prompts and knowledge must
   stay private. Make it private before any master prompt, bundle text or extracted
   internal code is added.
2. **It was built without the source of truth.** Every pin, the catalogue and ten
   slugs need re-checking against `Epinoic-AI/Epinoic-Agent-Training`.
3. **There may be two owners.** If other Daniel Claude sessions already own
   `specialist-runtime/` or `specialist-routing/` in Epinoic-AI, these copies must be
   reconciled with that work rather than run alongside it.
4. **The gate is a heuristic.** For example, "I would give a similar paragraph 5/7"
   slips past the provisional-mark rule because the sentence has no assessment word.
   The known misfires are pinned by tests and listed in `specialist-runtime/README.md`.
5. **The translator repository** is public although its licence says "confidential".
   It has 4 documented xfail defects. Its own arena never reached its 0.98 target
   (round 7 lens scores: 0.53, 0.42, 0.75, 0.64).
