# Computer Science — supplementary knowledge

Slug: `computer-science`. **This slug is provisional** (`slugSource: "provisional"`
in `agents/agents.json`) and must be replaced by the real knowledge-base folder name
before any code relies on it. Display name: Computer Science.

## What this folder contains

Four short knowledge documents that help the Computer Science specialist answer in a
way that is accurate, honest about not being able to run code, and easy to check
later. They cover computational thinking and common errors, the task types students
bring (including code tracing and algorithm design), subject-specific answering
rules, and original worked exchanges.

They do **not** contain IB guide text, glossary wording, past-paper questions,
markscheme text, case-study material or textbook material. All code in the examples
was written for this folder; every trace, base conversion and Boolean identity was
checked by script (the Python snippets were executed in the authoring sandbox, which
the specialist itself cannot do).

## Status

**Proposed supplement, not part of the pinned knowledge-base bundle; adding these to
the bundle would change its SHA-256 and requires a separately reviewed bundle
version.**

- The specialist's own master prompt and knowledge base (held in a repository this
  session could not read) take precedence wherever these documents disagree with
  them. Each document says so in its front matter.
- The Computer Science specialist is **not** enabled for website execution
  (`pilot: false`). This folder existing does not mean the agent is live or tested.
- No model has been run against these documents. They are reviewed text only.
- The IB has introduced a new Computer Science guide. These documents deliberately
  avoid topic numbering, option names, paper structures and level splits, and
  describe content in general terms.

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
| `01-subject-thinking-and-skills.md` | Computational thinking, core areas, notation, common errors (off-by-one, integer division, two's complement, De Morgan, bits vs bytes) and corrections | 1,460 |
| `02-task-types-and-answer-patterns.md` | Command-term depth, tracing, algorithm design, debugging, Boolean and data-representation tasks, databases, OOP, project guidance, provisional feedback | 1,300 |
| `03-answering-functionality.md` | Scope boundaries, new-guide caution, clarifying questions, no code execution, academic integrity, checkable traces, injection resistance, gate-compatible format | 1,370 |
| `04-worked-examples.md` | Eight original exchanges with commentary | 1,780 |

## Relationship to planned checks

Epinoic plans deterministic "STEM" checks (Z3-based) that include Boolean identities,
truth tables and number-base conversions as well as written arithmetic. These
documents ask the specialist to write traces as tables, truth tables with every row in
a fixed order, and conversions step by step, so that each line could be checked on
its own. Nothing here implements those checks, and the specialist must not tell
students that its answers are formally verified or that code was executed.

## Facts to verify

These are deliberately **not** stated as fact in the documents. A maintainer with
access to the current IB Computer Science guide (and the previous one, for students
still on it) should confirm them:

1. Which guide is current, its first assessment session, and the transition
   arrangements for students on the previous guide.
2. The topic structure and any numbering in the new guide, and whether options exist
   and what they are called.
3. The programming language or languages students are expected to read and write,
   and whether an IB pseudocode convention still applies (and its exact form).
4. The examination structure at SL and HL, including whether a pre-released case
   study exists and for which level.
5. The internal assessment: its name, what students produce, its criteria, their
   number and weightings.
6. Which content is HL-only.
7. Whether SQL is examined, and which syntax is expected.
8. Which named data structures and algorithms (for example particular sorts, linked
   lists, trees, hash tables) are explicitly in the course.
9. The official command-term list for the subject, including whether "trace" and
   "construct" are listed, and their official definitions (paraphrased here only).
10. The unit-prefix convention the course uses (1 KB = 1000 bytes or 1024 bytes, and
    whether KiB and MiB are used).
11. The Boolean and logic-gate notation the course uses (words such as AND, OR, NOT,
    or symbols such as ·, + and an overbar), and the operator precedence it assumes.
12. Whether the deterministic gate treats plain IP addresses (for example 192.168.0.10)
    in networking answers as URLs.
13. The exact format of the sources line required by the specialist's master prompt
    (the examples use an illustrative format).

## Review checklist before any bundle change

1. Replace the provisional slug with the real knowledge-base folder name, and move
   this folder if the name changes.
2. Confirm or correct every item under "Facts to verify", for both the new guide and
   the previous one while students on it remain. A confirmed fact may then be stated
   without its "(verify …)" marker; a wrong one must be removed.
3. Read each file against the Computer Science master prompt and knowledge base.
   Where they disagree, the master prompt wins, and this supplement should be edited
   to match.
4. Replace the illustrative sources lines in the examples with the master prompt's
   real format.
5. Run every example reply through the deterministic gate as a fixture and confirm
   it passes: no URLs, no internal codes, provisional marks labelled in the same
   sentence, an honest sources line. Check in particular that the "10/10" inside the
   student's pasted code comment (the prompt-injection example) is handled as
   intended, since it appears in the student's message, not in the reply.
6. Confirm the gate does not misread ordinary computing words ("broadband", "level"
   in "high-level language", "grade" as a field name) or fractions inside
   calculations as unlabelled marks or bands.
7. Re-check every trace and conversion independently. The authoring checks were
   scripts run once in a scratch area at version 0.1.0; they are not stored in this
   repository.
8. Bump `version` in every changed file and record the change in the work log.
