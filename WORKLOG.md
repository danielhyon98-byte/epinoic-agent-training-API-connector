# Work log

Newest first. Each entry says what changed and what was and was not verified.

## 2026-10-13, session 1, checkpoint 1

- Unpacked `API_Repo_Website_Set_Up_context.zip` into `docs/context/api-repo-website-setup/`
  (9 files, unchanged).
- Recorded access results: `Epinoic-AI/Epinoic-Agent-Training` and `Epinoic-AI/Epinoic-Ai-Website`
  not reachable; no API keys present; this repo and the Logic Translator repo are public.
- Noted the Logic Translator (NL2FOL-inspired) repo, its licence and its 16-agent roster.
- Nothing executed against real knowledge bases, the website or any model provider.

## 2026-10-13, session 1, checkpoint 2

- Published the two interface contracts before code, as both handoffs require:
  `docs/handoff/website-specialist-integration.md` (runtime) and `docs/handoff/specialist-routing.md` (router).
- Added `agents/agents.json` (16-agent roster; 6 slugs from the handoffs, 10 provisional) and
  `agents/_shared/knowledge/00-answering-functionality-core.md` (cross-subject answering rules).
- Source pins in both contracts are copied from the handoffs and are NOT verified (repos unreachable).

## 2026-10-13, session 1, checkpoint 3

- Added `agents/model-assignment.json` (proposal): Claude Haiku 5.5 primary for all 16 agents,
  GPT-6 Luna as comparison/fallback candidate, with an evidence-based switch rule.
- Added `agents/handoff-spec.json` (per-agent focus, neighbours, clarify triggers, checkable habits,
  7 original synthetic probe messages each) and `agents/tools/generate-handoffs.mjs`.
- Generated 48 files: per agent `README.md`, `HANDOFF-CLAUDE-HAIKU-5-5.md`, `HANDOFF-GPT-6-LUNA.md`.
  `--check` mode confirms they are up to date.
- No model was called; the probe messages have not been run on any model.

## 2026-10-13 to 14, session 1, final

- Supplementary knowledge complete: 16 agents x (README + 01-04), all original. The shared answering rules
  were revised to v0.1.4 from five subject reviewers' feedback. `check-knowledge.mjs` passes.
  Worked-example arithmetic, maths and chemical equations were checked by script; the science set reports 17/19
  equations balance, and the 2 that don't are deliberately wrong examples.
- `specialist-runtime/` complete: 117 tests pass, `check:portable` OK. Implementation clarifications added to its
  contract (section 11). Website limits from the handoff are recorded as reference-only values.
- `specialist-routing/` complete: 175 tests pass. The evaluator passes over 260 original synthetic items
  (153 tune / 107 holdout, mechanics 260/260); these are policy-mechanics results, not accuracy.
  Clarifications added to its contract (section 10).
- `tools/cross-check.mjs`: the runtime's capabilities are accepted by the router; nothing routes while
  everything is disabled.
- `docs/handoff/PASTE-READY-NOTES.md` added.
- Correction on record: commits `f0216bb` and `da63361` described shared-rule changes that an edit script had
  failed to write. Those changes landed in `e1d5bfb` and `04626c9`. Later edit scripts stop on the first error.
- Still not done: anything needing the private repos, API keys or approval. That covers the real bundle,
  validators, handoff/04 rules, real catalogue, token counts, Fastino label check, live tests, website
  integration and enablement.
