---
document: 01-subject-thinking-and-skills
subject: "Mathematics: Analysis and Approaches"
slug: mathematics-aa
version: 0.1.0
status: proposed supplement (not part of any pinned knowledge-base bundle)
precedence: the specialist's own master prompt and knowledge base win wherever this document disagrees with them
---

# Thinking and skills in Mathematics: Analysis and Approaches

This document describes how strong AA students think and the errors that most often
cost them credit. Use it to diagnose a student's difficulty, not as a syllabus. Which
topics are SL or HL, and what the formula booklet contains, must come from the
specialist's own knowledge base or the student's teacher.

## 1. What AA values

AA is the mathematics course with an **analytical and algebraic emphasis**. Compared
with Applications and Interpretation (AI), it puts more weight on:

- manipulating expressions exactly (surds, logarithms, fractions, π) rather than
  reading values from technology;
- reasoning and **proof**: showing why a result holds in general, not only checking
  cases;
- calculus developed from functions and limits, with attention to domain and
  conditions;
- structure: seeing that a problem is a quadratic in disguise, a geometric series or
  a composite function.

Technology still matters in AA, but the default expectation is that the student can
justify each step by hand. When explaining, lead with the algebraic method and
mention a technology check as a second line, not the other way round.

## 2. Core ideas students should connect

- **Functions** as the central object: domain, range, composition, inverses,
  transformations, and how a graph and a formula describe the same thing.
- **Algebra**: factorising, completing the square, laws of indices and logarithms,
  solving equations and inequalities, sequences and series.
- **Trigonometry**: exact values, identities, the unit circle, solving equations in a
  stated interval.
- **Calculus**: derivatives as rates of change and gradients, the chain, product and
  quotient rules, integration as accumulation and as area, kinematics.
- **Probability and statistics**: combined events, conditional probability, discrete
  and continuous distributions.
- **Proof**: direct proof, counterexample, and (possibly HL only; verify against the
  current IB subject guide) induction and contradiction.

When a student is stuck, ask which of these ideas the question is "really" about.
Naming the structure is often the breakthrough.

## 3. A problem-solving routine

Teach and model this routine. It is also the routine the specialist should follow.

1. **Read for the command term and the demand.** "Write down" needs little working;
   "show that" needs every step; "hence" means use the previous result.
2. **List what is given and what is required**, with any restrictions such as
   "x > 0" or "0 ≤ θ ≤ 2π".
3. **Choose a representation**: equation, diagram, table, substitution (for example
   u = sin x).
4. **Plan, then execute one step per line.**
5. **Check**: substitute answers back, test a simple case, check signs and the
   interval, and ask whether the size of the answer is sensible.
6. **Answer the question asked**, in the form asked (exact, 3 significant figures,
   coordinates, an interval).

## 4. Notation conventions

- Write exact values when the question allows: √2, ln 3, π/6, 2/3. Give decimals only
  when asked or when no exact form exists, and say how they were rounded.
- Default accuracy: unless a question says otherwise, use exact values or 3
  significant figures (a working convention; verify against the current IB subject
  guide). Keep full accuracy in intermediate steps and round only at the end.
- Make logarithm bases explicit: ln x for base e, log₁₀ x or log_a x otherwise.
- Distinguish f⁻¹(x) (inverse function) from 1/f(x) (reciprocal). For f(x) = 2x + 1,
  f⁻¹(x) = (x − 1)/2 but 1/f(x) = 1/(2x + 1).
- sin²x means (sin x)². sin⁻¹x means arcsin x, not 1/sin x.
- Use interval or inequality notation consistently, for example x > 3 or ]3, ∞[ (or
  (3, ∞) if that is the student's convention).
- Angles in calculus are in radians unless degrees are stated.
- Use the Unicode minus "−" or an ordinary hyphen consistently within one answer.

## 5. Common errors and how to correct them

For each error, show the student a quick check that exposes it, so they can catch it
themselves next time.

### Algebra and signs
- **Distributing a negative.** −2(x − 4) = −2x + 8, not −2x − 8. Check by
  substituting a value, for example x = 0: −2(0 − 4) = 8.
- **Squaring a sum.** (a + b)² ≠ a² + b². With a = 2 and b = 3: (2 + 3)² = 25 but
  2² + 3² = 13.
- **Square roots of sums.** √(9 + 16) = 5, not 3 + 4 = 7.
- **Logarithm of a sum.** ln(a + b) ≠ ln a + ln b. The law is ln(ab) = ln a + ln b.
  Numerically, ln 5 ≈ 1.609 while ln 2 + ln 3 = ln 6 ≈ 1.792.
- **Dividing by a variable.** From x² = 3x, dividing by x gives only x = 3. Instead
  write x² − 3x = 0, so x(x − 3) = 0, so x = 0 or x = 3.

### Domain restrictions and extraneous roots
- ln(x − 3) needs x > 3; √(x + 2) needs x ≥ −2; 1/(x − 1) needs x ≠ 1. State the
  restriction before solving.
- **Squaring both sides can add false roots.** Solving √(x + 2) = x: squaring gives
  x + 2 = x², so x² − x − 2 = 0, so (x − 2)(x + 1) = 0, giving x = 2 or x = −1.
  Check: x = 2 gives √4 = 2, which works; x = −1 gives √1 = 1 ≠ −1, so reject it.
- **Logarithm equations.** After combining logs, check every root against the
  original domain (see the worked example in the examples document).

### Trigonometry
- **Radians versus degrees.** sin 30° = 0.5, but sin(30) with 30 in radians is about
  −0.988. A calculator in the wrong mode gives a confident wrong answer.
- **Missing solutions in an interval.** sin x = 0.5 for 0 ≤ x < 2π has two solutions,
  x = π/6 and x = 5π/6. Sketch or use symmetry to find every solution in the stated
  interval, then check the endpoints.

### Calculus
- **Chain rule omitted.** d/dx [sin(3x)] = 3cos(3x), not cos(3x).
- **Forgetting the constant.** Indefinite integrals need + C.
- **∫ 1/x dx = ln|x| + C**: the modulus matters when x can be negative.
- **Signed integral versus area.** ∫ from 0 to 2π of sin x dx = 0, but the area
  between the curve and the x-axis over that interval is 4 (each half contributes 2).
  When asked for an area, split at the roots or integrate |f(x)|.
- **Stationary points**: f′(x) = 0 locates them; a second-derivative or sign test is
  still needed to classify them, and f″(x) = 0 is inconclusive on its own.

### Probability
- **Adding without subtracting the overlap.** P(A ∪ B) = P(A) + P(B) − P(A ∩ B). With
  P(A) = 0.5, P(B) = 0.4 and P(A ∩ B) = 0.2, P(A ∪ B) = 0.7.
- **Independent is not the same as mutually exclusive.** In the same example,
  P(A) × P(B) = 0.5 × 0.4 = 0.2 = P(A ∩ B), so A and B are independent, but they are
  not mutually exclusive because P(A ∩ B) ≠ 0.
- **Conditional probability direction.** P(A | B) and P(B | A) are usually different;
  name which event is given.

### Rounding
- **Premature rounding.** (√2)¹⁰ = 32 exactly. Rounding √2 to 1.41 first gives
  1.41¹⁰ ≈ 31.1, which is wrong at 3 significant figures. Keep exact values or full
  calculator precision until the final line.
- **Significant figures.** 0.0045678 → 0.00457; 12 345 → 12 300; 2.996 → 3.00 (the
  trailing zeros show the accuracy).

## 6. How to correct an error well

1. Point to the exact line where the error happens, quoting the student's working.
2. Name the rule that was broken in plain words.
3. Show a quick numerical or substitution check that exposes the error.
4. Redo only the affected steps, one relation per line.
5. Give one short practice item that targets the same error.

Do not rewrite a whole correct solution when one line is wrong; the student learns
more from seeing exactly where things went off track.
