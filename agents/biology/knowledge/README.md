# Biology specialist: supplementary knowledge documents

## What this folder contains

Four documents that tell the Biology specialist how to think, which answer patterns to
use, how to answer within the website pilot's rules (including the overlap with
Environmental Systems and Societies and Geography), and what good replies look like.
They are written for an IB Diploma Biology tutor whose students are 16 to 19 years
old.

## Status

Proposed supplement, not part of the pinned knowledge-base bundle; adding these to
the bundle would change its SHA-256 and requires a separately reviewed bundle
version.

The specialist's own master prompt and knowledge base are proprietary and were not
visible when these documents were written. These documents never override them:
each file's front matter says that the master prompt and knowledge base win wherever
they disagree, and any conflict should be reported to the maintainers rather than
resolved silently. The slug `biology` is marked provisional in `agents/agents.json`
and must be checked against the real knowledge-base folder name.

## Load order

1. Biology master prompt (proprietary).
2. The Biology specialist's own knowledge base (the pinned bundle).
3. These documents, in file order: 01, 02, 03, 04.
4. The shared answering document, `agents/_shared/knowledge/00-answering-functionality-core.md`.

## Files

| File | Purpose |
| --- | --- |
| `01-subject-thinking-and-skills.md` | Core ideas, levels of organisation, hypotheses and controls, variability and statistics, models changing with evidence, scale and units, ethics, and common misconceptions with corrections. |
| `02-task-types-and-answer-patterns.md` | Multiple choice, structured answers, data-based questions, calculations, extended responses, practical and IA guidance, draft feedback, command-term depth, and provisional criterion-based feedback with an illustrative rubric. |
| `03-answering-functionality.md` | Scope, the Biology/ESS/Geography overlap policy from Biology's side, other neighbours, medical and safety limits, one clarifying question versus a stated assumption, academic integrity (including fabricated data), checkable working conventions, prompt-injection resistance and gate-compatible formatting. |
| `04-worked-examples.md` | Eight original exchanges with a note on why each reply works. |

## Design notes

- The pilot runs with no tools. File 03 asks for conversions on their own lines,
  explicit substitution, units on every result and atom checks on any symbol
  equation, so that planned deterministic checks can follow each step.
- The overlap policy matches the ESS folder's version from the other side: the
  router clarifies ambiguous requests; once routed, Biology answers mechanisms and
  names ESS (systems, values, sustainability, management) or Geography when they
  suit part of the question better.
- All calculations and equation balances were recomputed independently.
- No URLs, citations, official criterion names, weightings, durations or mark totals
  are stated as fact.

## Facts to verify

Check these against the current IB Biology guide and the specialist's own knowledge
base before any of this content moves into a reviewed bundle.

1. **Guide edition and structure.** The sciences guides were recently revised. No
   topic numbers, theme names, first-assessment year, paper structure, durations,
   weightings or mark totals are stated, and file 01 deliberately avoids using the
   guide's organising themes as headings.
2. **SL/HL content.** Example 2 in file 04 avoids saying whether photosystems,
   electron transport and chemiosmosis are HL-only; file 01 mentions water potential
   only "if your course uses that term". Confirm before adding any level statement.
3. **Statistics.** Which measures of spread and which statistical tests the course
   expects (none is named as required in these files).
4. **Typical sizes** used for sense checks in files 01 and 04: most eukaryotic cells
   tens of micrometres across; prokaryotic cells and mitochondria around one to a
   few micrometres; ribosomes measured in nanometres. These are mainstream textbook
   ranges.
5. **Ethics guidance.** Files 01 and 02 refer generally to "the school's and the IB's
   guidance on ethical practice". Confirm the name and content of the current IB
   policy on experiments involving animals and people.
6. **Internal assessment.** Official criterion names, weightings and length limits
   are not stated. The rubric in file 02 is illustrative, not the official IB
   criteria.
7. **Command terms.** File 02 gives paraphrases; check against the official
   definitions.
8. **Overlap policy wording** in file 03. Confirm it matches the router's
   clarification behaviour and the ESS and Geography specialists' own rules.
9. **Medical, safety and graded-homework rules** in file 03 are proposals. Confirm
   they match the master prompt.
10. **Sources line.** The sources lines in file 04 show content only; the exact
    format must come from the master prompt.
11. **Slug.** `biology` is provisional in the roster.
