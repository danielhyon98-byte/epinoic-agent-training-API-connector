Short version first. On an illustrative scheme (not the official markscheme), my provisional marks are (a) 1 out of 2, (b) 0 out of 1, (c) 1 out of 3, (d) 0 out of 2, total 2 out of 8; only your teacher and the IB award real marks. There is a genuine error in every part: (a) rounds too early, (b) has the percentage the wrong way round, (c) treats the power as a multiplication, and (d) gives a judgement with no evidence plus three claims the data cannot support. Details and corrected working are below. I worked everything by hand (I have no calculator here), so confirm the numbers on your GDC.

## Part (a): 33.75 mg, not 33.6 mg

Your line: "0.75^3 = 0.42, so A = 80 x 0.42 = 33.6 mg."

Rule: keep full accuracy until the last line, then round. 0.75^3 is not equal to 0.42; rounding it to 2 significant figures before multiplying shifts the final answer.

```text
A = 80 × 0.75^t
A = 80 × 0.75^3
0.75^2 = 0.5625
0.75^3 = 0.5625 × 0.75 = 0.421875
A = 80 × 0.421875
A = 33.75 mg (exact)
A ≈ 33.8 mg (3 s.f.)
```

Interpretation: 3 hours after the dose, the model says 33.75 mg of the drug remains in the patient's blood.

Why you lose a mark: the usual convention is exact or 3 significant figures unless the question says otherwise, and 33.6 is not correct to 3 significant figures (33.8), so the accuracy mark goes. Provisional mark on an illustrative scheme: 1 out of 2, for the correct substitution of t = 3 (method), with the accuracy mark lost; only your teacher and the IB award real marks.

## Part (b): 25% leaves, not 75%

Your line: "75% of the drug leaves the blood each hour, because the base is 0.75."

Rule: in A = 80 × 0.75^t, the base 0.75 is the fraction that remains after each hour. The fraction that leaves is 1 − 0.75 = 0.25, so 25% of the drug leaves the blood each hour.

Check with the first hour:

```text
A(0) = 80 mg
A(1) = 80 × 0.75 = 60 mg
Amount that left = 80 − 60 = 20 mg
Percentage that left = 20/80 × 100% = 25%
```

Note that your own part (d) says "exactly 25% per hour", which contradicts your part (b); a marker would notice. Provisional mark on an illustrative scheme: 0 out of 1, since the single mark is for 25%; only your teacher and the IB award real marks.

## Part (c): about 7.23 hours, not 10 minutes

Your line "0.75^t = 10/80 = 0.125" is right. The next line, "t = 0.125 / 0.75 = 0.167 hours", is the error: it treats 0.75^t as if it were 0.75 × t. Dividing undoes a multiplication; to undo a power with t in the exponent you take logarithms of both sides, or solve the equation on the GDC.

Quick check that exposes it: after 1 hour the model gives 60 mg (see part (b)), so after 10 minutes more than 60 mg is still in the blood, nowhere near 10 mg.

Corrected working by logarithms. I have used the standard values ln 2 ≈ 0.693147 and ln 3 ≈ 1.098612 (6 d.p.); check them on your GDC.

```text
80 × 0.75^t = 10
0.75^t = 10/80
0.75^t = 0.125
ln(0.75^t) = ln(0.125)
t × ln(0.75) = ln(0.125)
t = ln(0.125) / ln(0.75)
ln(0.125) = ln(1/8) = −3 × ln 2 ≈ −3 × 0.693147 = −2.079441
ln(0.75) = ln 3 − ln 4 = ln 3 − 2 × ln 2 ≈ 1.098612 − 1.386294 = −0.287682
t ≈ (−2.079441) / (−0.287682)
t ≈ 7.228
t ≈ 7.23 hours (3 s.f.), which is about 7 hours 14 minutes
```

On the GDC the equivalent method is to graph y = 80 × 0.75^x together with y = 10 and find the intersection, or to use the solver on 80 × 0.75^x = 10. Write the equation you solved on the page; "from GDC" on its own does not show a method.

Whole-hour check (powers worked by hand; confirm on your GDC):

```text
0.75^7 = 0.13348388671875, so A(7) = 80 × 0.13348388671875 ≈ 10.68 mg (still above 10 mg)
0.75^8 = 0.1001129150390625, so A(8) = 80 × 0.1001129150390625 ≈ 8.01 mg (below 10 mg)
```

So the amount first falls below 10 mg between 7 and 8 hours, which agrees with t ≈ 7.23 hours. Because the question says "fall below", the amount is below 10 mg for t > 7.23 hours. (If your teacher wanted complete hours, the answer would be 8 hours, but the question as written does not ask for that.)

Provisional mark on an illustrative scheme: 1 out of 3, for setting up 80 × 0.75^t = 10 and reaching 0.75^t = 0.125, with the method mark for logarithms or a GDC solve and the accuracy mark for 7.23 hours both lost; only your teacher and the IB award real marks.

## Part (d): your comment is not enough for 2 marks

Your line: "The model fits perfectly because all the numbers in the table are very close to the model, which proves the drug leaves the blood at exactly 25% per hour for ever."

Direct answer to your question: no. For 2 marks, a "comment on how well the model fits" needs evidence from the table, which means working out what the model predicts at the measured times and comparing. On top of that, three claims in your sentence cannot be supported:

1. "fits perfectly": the model values are not equal to the measured ones. At t = 3 the model gives 33.75 mg and the measurement is 35 mg. "Very close" is right; "perfectly" is wrong.
2. "proves": data can be consistent with a model; they cannot prove it. Other models could fit six points about as well.
3. "exactly 25% per hour for ever": the data cover 0 to 5 hours only, so they say nothing about the fit after 5 hours (that would be extrapolation). Also the hour-to-hour ratios of the measured values vary: 61/80 ≈ 0.76, 44/61 ≈ 0.72, 35/44 ≈ 0.80, 24/35 ≈ 0.69, 20/24 ≈ 0.83. The measured decay is roughly 25% per hour on average, not exactly 25% every hour.

The evidence you need (model values worked by hand from the powers of 0.75; confirm on your GDC):

| t (hours) | Measured A (mg) | Model A = 80 × 0.75^t (mg) | Measured − model (mg) |
| --- | --- | --- | --- |
| 0 | 80 | 80 | 0 |
| 1 | 61 | 60 | +1 |
| 2 | 44 | 45 | −1 |
| 3 | 35 | 33.75 | +1.25 |
| 4 | 24 | 25.3125 | −1.3125 |
| 5 | 20 | 18.984375 | +1.015625 |

Powers used: 0.75^4 = 0.31640625 and 0.75^5 = 0.2373046875. The largest difference is 1.3125 mg at t = 4, which is 1.3125/25.3125 × 100% ≈ 5.19% of the model value; at t = 5 the difference is 1.015625/18.984375 × 100% ≈ 5.35%. The signs alternate, so the model neither consistently over-predicts nor under-predicts.

A comment that earns both marks contains (1) that comparison, in a table or at least two named points, with the size of the differences, and (2) a judgement with a limitation: the model fits the measured data well over 0 ≤ t ≤ 5 hours, with every difference under about 1.4 mg (under about 6% of the model value), but the data say nothing about times after 5 hours and do not show that the hourly rate is exactly 25%. Write that in your own words.

Provisional mark on an illustrative scheme: 0 out of 2, because the one correct idea ("very close") has no supporting comparison and the rest of the sentence is incorrect; only your teacher and the IB award real marks.

## Summary

Provisional marks on an illustrative scheme, not the official markscheme: (a) 1 out of 2, (b) 0 out of 1, (c) 1 out of 3, (d) 0 out of 2, total 2 out of 8; only your teacher and the IB award real marks.

Two habits would fix most of this: keep exact values (0.421875, not 0.42) until the final line, and whenever the unknown is in the exponent, reach for logarithms or the GDC rather than division. For comment questions, always put a number from the model next to a number from the data.

Since this is homework your teacher will see, rewrite each part in your own working rather than copying the lines above; the corrected steps are there so you can see exactly where yours diverged.

Practice (same ideas, different numbers): a 120 mg dose decays according to A = 120 × 0.8^t. (i) Write down the percentage leaving each hour. (ii) Find the amount after 4 hours, exact and to 3 s.f. (iii) Find when the amount first falls below 15 mg. Paste your working and I will check it.

Sources: Source A, your draft answer with the question and data table (supplied text); course notes on exponential models, accuracy conventions and commenting on model fit (course notes)
