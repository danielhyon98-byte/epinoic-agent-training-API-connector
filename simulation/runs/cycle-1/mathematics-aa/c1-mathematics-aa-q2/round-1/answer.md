Your teacher's note makes sense once you see one thing: the ratio you used to find k is wrong, and because every later number is built on k, the test at t = 20, the time to reach 40 °C and the "half-life" are all wrong too. Separately, several sentences claim more than six readings can support ("proves", "clearly exponential", "accurate", "any time in the future"). Below I go through Source A line by line. I have given corrected numbers so you can check your own redo against them, but I have not rewritten any of your text: recalculate and write the section yourself, because it has to be your work.

## 1. Your calculations, line by line

**"At t = 0, A = 85 − 21 = 64."** Correct: T(0) = 21 + A, so A = 64.

**"k = −ln(60/85) ÷ 10 = 0.0348 ≈ 0.035."** The arithmetic matches the expression you wrote (−ln(60/85) ÷ 10 does give 0.0348), but the expression is wrong. In this model it is the excess temperature T − 21 that decays exponentially, not T itself, so the ratio must be (60 − 21)/(85 − 21) = 39/64, not 60/85. A quick check exposes the error: put t = 10 into your own model.

```text
T(10) = 21 + 64e^(−0.035 × 10)
T(10) = 21 + 64 × 0.7047
T(10) = 21 + 45.1
T(10) = 66.1 °C
```

Your model gives 66.1 °C at the very point you used to build it, where you measured 60 °C. Corrected working:

```text
Given: T(0) = 85, T(10) = 60, T_room = 21, A = 64
T(10) = 21 + 64e^(−10k) = 60
64e^(−10k) = 39
e^(−10k) = 39/64
−10k = ln(39/64)
k = (ln 64 − ln 39) ÷ 10
k = (4.1589 − 3.6636) ÷ 10
k = 0.4953 ÷ 10
k = 0.0495 min⁻¹ (3 s.f.)
```

So the model is T(t) = 21 + 64e^(−0.0495t), with k in min⁻¹ (state the unit). Keep the unrounded k = 0.04953 for later steps: rounding k to 0.035 (two significant figures) and then reusing it was a second, smaller problem.

**"At t = 20 the model gives T = 52.8 °C … a percentage error of only 1.1%."** 52.8 °C is right for your k (21 + 64e^(−0.7) = 21 + 64 × 0.4966 = 52.8), but the percentage error is not 1.1%. With the standard percentage error formula (it is in your formula booklet), error = |approximate − exact| ÷ exact × 100%, taking the measured value as exact:

```text
error = |52.8 − 45| ÷ 45 × 100%
error = 7.8 ÷ 45 × 100%
error = 17.3% (3 s.f.)
```

I cannot see where 1.1% came from. A 17% error at t = 20 is the data telling you that k is wrong. With the corrected k, the exponent at t = 20 is double the exponent at t = 10, so e^(−20k) = (39/64)² = 0.3713:

```text
T(20) = 21 + 64 × 0.3713
T(20) = 21 + 23.77
T(20) = 44.77 °C
error = |44.77 − 45| ÷ 45 × 100% = 0.5% (1 d.p.)
```

Testing at one point is not enough, so here is the corrected model against every reading (model values to 2 d.p.):

| t (min) | measured T (°C) | model T (°C) | percentage error |
| --- | --- | --- | --- |
| 0 | 85 | 85.00 | 0 (point used to fit) |
| 5 | 71 | 70.96 | 0.1% |
| 10 | 60 | 60.00 | 0 (point used to fit) |
| 15 | 51 | 51.44 | 0.9% |
| 20 | 45 | 44.77 | 0.5% |
| 30 | 35.5 | 35.48 | 0.1% |

The model values come from e^(−5k) = √(39/64) = 0.7806, so the excess temperatures are 64 × 0.7806 = 49.96, 64 × 0.7806² = 39.00, 64 × 0.7806³ = 30.44, 64 × 0.7806⁴ = 23.77 and 64 × 0.7806⁶ = 14.48. Every error is under 1%, and the four points you did not use to fit the model are the real test. For comparison, your k = 0.035 model gives T(30) = 21 + 64e^(−1.05) = 21 + 64 × 0.3499 = 43.4 °C against 35.5 °C measured, a 22% error that grows with time, which is the signature of a wrong decay constant.

**"My calculator gave r² = 0.97."** I cannot check this, and as written it does not say which regression it refers to. See claim 4 below for what to do with it.

**"t = ln(19/64) ÷ (−0.035) = 34.7 minutes."** The set-up is correct: 40 = 21 + 64e^(−kt) gives e^(−kt) = 19/64 (here you did subtract 21), and 34.7 follows from your k. With the corrected k:

```text
t = ln(19/64) ÷ (−0.04953)
t = (−1.2144) ÷ (−0.04953)
t = 24.5 minutes (3 s.f.)
```

A sanity check you could have made: your table has 45 °C at 20 minutes and 35.5 °C at 30 minutes, so the tea must pass 40 °C somewhere between 20 and 30 minutes. 34.7 minutes contradicts your own data; 24.5 minutes sits inside the range.

**"So the half-life of the tea is 34.7 minutes."** Two separate problems. First, the time to reach 40 °C is not a half-life. Second, "the tea" does not have a half-life; the excess temperature T − 21 does, because that is the quantity that decays exponentially. The half-life is the time for T − 21 to halve:

```text
e^(−kt) = 1/2
t = ln 2 ÷ k
t = 0.6931 ÷ 0.04953
t = 14.0 minutes (3 s.f.)
```

Check against the data: the excess starts at 64 °C, so it should be 32 °C (T = 53 °C) at about 14 minutes; you measured 51 °C at 15 minutes, which fits.

## 2. Claims you cannot justify from the data, and why

1. **"Newton proved in the Principia in 1687."** A cooling law is an empirical model, not a theorem, so "proved" is the wrong word. Also, as far as I recall, the law comes from a paper Newton published in 1701, not from the Principia; I am not certain enough for you to cite that on my word, so either check a reference you have actually read or drop the history. It earns nothing and currently contains a visible error.
2. **"Since the graph curves downwards, the data is clearly exponential."** Curving downwards rules out a straight line and nothing else; a quadratic or a reciprocal curve also curves downwards. The test for exponential decay is that equal time steps multiply the excess temperature by the same factor (a geometric sequence, which is AA content). Your data: 50/64 = 0.781, 39/50 = 0.780, 30/39 = 0.769, 24/30 = 0.800, and over the final 10-minute step 14.5/24 = 0.604 ≈ 0.777². The factor per 5 minutes is about 0.78 throughout, and the model predicts e^(−5k) = 0.781. That genuinely supports the model and is a far stronger sentence than "clearly exponential".
3. **"A percentage error of only 1.1% … so the model is accurate."** The number is wrong (17.3%), and one point cannot establish accuracy; the table above can.
4. **"r² = 0.97 proves that the data follows Newton's law of cooling."** r² measures how well one particular regression line fits one particular set of points; it cannot prove a physical law, and six readings from one cup cannot prove anything. You also need to say what was regressed on what. If your GDC fitted a straight line to T against t, r² = 0.97 says nothing about exponential behaviour at all. The meaningful version is a linear regression of ln(T − 21) on t (see part 3).
5. **"The half-life of the tea is 34.7 minutes."** Wrong quantity and wrong number; see above.
6. **"This exploration proves that Newton's law is correct."** It shows that six readings over 30 minutes are consistent with the model to within 1%. "Consistent with" is the honest and still impressive claim; "proves" is not available from any experiment.
7. **"The model can be used to predict the temperature of the tea at any time in the future."** You measured 0 to 30 minutes, so predictions inside that range are interpolation and reasonably safe; beyond it you are extrapolating and must say so. The model never drops below 21 °C, which is physically sensible only while the room stays at 21 °C, nobody stirs or adds milk, and the cup stays the same.

## 3. What to add

Mathematics:

- **State the law properly and show your formula satisfies it.** Newton's law says the rate of cooling is proportional to the excess temperature: dT/dt = −k(T − 21). Verifying by differentiation uses the chain rule, which is SL; solving the differential equation from scratch is, as far as I recall, HL only, so you do not need that (check with your teacher).

```text
T = 21 + 64e^(−kt)
dT/dt = 64 × (−k)e^(−kt)
dT/dt = −k × 64e^(−kt)
dT/dt = −k(T − 21)
```

- **Linearise and use all six points, not two.** Taking logarithms of the excess gives ln(T − 21) = ln 64 − kt, a straight line with gradient −k.

| t (min) | 0 | 5 | 10 | 15 | 20 | 30 |
| --- | --- | --- | --- | --- | --- | --- |
| T − 21 (°C) | 64 | 50 | 39 | 30 | 24 | 14.5 |
| ln(T − 21) | 4.159 | 3.912 | 3.664 | 3.401 | 3.178 | 2.674 |

Plot these, then use your GDC's linear regression with t as the x-variable and ln(T − 21) as the y-variable. My hand estimate of the gradient, from the sums Σt = 80, Σt² = 1650, Σy = 20.988 and Σty = 251.00:

```text
S_tt = 1650 − 80² ÷ 6 = 583.3
S_ty = 251.00 − 80 × 20.988 ÷ 6 = −28.84
gradient = −28.84 ÷ 583.3 = −0.0494
```

So the regression gives k ≈ 0.0494 min⁻¹, and r² for this line should be above 0.999 by my hand estimate; confirm both on the GDC and report the GDC's values, not mine. Comparing the regression k with the two-point value 0.0495 min⁻¹ is exactly the kind of check that shows understanding. One warning: the GDC's built-in exponential regression on T itself is the wrong tool, because T tends to 21, not to 0; regress on T − 21.

- **Error analysis in numbers.** Your readings look as if they are to the nearest 0.5 °C (35.5 appears). Say what the thermometer reads to, and show what a reading error does to k. If T(10) had been 59.5 °C or 60.5 °C:

```text
k = −ln(38.5/64) ÷ 10 = 0.0508 min⁻¹
k = −ln(39.5/64) ÷ 10 = 0.0483 min⁻¹
```

So a half-degree reading error moves k by about 0.001, which tells you the third significant figure of k is not reliable. That is a real finding worth a sentence, and it also shows how far 0.035 was outside any plausible range.

- Keep the percentage error table and comment on the largest error (0.9% at t = 15).
- Report the corrected time to 40 °C (24.5 min) and the half-life of the excess temperature (14.0 min), each with the data check beside it.
- Include both graphs: T against t with the model curve drawn through the points, and ln(T − 21) against t with the regression line, axes labelled with units.
- Define every symbol once and stick to it: t (min), T (°C), T_room = 21 °C (you switch between T_room and 21), A = 64 °C, k (min⁻¹). State the accuracy you are using and why.

Reflection:

- Replace "proves" with what the evidence supports: the data are consistent with exponential decay of the excess temperature to within 1% over 30 minutes.
- Give specific limitations: six readings, one cup, one trial; thermometer precision; room temperature assumed constant at 21 °C (how did you check it?); evaporation and the cup material, which the model ignores; the range of validity (0 to 30 min) and what extrapolation beyond it would assume.
- Say what r² does and does not tell you.
- One natural extension: use the model to predict when a second cup reaches 40 °C, then measure it. A prediction that is then tested is the clearest kind of personal engagement, and it gives you a real check on extrapolation.

## 4. A provisional idea of the score

I am not going to give you a number out of 20, and here is the honest reason: I do not have the official exploration criterion descriptors in this conversation, and a number invented against criteria I cannot see would mislead you three days before you redo the section. What I can give is a judgement in plain terms. My provisional judgement, not an official mark, is that as it stands the mathematics is at the right level for the course but the central value is wrong and the error runs through every later result, so this section would currently be marked down for accuracy rather than for ambition. My provisional judgement on the communication, again not an official mark, is that it is readable and in a logical order but misuses terms (half-life, proves, r²), leaves k without units and A without a definition, and reports a graph it does not show. With the corrections in parts 1 to 3 (correct k, the linearised regression, the derivative check, the error table and the sensitivity of k), my provisional view is that the same section would read as correct, thorough and showing understanding, which is a very different position. Only your teacher and the IB award real marks. If you paste the criterion descriptors your teacher gave you for the mathematics and communication criteria, I will give a provisional criterion-by-criterion estimate against them.

**Next step:** redo k and the ln(T − 21) table first, run the regression, and send me the GDC's gradient and r² together with your rewritten paragraph on testing the model. I will check them against the numbers above before Friday.

Sources: Source A, your IA draft extract "Exploring the model" (supplied text); Newton, Scala graduum caloris (1701) (recalled, not consulted)
