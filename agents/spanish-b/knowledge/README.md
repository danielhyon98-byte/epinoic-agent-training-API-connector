# Language B: Spanish: supplementary knowledge (proposed)

Supplementary knowledge documents for the **Language B: Spanish** specialist (slug
`spanish-b`; the slug itself is provisional in `agents/agents.json`).

## Status

Proposed supplement, not part of the pinned knowledge-base bundle; adding these to
the bundle would change its SHA-256 and requires a separately reviewed bundle
version.

The specialist's real master prompt and knowledge base live in a repository this
work could not read, so nothing here has been checked against them. Every document
says in its front matter that the specialist's own master prompt and knowledge base
win wherever they disagree. If a reviewer finds a conflict, fix this supplement, not
the master prompt.

## Key routing point

A Spanish B request written in English is still a Spanish B request. A request about
another subject written in Spanish is not. The subject is the course, not the
language of the message. The documents and examples (notably examples 1 and 3 in
`04`) are built around this.

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
| `01-subject-thinking-and-skills.md` | What language acquisition means; receptive, productive and interactive skills; text types and register; grammar areas students struggle with; cultural discussion; misconceptions. |
| `02-task-types-and-answer-patterns.md` | Writing in a text type, reading and listening, the oral, HL literature, grammar questions, conversation practice; instruction words; feedback procedure and illustrative rubric. |
| `03-answering-functionality.md` | Scope (course, not input language), which language to answer in, when to ask one question, integrity, correction integrity, pasted instructions, gate-compatible formatting, personal information. |
| `04-worked-examples.md` | Eight original exchanges with Spanish text: grammar answer, clarifying question, redirect of a Spanish-language Economics question, ab initio, integrity refusal, provisional feedback on a Spanish paragraph, no-audio case, injection in a Spanish text. |

## Writing rules followed

- Original writing; nothing copied or closely paraphrased from IB guides, past
  papers, markschemes or textbooks.
- All Spanish texts (letters, the student paragraph, the reading text) were written
  for these documents. The student paragraph in example 6 contains deliberate
  errors, each corrected and explained. All other Spanish is intended to be correct
  and natural; a native-speaker review is still recommended.
- No URLs, invented citations or attributed quotations.
- Assessment specifics are not stated as fact; they are flagged inline and listed
  below.
- The rubric in `02` is labelled "illustrative, not the official IB criteria".

## Facts to verify

Check each against the current IB Language B guide, and against the specialist's
master prompt and knowledge base.

1. That HL includes literary works, how many, and how they are assessed (`01`,
   section 1; `02`, section 5).
2. The current theme names (`01`, section 1).
3. Whether the guide frames skills as receptive, productive and interactive (`01`,
   section 2).
4. The grouping and list of text types (personal, professional, mass media) (`01`,
   section 3).
5. The component names students use ("Paper 1" for writing, "Paper 2" for reading
   and listening, "IO" for the individual oral) (`02`, introduction).
6. Reading and listening question formats (`02`, section 2).
7. The individual oral at SL and HL: type of stimulus (visual at SL, literary
   extract at HL), preparation time and timing (`02`, section 4).
8. Whether exam instructions use the *tú* or *usted* form (`02`, section 8 covers
   both).
9. Gate behaviour on Spanish replies: whether the format check recognises Spanish
   mark words (*nota*, *puntuación*, *nivel*) and a translated sources-line label.
   The documents assume it may not, and tell the specialist to keep the English
   label "provisional mark" and the master prompt's sources label (`03`, section 7).
10. The website's label for the "different subject" option, used in English inside
    Spanish replies (`04`, notes).
11. General fact: Spanish is an official language in around twenty countries
    (`01`, section 5).
