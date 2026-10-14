# Chemistry specialist: supplementary knowledge documents

## What this folder contains

Four documents that tell the Chemistry specialist how to think, which answer
patterns to use, how to answer within the website pilot's rules, and what good
replies look like. They are written for an IB Diploma Chemistry tutor whose students
are 16 to 19 years old.

## Status

Proposed supplement, not part of the pinned knowledge-base bundle; adding these to
the bundle would change its SHA-256 and requires a separately reviewed bundle
version.

The specialist's own master prompt and knowledge base are proprietary and were not
visible when these documents were written. These documents never override them:
each file's front matter says that the master prompt and knowledge base win wherever
they disagree, and any conflict should be reported to the maintainers rather than
resolved silently. The slug `chemistry` is marked provisional in `agents/agents.json`
and must be checked against the real knowledge-base folder name.

## Load order

1. Chemistry master prompt (proprietary).
2. The Chemistry specialist's own knowledge base (the pinned bundle).
3. These documents, in file order: 01, 02, 03, 04.
4. The shared answering document, `agents/_shared/knowledge/00-answering-functionality-core.md`.

## Files

| File | Purpose |
| --- | --- |
| `01-subject-thinking-and-skills.md` | Core ideas, levels of description, models, evidence, uncertainty versus percentage error, significant figures (including pH), variables and controls, and common misconceptions with corrections. |
| `02-task-types-and-answer-patterns.md` | Multiple choice, structured answers, data and spectra questions, calculations, extended responses, practical and IA guidance, draft feedback, command-term depth, and provisional criterion-based feedback with an illustrative rubric. |
| `03-answering-functionality.md` | Scope, neighbouring subjects and safety, one clarifying question versus a stated assumption, academic integrity, checkable working conventions (equation balance lines, constants and relative atomic masses to state), prompt-injection resistance and gate-compatible formatting. |
| `04-worked-examples.md` | Eight original exchanges with a note on why each reply works. |

## Design notes

- Written to agree with version 0.1.1 of the shared answering document. If that
  document changes, re-check file 03 and the examples in file 04 against it.
- The pilot runs with no tools. File 03 asks for an atom check and a charge check
  after every equation, and explicit substitutions, so that planned deterministic
  checks of arithmetic, unit conversions and element and charge balance can follow
  each step.
- All calculations and equation balances in these files were recomputed
  independently before publication.
- No URLs, citations, official criterion names, weightings, durations or mark totals
  are stated as fact.

## Facts to verify

Check these against the current IB Chemistry guide, data booklet and the
specialist's own knowledge base before any of this content moves into a reviewed
bundle.

1. **Guide edition and structure.** The sciences guides were recently revised. No
   topic numbers, theme names, first-assessment year, paper structure, durations,
   weightings or mark totals are stated.
2. **SL/HL content.** Example 2 in file 04 avoids saying whether sigma and pi bonds
   and hybridisation are HL-only; file 01 mentions NMR, entropy and Gibbs energy
   only "where taught" or "where the course includes them". Confirm before adding
   any level statement.
3. **Data booklet values** used in file 03 and file 04: molar volume of an ideal gas
   22.7 dm³ mol⁻¹ at 273 K and 100 kPa (and the course's definition of STP);
   specific heat capacity of water 4.18 J g⁻¹ K⁻¹; F = 9.65 × 10⁴ C mol⁻¹;
   K_w = 1.00 × 10⁻¹⁴ at 298 K; N_A and R; relative atomic masses H 1.01, C 12.01,
   N 14.01, O 16.00, Na 22.99, Mg 24.31, S 32.07, Cl 35.45, K 39.10, Ca 40.08,
   Fe 55.85, Cu 63.55. Confirm each matches the printed values.
4. **Temperature conversion.** File 01 says 273.15, noting that many IB materials
   round to 273. Confirm what the current booklet prints.
5. **Infrared ranges.** Files 02 and 04 describe O–H and C=O absorptions only in
   general terms and point to the data booklet's table. Confirm the wording is
   consistent with it.
6. **Calculator and data booklet use** in the multiple-choice component (not stated;
   verify against the current IB subject guide).
7. **Internal assessment.** Official criterion names, weightings and length limits
   are not stated. The rubric in file 02 is illustrative, not the official IB
   criteria.
8. **Command terms.** File 02 gives paraphrases, including "formulate" for equations
   and the advice to include state symbols unless told otherwise. Check against the
   official definitions and examiner expectations.
9. **Reference value in file 01.** "A commonly quoted value of about −57 kJ mol⁻¹"
   for the enthalpy of neutralisation of a strong acid by a strong base is a
   mainstream textbook figure used only for a percentage-error illustration.
10. **Safety and graded-homework rules** in file 03 are proposals. Confirm they match
    the master prompt.
11. **Sources line.** The sources lines in file 04 show content only; the exact
    format must come from the master prompt.
12. **Slug.** `chemistry` is provisional in the roster.
