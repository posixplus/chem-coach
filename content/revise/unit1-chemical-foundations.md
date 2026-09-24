---
title: Chemical Foundations
unit: 1
slug: chemical-foundations
test_date: 2026-09-24
summary: Dimensional analysis, sig figs, percent yield and error, measurement, classifying matter, vocabulary, temperature and density.
---

## Common traps

These are the mistakes that cost points even when the chemistry is understood.

1. Start dimensional analysis from the plain quantity (3.5 km), not from the speed. Speed is a bridge.
2. The unit you're killing goes on the **bottom**: (1 s / 1.16 m), not (1.16 m / 1 s).
3. Adding and subtracting: fewest **decimal places**, and round, don't chop. 4.953 → 5.0.
4. If you say "two sig figs," write two: `50. min`, not 50.2 and not 50.
5. Any "solution" is a homogeneous mixture. Get the solid back by evaporating.
6. A physical method separates a **mixture**. A chemical method breaks a **compound**.
7. Ions held by charges = **formula unit** (NaCl). Shared electrons = molecule.
8. milli is plain **m**, micro is **µ**, mega is capital **M**. 1 L = 10⁹ nL. 1 km = 10⁵ cm. Finish the exponent math: 100 × 10³ is 10⁵.

## Dimensional analysis

Three questions before the calculator: **Where am I starting? Where am I going? What bridges do I have?**

- Each bridge is a fraction equal to 1. Place it so the unit you're killing is diagonally across from itself.
- Units first, numbers last. One calculator pass: multiply tops, divide bottoms.
- Squared or cubed units: apply the factor 2 or 3 times. Write it as `(100 cm / 1 m)³`.
- Speed and density are bridges: 1.16 m/s links m and s. 0.789 g/mL links g and mL.
- Go through the base unit (km → m → cm). Imperial factors are always given to you.

`60. km/h × (1000 m / 1 km) × (1 h / 3600 s) = 17 m/s`

`0.021 g/cm³ × (1 kg / 1000 g) × (100 cm / 1 m)³ = 21 kg/m³`

`3.5 km × (1000 m / 1 km) × (1 s / 1.16 m) × (1 min / 60 s) = 50. min`

`0.041 m² × (1 km / 1000 m)² = 4.1 × 10⁻⁸ km²`

| Prefix | Power | Prefix | Power |
|---|---|---|---|
| giga G | 10⁹ | deci d | 10⁻¹ |
| mega M | 10⁶ | centi c | 10⁻² |
| kilo k | 10³ | milli m | 10⁻³ |
| base | 1 | micro µ | 10⁻⁶ |
| | | nano n | 10⁻⁹ |
| | | pico p | 10⁻¹² |

> **Trap:** 1 cm³ = 1 mL, 1 dm³ = 1 L, 1 dm = 10 cm. A cubed unit needs the factor cubed.

## Sig figs

**Counting, Pacific-Atlantic:** decimal **P**resent → come in from the **P**acific (left). **A**bsent → from the **A**tlantic (right). Start at the first nonzero digit and count everything after it.

| Number | Sig figs |
|---|---|
| 0.00130 | 3 |
| 7400 | 2 |
| 1.3000 | 5 |
| 102.400 | 6 |

**Rounding:** 700 to 4 sf = `700.0` · 7040 to 2 sf = `7.0 × 10³` · 0.0740 to 4 sf = `0.07400` · 7.406 × 10⁷ to 3 sf = `7.41 × 10⁷`

**Math:** add / subtract → fewest **decimal places** (3.12 + 0.8 + 1.033 = 5.0). Multiply / divide → fewest **sig figs** (1.23 × 0.89 = 1.1). Exact numbers (1000, 60, the 4 in "4 trials") never limit sig figs. Re-check sig figs at each step of a multi-step problem.

**Scientific notation:** multiply → add exponents; divide → subtract them. (6 × 10⁸) ÷ (3 × 10²) = 2 × 10⁶. Exactly one nonzero digit before the decimal point.

> **Trap:** Plain 7000 reads as one sig fig. Use scientific notation (7.0 × 10³) or a decimal point (700.0) to show the sig figs you mean.

## Percent yield and percent error

`% yield = experimental ÷ theoretical × 100`

`% error = |experimental − accepted| ÷ accepted × 100`

- They add to 100%. Use that as a check.
- Class data: **average first**, then compute. 0.544, 0.124, 0.223, 0.701 g vs 0.743 g → avg 0.398 g → 53.6% yield, 46.4% error.
- **Accuracy** = close to the true value. **Precision** = close to each other. One trial says nothing about precision.
- A tight cluster far from the truth is precise but not accurate (systematic error). Averaging only fixes **random** error.

## Taking a measurement

- Report **one estimated digit** past the finest mark. Marks every 1 mL → read 23.4 mL.
- "10. mL" means the marks are every 10 mL (the ones place is the estimated digit).
- Three beakers can hold the same water and still be reported with different sig figs.
- Every measurement gets a unit.

## Classifying matter

Say the category and the reason.

- **Element:** iridium, iron filings, zirconium (one kind of atom).
- **Compound:** TiO, H₂O₂, CuSO₄ crystals (more than one element, chemically bound).
- **Homogeneous mixture:** brass, BaBr₂ solution, contact solution, dissolved CuSO₄ (same everywhere, not bound).
- **Heterogeneous mixture:** sand in water, iron + sand + CuSO₄ (varies spot to spot).

**Separations:** magnet (iron) · filter (sand) · evaporate (dissolved salt) · chromatography (ink) · distill (liquids).

- Distilled an orange liquid into two things → it was a **mixture** (physical method).
- Decomposed a solid into a gas and a metal → it was a **compound** (chemical method).
- H₂ + O₂ mixed 2:1 is a mixture. H₂O is a compound with totally different properties.
- Physical change: melt, boil, dissolve. Chemical change: rust, burn, decompose.

## Vocabulary

- **Molecule** = atoms sharing electrons (H₂O, CO₂). **Formula unit** = ions held by charges (NaCl, CuSO₄). **Compound** = more than one element.
- Cation +, anion −. **-ium** → cation. **-ide, -ate, -ite** → anion. Cl⁻ is chloride. NH₄⁺ is a polyatomic cation.
- Diatomics: **BrINClHOF**. Also P₄, S₈, Se₈.
- Element identity = number of **protons**.
- Temperature = average kinetic energy (KE ∝ v²). Pressure = force ÷ area. IMFs, pressure and temperature decide solid / liquid / gas.
- Hydrogen "bonding" is an IMF between molecules, not a bond.

## Temperature and density

`K = °C + 273.15` · 25 °C = 298 K · 327 °C = 600. K

- 0 K is absolute zero: least possible particle motion, so Kelvin is never negative. A 1 K step equals a 1 °C step.
- If Fahrenheit shows up: `°C = (°F − 32) ÷ 1.8`.

`D = m ÷ V` · 923 g ÷ 20,312 cm³ = 0.0454 g/cm³

- Use density as a bridge: 50.0 g × (1 mL / 0.789 g) = 63.4 mL.
- 22,610 kg/m³ = 22.61 g/cm³. Same volume, more mass → denser.

## Before boxing any answer

Units on the line, sig figs counted, and a rough power-of-ten reality check.
