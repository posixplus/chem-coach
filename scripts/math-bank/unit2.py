"""Unit 2: Functions (domain/range, composition, inverses, polynomial behavior, rational functions, transformations)."""
import sympy as sp
from common import q, sketch, check, S, same, x, win, fn_graph

INF = sp.oo

# ---------------------------------------------------------------- domain & range
T = "m2-domain-range"
DR_HINT = "Domain: read left to right along $x$. Range: read bottom to top along $y$. Closed dot = [ ], open dot = ( ), arrow = keeps going."

def dr(graph, dom, rng, dtex, rtex, ddiff=2, rdiff=2, expl_d="", expl_r="", wrong_d=None, wrong_r=None):
    q(T, "State the **domain** of the function graphed below in interval notation.", dom, kind="interval", tex=dtex, graph=graph, diff=ddiff,
      wrong=wrong_d, hint=DR_HINT, expl=expl_d)
    q(T, "State the **range** of the function graphed below in interval notation.", rng, kind="interval", tex=rtex, graph=graph, diff=rdiff,
      wrong=wrong_r, hint=DR_HINT, expl=expl_r)

# G1: segment from (-3, 5) closed to (5, -5) open
g1 = win(-6, 6, curves=[{"points": [[-3, 5], [5, -5]]}], dots=[{"x": -3, "y": 5}, {"x": 5, "y": -5, "open": True}])
dr(g1, "[-3, 5)", "(-5, 5]", "[-3, 5)", "(-5, 5]",
   expl_d="Starts at $x = -3$ (closed, included) and ends at $x = 5$ (open, not included): $[-3, 5)$.",
   expl_r="Lowest $y$ is $-5$ (open), highest is $5$ (closed): $(-5, 5]$. The smaller number always goes first.",
   wrong_d=["[-3, 5]", "(-3, 5)"], wrong_r=["[5, -5)", "[-5, 5]"])
# G2: y = x^2 - 3 on (-2, 2]
g2 = win(-6, 6, curves=[{"fn": "x^2 - 3", "from": -2, "to": 2}], dots=[{"x": -2, "y": 1, "open": True}, {"x": 2, "y": 1}])
dr(g2, "(-2, 2]", "[-3, 1]", "(-2, 2]", "[-3, 1]", rdiff=3,
   expl_d="Open at $x = -2$, closed at $x = 2$: $(-2, 2]$.",
   expl_r="The bottom of the curve is $y = -3$ (a point on the graph, so included). The top is $y = 1$: the open dot at $x = -2$ does not matter, because the closed dot at $x = 2$ also reaches $y = 1$. So $[-3, 1]$.",
   wrong_r=["[-3, 1)", "(-3, 1]"])
# G3: y = -x^2 + 1 on [-2, 2]
g3 = win(-6, 6, curves=[{"fn": "-x^2 + 1", "from": -2, "to": 2}], dots=[{"x": -2, "y": -3}, {"x": 2, "y": -3}])
dr(g3, "[-2, 2]", "[-3, 1]", "[-2, 2]", "[-3, 1]", ddiff=1,
   expl_d="Closed dots at $x = -2$ and $x = 2$: $[-2, 2]$.", expl_r="From the endpoints at $y = -3$ up to the vertex at $y = 1$: $[-3, 1]$.")
# G4: segment open (-1, 4) to open (3, -4)
g4 = win(-6, 6, curves=[{"points": [[-1, 4], [3, -4]]}], dots=[{"x": -1, "y": 4, "open": True}, {"x": 3, "y": -4, "open": True}])
dr(g4, "(-1, 3)", "(-4, 4)", "(-1, 3)", "(-4, 4)", ddiff=1, rdiff=1,
   expl_d="Both ends open: $(-1, 3)$.", expl_r="Both ends open: $(-4, 4)$.")
# G5: y = sqrt(x + 4) starting closed at (-4, 0), arrow right
g5 = win(-6, 6, curves=[{"fn": "sqrt(x + 4)", "from": -4, "to": 6, "arrows": "end"}], dots=[{"x": -4, "y": 0}])
dr(g5, "[-4, inf)", "[0, inf)", "[-4, \\infty)", "[0, \\infty)",
   expl_d="Starts at $x = -4$ (closed) and the arrow keeps going right: $[-4, \\infty)$.",
   expl_r="Starts at $y = 0$ and rises forever: $[0, \\infty)$.", wrong_d=["[-4, inf]", "(-4, inf)"])
# G6: line with arrows both ways
g6 = win(-6, 6, curves=[{"fn": "x/2 + 1", "arrows": "both"}])
dr(g6, "(-inf, inf)", "(-inf, inf)", "(-\\infty, \\infty)", "(-\\infty, \\infty)", ddiff=1, rdiff=1,
   expl_d="Arrows both ways: every $x$ is used.", expl_r="A non-horizontal line reaches every $y$: $(-\\infty, \\infty)$.")
# G7: arrow down-left to peak (0, 2) then down to closed (3, -1)
g7 = win(-6, 6, curves=[{"points": [[-5, -3], [0, 2], [3, -1]], "arrows": "start"}], dots=[{"x": 3, "y": -1}])
dr(g7, "(-inf, 3]", "(-inf, 2]", "(-\\infty, 3]", "(-\\infty, 2]",
   expl_d="The arrow on the left keeps going forever; the right end stops at $x = 3$ (closed): $(-\\infty, 3]$.",
   expl_r="The highest point is the peak $y = 2$; the arrow goes down forever: $(-\\infty, 2]$.",
   wrong_d=["[-inf, 3]", "[-5, 3]"], wrong_r=["[-inf, 2]", "[-3, 2]"])
# G8: y = 2^x - 3 with horizontal asymptote y = -3
g8 = win(-6, 6, curves=[{"fn": "2^x - 3", "arrows": "both"}], asymptotes=[{"y": -3}])
dr(g8, "(-inf, inf)", "(-3, inf)", "(-\\infty, \\infty)", "(-3, \\infty)", rdiff=3,
   expl_d="Arrows both ways: all real numbers.",
   expl_r="The curve gets close to $y = -3$ (dashed asymptote) but never touches it, so $-3$ is excluded: $(-3, \\infty)$.",
   wrong_r=["[-3, inf)"])

vl = {
    "A": win(-6, 6, curves=[{"fn": "x^2 - 4", "arrows": "both"}]),
    "B": win(-6, 6, curves=[{"fn": "sqrt(x + 2)", "from": -2, "arrows": "end"}, {"fn": "-sqrt(x + 2)", "from": -2, "arrows": "end"}]),
    "C": win(-6, 6, curves=[{"fn": "-x + 1", "arrows": "both"}]),
    "D": win(-6, 6, curves=[{"fn": "x^3/4 - x", "arrows": "both"}]),
}
q(T, "Which graph is **not** a function?", "B", qtype="mcq", choices=["A", "B", "C", "D"], diff=1, extra_meta={"choice_graphs": vl},
  hint="Vertical line test: can one vertical line hit the graph twice?",
  expl="In graph B a vertical line (for example $x = 2$) crosses the curve twice, so one input has two outputs. That is a relation, not a function.")

def dom_eq(fx, ans, tex, diff, hint, expl, wrong=None, which="domain"):
    q(T, f"Find the {which} of ${fx}$. Use interval notation.", ans, kind="interval", tex=tex, diff=diff, hint=hint, expl=expl, wrong=wrong)

check(sp.calculus.util.continuous_domain(sp.sqrt(x - 3), x, sp.S.Reals) == sp.Interval(3, INF), "dom1")
dom_eq("f(x) = \\sqrt{x - 3}", "[3, inf)", "[3, \\infty)", 1, "What goes under a square root cannot be negative.", "$x - 3 \\ge 0 \\Rightarrow x \\ge 3$: $[3, \\infty)$.", wrong=["(3, inf)", "[-3, inf)"])
check(sp.calculus.util.continuous_domain(1 / (x + 2), x, sp.S.Reals) == sp.Union(sp.Interval.open(-INF, -2), sp.Interval.open(-2, INF)), "dom2")
dom_eq("f(x) = \\dfrac{1}{x + 2}", "(-inf, -2) U (-2, inf)", "(-\\infty, -2) \\cup (-2, \\infty)", 2, "A denominator cannot be zero.",
       "$x + 2 \\ne 0 \\Rightarrow x \\ne -2$: $(-\\infty, -2) \\cup (-2, \\infty)$.", wrong=["(-inf, inf)", "(-2, inf)"])
check(sp.calculus.util.continuous_domain(sp.sqrt(5 - x), x, sp.S.Reals) == sp.Interval(-INF, 5), "dom3")
dom_eq("f(x) = \\sqrt{5 - x}", "(-inf, 5]", "(-\\infty, 5]", 2, "Solve $5 - x \\ge 0$. Careful when you divide by a negative.", "$5 - x \\ge 0 \\Rightarrow x \\le 5$: $(-\\infty, 5]$.", wrong=["[5, inf)", "(-inf, 5)"])
check(sp.calculus.util.continuous_domain((x + 1) / (x**2 - 9), x, sp.S.Reals) == sp.Union(sp.Interval.open(-INF, -3), sp.Interval.open(-3, 3), sp.Interval.open(3, INF)), "dom4")
dom_eq("f(x) = \\dfrac{x + 1}{x^2 - 9}", "(-inf, -3) U (-3, 3) U (3, inf)", "(-\\infty, -3) \\cup (-3, 3) \\cup (3, \\infty)", 3,
       "Factor the denominator and exclude every value that makes it zero.", "$x^2 - 9 = (x - 3)(x + 3)$, so $x \\ne \\pm 3$.", wrong=["(-inf, 3) U (3, inf)"])
check(sp.calculus.util.continuous_domain(1 / sp.sqrt(x + 1), x, sp.S.Reals) == sp.Interval.open(-1, INF), "dom5")
dom_eq("f(x) = \\dfrac{1}{\\sqrt{x + 1}}", "(-1, inf)", "(-1, \\infty)", 3, "Two rules at once: not negative under the root, and not zero in the denominator.",
       "$x + 1 > 0$ (strictly, because $\\sqrt{0} = 0$ in the denominator is not allowed): $(-1, \\infty)$.", wrong=["[-1, inf)"])
check(sp.calculus.util.function_range(x**2 + 4, x, sp.S.Reals) == sp.Interval(4, INF), "rng1")
dom_eq("f(x) = x^2 + 4", "[4, inf)", "[4, \\infty)", 2, "The smallest value of $x^2$ is 0.", "$x^2 \\ge 0$, so $x^2 + 4 \\ge 4$: $[4, \\infty)$.", which="range", wrong=["(4, inf)", "(-inf, inf)"])
check(sp.calculus.util.function_range(-sp.Abs(x) + 3, x, sp.S.Reals) == sp.Interval(-INF, 3), "rng2")
dom_eq("f(x) = -|x| + 3", "(-inf, 3]", "(-\\infty, 3]", 2, "$-|x|$ is never positive.", "$-|x| \\le 0$, so $f(x) \\le 3$: $(-\\infty, 3]$.", which="range", wrong=["[3, inf)"])

# ---------------------------------------------------------------- composition
T = "m2-composition"
f = -3 * x**3
g = x**2 - 5
check(f.subs(x, g.subs(x, 2)) == 3, "fg2")
q(T, "Given $f(x) = -3x^3$ and $g(x) = x^2 - 5$, find $f(g(2))$.", "3", tex="3", diff=1, wrong=["-3", "571", "-24"],
  hint="Inside first: find $g(2)$, then put that into $f$.", expl="$g(2) = 4 - 5 = -1$. $f(-1) = -3(-1)^3 = -3(-1) = 3$.")
check(g.subs(x, f.subs(x, 2)) == 571, "gf2")
q(T, "Given $f(x) = -3x^3$ and $g(x) = x^2 - 5$, find $[g \\circ f](2)$.", "571", tex="571", diff=2, wrong=["3", "-571"],
  hint="$[g \\circ f](2) = g(f(2))$: $f$ first.", expl="$f(2) = -3(8) = -24$. $g(-24) = 576 - 5 = 571$.")
f = x / 2 - 4; g = 4 * x + 24
check(sp.expand(f.subs(x, g)) == 2 * x + 8 and sp.expand(g.subs(x, f)) == 2 * x + 8, "fg3")
q(T, "Given $f(x) = \\tfrac{1}{2}x - 4$ and $g(x) = 4x + 24$, find $[f \\circ g](x)$.", "2x + 8", kind="expr", tex="2x + 8", diff=2, wrong=["2x+20", "2x-8"],
  hint="Replace every $x$ in $f$ with the whole expression $4x + 24$.", expl="$\\tfrac{1}{2}(4x + 24) - 4 = 2x + 12 - 4 = 2x + 8$.")
q(T, "Given $f(x) = \\tfrac{1}{2}x - 4$ and $g(x) = 4x + 24$, find $[g \\circ f](x)$.", "2x + 8", kind="expr", tex="2x + 8", diff=2, wrong=["2x-16", "2x+24"],
  hint="Replace every $x$ in $g$ with $\\tfrac{1}{2}x - 4$.", expl="$4\\left(\\tfrac{1}{2}x - 4\\right) + 24 = 2x - 16 + 24 = 2x + 8$. (Here both orders happen to match; usually they do not.)")
f = 5 * x; g = 2 * x**3 + 3 * x**2 + x - 1
check(sp.expand(f.subs(x, g)) == 10*x**3 + 15*x**2 + 5*x - 5, "fg4")
q(T, "Given $f(x) = 5x$ and $g(x) = 2x^3 + 3x^2 + x - 1$, find $[f \\circ g](x)$.", "10x^3 + 15x^2 + 5x - 5", kind="expr", tex="10x^3 + 15x^2 + 5x - 5", diff=2,
  wrong=["250x^3+75x^2+5x-1", "10x^3+15x^2+5x-1"], hint="$f$ multiplies its input by 5. The input is all of $g(x)$.",
  expl="$5(2x^3 + 3x^2 + x - 1) = 10x^3 + 15x^2 + 5x - 5$. Distribute to every term, including the $-1$.")
check(sp.expand(g.subs(x, f)) == 250*x**3 + 75*x**2 + 5*x - 1, "gf4")
q(T, "Given $f(x) = 5x$ and $g(x) = 2x^3 + 3x^2 + x - 1$, find $[g \\circ f](x)$.", "250x^3 + 75x^2 + 5x - 1", kind="expr", tex="250x^3 + 75x^2 + 5x - 1", diff=3,
  wrong=["10x^3+15x^2+5x-5", "10x^3+15x^2+5x-1"], hint="Replace every $x$ in $g$ with $5x$, and raise the whole $5x$ to each power.",
  expl="$2(5x)^3 + 3(5x)^2 + 5x - 1 = 2(125x^3) + 3(25x^2) + 5x - 1 = 250x^3 + 75x^2 + 5x - 1$.")
f = x**2 + 1; g = x - 3
check(sp.expand(f.subs(x, g)) == x**2 - 6*x + 10, "fg5")
q(T, "Given $f(x) = x^2 + 1$ and $g(x) = x - 3$, find $f(g(x))$.", "x^2 - 6x + 10", kind="expr", tex="x^2 - 6x + 10", diff=2, wrong=["x^2-2", "x^2+10", "x^2-8"],
  hint="$(x - 3)^2$ is not $x^2 - 9$. FOIL it.", expl="$(x - 3)^2 + 1 = x^2 - 6x + 9 + 1 = x^2 - 6x + 10$.")
check(sp.expand(g.subs(x, f)) == x**2 - 2, "gf5")
q(T, "Given $f(x) = x^2 + 1$ and $g(x) = x - 3$, find $g(f(x))$.", "x^2 - 2", kind="expr", tex="x^2 - 2", diff=1, wrong=["x^2-6x+10"],
  hint="$g$ subtracts 3 from its input.", expl="$g(x^2 + 1) = x^2 + 1 - 3 = x^2 - 2$.")
q(T, "If $f(x) = 2x + 1$, find $f(f(3))$.", "15", tex="15", diff=1, wrong=["7", "49"], hint="Find $f(3)$ first, then apply $f$ again.",
  expl="$f(3) = 7$, then $f(7) = 15$.")
q(T, "Let $f(x) = \\sqrt{x}$ and $g(x) = x + 4$. Find the domain of $f(g(x))$.", "[-4, inf)", kind="interval", tex="[-4, \\infty)", diff=3, wrong=["[0, inf)", "(-4, inf)"],
  hint="Write $f(g(x))$ first, then ask what goes under the root.", expl="$f(g(x)) = \\sqrt{x + 4}$, which needs $x + 4 \\ge 0$: $[-4, \\infty)$.")
q(T, "Let $f(x) = \\dfrac{1}{x}$ and $g(x) = x - 2$. Find $(f \\circ g)(x)$.", "1/(x - 2)", kind="expr", tex="\\dfrac{1}{x - 2}", diff=2, wrong=["1/x - 2"],
  hint="Put all of $g(x)$ in the denominator.", expl="$f(g(x)) = \\dfrac{1}{x - 2}$. Brackets matter: $1/x - 2$ is a different function.")
q(T, "$h(x) = (x + 1)^2$ can be written as $h(x) = f(g(x))$ with $g(x) = x + 1$. What is $f(x)$?", "x^2", kind="expr", tex="x^2", diff=2, wrong=["(x+1)^2", "x+1"],
  hint="$g$ is the inside job. What does the outside do to it?", expl="$g$ adds 1, then the result is squared. So $f(x) = x^2$.")
f = 3 * x - 2; g = x**2
check(g.subs(x, f.subs(x, -1)) == 25 and f.subs(x, g.subs(x, -1)) == 1, "fg6")
q(T, "Let $f(x) = 3x - 2$ and $g(x) = x^2$. Find $g(f(-1))$.", "25", tex="25", diff=1, wrong=["1", "-25", "5"],
  hint="$f(-1)$ first.", expl="$f(-1) = -5$, and $g(-5) = 25$.")
q(T, "Let $f(x) = 3x - 2$ and $g(x) = x^2$. Find $f(g(-1))$.", "1", tex="1", diff=1, wrong=["25", "-5"],
  hint="$g(-1)$ first.", expl="$g(-1) = 1$, and $f(1) = 1$.")
q(T, "What does $(f \\circ g)(x)$ mean?", "$f(g(x))$", qtype="mcq", choices=["$f(g(x))$", "$g(f(x))$", "$f(x) \\cdot g(x)$", "$f(x) + g(x)$"], diff=1,
  hint="Read the circle as 'of'.", expl="$(f \\circ g)(x) = f(g(x))$: $g$ acts first, then $f$.")

# ---------------------------------------------------------------- inverses
T = "m2-inverses"
q(T, "Are $f(x) = 3x^2 - 11$ and $g(x) = \\sqrt{\\dfrac{x + 11}{3}}$ inverses?", "Only if f's domain is restricted to x ≥ 0", qtype="mcq",
  choices=["Only if f's domain is restricted to x ≥ 0", "Yes, because f(g(x)) = x", "No, never", "Yes, because g(f(x)) = x"], diff=3,
  hint="Check BOTH compositions. What is $\\sqrt{x^2}$?",
  expl="$f(g(x)) = x$, but $g(f(x)) = \\sqrt{x^2} = |x|$, which is not $x$ for negative $x$. They are inverses only when $f$ is restricted to $x \\ge 0$.")
check(sp.simplify(sp.sqrt(x - 7)**2 + 7 - x) == 0, "inv1")
q(T, "Let $f(x) = x^2 + 7$ with domain $x \\ge 0$. Find $f^{-1}(x)$.", "sqrt(x - 7)", kind="expr", tex="\\sqrt{x - 7}", domain=[7, 20], diff=2,
  wrong=["±√(x-7)", "sqrt(x) - 7", "sqrt(x+7)", "-sqrt(x-7)"],
  hint="Swap $x$ and $y$, solve for $y$. Which sign fits $x \\ge 0$?",
  expl="$x = y^2 + 7 \\Rightarrow y^2 = x - 7 \\Rightarrow y = \\sqrt{x - 7}$. Only the positive root, because the original outputs came from $x \\ge 0$.")
check(all(abs(float(sp.real_root(sp.Rational((5 * v**3 + 2) - 2, 5), 3)) - v) < 1e-12 for v in [-3, -1, 0, 2, 5]), "inv2")
q(T, "Find $f^{-1}(x)$ for $f(x) = \\sqrt[3]{\\dfrac{x - 2}{5}}$.", "5x^3 + 2", kind="expr", tex="5x^3 + 2", diff=2, wrong=["5x^3 - 2", "(x^3+2)/5"],
  hint="Swap, then undo the cube root by cubing both sides.", expl="$x = \\sqrt[3]{\\tfrac{y - 2}{5}} \\Rightarrow x^3 = \\tfrac{y - 2}{5} \\Rightarrow 5x^3 = y - 2 \\Rightarrow y = 5x^3 + 2$.")
q(T, "Find $f^{-1}(x)$ for $f(x) = 2x - 6$.", "(x + 6)/2", kind="expr", tex="\\dfrac{x + 6}{2}", diff=1, wrong=["(x-6)/2", "x/2 + 6", "1/(2x-6)"],
  hint="Undo in reverse order: add 6, then divide by 2.", expl="$x = 2y - 6 \\Rightarrow x + 6 = 2y \\Rightarrow y = \\dfrac{x + 6}{2}$. Note: $f^{-1}$ is not $\\dfrac{1}{f}$.")
q(T, "Find $f^{-1}(x)$ for $f(x) = \\dfrac{x + 4}{3}$.", "3x - 4", kind="expr", tex="3x - 4", diff=1, wrong=["3x + 4", "3/(x+4)"],
  hint="Swap, multiply by 3, subtract 4.", expl="$x = \\tfrac{y + 4}{3} \\Rightarrow 3x = y + 4 \\Rightarrow y = 3x - 4$.")
q(T, "Find $f^{-1}(x)$ for $f(x) = x^3 + 1$.", "cbrt(x - 1)", kind="expr", tex="\\sqrt[3]{x - 1}", diff=2, wrong=["cbrt(x) - 1", "cbrt(x+1)"], domain=[1.5, 20],
  hint="Swap, subtract 1, then cube root.", expl="$x = y^3 + 1 \\Rightarrow y^3 = x - 1 \\Rightarrow y = \\sqrt[3]{x - 1}$.")
fi = 2 / x + 1
check(sp.simplify((2 / (x - 1)).subs(x, fi) - x) == 0, "inv 2/(x-1)")
q(T, "Find $f^{-1}(x)$ for $f(x) = \\dfrac{2}{x - 1}$.", "2/x + 1", kind="expr", tex="\\dfrac{2}{x} + 1", diff=3, wrong=["2/(x+1)", "(x-1)/2"],
  hint="After swapping, multiply both sides by $(y - 1)$.", expl="$x = \\tfrac{2}{y - 1} \\Rightarrow x(y - 1) = 2 \\Rightarrow y - 1 = \\tfrac{2}{x} \\Rightarrow y = \\tfrac{2}{x} + 1$.")
fi = (3 * x + 1) / (x - 2)
check(sp.simplify(((2 * x + 1) / (x - 3)).subs(x, fi) - x) == 0, "inv rational")
q(T, "Find $f^{-1}(x)$ for $f(x) = \\dfrac{2x + 1}{x - 3}$.", "(3x + 1)/(x - 2)", kind="expr", tex="\\dfrac{3x + 1}{x - 2}", diff=4, wrong=["(x-3)/(2x+1)", "(3x-1)/(x+2)"],
  hint="Swap, clear the fraction, then collect every $y$ term on one side and factor out $y$.",
  expl="$x(y - 3) = 2y + 1 \\Rightarrow xy - 3x = 2y + 1 \\Rightarrow xy - 2y = 3x + 1 \\Rightarrow y(x - 2) = 3x + 1 \\Rightarrow y = \\dfrac{3x + 1}{x - 2}$.")
q(T, "Let $f(x) = \\sqrt{x + 3}$. What is the domain of $f^{-1}$?", "[0, inf)", kind="interval", tex="[0, \\infty)", diff=3, wrong=["[-3, inf)", "(-inf, inf)"],
  hint="The domain of $f^{-1}$ is the range of $f$.", expl="$f$ only outputs $y \\ge 0$, so $f^{-1}(x) = x^2 - 3$ is restricted to $[0, \\infty)$.")
q(T, "If $f(3) = 8$, what is $f^{-1}(8)$?", "3", tex="3", diff=1, wrong=["8", "1/8"], hint="An inverse swaps inputs and outputs.",
  expl="$f$ sends $3 \\to 8$, so $f^{-1}$ sends $8 \\to 3$.")
q(T, "The graph of $f^{-1}$ is the reflection of the graph of $f$ over which line?", "$y = x$", qtype="mcq", choices=["$y = x$", "the $x$-axis", "the $y$-axis", "$y = -x$"], diff=1,
  hint="Swapping $x$ and $y$ is a reflection.", expl="Every point $(a, b)$ becomes $(b, a)$: that is a reflection over $y = x$.")
q(T, "Which function has an inverse that is also a function (with no domain restriction)?", "$f(x) = x^3$", qtype="mcq",
  choices=["$f(x) = x^3$", "$f(x) = x^2$", "$f(x) = |x|$", "$f(x) = x^4 - 1$"], diff=2,
  hint="Horizontal line test: does any horizontal line hit the graph twice?",
  expl="$x^3$ is one-to-one (passes the horizontal line test). $x^2$, $|x|$ and $x^4 - 1$ give the same output for $x$ and $-x$.")
check(sp.simplify((4 * x - 1).subs(x, (x + 1) / 4) - x) == 0, "verify")
q(T, "Let $f(x) = 4x - 1$ and $g(x) = \\dfrac{x + 1}{4}$. Simplify $f(g(x))$.", "x", kind="expr", tex="x", diff=1, wrong=["x+1", "4x"],
  hint="Replace $x$ in $f$ with $\\tfrac{x + 1}{4}$.", expl="$4 \\cdot \\tfrac{x + 1}{4} - 1 = x + 1 - 1 = x$. Getting exactly $x$ (both ways) proves they are inverses.")

# ---------------------------------------------------------------- polynomials
T = "m2-polynomials"
PCONV = "Count real roots as distinct $x$-intercepts; complex roots = degree minus real roots counted with multiplicity."
def pgraph(expr, lo=-5, hi=5):
    return fn_graph(expr, lo, hi)

def poly_mcq(expr_s, ans, choices, expl, diff=2):
    p = sp.Poly(S(expr_s), x)
    deg = p.degree()
    lc = p.LC()
    real = sorted(set(r for r in sp.roots(p, x).keys() if r.is_real))
    mult_real = sum(m for r, m in sp.roots(p, x).items() if r.is_real)
    exp = f"{deg}, {'+' if lc > 0 else '−'}, {len(real)}, {deg - mult_real}"
    check(exp == ans, f"poly {expr_s}: {exp} vs {ans}")
    q(T, "For the graph below, give: least possible degree, sign of the leading coefficient, number of real roots, number of complex (non-real) roots.",
      ans, qtype="mcq", choices=choices, graph=pgraph(expr_s), diff=diff,
      hint="Ends tell you degree parity and sign. Crossing = odd multiplicity, bounce = even. " + PCONV, expl=expl)

poly_mcq("(x+2)^2*(x-3)/4", "3, +, 2, 0", ["3, +, 2, 0", "3, −, 2, 0", "4, +, 2, 2", "2, +, 2, 0"],
         "Falls left, rises right: odd degree, positive. It bounces at $x = -2$ (double root) and crosses at $x = 3$: 2 real roots, multiplicities 2 + 1 = 3 = degree, so 0 complex.")
poly_mcq("-(x-2)*(x^2+2*x+3)/3", "3, −, 1, 2", ["3, −, 1, 2", "3, +, 1, 2", "3, −, 3, 0", "4, −, 1, 3"],
         "Rises left, falls right: odd degree, negative. Crosses once, so 1 real root; the other 2 roots of a cubic are a complex pair.")
poly_mcq("(x+1)*(x-2)*(x^2+1)/2", "4, +, 2, 2", ["4, +, 2, 2", "2, +, 2, 0", "4, −, 2, 2", "4, +, 4, 0"],
         "Both ends up: even degree, positive. Two crossings, but the extra turn means degree at least 4: 2 real + a complex pair.")
poly_mcq("-(x+2)^2*(x-2)^2/4", "4, −, 2, 0", ["4, −, 2, 0", "4, +, 2, 0", "2, −, 2, 0", "4, −, 4, 0"],
         "Both ends down: even degree, negative. Touches at $x = -2$ and $x = 2$ (double roots): 2 real roots, $2 + 2 = 4$, so 0 complex.")
poly_mcq("x^2*(x^2-9)^2/50+1", "6, +, 0, 6", ["6, +, 0, 6", "2, +, 0, 2", "6, −, 0, 6", "4, +, 0, 4"], diff=3,
         expl="Both ends up, never touches the $x$-axis: 0 real roots. Three valleys and two peaks is 5 turning points, so the degree is at least 6, and all 6 roots are complex.")
poly_mcq("-(x+3)*(x+1)*(x-1)*(x-2)*(x-3)/6", "5, −, 5, 0", ["5, −, 5, 0", "5, +, 5, 0", "4, −, 5, 1", "5, −, 3, 2"],
         "Rises left, falls right: odd, negative. Five crossings: 5 real roots and degree 5, so 0 complex.")

q(T, "Describe the end behavior of $f(x) = -2x^5 + x^2$.", "Rises on the left, falls on the right", qtype="mcq",
  choices=["Rises on the left, falls on the right", "Falls on the left, rises on the right", "Rises on both ends", "Falls on both ends"], diff=2,
  hint="Only the leading term $-2x^5$ matters: odd degree, negative coefficient.",
  expl="Odd degree means the ends go opposite ways. Negative leading coefficient: as $x \\to \\infty$, $f \\to -\\infty$, and as $x \\to -\\infty$, $f \\to \\infty$.")
check(set(sp.solve((x - 1)**2 * (x + 3), x)) == {1, -3}, "zeros")
q(T, "Find the zeros of $f(x) = (x - 1)^2(x + 3)$.", "1, -3", kind="set", tex="x = 1,\\ x = -3", diff=1, wrong=["-1, 3", "1"],
  hint="Set each factor to zero.", expl="$x - 1 = 0 \\Rightarrow x = 1$ (double), $x + 3 = 0 \\Rightarrow x = -3$.")
check(((x - 1)**2 * (x + 3)).subs(x, 0) == 3, "yint")
q(T, "Find the $y$-intercept of $f(x) = (x - 1)^2(x + 3)$.", "(0, 3)", kind="point", tex="(0, 3)", diff=1, wrong=["(0, -3)", "(3, 0)"],
  hint="Plug in $x = 0$.", expl="$f(0) = (-1)^2(3) = 3$, so $(0, 3)$.")
q(T, "At $x = 1$, what does the graph of $f(x) = (x - 1)^2(x + 3)$ do?", "Touches the x-axis and turns around", qtype="mcq",
  choices=["Touches the x-axis and turns around", "Crosses the x-axis", "Has a vertical asymptote", "Flattens and crosses"], diff=2,
  hint="Look at the multiplicity of the factor $(x - 1)$.", expl="Even multiplicity (2) means the graph bounces off the axis at $x = 1$.")
check(set(sp.solve(x**3 + x**2 + x + 1, x)) == {-1} and set(sp.roots(x**3 + x**2 + x + 1, x)) == {-1, sp.I, -sp.I}, "cubic")
q(T, "Find all **real** zeros of $f(x) = x^3 + x^2 + x + 1$.", "-1", kind="set", tex="x = -1", diff=3, wrong=["-1, 1", "1"],
  hint="Factor by grouping: $x^2(x + 1) + 1(x + 1)$.", expl="$(x + 1)(x^2 + 1)$. $x^2 + 1 = 0$ has no real solutions ($x = \\pm i$), so the only real zero is $x = -1$.")
q(T, "A polynomial with real coefficients has degree 5 and zeros $2$ and $3i$. What is the least number of non-real (complex) zeros it must have?", "2", tex="2", diff=2, wrong=["1", "3", "4"],
  hint="Complex zeros of real polynomials come in conjugate pairs.", expl="If $3i$ is a zero, so is $-3i$. That is 2 complex zeros.")
q(T, "What is the maximum number of turning points of a degree 6 polynomial?", "5", tex="5", diff=1, wrong=["6", "7"],
  hint="At most one fewer than the degree.", expl="A degree $n$ polynomial has at most $n - 1$ turning points: $6 - 1 = 5$.")
q(T, "What is the least degree of a polynomial with zeros $-2$ (multiplicity 2) and $3$ (multiplicity 1)?", "3", tex="3", diff=1, wrong=["2", "4"],
  hint="Add the multiplicities.", expl="$(x + 2)^2(x - 3)$ has degree $2 + 1 = 3$.")
sketch(T, "Sketch $f(x) = (x - 1)^2(x + 3)$ by finding the $x$- and $y$-intercepts.", ["y=(x-1)^2(x+3)"],
       ["$x$-intercepts: crosses at $x = -3$, bounces at $x = 1$", "$y$-intercept $(0, 3)$", "Falls on the left, rises on the right (positive cubic)"],
       pgraph("(x-1)^2*(x+3)", -6, 6) | {"ymin": -6, "ymax": 12, "xmin": -6, "xmax": 6},
       "Zeros $-3$ (crosses) and $1$ (double, bounces). $f(0) = 3$. Positive cubic: starts low on the left and ends high on the right.")
sketch(T, "Sketch a possible graph of a **negative** fifth degree polynomial with exactly three positive real roots and two negative real roots.",
       ["y=-(x+3)(x+1)(x-1)(x-2)(x-3)/6"],
       ["Rises on the left, falls on the right", "Crosses the $x$-axis twice left of 0 and three times right of 0", "4 turning points or fewer"],
       pgraph("-(x+3)*(x+1)*(x-1)*(x-2)*(x-3)/6"),
       "One example is $-(x + 3)(x + 1)(x - 1)(x - 2)(x - 3)$. Any graph with those end directions and five crossings (2 negative, 3 positive) is correct.")
sketch(T, "Sketch a possible graph of a **positive** quartic (degree 4) function that has exactly one double root and no other real roots.",
       ["y=(x+3)^2(x^2-2x+3)/5"],
       ["Both ends go up", "Touches the $x$-axis at exactly one point and turns back up", "Never crosses the $x$-axis"],
       pgraph("(x+3)^2*(x^2-2*x+3)/5", -6, 6),
       "One example: $(x + 3)^2(x^2 - 2x + 3)$. The double root is a bounce; the other two roots are a complex pair, so there are no more $x$-intercepts.")

# ---------------------------------------------------------------- rational functions
T = "m2-rational"
RHINT = "Factor top and bottom first. A factor that cancels makes a hole; what is left in the denominator makes vertical asymptotes."

def rat_facts(num, den):
    n, d = S(num), S(den)
    red = sp.cancel(n / d)
    rn, rd = sp.fraction(red)
    va = sorted(set(sp.solve(rd, x)))
    holes = [r for r in sp.solve(d, x) if r not in va]
    deg_n, deg_d = sp.degree(n, x), sp.degree(d, x)
    if deg_n < deg_d:
        ha = 0
    elif deg_n == deg_d:
        ha = sp.LC(sp.Poly(n, x)) / sp.LC(sp.Poly(d, x))
    else:
        ha = None
    yint = red.subs(x, 0)
    return va, holes, ha, yint, red

def setstr(vals):
    return ", ".join(str(v) for v in vals)

def ftex(num_tex, den_tex):
    return f"f(x) = \\dfrac{{{num_tex}}}{{{den_tex}}}"

def rat(num, den, tex, parts, diff=2):
    va, holes, ha, yint, red = rat_facts(num, den)
    for part, ans, extra in parts:
        if part == "va":
            check(setstr(va) == ans or (not va and ans == ""), f"va {num}/{den}: {va}")
            q(T, f"Find all vertical asymptotes of ${tex}$.", ans, kind="set",
              tex=", ".join(f"x = {sp.latex(v)}" for v in va) or "\\text{none}", diff=diff, hint=RHINT,
              expl=extra, wrong=None, placeholder="e.g. x = 2, x = -2 (or none)")
        elif part == "ha":
            want = "" if ha is None else str(ha)
            check(want == ans, f"ha {num}/{den}: {ha}")
            q(T, f"Find the horizontal asymptote of ${tex}$.", ans, kind="set", tex="\\text{none}" if ha is None else f"y = {sp.latex(ha)}", diff=diff,
              hint="Compare degrees: bottom bigger gives $y = 0$; equal gives the ratio of leading coefficients; top bigger gives none.",
              expl=extra, placeholder="e.g. y = 2 (or none)")
        elif part == "yint":
            check(sp.simplify(S(ans.strip("()").split(",")[1]) - yint) == 0, f"yint {num}/{den}: {yint}")
            q(T, f"Find the $y$-intercept of ${tex}$.", ans, kind="point", tex=f"(0, {sp.latex(yint)})", diff=max(1, diff - 1),
              hint="Plug in $x = 0$ (use the simplified form if a factor cancels).", expl=extra)
        elif part == "hole":
            hx = holes[0]
            hy = red.subs(x, hx)
            check(sp.simplify(S(ans.strip("()").split(",")[0]) - hx) == 0 and sp.simplify(S(ans.strip("()").split(",")[1]) - hy) == 0, f"hole {num}/{den}: ({hx},{hy})")
            q(T, f"${tex}$ has a hole. Give its coordinates.", ans, kind="point", tex=f"({sp.latex(hx)}, {sp.latex(hy)})", diff=diff + 1,
              hint="Cancel the common factor, then plug the cancelled $x$-value into what is left.", expl=extra)

rat("-x^2 + x", "x - 1", ftex("-x^2 + x", "x - 1"), [
    ("va", "", "Factor: $\\dfrac{-x(x - 1)}{x - 1} = -x$ for $x \\ne 1$. The $(x - 1)$ cancels, so $x = 1$ is a hole, not an asymptote. No vertical asymptotes."),
    ("hole", "(1, -1)", "$f(x) = -x$ after cancelling, so the hole is at $x = 1$, $y = -1$: $(1, -1)$."),
])
rat("x^2 + 2", "x - 1", ftex("x^2 + 2", "x - 1"), [
    ("va", "1", "$x^2 + 2$ never equals 0, so nothing cancels. The denominator is 0 at $x = 1$."),
    ("ha", "", "Top degree 2 > bottom degree 1, so there is no horizontal asymptote (there is a slant one instead)."),
    ("yint", "(0, -2)", "$f(0) = \\dfrac{2}{-1} = -2$."),
])
check(sp.div(S("x^2 + 2"), S("x - 1"), x)[0] == x + 1, "slant")
q(T, "Find the slant (oblique) asymptote of $f(x) = \\dfrac{x^2 + 2}{x - 1}$.", "y = x + 1", kind="equation", tex="y = x + 1", diff=4, wrong=["y = x", "y = x - 1"],
  hint="Divide the numerator by the denominator (long or synthetic division) and keep the quotient.",
  expl="$x^2 + 2 = (x - 1)(x + 1) + 3$, so $f(x) = x + 1 + \\dfrac{3}{x - 1}$. As $x$ grows, the fraction shrinks to 0: $y = x + 1$.")
rat("2x^2 + x - 1", "x^2 - 1", ftex("2x^2 + x - 1", "x^2 - 1"), [
    ("va", "1", "$\\dfrac{(2x - 1)(x + 1)}{(x - 1)(x + 1)}$. The $(x + 1)$ cancels (hole at $x = -1$), leaving only $x = 1$."),
    ("ha", "2", "Degrees are equal (2 and 2): $y = \\dfrac{2}{1} = 2$."),
    ("yint", "(0, 1)", "$f(0) = \\dfrac{-1}{-1} = 1$."),
    ("hole", "(-1, 3/2)", "Simplified: $\\dfrac{2x - 1}{x - 1}$. At $x = -1$: $\\dfrac{-3}{-2} = \\dfrac{3}{2}$, so the hole is $\\left(-1, \\tfrac{3}{2}\\right)$."),
])
rat("2", "x^2 - 16", ftex("2", "x^2 - 16"), [
    ("va", "-4, 4", "$x^2 - 16 = (x - 4)(x + 4) = 0$ at $x = \\pm 4$."),
    ("yint", "(0, -1/8)", "$f(0) = \\dfrac{2}{-16} = -\\dfrac{1}{8}$."),
])
rat("x + 2", "x - 3", ftex("x + 2", "x - 3"), [
    ("ha", "1", "Equal degrees: ratio of leading coefficients $\\dfrac{1}{1} = 1$."),
    ("yint", "(0, -2/3)", "$f(0) = \\dfrac{2}{-3} = -\\dfrac{2}{3}$."),
])
rat("-x^2 + 2", "x + 2", ftex("-x^2 + 2", "x + 2"), [
    ("va", "-2", "$-x^2 + 2$ is not 0 at $x = -2$, so $x = -2$ is a vertical asymptote."),
    ("ha", "", "Top degree 2 > bottom degree 1: no horizontal asymptote."),
])
rat("x + 4", "x^2 + 9x + 20", ftex("x + 4", "x^2 + 9x + 20"), [
    ("va", "-5", "$\\dfrac{x + 4}{(x + 5)(x + 4)} = \\dfrac{1}{x + 5}$. $x = -4$ cancels (hole). Only $x = -5$ is an asymptote."),
    ("hole", "(-4, 1)", "Simplified $\\dfrac{1}{x + 5}$; at $x = -4$ that is $\\dfrac{1}{1} = 1$: hole at $(-4, 1)$."),
])
rat("x^2 - 4x + 3", "x - 1", ftex("x^2 - 4x + 3", "x - 1"), [
    ("va", "", "$\\dfrac{(x - 3)(x - 1)}{x - 1} = x - 3$ with a hole at $x = 1$. No vertical asymptote."),
    ("yint", "(0, -3)", "$f(0) = \\dfrac{3}{-1} = -3$."),
])
rat("4x + 3", "3x - 5", ftex("4x + 3", "3x - 5"), [
    ("va", "5/3", "$3x - 5 = 0 \\Rightarrow x = \\dfrac{5}{3}$."),
    ("ha", "4/3", "Equal degrees: $y = \\dfrac{4}{3}$."),
])
# fix wrong-answer lists for the classic slips
for qq in __import__("common").QUESTIONS:
    if qq["topic_id"] != T or qq["qtype"] != "math":
        continue
    p = qq["prompt"]
    if "vertical asymptotes" in p and "2x^2 + x - 1" in p:
        qq["wrong"] = ["1, -1", "x = ±1"]
    if "vertical asymptotes" in p and "x + 4}{x^2 + 9x + 20" in p:
        qq["wrong"] = ["-5, -4"]
    if "vertical asymptotes" in p and "-x^2 + x" in p:
        qq["wrong"] = ["1"]
    if "horizontal asymptote" in p and "x^2 + 2}{x - 1" in p:
        qq["wrong"] = ["y = 1", "y = 0"]

q(T, "If the degree of the numerator is greater than the degree of the denominator, the horizontal asymptote is:", "There is none", qtype="mcq",
  choices=["There is none", "$y = 0$", "The ratio of the leading coefficients", "$y = 1$"], diff=1,
  hint="Which part grows faster for huge $x$?", expl="When the top grows faster the function has no horizontal asymptote ($y = 0$ is the case when the bottom is bigger).")
q(T, "Find the $x$-intercept of $f(x) = \\dfrac{x + 2}{x - 3}$.", "(-2, 0)", kind="point", tex="(-2, 0)", diff=1, wrong=["(3, 0)", "(0, -2/3)"],
  hint="A fraction is zero when its numerator is zero (and the denominator is not).", expl="$x + 2 = 0 \\Rightarrow x = -2$: $(-2, 0)$.")
rg = {
    "A": fn_graph("(x+2)/(x-3)", -8, 8, asym=[{"x": 3}, {"y": 1}]),
    "B": fn_graph("(x-2)/(x+3)", -8, 8, asym=[{"x": -3}, {"y": 1}]),
    "C": fn_graph("(3-x)/(x+2)", -8, 8, asym=[{"x": -2}, {"y": -1}]),
    "D": fn_graph("-(x+2)/(x-3)", -8, 8, asym=[{"x": 3}, {"y": -1}]),
}
q(T, "Which graph shows $f(x) = \\dfrac{x + 2}{x - 3}$?", "A", qtype="mcq", choices=["A", "B", "C", "D"], diff=3, extra_meta={"choice_graphs": rg},
  hint="Find the vertical asymptote, the horizontal asymptote and the $y$-intercept, then match.",
  expl="VA $x = 3$, HA $y = 1$, $y$-intercept $\\left(0, -\\tfrac{2}{3}\\right)$, $x$-intercept $(-2, 0)$. Only graph A has all four.")
q(T, "Write a rational function that has a horizontal asymptote at $y = 2$ and a vertical asymptote at $x = -7$.", "f(x) = 2x/(x + 7)", kind="text", diff=3,
  hint="Put $(x + 7)$ in the denominator. For HA $y = 2$, make the degrees equal with leading coefficients in a 2 : 1 ratio.",
  expl="One answer: $f(x) = \\dfrac{2x}{x + 7}$. Any $\\dfrac{2x + b}{x + 7}$ works as long as the top is not zero at $x = -7$ (so it does not cancel into a hole).")
sketch(T, "Sketch $f(x) = \\dfrac{2x^2 + x - 1}{x^2 - 1}$. Show asymptotes, intercepts and any hole.", ["y=\\frac{2x^2+x-1}{x^2-1}", "x=1", "y=2", "(-1,1.5)"],
       ["Vertical asymptote $x = 1$", "Horizontal asymptote $y = 2$", "Hole (open circle) at $\\left(-1, \\tfrac{3}{2}\\right)$, NOT an asymptote",
        "$y$-intercept $(0, 1)$ and $x$-intercept $\\left(\\tfrac{1}{2}, 0\\right)$"],
       fn_graph("(2x-1)/(x-1)", -6, 6, asym=[{"x": 1}, {"y": 2}], dots=[{"x": -1, "y": 1.5, "open": True}]),
       "Simplifies to $\\dfrac{2x - 1}{x - 1}$ with a hole at $x = -1$. VA $x = 1$, HA $y = 2$, $y$-intercept $1$, $x$-intercept $\\tfrac{1}{2}$.")

# ---------------------------------------------------------------- transformations (Family of Functions)
T = "m2-transformations"
q(T, "Describe how $y = (x - 3)^2 + 2$ is transformed from $y = x^2$.", "Right 3, up 2", qtype="mcq",
  choices=["Right 3, up 2", "Left 3, up 2", "Right 3, down 2", "Left 3, down 2"], diff=1,
  hint="Inside the brackets moves left/right, and it is the opposite of the sign you see.",
  expl="$(x - h)$ shifts right by $h$: right 3. $+2$ outside shifts up 2. Vertex $(3, 2)$.")
q(T, "Describe how $g(x) = -|x + 1| - 4$ is transformed from $f(x) = |x|$.", "Reflect over the x-axis, left 1, down 4", qtype="mcq",
  choices=["Reflect over the x-axis, left 1, down 4", "Reflect over the y-axis, right 1, down 4", "Reflect over the x-axis, right 1, up 4", "Left 1, down 4 (no reflection)"], diff=2,
  hint="A minus sign in front of the whole function flips it upside down.", expl="$-$ outside: reflection over the $x$-axis. $x + 1$: left 1. $-4$: down 4.")
q(T, "Write the equation of $y = \\sqrt{x}$ shifted left 2 and down 5.", "y = sqrt(x + 2) - 5", kind="equation", tex="y = \\sqrt{x + 2} - 5", domain=[-1.5, 12], diff=2,
  wrong=["y = sqrt(x - 2) - 5", "y = sqrt(x + 2) + 5"],
  hint="Left means $+$ inside the root.", expl="Left 2: replace $x$ with $x + 2$. Down 5: subtract 5 outside. $y = \\sqrt{x + 2} - 5$.")
q(T, "What is the parent function of $y = 2(x - 1)^3 + 4$?", "$y = x^3$", qtype="mcq", choices=["$y = x^3$", "$y = x^2$", "$y = |x|$", "$y = \\sqrt[3]{x}$"], diff=1,
  hint="Look at what is done to $x$ before the stretches and shifts.", expl="The core operation is cubing: parent $y = x^3$, stretched by 2, right 1, up 4.")
q(T, "Write the equation of $y = x^2$ stretched vertically by a factor of 3 and then shifted up 1.", "y = 3x^2 + 1", kind="equation", tex="y = 3x^2 + 1", diff=1,
  wrong=["y = (3x)^2 + 1", "y = 3x^2 - 1"], hint="A vertical stretch multiplies the whole function.", expl="$3 \\cdot x^2$, then $+1$: $y = 3x^2 + 1$.")
q(T, "Find the range of $y = \\sqrt{x - 4} + 1$.", "[1, inf)", kind="interval", tex="[1, \\infty)", diff=2, wrong=["[4, inf)", "(1, inf)"],
  hint="A square root starts at 0 and goes up. Where did the start point move?", expl="$\\sqrt{x - 4} \\ge 0$, so $y \\ge 1$: $[1, \\infty)$. (The domain is $[4, \\infty)$.)")
q(T, "Write the equation of $y = 2^x$ reflected over the $y$-axis.", "y = 2^(-x)", kind="equation", tex="y = 2^{-x}", diff=2, wrong=["y = -2^x"],
  hint="Reflecting over the $y$-axis replaces $x$ with $-x$.", expl="$y = 2^{-x}$ (the same as $\\left(\\tfrac{1}{2}\\right)^x$). $-2^x$ would be a reflection over the $x$-axis.")
q(T, "Find the vertex of $g(x) = 2|x - 3|$.", "(3, 0)", kind="point", tex="(3, 0)", diff=1, wrong=["(-3, 0)", "(0, 3)"],
  hint="The vertex of $|x|$ is $(0, 0)$. Which shift is there?", expl="Right 3, no vertical shift: $(3, 0)$. The 2 is a stretch, it does not move the vertex.")
tg = {
    "A": fn_graph("-(x+2)^2 + 3", -8, 8),
    "B": fn_graph("-(x-2)^2 + 3", -8, 8),
    "C": fn_graph("(x+2)^2 + 3", -8, 8),
    "D": fn_graph("-(x+2)^2 - 3", -8, 8),
}
q(T, "Which graph shows $y = -(x + 2)^2 + 3$?", "A", qtype="mcq", choices=["A", "B", "C", "D"], diff=2, extra_meta={"choice_graphs": tg},
  hint="Opens up or down? Where is the vertex?", expl="The minus sign opens it downward; the vertex is $(-2, 3)$. That is graph A.")
check(sp.calculus.util.function_range(-(x + 2)**2 + 3, x, sp.S.Reals) == sp.Interval(-INF, 3), "range t")
q(T, "Find the range of $y = -(x + 2)^2 + 3$.", "(-inf, 3]", kind="interval", tex="(-\\infty, 3]", diff=2, wrong=["[3, inf)", "(-inf, 3)"],
  hint="It opens down, so the vertex is the highest point.", expl="Maximum value $3$ at the vertex $(-2, 3)$: $(-\\infty, 3]$.")
q(T, "Compared with $y = f(x)$, the graph of $y = f(x - 2)$ is shifted:", "right 2", qtype="mcq", choices=["right 2", "left 2", "down 2", "up 2"], diff=2,
  hint="Changes inside the function act on $x$ and go the opposite way.", expl="$f(x - 2)$: right 2. (By contrast $f(x) - 2$ moves down 2.)")
sketch(T, "Sketch $y = -|x - 2| + 3$.", ["y=-\\left|x-2\\right|+3"],
       ["Upside-down V (reflected over the $x$-axis)", "Vertex at $(2, 3)$", "Slopes $1$ and $-1$ on the two sides", "$x$-intercepts $(-1, 0)$ and $(5, 0)$"],
       fn_graph("-abs(x-2)+3", -6, 8),
       "Parent $|x|$, reflected (opens down), right 2, up 3. From the vertex $(2, 3)$ go down 1 for each step left or right.")
