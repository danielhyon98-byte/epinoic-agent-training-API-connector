# Physics specialist: supplementary knowledge documents

## What this folder contains

Four documents that tell the Physics specialist how to think, which answer patterns
to use, how to answer within the website pilot's rules, and what good replies look
like. They are written for an IB Diploma Physics tutor whose students are 16 to 19
years old.

## Status

Proposed supplement, not part of the pinned knowledge-base bundle; adding these to
the bundle would change its SHA-256 and requires a separately reviewed bundle
version.

The specialist's own master prompt and knowledge base are proprietary and were not
visible when these documents were written. These documents never override them:
each file's front matter says that the master prompt and knowledge base win wherever
they disagree, and any conflict found should be reported to the maintainers rather
than resolved silently. The slug `physics` is marked provisional in
`agents/agents.json` and must be checked against the real knowledge-base folder name.

## Load order

1. Physics master prompt (proprietary).
2. The Physics specialist's own knowledge base (the pinned bundle).
3. These documents, in file order: 01, 02, 03, 04.
4. The shared answering document, `agents/_shared/knowledge/00-answering-functionality-core.md`.

## Files

| File | Purpose |
| --- | --- |
| `01-subject-thinking-and-skills.md` | Core ideas, models, graphs, uncertainty and significant figures, variables and controls, and common misconceptions with ways to correct them. |
| `02-task-types-and-answer-patterns.md` | Multiple choice, structured answers, data questions, calculations, extended responses, practical and IA guidance, draft feedback, command-term depth, and provisional criterion-based feedback with an illustrative rubric. |
| `03-answering-functionality.md` | Scope and neighbouring subjects, one clarifying question versus a stated assumption, academic integrity, checkable working conventions (including the standard constants to state), prompt-injection resistance and gate-compatible formatting. |
| `04-worked-examples.md` | Eight original exchanges with a note on why each reply works. |

## Design notes

- Written to agree with version 0.1.2 of the shared answering document. If that
  document changes, re-check file 03 and the examples in file 04 against it.
- The pilot runs with no tools. The working conventions in file 03 exist so that
  planned deterministic checks of arithmetic, substitutions, unit conversions and
  dimensions can follow each line.
- All numerical examples were recomputed independently before publication.
- No URLs, citations, official criterion names, weightings, durations or mark totals
  are stated as fact.

## Facts to verify

Check these against the current IB Physics guide, data booklet and the specialist's
own knowledge base before any of this content moves into a reviewed bundle.

1. **Guide edition and structure.** The sciences guides were recently revised. These
   documents deliberately state no topic numbers, theme names, first-assessment
   year, paper structure, durations, weightings or mark totals.
2. **SL/HL content.** Example 2 in file 04 avoids saying whether energy in
   gravitational fields (escape speed) is HL-only; file 01 mentions the
   photoelectric effect without assigning a level. Confirm before adding any level
   statement.
3. **Data booklet constants.** File 03 lists standard rounded values (g = 9.81 m s⁻²,
   e = 1.60 × 10⁻¹⁹ C, h = 6.63 × 10⁻³⁴ J s, c = 3.00 × 10⁸ m s⁻¹,
   N_A = 6.02 × 10²³ mol⁻¹, R = 8.31 J K⁻¹ mol⁻¹, k_B = 1.38 × 10⁻²³ J K⁻¹,
   G = 6.67 × 10⁻¹¹ N m² kg⁻², m_e = 9.11 × 10⁻³¹ kg, 1 u = 1.661 × 10⁻²⁷ kg =
   931.5 MeV c⁻²). Confirm they match the printed values in the current booklet.
4. **Calculator use** in the multiple-choice component (not stated; verify against
   the current IB subject guide).
5. **Internal assessment.** Official criterion names, weightings and length limits
   are not stated. The rubric in file 02 is illustrative, not the official IB
   criteria.
6. **Command terms.** File 02 gives paraphrases; check them against the official
   definitions. The "show that" advice (give one more significant figure than the
   stated value) is common examiner guidance and should be confirmed.
7. **Approximate values in example 4** (file 04): about 200 MeV per U-235 fission;
   fossil-fuel energy of the order of 10⁷ J kg⁻¹; reactor fuel containing a few per
   cent U-235. These are mainstream approximations, labelled as such in the reply.
8. **Graded homework policy.** File 03 proposes method and hints rather than final
   answers when a student says a task is graded. Confirm this matches the master
   prompt.
9. **Sources line.** The sources lines in file 04 show content only; the exact format
   must come from the master prompt.
10. **Slug.** `physics` is provisional in the roster.
