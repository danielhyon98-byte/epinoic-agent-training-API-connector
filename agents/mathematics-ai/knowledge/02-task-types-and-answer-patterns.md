---
document: 02-task-types-and-answer-patterns
subject: "Mathematics: Applications and Interpretation"
slug: mathematics-ai
version: 0.1.0
status: proposed supplement (not part of any pinned knowledge-base bundle)
precedence: the specialist's own master prompt and knowledge base win wherever this document disagrees with them
---

# Task types and answer patterns in AI

This document describes the kinds of request an AI student brings and what a strong
answer to each contains. Paper structures, timings, mark totals and weightings are
deliberately left out; if a student asks about them, use the specialist's own
knowledge base or tell the student to check the current IB subject guide with their
teacher.

## 1. How command terms change depth

The meanings below are paraphrases written for this document, not the official
glossary.

| Command term | What it demands | What the answer shows |
| --- | --- | --- |
| Write down, state | A value or fact needing little or no working | The result |
| Find, calculate, determine | A result reached by working | Set-up, substitution, result, units |
| Estimate | An approximate value, often from a model or graph | Method, value, a note on reliability |
| Show that | A given result | A chain from the givens to the stated result, without assuming it |
| Hence | Use the previous part | Explicit use of the earlier result |
| Interpret | Meaning in context | A sentence naming the variables, the value and its units |
| Comment, discuss | A reasoned judgement | A point about validity, reliability or limitations, with a reason |
| Justify | Reasons for a choice or claim | Evidence from the data, graph or calculation |
| Sketch | Shape and key features | Axes labelled, intercepts, turning points, asymptotes |

"Interpret" and "comment" questions are where AI students most often lose credit. A
number without context, or a comment without a reason, is incomplete.

## 2. Short-response questions with technology

A strong answer records what was done with technology so that a reader can repeat it:

- the model or test chosen and why, in one line;
- the inputs: data lists, the equation entered, or solver values such as number of
  periods, annual rate, present value, payment and compounding periods per year;
- the outputs with labels, for example "r = 0.912, y = 1.84x + 12.6";
- the final answer to the requested accuracy, with units and a context sentence.

Because the specialist has no GDC, it should give the set-up and ask the student to
supply the output when the output cannot be derived by hand. It should then interpret
the output the student supplies.

## 3. Extended modelling questions

Typical shape: a context, a proposed model, several parts that fit, use and criticise
it. A strong answer:

1. states the model with its variables and units;
2. shows how parameters were found (substitution of given points, or technology);
3. uses the model with substitutions on separate lines;
4. interprets each result in context;
5. comments on validity: domain, assumptions, extrapolation, alternatives.

Example. An investment of $500 grows at 8% per year, compounded annually, so its value
after t years is V = 500 × 1.08^t. When does it first reach $1000?

```text
500 × 1.08^t = 1000
1.08^t = 2
t = ln 2 / ln 1.08
t ≈ 9.01 (3 s.f.)
```

Interpretation: interest is added once a year, so check whole years.

```text
V(9) = 500 × 1.08^9 ≈ 999.50
V(10) = 500 × 1.08^10 ≈ 1079.46
```

So the investment first reaches $1000 after 10 complete years. Limitation: the model
assumes a constant 8% rate and no withdrawals, and it ignores inflation. (Confirm the
powers on your GDC.)

## 4. Statistics with technology: hypothesis tests

Use this template for any test the course includes (which tests are at which level
must be verified against the specialist's knowledge base or the current guide):

1. **Hypotheses in context**: H₀ and H₁ in words, with symbols if useful.
2. **Significance level**, stated before the test, for example 5%.
3. **Test and justification**: name the test and why it fits the data type.
4. **Inputs**: observed table, data lists, or summary values.
5. **Working that can be done by hand**: for small tables, expected frequencies and
   the test statistic, line by line.
6. **Degrees of freedom**, where relevant.
7. **Output**: the test statistic and p-value from the student's GDC, or a comparison
   with a critical value the specialist can state reliably.
8. **Decision**: compare p with the significance level (or the statistic with the
   critical value).
9. **Conclusion in context**, worded as "sufficient" or "insufficient" evidence to
   reject H₀.

Common weaknesses: hypotheses written only in symbols, a conclusion that says H₀ is
"proved", forgetting to check expected frequencies, and no context in the last line.

## 5. "Interpret" and "comment" answers

A strong interpretation sentence names the quantity, the value, the unit and the
situation. For a line y = 1.84x + 12.6, where x is the daily maximum temperature in °C
and y is the number of cold drinks a café sells: "The gradient 1.84 means each extra
1 °C is associated with about 1.84 more drinks sold per day, on average, within the
range of the data."

A strong comment gives a judgement and a reason: "The prediction for 40 °C is
unreliable because it lies outside the data range of 12 °C to 31 °C."

## 6. The exploration (internal assessment)

The AI internal assessment is an individual exploration (verify its name, criteria
and any length guidance against the current IB subject guide). AI explorations often
involve collecting or sourcing data and building a model. The specialist may:

- help a student turn an interest into a focused, answerable question;
- discuss whether data are suitable: sample size, how they were collected, bias,
  ethics and consent when people are involved;
- explain a statistical method or model the student has chosen, and its assumptions;
- interpret technology output the student supplies;
- check the student's own calculations and give qualitative or provisional feedback
  on the student's own draft;
- model a technique on a **different** dataset or context.

It must not write any section for submission, choose the student's question for
them, or analyse the student's own data as a finished piece of work.

General qualities of a strong exploration, in plain terms (illustrative, not the
official IB criteria): a clear aim, appropriate mathematics carried out correctly,
technology used purposefully and documented, notation and units used consistently,
genuine personal choices, interpretation in context, and honest reflection on
limitations and validity.

## 7. Giving provisional criterion-based feedback

Follow the shared answering rules: any mark is provisional and labelled as such in
the same sentence. For AI:

1. Use the mark allocation printed on the question. Without it, give qualitative
   feedback only.
2. Use an explicit scheme. If no official markscheme is available, say the scheme is
   illustrative. A useful illustrative scheme (illustrative, not the official IB
   criteria):
   - **Model or method**: an appropriate model, formula or test, correctly set up.
   - **Accuracy**: correct values, rounded as requested.
   - **Interpretation**: the result explained in context with units.
   - **Communication**: inputs recorded, notation clear, conclusion worded correctly.
3. Quote the student's own line when locating an error.
4. Write, for example: "Provisional mark on an illustrative scheme: 2 out of 3. Only
   your teacher and the IB award real marks."
5. Say what would earn the missing credit, especially any missing interpretation.

## 8. Other common request types

- **"Which test or model should I use?"** Ask what the data look like (categories or
  measurements, one variable or two, sample size) if not given, then justify a choice.
- **"Explain this GDC output."** Explain each labelled value, then what it means for
  the question. Never guess at values not shown.
- **"Check my answer."** Ask for the full question and data if they are not given.
- **"Give me practice."** Write original context questions with answers kept
  separate, so the student can try first.
