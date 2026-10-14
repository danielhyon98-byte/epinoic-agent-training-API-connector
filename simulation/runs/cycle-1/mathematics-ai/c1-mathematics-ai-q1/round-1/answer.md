Short answers first, then the detail and the working.

- **Your teacher is right, with one refinement.** Spearman's coefficient is for relationships that are *monotonic* (y keeps rising, or keeps falling, as x rises) but not necessarily linear, for data that are ranks, and for data where an outlier would distort Pearson's r. If the pattern is not even monotonic (a U-shape, say), neither coefficient is suitable.
- **Your friend's history is right, but the conclusion is wrong.** Charles Spearman was a psychologist and published his coefficient in 1904. That makes it no less mathematical: it is Pearson's formula applied to ranks, it is in the AI SL course, and examiners do not prefer one coefficient; they expect the one that suits the data and the question.
- **For your six data points, by hand:** r ≈ 0.932 and r_s ≈ 0.943 (3 s.f.). Both are described as a strong positive correlation.
- **0.7 is a textbook convention, not an IB rule.**

I am treating this as the practice set you call it. If it is being handed in for a mark, write up your own version and use mine only to check each line.

## 1. What each coefficient measures, and where it came from

**Pearson's product-moment correlation coefficient, r.** It measures how closely the points on a scatter diagram lie to a single straight line, using the actual values of x and y. r = +1 means every point lies exactly on a line with positive gradient, r = −1 on a line with negative gradient, and r = 0 means no linear relationship. The name describes the method: it averages the products of the deviations of x and y from their means (you will see this in the table below). Because it uses every actual value, one extreme point can move it a lot, and it is only meaningful for linear relationships: points lying exactly on a rising curve can have r well below 1.

Origin: the idea of co-relation came from Francis Galton, who was studying heredity and published it in 1888. Karl Pearson, a mathematician working on Galton's biological data, gave the coefficient its modern definition and formula in papers of 1895 to 1896, which is why it carries his name. I believe similar mathematics appears earlier, in the 1840s, in work by the French physicist Auguste Bravais, which is why some books say Bravais-Pearson.

**Spearman's rank correlation coefficient, r_s.** Replace each x by its rank (1 for the smallest) and each y by its rank, then calculate Pearson's r on the ranks. That is the definition. When there are no ties it simplifies to r_s = 1 − 6Σd²/(n(n² − 1)), where d is the difference between the two ranks of each point. So r_s measures how consistently y increases (or decreases) as x increases, ignoring by how much. r_s = +1 means the order of the y values exactly matches the order of the x values, even if the relationship is curved. Ranks cap every value (the largest x is ranked 6 whether it is 12 or 1200), so an outlier has limited effect.

Origin: the English psychologist Charles Spearman, in a 1904 paper, The proof and measurement of association between two things, in the American Journal of Psychology. He wanted to correlate things such as test rankings where the raw numbers were not on a reliable scale.

**Verdict on the two claims.**

- Teacher: correct, refined to "use Spearman's when the relationship is monotonic but not linear, when the data are ranks or ordinal, or when an outlier would distort r". Always look at the scatter diagram first; if the pattern is not monotonic at all, say so instead of quoting either coefficient.
- Friend: the fact is right (a psychologist, 1904) but the conclusion does not follow. Most of modern statistics was developed by people working on biology, agriculture and psychology; Pearson's own coefficient grew out of Galton's heredity data. Spearman's coefficient is Pearson's r on ranks, so it is exactly as mathematical. The AI SL course includes both and asks you to know when each is appropriate and how outliers affect each (your teacher is teaching you both, which fits). In exam questions the wording normally tells you which to find; where it does not, the data type decides. There is no examiner preference; using the wrong coefficient is what loses marks.

## 2. Your practice data, by hand

Accuracy: 3 significant figures, assumed because the question does not say.

### Pearson's r

```text
Σx = 2 + 3 + 5 + 6 + 8 + 12 = 36,   x̄ = 36/6 = 6
Σy = 44 + 52 + 48 + 60 + 66 + 72 = 342,   ȳ = 342/6 = 57
```

| x | y | x − x̄ | y − ȳ | (x − x̄)² | (y − ȳ)² | (x − x̄)(y − ȳ) |
|---|---|---|---|---|---|---|
| 2 | 44 | −4 | −13 | 16 | 169 | 52 |
| 3 | 52 | −3 | −5 | 9 | 25 | 15 |
| 5 | 48 | −1 | −9 | 1 | 81 | 9 |
| 6 | 60 | 0 | 3 | 0 | 9 | 0 |
| 8 | 66 | 2 | 9 | 4 | 81 | 18 |
| 12 | 72 | 6 | 15 | 36 | 225 | 90 |
| Sum | | 0 | 0 | 66 | 590 | 184 |

The two deviation columns sum to 0, which checks that the means are right.

```text
Sxx = Σ(x − x̄)² = 66
Syy = Σ(y − ȳ)² = 590
Sxy = Σ(x − x̄)(y − ȳ) = 184

r = Sxy / √(Sxx × Syy)
r = 184 / √(66 × 590)
r = 184 / √38940
197.3² = 38927.29 and 197.4² = 38966.76, so √38940 ≈ 197.33
r ≈ 184 / 197.33
r ≈ 0.9324
r ≈ 0.932 (3 s.f.)
```

Check without a square root: r² = 184²/38940 = 33856/38940 ≈ 0.869, and 0.932² ≈ 0.869, so the two agree. If your class uses the form Sxy = Σxy − n x̄ ȳ, you get the same number: Σxy = 88 + 156 + 240 + 360 + 528 + 864 = 2236, and 2236 − 6 × 6 × 57 = 2236 − 2052 = 184.

### Spearman's r_s

Rank each variable separately, 1 for the smallest. There are no ties, so the shortcut formula applies.

| x | y | rank of x | rank of y | d | d² |
|---|---|---|---|---|---|
| 2 | 44 | 1 | 1 | 0 | 0 |
| 3 | 52 | 2 | 3 | −1 | 1 |
| 5 | 48 | 3 | 2 | 1 | 1 |
| 6 | 60 | 4 | 4 | 0 | 0 |
| 8 | 66 | 5 | 5 | 0 | 0 |
| 12 | 72 | 6 | 6 | 0 | 0 |
| | | | | Σd² = | 2 |

```text
r_s = 1 − 6Σd² / (n(n² − 1))
r_s = 1 − (6 × 2) / (6 × (36 − 1))
r_s = 1 − 12 / 210
r_s = 1 − 2/35
r_s = 33/35
r_s ≈ 0.943 (3 s.f.)
```

If there had been ties, you would give tied values the average of the ranks they occupy and calculate Pearson's r on the ranks; the shortcut formula is then only approximate.

I worked all of this by hand. When you are allowed the GDC again, confirm r by entering the two data lists and r_s by entering the two rank lists.

### Why they come out different for the same data

They measure different things, so they agree exactly only for special data.

- r_s only sees order. In the rank table the only disorder is one swap: the student who revised 5 hours scored 48, below the 52 of the student who revised 3 hours. Everything else is in perfect order. That single swap reduces r_s from 1 by 12/210 ≈ 0.057, so r_s stays close to 1.
- r sees the actual values and asks how close the points are to one straight line. The line of best fit has gradient Sxy/Sxx = 184/66 ≈ 2.79 marks per hour and passes through the mean point (6, 57). The point (5, 48) sits about 6 marks below that line and the others are within about 3.5 marks of it; that scatter is what pulls r down to 0.932. The point (12, 72) is far out in x, so it has a large influence on r (its product 90 is almost half of Sxy = 184), whereas as a rank it is simply sixth, so r_s treats it like any other point.

Which coefficient is larger is not fixed. For points lying exactly on a curve that always rises, r_s = 1 but r < 1. For points exactly on a straight line, both equal 1. For your data the order is nearly perfect but the values wobble around the line, so r_s comes out slightly higher.

### Which word to use

For r ≈ 0.932: a strong positive linear correlation. For r_s ≈ 0.943: a strong positive rank correlation. Give both parts: the sign gives the direction (scores rise with hours revised) and the word gives the strength. Some textbooks say "very strong" above about 0.9 or 0.95; "strong" is safe and universally accepted. Then add the context sentence an AI answer needs: within this group of six students, more hours of revision were strongly associated with higher test scores. That is association, not proof that the revising caused the scores.

## 3. Is 0.7 an IB rule?

No. As far as I know, the IB does not define a cut-off for "strong". The course expects you to describe a correlation as positive or negative and as strong, moderate or weak, and where a precise boundary matters, the exam question supplies it, for example by giving a critical value. Textbooks draw the lines in different places: 0.5, 0.7, 0.75 and 0.8 all appear. In psychology, Cohen (1988) called r = 0.5 a large effect, so a physicist, a biologist and a psychologist would describe the same r with different words.

Where 0.7 comes from: the usual justification, and this is my understanding rather than a documented origin, is r², the proportion of the variation in y that the linear relationship with x accounts for. At r = 0.7, r² = 0.49, roughly half. So "above 0.7" means "the line accounts for more than half the variation", a natural place to start calling a correlation strong.

Why your teacher says it depends:

1. Sample size. The same r is strong evidence from 100 points and weak evidence from 6. At the 5% significance level (two-tailed), the critical value of r is about 0.811 for n = 6 but about 0.20 for n = 100; check these against the table your class uses. Your r = 0.932 is above 0.811, so even with six students there is sufficient evidence at the 5% significance level of a positive linear correlation, but an r of 0.7 would not have been.
2. The scatter diagram. An outlier can produce a high r with no sensible linear relationship, and a clear curved relationship can give a low r. Look before you label.
3. Context. In a physics experiment r = 0.7 would be disappointing; in a survey of human behaviour it would be unusually high.

In an exam, write "strong positive correlation" for 0.93, "moderate positive" for roughly 0.5 to 0.7, and "weak" below that. If you are near a boundary, give the number and the word together: the number is the evidence, the word is your interpretation.

**Next step.** You have not shown your own working yet, so I cannot say how the 8 marks would split; paste your attempt and I will give provisional feedback against the steps above. Practice to test the idea: change the last point from (12, 72) to (30, 72), predict which coefficient changes and which does not, then recalculate both. Hint: look at the rank table before doing any arithmetic.

Sources: your six data pairs and the two claims you quoted (supplied text); course notes on correlation, regression and interpreting r (course notes); Galton, Co-relations and their measurement (1888) (recalled, not consulted); Pearson, Mathematical contributions to the theory of evolution: regression, heredity and panmixia (1896) (recalled, not consulted); Spearman, The proof and measurement of association between two things (1904) (recalled, not consulted); Cohen, Statistical Power Analysis for the Behavioral Sciences (1988) (recalled, not consulted).
