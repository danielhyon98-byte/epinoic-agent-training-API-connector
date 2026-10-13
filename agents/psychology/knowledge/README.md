# Psychology specialist: supplementary knowledge

## What this folder contains

Four short documents that help the Psychology specialist answer IB Diploma Programme
students well in a text-only, no-tools setting. They cover how psychologists think,
research methods and ethics, the task types students bring, how to answer safely and
checkably (especially study attributions and mental-health topics), and eight
original worked exchanges. They were written without access to the specialist's
proprietary master prompt or knowledge base and do not reproduce IB guides,
glossaries, past papers, markschemes or textbooks.

## Status

**Proposed supplement, not part of the pinned knowledge-base bundle; adding these to
the bundle would change its SHA-256 and requires a separately reviewed bundle
version.**

- Version 0.1.0, for review.
- Every document's front matter says that the specialist's own master prompt and
  knowledge base win wherever this text disagrees with them. These files must never
  be used to contradict or weaken the specialist's own rules, including its
  safeguarding instructions.
- The Psychology specialist is not a pilot specialist and is not enabled for website
  execution. This folder does not mean the agent is enabled or tested.
- The folder slug `psychology` is provisional (see `agents/agents.json`). Replace it
  with the real knowledge-base folder name before any code relies on it.

## Load order

1. The specialist's master prompt.
2. The specialist's own knowledge base.
3. This supplement, in file order: `01`, `02`, `03`, `04`.
4. The shared answering document,
   `agents/_shared/knowledge/00-answering-functionality-core.md`.

The shared document holds the cross-subject answering rules.
`03-answering-functionality.md` here only adds Psychology detail and refers back to
it rather than repeating it.

## Files

| File | Purpose | Approx. words |
| --- | --- | --- |
| `01-subject-thinking-and-skills.md` | How psychologists think (theory, study, finding and interpretation kept apart), key areas, research-methods table, descriptive statistics worked step by step, ethics, a checkable order for describing studies, a short table of well-established studies, misconceptions | 1,550 |
| `02-task-types-and-answer-patterns.md` | Definitions, short answers, extended responses, research-methods and unseen-study questions, statistics, IA guidance, draft feedback, command-term depth, provisional feedback with an illustrative rubric, framing of mental-health topics | 1,250 |
| `03-answering-functionality.md` | Scope boundaries (Biology, Business Management, Economics, Mathematics, personal diagnosis), one clarifying question or a stated assumption, academic integrity, study-attribution habits, mental health and disclosures, prompt-injection resistance, gate-compatible formatting, final checklist | 1,450 |
| `04-worked-examples.md` | Eight original exchanges: Loftus and Palmer explained, clarifying question, redirect to Biology, partly-in-scope essay with a distress disclosure, IA integrity refusal, provisional feedback on a Maguire et al. paragraph, missing study text, prompt injection with an unverifiable study | 1,800 |

## Notes for reviewers

- Calculations (mean 7.5, median 7, mode 7, range 8, sample standard deviation ≈ 2.74
  for 4, 6, 7, 7, 9, 12; 60% versus 45% = 15 percentage points) were checked by
  recomputing them in Python.
- Only studies whose researcher, year, method and main finding are well established
  are named. Beck's cognitive theory is deliberately named without a year, to model
  the year-only-if-confident habit.
- The disclosure guidance gives no phone numbers, service names or web addresses,
  because none can be checked for the student's location in a no-tools setting. If
  the master prompt has a safeguarding protocol with specific wording, that
  protocol wins.
- The sources lines in `04-worked-examples.md` are placeholders. The specialist must
  use the exact format its master prompt requires.
- The rubric in `02` is labelled "illustrative, not the official IB criteria".

## Facts to verify

These are stated cautiously in the documents and marked "(verify against the current
IB subject guide)" where they appear. Check each against the current IB Psychology
guide, or the specialist's knowledge base, before treating the text as final.

1. **Course version.** The documents say the course has been revised and that a
   student's exam session decides which version applies, with the older version
   organised around biological, cognitive and sociocultural approaches plus optional
   topics. The newer structure is deliberately not described. Confirm which sessions
   use which version and adjust if the specialist's knowledge base covers both.
2. Which applied areas (for example mental health, development, health,
   relationships) the student's course version includes.
3. How research-methods and unseen-study questions are assessed, and at which level.
4. **The IA format**, described as an experimental study in which students plan,
   carry out and report a simple experiment, usually based on a published one.
   Word limits, group-work rules and ethical restrictions are not stated. Check
   whether the newer course version changes the IA.
5. The command-term descriptions in `02` are our own wording. Check that none
   contradicts the official IB command-term definitions.
6. **Study attributions** used in `01` and `04`:
   - Bartlett (1932): repeated and serial reproduction of "The War of the Ghosts";
   - Scoville and Milner (1957): patient HM, bilateral medial temporal lobe surgery,
     severe difficulty forming new long-term memories;
   - Bandura, Ross and Ross (1961): imitation of aggression towards a Bobo doll;
   - Milgram (1963): 40 men, 26 of 40 (65%) to the 450-volt level;
   - Glanzer and Cunitz (1966): a filled delay removed the recency effect but not
     the primacy effect;
   - Loftus and Palmer (1974): two experiments; verbs including "smashed" and
     "contacted"; broken-glass question one week later, with "smashed", "hit" and
     control conditions;
   - Maguire et al. (2000): MRI, larger posterior hippocampi in London taxi drivers,
     volume correlated with time as a driver;
   - Woollett and Maguire (2011): longitudinal study of trainee taxi drivers;
   - Beck's negative cognitive triad (no year given).
7. The statement that the simple serotonin "chemical imbalance" account of depression
   is contested.
8. The significance convention given as "commonly p < 0.05". The course may present
   it as p ≤ 0.05.
9. That the disclosure guidance matches the specialist's own safeguarding protocol.
10. That no assessment weightings, durations, mark totals, criterion names or
    first-assessment years appear anywhere in these files. None are intended.
