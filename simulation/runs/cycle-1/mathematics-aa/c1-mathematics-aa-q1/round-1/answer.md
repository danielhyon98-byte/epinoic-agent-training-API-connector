Your instinct is right: "radians are natural" is a slogan, not an explanation. Here is the actual explanation in one sentence, and then the evidence you asked for.

**Changing the unit does not change "the derivative"; it changes the function.** The function "sine of x degrees" is sin(πx/180), which is the graph of sin x stretched horizontally by a factor of 180/π ≈ 57.3. Stretching a graph sideways by a factor k divides every gradient by k. So the derivative of sine in degrees is (π/180) cos(x°), about 57 times smaller than cos x. The derivative rule did not "break"; you applied it to a different function. Everything below is that one fact seen from four angles.

One honesty note before the numbers: no calculator is available to me here, so every value below is worked by hand from series or exact identities, with the working shown. Please confirm the decimals on your GDC, with the mode set to radians for the radian rows and degrees for the degree rows. Also, the mark allocations in your message are your own labels, so I have used them only to judge how much depth each part needs.

## (a) What sin(h)/h does as h → 0, in radians and in degrees

**Radians.** For h in radians, the Maclaurin series gives sin h = h − h³/6 + h⁵/120 − …, so

```text
sin h / h = 1 − h²/6 + h⁴/120 − …
```

For h = 0.1:

```text
h²/6 = 0.01/6 = 0.0016666667
h⁴/120 = 0.0001/120 = 0.0000008333
sin(0.1)/0.1 = 1 − 0.0016666667 + 0.0000008333
sin(0.1)/0.1 = 0.9983341667
sin(0.1)/0.1 ≈ 0.9983342 (7 d.p.)
```

The same working for the other two values (the h⁴ term is negligible):

| h (radians) | h²/6 | sin h / h (7 d.p.) |
| --- | --- | --- |
| 0.1 | 0.0016667 | 0.9983342 |
| 0.01 | 0.0000167 | 0.9999833 |
| 0.001 | 0.00000017 | 0.9999998 |

The values head to **1**.

**Degrees.** The symbol h now means h degrees, and h degrees = h × π/180 radians, with π/180 ≈ 0.0174532925. So sin(h°) = sin(0.0174532925 h), and I can use the same series on the radian value.

For h = 1 (one degree):

```text
1° = 0.0174532925 rad
(0.0174532925)³ = 0.0000053166
(0.0174532925)³/6 = 0.0000008861
sin 1° = 0.0174532925 − 0.0000008861
sin 1° = 0.0174524064
sin(1°)/1 ≈ 0.01745241 (8 d.p.)
```

| h (degrees) | h in radians | sin(h°)/h (8 d.p.) |
| --- | --- | --- |
| 1 | 0.0174532925 | 0.01745241 |
| 0.1 | 0.0017453293 | 0.01745328 |
| 0.01 | 0.0001745329 | 0.01745329 |

The values head to **π/180 ≈ 0.01745329**, not to 1.

**The two limits and why they differ.**

```text
Radians:  lim (h→0) sin h / h = 1
Degrees:  lim (h→0) sin(h°) / h = π/180 ≈ 0.0174533
```

The degree limit is exactly the radian limit multiplied by the conversion factor: sin(h°)/h = [sin(πh/180) / (πh/180)] × (π/180), and the square bracket is the radian ratio, which → 1. So the second limit is forced to be π/180. The ratio of the two limits is 180/π ≈ 57.30, the same stretch factor as in the opening paragraph.

Why this matters: sin h / h → 1 is exactly the statement "near zero, sin h ≈ h". That is the gradient of sin at the origin. In radians the gradient at 0 is 1; in degrees it is 0.01745. Every other gradient of the sine curve inherits that factor, which is what you will see in (b) and (d).

Small caveat for your teacher's standards: the series I used to compute the values is itself derived assuming radians, so these tables are a computation of the limit, not a proof of it. The proof is in (c).

## (b) First principles at x = π/3 with h = 0.01

Definition of the derivative applied to y = sin x:

```text
dy/dx ≈ [sin(π/3 + h) − sin(π/3)] / h   with h = 0.01
```

To evaluate the numerator by hand, use the addition formula sin(A + h) = sin A cos h + cos A sin h with A = π/3:

```text
[sin(π/3 + h) − sin(π/3)] / h = sin(π/3) × (cos h − 1)/h + cos(π/3) × (sin h)/h
```

Values at h = 0.01 (series: cos h = 1 − h²/2 + h⁴/24 − …):

```text
sin(π/3) = √3/2 ≈ 0.8660254
cos(π/3) = 1/2
cos 0.01 = 1 − 0.00005 + 0.0000000004 = 0.9999500004
(cos 0.01 − 1)/0.01 = −0.0000499996/0.01 = −0.0049999583
sin(0.01)/0.01 = 0.9999833333   (from part (a))
```

Substitute:

```text
gradient ≈ 0.8660254 × (−0.0049999583) + 0.5 × 0.9999833333
gradient ≈ −0.0043300909 + 0.4999916667
gradient ≈ 0.4956615758
gradient ≈ 0.49566 (5 s.f.)
```

As a check with the raw values: sin(π/3 + 0.01) ≈ 0.8709820 and sin(π/3) ≈ 0.8660254, difference 0.0049566, divided by 0.01 gives 0.49566. Same result.

**Comparison:** cos(π/3) = 0.5 exactly. The estimate is 0.49566, so the gap is 0.49566 − 0.5 ≈ −0.00434 (3 s.f.).

**Why there is a gap.** The first-principles quotient with a fixed h is the gradient of a chord from x = π/3 to x = π/3 + 0.01, not of the tangent. Near π/3 the sine curve is concave down (its second derivative is −sin x, negative there), so the chord to the right lies below the tangent and its gradient is too small. The two-term expression shows the size exactly:

- the term 0.5 × (sin h / h) = 0.4999917 is already within 0.0000083 of the true 0.5, because sin h / h is so close to 1 (part (a));
- the term sin(π/3) × (cos h − 1)/h ≈ −sin(π/3) × h/2 = −0.8660254 × 0.005 = −0.0043301 is almost the whole gap.

So the error is approximately −(h/2) sin(π/3), proportional to h. In the limit h → 0 both pieces go where they should: (cos h − 1)/h → 0 and sin h / h → 1, leaving exactly cos(π/3) = 0.5. That is the derivation of d/dx sin x = cos x in miniature, and it needs the radian limit from (a).

**How to make the gap smaller.**

1. Take a smaller h. Because the error is roughly proportional to h, h = 0.001 gives about 0.499567, a gap of about −0.000433, ten times smaller.
2. Use a symmetric (central) difference, [sin(π/3 + h) − sin(π/3 − h)] / (2h). The (cos h − 1) terms cancel exactly, leaving cos(π/3) × sin h / h:

```text
central estimate = 0.5 × 0.9999833333
central estimate ≈ 0.4999917
gap ≈ −0.0000083
```

With the same h = 0.01 that is about 500 times closer, because the symmetric error is proportional to h² rather than h.

## (c) Where lim (h→0) sin h / h = 1 comes from, and where radians enter

**The squeeze (sandwich) argument.** Take the unit circle with centre O and A = (1, 0). Let 0 < θ < π/2 and put B = (cos θ, sin θ) on the circle and C = (1, tan θ) on the vertical tangent line through A. Three regions sit inside one another: triangle OAB is inside sector OAB, which is inside triangle OAC.

```text
Area of triangle OAB = (1/2) × base OA × height = (1/2)(1)(sin θ) = (1/2) sin θ
Area of sector OAB   = (1/2) θ           ← this is the line that uses radians
Area of triangle OAC = (1/2)(1)(tan θ) = (1/2) tan θ
```

**Where radians are used.** The disc has area π × 1² = π. A sector is the fraction of the disc that its angle is of a full turn. In radians a full turn is 2π, so

```text
sector area = (θ / 2π) × π = θ/2
```

If θ were measured in degrees, a full turn would be 360, and the sector area would be (θ/360) × π = πθ/360. That single line is the only place the unit enters, and it is what fixes the limit.

Continue in radians:

```text
(1/2) sin θ ≤ (1/2) θ ≤ (1/2) tan θ
sin θ ≤ θ ≤ sin θ / cos θ
divide by sin θ (> 0 on this interval):
1 ≤ θ / sin θ ≤ 1 / cos θ
take reciprocals (all positive, so the inequalities reverse):
cos θ ≤ sin θ / θ ≤ 1
```

As θ → 0⁺, cos θ → 1, so sin θ / θ is squeezed between two quantities that both tend to 1, hence sin θ / θ → 1. For negative θ, sin(−θ)/(−θ) = sin θ/θ, so the same limit holds from the left, and the two-sided limit is 1.

Run the same argument with the degree sector area πθ/360 and you get cos θ° ≤ sin θ° / (πθ/180) ≤ 1, so sin θ°/θ → π/180, which is the second limit in (a). The proof and the numbers agree.

**Can you use L'Hôpital instead?** For a proof, no, because it is circular. L'Hôpital gives

```text
lim sin h / h = lim cos h / 1 = 1
```

but that step uses d/dx sin x = cos x. And the derivative of sin at 0 is, by definition, lim (sin h − sin 0)/h = lim sin h / h. So "the derivative of sin is cos" already contains the statement that this limit is 1. Using it to prove the limit assumes the conclusion. The same objection applies to "use the Maclaurin series": its coefficients come from the derivatives of sin.

In practice: if an exam question says "use L'Hôpital's rule to evaluate" a limit, do exactly that and you will be fine. If it says "show that" or "prove that lim sin h / h = 1", or asks for the derivative of sin x from first principles, the squeeze argument is the one that earns the credit, because it only uses geometry and the definition of radian measure.

## (d) The derivative of sin(x°), and where radians came from

**The derivative.** Convert to radians and use the chain rule with u = πx/180, du/dx = π/180:

```text
sin(x°) = sin(πx/180)
d/dx sin(πx/180) = cos(πx/180) × π/180
d/dx sin(x°) = (π/180) cos(x°)
d/dx sin(x°) ≈ 0.0174533 cos(x°)
```

Example at x = 60: the gradient is (π/180) × cos 60° = (π/180) × 1/2 = π/360 ≈ 0.00873, compared with cos(π/3) = 0.5 for the radian function at the same point. The ratio is 180/π ≈ 57.3, the horizontal stretch factor from the opening paragraph. First principles gives the same thing: the degree version of the calculation in (b) ends with cos(x°) × lim sin(h°)/h = cos(x°) × π/180, using the degree limit from (a).

**Where radians came from.** I am giving these from memory of standard histories, with the source named each time, and I have not opened any of them in this session, so please check them before you quote them.

- The idea of measuring an angle by the length of arc it cuts on a unit circle is much older than the name. Roger Cotes, in 1714, is usually credited with first recognising this as the natural unit of angle, though he did not name it. Leonhard Euler's *Introductio in analysin infinitorum* (1748) treated sine and cosine as functions of a real number, the arc length on the unit circle, which is the convention that makes d/dx sin x = cos x come out with no constant. (Both points: Cajori's *A History of Mathematical Notations*, vol. 2, 1929, and the MacTutor History of Mathematics archive; recalled, not consulted.)
- The word "radian" was coined by James Thomson, an engineer and the elder brother of Lord Kelvin, at Queen's College Belfast, and first appeared in print in an examination paper there in 1873. Thomas Muir, of St Andrews, had separately hesitated between "rad", "radial" and "radian" around 1869 and adopted "radian" in 1874 after corresponding with Thomson; Muir described this in a published letter in 1910. (Cajori, vol. 2, and MacTutor's biography of James Thomson; recalled, not consulted.)

If your teacher wants a single citable reference, Cajori is the standard one; a good library should have it.

**Why the IB makes you use radians in calculus.** It is not an IB preference, it is how calculus works everywhere. In radians the basic results have no stray constants: d/dx sin x = cos x, d/dx cos x = −sin x, ∫ sin x dx = −cos x + C, sin x ≈ x for small x, arc length s = rθ, sector area (1/2) r²θ, and the Maclaurin series sin x = x − x³/6 + …. In degrees every one of these picks up a factor of π/180 or 180/π, as (d) shows. As far as I recall, the AA subject guide introduces radian measure in the trigonometry topic precisely so that the calculus topic can use these clean forms, and the trigonometric derivatives and integrals in the formula booklet are stated for radians only; check the exact wording in your own copy.

**Next step.** Two short practice items that test the same idea: (1) find d/dx cos(x°) and ∫ sin(x°) dx; (2) with your GDC in radian mode, compute [sin(1 + h) − sin 1]/h for h = 0.1, 0.01 and 0.001 and watch it approach cos 1 ≈ 0.5403, then repeat in degree mode and show that it approaches (π/180) cos 1° instead.

Sources: Cajori, A History of Mathematical Notations, vol. 2 (1929) (recalled, not consulted); MacTutor History of Mathematics archive, biography of James Thomson (recalled, not consulted); IB Mathematics: Analysis and Approaches subject guide and formula booklet (recalled, not consulted)
