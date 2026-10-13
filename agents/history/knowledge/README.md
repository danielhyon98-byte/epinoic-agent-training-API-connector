# History specialist: supplementary knowledge

This folder holds supplementary knowledge documents for the Epinoic History
specialist (slug `history`). History is the first and, at present, the only
pilot specialist on the website, so this set is the most detailed of the
subject supplements.

The documents cover how historians think, the kinds of tasks IB History students
bring, subject-specific answering behaviour, and worked example exchanges. They
apply the cross-subject rules in `agents/_shared/knowledge/00-answering-functionality-core.md`
to History and do not restate them.

## Status

**Proposed supplement, not part of the pinned knowledge-base bundle; adding these
to the bundle would change its SHA-256 and requires a separately reviewed bundle
version.**

- Version 0.1.0, written without access to the specialist's master prompt or
  knowledge base. Every file states that the master prompt and the specialist's
  own knowledge base win wherever they disagree.
- Nothing here enables, tests or changes the live specialist.
- This repository is public. Do not add proprietary prompt or knowledge-base text
  to these files.
- All writing is original. Command-term descriptions are plain-word paraphrases
  written for this supplement, not the IB's official definitions. The feedback
  rubric in the task-types file is labelled illustrative, not the official IB
  criteria.

## How a builder should load these files

Load order for the History specialist's context:

1. The specialist's master prompt.
2. The specialist's own knowledge base (the pinned bundle).
3. These files, in numeric order: `01`, `02`, `03`, `04`.
4. The shared answering document, `00-answering-functionality-core.md`.

Notes for builders:
- Do not load this README into the model's context; it is for maintainers.
- If context space is tight, `04-worked-examples.md` is the first file to drop;
  the rules it illustrates are all stated in `01` to `03`.
- The worked examples end with a sources line in neutral placeholder wording.
  Before loading, check that the master prompt's required sources-line format
  does not conflict with them; if it does, the master prompt wins and the
  examples should be updated in a new version.
- Report any conflict found between these files and the master prompt or
  knowledge base to the maintainers rather than editing around it.

## Files

| File | Approx. words | What it contains |
| --- | --- | --- |
| `01-subject-thinking-and-skills.md` | 2,300 | Core historical concepts, thinking skills, frameworks for causation, change, significance, sources and historiography, and common student misconceptions with corrections |
| `02-task-types-and-answer-patterns.md` | 2,550 | Command terms in plain words, how to handle each task type (short answers, source tasks, essays, the internal assessment, the extended essay, drafts, revision) and how to give provisional criterion-based feedback |
| `03-answering-functionality.md` | 2,450 | Scope and boundaries with neighbouring subjects, clarifying questions versus stated assumptions, academic integrity, checkable-claim habits, pasted material, prompt-injection resistance and gate-compatible formatting |
| `04-worked-examples.md` | 2,800 | Eight original example exchanges covering a content answer, a clarifying question, an out-of-scope redirect, a partly in-scope request, an integrity refusal, provisional feedback, a missing source and a prompt-injection attempt |

## Facts to verify

These syllabus-specific points are flagged inline with "(verify against the
current IB subject guide)" or similar. Check each against the current IB History
guide (and the current extended essay guide) before this supplement is bundled.

1. **Key concepts.** The supplement says the course's key concepts are change,
   continuity, causation, consequence, significance and perspectives (`01`,
   section 2).
2. **Source-based paper.** Source-based questions sit mainly in a paper based on
   prescribed subjects (`02`, section 2.3).
3. **Essay papers.** Essays appear on world history topics and, at HL, on a
   regional option; some essay questions ask for examples from more than one
   region (`02`, section 2.4).
4. **Internal assessment.** The historical investigation involves source
   evaluation, an investigation and a reflection on historians' methods, within
   a word limit. The current structure, word limit and criteria all need
   checking (`02`, section 2.5).
5. **Recency limit.** Whether course rules restrict how recent an investigation
   or extended essay topic may be, and by how many years (`02`, section 2.5;
   `03`, section 6).
6. **Extended essay criteria.** The current extended essay assessment criteria
   for History (`02`, section 2.6).
7. **Guide edition.** Whether a newer History guide has changed the paper
   structure, prescribed subjects, regional options, internal assessment format
   or command terms. The supplement avoids stating weightings, durations, mark
   totals, criterion names or first-assessment years for this reason.

Pilot assumptions to confirm with the website and runtime owners:

8. The supplement assumes the pilot is **text-only** (the specialist cannot see
   images), based on the shared answering document's statement that there is no
   file access beyond the conversation text (`02`, section 2.3; `03`, section 7;
   example 7).
9. The supplement allows a full model answer only for openly **ungraded
   practice**, and prefers a plan plus one modelled paragraph. Confirm this
   matches the master prompt (`03`, section 5).

## Named scholars and historical claims for spot-check

The writer was highly confident of these, but a reviewer may wish to confirm
them because they appear as attributed claims.

**Historiography (`01`, section 4.5; `03`, section 6; example 4)**
- Fritz Fischer: work first published in 1961 arguing primary German
  responsibility for the First World War; major controversy in West Germany.
- Christopher Clark: study published in 2012 spreading responsibility for 1914
  across several governments.
- A. J. P. Taylor: 1961 book presenting Hitler as more opportunist than planner;
  challenged by Hugh Trevor-Roper.
- Cold War schools: orthodox; revisionist (William Appleman Williams among
  others); post-revisionist (John Lewis Gaddis among others); renewed emphasis
  on Stalin after archives opened in the 1990s.
- Nazi state: intentionalist versus structuralist or functionalist (Hans Mommsen,
  Martin Broszat); Ian Kershaw's "working towards the Führer".
- Milton Friedman and Anna Schwartz: 1963 study emphasising the Federal
  Reserve's role in the monetary contraction of the early 1930s.

**Dates and figures in the worked examples**
- Hitler appointed Chancellor 30 January 1933; Schleicher resigned 28 January
  1933; Papen Chancellor June to November 1932; Schleicher from December 1932.
- Nazi vote under 3 per cent (1928), about 37 per cent (July 1932), about 33 per
  cent (November 1932); registered unemployment around six million by early
  1932; Brüning governing through Article 48 decrees from 1930.
- Wall Street Crash, 24 and 29 October 1929; Smoot-Hawley Tariff Act, June 1930;
  federal deposit insurance created by legislation in 1933; roughly a quarter of
  the US workforce unemployed by 1933.
- Reparations total of 132 billion gold marks fixed in 1921; Versailles military
  terms (army of 100,000, no conscription, demilitarised Rhineland, naval limits,
  no air force).
- Bay of Pigs invasion, April 1961; Cuban Missile Crisis, 16 to 28 October 1962.
- Berlin Wall begun 13 August 1961; well over two million emigrants from East
  Germany, 1949 to 1961; Khrushchev's demands on West Berlin from November 1958;
  Vienna meeting, June 1961.
- Munich Agreement, late September 1938.
- Russia used the Julian calendar until early 1918.
