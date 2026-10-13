---
document: 01-subject-thinking-and-skills
subject: Physics
slug: physics
version: 0.1.0
status: proposed supplement (not part of any pinned knowledge-base bundle)
precedence: the specialist's own master prompt and knowledge base win wherever this document disagrees with them
---

# Physics: subject thinking and skills

This document describes how a strong Physics tutor thinks and what habits it should
model for an IB Diploma student. It does not list the syllabus. The IB sciences
guides were recently revised, so do not quote topic numbers, theme names or SL/HL
assignments as fact unless the student supplies them or your own knowledge base
confirms them. When it matters, ask the student or tell them to check their course
outline.

## 1. Core ideas that recur across the course

These are areas a Physics tutor meets constantly. They are a thinking map, not an
official topic list.

- **Measurement.** Every measured quantity has a value, a unit and an uncertainty.
  A number without a unit is incomplete.
- **Motion and forces.** Kinematics describes motion; Newton's laws explain it.
  Momentum and energy give conservation shortcuts that often avoid detailed force
  analysis.
- **Energy.** Energy is conserved and transferred between stores or by working and
  heating. Power is the rate of transfer. Efficiency compares useful output with
  total input.
- **Fields.** Gravitational, electric and magnetic fields describe action at a
  distance. Field strength, potential and the inverse-square pattern link them.
- **Waves and oscillations.** Oscillations are periodic; waves transfer energy
  without transferring the medium. Superposition explains interference, standing
  waves and diffraction.
- **Particles and thermal physics.** Temperature relates to the average random
  kinetic energy of particles. The gas laws are a model with limits.
- **Electricity.** Charge flow, potential difference, resistance and the
  conservation of charge and energy in circuits.
- **Atomic, nuclear and quantum ideas.** Discrete energy levels, radioactive decay
  as a random process, half-life, and mass–energy equivalence.

Conservation laws (energy, momentum, charge, nucleon number) are the most useful
checks a student can run on any answer.

## 2. Thinking like a physicist

### Models and their limits

Physics works with idealised models: point particles, frictionless surfaces, ideal
gases, ideal meters, uniform fields, light rays. A strong answer names the
idealisation it uses and says when it would fail. For example, "ignoring air
resistance" is fine for a dropped steel ball over a few metres but not for a
falling sheet of paper.

### Evidence from graphs

- Physicists test a relationship by **linearising** it. If T = 2π√(L/g) for a
  pendulum, then T² = (4π²/g)L, so a graph of T² against L should be a straight
  line through the origin with gradient 4π²/g.
- A gradient has units: the y-axis unit divided by the x-axis unit. An intercept has
  the y-axis unit and often reveals a systematic error.
- One straight-line graph is stronger evidence than a single calculated value,
  because it uses all the data and shows whether the model fits.

### Uncertainty

- **Random uncertainty** scatters readings around the true value; repeating and
  averaging reduces its effect. **Systematic error** shifts all readings the same
  way; repeating does not remove it. A zero error on a meter is the classic case.
- **Precision** describes how closely repeated readings agree. **Accuracy**
  describes how close a result is to an accepted value.
- Propagation rules the specialist should state when using them:
  - sums and differences: add the **absolute** uncertainties;
  - products and quotients: add the **fractional** (or percentage) uncertainties;
  - a quantity raised to a power n: multiply its fractional uncertainty by |n|.
- Worked illustration (the numbers are invented for teaching):

  L = 0.800 ± 0.002 m
  20 oscillations take 36.0 ± 0.4 s, so T = 36.0 / 20 = 1.80 s and
  ΔT = 0.4 / 20 = 0.02 s
  g = 4π²L / T² = 4π²(0.800) / (1.80)² = 9.748 m s⁻² (unrounded)
  Δg / g = ΔL / L + 2(ΔT / T) = 0.002 / 0.800 + 2(0.02 / 1.80) = 0.0025 + 0.0222 = 0.0247
  Δg = 0.0247 × 9.748 = 0.24 m s⁻²
  Result: g = 9.7 ± 0.2 m s⁻²

  Two teaching points sit inside this: timing many oscillations divides the timing
  uncertainty by the number of oscillations, and the squared T doubles its
  contribution, so the timing dominates the final uncertainty.
- The uncertainty is usually given to one significant figure, and the value is
  rounded to the same decimal place.

### Significant figures

Round the final answer to the number of significant figures of the least precise
input. Keep unrounded values in intermediate steps and say so. Write ambiguous
values in standard form: "1.20 × 10³ kg" makes three significant figures clear,
whereas "1200 kg" does not.

### Variables and controls

- The **independent variable** is deliberately changed; the **dependent variable**
  is measured; **control variables** are kept constant because they would otherwise
  affect the dependent variable.
- A good answer says **how** a variable is controlled (for example, "use the same
  wire, kept in a water bath at constant temperature") and **why** it matters
  (resistance changes with temperature), not just its name.
- Choose a sensible range and enough distinct values (often at least five) to show
  a trend, with repeats where readings vary.

### Dimensional and order-of-magnitude checks

Before trusting a result, check that both sides of an equation have the same units
and that the size is plausible. A walking speed of 300 m s⁻¹ or a pressure under a
shoe of a few pascals signals a conversion mistake.

## 3. Common misconceptions and how to correct them

Correct a misconception by first finding out what the student thinks, then giving a
prediction that the wrong idea gets wrong, then the correct model, then one short
check question.

| Misconception | Correct idea to teach | Check question |
| --- | --- | --- |
| A force is needed to keep an object moving. | A resultant force changes velocity. At constant velocity the resultant force is zero (Newton's first law). | A puck slides across ice at steady speed. What is the resultant force on it? |
| Heavier objects fall faster. | Without air resistance, all objects near Earth's surface have the same acceleration g. Air resistance matters when drag is significant compared with weight. | Why do a hammer and a feather fall together in a vacuum? |
| At the top of a vertical throw, acceleration is zero. | Velocity is momentarily zero; acceleration is still g downwards. | If acceleration were zero at the top, what would the ball do next? |
| An outward "centrifugal force" acts on an object in circular motion. | In an inertial frame, the resultant force points towards the centre (centripetal). The outward feeling is the body's inertia. | Which force provides the centripetal force for a car on a flat bend? |
| Newton's third-law forces cancel out. | The pair act on **different** bodies, so they cannot cancel on one body. | A book rests on a table. What is the third-law partner of the book's weight? |
| Current is used up by a lamp. | Current is the same at every point in a series circuit. Energy is transferred in the lamp; charge is conserved. | Two ammeters sit either side of a lamp. How do their readings compare? |
| Heat and temperature are the same thing. | Temperature relates to average random kinetic energy per particle; thermal energy transfer happens because of a temperature difference. | A bath and a cup of tea are at the same temperature. Which has more internal energy? |
| Astronauts in orbit are weightless because there is no gravity. | Gravity at low orbital heights is still most of its surface value. Astronauts and their craft are in free fall together. | What force keeps the space station in orbit? |
| Waves carry the medium along. | Particles of the medium oscillate about fixed positions; energy is transferred. | What happens to a floating cork as a water wave passes? |
| After two half-lives, everything has decayed. | Each half-life halves the remaining undecayed nuclei, so one quarter remains after two. | What fraction remains after three half-lives? |
| Brighter light gives photoelectrons more energy. | In the photon model, intensity changes the rate of photons; the maximum kinetic energy depends on frequency. | What changes if the light is made twice as intense at the same frequency? |
| Energy is "lost". | Energy is transferred, often dissipated as thermal energy in the surroundings; the total is conserved. | Where does the kinetic energy of a braking car go? |
| Mass and weight are the same. | Mass (kg) measures inertia; weight (N) is the gravitational force, W = mg. | What is your mass on the Moon compared with Earth? |

## 4. Skills the specialist should model in every relevant answer

- **Read the data first.** List what is given, with units, before choosing an
  equation.
- **Convert to SI before substituting**, showing the factor on its own line. Useful
  conversions: 1 cm² = 1 × 10⁻⁴ m²; 1 cm³ = 1 × 10⁻⁶ m³; 1 mm = 1 × 10⁻³ m;
  1 kWh = 3.6 × 10⁶ J; 1 eV = 1.60 × 10⁻¹⁹ J; 1 g cm⁻³ = 1.00 × 10³ kg m⁻³.
- **Draw before calculating.** Describe a free-body diagram or circuit in words when
  a picture cannot be shown: name each force, the body it acts on and its direction.
- **Use precise vocabulary.** "Resultant force", "potential difference across",
  "current through", "internal energy", "displacement" (not "distance" when
  direction matters).
- **Close with a sense check.** Units, sign, size and whether the answer obeys the
  relevant conservation law.

The answer format that makes these habits checkable is set out in this
specialist's answering-functionality document.
