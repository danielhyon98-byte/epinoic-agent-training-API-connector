# Geography specialist: supplementary knowledge

This folder holds supplementary knowledge documents for the Epinoic Geography
specialist (slug `geography`, which the roster marks as provisional until it is
matched to the real knowledge-base folder name). The specialist is not part of
the website pilot; these files prepare for later review.

The documents cover how geographers think, the kinds of tasks IB Geography
students bring, subject-specific answering behaviour, and worked example
exchanges. They apply the cross-subject rules in
`agents/_shared/knowledge/00-answering-functionality-core.md` to Geography and
do not restate them.

## Status

**Proposed supplement, not part of the pinned knowledge-base bundle; adding these
to the bundle would change its SHA-256 and requires a separately reviewed bundle
version.**

- Version 0.1.0, written without access to the specialist's master prompt or
  knowledge base. Every file states that the master prompt and the specialist's
  own knowledge base win wherever they disagree.
- Nothing here enables, tests or changes the specialist.
- This repository is public. Do not add proprietary prompt or knowledge-base text
  to these files.
- All writing is original. Command-term descriptions are plain-word paraphrases,
  not the IB's official definitions. The feedback rubric in the task-types file
  is labelled illustrative, not the official IB criteria.

## How a builder should load these files

1. The specialist's master prompt.
2. The specialist's own knowledge base (its pinned bundle).
3. These files, in numeric order: `01`, `02`, `03`, `04`.
4. The shared answering document, `00-answering-functionality-core.md`.

Notes for builders:
- Do not load this README into the model's context.
- If context space is tight, drop `04-worked-examples.md` first.
- The worked examples end with a sources line in neutral placeholder wording.
  Check it against the master prompt's required format before loading; the
  master prompt wins.
- The Geography, ESS and Biology specialists overlap on environmental topics.
  These files tell the specialist to decide scope by the student's course, which
  should be checked against the router's overlap policy once that is reviewed.

## Files

| File | Approx. words | What it contains |
| --- | --- | --- |
| `01-subject-thinking-and-skills.md` | 1,400 | Core geographic concepts, thinking skills, analytical frameworks and common misconceptions with corrections |
| `02-task-types-and-answer-patterns.md` | 1,450 | Command terms in plain words, data-response, explanation and extended-response tasks, fieldwork and extended essay guidance, and provisional criterion-based feedback |
| `03-answering-functionality.md` | 1,500 | Boundaries with ESS, Biology, Economics, History, Mathematics and others; clarifying questions; integrity; units, scale and case-study habits; prompt-injection resistance; gate-compatible formatting |
| `04-worked-examples.md` | 2,200 | Eight original example exchanges covering a content answer, a clarifying question, an out-of-scope redirect, a partly in-scope request, an integrity refusal, provisional feedback, missing data and a prompt-injection attempt |

## Facts to verify

These syllabus-specific points are flagged inline. Check each against the
current IB Geography guide (and the current extended essay guide) before this
supplement is bundled.

1. **Key concepts.** The supplement says the course's key concepts include place,
   process, power and possibility, with scale and spatial interaction also
   central (`01`, section 2).
2. **Course structure.** Extended responses appear in option themes, in the core
   and, at HL, in an extension on global interactions (`02`, section 2.3). The
   worked example on Paper 1 revision deliberately avoids saying what Paper 1
   contains.
3. **Fieldwork internal assessment.** Whether primary data is required, the word
   limit, and the current criteria (`02`, section 2.4).
4. **Extended essay criteria** for Geography (`02`, section 2.5).
5. **Statistics.** Whether particular statistical tests are expected. The
   supplement treats tests such as Spearman's rank as optional tools.
6. **Guide edition.** Whether a newer Geography guide has changed the option
   themes, paper structure, HL extension, internal assessment format or command
   terms. The supplement avoids stating weightings, durations, mark totals,
   criterion names or first-assessment years for this reason.

Pilot assumption to confirm: the supplement assumes text-only input (the
specialist cannot see figures, maps or images), in line with the shared
answering document.

## Named scholars and factual claims for spot-check

- Thomas Malthus, 1798; Ester Boserup, 1965; Amartya Sen, 1981 (famines and
  access to food).
- Everett Lee, 1966 (push and pull factors with intervening obstacles).
- Food security analysed through availability, access, use and stability.
- Sahel droughts in the early 1970s and mid-1980s; armed conflict in parts of the
  region in the 2010s and 2020s; global food price spikes of 2007 to 2008.
- Africa has more than 50 countries.
- Climate normally averaged over about three decades.
- Mean river velocity often increases downstream.
- A large share of refugees are hosted in neighbouring countries.
- Spearman's rank formula and the made-up worked example (sum of d² = 68,
  rs = −0.94 for six sites).
