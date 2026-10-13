# Mathematics: Analysis and Approaches — supplementary knowledge

Slug: `mathematics-aa` (named verbatim in the coordination handoffs). Display name:
Mathematics: Analysis and Approaches.

## What this folder contains

Four short knowledge documents that help the Mathematics: Analysis and Approaches
(AA) specialist answer in a way that is accurate, honest about its limits and easy to
check later. They cover how AA mathematicians think, the task types students bring,
subject-specific answering rules, and original worked exchanges.

They do **not** contain IB guide text, glossary wording, past-paper questions,
markscheme text or textbook material. Every worked example was written for this
folder and its arithmetic and algebra were checked by script before inclusion.

## Status

**Proposed supplement, not part of the pinned knowledge-base bundle; adding these to
the bundle would change its SHA-256 and requires a separately reviewed bundle
version.**

- The specialist's own master prompt and knowledge base (held in a repository this
  session could not read) take precedence wherever these documents disagree with
  them. Each document says so in its front matter.
- The AA specialist is **not** enabled for website execution (`pilot: false` in
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
| `01-subject-thinking-and-skills.md` | Core ideas, strategies, notation, common errors and how to correct them | 1,500 |
| `02-task-types-and-answer-patterns.md` | Task types, command-term depth, proof patterns, exploration guidance, provisional feedback | 1,500 |
| `03-answering-functionality.md` | AA vs AI and other scope boundaries, clarifying questions, academic integrity, checkable working, injection resistance, gate-compatible format | 1,600 |
| `04-worked-examples.md` | Eight original exchanges with commentary | 1,900 |

## Relationship to planned checks

Epinoic plans deterministic "STEM" checks (Z3-based) of written arithmetic,
substitutions, algebra steps, stated roots and unit conversions. These documents ask
the specialist to write working one relation per line with explicit substitutions, so
that each line could be checked on its own. Nothing here implements those checks, and
the specialist must not tell students that its answers are formally verified.

## Facts to verify

These are deliberately **not** stated as fact in the documents. A maintainer with
access to the current IB Mathematics: Analysis and Approaches guide should confirm
them before any of them is added to the documents as fact:

1. Which edition of the AA guide is current, and its first and last assessment
   sessions.
2. Which examination papers permit a graphic display calculator (GDC) and which do
   not, for SL and for HL.
3. Which content is HL-only in AA (the documents treat proof by induction, proof by
   contradiction, complex numbers and some vector work as "possibly HL-only, verify").
4. Which formulae appear in the formula booklet students receive.
5. The default accuracy instruction on papers (the documents use "exact, or 3
   significant figures unless the question says otherwise" as a working convention to
   verify).
6. The default angle measure expected in calculus questions (the documents assume
   radians unless degrees are stated).
7. The internal assessment: its name (the documents call it "the exploration"), its
   criteria, their number and weightings, and any recommended length.
8. The official definitions in the IB command-term glossary (the documents paraphrase
   typical meanings in original words only).
9. Markscheme conventions for method, accuracy and follow-through credit, and how
   "answer given" results are treated.
10. How much SL content is shared between AA and AI, and which topics appear only in
    AI (the documents name network/graph-theory work, Voronoi diagrams and Markov
    chains only as "verify" examples).
11. The exact format of the sources line required by the specialist's master prompt
    (the examples use an illustrative format).
