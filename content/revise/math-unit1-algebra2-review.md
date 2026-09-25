---
title: Algebra 2 Review
subject: math
unit: 1
slug: math-algebra2-review
summary: Lines, factoring and completing the square, exponents and scientific notation, logarithms. The toolkit every later IB unit assumes.
---

## Common traps

1. Perpendicular slope = **negative reciprocal**: flip AND change sign. $-2 \to \tfrac{1}{2}$, not $2$ and not $-\tfrac{1}{2}$.
2. "Factor completely" means keep going: $3x(x^2 - 4)$ is not done. $3x(x - 2)(x + 2)$ is.
3. Scientific notation needs $1 \le a < 10$. $21 \times 10^2$ is not finished: it is $2.1 \times 10^3$. $0.8$ is $8 \times 10^{-1}$.
4. $\log x$ with no base is **base 10**. $\log x = -2$ means $x = 10^{-2} = \tfrac{1}{100}$.
5. A log base must be positive and not 1: $\log_x 49 = 2$ gives $x = 7$ only, not $\pm 7$.
6. $(x - 3)^2 \ne x^2 - 9$. Square a binomial by FOIL: $x^2 - 6x + 9$.

## Lines

| Form | Equation | Use it when |
|---|---|---|
| Slope-intercept | $y = mx + b$ | you want the final answer |
| Point-slope | $y - y_1 = m(x - x_1)$ | you know a point and the slope |
| Standard | $Ax + By = C$ | intercepts: cover one variable |

- Slope $m = \dfrac{y_2 - y_1}{x_2 - x_1}$. Same order on top and bottom.
- Horizontal line $y = k$: slope $0$. Vertical line $x = k$: slope **undefined**.
- Parallel: same slope. Perpendicular: slopes multiply to $-1$.
- Line in standard form? Solve for $y$ first to read the slope: $3x - 4y = 12 \Rightarrow y = \tfrac{3}{4}x - 3$.

> **Trap:** "Parallel to $y = -2x + 1$ through $(-4, 0)$" keeps the slope $-2$ but NOT the intercept: $y = -2x - 8$.

## Factoring checklist

Work down the list, every time:

1. **GCF** first: $2x^2 - 8x + 8 = 2(x^2 - 4x + 4) = 2(x - 2)^2$
2. **Difference of squares**: $a^2 - b^2 = (a - b)(a + b)$
3. **Cubes**: $a^3 - b^3 = (a - b)(a^2 + ab + b^2)$, $a^3 + b^3 = (a + b)(a^2 - ab + b^2)$
4. **Trinomial** $x^2 + bx + c$: two numbers that multiply to $c$ and add to $b$
5. **AC method** for $ax^2 + bx + c$: find two numbers that multiply to $ac$ and add to $b$, split the middle, group
6. Check each factor again. Stop only when nothing factors further.

Example (AC): $6x^2 + 7x - 3$, $ac = -18$, pair $9, -2$: $6x^2 + 9x - 2x - 3 = 3x(2x + 3) - 1(2x + 3) = (3x - 1)(2x + 3)$

## Completing the square

$x^2 + bx + c$: add and subtract $\left(\tfrac{b}{2}\right)^2$.

$x^2 + 6x + 5 = (x^2 + 6x + 9) - 9 + 5 = (x + 3)^2 - 4$, vertex $(-3, -4)$

If $a \ne 1$, factor $a$ out of the $x$ terms first:
$2x^2 + 12x + 7 = 2(x^2 + 6x + 9) - 18 + 7 = 2(x + 3)^2 - 11$

> **Trap:** when you add 9 inside $2(\ \ )$, you really added 18. Subtract 18, not 9.

Solving: $x^2 + 4x - 1 = 0 \Rightarrow (x + 2)^2 = 5 \Rightarrow x = -2 \pm \sqrt{5}$. Keep both signs.

## Exponents and scientific notation

| Rule | Example |
|---|---|
| $x^a \cdot x^b = x^{a+b}$ | $x^3 \cdot x^4 = x^7$ |
| $\dfrac{x^a}{x^b} = x^{a-b}$ | $\dfrac{x^5}{x^{-3}} = x^8$ |
| $(x^a)^b = x^{ab}$ | $(3x^2)^3 = 27x^6$ (the 3 gets cubed too) |
| $x^{-a} = \dfrac{1}{x^a}$ | $16^{-3/4} = \dfrac{1}{8}$ |
| $x^{m/n} = \left(\sqrt[n]{x}\right)^m$ | $8^{2/3} = 2^2 = 4$ (root first, smaller numbers) |

Scientific notation: multiply/divide the front numbers, add/subtract the exponents, then **fix the front number**.
$(7 \times 10^3)(3 \times 10^{-1}) = 21 \times 10^2 = 2.1 \times 10^3$

## Logarithms

**The one fact:** $\log_b a = c \iff b^c = a$. The log IS the exponent.

- Evaluate by asking "$b$ to what power gives $a$?" $\log_2 16 = 4$, $\log_6 \tfrac{1}{36} = -2$, $\log_5 \sqrt{5} = \tfrac{1}{2}$
- Different bases? Write both as powers of the same number: $\log_8 4$: $2^{3x} = 2^2 \Rightarrow x = \tfrac{2}{3}$
- Solve $\log_b(\text{stuff}) = c$ by rewriting: $\text{stuff} = b^c$. $\log_9(6x + 7) = 2 \Rightarrow 6x + 7 = 81 \Rightarrow x = \tfrac{37}{3}$
- Change of base (calculator): $\log_b a = \dfrac{\log a}{\log b}$. $\log_3 20 \approx 2.73$
- $\log_b 1 = 0$, $\log_b b = 1$, and you cannot take the log of 0 or a negative.
