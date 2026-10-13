---
document: 02-task-types-and-answer-patterns
subject: Computer Science
slug: computer-science
version: 0.1.0
status: proposed supplement (not part of any pinned knowledge-base bundle)
precedence: the specialist's own master prompt and knowledge base win wherever this document disagrees with them
---

# Task types and answer patterns in Computer Science

This document describes the kinds of request a Computer Science student brings and
what a strong answer to each contains. Paper structures, case studies, options, mark
totals and weightings are deliberately left out because the IB has a new guide; use
the specialist's own knowledge base or tell the student to check with their teacher.

## 1. How command terms change depth

The meanings below are paraphrases written for this document, not the official list
(verify which command terms the current guide uses).

| Command term | What it demands | What the answer shows |
| --- | --- | --- |
| State, identify, define | A fact, name or precise definition | One accurate sentence or term |
| Outline | A brief account | Two or three linked points |
| Describe | A detailed account of what happens | Steps or features in order |
| Explain | Reasons or mechanism | "Because…", cause and effect, often an example |
| Compare, contrast | Similarities and differences | Points about both items, side by side |
| Evaluate, discuss, to what extent | A judgement | Advantages and disadvantages weighed, ending in a justified conclusion |
| Trace | The values code or an algorithm produces | A trace table and the output |
| Construct, design | An algorithm, code, diagram or table | A complete, working artefact, with assumptions stated |
| Calculate, determine | A value from working | Each step, with units |

A two-sentence "explain" answer that only states facts is the most common gap. A
strong one says **why**, often with a short concrete example.

## 2. Tracing code or pseudocode

A strong trace:

1. states the language or pseudocode convention and any assumption (indexing base,
   integer division);
2. uses a trace table with one column per variable, a column for each condition being
   tested, and an output column;
3. adds a row each time a variable changes or a condition is evaluated, in execution
   order;
4. ends with the output and the final values;
5. says that it was traced by hand.

For long loops, trace the first few iterations fully, identify the pattern, justify
it, and then state the result. Do not skip to a final value without showing how it
follows.

## 3. Algorithm design

A strong answer:

- restates the inputs, outputs and any assumptions (for example "the list is not
  empty" or "the list is sorted");
- writes the algorithm one step per line, with clear names and consistent
  indentation;
- initialises every variable before it is used, with a value that works for every
  valid input;
- makes loop bounds and the stopping condition explicit;
- handles edge cases or states which are excluded;
- includes a short trace on a small input;
- states the time complexity when the question asks or when choosing between methods.

When a question asks for pseudocode, avoid language-specific shortcuts (such as
built-in max or sort functions) unless the question allows them; the examiner usually
wants to see the logic.

## 4. Debugging and "what is wrong with this code?"

1. Quote the faulty line exactly.
2. Name the kind of error: syntax (will not run), runtime (crashes on some input) or
   logic (runs but gives a wrong result).
3. Give an input that exposes it and trace it.
4. Show the minimal fix.
5. Re-trace the same input to show the fix works, and suggest further test cases.

## 5. Complexity and comparison questions

Count how the number of basic steps grows with the input size n. A single loop over n
items is O(n); two nested loops over n items are O(n²); halving the search space each
step is O(log n). When comparing two algorithms or data structures, discuss time,
memory, whether data must be sorted, and ease of implementation, then give a
justified recommendation for the stated situation.

## 6. Boolean logic tasks

- **Truth tables**: list every input combination in binary counting order (for two
  inputs: 00, 01, 10, 11; for three inputs: 000 to 111). Add intermediate columns for
  sub-expressions.
- **From a description to an expression**: for "the output is 1 when exactly one of A
  and B is 1", the rows giving 1 are A, B = 01 and 10, so the output is
  (NOT A AND B) OR (A AND NOT B), which is A XOR B.
- **Simplification**: name each identity used on its own line, and check the result
  with a truth table.
- **Circuits**: describe each gate, its inputs and its output, from inputs to output.

## 7. Data-representation and calculation tasks

Show every conversion step: place values, or repeated division with remainders, or
grouping into four-bit nibbles for hexadecimal. For file sizes and transfer times,
write the formula, substitute with units, and convert units on separate lines.

## 8. Databases

A strong answer to a design question names the tables, fields, primary keys and
foreign keys, and explains how relationships avoid repeated data. For a query, state
which tables and conditions are involved, write the query clearly, and say what it
returns. Which query syntax the course expects needs verifying against the student's
materials.

## 9. Object-oriented programming

For design questions, name classes, attributes (with types and access), methods (with
parameters and return types), and relationships (inheritance or "has-a"). For "explain
the benefit" questions, link the feature to a consequence, for example "encapsulation
lets the class check values before changing an attribute, so other code cannot set an
invalid balance".

## 10. Networks and systems

Explain mechanisms in order (how a packet is addressed, routed and reassembled) and
use correct terms. For evaluation questions, weigh factors such as cost, speed,
reliability, security and the users' needs.

## 11. The internal assessment (project)

The internal assessment involves the student developing their own computational
solution (verify its name, requirements and criteria against the current guide). The
specialist may explain concepts and techniques, help the student break their own
problem into parts, review the student's own code and point out bugs and their
causes, suggest test strategies, and demonstrate a technique on a **different, small**
example. It must not write code, designs, documentation or evaluations for
submission. See the answering-functionality document.

## 12. Giving provisional criterion-based feedback

Follow the shared answering rules: any mark is provisional and labelled as such in the
same sentence.

1. Use the mark allocation printed on the question; without it, give qualitative
   feedback only.
2. Use an explicit scheme. If no official markscheme is available, say the scheme is
   illustrative. Useful illustrative schemes (illustrative, not the official IB
   criteria):
   - **For code or algorithms**: correct logic; correct initialisation and loop
     bounds; edge cases handled; clear structure and names; efficiency where asked.
   - **For written explanations**: accuracy; depth matched to the command term;
     correct technical vocabulary; a relevant example.
   - **For calculations and conversions**: correct method; correct result; units or
     base shown.
3. Quote the student's own line when locating an error.
4. Write, for example: "Provisional mark on an illustrative scheme: 1 out of 2. Only
   your teacher and the IB award real marks."
5. Say what would earn the missing credit.

## 13. Other common request types

- **"Explain this concept."** Definition, a small example, and a common confusion.
- **"Is my code right?"** Ask for the full code and the task specification if not
  given; trace by hand; never claim to have run it.
- **"Give me practice."** Write original tasks with answers kept separate.
