# Mathematics: Applications and Interpretation — supplementary knowledge

Slug: `mathematics-ai` (named verbatim in the coordination handoffs). Display name:
Mathematics: Applications and Interpretation.

## What this folder contains

Four short knowledge documents that help the Mathematics: Applications and
Interpretation (AI) specialist answer in a way that is accurate, honest about having
no calculator or software in the pilot, and easy to check later. They cover modelling
and statistical thinking, the task types AI students bring, subject-specific
answering rules, and original worked exchanges.

They do **not** contain IB guide text, glossary wording, past-paper questions,
markscheme text or textbook material. Every worked example was written for this
folder and its arithmetic, algebra and statistics were checked by script before
inclusion.

## Status

**Proposed supplement, not part of the pinned knowledge-base bundle; adding these to
the bundle would change its SHA-256 and requires a separately reviewed bundle
version.**

- The specialist's own master prompt and knowledge base (held in a repository this
  session could not read) take precedence wherever these documents disagree with
  them. Each document says so in its front matter.
- The AI specialist is **not** enabled for website execution (`pilot: false` in
  `agents/agents.json`). This folder existing does not mean the agent is live or
  tested.
- No model has been run against these documents. They are reviewed text only.

## How a builder should load them

1. The specialist's master prompt.
2. The specialist's own knowledge base (the pinned bundle).
3. These files, in numeric order: `01`, `02`, `03`, `04`.
4. The shared answering document, `agents/_shared/knowledge/00-answering-functionality-core.md`.

Keep the front matter of each file, because it carries the precedence statement. Do
not load this README into the prompt; it is for builders and reviewers. The specialist
must never quote these file names, version numbers or section labels to a student.

## Files

| File | Purpose | Approx. words |
| --- | --- | --- |
| `01-subject-thinking-and-skills.md` | Modelling and statistical thinking, technology use, notation, common errors and corrections | 1,500 |
| `02-task-types-and-answer-patterns.md` | Task types, command-term depth, hypothesis-test template, modelling answers, exploration guidance, provisional feedback | 1,500 |
| `03-answering-functionality.md` | AI vs AA and other scope boundaries, clarifying questions, academic integrity, checkable working without a GDC, injection resistance, gate-compatible format | 1,600 |
| `04-worked-examples.md` | Eight original exchanges with commentary | 1,900 |

## Relationship to planned checks

Epinoic plans deterministic "STEM" checks (Z3-based) of written arithmetic,
substitutions, algebra steps, stated roots and unit conversions. AI answers often
rely on technology the pilot does not provide, so these documents ask the specialist
to separate what it computed by hand (shown line by line) from values that must come
from the student's GDC (never invented). Nothing here implements those checks, and the
specialist must not tell students that its answers are formally verified.

## Facts to verify

These are deliberately **not** stated as fact in the documents. A maintainer with
access to the current IB Mathematics: Applications and Interpretation guide should
confirm them before any of them is added as fact:

1. Which edition of the AI guide is current, and its first and last assessment
   sessions.
2. Whether a GDC is required or permitted on every AI paper at SL and HL.
3. Which content is HL-only in AI (the documents mention matrices and eigenvalues,
   Markov chains, graph theory and differential equations only as "verify" examples)
   and whether Voronoi diagrams are in the course and at which level.
4. Which hypothesis tests and correlation measures are in the course at each level,
   and whether any continuity correction is applied to chi-squared tests.
5. The course's rule for small expected frequencies in chi-squared tests (the
   documents mention "commonly at least 5" as a convention to verify), including
   whether categories should be combined.
6. Which standard deviation (population or sample estimate) students are expected to
   report in each context.
7. Financial-mathematics conventions: money rounding, and the sign convention for
   present and future values in the time-value-of-money (TVM) solver.
8. The outlier rule taught (the documents mention 1.5 × IQR only as a convention to
   verify).
9. The default accuracy instruction on papers (the documents use "exact, or 3
   significant figures unless the question says otherwise" as a working convention).
10. Which formulae appear in the formula booklet.
11. The internal assessment: its name (the documents call it "the exploration"), its
    criteria, their number and weightings, and any recommended length.
12. The official definitions in the IB command-term glossary (paraphrased here only).
13. How much SL content is shared between AI and AA.
14. The exact format of the sources line required by the specialist's master prompt
    (the examples use an illustrative format).
