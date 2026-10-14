---
document: 02-task-types-and-answer-patterns
subject: "Mathematics: Analysis and Approaches"
slug: mathematics-aa
version: 0.1.0
status: proposed supplement (not part of any pinned knowledge-base bundle)
precedence: the specialist's own master prompt and knowledge base win wherever this document disagrees with them
---

# Task types and answer patterns in AA

This document describes the kinds of request an AA student brings and what a strong
answer to each contains. Paper structures, timings, mark totals and weightings are
deliberately left out; if a student asks about them, use the specialist's own
knowledge base or tell the student to check the current IB subject guide with their
teacher.

## 1. How command terms change depth

The command term tells you how much working the answer needs. The meanings below are
paraphrases written for this document, not the official glossary.

| Command term | What it demands | What the answer shows |
| --- | --- | --- |
| Write down | A result that needs little or no calculation | The result, perhaps one supporting line |
| State | A fact or value without justification | The fact |
| Find, calculate, determine | A result reached by working | Every step that leads to the result |
| Solve | All values satisfying an equation or inequality in the stated domain | Method, every solution, rejected roots with reasons |
| Show that | A given result | A chain from the givens to exactly the stated result, without assuming it |
| Prove | A general, rigorous argument | Logical steps, each justified, ending in a conclusion statement |
| Hence | Use the previous part | Explicit use of the earlier result |
| Hence or otherwise | The previous part is a hint, but any valid method works | A method, ideally the efficient one |
| Sketch | Shape and key features | Intercepts, turning points, asymptotes, end behaviour, labelled |
| Justify, explain | Reasons | A reason tied to a definition, theorem or calculation |
| Verify | Confirm a given value works | Substitution and a check that both sides agree |

When the student has not given the command term, ask for the exact wording or state
the depth you have assumed.

## 2. Short-response questions

Typical shape: a few linked parts, each needing a single technique.

- Identify the technique first (for example "this is a chain-rule derivative").
- Write the working one relation per line.
- Give the final answer in the requested form and accuracy.
- Use earlier parts: later parts often depend on them.

## 3. Extended-response questions

Typical shape: a longer context with parts that build on one another.

- Keep a clear label for each part, matching the question.
- Carry exact values forward. If the student's earlier answer was wrong but their
  later method is right, say that the later method is sound; markschemes often give
  credit for correct method applied to an earlier wrong value (verify the follow-through
  conventions the student's teacher uses).
- At the end of a context-based part, write a one-line statement answering the
  question in words.

## 4. "Show that" questions

A strong answer:

1. starts from the givens, not from the result;
2. shows every algebraic step, with no jump that hides the key move;
3. ends with a line that is exactly the given result, followed by a short concluding
   phrase.

Example. Show that the curve y = x³ − 3x has a stationary point at x = 1.

```text
dy/dx = 3x² − 3
At x = 1: dy/dx = 3(1)² − 3
dy/dx = 3 − 3
dy/dx = 0
So the gradient is zero at x = 1, and the curve has a stationary point there.
```

A common weak answer substitutes x = 1 into y instead of dy/dx, or writes "0 = 0"
without saying what it shows.

## 5. Proof

### Counterexample
To disprove a general statement, one valid counterexample is enough. "n² + n + 41 is
prime for every positive integer n" holds for n = 1 to 39 but fails at n = 40:
40² + 40 + 41 = 1681 = 41².

### Proof by induction (possibly HL only; verify against the current IB subject guide)
Structure a strong answer in four labelled parts. Example: prove that
1 + 3 + 5 + … + (2n − 1) = n² for every positive integer n.

```text
Base case: n = 1. Left side = 1. Right side = 1² = 1. True for n = 1.
Assumption: assume 1 + 3 + … + (2k − 1) = k² for some positive integer k.
Inductive step: 1 + 3 + … + (2k − 1) + (2(k + 1) − 1)
  = k² + 2(k + 1) − 1
  = k² + 2k + 1
  = (k + 1)²
Conclusion: the statement is true for n = 1, and if it is true for n = k it is true
for n = k + 1, so it is true for every positive integer n.
```

The most common weaknesses are a missing or vague conclusion, writing the assumption
as if it were already proved for all n, and not showing where the assumption is used.

### Proof by contradiction (possibly HL only; verify)
State the assumption to be contradicted, derive consequences step by step, identify
the contradiction explicitly, and conclude. The proof that √2 is irrational is the
standard model; when explaining it, make the "lowest terms" assumption visible.

## 6. Questions with and without technology

Some AA papers do not allow a graphic display calculator (GDC) and some do (verify
which papers allow one against the current IB subject guide). The specialist has no
calculator in the pilot, so:

- solve by exact methods whenever possible;
- when a question clearly expects technology (for example a numerical root of a
  transcendental equation), set up the equation, say which GDC feature the student
  would use, give an estimate only if it can be reasoned by hand, and ask the student
  to confirm the value on their GDC;
- never write "using my calculator" or "I checked numerically".

## 7. The exploration (internal assessment)

The AA internal assessment is an individual exploration (verify its name, criteria and
any length guidance against the current IB subject guide). The specialist may:

- help a student narrow a topic into a focused question they can answer with
  mathematics at a suitable level;
- explain mathematics the student wants to use;
- check the student's own working for errors;
- give qualitative or provisional feedback on the student's own draft;
- model a technique on a **different** example.

The specialist must not write sections, paragraphs, derivations or conclusions for
submission. See the answering-functionality document for how to decline.

General qualities of a strong exploration, in plain terms (illustrative, not the
official IB criteria): a clear aim, mathematics that is correct and appropriately
challenging, notation and definitions used consistently, a structure a peer could
follow, genuine personal choices and engagement, and honest reflection on results and
limitations. Map feedback onto the official criteria only when the student supplies
them or the specialist's own knowledge base contains them.

## 8. Giving provisional criterion-based feedback

When a student shares a solution and asks "how many marks?", follow the shared
answering rules (any mark is provisional, labelled as such in the same sentence).
For AA:

1. Ask for, or use, the mark allocation printed on the question. Without it, give
   qualitative feedback only.
2. Use an explicit scheme. If no official markscheme is available, say the scheme is
   illustrative. A useful illustrative scheme (illustrative, not the official IB
   criteria):
   - **Method**: a valid approach, correctly set up.
   - **Accuracy**: correct values from that method.
   - **Reasoning**: justifications where the question needs them (rejecting a root,
     classifying a stationary point, concluding a proof).
   - **Communication**: notation, units if any, the final answer in the requested form.
3. Quote the student's own line when locating an error.
4. Give the provisional mark in the same sentence as its label, for example:
   "Provisional mark on an illustrative scheme: 3 out of 4. Only your teacher and the
   IB award real marks."
5. Say what would earn the missing credit.

## 9. Other common request types

- **"Explain this concept."** Give a one-line definition, a small worked example, and
  a common mistake.
- **"Check my answer."** Ask for the full question if it is not given. Never confirm
  an answer to a question you cannot see.
- **"Give me practice."** Write original questions with the answers and brief
  working kept separately or at the end, so the student can try first.
- **"How do I revise?"** Suggest active practice: mixed questions, error logs, and
  redoing corrected questions a few days later.
