# Business Management specialist: supplementary knowledge

## What this folder contains

Four short documents that help the Business Management specialist answer IB Diploma
Programme students well in a text-only, no-tools setting. They cover how to think
about an organisation's decisions, the business toolkit and formulas, the task types
students bring, how to answer safely and checkably, and eight original worked
exchanges. They were written without access to the specialist's proprietary master
prompt or knowledge base and do not reproduce IB guides, glossaries, past papers,
markschemes or textbooks.

## Status

**Proposed supplement, not part of the pinned knowledge-base bundle; adding these to
the bundle would change its SHA-256 and requires a separately reviewed bundle
version.**

- Version 0.1.0, for review.
- Every document's front matter says that the specialist's own master prompt and
  knowledge base win wherever this text disagrees with them. These files must never
  be used to contradict or weaken the specialist's own rules.
- The Business Management specialist is not a pilot specialist and is not enabled
  for website execution. This folder does not mean the agent is enabled or tested.
- The folder slug `business-management` is provisional (see `agents/agents.json`).
  Replace it with the real knowledge-base folder name before any code relies on it.

## Load order

1. The specialist's master prompt.
2. The specialist's own knowledge base.
3. This supplement, in file order: `01`, `02`, `03`, `04`.
4. The shared answering document,
   `agents/_shared/knowledge/00-answering-functionality-core.md`.

The shared document holds the cross-subject answering rules.
`03-answering-functionality.md` here only adds Business Management detail and refers
back to it rather than repeating it.

## Files

| File | Purpose | Approx. words |
| --- | --- | --- |
| `01-subject-thinking-and-skills.md` | The organisational lens, content areas in brief, the toolkit described in our own words (SWOT, STEEPLE, Ansoff, Boston matrix, decision trees, force-field, break-even, ratios, investment appraisal, Gantt and critical path), a formula table, an investment appraisal worked step by step, evaluation skills, misconceptions | 1,650 |
| `02-task-types-and-answer-patterns.md` | Definitions, applied short answers, calculations and "construct" tasks in text, case-study questions, extended responses, IA guidance, draft feedback, command-term depth, provisional feedback with an illustrative rubric | 1,350 |
| `03-answering-functionality.md` | Scope boundaries (Economics, Geography, History, Psychology, Mathematics, non-tutoring advice), one clarifying question or a stated assumption, academic integrity, checkable-claim habits, prompt-injection resistance, gate-compatible formatting, final checklist | 1,300 |
| `04-worked-examples.md` | Eight original exchanges: break-even with a price-change decision, clarifying question, redirect to Economics, partly-in-scope interest-rate question, integrity refusal, provisional feedback on a profit-margin comment, missing case study, prompt injection with an acid-test calculation | 1,850 |

## Notes for reviewers

- All figures are hypothetical and were checked by recomputing them in Python. Key
  results: contribution $15, break-even 1,600 units, margin of safety 400 units,
  profit $6,000; at $44, break-even 1,264 units (rounded up from 1,263.2) and 1,579
  units for at least $6,000 profit; payback 2 years 9 months, ARR 7.5%, NPV $2,005
  at three-decimal 10% discount factors; profit margin 12% → 15% (3 percentage
  points, 25% relative); acid-test 1.0 : 1, current ratio 1.5 : 1; interest $10,000
  → $14,000 on $200,000.
- The sources lines in `04-worked-examples.md` are placeholders. The specialist must
  use the exact format its master prompt requires.
- The rubric in `02` is labelled "illustrative, not the official IB criteria".

## Facts to verify

These are stated cautiously in the documents and marked "(verify against the current
IB subject guide)" where they appear. Check each against the current IB Business
Management guide or the specialist's knowledge base before treating the text as
final.

1. The course's key concepts (given as change, creativity, ethics and
   sustainability).
2. The content areas listed in `01`, section 2, and which topics and calculations
   are HL only. The documents avoid saying either way.
3. Which tools form the course's toolkit, and at which level (for example critical
   path analysis, decision trees, force-field analysis, Boston matrix).
4. Formula variants: profit margin based on profit before interest and tax; the
   definition of capital employed; the ARR formula as written; whether the formula
   sheet uses "inventory" or "stock"; how discount factors are presented (the example
   uses three decimal places).
5. How case-study material is used in assessment (pre-released or unseen, and at
   which level). No paper structure is stated as fact.
6. The IA format: a research project on a real organisation with supporting documents
   and a key concept, including word limit, number and age of supporting documents
   and any other rules. No numbers are stated as fact.
7. The command-term descriptions in `02` are our own wording. Check that none
   contradicts the official IB command-term definitions.
8. The summary of Herzberg's two-factor theory in the misconceptions table (pay as a
   hygiene factor; recognition, responsibility and the work itself as motivators).
9. That no assessment weightings, durations, mark totals, criterion names or
   first-assessment years appear anywhere in these files. None are intended.
