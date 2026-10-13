---
document: 01-subject-thinking-and-skills
subject: Economics
slug: economics
version: 0.1.0
status: proposed supplement (not part of any pinned knowledge-base bundle)
precedence: the specialist's own master prompt and knowledge base win wherever this document disagrees with them
---

# Economics: subject thinking and skills

This document adds to your own Economics knowledge base. It does not replace it. If
anything here disagrees with your master prompt or knowledge base, follow those and
treat this text as wrong.

## 1. How an economist thinks

Most good Economics answers rest on a small set of habits. Use them when you explain
anything to a student, and point them out so the student learns to use them too.

- **Scarcity and choice.** Resources are limited, wants are not, so every choice has
  an **opportunity cost**: the value of the next best alternative given up. It is
  not "the money spent".
- **Thinking at the margin.** Decisions depend on the extra benefit and extra cost
  of one more unit, not on totals.
- **Incentives.** People and firms respond to changes in prices, taxes, rules and
  information, sometimes in ways policymakers did not intend.
- **Models and assumptions.** Diagrams and equations are simplifications. Name the
  key assumptions (for example *ceteris paribus*, rational choice, perfect
  information) because evaluation often starts by relaxing them.
- **Positive and normative.** "A tax raises the price" is positive and testable.
  "The government should tax sugar" is normative. Keep them separate.
- **Time.** Many effects differ in the short run and the long run (elasticities rise
  over time, supply-side policies act slowly, a depreciation can worsen the current
  account before improving it).
- **Efficiency and equity.** An outcome can be efficient and still be judged unfair,
  or fair and still wasteful. Many evaluations turn on this tension.

The course frames its content around a set of key concepts. The list is believed
to be scarcity, choice, efficiency, equity, economic well-being, sustainability,
change, interdependence and intervention
(verify against the current IB subject guide). Use them as lenses, not as labels
to sprinkle on.

## 2. Key models and the arithmetic behind them

Your own knowledge base holds the syllabus detail. The list below is a reminder of
the models students most often ask about and the formulas they rely on.

- **Introductory tools:** production possibility curve (scarcity, opportunity cost,
  growth), circular flow of income.
- **Microeconomics:** demand and supply; elasticities; consumer and producer surplus;
  indirect taxes, subsidies, price ceilings and price floors; market failure
  (externalities, public goods, common pool resources, asymmetric information,
  market power); behavioural ideas such as bounded rationality and nudges; and, at
  higher depth, costs, revenues and market structures.
- **Macroeconomics:** GDP and related measures, real and nominal values, aggregate
  demand and aggregate supply (including the different views of long-run supply),
  the main macroeconomic objectives, the multiplier, and fiscal, monetary and
  supply-side policy.
- **The global economy:** comparative advantage, protectionism, exchange rates, the
  balance of payments, economic integration, terms of trade, and economic
  development and its measurement.

Which calculations are examinable at SL and which only at HL can change between
course versions (verify against the current IB subject guide). Do not tell a
student a calculation is "HL only" unless your knowledge base says so.

| Measure | Formula | Note |
| --- | --- | --- |
| Percentage change | (new − old) ÷ old × 100 | Always divide by the starting value |
| PED | %ΔQd ÷ %ΔP | Usually negative; judge elastic or inelastic by its absolute value |
| YED | %ΔQd ÷ %ΔY | Positive: normal good. Negative: inferior good. Above 1: income elastic |
| XED | %ΔQd of good A ÷ %ΔP of good B | Positive: substitutes. Negative: complements |
| PES | %ΔQs ÷ %ΔP | Positive for a normal upward-sloping supply curve |
| Multiplier | k = 1 ÷ (1 − MPC) = 1 ÷ (MPS + MPT + MPM) | Change in real GDP = k × change in injection |
| Real value | nominal value ÷ price index × 100 | Use the index for the same year |
| Inflation from an index | (index this year − index last year) ÷ index last year × 100 | Not "this year's index minus 100" unless last year is the base year |
| Unemployment rate | unemployed ÷ labour force × 100 | The labour force, not the whole population |
| Terms of trade | index of average export prices ÷ index of average import prices × 100 | |

### A model worked through: who pays an indirect tax?

Use hypothetical linear functions so every step can be checked.

- Demand: Qd = 120 − 10P. Supply: Qs = −30 + 20P (P in dollars, Q in units per
  week).
- Equilibrium: 120 − 10P = −30 + 20P, so 150 = 30P, so **P = $5** and **Q = 70
  units**.
- A specific tax of **$1.50 per unit** is placed on producers. Supply shifts
  vertically up by $1.50: Qs = −30 + 20(P − 1.5) = −60 + 20P.
- New equilibrium: 120 − 10P = −60 + 20P, so 180 = 30P, so consumers pay **$6.00**,
  and Q = 120 − 60 = **60 units**.
- Producers keep $6.00 − $1.50 = **$4.50** per unit.
- Tax revenue = $1.50 × 60 = **$90 per week**.
- Consumer burden = ($6.00 − $5.00) × 60 = **$60**. Producer burden = ($5.00 −
  $4.50) × 60 = **$30**. Check: $60 + $30 = $90.
- Deadweight (welfare) loss = ½ × $1.50 × (70 − 60) = **$7.50 per week**.

Interpretation: consumers bear two-thirds of the tax because, around this
equilibrium, demand responds less to price than supply does. The side of the market
that is less price-elastic bears more of the burden.

## 3. Describing diagrams in words

You cannot draw. A precise verbal description, given in a fixed order, is almost as
useful and lets the student redraw it.

1. **Title and market** ("Market for cigarettes, with an indirect tax").
2. **Axes and units** (vertical: price in dollars; horizontal: quantity in units
   per week).
3. **Initial curves** with labels (D1 slopes down, S1 slopes up).
4. **Initial equilibrium** (E1, where D1 meets S1, at P1 and Q1).
5. **The change**: which curve moves, which way, by how much, and why (a tax shifts
   *supply* vertically upward by the tax per unit; it does not shift demand).
6. **New equilibrium** (E2 at Pc and Q2), and the price producers keep (Pp, read
   from S1 at Q2).
7. **Areas** named by their corners (tax revenue is the rectangle Pc to Pp in
   height and 0 to Q2 in width; the welfare loss is the triangle between E1, E2 and
   the point on S1 at Q2).
8. **Link back** to the question in one sentence.

Where a sketch genuinely helps, add a small text sketch in a code block and still
give the verbal description, because spacing can break on some screens.

```
 Price ($)
      | \           /S
      |  \         /
      |   \       /
      |    \     /
      |     \   /
      |      \ /
  P1  |.......E
      |      /:\
      |     / : \ D
      +-------+-----------  Quantity (units per week)
             Q1
```

## 4. Analytical and evaluative skills

**Analysis** is a chain of cause and effect with no missing links: "Interest rates
rise, so the cost of borrowing rises, so firms postpone investment and households
cut credit-financed consumption, so aggregate demand shifts left, so inflationary
pressure eases." Teach students to spot the missing link in their own chains.

**Application** means using the context: the figures given, the market described,
the country type. A real-world example should be described in general terms unless
you are confident of the specifics. Never supply current statistics (today's
inflation rate, a country's latest GDP) because you cannot check them.

**Evaluation** weighs the analysis. Useful angles:

- short run against long run;
- different stakeholders (consumers, producers, workers, government, future
  generations, other countries);
- size of the effect, which often depends on elasticities or the size of the
  multiplier;
- assumptions that may fail (perfect information, rational behaviour, no time lags);
- unintended consequences and government failure (black markets, regulatory
  capture, cost of administration);
- alternative policies and whether they would do better;
- efficiency against equity;
- quality of the evidence, including the gap between correlation and causation.

A **judgement** answers the question asked, gives the main reason, and states the
condition it depends on: "On balance a sugar tax is likely to reduce consumption,
but how much depends on how price-elastic demand is and how much of the tax firms
pass on to consumers, so it is more likely to succeed alongside education and
reformulation targets than on its own."

## 5. Common misconceptions and how to correct them

| Misconception | Correction to give |
| --- | --- |
| "A rise in price shifts the demand curve left." | A change in the good's own price causes a movement *along* the curve. Only non-price factors (income, tastes, prices of related goods) shift it. |
| "PED is the slope of the demand curve." | Slope is constant on a straight line, but PED changes along it: more elastic at high prices, less elastic at low prices. |
| "Inelastic means quantity does not change." | Inelastic means quantity changes by a smaller percentage than price. Zero change is the special case of perfectly inelastic demand. |
| "An indirect tax shifts demand." | It shifts supply vertically upward by the tax per unit (a specific tax) or pivots it (an ad valorem tax). |
| "Inflation fell, so prices fell." | Falling inflation (disinflation) means prices rise more slowly. Prices fall only with deflation. |
| "Inflation rose from 2% to 3%, a 1% rise." | It rose by 1 percentage point, which is a 50% increase in the rate. |
| "Nominal GDP grew 5%, so output grew 5%." | Adjust for inflation. With 3% inflation, real growth is roughly 2% (more exactly 1.05 ÷ 1.03 − 1 ≈ 1.94%). |
| "Opportunity cost is what you paid." | It is the next best alternative given up, which may not involve money. |
| "If there is market failure, government should intervene." | Intervention can fail too. Compare the likely size of market failure with the likely size of government failure. |
| "A depreciation always improves the current account." | Only if export and import demand are elastic enough, and often only after a delay (the J-curve idea). |
| "Higher GDP means people are better off." | GDP omits distribution, unpaid work, leisure, environmental damage and the informal economy. |

When you correct a misconception, name it neutrally, give the correct idea, and give
one quick test the student can use next time ("Ask: did the good's own price change?
Then it is a movement, not a shift.").
