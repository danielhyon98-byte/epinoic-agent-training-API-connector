# English specialist: supplementary knowledge (proposed)

Supplementary knowledge documents for the **English specialist** (slug
`english-specialist`).

## Scope is unverified: reconcile before use

This specialist is named in the coordination handoffs, but its exact scope could not
be read. The roster says it is probably a second English A: Literature agent; that is
unverified. These documents therefore **do not assume a scope**. They cover skills
that apply across the English courses (close reading, quotation integrity,
paragraph and essay craft, comparison, feedback on drafts) and teach the specialist
to tell the English courses apart and to ask which course a student takes.

Before these documents are used, a reviewer **must reconcile them with the
specialist's master prompt**:

- If the master prompt fixes the scope to one course, check that nothing here
  invites the specialist to give course-specific advice for another course.
- If the specialist turns out to be a duplicate of `english-a-literature`, consider
  using that folder's documents instead, or merging the two.
- Update this README and the roster note once the scope is confirmed.

## Status

Proposed supplement, not part of the pinned knowledge-base bundle; adding these to
the bundle would change its SHA-256 and requires a separately reviewed bundle
version.

Nothing here has been checked against the specialist's master prompt or knowledge
base. Every document says in its front matter that the specialist's own master
prompt and knowledge base win wherever they disagree.

## How a builder should load them

1. The specialist's master prompt.
2. The specialist's own knowledge base (the pinned bundle).
3. These documents, in file order: `01` to `04`.
4. The shared answering document, `agents/_shared/knowledge/00-answering-functionality-core.md`.

Do not load this README into the model's context. File names and section numbers
are internal: the documents tell the specialist never to mention them to students.

## Files

| File | One-line description |
| --- | --- |
| `01-subject-thinking-and-skills.md` | How to tell English A: Literature, English A: Language and Literature and English B apart; close reading; quotation integrity; paragraph, essay and comparison craft; misconceptions. |
| `02-task-types-and-answer-patterns.md` | Course-neutral versus course-specific answers; generic task types; command terms; procedure and illustrative rubric for provisional feedback. |
| `03-answering-functionality.md` | Scope taken from the master prompt, when to ask which course, integrity, quotation integrity, pasted-text instructions, gate-compatible formatting. |
| `04-worked-examples.md` | Seven original exchanges, including a course-clarification question and a combined no-text and prompt-injection case. |

## Writing rules followed

- Original writing; nothing copied or closely paraphrased from IB materials.
- Literary examples are invented and labelled; *Jane Eyre* is discussed only in
  paraphrase. No line is quoted from any published work.
- No URLs, invented citations or critics' quotations.
- Assessment specifics are not stated as fact; they are flagged inline and listed
  below.
- The rubric in `02` is labelled "illustrative, not the official IB criteria".

## Facts to verify

1. **The specialist's scope** (master prompt). Everything else depends on it.
2. The course-recognition table in `01`, section 1: what each of English A:
   Literature, English A: Language and Literature and English B studies, and the
   signals listed for each (verify against the current IB subject guides).
3. That "Paper 1" and "Paper 2" name different tasks in different English courses
   (`01`, section 1).
4. The component names students use ("Paper 1", "Paper 2", "IO", "HL essay") for
   the course this specialist covers (`02`, introduction).
5. Whether the unseen-analysis text is literary or non-literary for the course this
   specialist covers (`02`, section 2).
6. The oral format, and coursework requirements and word limits, for that course
   (`02`, sections 4 and 5).
7. Whether the guide's command-term meanings match the depth table in `02`,
   section 7 (the table uses original wording).
8. That a narrative point about *Jane Eyre* in example 4 of `04` (an adult narrator
   recounting her earlier life, with direct address to the reader) is accurate.
