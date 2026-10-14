# Paste-ready hand-back notes

Repository: `danielhyon98-byte/epinoic-agent-training-API-connector`, branch
`claude/eloquent-euler-1kuwtf`. **The repository is public. Make it private before
adding any proprietary text.** Chats do not share memory, so give each reader the
exact commit you are pointing them at. Each note below is meant to be pasted on
its own.

---

## For Daniel and Bruno

Session of 13–14 Oct (Daniel's Claude). Branch `claude/eloquent-euler-1kuwtf` on
`danielhyon98-byte/epinoic-agent-training-API-connector` (public: make it private).

**Blocked:** `Epinoic-AI/Epinoic-Agent-Training` and `Epinoic-AI/Epinoic-Ai-Website`
returned "you don't have access" from this session's GitHub credential. No API
keys were present. So nothing was checked against the real knowledge bases or the
website, no model was called, and no agent is live. The fix is to reconnect GitHub
for the session and install the Claude GitHub App on the Epinoic-AI org with both
repos selected, then start a new session with those repos.

**Built offline (tests pass):**
- `specialist-runtime/`: History pilot package per
  `docs/handoff/website-specialist-integration.md`. 117 tests. Manifest pins are
  pending, nothing is enabled, and the History gate rules are pending handoff/04.
- `specialist-routing/`: 16-specialist selection package per
  `docs/handoff/specialist-routing.md`. 175 tests. A 260-item original synthetic eval
  set gives a policy-mechanics PASS (not accuracy). The catalogue is synthetic and
  the production policy is unapproved.
- `agents/`: 16 specialists. Each has a Claude Haiku 5.5 handoff, a GPT-6 Luna
  handoff, and five supplementary knowledge docs. There are also shared answering
  rules (v0.1.4).
- The model assignment is a **proposal**: Haiku 5.5 primary for all 16, GPT-6 Luna
  as the tested comparison and fallback, and a switch only on evidence.

**Needs a decision:**
1. Make this repo, and the Logic Translator repo whose licence says "confidential",
   private.
2. The real folder slugs for the 10 provisional subjects.
3. The scope of `english-specialist`.
4. Approve or change the model assignment.
5. Whether these packages move into Agent-Training. If another Daniel Claude
   already owns `specialist-runtime/` or `specialist-routing/` there, reconcile
   first; there must not be two owners.

**Not claimed:** the validators, real bundle SHA-256, handoff/04 rules, token
counts, Fastino label capacity, any live or paid test, website integration, Z3.

---

## For website 01

The History runtime contract is `docs/handoff/website-specialist-integration.md`;
section 11 lists the clarifications. Exports, result shape and outcomes are in
sections 3 and 7. The integration plan is in
`docs/handoff/website-01-integration-plan.md`.

- One `authorizedGenerate(prepared, { signal })` callback, invoked at most once.
  Answer text appears only when `outcome === "answer"`.
- Log only `redactForLog(result)`.
- The browser review enum mapping is your call. A deterministic gate pass is not a
  review.
- The routing contract is `docs/handoff/specialist-routing.md`. It is a portable
  selection layer, not an adapter. Section 11 lists the website changes needed to
  route beyond English and History: contract, state and D1 enums, UI, a fresh
  calibration, and adapter mapping. None was made.
- Nothing here changes `src/router/`, PR19 or any website file.

---

## For website 03 (transports) and 04 (budget)

- The runtime consumes `finishReason` in `stop | length | refusal | content_filter | unknown`.
  A raw provider value such as `tool_use` is a contract violation, so normalise
  first.
- `usage` and `providerEvidence` pass through verbatim, and null means unknown.
  The runtime never sums tokens or computes prices.
- 03 and 04 still need to reconcile the usage schema with each other. This package
  adds no third one.
- Suggested request mappings for the Anthropic Messages and OpenAI Responses APIs
  are in each agent's handoff file, section 3 ("API notes"). They are suggestions
  only.

---

## For Codex (review)

Please review:
- the runtime bridge (`specialist-runtime/src/bridge.js`): at most one callback call,
  and fencing on pre- and post-dispatch aborts;
- the gate heuristics (`src/gate/`): provisional-mark scoping and the URL policy,
  with known misfires listed in the package README;
- the router policy order (`specialist-routing/src/select.js`): mixed before family,
  no highest-score tie-break, unavailable never replaced.

Reproduce with the commands in the top-level README (Node 22, no dependencies, no
network).

The synthetic fixtures are labelled. The fixture policy cannot load as production,
and `PRODUCTION_POLICY` returns `calibration_missing`. The supplementary knowledge
docs need subject-teacher review; their worked arithmetic was script-checked.
