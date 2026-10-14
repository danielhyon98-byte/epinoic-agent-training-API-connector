# Overseer simulation: self-contained training loop

A self-contained environment in which simulated specialist agents answer synthetic
IB student questions. Overseer agents police each answer, and rejected answers go
back to the specialist with the flagged text for diagnosis and revision. After each
cycle, curator agents edit the knowledge documents with what the specialists had to
learn. The process runs for several cycles.

> **What this is and is not.**
> - **Every simulation agent runs on Claude Fable 5.1** (the harness's `fable`
>   alias), at the user's request on 14 October. That covers scenario writers,
>   specialists, the deterministic runner, both overseers and curators. The proposed
>   deployment model for the specialists is still Claude Haiku 5.5
>   (`agents/model-assignment.json`), so simulation results show what the knowledge
>   documents enable on a stronger model, not how Haiku 5.5 would perform. This is
>   not the Anthropic API path, and GPT-6 Luna was not run, because there is no
>   OpenAI access.
> - Each specialist is configured **only** from its supplementary knowledge
>   (`agents/<slug>/knowledge/`) and the shared rules. The real master prompts and
>   knowledge bases were unreachable, so results say nothing about the real
>   specialists.
> - Overseers are language models, so their verdicts are fallible. Two
>   deterministic checks back them up: the runtime gate and the Z3 Logic Translator's
>   `RouterHub`.
> - The agents use no web search, browsing or network. All questions are original
>   and synthetic. No real student text is used.

## The loop

```
for each cycle (knowledge documents are updated between cycles):
  for each specialist (16), in five parallel cluster workflows:
    scenario writer -> 2 original questions (+ supplied texts), each dispatched through the
                       Z3 RouterHub -> explicit request (items, command terms, limits)
    for each question, up to 3 rounds:
      specialist (Fable 5.1)  -> answer, written to the run folder
      deterministic overseer  -> simulation/tools/check-answer.mjs:
                                 runtime gate (URLs, planted canary code, provisional marks,
                                 tagged Sources line) + Z3 RouterHub receipt (arithmetic,
                                 quotations, item coverage, word limits)
      overseer A (substance)  -> (a) text lacking detail, (d) claims without evidence
      overseer B (truth)      -> (b) leaps in logic or factually untrue text, including
                                 fabricated sources; (c) claims without a source
      rejected if: deterministic blocking, or either overseer rejects
                   (any major flag, or 3+ minor flags)
      on rejection: the specialist gets every flagged excerpt and finding, diagnoses
                    each issue (root cause), and writes a full revision
    curator -> edits agents/<slug>/knowledge/ (05-lessons-from-simulation.md, plus
               corrections to 01-04) from the cycle's flags and diagnoses
  cluster synthesis -> proposals for the shared rules, applied by the coordinator
```

## Feedback categories (returned verbatim)

Overseers return the exact text they flag, with a category, severity, explanation and
required fix:

| Category | Meaning |
| --- | --- |
| `a_lacking_detail` | Text too general or thin for the question's command term |
| `b_logic_or_false` | A leap in logic, or a factually untrue statement, including an invented source, quotation or statistic |
| `c_no_source` | A contestable claim that does not say where it comes from |
| `d_no_evidence` | A claim with no concrete evidence: no date, figure, example, quotation or working |

Every flagged excerpt is in `runs/cycle-<n>/<slug>/<qid>/round-<r>/overseer-*.json`
and in the cycle reports under `reports/`.

## Layout

| Path | Contents |
| --- | --- |
| `config/gate-configs.mjs` | SYNTHETIC simulation gate config per slug: tagged sources line, canary code `EPN-SIM-7Q4X` |
| `tools/route-request.mjs` | Dispatch a request through the Z3 RouterHub and write the explicit request |
| `tools/check-answer.mjs` | Deterministic overseer: runtime gate plus Z3 RouterHub receipt |
| `tools/report.mjs` | Builds the cycle reports from the run files |
| `scenarios/cycle-<n>/<slug>.json` | Questions, supplied texts and overseer notes |
| `runs/cycle-<n>/…` | Every answer, diagnosis, deterministic result and overseer report |
| `reports/` | Per-cycle reports and shared-rule proposals |

## Running the deterministic tools

```
export EPINOIC_Z3_PYTHON=/path/to/venv/bin/python   # venv with the Logic Translator installed
node simulation/tools/route-request.mjs --slug economics --request req.txt --out explicit.json
node simulation/tools/check-answer.mjs --slug economics --request req.txt --answer answer.md
```
