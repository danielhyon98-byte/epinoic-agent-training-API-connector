---
document: 01-subject-thinking-and-skills
subject: "Mathematics: Applications and Interpretation"
slug: mathematics-ai
version: 0.1.0
status: proposed supplement (not part of any pinned knowledge-base bundle)
precedence: the specialist's own master prompt and knowledge base win wherever this document disagrees with them
---

# Thinking and skills in Mathematics: Applications and Interpretation

This document describes how strong AI students think and the errors that most often
cost them credit. Use it to diagnose difficulties, not as a syllabus. Which topics
are SL or HL, and what the formula booklet contains, must come from the specialist's
own knowledge base or the student's teacher.

## 1. What AI values

AI is the mathematics course with an emphasis on **modelling, statistics and the use
of technology**. Compared with Analysis and Approaches (AA), it puts more weight on:

- turning a real situation into a mathematical model, and judging whether the model
  is reasonable;
- collecting, summarising and testing data;
- using technology (a graphic display calculator, spreadsheets, graphing or
  statistics software) to do heavy computation, so that the student's effort goes into
  choosing methods and interpreting results;
- communicating conclusions **in context**, with units and appropriate accuracy.

Algebra still matters, but an AI answer is rarely complete without a sentence that
says what the number means in the situation.

## 2. Core ideas students should connect

- **The modelling cycle**: define the problem, state assumptions, choose a model,
  fit it (often with technology), test it against data, interpret, then refine or
  state limitations.
- **Function models**: linear, quadratic, cubic, exponential, power and inverse
  variation, sinusoidal, and possibly logistic or piecewise models (check the level
  against the current IB subject guide).
- **Statistics**: sampling and bias, summary statistics, graphs, correlation and
  regression, interpolation and extrapolation, hypothesis testing.
- **Probability**: combined and conditional events, binomial and normal distributions.
- **Financial mathematics**: compound interest, depreciation, loans and annuities,
  inflation.
- **Geometry and trigonometry** in context: bearings, areas, volumes, angles of
  elevation.
- **Calculus** as rates of change, optimisation and accumulated change.
- Possibly HL-only (verify): matrices and their applications, graph theory and
  networks, differential equations as models.

## 3. Using technology when the specialist has none

The pilot gives the specialist no calculator, spreadsheet or code execution. This
changes how it should help:

- **Set up, then interpret.** Show the student exactly what to enter (the model,
  the data lists, the solver inputs) and how to read the output.
- **Compute by hand only what can be done reliably by hand**, and show it line by
  line: small expected-frequency tables, percentage changes, a few terms of a series,
  compound interest with a simple rate.
- **Never invent technology output.** A regression coefficient, a p-value or a
  TVM-solver result that cannot be derived by hand must come from the student's own
  GDC. Ask them to paste it, then interpret it.
- **Tell the student to confirm** any hand-computed value on their GDC.

## 4. Notation and reporting conventions

- Default accuracy: exact, or 3 significant figures unless the question says
  otherwise (a working convention; verify against the current IB subject guide).
  Money is usually given to the nearest cent or penny, or as the question states.
- Keep full accuracy in intermediate steps; round only at the end.
- Hypotheses: write H₀ and H₁ in words and, where useful, symbols. State the
  significance level before the test.
- Regression lines: name the variables, for example "y = 2.3x + 5, where x is the
  daily maximum temperature in °C and y is the number of drinks sold", and give units.
- Rates of change need units: "8.5 m s⁻¹", "£12 per item", "3.2 cm per day".
- Use percentages and decimals consistently within one answer.

## 5. Common errors and how to correct them

For each error, show the student a check that exposes it.

### Percentages
- **Wrong base for a percentage change.** A price rising from 80 to 100 is a 25%
  increase, because (100 − 80)/80 × 100 = 25. Falling from 100 to 80 is a 20%
  decrease, because (80 − 100)/100 × 100 = −20. The base is always the original value.
- **Percentage error.** Divide by the exact value. With exact value 250 and
  approximate value 240: |240 − 250|/250 × 100% = 4%. Dividing by 240 gives about
  4.17%, which is wrong.

### Financial mathematics
- **Simple instead of compound change.** A 15% annual depreciation over 3 years
  multiplies by 0.85 three times; it is not a 45% reduction.
- **Compounding periods.** For an annual rate r% compounded k times a year for n
  years, the rate per period is r/k % and there are kn periods.
- **Premature rounding.** Rounding a per-period rate or multiplier early can change
  the final value in the cents or pennies. Keep the full multiplier until the last
  line.

### Models and calculators
- **Degrees versus radians.** For a model h(t) = 12 + 4sin(30t) with the angle in
  degrees, h(1) = 12 + 4 × sin 30° = 12 + 4 × 0.5 = 14. A GDC in radian mode instead
  gives about 8.05. State the mode, and check one value by hand.
- **Extrapolation.** A model fitted to data from 0 to 10 years may fail badly at 30
  years. Say when a prediction lies outside the data range and how reliable it is.
- **Unrealistic models.** Exponential growth cannot continue for ever; a quadratic
  profit model may give negative sales. Comment on the domain where the model makes
  sense.
- **Interpreting parameters.** The gradient of a regression line is the change in y
  per unit change in x, with units. The intercept may have no sensible meaning if
  x = 0 lies outside the data.

### Statistics
- **Correlation is not causation.** A strong r tells you the variables move together,
  not that one causes the other. Look for a third variable or reverse direction.
- **A high r is not proof of a linear relationship.** Look at the scatter diagram
  first: a curve or an outlier can still produce a high r.
- **Regression direction.** A line of y on x predicts y from x. Do not use it to
  predict x from y.
- **p-value misreading.** The p-value is the probability, assuming H₀ is true, of a
  result at least as extreme as the one observed. It is not the probability that H₀
  is true.
- **Conclusion wording.** Say "there is sufficient evidence at the 5% significance
  level to reject H₀" or "there is insufficient evidence to reject H₀". Avoid "H₀ is
  proved" or "we accept H₀ as true".
- **Small expected frequencies.** In chi-squared tests, very small expected
  frequencies make the test unreliable; a common convention is that each should be at
  least 5, combining categories if needed (verify the course's rule).
- **Sample versus population.** Be clear which one a statistic describes, and which
  standard deviation the question wants (verify the course convention).
- **Outliers.** A common rule flags values more than 1.5 × IQR beyond the quartiles
  (verify the rule the student's course uses). An outlier is a value to investigate,
  not automatically to delete.

### Units and reading the question
- Convert units before substituting, and show the conversion: "250 cm = 2.5 m".
- Answer the question asked: "after how many complete years" needs a whole number
  with a reason, not the decimal solution of an equation.

## 6. How to correct an error well

1. Quote the student's line where the error happens.
2. Name the rule in plain words.
3. Show a quick check that exposes it.
4. Redo only the affected steps, one relation per line.
5. Add one sentence of interpretation in context, because AI answers need it.
6. Offer one short practice item on the same idea.
