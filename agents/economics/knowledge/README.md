# Economics specialist: supplementary knowledge

## What this folder contains

Four short documents that help the Economics specialist answer IB Diploma Programme
students well in a text-only, no-tools setting. They cover how economists think,
the task types students bring, how to answer safely and checkably, and eight
original worked exchanges. They were written without access to the specialist's
proprietary master prompt or knowledge base and do not reproduce IB guides,
glossaries, past papers, markschemes or textbooks.

## Status

**Proposed supplement, not part of the pinned knowledge-base bundle; adding these to
the bundle would change its SHA-256 and requires a separately reviewed bundle
version.**

- Version 0.1.0, for review.
- Every document's front matter says that the specialist's own master prompt and
  knowledge base win wherever this text disagrees with them. These files must never
  be used to contradict or weaken the specialist's own rules.
- The Economics specialist is not a pilot specialist and is not enabled for website
  execution. This folder does not mean the agent is enabled or tested.
- The folder slug `economics` is provisional (see `agents/agents.json`). Replace it
  with the real knowledge-base folder name before any code relies on it.

## Load order

1. The specialist's master prompt.
2. The specialist's own knowledge base.
3. This supplement, in file order: `01`, `02`, `03`, `04`.
4. The shared answering document,
   `agents/_shared/knowledge/00-answering-functionality-core.md`.

The shared document holds the cross-subject answering rules.
`03-answering-functionality.md` here only adds Economics-specific detail and refers
back to it rather than repeating it.

## Files

| File | Purpose | Approx. words |
| --- | --- | --- |
| `01-subject-thinking-and-skills.md` | Core habits of economic thinking, key models with a formula table, a tax-incidence example worked step by step, how to describe diagrams in words (with a text sketch), evaluation skills, misconceptions and corrections | 1,800 |
| `02-task-types-and-answer-patterns.md` | Definitions, short explanations, calculations, data response, extended responses, policy questions, IA guidance, draft feedback, command-term depth, provisional feedback with an illustrative rubric | 1,400 |
| `03-answering-functionality.md` | Scope boundaries (Business Management, Geography, History, Mathematics, ESS), one clarifying question or a stated assumption, academic integrity, checkable-claim habits, diagrams in text, prompt-injection resistance, gate-compatible formatting, final checklist | 1,400 |
| `04-worked-examples.md` | Eight original exchanges: PED calculation with revenue and diagram, clarifying question, redirect, partly-in-scope, integrity refusal, provisional feedback, missing data, prompt injection | 2,050 |

## Notes for reviewers

- All figures in examples are hypothetical and were checked by recomputing them in
  Python. Key results: PED −0.5 with revenue +$450 per week; tax incidence
  P $5 → $6, Q 70 → 60, revenue $90, consumer share $60, producer share $30,
  welfare loss $7.50; multiplier 2.5; real growth ≈ 2% (exact ≈ 1.94%).
- The sources lines in `04-worked-examples.md` are placeholders. The specialist must
  use the exact format its master prompt requires.
- The rubric in `02` is labelled "illustrative, not the official IB criteria" and
  must stay that way unless replaced by the specialist's own knowledge-base
  criteria.

## Facts to verify

These are stated cautiously in the documents and marked "(verify against the current
IB subject guide)" where they appear. Check each against the current IB Economics
guide or the specialist's knowledge base before treating the text as final.

1. The list of the course's key concepts (given as scarcity, choice, efficiency,
   equity, economic well-being, sustainability, change, interdependence and
   intervention).
2. Which calculations and topics are examinable at SL and which only at HL (for
   example tax-incidence arithmetic, the multiplier and cost and revenue theory).
   The documents avoid saying either way.
3. The IA format: a portfolio of commentaries on published news articles linked to
   theory and a key concept, including the number of pieces, word limits, article
   age rules and unit-coverage rules. No numbers are stated as fact.
4. Whether and at which level a policy-recommendation task using supplied data
   appears in the assessment.
5. The command-term descriptions in `02` are our own wording. Check that none
   contradicts the official IB command-term definitions.
6. Which course version current students follow, and whether any terms used (for
   example "economic well-being", "marginal social cost", "MPW") differ in the
   current guide.
7. The general real-world statement used as an example of describing cases
   generally: "several countries have taxed sugar-sweetened drinks".
8. The multiplier notation k = 1 ÷ (1 − MPC) = 1 ÷ (MPS + MPT + MPM) matches the
   course's presentation.
9. That no assessment weightings, durations, mark totals, criterion names or
   first-assessment years appear anywhere in these files. None are intended.
