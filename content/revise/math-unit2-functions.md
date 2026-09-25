---
title: Functions
subject: math
unit: 2
slug: math-functions
summary: Domain and range, composition, inverses, polynomial and rational graph behavior, parent functions and transformations.
---

## Common traps

1. **Infinity always gets a parenthesis**: $(-\infty, 2]$, never $[-\infty, 2]$.
2. Interval notation lists the **smaller number first**: $(-5, 5]$, not $[5, -5)$.
3. $f^{-1}(x)$ must be a function: $\pm\sqrt{x - 7}$ is not allowed. Restrict the domain and keep one sign.
4. $\sqrt{x^2} = |x|$, not $x$. That is why $g(f(x))$ can fail even when $f(g(x)) = x$.
5. A factor that **cancels** in a rational function is a **hole**, not a vertical asymptote. Always factor before you answer.
6. $f^{-1}(x)$ is the inverse, not $\dfrac{1}{f(x)}$.

## Domain and range from a graph

- **Domain**: scan left to right ($x$). **Range**: scan bottom to top ($y$).
- Closed dot $\bullet$ = included = [ ]. Open dot $\circ$ = excluded = ( ). Arrow = keeps going = $\infty$.
- Range can be closed even next to an open dot if another point on the graph reaches that same height.
- Asymptote values are never reached: $y = 2^x - 3$ has range $(-3, \infty)$.
- Join separate pieces with $\cup$: $(-\infty, 1) \cup (1, \infty)$.
- Vertical line test: a vertical line hits the graph twice $\Rightarrow$ not a function.

## Domain from an equation

| You see | Rule | Example |
|---|---|---|
| $\sqrt{\ \ }$ | inside $\ge 0$ | $\sqrt{5 - x}$: $(-\infty, 5]$ |
| fraction | denominator $\ne 0$ | $\dfrac{x + 1}{x^2 - 9}$: $x \ne \pm 3$ |
| $\sqrt{\ \ }$ in a denominator | inside $> 0$ | $\dfrac{1}{\sqrt{x + 1}}$: $(-1, \infty)$ |
| $\log(\ \ )$ | inside $> 0$ | $\log(x - 2)$: $(2, \infty)$ |

## Composition

$(f \circ g)(x) = f(g(x))$: $g$ acts first. Work **inside out**.

- At a number: $f(g(2))$, find $g(2)$ first, then plug that into $f$.
- As an expression: replace every $x$ in $f$ with all of $g(x)$, in brackets.
  $f(x) = 5x$, $g(x) = 2x^3 + 3x^2 + x - 1$: $g(f(x)) = 2(5x)^3 + 3(5x)^2 + 5x - 1 = 250x^3 + 75x^2 + 5x - 1$
- Order matters: usually $f(g(x)) \ne g(f(x))$.

> **Trap:** $(5x)^3 = 125x^3$, not $5x^3$. The power hits the 5 too.

## Inverses

1. Write $y = f(x)$. 2. Swap $x$ and $y$. 3. Solve for $y$. 4. Write $f^{-1}(x) = \dots$

- Check: $f(g(x)) = x$ **and** $g(f(x)) = x$. Both must hold.
- Only one-to-one functions have inverses (horizontal line test). $x^2$ needs $x \ge 0$ first.
- Domain of $f^{-1}$ = range of $f$, and range of $f^{-1}$ = domain of $f$.
- The graph of $f^{-1}$ is $f$ reflected over $y = x$.
- Rational example: $y = \dfrac{2x + 1}{x - 3}$, swap, clear the fraction, collect $y$ terms, factor out $y$: $f^{-1}(x) = \dfrac{3x + 1}{x - 2}$.

## Polynomial graphs

| Degree | Leading coef. $> 0$ | Leading coef. $< 0$ |
|---|---|---|
| even | up on both ends | down on both ends |
| odd | down left, up right | up left, down right |

- Zero with **odd** multiplicity: the graph **crosses**. **Even** multiplicity: it **touches and turns** (bounce).
- A degree $n$ polynomial has at most $n - 1$ turning points.
- Complex roots come in **conjugate pairs** ($3i$ and $-3i$).
- Counting from a graph (class convention): real roots = distinct $x$-intercepts; complex roots = degree minus real roots counted with multiplicity. Worth confirming with Mrs. Yan.
- To sketch from factored form: zeros (cross or bounce), $y$-intercept, end behavior. $(x - 1)^2(x + 3)$: crosses at $-3$, bounces at $1$, $y$-int $(0, 3)$.

## Rational functions

**Factor top and bottom first.** Then:

| Feature | How |
|---|---|
| Hole | factor that cancels; plug its $x$ into the simplified function for $y$ |
| Vertical asymptote | zeros of the denominator **after** cancelling |
| Horizontal asymptote | bottom degree bigger: $y = 0$. Equal: ratio of leading coefficients. Top bigger: none |
| Slant asymptote | top degree exactly one more: divide, keep the quotient |
| $y$-intercept | $f(0)$ |
| $x$-intercepts | zeros of the numerator after cancelling |

Example: $\dfrac{2x^2 + x - 1}{x^2 - 1} = \dfrac{(2x - 1)(x + 1)}{(x - 1)(x + 1)}$: hole at $\left(-1, \tfrac{3}{2}\right)$, VA $x = 1$, HA $y = 2$, $y$-int $(0, 1)$.

> **Trap:** $\dfrac{x + 4}{x^2 + 9x + 20}$ has only ONE vertical asymptote ($x = -5$). The $(x + 4)$ cancels, so $x = -4$ is a hole.

## Parent functions and transformations

$y = a\,f(b(x - h)) + k$

- $h$: right if you see $x - h$, **left** if you see $x + h$ (opposite of the sign).
- $k$: up/down, same sign.
- $a$: vertical stretch ($|a| > 1$) or shrink; $a < 0$ reflects over the $x$-axis.
- $f(-x)$ reflects over the $y$-axis.

Parents to know on sight: $x$, $x^2$, $x^3$, $\sqrt{x}$, $\sqrt[3]{x}$, $|x|$, $\dfrac{1}{x}$, $2^x$, $\log x$.

Example: $y = -(x + 2)^2 + 3$ opens down, vertex $(-2, 3)$, range $(-\infty, 3]$.
